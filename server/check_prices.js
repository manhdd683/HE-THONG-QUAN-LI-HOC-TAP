const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.student.findFirst({
    where: { student_code: 'HS002' },
    include: { student_subjects: true }
  });
  console.log('Student Subjects:', JSON.stringify(student.student_subjects, null, 2));

  const sessions = await prisma.session.findMany({
    where: { tuition_cycle_id: '49754210-4485-4c27-9889-9b580c7a2c9b' },
    include: { schedule: true }
  });
  console.log('Sessions in cycle 2:', JSON.stringify(sessions, null, 2));
}
main().finally(() => prisma.$disconnect());
