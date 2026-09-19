import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getTuitionCycles, createTuitionCycle, recordPayment } from '../controllers/tuition.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getTuitionCycles);
router.post('/', createTuitionCycle);
router.post('/:id/payment', recordPayment);

export default router;
