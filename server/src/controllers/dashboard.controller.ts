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
      }),

      prisma.reportHistory.findMany({
        where: { created_by: tutorId },
        include: { student: true },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

    // Lọc các chu kỳ thực sự còn nợ (total > paid)
    const realUnpaidCycles = unpaidCycles.filter(c => c.total_amount > c.paid_amount);

    res.json({
      totalStudents,
      todaySessionsCount: todaySchedules.length,
      pendingHomeworksCount: pendingHomeworks.length,
      unpaidCyclesCount: realUnpaidCycles.length,
      todaySchedules,
      upcomingSchedules,
      pendingHomeworks,
      unpaidCycles: realUnpaidCycles.slice(0, 5),
      recentReports,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Loi server' });
  }
};

export const getParentDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'PARENT') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const parentId = req.user.id;

    // Get all students of this parent
    const students = await prisma.student.findMany({
      where: { parent_id: parentId, status: 'ACTIVE' }
    });
    
    const studentIds = students.map(s => s.id);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [
      weeklySchedules,
      pendingHomeworks,
      unpaidCycles,
      upcomingSchedules,
      recentReports
    ] = await Promise.all([
      prisma.schedule.findMany({
        where: {
          student_id: { in: studentIds },
          date: { gte: startOfWeek, lte: endOfWeek },
        }
      }),

      prisma.homework.findMany({
        where: {
          student_id: { in: studentIds },
          status: 'PENDING',
        },
        include: { student: true },
        orderBy: { due_date: 'asc' },
        take: 5
      }),

      prisma.tuitionCycle.findMany({
        where: {
          student_id: { in: studentIds },
          status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        },
        include: { student: true },
        orderBy: { due_date: 'asc' }
      }),

      prisma.schedule.findMany({
        where: {
          student_id: { in: studentIds },
          date: { gte: new Date() },
          status: 'SCHEDULED'
        },
        include: { student: true },
        orderBy: { date: 'asc' },
        take: 5
      }),

      prisma.reportHistory.findMany({
        where: { student_id: { in: studentIds } },
        include: { student: true },
        orderBy: { created_at: 'desc' },
        take: 5
      })
    ]);

    const realUnpaidCycles = unpaidCycles.filter(c => c.total_amount > c.paid_amount);

    res.json({
      weeklySessionsCount: weeklySchedules.length,
      pendingHomeworksCount: pendingHomeworks.length,
      unpaidCyclesCount: realUnpaidCycles.length,
      upcomingSchedules,
      pendingHomeworks,
      unpaidCycles: realUnpaidCycles.slice(0, 5),
      recentReports
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Loi server' });
  }
};
