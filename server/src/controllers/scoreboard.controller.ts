import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendScoreBoardNotification } from '../utils/mailer';

export const getStudentScoreBoards = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    
    // Auto-create scoreboards for existing subjects if they don't have an active (unapproved) board
    const subjects = await prisma.studentSubject.findMany({
      where: { student_id: studentId }
    });
    
    for (const sub of subjects) {
      const existingUnapproved = await prisma.subjectScoreBoard.findFirst({
          where: {
            student_id: studentId,
            subject: sub.subject,
            is_approved: false
          }
        });
        
        if (!existingUnapproved) {
        await prisma.subjectScoreBoard.create({
          data: {
            student_id: studentId,
            subject: sub.subject,
            title: `Bảng điểm mới ${sub.subject}`
          }
        });
      }
    }
    
    const boards = await prisma.subjectScoreBoard.findMany({
      where: { student_id: studentId },
      include: {
        cycle: {
          select: { id: true, name: true, start_date: true, end_date: true, completed_sessions: true, total_sessions: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createScoreBoard = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    const { subject, title, cycle_id } = req.body;
    const board = await prisma.subjectScoreBoard.create({
      data: {
        student_id: studentId,
        subject,
        title: title || `Bảng điểm mới ${subject}`,
        cycle_id: cycle_id || null
      }
    });
    res.json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateScoreBoard = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      title,
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
    
    const updateData: any = {
      daily_score: daily_score === '' ? null : daily_score,
      homework_1: homework_1 === '' ? null : homework_1,
      homework_2: homework_2 === '' ? null : homework_2,
      quiz_1: quiz_1 === '' ? null : quiz_1,
      quiz_2: quiz_2 === '' ? null : quiz_2,
      final_score: final_score === '' ? null : final_score,
      average_score
    };
    
    if (title !== undefined) updateData.title = title;
    
    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: updateData
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

    // Get the board being approved (including student subjects)
    const boardToApprove = await prisma.subjectScoreBoard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            parent: true,
            student_subjects: true
          }
        }
      }
    });

    if (!boardToApprove) {
      return res.status(404).json({ message: 'Không tìm thấy bảng điểm' });
    }

    // Mark as approved
    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: { is_approved: true },
      include: {
        student: {
          include: { parent: true }
        }
      }
    });

    // -------------------------------------------------------
    // Auto-create NEW scoreboards for ALL subjects of this student
    // that don't already have an active (unapproved) board.
    // This handles multi-subject students properly.
    // -------------------------------------------------------
    const allSubjects = boardToApprove.student.student_subjects;

    // Find the latest active tuition cycle for this student (to link the new board)
    const latestCycle = await prisma.tuitionCycle.findFirst({
      where: {
        student_id: boardToApprove.student_id,
        status: { in: ['UNPAID', 'PARTIAL', 'PAID'] }
      },
      orderBy: { created_at: 'desc' }
    });

    for (const sub of allSubjects) {
      const existingActive = await prisma.subjectScoreBoard.findFirst({
        where: {
          student_id: boardToApprove.student_id,
          subject: sub.subject,
          is_approved: false
        }
      });

      if (!existingActive) {
        await prisma.subjectScoreBoard.create({
          data: {
            student_id: boardToApprove.student_id,
            subject: sub.subject,
            title: `Bảng điểm mới ${sub.subject}`,
            cycle_id: latestCycle?.id || null
          }
        });
      }
    }

    // Send email notification to parent
    if (board.student.parent?.email) {
      sendScoreBoardNotification(board.student.parent.email, board.student.name, board.subject).catch(console.error);
    }

    res.json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Link a scoreboard to a specific tuition cycle.
 * Called when a new cycle is created or manually linked.
 */
export const linkScoreBoardToCycle = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { cycle_id } = req.body;

    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: { cycle_id: cycle_id || null }
    });

    res.json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
