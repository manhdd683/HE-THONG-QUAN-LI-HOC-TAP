import { Router } from 'express';
import { getStudents, getStudentById, createStudent, updateStudent, getStudentScores, deleteStudent } from '../controllers/student.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Both TUTOR and PARENT can view students (controller handles filtering logic)
router.get('/', getStudents);
router.get('/:id', getStudentById);

// Get student scores
router.get('/:id/scores', getStudentScores);

// Only TUTOR can create/update (controller handles role checks)
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
