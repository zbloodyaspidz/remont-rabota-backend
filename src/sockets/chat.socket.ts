import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/prisma';
import { uploadFile } from '../config/minio';
import { notificationQueue } from '../jobs/notification.job';
import { logger } from '../config/logger';

interface AuthSocket extends Socket {
  userId?: string;
  userFullName?: string;
}

export function setupChatSocket(io: Server): void {
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        next(new Error('No token'));
        return;
      }
      const payload = jwt.verify(token, config.jwt.secret) as { id: string };
      const user = await prisma.user.findUnique({
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
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    logger.debug(`Socket connected: ${socket.userId}`);

    socket.on('join-order', async (orderId: string) => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return;
      if (order.clientId !== socket.userId && order.masterId !== socket.userId) return;

      socket.join(`order-${orderId}`);
      socket.emit('joined', { orderId });
    });

    socket.on('message', async (data: { orderId: string; text?: string; imageBase64?: string; imageName?: string }) => {
      try {
        const { orderId, text, imageBase64, imageName } = data;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || (order.clientId !== socket.userId && order.masterId !== socket.userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        let imageUrl: string | undefined;
        if (imageBase64 && imageName) {
          const buffer = Buffer.from(imageBase64, 'base64');
          imageUrl = await uploadFile(buffer, imageName, 'image/jpeg');
        }

        const message = await prisma.message.create({
          data: {
            orderId,
            senderId: socket.userId!,
            text,
            imageUrl,
          },
          include: { sender: { select: { id: true, fullName: true, avatar: true } } },
        });

        io.to(`order-${orderId}`).emit('message', message);

        // Push notification to the other party
        const recipientId = order.clientId === socket.userId ? order.masterId : order.clientId;
        if (recipientId) {
          await notificationQueue.add('chat-message', {
            userId: recipientId,
            title: `Новое сообщение от ${socket.userFullName}`,
            body: text || 'Изображение',
            data: { orderId, type: 'chat-message' },
          });
        }
      } catch (err) {
        logger.error('Socket message error', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data: { orderId: string }) => {
      socket.to(`order-${data.orderId}`).emit('typing', { userId: socket.userId });
    });

    socket.on('read', async (data: { orderId: string }) => {
      await prisma.message.updateMany({
        where: { orderId: data.orderId, senderId: { not: socket.userId }, read: false },
        data: { read: true },
      });
      socket.to(`order-${data.orderId}`).emit('read', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.userId}`);
    });
  });
}
