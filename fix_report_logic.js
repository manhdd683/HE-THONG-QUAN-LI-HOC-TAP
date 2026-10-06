const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');

const regex = /if \(scoreboards\.length === 0\) \{\s*\/\/ Fetch latest approved scoreboard for each subject[\s\S]*?scoreboards = Array\.from\(draftMap\.values\(\)\);\s*\}/;

const replacement = `if (scoreboards.length === 0) {
        // Fetch all scoreboards for this student
        const allBoards = await prisma.subjectScoreBoard.findMany({
          where: { student_id: studentId },
          orderBy: { updated_at: 'desc' }
        });
        
        const subjectMap = new Map();
        
        // Group by subject
        for (const sb of allBoards) {
          if (!subjectMap.has(sb.subject)) {
            subjectMap.set(sb.subject, []);
          }
          subjectMap.get(sb.subject).push(sb);
        }
        
        scoreboards = [];
        for (const [subj, boards] of subjectMap.entries()) {
          const draftBoard = boards.find(b => b.is_approved === false);
          const latestApprovedBoard = boards.find(b => b.is_approved === true);
          
          // If draft board has some scores, use it. Otherwise, use latest approved.
          if (draftBoard && (draftBoard.daily_score !== null || draftBoard.homework_1 !== null || draftBoard.homework_2 !== null || draftBoard.quiz_1 !== null || draftBoard.quiz_2 !== null || draftBoard.final_score !== null || draftBoard.average_score !== null)) {
            scoreboards.push(draftBoard);
          } else if (latestApprovedBoard) {
            scoreboards.push(latestApprovedBoard);
          } else if (draftBoard) {
            scoreboards.push(draftBoard); // fallback to empty draft
          }
        }
      }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('server/src/controllers/report.controller.ts', Buffer.from(content, 'utf8'));
  console.log('Fixed report scoreboard fallback logic to prioritize boards with data');
} else {
  console.log('REGEX DID NOT MATCH!');
}
