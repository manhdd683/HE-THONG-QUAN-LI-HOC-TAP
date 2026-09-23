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
      // Get all approved scoreboards for this student
      const scoreboards = await prisma.subjectScoreBoard.findMany({
        where: {
          student_id: student.id,
          is_approved: true,
          average_score: { gte: 8.0 } // Excellent
        }
      });

      for (const board of scoreboards) {
        // Check if an achievement for this scoreboard already exists
        const existing = await prisma.achievement.findFirst({
          where: {
            student_id: student.id,
            title: { contains: board.subject }
          }
        });

        if (!existing) {
          // Generate certificate based on score
          let title = `Hoàn thành môn ${board.subject}`;
          let description = `Học sinh đã hoàn thành chương trình môn ${board.subject} với điểm trung bình ${board.average_score?.toFixed(1)}.`;
          
          if (board.average_score && board.average_score >= 8.0) {
            title = `Xuất sắc môn ${board.subject}`;
            description = `Học sinh đạt thành tích xuất sắc môn ${board.subject} với điểm trung bình ${board.average_score?.toFixed(1)}.`;
          }

          const metrics = JSON.stringify({
            scoreboard_id: board.id,
            subject: board.subject,
            avgScore: board.average_score
          });

          await prisma.achievement.create({
            data: {
              student_id: student.id,
              title,
              description,
              metrics,
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
