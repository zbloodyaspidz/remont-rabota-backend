"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = createReview;
exports.getReviews = getReviews;
exports.deleteReview = deleteReview;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
async function createReview(orderId, authorId, data) {
    const order = await prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { review: true },
    });
    if (!order)
        throw new errorHandler_1.AppError(404, 'Order not found');
    if (order.clientId !== authorId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    if (order.status !== 'COMPLETED')
        throw new errorHandler_1.AppError(400, 'Order not completed');
    if (order.review)
        throw new errorHandler_1.AppError(409, 'Review already exists');
    if (!order.masterId)
        throw new errorHandler_1.AppError(400, 'No master assigned');
    if (data.rating < 1 || data.rating > 5)
        throw new errorHandler_1.AppError(422, 'Rating must be 1-5');
    const review = await prisma_1.prisma.review.create({
        data: {
            orderId,
            authorId,
            targetId: order.masterId,
            rating: data.rating,
            comment: data.comment,
        },
    });
    // Recalculate master rating (last 30 reviews, weighted)
    await recalculateMasterRating(order.masterId);
    return review;
}
async function getReviews(targetId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
        prisma_1.prisma.review.findMany({
            where: { targetId, isHidden: false },
            include: {
                author: { select: { id: true, fullName: true, avatar: true } },
                order: { select: { id: true, category: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma_1.prisma.review.count({ where: { targetId, isHidden: false } }),
    ]);
    return { reviews, total, page, pages: Math.ceil(total / limit) };
}
async function deleteReview(reviewId, adminId) {
    const review = await prisma_1.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review)
        throw new errorHandler_1.AppError(404, 'Review not found');
    await prisma_1.prisma.review.update({
        where: { id: reviewId },
        data: { isHidden: true, moderatedBy: adminId },
    });
    await recalculateMasterRating(review.targetId);
    return { message: 'Review hidden' };
}
async function recalculateMasterRating(masterId) {
    const reviews = await prisma_1.prisma.review.findMany({
        where: { targetId: masterId, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { rating: true, createdAt: true },
    });
    if (reviews.length === 0) {
        await prisma_1.prisma.masterProfile.update({
            where: { userId: masterId },
            data: { rating: 0, totalReviews: 0 },
        });
        return;
    }
    // Weighted average: newer reviews have higher weight
    let weightedSum = 0;
    let totalWeight = 0;
    reviews.forEach((r, i) => {
        const weight = reviews.length - i;
        weightedSum += r.rating * weight;
        totalWeight += weight;
    });
    const rating = Math.round((weightedSum / totalWeight) * 10) / 10;
    const totalReviews = await prisma_1.prisma.review.count({ where: { targetId: masterId, isHidden: false } });
    await prisma_1.prisma.masterProfile.update({
        where: { userId: masterId },
        data: { rating, totalReviews },
    });
}
//# sourceMappingURL=review.service.js.map