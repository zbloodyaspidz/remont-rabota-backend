import Bull from 'bull';
import { config } from '../config';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export const ratingUpdateQueue = new Bull('rating-update', config.redis.url);

ratingUpdateQueue.process(async () => {
  logger.info('Running daily rating update');

  const masters = await prisma.masterProfile.findMany({
    select: { userId: true, totalOrders: true },
  });

  for (const master of masters) {
    if (master.totalOrders === 0) continue;

    const [total, accepted] = await Promise.all([
      prisma.order.count({
        where: {
          notifiedMasterIds: { has: master.userId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
      }),
      prisma.order.count({
        where: {
          masterId: master.userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
      }),
    ]);

    const acceptanceRate = total > 0 ? (accepted / total) * 100 : null;

    await prisma.masterProfile.update({
      where: { userId: master.userId },
      data: { acceptanceRate },
    });
  }

  logger.info('Daily rating update completed');
});

// Schedule daily at 3am
export async function scheduleRatingUpdate() {
  const now = new Date();
  const next3am = new Date(now);
  next3am.setHours(3, 0, 0, 0);
  if (next3am <= now) next3am.setDate(next3am.getDate() + 1);
  const delay = next3am.getTime() - now.getTime();

  await ratingUpdateQueue.add({}, { delay, repeat: { cron: '0 3 * * *' } });
}
