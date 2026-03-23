import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function uploadAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getMasterProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map