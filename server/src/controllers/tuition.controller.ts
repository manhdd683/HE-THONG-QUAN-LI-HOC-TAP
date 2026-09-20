import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendTuitionNotification } from '../utils/mailer';

export const getTuitionCycles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let cycles;

    if (user.role === 'TUTOR') {
      cycles = await prisma.tuitionCycle.findMany({
        where: {
          student: {
            tutor_id: user.id as string
          }
        },
        include: {
          student: true
        },
        orderBy: { start_date: 'desc' }
      });
    } else {
      cycles = await prisma.tuitionCycle.findMany({
        where: {
          student: {
            parent_id: user.id as string
          }
        },
        include: {
          student: true
        },
        orderBy: { start_date: 'desc' }
      });
    }

    res.json(cycles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tuition cycles' });
  }
};

export const createTuitionCycle = async (req: Request, res: Response) => {
  try {
    const { student_id, name, subject, total_sessions, price_per_session } = req.body;
    
    // Check if student belongs to tutor
    const user = (req as any).user;
    if (user.role === 'TUTOR') {
      const student = await prisma.student.findUnique({ where: { id: student_id } });
      if (student?.tutor_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized for this student' });
      }
    }

    // Dynamic pricing if no subject is provided
    let final_price = 0;
    let total_amount = 0;
    
    if (subject && subject.trim() !== '') {
      final_price = parseFloat(price_per_session) || 0;
      total_amount = parseInt(total_sessions) * final_price;
    }

    const cycle = await prisma.tuitionCycle.create({
      data: {
        student_id,
        name,
        subject: subject || null,
        start_date: new Date(),
        total_sessions: parseInt(total_sessions),
        price_per_session: final_price,
        total_amount,
        status: 'UNPAID'
      },
      include: {
        student: true
      }
    });
    res.status(201).json(cycle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tuition cycle' });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, method, notes } = req.body;

    const parsedAmount = parseFloat(amount);

    const cycle = await prisma.tuitionCycle.findUnique({ where: { id } });
    if (!cycle) {
      return res.status(404).json({ error: 'Tuition cycle not found' });
    }

    const newPaidAmount = cycle.paid_amount + parsedAmount;
    let newStatus = cycle.status;

    if (newPaidAmount >= cycle.total_amount) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    // Create Payment record and update Cycle
    const [payment, updatedCycle] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          cycle_id: id,
          amount: parsedAmount,
          method: method || 'CASH',
          status: 'COMPLETED',
          notes
        }
      }),
      prisma.tuitionCycle.update({
        where: { id },
        data: {
          paid_amount: newPaidAmount,
          status: newStatus
        },
        include: {
          student: {
            include: { parent: true }
          }
        }
      })
    ]);

    // Send email if status became PAID
    if (newStatus === 'PAID' && updatedCycle.student?.parent?.email) {
      sendTuitionNotification(
        updatedCycle.student.parent.email,
        updatedCycle.student.name,
        updatedCycle.name
      ).catch(console.error);
    }

    res.json(updatedCycle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};
