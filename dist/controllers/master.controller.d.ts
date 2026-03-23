import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function uploadDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function uploadPortfolio(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getStatistics(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=master.controller.d.ts.map