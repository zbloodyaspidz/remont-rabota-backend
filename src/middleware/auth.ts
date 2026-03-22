import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    phone: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret) as {
      id: string;
      role: Role;
      phone: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, phone: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    req.user = { id: user.id, role: user.role, phone: user.phone };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole =
  (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
