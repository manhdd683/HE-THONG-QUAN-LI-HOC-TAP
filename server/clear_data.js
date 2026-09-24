const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Xóa toàn bộ dữ liệu học sinh...');

  // Delete everything dependent on students first
  await prisma.activityLog.deleteMany({});
  await prisma.reportHistory.deleteMany({});
  
  await prisma.payment.deleteMany({});
  await prisma.tuitionCycle.deleteMany({});
  
  await prisma.comment.deleteMany({});
  await prisma.scoreHistory.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.schedule.deleteMany({});
  
  await prisma.document.deleteMany({});
  await prisma.homework.deleteMany({});
  
  await prisma.goal.deleteMany({});
  await prisma.subjectScoreBoard.deleteMany({});
  await prisma.studentSubject.deleteMany({});
  await prisma.achievement.deleteMany({});
  
  // Finally delete students
  await prisma.student.deleteMany({});

  console.log('✅ Đã xóa toàn bộ dữ liệu học sinh.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
