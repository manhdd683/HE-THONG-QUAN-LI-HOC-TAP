import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendSessionFeedbackNotification } from '../utils/mailer';


export const getSchedules = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let schedules;

    if (user.role === 'TUTOR') {
      schedules = await prisma.schedule.findMany({
        where: {
          student: {
            tutor_id: user.id as string
          }
        },
        include: {
          student: true,
          session: {
            include: { comments: true }
          }
        },
        orderBy: { date: 'asc' }
      });
    } else {
      schedules = await prisma.schedule.findMany({
        where: {
          student: {
            parent_id: user.id as string
          }
        },
        include: {
          student: true,
          session: {
            include: { comments: true }
          }
        },
        orderBy: { date: 'asc' }
      });
    }

    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const { student_id, subject, date, start_time, end_time, format, location, notes, recurring_weeks } = req.body;
    
    // Check if student belongs to tutor
    const user = (req as any).user;
    if (user.role === 'TUTOR') {
      const student = await prisma.student.findUnique({ where: { id: student_id } });
      if (student?.tutor_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized for this student' });
      }
    }

    const weeksToRepeat = parseInt(recurring_weeks) || 0;
    const totalSchedules = weeksToRepeat > 0 ? weeksToRepeat : 1;
    
    const schedulesData = [];
    const baseDate = new Date(date);

    for (let i = 0; i < totalSchedules; i++) {
      const scheduleDate = new Date(baseDate);
      scheduleDate.setDate(baseDate.getDate() + (i * 7));

      schedulesData.push({
        student_id,
        subject,
        date: scheduleDate,
        start_time,
        end_time,
        format,
        location,
        notes
      });
    }

    if (schedulesData.length === 1) {
      const schedule = await prisma.schedule.create({
        data: schedulesData[0]
      });
      res.status(201).json(schedule);
    } else {
      await prisma.schedule.createMany({
        data: schedulesData
      });
      res.status(201).json({ message: `Created ${schedulesData.length} schedules` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};
export const updateScheduleStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const schedule = await prisma.schedule.update({
      where: { id },
      data: { status }
    });
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { subject, date, start_time, end_time, format, location, notes } = req.body;
    
    const schedule = await prisma.schedule.update({
      where: { id },
      data: { subject, date: new Date(date), start_time, end_time, format, location, notes }
    });
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const session = await prisma.session.findUnique({ 
      where: { schedule_id: id },
      include: { schedule: true }
    });
    
    if (session) {
      if (session.tuition_cycle_id) {
        const cycle = await prisma.tuitionCycle.findUnique({ where: { id: session.tuition_cycle_id } });
        if (cycle) {
          let priceToDeduct = 0;
          const subjectToUse = session.schedule.subject;
          const studentSubject = await prisma.studentSubject.findFirst({
            where: { student_id: session.schedule.student_id, subject: subjectToUse }
          });
          if (studentSubject) {
            priceToDeduct = studentSubject.price_per_session;
          } else {
            const student = await prisma.student.findUnique({ where: { id: session.schedule.student_id } });
            priceToDeduct = student?.price_per_session || 0;
          }

          if (cycle.completed_sessions <= 1 && cycle.status === 'UNPAID') {
            await prisma.tuitionCycle.delete({ where: { id: cycle.id } });
          } else {
            await prisma.tuitionCycle.update({
              where: { id: cycle.id },
              data: {
                completed_sessions: { decrement: 1 },
                total_amount: { decrement: priceToDeduct }
              }
            });
          }
        }
      }

      await prisma.comment.deleteMany({ where: { session_id: session.id } });
      const scores = await prisma.score.findMany({ where: { session_id: session.id } });
      if (scores.length > 0) {
        const scoreIds = scores.map(s => s.id);
        await prisma.scoreHistory.deleteMany({ where: { score_id: { in: scoreIds } } });
      }
      await prisma.score.deleteMany({ where: { session_id: session.id } });
      await prisma.session.delete({ where: { schedule_id: id } });
    }
    
    await prisma.schedule.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const id = req.params.schedule_id as string;
    
    const session = await prisma.session.findUnique({ 
      where: { schedule_id: id },
      include: { schedule: true }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    if (session.tuition_cycle_id) {
      const cycle = await prisma.tuitionCycle.findUnique({ where: { id: session.tuition_cycle_id } });
      if (cycle) {
        let priceToDeduct = 0;
        const subjectToUse = session.schedule.subject;
        const studentSubject = await prisma.studentSubject.findFirst({
          where: { student_id: session.schedule.student_id, subject: subjectToUse }
        });
        if (studentSubject) {
          priceToDeduct = studentSubject.price_per_session;
        } else {
          const student = await prisma.student.findUnique({ where: { id: session.schedule.student_id } });
          priceToDeduct = student?.price_per_session || 0;
        }

        if (cycle.completed_sessions <= 1 && cycle.status === 'UNPAID') {
          await prisma.tuitionCycle.delete({ where: { id: cycle.id } });
        } else {
          await prisma.tuitionCycle.update({
            where: { id: cycle.id },
            data: {
              completed_sessions: { decrement: 1 },
              total_amount: { decrement: priceToDeduct }
            }
          });
        }
      }
    }

    await prisma.comment.deleteMany({ where: { session_id: session.id } });
    const scores = await prisma.score.findMany({ where: { session_id: session.id } });
    if (scores.length > 0) {
      const scoreIds = scores.map(s => s.id);
      await prisma.scoreHistory.deleteMany({ where: { score_id: { in: scoreIds } } });
    }
    await prisma.score.deleteMany({ where: { session_id: session.id } });
    await prisma.session.delete({ where: { schedule_id: id } });

    await prisma.schedule.update({
      where: { id },
      data: { status: 'SCHEDULED' }
    });

    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const schedule_id = req.params.schedule_id as string;
    const { attendance, actual_subject, content, understanding_level, attitude, strengths, weaknesses, record_link } = req.body;

    const schedule = await prisma.schedule.findUnique({ where: { id: schedule_id } });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const existingSession = await prisma.session.findUnique({ where: { schedule_id } });

    const session = await prisma.session.upsert({
      where: { schedule_id },
      update: { attendance, content, record_link },
      create: { schedule_id, attendance, content, record_link }
    });

    if (understanding_level || attitude || strengths || weaknesses) {
      const existingComment = await prisma.comment.findFirst({ where: { session_id: session.id } });
      if (existingComment) {
        await prisma.comment.update({
          where: { id: existingComment.id },
          data: { content: content || '', understanding_level, attitude, strengths, weaknesses }
        });
      } else {
        await prisma.comment.create({
          data: { session_id: session.id, content: content || '', understanding_level, attitude, strengths, weaknesses }
        });
      }
    }

    await prisma.schedule.update({
      where: { id: schedule_id },
      data: { 
        status: 'COMPLETED',
        ...(actual_subject && { subject: actual_subject })
      }
    });

    if (attendance === 'PRESENT' && (!existingSession || existingSession.attendance !== 'PRESENT')) {
      const potentialCycles = await prisma.tuitionCycle.findMany({
        where: { student_id: schedule.student_id, status: { in: ['UNPAID', 'PARTIAL'] } },
        orderBy: { start_date: 'asc' }
      });

      let activeCycle = potentialCycles.find(c => c.completed_sessions < c.total_sessions);

      if (!activeCycle) {
        const cycleCount = await prisma.tuitionCycle.count({ where: { student_id: schedule.student_id } });
        activeCycle = await prisma.tuitionCycle.create({
          data: {
            student_id: schedule.student_id,
            name: 'Chu kỳ ' + (cycleCount + 1),
            subject: null, 
            start_date: new Date(),
            total_sessions: 10,
            price_per_session: 0,
            total_amount: 0,
            status: 'UNPAID',
            completed_sessions: 0
          }
        });
      }

      await prisma.session.update({
        where: { id: session.id },
        data: { tuition_cycle_id: activeCycle.id }
      });

      let priceToAdd = 0;
      const subjectToUse = actual_subject || schedule.subject;
      const studentSubject = await prisma.studentSubject.findFirst({
        where: { student_id: schedule.student_id, subject: subjectToUse }
      });
      if (studentSubject) {
        priceToAdd = studentSubject.price_per_session;
      } else {
        const student = await prisma.student.findUnique({ where: { id: schedule.student_id } });
        priceToAdd = student?.price_per_session || 0;
      }

      await prisma.tuitionCycle.update({
        where: { id: activeCycle.id },
        data: {
          completed_sessions: { increment: 1 },
          ...(priceToAdd > 0 && { total_amount: { increment: priceToAdd } })
        }
      });
    } else if (attendance !== 'PRESENT' && existingSession?.attendance === 'PRESENT' && existingSession.tuition_cycle_id) {
      const cycle = await prisma.tuitionCycle.findUnique({ where: { id: existingSession.tuition_cycle_id } });
      if (cycle) {
        let priceToDeduct = 0;
        const subjectToUse = actual_subject || schedule.subject;
        const studentSubject = await prisma.studentSubject.findFirst({
          where: { student_id: schedule.student_id, subject: subjectToUse }
        });
        if (studentSubject) {
          priceToDeduct = studentSubject.price_per_session;
        } else {
          const student = await prisma.student.findUnique({ where: { id: schedule.student_id } });
          priceToDeduct = student?.price_per_session || 0;
        }

        if (cycle.completed_sessions <= 1 && cycle.status === 'UNPAID') {
          await prisma.tuitionCycle.delete({ where: { id: cycle.id } });
        } else {
          await prisma.tuitionCycle.update({
            where: { id: cycle.id },
            data: {
              completed_sessions: { decrement: 1 },
              total_amount: { decrement: priceToDeduct }
            }
          });
        }
      }
      await prisma.session.update({
        where: { id: session.id },
        data: { tuition_cycle_id: null }
      });
    }

    try {
      if (attendance === 'PRESENT' && (content || strengths || weaknesses || attitude || understanding_level)) {
        const studentWithParent = await prisma.student.findUnique({
          where: { id: schedule.student_id },
          include: { parent: true }
        });

        if (studentWithParent?.parent?.email) {
          let feedbackText = '';
          if (content) feedbackText += `- Nội dung bài học: ${content}\n`;
          if (understanding_level) feedbackText += `- Mức độ hiểu bài: ${understanding_level}\n`;
          if (attitude) feedbackText += `- Thái độ học tập: ${attitude}\n`;
          if (strengths) feedbackText += `- Điểm mạnh: ${strengths}\n`;
          if (weaknesses) feedbackText += `- Cần cải thiện: ${weaknesses}\n`;

          const { sendSessionFeedbackNotification } = require('../utils/mailer');
          sendSessionFeedbackNotification(
            studentWithParent.parent.email,
            studentWithParent.name,
            schedule.date,
            feedbackText
          ).catch(console.error);
        }
      }
    } catch (e) {
      console.error('Failed to send email:', e);
    }

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};