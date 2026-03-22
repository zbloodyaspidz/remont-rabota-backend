import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as reviewService from '../services/review.service';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/orders/:orderId/review', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await reviewService.createReview(req.params.orderId, req.user!.id, req.body);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await reviewService.getReviews(
      req.query.targetId as string,
      req.query.page ? parseInt(req.query.page as string) : 1,
      req.query.limit ? parseInt(req.query.limit as string) : 20
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/reviews/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await reviewService.deleteReview(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
