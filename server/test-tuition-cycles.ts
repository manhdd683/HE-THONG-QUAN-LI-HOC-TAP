import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findUnique({
    where: { student_code: 'TEST-TUITION-01' }
  });

  if (!student) {
    console.log("Student not found");
    return;
  }

  // Create Tuition Cycle for English
  await prisma.tuitionCycle.create({
    data: {
      student_id: student.id,
      name: 'Học phí Tiếng Anh (Tháng 9)',
      subject: 'Tiếng Anh',
      start_date: new Date(),
      total_sessions: 7,
      completed_sessions: 7,
      price_per_session: 200000,
      total_amount: 7 * 200000,
      status: 'UNPAID'
    }
  });

  // Create Tuition Cycle for Math
  await prisma.tuitionCycle.create({
    data: {
      student_id: student.id,
      name: 'Học phí Toán (Tháng 9)',
      subject: 'Toán',
      start_date: new Date(),
      total_sessions: 3,
      completed_sessions: 3,
      price_per_session: 250000,
      total_amount: 3 * 250000,
      status: 'UNPAID'
    }
  });

  console.log("Created Tuition Cycles successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
