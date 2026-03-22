import { Router } from 'express';
import * as ctrl from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', upload.array('photos', 5), ctrl.createOrder);
router.get('/', ctrl.getOrders);
router.get('/available', requireRole('MASTER'), ctrl.getAvailableOrders);
router.get('/:id', ctrl.getOrderById);
router.patch('/:id/status', ctrl.updateStatus);
router.post('/:id/accept', requireRole('MASTER'), ctrl.acceptOrder);
router.post('/:id/reject', requireRole('MASTER'), ctrl.rejectOrder);
router.post('/:id/complete', requireRole('MASTER'), ctrl.completeOrder);
router.post('/:id/cancel', ctrl.cancelOrder);

export default router;
