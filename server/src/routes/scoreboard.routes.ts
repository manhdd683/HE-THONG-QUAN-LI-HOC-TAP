import { Router } from 'express';
import { updateScoreBoard, approveScoreBoard } from '../controllers/scoreboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.put('/:id', updateScoreBoard);
router.post('/:id/approve', approveScoreBoard);

export default router;
