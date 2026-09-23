import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendScoreBoardNotification } from '../utils/mailer';

export const getStudentScoreBoards = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    
    // Auto-create scoreboards for existing subjects if they don't exist
    const subjects = await prisma.studentSubject.findMany({
      where: { student_id: studentId }
    });
    
    for (const sub of subjects) {
      const existing = await prisma.subjectScoreBoard.findUnique({
        where: {
          student_id_subject: {
            student_id: studentId,
            subject: sub.subject
          }
        }
      });
      
      if (!existing) {
        await prisma.subjectScoreBoard.create({
          data: {
            student_id: studentId,
            subject: sub.subject
          }
        });
      }
    }
    
    const boards = await prisma.subjectScoreBoard.findMany({
      where: { student_id: studentId }
    });
    
    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateScoreBoard = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      daily_score,
      homework_1,
      homework_2,
      quiz_1,
      quiz_2,
      final_score
    } = req.body;
    
    // Compute average if possible
    let average_score = null;
    let totalScore = 0;
    let totalWeight = 0;
    
    if (daily_score !== undefined && daily_score !== null && daily_score !== '') {
      totalScore += parseFloat(daily_score) * 0.15;
      totalWeight += 0.15;
    }
    if (homework_1 !== undefined && homework_1 !== null && homework_1 !== '') {
      totalScore += parseFloat(homework_1) * 0.10;
      totalWeight += 0.10;
    }
    if (homework_2 !== undefined && homework_2 !== null && homework_2 !== '') {
      totalScore += parseFloat(homework_2) * 0.10;
      totalWeight += 0.10;
    }
    if (quiz_1 !== undefined && quiz_1 !== null && quiz_1 !== '') {
      totalScore += parseFloat(quiz_1) * 0.10;
      totalWeight += 0.10;
    }
    if (quiz_2 !== undefined && quiz_2 !== null && quiz_2 !== '') {
      totalScore += parseFloat(quiz_2) * 0.10;
      totalWeight += 0.10;
    }
    if (final_score !== undefined && final_score !== null && final_score !== '') {
      totalScore += parseFloat(final_score) * 0.45;
      totalWeight += 0.45;
    }
    
    if (totalWeight > 0) {
      average_score = parseFloat((totalScore / totalWeight).toFixed(2));
    }
    
    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: {
        daily_score: daily_score === '' ? null : daily_score,
        homework_1: homework_1 === '' ? null : homework_1,
        homework_2: homework_2 === '' ? null : homework_2,
        quiz_1: quiz_1 === '' ? null : quiz_1,
        quiz_2: quiz_2 === '' ? null : quiz_2,
        final_score: final_score === '' ? null : final_score,
        average_score
      }
    });
    
    res.json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const approveScoreBoard = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: { is_approved: true },
      include: {
        student: {
          include: { parent: true }
        }
      }
    });

    if (board.student.parent?.email) {
      sendScoreBoardNotification(board.student.parent.email, board.student.name, board.subject).catch(console.error);
    }

    res.json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
