"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOrderSearchWorker = startOrderSearchWorker;
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const notification_job_1 = require("./notification.job");
const logger_1 = require("../config/logger");
const SEARCH_INTERVAL_MS = 5000;
/**
 * Background worker that processes orders awaiting master search.
 * Runs on an interval, picks orders from queue, finds matching masters, and sends push notifications.
 */
async function startOrderSearchWorker() {
    setInterval(async () => {
        try {
            // Process up to 10 orders at a time
            for (let i = 0; i < 10; i++) {
                const orderId = await redis_1.redis.rpop('order:search');
                if (!orderId)
                    break;
                await processOrderSearch(orderId);
            }
            // Check for auto-confirm orders
            await processAutoConfirm();
        }
        catch (err) {
            logger_1.logger.error('Order search worker error', err);
        }
    }, SEARCH_INTERVAL_MS);
}
async function processOrderSearch(orderId) {
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { category: true },
    });
    if (!order || order.status !== 'SEARCHING')
        return;
    const settings = await prisma_1.prisma.systemSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    const searchRadius = settings?.defaultRadius ?? 10;
    // Find matching verified masters
    const masters = await prisma_1.prisma.masterProfile.findMany({
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
        const updatedOrder = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: { searchAttempts: { increment: 1 } },
        });
        if (updatedOrder.searchAttempts < 5) {
            // Retry later with wider radius (re-enqueue)
            await redis_1.redis.lpush('order:search:delayed', JSON.stringify({
                orderId,
                retryAt: Date.now() + (settings?.retryInterval ?? 300) * 1000,
            }));
        }
        else {
            // Give up after max attempts
            logger_1.logger.warn(`Order ${orderId} could not find masters after ${updatedOrder.searchAttempts} attempts`);
        }
        return;
    }
    // Filter by distance if geo data is available
    const candidateMasters = order.addressLat != null && order.addressLng != null
        ? masters.filter((m) => {
            if (m.workLat == null || m.workLng == null)
                return true;
            const dist = haversineDistance(order.addressLat, order.addressLng, m.workLat, m.workLng);
            return dist <= (m.workRadius ?? searchRadius);
        })
        : masters;
    if (candidateMasters.length === 0) {
        await redis_1.redis.lpush('order:search:delayed', JSON.stringify({
            orderId,
            retryAt: Date.now() + (settings?.retryInterval ?? 300) * 1000,
        }));
        return;
    }
    const notifiedIds = candidateMasters.map((m) => m.userId);
    await prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { notifiedMasterIds: { push: notifiedIds } },
    });
    for (const master of candidateMasters) {
        await notification_job_1.notificationQueue.add('new-order', {
            userId: master.userId,
            title: 'Новый заказ',
            body: `Новый заказ: ${order.category.name} — ${order.address}`,
            data: { orderId, type: 'new-order' },
        });
    }
    logger_1.logger.info(`Order ${orderId}: notified ${notifiedIds.length} masters`);
    // Set timeout - if no master accepts within timeout, re-search
    await redis_1.redis.set(`order:search:timeout:${orderId}`, '1', 'EX', settings?.searchTimeout ?? 180);
}
async function processAutoConfirm() {
    // Check orders where master completed but client hasn't confirmed in 24h
    const expiredKeys = await redis_1.redis.keys('order:autoconfirm:*');
    for (const key of expiredKeys) {
        const val = await redis_1.redis.get(key);
        if (val === null) {
            // TTL expired - auto confirm
            const orderId = key.replace('order:autoconfirm:', '');
            const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
            if (order?.status === 'COMPLETED') {
                logger_1.logger.info(`Auto-confirmed order ${orderId}`);
            }
            await redis_1.redis.del(key);
        }
    }
}
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
//# sourceMappingURL=orderSearch.job.js.map