import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function acceptOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function rejectOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function completeOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getAvailableOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=order.controller.d.ts.map