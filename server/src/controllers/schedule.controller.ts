import { Request, Response } from 'express';
import prisma from '../prisma';

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
    
    // Find session
    const session = await prisma.session.findUnique({ where: { schedule_id: id } });
    if (session) {
      await prisma.comment.deleteMany({ where: { session_id: session.id } });
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

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const schedule_id = req.params.schedule_id as string;
    const { attendance, actual_subject, content, understanding_level, attitude, strengths, weaknesses } = req.body;

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({ where: { id: schedule_id } });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Upsert session
    const session = await prisma.session.upsert({
      where: { schedule_id },
      update: {
        attendance,
        content
      },
      create: {
        schedule_id,
        attendance,
        content
      }
    });

    // Create or update comment for this session
    if (understanding_level || attitude || strengths || weaknesses) {
      const existingComment = await prisma.comment.findFirst({
        where: { session_id: session.id }
      });
      if (existingComment) {
        await prisma.comment.update({
          where: { id: existingComment.id },
          data: {
            content: content || '',
            understanding_level,
            attitude,
            strengths,
            weaknesses
          }
        });
      } else {
        await prisma.comment.create({
          data: {
            session_id: session.id,
            content: content || '',
            understanding_level,
            attitude,
            strengths,
            weaknesses
          }
        });
      }
    }

    // Also update schedule status to completed and set actual subject if attendance is marked
    await prisma.schedule.update({
      where: { id: schedule_id },
      data: { 
        status: 'COMPLETED',
        ...(actual_subject && { subject: actual_subject })
      }
    });

    // If attendance is PRESENT, increment the active TuitionCycle completed_sessions
    if (attendance === 'PRESENT') {
      const subjectToUse = actual_subject || schedule.subject;
      
      const activeCycle = await prisma.tuitionCycle.findFirst({
        where: {
          student_id: schedule.student_id,
          status: { in: ['UNPAID', 'PARTIAL'] },
          OR: [
            { subject: subjectToUse },
            { subject: null },
            { subject: '' }
          ]
        },
        orderBy: { start_date: 'asc' }
      });

      if (activeCycle) {
        let priceToAdd = 0;
        
        // If it's a general cycle (no subject), we need to look up the price of the specific subject taught
        if (!activeCycle.subject || activeCycle.subject.trim() === '') {
          const studentSubject = await prisma.studentSubject.findFirst({
            where: {
              student_id: schedule.student_id,
              subject: subjectToUse
            }
          });
          
          if (studentSubject) {
            priceToAdd = studentSubject.price_per_session;
          } else {
            // Fallback to student's default price
            const student = await prisma.student.findUnique({
              where: { id: schedule.student_id }
            });
            priceToAdd = student?.price_per_session || 0;
          }
        }

        await prisma.tuitionCycle.update({
          where: { id: activeCycle.id },
          data: {
            completed_sessions: {
              increment: 1
            },
            ...(priceToAdd > 0 && {
              total_amount: {
                increment: priceToAdd
              }
            })
          }
        });
      }
    }

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};
