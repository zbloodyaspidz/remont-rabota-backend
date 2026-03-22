import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as catService from '../services/category.service';
import { NextFunction, Request, Response } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await catService.getCategories();
    res.json(cats);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await catService.createCategory(req.body);
    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await catService.updateCategory(req.params.id, req.body);
    res.json(cat);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await catService.deleteCategory(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
