import express from 'express';
import { getAchievements, getStudentAchievements, evaluateAchievements } from '../controllers/achievement.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAchievements);
router.get('/student/:studentId', getStudentAchievements);
router.post('/evaluate', evaluateAchievements);

export default router;
