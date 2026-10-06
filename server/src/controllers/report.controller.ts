import { Request, Response } from 'express';
import prisma from '../prisma';

export const getStudentReport = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const { cycleId } = req.query;

    const user = (req as any).user;
    const student = await prisma.student.findUnique({ 
      where: { id: studentId },
      include: { tutor: true }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (user.role === 'TUTOR' && student.tutor_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized for this student' });
    }
    if (user.role === 'PARENT' && student.parent_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized for this student' });
    }

    let cycle;
    if (cycleId) {
      cycle = await prisma.tuitionCycle.findUnique({ where: { id: cycleId as string } });
    } else {
      const cycles = await prisma.tuitionCycle.findMany({ where: { student_id: studentId }, orderBy: { start_date: 'desc' } });
      cycle = cycles[0];
    }

    if (!cycle) {
       return res.status(400).json({ error: 'Student has no tuition cycles' });
    }

    const startDate = cycle.start_date;
    const endDate = cycle.end_date || new Date();

    // Get attendance stats exactly matching this cycle
    const sessions = await prisma.session.findMany({
      where: {
        tuition_cycle_id: cycle.id
      },
      include: {
        schedule: true,
        comments: true
      },
      orderBy: {
        schedule: { date: 'asc' }
      }
    });

    const totalSessions = sessions.length;
    const presentSessions = sessions.filter(s => s.attendance === 'PRESENT').length;
    const absentSessions = sessions.filter(s => s.attendance === 'ABSENT').length;

    // Get scoreboards for this cycle specifically (approved OR linked to this cycle)
    let scoreboards = await prisma.subjectScoreBoard.findMany({
      where: { 
        student_id: studentId,
        OR: [
          { cycle_id: cycle.id, is_approved: true },
          { cycle_id: cycle.id, is_approved: false } // also include active board of this cycle
        ]
      }
    });

    // Fallback: if no scoreboards linked to this cycle, get all approved ones
    if (scoreboards.length === 0) {
        // Fetch all scoreboards for this student
        const allBoards = await prisma.subjectScoreBoard.findMany({
          where: { 
            student_id: studentId,
            ...(cycle.subject && cycle.subject.trim() !== '' ? { subject: cycle.subject } : {})
          },
          orderBy: { updated_at: 'desc' }
        });
        
        const subjectMap = new Map();
        
        // Group by subject
        for (const sb of allBoards) {
          if (!subjectMap.has(sb.subject)) {
            subjectMap.set(sb.subject, []);
          }
          subjectMap.get(sb.subject).push(sb);
        }
        
        scoreboards = [];
        for (const [subj, boards] of subjectMap.entries()) {
          const draftBoard = boards.find(b => b.is_approved === false);
          const latestApprovedBoard = boards.find(b => b.is_approved === true);
          
          // Check if latestApprovedBoard belongs to this cycle (updated after cycle start)
          const isApprovedBoardRecent = latestApprovedBoard && new Date(latestApprovedBoard.updated_at) >= new Date(cycle.start_date);
          const hasDraftScores = draftBoard && (draftBoard.daily_score !== null || draftBoard.homework_1 !== null || draftBoard.homework_2 !== null || draftBoard.quiz_1 !== null || draftBoard.quiz_2 !== null || draftBoard.final_score !== null || draftBoard.average_score !== null);
          
          if (hasDraftScores) {
            scoreboards.push(draftBoard);
          } else if (isApprovedBoardRecent) {
            scoreboards.push(latestApprovedBoard);
          } else if (draftBoard) {
            scoreboards.push(draftBoard);
          }
        }
      }

      // We don't have homework rate anymore, we'll just base it on the scoreboards average
    const validBoards = scoreboards.filter(b => b.average_score !== null);
    const averageScore = validBoards.length > 0 
      ? validBoards.reduce((sum, b) => sum + (b.average_score || 0), 0) / validBoards.length
      : null;

    const estimatedTuition = cycle.total_amount;
    const pricePerSession = cycle.price_per_session;

    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
    
    let gradeRanking = 'Chưa xếp loại';
    if (averageScore !== null) {
      if (averageScore >= 8) gradeRanking = 'Giỏi';
      else if (averageScore >= 6.5) gradeRanking = 'Khá';
      else if (averageScore >= 5) gradeRanking = 'Trung bình';
      else gradeRanking = 'Cần cố gắng';
    }

    // Aggregate comments
    let allComments: string[] = [];
    sessions.forEach(s => {
      s.comments.forEach((c: any) => {
        if (c.content) allComments.push(c.content);
        if (c.attitude) allComments.push(`Thái độ: ${c.attitude}`);
      });
    });

    let finalComment = allComments.join('. ');
    if (!finalComment) {
      if (attendanceRate >= 80 && (averageScore || 0) >= 6.5) {
        finalComment = 'Học sinh tham gia học tập đầy đủ, thái độ tốt và có kết quả khả quan. Cần tiếp tục phát huy.';
      } else if (attendanceRate < 50) {
        finalComment = 'Học sinh vắng mặt khá nhiều trong kỳ này, ảnh hưởng đến việc tiếp thu kiến thức. Cần cải thiện chuyên cần.';
      } else {
        finalComment = 'Học sinh có tham gia học tập, nhưng cần tập trung hơn trong giờ học.';
      }
    }

    res.json({
      student: { name: student.name, code: student.student_code },
      period: { startDate, endDate },
      cycleName: cycle.name,
      attendance: {
        total: totalSessions,
        present: presentSessions,
        absent: absentSessions,
        rate: attendanceRate
      },
      homework: {
        total: 0,
        completed: 0,
        averageScore,
        rate: 100 // dummy
      },
      ranking: gradeRanking,
      aggregatedComment: finalComment,
      tuition: {
        estimatedAmount: estimatedTuition,
        pricePerSession: pricePerSession,
        cycles: [cycle]
      },
      scoreboards: scoreboards, // return scoreboards instead of homeworkList
      sessionList: sessions,
      tutorName: student.tutor?.name || 'Gia sư'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const getReportHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let history;

    if (user.role === 'TUTOR') {
      history = await prisma.reportHistory.findMany({
        where: { created_by: user.id },
        include: { student: true },
        orderBy: { created_at: 'desc' }
      });
    } else {
      history = await prisma.reportHistory.findMany({
        where: { student: { parent_id: user.id } },
        include: { student: true, creator: true },
        orderBy: { created_at: 'desc' }
      });
    }

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
};

export const saveReportHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { student_id, name, report_type, start_date, end_date } = req.body;

    const report = await prisma.reportHistory.create({
      data: {
        student_id,
        created_by: user.id,
        report_type,
        name,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null
      }
    });

    // Also log activity
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        student_id,
        action: 'CREATED_REPORT',
        target_type: 'REPORT',
        target_id: report.id
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save report' });
  }
};
