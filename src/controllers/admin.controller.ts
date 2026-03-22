import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as adminService from '../services/admin.service';

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.listUsers({
      role: req.query.role as string,
      isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function blockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await adminService.blockUser(req.params.id, req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function verifyMaster(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const master = await adminService.verifyMaster(
      req.params.id,
      req.body.status,
      req.user!.id
    );
    res.json(master);
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getAllOrders({
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getPendingReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reviews = await adminService.getPendingReviews();
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function moderateReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const review = await adminService.moderateReview(req.params.id, req.body.action, req.user!.id);
    res.json(review);
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await adminService.getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const settings = await adminService.updateSettings(req.body, req.user!.id);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
