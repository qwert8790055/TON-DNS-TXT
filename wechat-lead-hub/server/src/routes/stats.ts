import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDashboardStats } from '../services/statsService';

export const statsRouter = Router();
statsRouter.use(authMiddleware);

statsRouter.get('/dashboard', (req, res) => {
  const days = req.query.days ? Number(req.query.days) : 7;
  res.json(getDashboardStats(days));
});
