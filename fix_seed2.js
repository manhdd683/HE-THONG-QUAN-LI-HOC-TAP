const fs = require('fs');
const file = 'server/seed-comprehensive.ts';
let content = fs.readFileSync(file, 'utf8');

const badDelete = `    await prisma.payment.deleteMany({ where: { cycle: { student_id: s.id } } });
    await prisma.session.deleteMany({ where: { schedule: { student_id: s.id } } });`;

const goodDelete = `    await prisma.payment.deleteMany({ where: { cycle: { student_id: s.id } } });
    await prisma.comment.deleteMany({ where: { session: { schedule: { student_id: s.id } } } });
    await prisma.scoreHistory.deleteMany({ where: { score: { session: { schedule: { student_id: s.id } } } } });
    await prisma.score.deleteMany({ where: { session: { schedule: { student_id: s.id } } } });
    await prisma.session.deleteMany({ where: { schedule: { student_id: s.id } } });`;

content = content.replace(badDelete, goodDelete);
fs.writeFileSync(file, content);
console.log('Fixed session deletion');
