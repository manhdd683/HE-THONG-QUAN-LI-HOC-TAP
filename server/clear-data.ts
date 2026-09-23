import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing test data...');

  // Delete all dependent data first
  await prisma.activityLog.deleteMany();
  await prisma.reportHistory.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.scoreHistory.deleteMany();
  await prisma.score.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tuitionCycle.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.studentSubject.deleteMany();
  await prisma.subjectScoreBoard.deleteMany();

  // Finally delete students
  await prisma.student.deleteMany();

  // Delete all users EXCEPT the default tutor
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'tutor@example.com'
      }
    }
  });

  console.log('All test data cleared successfully!');
  console.log('Remaining User:', await prisma.user.findFirst());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
