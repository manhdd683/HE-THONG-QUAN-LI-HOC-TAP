import { Router } from 'express';
import { getTutorDashboardStats } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/tutor', getTutorDashboardStats);

export default router;
