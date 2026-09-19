import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getStudentReport, getReportHistory, saveReportHistory } from '../controllers/report.controller';

const router = Router();

router.use(authenticateToken);

router.get('/student/:studentId', getStudentReport);
router.get('/history', getReportHistory);
router.post('/history', saveReportHistory);

export default router;
