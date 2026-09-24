import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive data seed...');

  const tutorEmail = 'tutor@example.com';
  const parentEmail = 'ddm0309mon@gmail.com';

  const tutor = await prisma.user.findUnique({ where: { email: tutorEmail } });
  const parent = await prisma.user.findUnique({ where: { email: parentEmail } });

  if (!tutor || !parent) {
    console.error('Tutor or Parent not found. Please ensure tutor@example.com and ddm0309mon@gmail.com exist.');
    return;
  }

  console.log('🧹 Cleaning up old data for these users...');
  
  // Find students to delete everything related to them
  const students = await prisma.student.findMany({
    where: { tutor_id: tutor.id }
  });
  
  for (const s of students) {
    await prisma.activityLog.deleteMany({ where: { student_id: s.id } });
    await prisma.reportHistory.deleteMany({ where: { student_id: s.id } });
    await prisma.payment.deleteMany({ where: { cycle: { student_id: s.id } } });
    await prisma.comment.deleteMany({ where: { session: { schedule: { student_id: s.id } } } });
    await prisma.scoreHistory.deleteMany({ where: { score: { session: { schedule: { student_id: s.id } } } } });
    await prisma.score.deleteMany({ where: { session: { schedule: { student_id: s.id } } } });
    await prisma.session.deleteMany({ where: { schedule: { student_id: s.id } } });
    await prisma.schedule.deleteMany({ where: { student_id: s.id } });
    await prisma.tuitionCycle.deleteMany({ where: { student_id: s.id } });
    await prisma.homework.deleteMany({ where: { student_id: s.id } });
    await prisma.goal.deleteMany({ where: { student_id: s.id } });
    await prisma.subjectScoreBoard.deleteMany({ where: { student_id: s.id } });
    await prisma.studentSubject.deleteMany({ where: { student_id: s.id } });
    await prisma.achievement.deleteMany({ where: { student_id: s.id } });
  }
  await prisma.student.deleteMany({ where: { tutor_id: tutor.id } });

  console.log('📝 Creating test students...');
  const student1 = await prisma.student.create({
    data: {
      name: 'Nguyễn Văn Test',
      student_code: 'HS2026-01',
      dob: new Date('2010-05-15'),
      gender: 'MALE',
      school: 'THCS Chu Văn An',
      grade: 'Lớp 9',
      tutor_id: tutor.id,
      parent_id: parent.id,
    }
  });

  const student2 = await prisma.student.create({
    data: {
      name: 'Trần Quỳnh Chi',
      student_code: 'HS2026-02',
      dob: new Date('2011-08-20'),
      gender: 'FEMALE',
      school: 'THCS Lê Lợi',
      grade: 'Lớp 8',
      tutor_id: tutor.id,
      parent_id: parent.id,
    }
  });

  console.log('📚 Adding subjects & scoreboards...');
  // Subjects
  await prisma.studentSubject.create({ data: { student_id: student1.id, subject: 'Toán', price_per_session: 150000 } });
  await prisma.studentSubject.create({ data: { student_id: student1.id, subject: 'Tiếng Anh', price_per_session: 150000 } });
  
  await prisma.studentSubject.create({ data: { student_id: student2.id, subject: 'Ngữ Văn', price_per_session: 120000 } });

  // Scoreboards
  await prisma.subjectScoreBoard.create({
    data: {
      student_id: student1.id,
      subject: 'Toán',
      daily_score: 9.0,
      homework_1: 8.5,
      homework_2: 9.5,
      quiz_1: 8.0,
      quiz_2: 10.0,
      final_score: 9.0,
      average_score: 9.05,
      is_approved: true
    }
  });
  
  await prisma.subjectScoreBoard.create({
    data: {
      student_id: student1.id,
      subject: 'Tiếng Anh',
      daily_score: 7.0,
      homework_1: 7.5,
      homework_2: 8.0,
      quiz_1: 6.5,
      quiz_2: 7.0,
      final_score: 7.5,
      average_score: 7.37,
      is_approved: true
    }
  });

  console.log('🎯 Adding goals...');
  await prisma.goal.create({
    data: {
      student_id: student1.id,
      title: 'Đạt học sinh Giỏi học kỳ 1',
      description: 'Cố gắng giữ điểm trung bình các môn trên 8.0',
      goal_type: 'LONG_TERM',
      start_date: new Date('2026-09-01'),
      end_date: new Date('2026-12-31'),
      progress: 65,
      status: 'IN_PROGRESS'
    }
  });

  console.log('💰 Adding tuition cycles...');
  const cycle1 = await prisma.tuitionCycle.create({
    data: {
      student_id: student1.id,
      name: 'Tháng 9/2026',
      start_date: new Date('2026-09-01'),
      end_date: new Date('2026-09-30'),
      total_sessions: 10,
      completed_sessions: 8,
      price_per_session: 150000,
      total_amount: 1500000,
      paid_amount: 1500000,
      status: 'PAID'
    }
  });

  const cycle2 = await prisma.tuitionCycle.create({
    data: {
      student_id: student2.id,
      name: 'Tháng 9/2026',
      start_date: new Date('2026-09-01'),
      end_date: new Date('2026-09-30'),
      total_sessions: 8,
      completed_sessions: 2,
      price_per_session: 120000,
      total_amount: 960000,
      paid_amount: 500000,
      status: 'PARTIAL'
    }
  });

  // Payments
  await prisma.payment.create({
    data: {
      cycle_id: cycle1.id,
      amount: 1500000,
      method: 'BANK_TRANSFER',
      status: 'COMPLETED',
      notes: 'Phụ huynh chuyển khoản tháng 9'
    }
  });
  
  await prisma.payment.create({
    data: {
      cycle_id: cycle2.id,
      amount: 500000,
      method: 'CASH',
      status: 'COMPLETED',
      notes: 'Phụ huynh gửi tiền mặt trước 1 nửa'
    }
  });

  console.log('📅 Adding schedules and sessions...');
  for (let i = 1; i <= 8; i++) {
    const date = new Date(`2026-09-0${i}`);
    const sched = await prisma.schedule.create({
      data: {
        student_id: student1.id,
        subject: 'Toán',
        date,
        start_time: '18:00',
        end_time: '19:30',
        format: 'ONLINE',
        status: 'COMPLETED'
      }
    });

    const isAbsent = i === 4; // Vắng mặt buổi 4

    const session = await prisma.session.create({
      data: {
        schedule_id: sched.id,
        tuition_cycle_id: cycle1.id,
        attendance: isAbsent ? 'ABSENT' : 'PRESENT',
        content: isAbsent ? '' : `Học bài ${i}: Phương trình bậc 2`,
      }
    });

    if (!isAbsent) {
      await prisma.comment.create({
        data: {
          session_id: session.id,
          content: `Học bài ${i}: Phương trình bậc 2`,
          understanding_level: 'Khá tốt, nắm được công thức nghiệm',
          attitude: 'Nghiêm túc, tập trung',
          strengths: 'Tính toán nhanh',
          weaknesses: 'Hay nhầm dấu',
          homework_assigned: 'Làm bài 1,2,3 SGK trang 45'
        }
      });
    }
  }

  // Future schedules for student 2
  for (let i = 25; i <= 28; i++) {
    await prisma.schedule.create({
      data: {
        student_id: student2.id,
        subject: 'Ngữ Văn',
        date: new Date(`2026-09-${i}`),
        start_time: '19:00',
        end_time: '20:30',
        format: 'OFFLINE',
        location: 'Tại nhà học sinh',
        status: 'SCHEDULED'
      }
    });
  }

  console.log('📝 Adding homework...');
  await prisma.homework.create({
    data: {
      student_id: student1.id,
      title: 'Bài tập cuối tuần Toán',
      subject: 'Toán',
      due_date: new Date('2026-09-15'),
      status: 'GRADED',
      score: 9.5,
      feedback: 'Làm bài rất tốt, trình bày sạch sẽ.'
    }
  });
  
  await prisma.homework.create({
    data: {
      student_id: student1.id,
      title: 'Bài tập Tiếng Anh Unit 1',
      subject: 'Tiếng Anh',
      due_date: new Date('2026-09-20'),
      status: 'SUBMITTED',
      submission_text: 'Em nộp bài ạ'
    }
  });

  console.log('🏆 Adding achievements...');
  await prisma.achievement.create({
    data: {
      student_id: student1.id,
      title: 'Hoàn thành xuất sắc môn Toán',
      description: 'Hệ thống tự động cấp chứng nhận do điểm trung bình môn Toán đạt 9.05',
    }
  });

  console.log('📊 Adding report history...');
  await prisma.reportHistory.create({
    data: {
      student_id: student1.id,
      created_by: tutor.id,
      report_type: 'MONTHLY',
      name: 'Báo cáo Tháng 9/2026',
      start_date: new Date('2026-09-01'),
      end_date: new Date('2026-09-30'),
    }
  });

  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
