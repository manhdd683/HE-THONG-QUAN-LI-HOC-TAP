import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findFirst({
    where: { name: 'Học sinh Đầy Đủ Dữ Liệu' }
  });

  if (!student) {
    console.log("No student found");
    return;
  }

  const pattern = ['Tiếng Anh', 'Toán', 'Tiếng Anh'];
  
  // Create schedule for TODAY
  await prisma.schedule.create({
    data: {
      student_id: student.id,
      subject: 'Tiếng Anh',
      date: new Date(),
      start_time: '19:00',
      end_time: '21:00',
      format: 'ONLINE',
      status: 'SCHEDULED'
    }
  });

  // Create upcoming schedules
  for (let i = 1; i <= 3; i++) {
    const subject = pattern[i % 3];
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    await prisma.schedule.create({
      data: {
        student_id: student.id,
        subject,
        date,
        start_time: '18:00',
        end_time: '19:30',
        format: 'ONLINE',
        status: 'SCHEDULED'
      }
    });
  }

  // Create a recent report for today
  await prisma.reportHistory.create({
    data: {
      student_id: student.id,
      created_by: student.tutor_id,
      report_type: 'MONTHLY',
      name: 'Báo cáo giữa tháng',
    }
  });

  console.log("Inserted future schedules and reports for Dashboard!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
