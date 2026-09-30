const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const boards = await prisma.subjectScoreBoard.findMany({ select: { id: true, title: true } });
  console.log(boards);
  
  // Fix corruption
  for (const b of boards) {
    if (b.title && b.title.includes('B?ng')) {
      await prisma.subjectScoreBoard.update({
        where: { id: b.id },
        data: { title: b.title.replace('B?ng ?i?m', 'Bảng điểm') }
      });
    }
  }
}
main().finally(() => prisma.$disconnect());
