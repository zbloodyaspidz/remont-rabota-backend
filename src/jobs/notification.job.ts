import Bull from 'bull';
import { config } from '../config';
import { sendPushNotification } from '../services/notification.service';
import { logger } from '../config/logger';

export const notificationQueue = new Bull('notifications', config.redis.url);

notificationQueue.process(async (job) => {
  const { userId, title, body, data } = job.data;
  await sendPushNotification({ userId, title, body, data });
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`Notification job ${job.id} failed`, err);
});

export default notificationQueue;
