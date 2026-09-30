const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const boards = await prisma.subjectScoreBoard.findMany({
    include: { student: true }
  });
  console.log(JSON.stringify(boards, null, 2));
}
main().finally(() => prisma.$disconnect());
