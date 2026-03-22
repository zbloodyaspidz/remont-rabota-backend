import { prisma } from '../config/prisma';
import { uploadFile } from '../config/minio';
import { AppError } from '../middleware/errorHandler';

export async function updateMasterProfile(
  userId: string,
  data: {
    specializationIds?: string[];
    experience?: string;
    workRadius?: number;
    workSchedule?: unknown;
    workLat?: number;
    workLng?: number;
    isAvailable?: boolean;
  }
) {
  const master = await prisma.masterProfile.findUnique({ where: { userId } });
  if (!master) throw new AppError(404, 'Master profile not found');

  return prisma.masterProfile.update({
    where: { userId },
    data: {
      specializationIds: data.specializationIds,
      experience: data.experience,
      workRadius: data.workRadius,
      workSchedule: data.workSchedule as never,
      workLat: data.workLat,
      workLng: data.workLng,
      isAvailable: data.isAvailable,
    },
  });
}

export async function uploadDocuments(userId: string, files: Express.Multer.File[]) {
  const urls = await Promise.all(
    files.map((f) => uploadFile(f.buffer, f.originalname, f.mimetype))
  );
  await prisma.masterProfile.update({
    where: { userId },
    data: { documents: urls },
  });
  return { documents: urls };
}

export async function uploadPortfolio(userId: string, files: Express.Multer.File[]) {
  const master = await prisma.masterProfile.findUnique({ where: { userId } });
  if (!master) throw new AppError(404, 'Master profile not found');

  const existing = (master.portfolio as string[]) || [];
  const newUrls = await Promise.all(
    files.map((f) => uploadFile(f.buffer, f.originalname, f.mimetype))
  );
  const portfolio = [...existing, ...newUrls];

  await prisma.masterProfile.update({ where: { userId }, data: { portfolio } });
  return { portfolio };
}

export async function getMasterStatistics(userId: string) {
  const master = await prisma.masterProfile.findUnique({ where: { userId } });
  if (!master) throw new AppError(404, 'Master profile not found');

  const last30Days = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const recentOrders = await prisma.order.count({
    where: { masterId: userId, createdAt: { gte: last30Days } },
  });
  const recentEarnings = await prisma.order.aggregate({
    where: { masterId: userId, status: 'COMPLETED', completedAt: { gte: last30Days } },
    _sum: { masterPayout: true },
  });

  return {
    rating: master.rating,
    totalOrders: master.totalOrders,
    completedOrders: master.completedOrders,
    cancelledOrders: master.cancelledOrders,
    acceptanceRate: master.acceptanceRate,
    last30DaysOrders: recentOrders,
    last30DaysEarnings: recentEarnings._sum.masterPayout || 0,
  };
}
