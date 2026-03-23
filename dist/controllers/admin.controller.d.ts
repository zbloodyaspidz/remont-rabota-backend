import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function blockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function verifyMaster(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getPendingReviews(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function moderateReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map