import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const isTutor = req.user?.role === 'TUTOR';
    
    // If Tutor, fetch all their students. If Parent, fetch only their children.
    const whereClause = isTutor
      ? { tutor_id: req.user?.id, status: { not: 'ARCHIVED' } }
      : { parent_id: req.user?.id, status: { not: 'ARCHIVED' } };

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        parent: {
          select: { name: true, email: true, phone: true }
        },
        student_subjects: true
      }
    });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        student_subjects: true
      }
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }
    
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const { 
      name, parent_id, dob, gender, 
      school, grade, student_subjects, start_date,
      parentMode, parent_name, parent_email, parent_phone
    } = req.body;
    
    let finalParentId = parent_id;

    if (parentMode === 'create') {
      if (!parent_email || !parent_name) {
        return res.status(400).json({ message: 'Vui lòng nhập họ tên và email của phụ huynh' });
      }
      
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: parent_email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email phụ huynh đã tồn tại trong hệ thống. Vui lòng chọn phụ huynh có sẵn.' });
      }

      const bcrypt = require('bcryptjs');
      const password_hash = await bcrypt.hash('123456', 10);

      const newParent = await prisma.user.create({
        data: {
          email: parent_email,
          name: parent_name,
          phone: parent_phone,
          password_hash,
          role: 'PARENT'
        }
      });
      finalParentId = newParent.id;
    }

    if (!finalParentId) {
      return res.status(400).json({ message: 'Cần chọn hoặc tạo mới phụ huynh' });
    }

    // Auto-generate student_code (e.g., HS001, HS002)
    const lastStudent = await prisma.student.findFirst({
      orderBy: { student_code: 'desc' }
    });
    let nextNum = 1;
    if (lastStudent && lastStudent.student_code.startsWith('HS')) {
      const numPart = parseInt(lastStudent.student_code.replace('HS', ''), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }
    const student_code = `HS${nextNum.toString().padStart(3, '0')}`;

    // Handle subjects array
    const subjectData = Array.isArray(student_subjects) 
      ? student_subjects.map((s: any) => ({
          subject: s.subject || '',
          price_per_session: parseFloat(s.price_per_session) || 0
        }))
      : [];

    const student = await prisma.student.create({
      data: {
        name,
        student_code,
        parent_id: finalParentId,
        tutor_id: req.user.id,
        dob: dob ? new Date(dob) : null,
        gender,
        school,
        grade,
        start_date: start_date ? new Date(start_date) : null,
        status: 'ACTIVE',
        student_subjects: {
          create: subjectData
        }
      },
      include: {
        student_subjects: true
      }
    });

    res.status(201).json(student);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Mã học sinh đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi server: ' + (error.message || 'Unknown error') });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const id = req.params.id as string;
    const { 
      name, parent_id, dob, gender, 
      school, grade, student_subjects, start_date, status 
    } = req.body;

    const subjectData = Array.isArray(student_subjects) 
      ? student_subjects.map((s: any) => ({
          subject: s.subject || '',
          price_per_session: parseFloat(s.price_per_session) || 0
        }))
      : [];

    // Use transaction to update student and replace subjects
    const student = await prisma.$transaction(async (tx) => {
      // 1. Delete old subjects
      await tx.studentSubject.deleteMany({
        where: { student_id: id }
      });

      // 2. Update student and create new subjects
      return tx.student.update({
        where: { id },
        data: {
          name,
          parent_id,
          dob: dob ? new Date(dob) : null,
          gender,
          school,
          grade,
          start_date: start_date ? new Date(start_date) : null,
          status,
          student_subjects: {
            create: subjectData
          }
        },
        include: {
          student_subjects: true
        }
      });
    });

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getStudentScores = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id as string;
    
    // Authorization check
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }
    
    if (req.user?.role === 'TUTOR' && student.tutor_id !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền' });
    }
    
    if (req.user?.role === 'PARENT' && student.parent_id !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const homeworks = await prisma.homework.findMany({
      where: { 
        student_id: studentId,
        status: 'GRADED',
        score: { not: null }
      },
      select: {
        id: true,
        title: true,
        subject: true,
        score: true,
        graded_date: true
      },
      orderBy: { graded_date: 'desc' }
    });

    res.json({ homeworks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'TUTOR') {
      return res.status(403).json({ message: 'Không có quyền' });
    }
    const id = req.params.id as string;
    
    // Soft delete by updating status to ARCHIVED
    await prisma.student.update({
      where: { id, tutor_id: req.user.id },
      data: { status: 'ARCHIVED' }
    });

    res.json({ message: 'Đã xóa học sinh (soft delete)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
