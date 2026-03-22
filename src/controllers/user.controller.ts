import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as userService from '../services/user.service';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.getMe(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateMe(req.user!.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }
    const result = await userService.uploadAvatar(req.user!.id, req.file);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMasterProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await userService.getMasterPublicProfile(req.params.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}
