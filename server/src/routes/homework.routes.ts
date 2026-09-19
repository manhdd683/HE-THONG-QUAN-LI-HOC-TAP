import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getHomeworks, createHomework, gradeHomework, updateHomeworkStatus } from '../controllers/homework.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getHomeworks);
router.post('/', createHomework);
router.patch('/:id/grade', gradeHomework);
router.patch('/:id/status', updateHomeworkStatus);

export default router;
