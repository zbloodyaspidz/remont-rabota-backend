import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const REFRESH_PREFIX = 'refresh:';

function generateTokens(payload: { id: string; role: Role; phone: string }) {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

export async function register(data: {
  phone: string;
  email?: string;
  password: string;
  fullName?: string;
  role: Role;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] },
  });
  if (existing) throw new AppError(409, 'User already exists');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      phone: data.phone,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role,
      clientProfile: data.role === Role.CLIENT ? { create: {} } : undefined,
      masterProfile:
        data.role === Role.MASTER
          ? { create: { verificationStatus: 'PENDING' } }
          : undefined,
    },
    select: { id: true, phone: true, email: true, role: true, fullName: true, avatar: true },
  });

  const tokens = generateTokens({ id: user.id, role: user.role, phone: user.phone });
  await redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 3600);

  return { user, ...tokens };
}

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.passwordHash) throw new AppError(401, 'Invalid credentials');
  if (user.isBlocked) throw new AppError(403, 'Account blocked');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const tokens = generateTokens({ id: user.id, role: user.role, phone: user.phone });
  await redis.set(`${REFRESH_PREFIX}${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 3600);

  return {
    user: { id: user.id, phone: user.phone, email: user.email, role: user.role, fullName: user.fullName, avatar: user.avatar },
    ...tokens,
  };
}

export async function refreshTokens(refreshToken: string) {
  let payload: { id: string; role: Role; phone: string };
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as typeof payload;
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const stored = await redis.get(`${REFRESH_PREFIX}${payload.id}`);
  if (stored !== refreshToken) throw new AppError(401, 'Refresh token revoked');

  const tokens = generateTokens({ id: payload.id, role: payload.role, phone: payload.phone });
  await redis.set(`${REFRESH_PREFIX}${payload.id}`, tokens.refreshToken, 'EX', 7 * 24 * 3600);
  return tokens;
}

export async function logout(userId: string) {
  await redis.del(`${REFRESH_PREFIX}${userId}`);
}

export async function sendPhoneVerification(phone: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.phoneVerification.create({ data: { phone, code, expiresAt } });
  logger.info(`SMS code for ${phone}: ${code}`);
  // In production: integrate with SMS provider (e.g., SMSC.ru, SMSRU)
  return { message: 'Code sent' };
}

export async function verifyPhone(phone: string, code: string) {
  const record = await prisma.phoneVerification.findFirst({
    where: { phone, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new AppError(400, 'Invalid or expired code');
  await prisma.phoneVerification.update({ where: { id: record.id }, data: { used: true } });
  return { verified: true };
}
