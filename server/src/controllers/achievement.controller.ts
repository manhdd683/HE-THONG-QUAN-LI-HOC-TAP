import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAchievements = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let achievements;

    if (user.role === 'TUTOR') {
      achievements = await prisma.achievement.findMany({
        where: {
          student: {
            tutor_id: user.id
          }
        },
        include: {
          student: true
        },
        orderBy: { achieved_date: 'desc' }
      });
    } else {
      achievements = await prisma.achievement.findMany({
        where: {
          student: {
            parent_id: user.id
          }
        },
        include: {
          student: true
        },
        orderBy: { achieved_date: 'desc' }
      });
    }

    res.json(achievements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

export const getStudentAchievements = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const achievements = await prisma.achievement.findMany({
      where: { student_id: studentId as string },
      orderBy: { achieved_date: 'desc' }
    });
    res.json(achievements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch student achievements' });
  }
};

export const evaluateAchievements = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'TUTOR') {
      return res.status(403).json({ error: 'Only tutors can evaluate achievements' });
    }

    // Get all active students for this tutor
    const students = await prisma.student.findMany({
      where: {
        tutor_id: user.id,
        status: 'ACTIVE'
      }
    });

    let generatedCount = 0;

    for (const student of students) {
      // Get the last evaluation date or start of time
      const lastAchievement = await prisma.achievement.findFirst({
        where: { student_id: student.id },
        orderBy: { achieved_date: 'desc' }
      });

      const dateFilter = lastAchievement ? { gt: lastAchievement.achieved_date } : undefined;

      // Get completed sessions since last achievement
      const sessions = await prisma.session.findMany({
        where: {
          schedule: {
            student_id: student.id,
            status: 'COMPLETED',
            date: dateFilter
          }
        },
        include: {
          schedule: true
        },
        orderBy: {
          schedule: { date: 'asc' }
        }
      });

      // We only evaluate if there are at least 10 sessions completed since last achievement
      if (sessions.length >= 10) {
        // Take exactly the first 10 to evaluate
        const evalSessions = sessions.slice(0, 10);
        
        // 1. Calculate Attendance
        const presentCount = evalSessions.filter(s => s.attendance === 'PRESENT').length;
        const attendanceRate = (presentCount / 10) * 100;

        // 2. Calculate Homework Rate & Score
        const startDate = evalSessions[0].schedule.date;
        const endDate = evalSessions[9].schedule.date;

        const homeworks = await prisma.homework.findMany({
          where: {
            student_id: student.id,
            due_date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const totalHomeworks = homeworks.length;
        let submittedHomeworks = 0;
        let totalScore = 0;
        let gradedCount = 0;

        homeworks.forEach(hw => {
          if (hw.status === 'SUBMITTED' || hw.status === 'GRADED') {
            submittedHomeworks++;
          }
          if (hw.score !== null) {
            totalScore += hw.score;
            gradedCount++;
          }
        });

        const homeworkRate = totalHomeworks > 0 ? (submittedHomeworks / totalHomeworks) * 100 : 100; // if no homework assigned, default 100%
        const avgScore = gradedCount > 0 ? (totalScore / gradedCount) : 10.0; // if no graded homework, default 10

        // Check conditions
        if (attendanceRate >= 90 && homeworkRate >= 92 && avgScore >= 8.0) {
          await prisma.achievement.create({
            data: {
              student_id: student.id,
              title: 'Học sinh Xuất sắc',
              description: `Hoàn thành 10 buổi học với thành tích xuất sắc.`,
              metrics: JSON.stringify({
                attendanceRate,
                homeworkRate,
                avgScore
              }),
              achieved_date: new Date()
            }
          });
          generatedCount++;
        }
      }
    }

    res.json({ message: 'Đánh giá hoàn tất', generated: generatedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to evaluate achievements' });
  }
};
