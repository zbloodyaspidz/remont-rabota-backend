import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as masterService from '../services/master.service';

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await masterService.updateMasterProfile(req.user!.id, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function uploadDocuments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ message: 'No files provided' });
      return;
    }
    const result = await masterService.uploadDocuments(req.user!.id, files);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function uploadPortfolio(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ message: 'No files provided' });
      return;
    }
    const result = await masterService.uploadPortfolio(req.user!.id, files);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await masterService.getMasterStatistics(req.user!.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
