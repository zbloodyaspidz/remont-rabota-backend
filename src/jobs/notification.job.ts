import { logger } from '../config/logger';

export async function addNotificationJob(data: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  logger.info('Notification job queued (in-memory)', { userId: data.userId, title: data.title });
}

export const notificationQueue = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add: (_name: string, data: any) => addNotificationJob(data),
};
export default notificationQueue;
