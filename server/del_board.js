const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.subjectScoreBoard.deleteMany({
    where: { title: 'Bảng điểm tháng 10' }
  });
  console.log('Deleted:', result.count);
}
main().finally(() => prisma.$disconnect());
