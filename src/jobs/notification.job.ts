import { logger } from '../config/logger';

export async function addNotificationJob(data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  logger.info('Notification job queued (in-memory)', { userId: data.userId, title: data.title });
}

export const notificationQueue = { add: addNotificationJob };
export default notificationQueue;
