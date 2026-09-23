const fs = require('fs');
const file = 'server/src/controllers/report.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const newFunc = `export const getStudentReport = async (req: Request, res: Response) => {
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

    // Get scoreboards instead of homework
    const scoreboards = await prisma.subjectScoreBoard.findMany({
      where: { student_id: studentId },
      include: {
        scores: {
          include: { score_type: true }
        }
      }
    });

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
        if (c.attitude) allComments.push(\`Thái độ: \${c.attitude}\`);
      });
    });

    let finalComment = allComments.join(' | ');
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
};`;

const startIndex = content.indexOf('export const getStudentReport = async');
const endIndex = content.indexOf('export const getReportHistory');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newFunc + '\n\n' + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log('Fixed report controller');
} else {
  console.log('Markers not found');
}
