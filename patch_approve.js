const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/scoreboard.controller.ts', 'utf8');

const oldApprove = `    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: { is_approved: true },
      include: {
        student: {
          include: { parent: true }
        }
      }
    });

    if (board.student.parent?.email) {`;

const newApprove = `    const board = await prisma.subjectScoreBoard.update({
      where: { id },
      data: { is_approved: true },
      include: {
        student: {
          include: { parent: true }
        }
      }
    });
    
    // Auto-create next cycle board
    await prisma.subjectScoreBoard.create({
      data: {
        student_id: board.student_id,
        subject: board.subject,
        title: \`Bảng điểm mới \${board.subject}\`
      }
    });

    if (board.student.parent?.email) {`;

content = content.replace(oldApprove, newApprove);
fs.writeFileSync('server/src/controllers/scoreboard.controller.ts', Buffer.from(content, 'utf8'));
console.log('Backend patched.');
