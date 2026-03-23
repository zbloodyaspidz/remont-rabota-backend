"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMasterProfile = updateMasterProfile;
exports.uploadDocuments = uploadDocuments;
exports.uploadPortfolio = uploadPortfolio;
exports.getMasterStatistics = getMasterStatistics;
const prisma_1 = require("../config/prisma");
const minio_1 = require("../config/minio");
const errorHandler_1 = require("../middleware/errorHandler");
async function updateMasterProfile(userId, data) {
    const master = await prisma_1.prisma.masterProfile.findUnique({ where: { userId } });
    if (!master)
        throw new errorHandler_1.AppError(404, 'Master profile not found');
    return prisma_1.prisma.masterProfile.update({
        where: { userId },
        data: {
            specializationIds: data.specializationIds,
            experience: data.experience,
            workRadius: data.workRadius,
            workSchedule: data.workSchedule,
            workLat: data.workLat,
            workLng: data.workLng,
            isAvailable: data.isAvailable,
        },
    });
}
async function uploadDocuments(userId, files) {
    const urls = await Promise.all(files.map((f) => (0, minio_1.uploadFile)(f.buffer, f.originalname, f.mimetype)));
    await prisma_1.prisma.masterProfile.update({
        where: { userId },
        data: { documents: urls },
    });
    return { documents: urls };
}
async function uploadPortfolio(userId, files) {
    const master = await prisma_1.prisma.masterProfile.findUnique({ where: { userId } });
    if (!master)
        throw new errorHandler_1.AppError(404, 'Master profile not found');
    const existing = master.portfolio || [];
    const newUrls = await Promise.all(files.map((f) => (0, minio_1.uploadFile)(f.buffer, f.originalname, f.mimetype)));
    const portfolio = [...existing, ...newUrls];
    await prisma_1.prisma.masterProfile.update({ where: { userId }, data: { portfolio } });
    return { portfolio };
}
async function getMasterStatistics(userId) {
    const master = await prisma_1.prisma.masterProfile.findUnique({ where: { userId } });
    if (!master)
        throw new errorHandler_1.AppError(404, 'Master profile not found');
    const last30Days = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const recentOrders = await prisma_1.prisma.order.count({
        where: { masterId: userId, createdAt: { gte: last30Days } },
    });
    const recentEarnings = await prisma_1.prisma.order.aggregate({
        where: { masterId: userId, status: 'COMPLETED', completedAt: { gte: last30Days } },
        _sum: { masterPayout: true },
    });
    return {
        rating: master.rating,
        totalOrders: master.totalOrders,
        completedOrders: master.completedOrders,
        cancelledOrders: master.cancelledOrders,
        acceptanceRate: master.acceptanceRate,
        last30DaysOrders: recentOrders,
        last30DaysEarnings: recentEarnings._sum.masterPayout || 0,
    };
}
//# sourceMappingURL=master.service.js.map