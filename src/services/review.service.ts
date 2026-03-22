import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export async function createReview(
  orderId: string,
  authorId: string,
  data: { rating: number; comment?: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { review: true },
  });
  if (!order) throw new AppError(404, 'Order not found');
  if (order.clientId !== authorId) throw new AppError(403, 'Forbidden');
  if (order.status !== 'COMPLETED') throw new AppError(400, 'Order not completed');
  if (order.review) throw new AppError(409, 'Review already exists');
  if (!order.masterId) throw new AppError(400, 'No master assigned');

  if (data.rating < 1 || data.rating > 5) throw new AppError(422, 'Rating must be 1-5');

  const review = await prisma.review.create({
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

export async function getReviews(targetId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { targetId, isHidden: false },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        order: { select: { id: true, category: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { targetId, isHidden: false } }),
  ]);
  return { reviews, total, page, pages: Math.ceil(total / limit) };
}

export async function deleteReview(reviewId: string, adminId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new AppError(404, 'Review not found');
  await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: true, moderatedBy: adminId },
  });
  await recalculateMasterRating(review.targetId);
  return { message: 'Review hidden' };
}

async function recalculateMasterRating(masterId: string) {
  const reviews = await prisma.review.findMany({
    where: { targetId: masterId, isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { rating: true, createdAt: true },
  });

  if (reviews.length === 0) {
    await prisma.masterProfile.update({
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
  const totalReviews = await prisma.review.count({ where: { targetId: masterId, isHidden: false } });

  await prisma.masterProfile.update({
    where: { userId: masterId },
    data: { rating, totalReviews },
  });
}
