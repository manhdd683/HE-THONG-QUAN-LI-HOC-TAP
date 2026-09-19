import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

// Secret keys for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Mock in-memory OTP storage (In production, use Redis or DB with TTL)
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc không hoạt động' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Valid for 3 minutes
    const expiresAt = Date.now() + 3 * 60 * 1000; 
    otpStore.set(email, { otp, expiresAt });

    // Send email via EmailJS REST API
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_zap1mzf',
        template_id: 'template_gxu9svo',
        user_id: process.env.EMAILJS_PUBLIC_KEY, // Note: You need this in your .env
        accessToken: process.env.EMAILJS_PRIVATE_KEY, // If required
        template_params: {
          to_email: email,
          otp_code: otp,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS Error:', errorText);
      return res.status(500).json({ message: 'Không thể gửi email OTP' });
    }

    res.json({ message: 'OTP đã được gửi đến email của bạn' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'OTP không chính xác hoặc đã hết hạn' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'OTP không chính xác' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { password_hash },
    });

    // Invalidate OTP after success
    otpStore.delete(email);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const requestEmailChange = async (req: Request, res: Response) => {
  try {
    const { newEmail } = req.body;
    const userId = (req as any).user?.id;

    if (!newEmail) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email mới' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pending_email: newEmail }
    });

    res.json({ message: 'Đã gửi yêu cầu đổi email. Vui lòng chờ gia sư phê duyệt.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getPendingEmailRequests = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        pending_email: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        pending_email: true,
        role: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const approveEmailChange = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || !user.pending_email) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        email: user.pending_email,
        pending_email: null
      }
    });

    res.json({ message: 'Đã phê duyệt đổi email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const rejectEmailChange = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    await prisma.user.update({
      where: { id },
      data: { pending_email: null }
    });

    res.json({ message: 'Đã từ chối yêu cầu đổi email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
