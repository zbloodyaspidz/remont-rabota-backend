import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as orderService from '../services/order.service';
import { OrderStatus } from '@prisma/client';

export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const photos = req.files as Express.Multer.File[] | undefined;
    const order = await orderService.createOrder(req.user!.id, {
      ...req.body,
      photos,
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await orderService.getOrders(req.user!.id, req.user!.role, {
      status: req.query.status as OrderStatus | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user!.id, req.user!.role);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function acceptOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.acceptOrder(
      req.params.id,
      req.user!.id,
      req.body.workPrice
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function rejectOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await orderService.rejectOrder(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function completeOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.completeOrder(req.params.id, req.user!.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.cancelOrder(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body.reason
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status as OrderStatus,
      req.user!.id,
      req.user!.role
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await orderService.getAvailableOrdersForMaster(req.user!.id, {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
