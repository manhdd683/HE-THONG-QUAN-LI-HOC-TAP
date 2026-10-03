const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');

const oldFallback = `      if (scoreboards.length === 0) {
        scoreboards = await prisma.subjectScoreBoard.findMany({
          where: { 
            student_id: studentId,
            is_approved: true
          }
        });
      }`;

const newFallback = `      if (scoreboards.length === 0) {
        // Fetch latest approved scoreboard for each subject
        const allApproved = await prisma.subjectScoreBoard.findMany({
          where: { student_id: studentId, is_approved: true },
          orderBy: { updated_at: 'desc' }
        });
        const subjectMap = new Map();
        for (const sb of allApproved) {
          if (!subjectMap.has(sb.subject)) {
            subjectMap.set(sb.subject, sb);
          }
        }
        scoreboards = Array.from(subjectMap.values());
        
        // If still empty (e.g. they haven't approved any), fetch the current draft ones
        if (scoreboards.length === 0) {
           const allDrafts = await prisma.subjectScoreBoard.findMany({
             where: { student_id: studentId, is_approved: false },
             orderBy: { updated_at: 'desc' }
           });
           const draftMap = new Map();
           for (const sb of allDrafts) {
             if (!draftMap.has(sb.subject)) {
               draftMap.set(sb.subject, sb);
             }
           }
           scoreboards = Array.from(draftMap.values());
        }
      }`;

content = content.replace(oldFallback, newFallback);
fs.writeFileSync('server/src/controllers/report.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed report scoreboard fallback logic');
