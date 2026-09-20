import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.schedule.findMany({
    where: { status: 'SCHEDULED' }
  });
  console.log(`Found ${schedules.length} scheduled schedules.`);
  if (schedules.length > 0) {
    const id = schedules[0].id;
    console.log(`Attempting to delete schedule ${id}`);
    try {
      await prisma.schedule.delete({ where: { id } });
      console.log('Successfully deleted!');
    } catch (e: any) {
      console.error('Failed to delete:', e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
