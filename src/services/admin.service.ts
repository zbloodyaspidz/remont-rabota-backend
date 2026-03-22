import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';

export async function listUsers(filters: {
  role?: string;
  isBlocked?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.role) where.role = filters.role;
  if (filters.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        masterProfile: { select: { verificationStatus: true, rating: true, totalOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pages: Math.ceil(total / limit) };
}

export async function blockUser(userId: string, adminId: string) {
  void adminId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  return prisma.user.update({ where: { id: userId }, data: { isBlocked: !user.isBlocked } });
}

export async function verifyMaster(userId: string, status: 'VERIFIED' | 'REJECTED', adminId: string) {
  void adminId;
  const master = await prisma.masterProfile.findUnique({ where: { userId } });
  if (!master) throw new AppError(404, 'Master not found');
  return prisma.masterProfile.update({ where: { userId }, data: { verificationStatus: status } });
}

export async function getAllOrders(filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        category: true,
        client: { select: { id: true, fullName: true, phone: true } },
        master: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, pages: Math.ceil(total / limit) };
}

export async function getStats() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [
    totalUsers,
    totalMasters,
    totalOrders,
    completedOrders,
    revenue,
    activeOrders,
    recentOrdersByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'MASTER' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { commission: true },
    }),
    prisma.order.count({ where: { status: { in: ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'] } } }),
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at)::text as date, COUNT(*) as count
      FROM "Order"
      WHERE created_at >= ${last30}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  return {
    totalUsers,
    totalMasters,
    totalOrders,
    completedOrders,
    totalRevenue: revenue._sum.commission || 0,
    activeOrders,
    ordersByDay: recentOrdersByDay.map((r) => ({ date: r.date, count: Number(r.count) })),
  };
}

export async function getPendingReviews() {
  return prisma.review.findMany({
    where: { isModerated: false, isHidden: false },
    include: {
      author: { select: { id: true, fullName: true } },
      target: { select: { id: true, fullName: true } },
      order: { select: { id: true, categoryId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function moderateReview(
  reviewId: string,
  action: 'approve' | 'hide',
  adminId: string
) {
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      isModerated: true,
      isHidden: action === 'hide',
      moderatedBy: adminId,
    },
  });
}

export async function getSettings() {
  let settings = await prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!settings) {
    settings = await prisma.systemSettings.create({ data: { orderCommission: 250 } });
  }
  return settings;
}

export async function updateSettings(
  data: {
    orderCommission?: number;
    defaultRadius?: number;
    searchTimeout?: number;
    retryInterval?: number;
  },
  adminId: string
) {
  const settings = await prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!settings) {
    return prisma.systemSettings.create({ data: { ...data, updatedBy: adminId } });
  }
  await redis.del('categories:all');
  return prisma.systemSettings.update({
    where: { id: settings.id },
    data: { ...data, updatedBy: adminId },
  });
}
