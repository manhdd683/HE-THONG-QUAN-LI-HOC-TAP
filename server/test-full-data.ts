import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Generating full test data...");

  // 1. Get Tutor and Parent
  const tutor = await prisma.user.findFirst({ where: { role: 'TUTOR' } });
  let parent = await prisma.user.findFirst({ where: { role: 'PARENT' } });

  if (!parent) {
    const password_hash = await bcrypt.hash('123456', 10);
    parent = await prisma.user.create({
      data: {
        email: 'parent@example.com',
        password_hash,
        name: 'Phụ huynh Test',
        role: 'PARENT',
      }
    });
    console.log("Created test parent account");
  }

  if (!tutor) {
    console.log("No tutor found to assign");
    return;
  }

  // 2. Create Student
  const student = await prisma.student.create({
    data: {
      student_code: 'HS-FULLTEST-' + Date.now().toString().slice(-4),
      name: 'Học sinh Đầy Đủ Dữ Liệu',
      tutor_id: tutor.id,
      parent_id: parent.id,
      grade: 'Lớp 10',
      school: 'THPT Chu Văn An',
      price_per_session: 0,
    }
  });
  console.log(`Created student: ${student.name}`);

  // 3. Create Subjects
  await prisma.studentSubject.createMany({
    data: [
      { student_id: student.id, subject: 'Tiếng Anh', price_per_session: 150000 },
      { student_id: student.id, subject: 'Toán', price_per_session: 250000 },
    ]
  });
  console.log("Added subjects: Tiếng Anh (150k), Toán (250k)");

  // 4. Create 10 Schedules & Sessions (Unbilled)
  const pattern = ['Tiếng Anh', 'Tiếng Anh', 'Toán'];
  for (let i = 0; i < 10; i++) {
    const subject = pattern[i % 3];
    const date = new Date();
    date.setDate(date.getDate() - (10 - i)); // spread over past 10 days
    
    const schedule = await prisma.schedule.create({
      data: {
        student_id: student.id,
        subject,
        date,
        start_time: '18:00',
        end_time: '19:30',
        format: 'OFFLINE',
        status: 'COMPLETED'
      }
    });

    await prisma.session.create({
      data: {
        schedule_id: schedule.id,
        attendance: 'PRESENT',
        content: `Học bài mới môn ${subject}, làm bài tập đầy đủ.`,
      }
    });
  }
  console.log("Created 10 unbilled sessions (7 Tiếng Anh, 3 Toán)");

  // 5. Create some Homework
  await prisma.homework.create({
    data: {
      student_id: student.id,
      title: 'Bài tập Unit 1 - Tiếng Anh',
      subject: 'Tiếng Anh',
      description: 'Làm bài tập trắc nghiệm trang 15',
      status: 'GRADED',
      score: 9.5,
      feedback: 'Làm bài rất tốt, ít sai sót',
    }
  });
  await prisma.homework.create({
    data: {
      student_id: student.id,
      title: 'Bài tập Đại số chương 1',
      subject: 'Toán',
      description: 'Giải hệ phương trình',
      status: 'PENDING',
    }
  });
  console.log("Created homework records");

  // 6. Create a Report History
  await prisma.reportHistory.create({
    data: {
      student_id: student.id,
      created_by: tutor.id,
      report_type: 'MONTHLY',
      name: 'Báo cáo tổng kết tháng 8',
      email_sent: true,
    }
  });
  console.log("Created report history");

  console.log("Done! Dữ liệu giả lập đã sẵn sàng.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
