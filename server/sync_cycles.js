const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cycles = await prisma.tuitionCycle.findMany({
    include: { sessions: { include: { schedule: true } } }
  });
  
  for (const cycle of cycles) {
    let calculatedAmount = 0;
    
    // If cycle is subject-specific, use the cycle's price
    if (cycle.subject && cycle.subject.trim() !== '') {
      calculatedAmount = cycle.sessions.length * cycle.price_per_session;
    } else {
      // If cycle is multi-subject, sum up each session's price
      for (const session of cycle.sessions) {
        let price = 0;
        const subjectToUse = session.schedule.subject;
        const studentSubject = await prisma.studentSubject.findFirst({
          where: { student_id: cycle.student_id, subject: subjectToUse }
        });
        if (studentSubject) {
          price = studentSubject.price_per_session;
        } else {
          const student = await prisma.student.findUnique({ where: { id: cycle.student_id } });
          price = student?.price_per_session || 0;
        }
        calculatedAmount += price;
      }
    }
    
    await prisma.tuitionCycle.update({
      where: { id: cycle.id },
      data: {
        completed_sessions: cycle.sessions.length,
        total_amount: calculatedAmount
      }
    });
    console.log(`Updated cycle ${cycle.name} for student ${cycle.student_id}: sessions=${cycle.sessions.length}, amount=${calculatedAmount}`);
  }
}
main().finally(() => prisma.$disconnect());
