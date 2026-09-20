import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getParents = async (req: AuthRequest, res: Response) => {
  try {
    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT',
        status: { not: 'ARCHIVED' }
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        status: true,
        pending_email: true,
        created_at: true,
      },
    });
    res.json(parents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createParent = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, phone, address, password } = req.body;
    
    // BACKEND VALIDATION
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Mật khẩu là bắt buộc' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const parent = await prisma.user.create({
      data: {
        email,
        password_hash,
        name,
        phone,
        address,
        role: 'PARENT',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    // TODO: Send email to the parent with their credentials using EmailJS

    res.status(201).json(parent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateParent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, phone, address, status, password } = req.body;

    // BACKEND VALIDATION
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    const updateData: any = {
      name,
      phone,
      address,
      status,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const parent = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        status: true,
      }
    });

    res.json(parent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const requestEmailChange = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.user?.id;
    const { new_email } = req.body;
    
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!new_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: new_email } });
    if (existing) {
      return res.status(400).json({ message: 'Email này đã được sử dụng bởi người khác' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parentId },
      data: { pending_email: new_email },
      select: { id: true, email: true, pending_email: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const approveEmailChange = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = req.params.id as string;
    
    // Find the user to get pending_email
    const user = await prisma.user.findUnique({ where: { id: parentId } });
    
    if (!user || !user.pending_email) {
      return res.status(400).json({ message: 'Không có yêu cầu đổi email nào' });
    }

    // Check again if new email is taken
    const existing = await prisma.user.findUnique({ where: { email: user.pending_email } });
    if (existing) {
      return res.status(400).json({ message: 'Email này đã được đăng ký' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parentId },
      data: {
        email: user.pending_email,
        pending_email: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        status: true,
        pending_email: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteParent = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Soft delete by setting status to ARCHIVED
    await prisma.user.update({
      where: { id, role: 'PARENT' },
      data: { status: 'ARCHIVED' }
    });

    res.json({ message: 'Đã xóa phụ huynh (soft delete)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
