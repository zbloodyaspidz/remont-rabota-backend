import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { notifications, total, page, pages: Math.ceil(total / limit) };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw new AppError(404, 'Notification not found');
  if (notif.userId !== userId) throw new AppError(403, 'Forbidden');
  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function createNotification(data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({ data });
}

export async function sendPushNotification(data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  await createNotification(data);

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { fcmToken: true },
  });

  if (!user?.fcmToken) return;

  try {
    // FCM push via firebase-admin
    const { getMessaging } = await import('firebase-admin/messaging');
    await getMessaging().send({
      token: user.fcmToken,
      notification: { title: data.title, body: data.body },
      data: data.data ? Object.fromEntries(Object.entries(data.data).map(([k, v]) => [k, String(v)])) : undefined,
    });
  } catch (err) {
    logger.error('FCM push failed', { err, userId: data.userId });
  }
}
