import { prisma } from '../config/prisma';
import { uploadFile } from '../config/minio';
import { AppError } from '../middleware/errorHandler';

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { clientProfile: true, masterProfile: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  const { passwordHash, ...safe } = user;
  void passwordHash;
  return safe;
}

export async function updateMe(
  userId: string,
  data: { fullName?: string; email?: string; savedAddresses?: unknown }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      email: data.email,
      clientProfile:
        user.role === 'CLIENT' && data.savedAddresses
          ? { update: { savedAddresses: data.savedAddresses as never } }
          : undefined,
    },
    include: { clientProfile: true, masterProfile: true },
  });

  const { passwordHash, ...safe } = updated;
  void passwordHash;
  return safe;
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  const url = await uploadFile(file.buffer, file.originalname, file.mimetype);
  await prisma.user.update({ where: { id: userId }, data: { avatar: url } });
  return { avatar: url };
}

export async function getMasterPublicProfile(masterId: string) {
  const user = await prisma.user.findUnique({
    where: { id: masterId },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      masterProfile: true,
      reviewsAsTarget: {
        where: { isHidden: false },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { id: true, fullName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!user || !user.masterProfile) throw new AppError(404, 'Master not found');
  return user;
}
