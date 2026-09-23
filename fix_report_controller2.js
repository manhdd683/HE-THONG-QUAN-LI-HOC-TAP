const fs = require('fs');
const file = 'server/src/controllers/report.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const badInclude = `    const scoreboards = await prisma.subjectScoreBoard.findMany({
      where: { student_id: studentId },
      include: {
        scores: {
          include: { score_type: true }
        }
      }
    });`;
const goodQuery = `    const scoreboards = await prisma.subjectScoreBoard.findMany({
      where: { student_id: studentId }
    });`;

content = content.replace(badInclude, goodQuery);
fs.writeFileSync(file, content);
console.log('Fixed report controller query');
