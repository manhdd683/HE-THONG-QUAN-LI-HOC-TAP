import { Router } from 'express';
import { getTutorDashboardStats, getParentDashboardStats } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/tutor', getTutorDashboardStats);
router.get('/parent', getParentDashboardStats);

export default router;
