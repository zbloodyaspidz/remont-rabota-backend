import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  phone: z.string().min(10),
  email: z.string().email().optional(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  role: z.enum(['CLIENT', 'MASTER']).default('CLIENT'),
});

const loginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(1),
});

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.post('/send-verification', ctrl.sendVerification);
router.post('/verify-phone', ctrl.verifyPhone);

export default router;
