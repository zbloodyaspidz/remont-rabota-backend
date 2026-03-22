import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = req.body;
    const result = await authService.login(phone, password);
    res
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000,
      })
      .json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await authService.refreshTokens(token);
    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000,
      })
      .json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.id);
    res.clearCookie('refreshToken').json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function sendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.sendPhoneVerification(req.body.phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyPhone(req.body.phone, req.body.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
