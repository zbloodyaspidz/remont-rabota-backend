import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: Role;
        phone: string;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map