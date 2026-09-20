import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendHomeworkNotification } from '../utils/mailer';

export const getHomeworks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let homeworks;

    if (user.role === 'TUTOR') {
      homeworks = await prisma.homework.findMany({
        where: {
          student: {
            tutor_id: user.id as string
          }
        },
        include: {
          student: true,
          attachments: true
        },
        orderBy: { due_date: 'asc' }
      });
    } else {
      homeworks = await prisma.homework.findMany({
        where: {
          student: {
            parent_id: user.id as string
          }
        },
        include: {
          student: true,
          attachments: true
        },
        orderBy: { due_date: 'asc' }
      });
    }

    res.json(homeworks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch homeworks' });
  }
};

export const createHomework = async (req: Request, res: Response) => {
  try {
    const { student_id, title, subject, description, due_date, attachments } = req.body;
    
    // Check if student belongs to tutor
    const user = (req as any).user;
    if (user.role === 'TUTOR') {
      const student = await prisma.student.findUnique({ where: { id: student_id } });
      if (student?.tutor_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized for this student' });
      }
    }

    const homework = await prisma.homework.create({
      data: {
        student_id,
        title,
        subject,
        description,
        due_date: due_date ? new Date(due_date) : null,
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map((att: any) => ({
            title: att.title,
            type: att.type,
            url: att.url
          }))
        } : undefined
      },
      include: {
        student: true,
        attachments: true
      }
    });

    // Send email notification to parent
    const studentWithParent = await prisma.student.findUnique({
      where: { id: student_id },
      include: { parent: true }
    });

    if (studentWithParent?.parent?.email) {
      // Don't await email so it doesn't block response
      sendHomeworkNotification(
        studentWithParent.parent.email,
        studentWithParent.name,
        homework.title,
        homework.due_date
      ).catch(console.error);
    }

    res.status(201).json(homework);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create homework' });
  }
};

export const gradeHomework = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { score, feedback, status } = req.body;

    const homework = await prisma.homework.update({
      where: { id },
      data: { 
        score: score ? parseFloat(score) : null,
        feedback,
        status: status || 'GRADED',
        graded_date: new Date()
      },
      include: {
        student: true
      }
    });
    res.json(homework);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to grade homework' });
  }
};

export const updateHomeworkStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, submission_text, submission_url } = req.body;

    const updateData: any = { status };
    if (submission_text !== undefined) updateData.submission_text = submission_text;
    if (submission_url !== undefined) updateData.submission_url = submission_url;
    if (status === 'SUBMITTED') updateData.submission_date = new Date();

    const homework = await prisma.homework.update({
      where: { id },
      data: updateData,
      include: {
        student: true
      }
    });
    res.json(homework);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update homework status' });
  }
};
