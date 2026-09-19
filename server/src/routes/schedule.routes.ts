import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { getSchedules, createSchedule, updateScheduleStatus, markAttendance, updateSchedule, deleteSchedule } from '../controllers/schedule.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.patch('/:id/status', updateScheduleStatus);
router.post('/:schedule_id/attendance', markAttendance);

export default router;
