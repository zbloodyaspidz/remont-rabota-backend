import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { uploadFile } from '../config/minio';
import { notificationQueue } from '../jobs/notification.job';
import { logger } from '../config/logger';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['SEARCHING', 'CANCELLED_BY_CLIENT'],
  SEARCHING: ['ACCEPTED', 'CANCELLED_BY_CLIENT'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_MASTER', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED_BY_MASTER', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED_BY_CLIENT: [],
  CANCELLED_BY_MASTER: [],
  DISPUTED: ['COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_MASTER'],
};

export async function createOrder(
  clientId: string,
  data: {
    categoryId: string;
    address: string;
    addressLat?: number;
    addressLng?: number;
    description: string;
    desiredDate: string;
    desiredTime?: string;
    workPrice?: number;
    photos?: Express.Multer.File[];
  }
) {
  const photoUrls = data.photos
    ? await Promise.all(data.photos.map((f) => uploadFile(f.buffer, f.originalname, f.mimetype)))
    : [];

  const settings = await prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  const commission = settings?.orderCommission ?? 250;

  const clientPrice =
    data.workPrice != null ? data.workPrice + commission : undefined;

  const order = await prisma.order.create({
    data: {
      clientId,
      categoryId: data.categoryId,
      address: data.address,
      addressLat: data.addressLat,
      addressLng: data.addressLng,
      description: data.description,
      desiredDate: new Date(data.desiredDate),
      desiredTime: data.desiredTime,
      workPrice: data.workPrice,
      commission: data.workPrice != null ? commission : undefined,
      clientPrice,
      masterPayout: data.workPrice,
      photos: photoUrls,
      status: 'PENDING',
    },
    include: { category: true, client: { select: { id: true, fullName: true, avatar: true } } },
  });

  // Trigger searching after creation
  await startSearching(order.id);
  return order;
}

export async function startSearching(orderId: string) {
  await prisma.order.update({ where: { id: orderId }, data: { status: 'SEARCHING' } });
  // Enqueue job to find masters
  await redis.lpush('order:search', orderId);
}

export async function getOrders(
  userId: string,
  role: 'CLIENT' | 'MASTER' | 'ADMIN',
  filters: { status?: OrderStatus; page?: number; limit?: number }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where =
    role === 'CLIENT'
      ? { clientId: userId, ...(filters.status ? { status: filters.status } : {}) }
      : role === 'MASTER'
        ? { masterId: userId, ...(filters.status ? { status: filters.status } : {}) }
        : filters.status
          ? { status: filters.status }
          : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        category: true,
        client: { select: { id: true, fullName: true, avatar: true } },
        master: { select: { id: true, fullName: true, avatar: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, pages: Math.ceil(total / limit) };
}

export async function getOrderById(orderId: string, userId: string, role: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      category: true,
      client: { select: { id: true, fullName: true, avatar: true, phone: true } },
      master: { select: { id: true, fullName: true, avatar: true, phone: true, masterProfile: true } },
      review: true,
      messages: {
        include: { sender: { select: { id: true, fullName: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
    },
  });
  if (!order) throw new AppError(404, 'Order not found');
  if (role !== 'ADMIN' && order.clientId !== userId && order.masterId !== userId) {
    throw new AppError(403, 'Forbidden');
  }
  return order;
}

export async function acceptOrder(
  orderId: string,
  masterId: string,
  workPrice?: number
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status !== 'SEARCHING') throw new AppError(400, 'Order is not available');

  const master = await prisma.masterProfile.findUnique({ where: { userId: masterId } });
  if (!master || master.verificationStatus !== 'VERIFIED') {
    throw new AppError(403, 'Master not verified');
  }

  const settings = await prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  const commission = order.commission ?? settings?.orderCommission ?? 250;

  const finalWorkPrice = workPrice ?? order.workPrice;
  const finalClientPrice = finalWorkPrice != null ? finalWorkPrice + commission : undefined;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      masterId,
      status: 'ACCEPTED',
      workPrice: finalWorkPrice,
      commission,
      clientPrice: finalClientPrice,
      masterPayout: finalWorkPrice,
    },
    include: { client: true, master: true, category: true },
  });

  await notificationQueue.add('order-accepted', {
    userId: updated.clientId,
    title: 'Мастер принял заказ',
    body: `Мастер ${updated.master?.fullName || ''} принял ваш заказ`,
    data: { orderId, type: 'order-accepted' },
  });

  // Update master stats
  await prisma.masterProfile.update({
    where: { userId: masterId },
    data: { totalOrders: { increment: 1 } },
  });

  return updated;
}

export async function rejectOrder(orderId: string, masterId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status !== 'SEARCHING') throw new AppError(400, 'Order is not in searching state');

  // Track rejection but don't change order status - let algorithm handle it
  await prisma.order.update({
    where: { id: orderId },
    data: {
      notifiedMasterIds: { set: [...(order.notifiedMasterIds || []), masterId] },
    },
  });

  return { message: 'Order rejected' };
}

export async function completeOrder(orderId: string, masterId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.masterId !== masterId) throw new AppError(403, 'Forbidden');
  if (order.status !== 'IN_PROGRESS') throw new AppError(400, 'Order is not in progress');

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  await prisma.masterProfile.update({
    where: { userId: masterId },
    data: { completedOrders: { increment: 1 } },
  });

  await notificationQueue.add('order-completed', {
    userId: order.clientId,
    title: 'Заказ выполнен',
    body: 'Мастер завершил работу. Подтвердите выполнение.',
    data: { orderId, type: 'order-completed' },
  });

  // Auto-confirm after 24h
  await redis.set(`order:autoconfirm:${orderId}`, '1', 'EX', 24 * 3600);

  return updated;
}

export async function cancelOrder(
  orderId: string,
  userId: string,
  role: string,
  reason?: string
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');

  const isClient = order.clientId === userId;
  const isMaster = order.masterId === userId;

  if (!isClient && !isMaster && role !== 'ADMIN') throw new AppError(403, 'Forbidden');

  const newStatus = isClient ? 'CANCELLED_BY_CLIENT' : 'CANCELLED_BY_MASTER';
  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus as OrderStatus)) {
    throw new AppError(400, `Cannot cancel order in status ${order.status}`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  if (isMaster && ['ACCEPTED', 'IN_PROGRESS'].includes(order.status)) {
    await prisma.masterProfile.update({
      where: { userId },
      data: {
        cancelledOrders: { increment: 1 },
        rating: { decrement: 0.2 },
      },
    });
  }

  const notifyUserId = isClient ? order.masterId : order.clientId;
  if (notifyUserId) {
    await notificationQueue.add('order-cancelled', {
      userId: notifyUserId,
      title: 'Заказ отменён',
      body: `Заказ был отменён. Причина: ${reason || 'не указана'}`,
      data: { orderId, type: 'order-cancelled' },
    });
  }

  return updated;
}

export async function getAvailableOrdersForMaster(
  masterId: string,
  filters: { page?: number; limit?: number }
) {
  const master = await prisma.masterProfile.findUnique({ where: { userId: masterId } });
  if (!master) throw new AppError(404, 'Master profile not found');

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    status: OrderStatus.SEARCHING as OrderStatus,
    categoryId: { in: master.specializationIds },
    NOT: { notifiedMasterIds: { has: masterId } },
    masterId: null,
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        category: true,
        client: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, pages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  userId: string,
  role: string
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, 'Order not found');
  if (role !== 'ADMIN' && order.clientId !== userId && order.masterId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new AppError(400, `Cannot transition from ${order.status} to ${newStatus}`);
  }

  return prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
}
