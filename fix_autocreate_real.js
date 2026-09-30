const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/scoreboard.controller.ts', 'utf8');

const regex = /const existing = await prisma\.subjectScoreBoard\.findFirst\(\{\s*where: \{\s*student_id: studentId,\s*subject: sub\.subject\s*\},\s*orderBy: \{\s*created_at: 'desc'\s*\}\s*\}\);\s*if \(!existing\) \{/g;

const newLogic = `const existingUnapproved = await prisma.subjectScoreBoard.findFirst({
          where: {
            student_id: studentId,
            subject: sub.subject,
            is_approved: false
          }
        });
        
        if (!existingUnapproved) {`;

content = content.replace(regex, newLogic);
content = content.replace(/title: \`Bảng điểm \$\{sub.subject\}\`/g, "title: \`Bảng điểm mới ${sub.subject}\`");

fs.writeFileSync('server/src/controllers/scoreboard.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed auto-create logic CORRECTLY this time!');
