import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/block', ctrl.blockUser);
router.patch('/users/:id/verify', ctrl.verifyMaster);
router.get('/orders', ctrl.getAllOrders);
router.get('/stats', ctrl.getStats);
router.get('/reviews/pending', ctrl.getPendingReviews);
router.patch('/reviews/:id/moderate', ctrl.moderateReview);
router.get('/settings', ctrl.getSettings);
router.patch('/settings', ctrl.updateSettings);

export default router;
