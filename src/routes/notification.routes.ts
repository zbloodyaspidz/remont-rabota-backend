import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import * as notifService from '../services/notification.service';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await notifService.getNotifications(
      req.user!.id,
      req.query.page ? parseInt(req.query.page as string) : 1,
      req.query.limit ? parseInt(req.query.limit as string) : 20
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notif = await notifService.markAsRead(req.params.id, req.user!.id);
    res.json(notif);
  } catch (err) {
    next(err);
  }
});

export default router;
