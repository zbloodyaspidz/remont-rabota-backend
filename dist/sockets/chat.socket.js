"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatSocket = setupChatSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = require("../config/prisma");
const minio_1 = require("../config/minio");
const notification_job_1 = require("../jobs/notification.job");
const logger_1 = require("../config/logger");
function setupChatSocket(io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                next(new Error('No token'));
                return;
            }
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: payload.id },
                select: { id: true, fullName: true, isBlocked: true },
            });
            if (!user || user.isBlocked) {
                next(new Error('Unauthorized'));
                return;
            }
            socket.userId = user.id;
            socket.userFullName = user.fullName || '';
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.debug(`Socket connected: ${socket.userId}`);
        socket.on('join-order', async (orderId) => {
            const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
            if (!order)
                return;
            if (order.clientId !== socket.userId && order.masterId !== socket.userId)
                return;
            socket.join(`order-${orderId}`);
            socket.emit('joined', { orderId });
        });
        socket.on('message', async (data) => {
            try {
                const { orderId, text, imageBase64, imageName } = data;
                const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
                if (!order || (order.clientId !== socket.userId && order.masterId !== socket.userId)) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                let imageUrl;
                if (imageBase64 && imageName) {
                    const buffer = Buffer.from(imageBase64, 'base64');
                    imageUrl = await (0, minio_1.uploadFile)(buffer, imageName, 'image/jpeg');
                }
                const message = await prisma_1.prisma.message.create({
                    data: {
                        orderId,
                        senderId: socket.userId,
                        text,
                        imageUrl,
                    },
                    include: { sender: { select: { id: true, fullName: true, avatar: true } } },
                });
                io.to(`order-${orderId}`).emit('message', message);
                // Push notification to the other party
                const recipientId = order.clientId === socket.userId ? order.masterId : order.clientId;
                if (recipientId) {
                    await notification_job_1.notificationQueue.add('chat-message', {
                        userId: recipientId,
                        title: `Новое сообщение от ${socket.userFullName}`,
                        body: text || 'Изображение',
                        data: { orderId, type: 'chat-message' },
                    });
                }
            }
            catch (err) {
                logger_1.logger.error('Socket message error', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        socket.on('typing', (data) => {
            socket.to(`order-${data.orderId}`).emit('typing', { userId: socket.userId });
        });
        socket.on('read', async (data) => {
            await prisma_1.prisma.message.updateMany({
                where: { orderId: data.orderId, senderId: { not: socket.userId }, read: false },
                data: { read: true },
            });
            socket.to(`order-${data.orderId}`).emit('read', { userId: socket.userId });
        });
        socket.on('disconnect', () => {
            logger_1.logger.debug(`Socket disconnected: ${socket.userId}`);
        });
    });
}
//# sourceMappingURL=chat.socket.js.map