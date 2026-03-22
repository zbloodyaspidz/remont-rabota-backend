import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { notificationQueue } from './notification.job';
import { logger } from '../config/logger';

const SEARCH_INTERVAL_MS = 5000;

/**
 * Background worker that processes orders awaiting master search.
 * Runs on an interval, picks orders from queue, finds matching masters, and sends push notifications.
 */
export async function startOrderSearchWorker(): Promise<void> {
  setInterval(async () => {
    try {
      // Process up to 10 orders at a time
      for (let i = 0; i < 10; i++) {
        const orderId = await redis.rpop('order:search');
        if (!orderId) break;
        await processOrderSearch(orderId);
      }

      // Check for auto-confirm orders
      await processAutoConfirm();
    } catch (err) {
      logger.error('Order search worker error', err);
    }
  }, SEARCH_INTERVAL_MS);
}

async function processOrderSearch(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { category: true },
  });

  if (!order || order.status !== 'SEARCHING') return;

  const settings = await prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  const searchRadius = settings?.defaultRadius ?? 10;

  // Find matching verified masters
  const masters = await prisma.masterProfile.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      isAvailable: true,
      specializationIds: { has: order.categoryId },
      userId: { notIn: order.notifiedMasterIds },
    },
    include: { user: { select: { id: true, fullName: true, fcmToken: true } } },
    orderBy: [{ rating: 'desc' }, { totalOrders: 'desc' }],
    take: 5,
  });

  if (masters.length === 0) {
    // No masters found - increment attempt counter
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { searchAttempts: { increment: 1 } },
    });

    if (updatedOrder.searchAttempts < 5) {
      // Retry later with wider radius (re-enqueue)
      await redis.lpush('order:search:delayed', JSON.stringify({
        orderId,
        retryAt: Date.now() + (settings?.retryInterval ?? 300) * 1000,
      }));
    } else {
      // Give up after max attempts
      logger.warn(`Order ${orderId} could not find masters after ${updatedOrder.searchAttempts} attempts`);
    }
    return;
  }

  // Filter by distance if geo data is available
  const candidateMasters = order.addressLat != null && order.addressLng != null
    ? masters.filter((m) => {
        if (m.workLat == null || m.workLng == null) return true;
        const dist = haversineDistance(
          order.addressLat!,
          order.addressLng!,
          m.workLat,
          m.workLng
        );
        return dist <= (m.workRadius ?? searchRadius);
      })
    : masters;

  if (candidateMasters.length === 0) {
    await redis.lpush('order:search:delayed', JSON.stringify({
      orderId,
      retryAt: Date.now() + (settings?.retryInterval ?? 300) * 1000,
    }));
    return;
  }

  const notifiedIds = candidateMasters.map((m) => m.userId);
  await prisma.order.update({
    where: { id: orderId },
    data: { notifiedMasterIds: { push: notifiedIds } },
  });

  for (const master of candidateMasters) {
    await notificationQueue.add('new-order', {
      userId: master.userId,
      title: 'Новый заказ',
      body: `Новый заказ: ${order.category.name} — ${order.address}`,
      data: { orderId, type: 'new-order' },
    });
  }

  logger.info(`Order ${orderId}: notified ${notifiedIds.length} masters`);

  // Set timeout - if no master accepts within timeout, re-search
  await redis.set(
    `order:search:timeout:${orderId}`,
    '1',
    'EX',
    settings?.searchTimeout ?? 180
  );
}

async function processAutoConfirm(): Promise<void> {
  // Check orders where master completed but client hasn't confirmed in 24h
  const expiredKeys = await redis.keys('order:autoconfirm:*');
  for (const key of expiredKeys) {
    const val = await redis.get(key);
    if (val === null) {
      // TTL expired - auto confirm
      const orderId = key.replace('order:autoconfirm:', '');
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order?.status === 'COMPLETED') {
        logger.info(`Auto-confirmed order ${orderId}`);
      }
      await redis.del(key);
    }
  }
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
