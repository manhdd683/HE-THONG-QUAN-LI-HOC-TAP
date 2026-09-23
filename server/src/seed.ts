import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash('123456', salt);

  // 1. Create or Update Users
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@example.com' },
    update: { password_hash, name: 'Nguyễn Văn Gia Sư' },
    create: {
      email: 'tutor@example.com',
      password_hash,
      name: 'Nguyễn Văn Gia Sư',
      role: 'TUTOR',
      phone: '0901234567'
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: { password_hash, name: 'Trần Thị Phụ Huynh' },
    create: {
      email: 'parent@example.com',
      password_hash,
      name: 'Trần Thị Phụ Huynh',
      role: 'PARENT',
      phone: '0987654321'
    },
  });

  // 2. Create Student
  const student = await prisma.student.upsert({
    where: { student_code: 'HS2024-001' },
    update: { tutor_id: tutor.id, parent_id: parent.id },
    create: {
      student_code: 'HS2024-001',
      name: 'Lê Quỳnh Chi',
      dob: new Date('2012-05-15'),
      gender: 'Nữ',
      school: 'THCS Lê Lợi',
      grade: 'Lớp 7',
      subject: 'Toán học, Tiếng Anh',
      price_per_session: 250000,
      tutor_id: tutor.id,
      parent_id: parent.id,
      status: 'ACTIVE',
      start_date: new Date('2024-01-01')
    }
  });

  // 3. Create Subjects
  await prisma.studentSubject.deleteMany({ where: { student_id: student.id } });
  await prisma.studentSubject.createMany({
    data: [
      { student_id: student.id, subject: 'Toán học', price_per_session: 250000 },
      { student_id: student.id, subject: 'Tiếng Anh', price_per_session: 200000 }
    ]
  });

  // 4. Create Schedules & Sessions & Scores & Comments (10 sessions to qualify for achievement)
  await prisma.achievement.deleteMany({ where: { student_id: student.id } });
  
  const schedules = await prisma.schedule.findMany({ where: { student_id: student.id } });
  for (const s of schedules) {
    const session = await prisma.session.findUnique({ where: { schedule_id: s.id } });
    if (session) {
      await prisma.comment.deleteMany({ where: { session_id: session.id } });
      const scores = await prisma.score.findMany({ where: { session_id: session.id } });
      if (scores.length > 0) {
        await prisma.scoreHistory.deleteMany({ where: { score_id: { in: scores.map(sc => sc.id) } } });
        await prisma.score.deleteMany({ where: { session_id: session.id } });
      }
      await prisma.session.delete({ where: { schedule_id: s.id } });
    }
  }
  await prisma.schedule.deleteMany({ where: { student_id: student.id } });

  // Generate 10 completed sessions
  const now = new Date();
  for (let i = 10; i >= 1; i--) {
    const scheduleDate = new Date();
    scheduleDate.setDate(now.getDate() - i * 3); // Every 3 days

    const schedule = await prisma.schedule.create({
      data: {
        student_id: student.id,
        subject: i % 2 === 0 ? 'Toán học' : 'Tiếng Anh',
        date: scheduleDate,
        start_time: '18:00',
        end_time: '19:30',
        format: 'OFFLINE',
        location: 'Nhà học sinh',
        notes: `Buổi học thứ ${11 - i}`,
        status: 'COMPLETED'
      }
    });

    const session = await prisma.session.create({
      data: {
        schedule_id: schedule.id,
        attendance: 'PRESENT',
        content: i % 2 === 0 ? 'Luyện tập phương trình' : 'Ngữ pháp cơ bản',
      }
    });

    await prisma.comment.create({
      data: {
        session_id: session.id,
        content: 'Cháu tiếp thu bài tốt, thái độ học tập nghiêm túc.',
        understanding_level: 'Khá',
        attitude: 'Tốt',
        strengths: 'Chăm chỉ',
        weaknesses: 'Tính toán còn đôi chỗ ẩu'
      }
    });

    await prisma.score.create({
      data: {
        session_id: session.id,
        score_type: 'DAILY',
        value: 8 + Math.random() * 1.5, // 8.0 - 9.5
        notes: 'Chấm điểm bài kiểm tra nhỏ'
      }
    });
  }

  // 5. Create Homework
  await prisma.homework.deleteMany({ where: { student_id: student.id } });
  for (let i = 1; i <= 5; i++) {
    const hwDate = new Date();
    hwDate.setDate(now.getDate() - i * 5);

    await prisma.homework.create({
      data: {
        student_id: student.id,
        title: `Bài tập về nhà số ${i}`,
        subject: i % 2 === 0 ? 'Toán học' : 'Tiếng Anh',
        description: 'Làm bài tập trang 20-25 SGK.',
        due_date: new Date(hwDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'GRADED',
        score: 8.5 + (i * 0.2), // 8.7, 8.9...
        feedback: 'Bài làm rất tốt, ít sai sót.',
        submission_date: hwDate,
        created_at: new Date(hwDate.getTime() - 24 * 60 * 60 * 1000)
      }
    });
  }
  // Pending homework
  await prisma.homework.create({
    data: {
      student_id: student.id,
      title: 'Bài tập ôn tập cuối tuần',
      subject: 'Toán học',
      description: 'Làm hết đề ôn tập số 1.',
      due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: 'PENDING'
    }
  });

  // 6. Create Tuition Cycles
  await prisma.payment.deleteMany({ where: { cycle: { student_id: student.id } } });
  await prisma.tuitionCycle.deleteMany({ where: { student_id: student.id } });

  const pastCycle = await prisma.tuitionCycle.create({
    data: {
      student_id: student.id,
      name: 'Học phí Tháng 8/2024',
      subject: 'Toán học',
      start_date: new Date('2024-08-01'),
      total_sessions: 10,
      completed_sessions: 10,
      price_per_session: 250000,
      total_amount: 2500000,
      paid_amount: 2500000,
      status: 'PAID'
    }
  });
  await prisma.payment.create({
    data: {
      cycle_id: pastCycle.id,
      amount: 2500000,
      method: 'TRANSFER',
      status: 'COMPLETED',
      notes: 'Phụ huynh chuyển khoản'
    }
  });

  await prisma.tuitionCycle.create({
    data: {
      student_id: student.id,
      name: 'Học phí Tháng 9/2024',
      subject: 'Toán học',
      start_date: new Date('2024-09-01'),
      total_sessions: 10,
      completed_sessions: 5,
      price_per_session: 250000,
      total_amount: 2500000,
      paid_amount: 1000000,
      status: 'PARTIAL'
    }
  });

  // 7. Create Achievement
  await prisma.achievement.create({
    data: {
      student_id: student.id,
      title: 'Học sinh Xuất sắc',
      description: 'Hoàn thành 10 buổi học với thành tích vượt trội.',
      metrics: JSON.stringify({ 
        attendanceRate: 100, 
        homeworkRate: 100, 
        avgScore: 9.0,
        startDate: new Date('2024-08-01').toISOString(),
        endDate: new Date('2024-08-31').toISOString()
      }),
      achieved_date: new Date()
    }
  });

  console.log('Seeding completed successfully!');
  console.log('--- TEST ACCOUNTS ---');
  console.log('TUTOR:  tutor@example.com / 123456');
  console.log('PARENT: parent@example.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
