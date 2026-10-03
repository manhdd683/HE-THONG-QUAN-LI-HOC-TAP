const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cycles = await prisma.tuitionCycle.findMany({
    where: { student: { name: { contains: 'Đạt' } } },
    include: { sessions: true }
  });
  console.log(JSON.stringify(cycles, null, 2));
}
main().finally(() => prisma.$disconnect());
