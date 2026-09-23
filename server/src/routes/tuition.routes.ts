import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getTuitionCycles, createTuitionCycle, recordPayment, getUnbilledSessions, getStudentTuitionCycles } from '../controllers/tuition.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getTuitionCycles);
router.get('/student/:studentId', getStudentTuitionCycles);
router.get('/unbilled/:student_id', getUnbilledSessions);
router.post('/', createTuitionCycle);
router.post('/:id/payment', recordPayment);

export default router;
