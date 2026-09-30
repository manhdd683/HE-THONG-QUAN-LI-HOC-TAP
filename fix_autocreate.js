const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/scoreboard.controller.ts', 'utf8');

const oldCheck = `      for (const sub of subjects) {
        const existing = await prisma.subjectScoreBoard.findFirst({
          where: {
            student_id: studentId,
            subject: sub.subject
          },
        });
        if (!existing) {
          await prisma.subjectScoreBoard.create({
            data: {
              student_id: studentId,
              subject: sub.subject,
              title: \`Bảng điểm \${sub.subject}\`
            }
          });
        }
      }`;

const newCheck = `      for (const sub of subjects) {
        const existingUnapproved = await prisma.subjectScoreBoard.findFirst({
          where: {
            student_id: studentId,
            subject: sub.subject,
            is_approved: false
          },
        });
        if (!existingUnapproved) {
          await prisma.subjectScoreBoard.create({
            data: {
              student_id: studentId,
              subject: sub.subject,
              title: \`Bảng điểm mới \${sub.subject}\`
            }
          });
        }
      }`;

content = content.replace(oldCheck, newCheck);
fs.writeFileSync('server/src/controllers/scoreboard.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed auto-create logic.');
