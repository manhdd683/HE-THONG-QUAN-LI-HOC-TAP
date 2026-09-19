import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTutorDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const tutorId = req.user.id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const [
      totalStudents,
      todaySchedules,
      upcomingSchedules,
      pendingHomeworks,
      unpaidCycles,
      recentReports,
    ] = await Promise.all([
      prisma.student.count({ where: { tutor_id: tutorId, status: 'ACTIVE' } }),

      prisma.schedule.findMany({
        where: {
          student: { tutor_id: tutorId },
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: { student: true },
        orderBy: { start_time: 'asc' },
      }),

      prisma.schedule.findMany({
        where: {
          student: { tutor_id: tutorId },
          date: { gt: endOfDay, lte: next7Days },
          status: 'SCHEDULED',
        },
        include: { student: true },
        orderBy: { date: 'asc' },
        take: 5,
      }),

      prisma.homework.findMany({
        where: {
          student: { tutor_id: tutorId },
          status: { in: ['SUBMITTED', 'PENDING'] },
        },
        include: { student: true },
        orderBy: { updated_at: 'desc' },
        take: 5,
      }),

      prisma.tuitionCycle.findMany({
        where: {
          student: { tutor_id: tutorId },
          status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        },
        include: { student: true },
        orderBy: { due_date: 'asc' },
        take: 5,
      }),

      prisma.reportHistory.findMany({
        where: { created_by: tutorId },
        include: { student: true },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      totalStudents,
      todaySessionsCount: todaySchedules.length,
      pendingHomeworksCount: pendingHomeworks.length,
      unpaidCyclesCount: unpaidCycles.length,
      todaySchedules,
      upcomingSchedules,
      pendingHomeworks,
      unpaidCycles,
      recentReports,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Loi server' });
  }
};
