"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.createNotification = createNotification;
exports.sendPushNotification = sendPushNotification;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
async function getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
        prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma_1.prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, total, page, pages: Math.ceil(total / limit) };
}
async function markAsRead(notificationId, userId) {
    const notif = await prisma_1.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif)
        throw new errorHandler_1.AppError(404, 'Notification not found');
    if (notif.userId !== userId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    return prisma_1.prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}
async function createNotification(data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prisma_1.prisma.notification.create({ data: data });
}
async function sendPushNotification(data) {
    await createNotification(data);
    logger_1.logger.info('Push notification stored (FCM not configured)', { userId: data.userId });
}
//# sourceMappingURL=notification.service.js.map