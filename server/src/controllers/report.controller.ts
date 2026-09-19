import { Request, Response } from 'express';
import prisma from '../prisma';

export const getStudentReport = async (req: Request, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const { month, year } = req.query;

    let startDate, endDate;
    if (month && year) {
      startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Ensure student exists and user has access
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

    // Get attendance stats (from sessions inside the month)
    const sessions = await prisma.session.findMany({
      where: {
        schedule: {
          student_id: studentId,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        schedule: true,
        comments: true
      }
    });

    const totalSessions = sessions.length;
    const presentSessions = sessions.filter(s => s.attendance === 'PRESENT').length;
    const absentSessions = sessions.filter(s => s.attendance === 'ABSENT').length;

    // Get homeworks
    const homeworks = await prisma.homework.findMany({
      where: {
        student_id: studentId,
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalHomeworks = homeworks.length;
    const completedHomeworks = homeworks.filter(h => h.status === 'GRADED' || h.status === 'SUBMITTED').length;
    
    const gradedHomeworks = homeworks.filter(h => h.score !== null);
    const averageScore = gradedHomeworks.length > 0 
      ? gradedHomeworks.reduce((sum, hw) => sum + (hw.score || 0), 0) / gradedHomeworks.length
      : null;

    // Get Tuition Cycles active during this period (or just fetch all for the student and filter)
    const tuitionCycles = await prisma.tuitionCycle.findMany({
      where: {
        student_id: studentId
      }
    });
    
    // Simple estimation: total present sessions * average price per session of the active cycle, or latest cycle
    const latestCycle = tuitionCycles.length > 0 ? tuitionCycles[tuitionCycles.length - 1] : null;
    const pricePerSession = latestCycle ? latestCycle.price_per_session : 0;
    const estimatedTuition = presentSessions * pricePerSession;

    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
    const homeworkRate = totalHomeworks > 0 ? Math.round((completedHomeworks / totalHomeworks) * 100) : 0;
    
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

    let finalComment = allComments.join(' | ');
    if (!finalComment) {
      if (attendanceRate >= 80 && homeworkRate >= 80) {
        finalComment = 'Học sinh tham gia học tập đầy đủ, thái độ tốt và hoàn thành phần lớn bài tập được giao. Cần tiếp tục phát huy.';
      } else if (attendanceRate < 50) {
        finalComment = 'Học sinh vắng mặt khá nhiều trong kỳ này, ảnh hưởng đến việc tiếp thu kiến thức. Cần cải thiện chuyên cần.';
      } else {
        finalComment = 'Học sinh có tham gia học tập, nhưng cần cố gắng hoàn thành bài tập đầy đủ và tập trung hơn trong giờ học.';
      }
    }

    res.json({
      student: { name: student.name, code: student.student_code },
      period: { startDate, endDate },
      attendance: {
        total: totalSessions,
        present: presentSessions,
        absent: absentSessions,
        rate: attendanceRate
      },
      homework: {
        total: totalHomeworks,
        completed: completedHomeworks,
        averageScore,
        rate: homeworkRate
      },
      ranking: gradeRanking,
      aggregatedComment: finalComment,
      tuition: {
        estimatedAmount: estimatedTuition,
        pricePerSession: pricePerSession,
        cycles: tuitionCycles
      },
      homeworkList: homeworks,
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
