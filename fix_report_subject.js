const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');

const regex = /const allBoards = await prisma\.subjectScoreBoard\.findMany\(\{\s*where: \{ student_id: studentId \},\s*orderBy: \{ updated_at: 'desc' \}\s*\}\);/;

const replacement = `const allBoards = await prisma.subjectScoreBoard.findMany({
          where: { 
            student_id: studentId,
            ...(cycle.subject && cycle.subject.trim() !== '' ? { subject: cycle.subject } : {})
          },
          orderBy: { updated_at: 'desc' }
        });`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('server/src/controllers/report.controller.ts', Buffer.from(content, 'utf8'));
  console.log('Fixed report scoreboard fallback to respect cycle subject');
} else {
  console.log('REGEX DID NOT MATCH!');
}
