"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.startSearching = startSearching;
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.acceptOrder = acceptOrder;
exports.rejectOrder = rejectOrder;
exports.completeOrder = completeOrder;
exports.cancelOrder = cancelOrder;
exports.getAvailableOrdersForMaster = getAvailableOrdersForMaster;
exports.updateOrderStatus = updateOrderStatus;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const errorHandler_1 = require("../middleware/errorHandler");
const minio_1 = require("../config/minio");
const notification_job_1 = require("../jobs/notification.job");
const ALLOWED_TRANSITIONS = {
    PENDING: ['SEARCHING', 'CANCELLED_BY_CLIENT'],
    SEARCHING: ['ACCEPTED', 'CANCELLED_BY_CLIENT'],
    ACCEPTED: ['IN_PROGRESS', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_MASTER', 'DISPUTED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED_BY_MASTER', 'DISPUTED'],
    COMPLETED: [],
    CANCELLED_BY_CLIENT: [],
    CANCELLED_BY_MASTER: [],
    DISPUTED: ['COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_MASTER'],
};
async function createOrder(clientId, data) {
    const photoUrls = data.photos
        ? await Promise.all(data.photos.map((f) => (0, minio_1.uploadFile)(f.buffer, f.originalname, f.mimetype)))
        : [];
    const settings = await prisma_1.prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    const commission = settings?.orderCommission ?? 250;
    const clientPrice = data.workPrice != null ? data.workPrice + commission : undefined;
    const order = await prisma_1.prisma.order.create({
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
async function startSearching(orderId) {
    await prisma_1.prisma.order.update({ where: { id: orderId }, data: { status: 'SEARCHING' } });
    // Enqueue job to find masters
    await redis_1.redis.lpush('order:search', orderId);
}
async function getOrders(userId, role, filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = role === 'CLIENT'
        ? { clientId: userId, ...(filters.status ? { status: filters.status } : {}) }
        : role === 'MASTER'
            ? { masterId: userId, ...(filters.status ? { status: filters.status } : {}) }
            : filters.status
                ? { status: filters.status }
                : {};
    const [orders, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
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
        prisma_1.prisma.order.count({ where }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
}
async function getOrderById(orderId, userId, role) {
    const order = await prisma_1.prisma.order.findUnique({
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
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (role !== 'ADMIN' && order.clientId !== userId && order.masterId !== userId) {
        throw new errorHandler_1.AppError(403, 'Forbidden');
    }
    return order;
}
async function acceptOrder(orderId, masterId, workPrice) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.status !== 'SEARCHING')
        throw new errorHandler_1.AppError(400, 'Order is not available');
    const master = await prisma_1.prisma.masterProfile.findUnique({ where: { userId: masterId } });
    if (!master || master.verificationStatus !== 'VERIFIED') {
        throw new errorHandler_1.AppError(403, 'Master not verified');
    }
    const settings = await prisma_1.prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    const commission = order.commission ?? settings?.orderCommission ?? 250;
    const finalWorkPrice = workPrice ?? order.workPrice;
    const finalClientPrice = finalWorkPrice != null ? finalWorkPrice + commission : undefined;
    const updated = await prisma_1.prisma.order.update({
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
    await notification_job_1.notificationQueue.add('order-accepted', {
        userId: updated.clientId,
        title: 'Мастер принял заказ',
        body: `Мастер ${updated.master?.fullName || ''} принял ваш заказ`,
        data: { orderId, type: 'order-accepted' },
    });
    // Update master stats
    await prisma_1.prisma.masterProfile.update({
        where: { userId: masterId },
        data: { totalOrders: { increment: 1 } },
    });
    return updated;
}
async function rejectOrder(orderId, masterId) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.status !== 'SEARCHING')
        throw new errorHandler_1.AppError(400, 'Order is not in searching state');
    // Track rejection but don't change order status - let algorithm handle it
    await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: {
            notifiedMasterIds: { set: [...(order.notifiedMasterIds || []), masterId] },
        },
    });
    return { message: 'Order rejected' };
}
async function completeOrder(orderId, masterId) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.masterId !== masterId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    if (order.status !== 'IN_PROGRESS')
        throw new errorHandler_1.AppError(400, 'Order is not in progress');
    const updated = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await prisma_1.prisma.masterProfile.update({
        where: { userId: masterId },
        data: { completedOrders: { increment: 1 } },
    });
    await notification_job_1.notificationQueue.add('order-completed', {
        userId: order.clientId,
        title: 'Заказ выполнен',
        body: 'Мастер завершил работу. Подтвердите выполнение.',
        data: { orderId, type: 'order-completed' },
    });
    // Auto-confirm after 24h
    await redis_1.redis.set(`order:autoconfirm:${orderId}`, '1', 'EX', 24 * 3600);
    return updated;
}
async function cancelOrder(orderId, userId, role, reason) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    const isClient = order.clientId === userId;
    const isMaster = order.masterId === userId;
    if (!isClient && !isMaster && role !== 'ADMIN')
        throw new errorHandler_1.AppError(403, 'Forbidden');
    const newStatus = isClient ? 'CANCELLED_BY_CLIENT' : 'CANCELLED_BY_MASTER';
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
        throw new errorHandler_1.AppError(400, `Cannot cancel order in status ${order.status}`);
    }
    const updated = await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: {
            status: newStatus,
            cancelledAt: new Date(),
            cancellationReason: reason,
        },
    });
    if (isMaster && ['ACCEPTED', 'IN_PROGRESS'].includes(order.status)) {
        await prisma_1.prisma.masterProfile.update({
            where: { userId },
            data: {
                cancelledOrders: { increment: 1 },
                rating: { decrement: 0.2 },
            },
        });
    }
    const notifyUserId = isClient ? order.masterId : order.clientId;
    if (notifyUserId) {
        await notification_job_1.notificationQueue.add('order-cancelled', {
            userId: notifyUserId,
            title: 'Заказ отменён',
            body: `Заказ был отменён. Причина: ${reason || 'не указана'}`,
            data: { orderId, type: 'order-cancelled' },
        });
    }
    return updated;
}
async function getAvailableOrdersForMaster(masterId, filters) {
    const master = await prisma_1.prisma.masterProfile.findUnique({ where: { userId: masterId } });
    if (!master)
        throw new errorHandler_1.AppError(404, 'Master profile not found');
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = {
        status: client_1.OrderStatus.SEARCHING,
        categoryId: { in: master.specializationIds },
        NOT: { notifiedMasterIds: { has: masterId } },
        masterId: null,
    };
    const [orders, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
            where,
            include: {
                category: true,
                client: { select: { id: true, fullName: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
        }),
        prisma_1.prisma.order.count({ where }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
}
async function updateOrderStatus(orderId, newStatus, userId, role) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (role !== 'ADMIN' && order.clientId !== userId && order.masterId !== userId) {
        throw new errorHandler_1.AppError(403, 'Forbidden');
    }
    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
        throw new errorHandler_1.AppError(400, `Cannot transition from ${order.status} to ${newStatus}`);
    }
    return prisma_1.prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
}
//# sourceMappingURL=order.service.js.map