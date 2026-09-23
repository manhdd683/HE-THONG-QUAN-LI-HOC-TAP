import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find a tutor and parent
  const tutor = await prisma.user.findFirst({ where: { role: 'TUTOR' } });
  const parent = await prisma.user.findFirst({ where: { role: 'PARENT' } });

  if (!tutor || !parent) {
    console.log("No tutor or parent found");
    return;
  }

  // Create student
  const student = await prisma.student.create({
    data: {
      student_code: 'TEST-TUITION-01',
      name: 'Học sinh Test Học Phí',
      tutor_id: tutor.id,
      parent_id: parent.id,
      price_per_session: 0,
      subject: 'Tiếng Anh, Toán'
    }
  });

  // Create subjects
  await prisma.studentSubject.create({
    data: {
      student_id: student.id,
      subject: 'Tiếng Anh',
      price_per_session: 200000
    }
  });
  
  await prisma.studentSubject.create({
    data: {
      student_id: student.id,
      subject: 'Toán',
      price_per_session: 250000
    }
  });

  // Create 10 schedules/sessions
  const subjects = ['Tiếng Anh', 'Tiếng Anh', 'Toán']; // pattern
  for (let i = 0; i < 10; i++) {
    const subject = subjects[i % 3];
    const date = new Date();
    date.setDate(date.getDate() - (10 - i)); // Past 10 days
    
    const schedule = await prisma.schedule.create({
      data: {
        student_id: student.id,
        subject: subject,
        date: date,
        start_time: '18:00',
        end_time: '19:30',
        format: 'ONLINE',
        status: 'COMPLETED'
      }
    });

    await prisma.session.create({
      data: {
        schedule_id: schedule.id,
        attendance: 'PRESENT',
        content: `Nội dung buổi học ${i + 1} môn ${subject}`
      }
    });
  }

  console.log("Test data created for student:", student.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
