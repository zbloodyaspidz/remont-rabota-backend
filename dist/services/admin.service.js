"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.blockUser = blockUser;
exports.verifyMaster = verifyMaster;
exports.getAllOrders = getAllOrders;
exports.getStats = getStats;
exports.getPendingReviews = getPendingReviews;
exports.moderateReview = moderateReview;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const redis_1 = require("../config/redis");
async function listUsers(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.role)
        where.role = filters.role;
    if (filters.isBlocked !== undefined)
        where.isBlocked = filters.isBlocked;
    if (filters.search) {
        where.OR = [
            { fullName: { contains: filters.search, mode: 'insensitive' } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
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
        prisma_1.prisma.user.count({ where }),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) };
}
async function blockUser(userId, adminId) {
    void adminId;
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new errorHandler_1.AppError(404, 'User not found');
    return prisma_1.prisma.user.update({ where: { id: userId }, data: { isBlocked: !user.isBlocked } });
}
async function verifyMaster(userId, status, adminId) {
    void adminId;
    const master = await prisma_1.prisma.masterProfile.findUnique({ where: { userId } });
    if (!master)
        throw new errorHandler_1.AppError(404, 'Master not found');
    return prisma_1.prisma.masterProfile.update({ where: { userId }, data: { verificationStatus: status } });
}
async function getAllOrders(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.startDate || filters.endDate) {
        where.createdAt = {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
        };
    }
    const [orders, total] = await Promise.all([
        prisma_1.prisma.order.findMany({
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
        prisma_1.prisma.order.count({ where }),
    ]);
    return { orders, total, page, pages: Math.ceil(total / limit) };
}
async function getStats() {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const [totalUsers, totalMasters, totalOrders, completedOrders, revenue, activeOrders, recentOrdersByDay,] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.user.count({ where: { role: 'MASTER' } }),
        prisma_1.prisma.order.count(),
        prisma_1.prisma.order.count({ where: { status: 'COMPLETED' } }),
        prisma_1.prisma.order.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { commission: true },
        }),
        prisma_1.prisma.order.count({ where: { status: { in: ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'] } } }),
        prisma_1.prisma.$queryRaw `
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
async function getPendingReviews() {
    return prisma_1.prisma.review.findMany({
        where: { isModerated: false, isHidden: false },
        include: {
            author: { select: { id: true, fullName: true } },
            target: { select: { id: true, fullName: true } },
            order: { select: { id: true, categoryId: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
async function moderateReview(reviewId, action, adminId) {
    return prisma_1.prisma.review.update({
        where: { id: reviewId },
        data: {
            isModerated: true,
            isHidden: action === 'hide',
            moderatedBy: adminId,
        },
    });
}
async function getSettings() {
    let settings = await prisma_1.prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!settings) {
        settings = await prisma_1.prisma.systemSettings.create({ data: { orderCommission: 250 } });
    }
    return settings;
}
async function updateSettings(data, adminId) {
    const settings = await prisma_1.prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!settings) {
        return prisma_1.prisma.systemSettings.create({ data: { ...data, updatedBy: adminId } });
    }
    await redis_1.redis.del('categories:all');
    return prisma_1.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { ...data, updatedBy: adminId },
    });
}
//# sourceMappingURL=admin.service.js.map