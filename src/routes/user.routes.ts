import { Router } from 'express';
import * as ctrl from '../controllers/user.controller';
import * as masterCtrl from '../controllers/master.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateMe);
router.post('/me/avatar', upload.single('avatar'), ctrl.uploadAvatar);
router.get('/masters/:id', ctrl.getMasterProfile);

// Master-specific routes
router.patch('/masters/profile', requireRole('MASTER'), masterCtrl.updateProfile);
router.post('/masters/documents', requireRole('MASTER'), upload.array('documents', 5), masterCtrl.uploadDocuments);
router.post('/masters/portfolio', requireRole('MASTER'), upload.array('photos', 10), masterCtrl.uploadPortfolio);
router.get('/masters/statistics', requireRole('MASTER'), masterCtrl.getStatistics);

export default router;
