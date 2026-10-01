import { Router } from 'express';
import { updateScoreBoard, approveScoreBoard, createScoreBoard, getStudentScoreBoards, linkScoreBoardToCycle } from '../controllers/scoreboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/student/:id', getStudentScoreBoards);
router.post('/student/:id', createScoreBoard);
router.put('/:id', updateScoreBoard);
router.post('/:id/approve', approveScoreBoard);
router.put('/:id/link-cycle', linkScoreBoardToCycle);

export default router;
