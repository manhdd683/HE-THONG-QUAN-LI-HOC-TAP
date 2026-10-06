const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');

const regex = /const draftBoard = boards\.find\(b => b\.is_approved === false\);\s*const latestApprovedBoard = boards\.find\(b => b\.is_approved === true\);\s*\/\/ If draft board has some scores, use it\. Otherwise, use latest approved\.\s*if \(draftBoard && \(draftBoard\.daily_score !== null \|\| draftBoard\.homework_1 !== null \|\| draftBoard\.homework_2 !== null \|\| draftBoard\.quiz_1 !== null \|\| draftBoard\.quiz_2 !== null \|\| draftBoard\.final_score !== null \|\| draftBoard\.average_score !== null\)\) \{\s*scoreboards\.push\(draftBoard\);\s*\} else if \(latestApprovedBoard\) \{\s*scoreboards\.push\(latestApprovedBoard\);\s*\} else if \(draftBoard\) \{\s*scoreboards\.push\(draftBoard\); \/\/ fallback to empty draft\s*\}/;

const replacement = `const draftBoard = boards.find(b => b.is_approved === false);
          const latestApprovedBoard = boards.find(b => b.is_approved === true);
          
          // Check if latestApprovedBoard belongs to this cycle (updated after cycle start)
          const isApprovedBoardRecent = latestApprovedBoard && new Date(latestApprovedBoard.updated_at) >= new Date(cycle.start_date);
          const hasDraftScores = draftBoard && (draftBoard.daily_score !== null || draftBoard.homework_1 !== null || draftBoard.homework_2 !== null || draftBoard.quiz_1 !== null || draftBoard.quiz_2 !== null || draftBoard.final_score !== null || draftBoard.average_score !== null);
          
          if (hasDraftScores) {
            scoreboards.push(draftBoard);
          } else if (isApprovedBoardRecent) {
            scoreboards.push(latestApprovedBoard);
          } else if (draftBoard) {
            scoreboards.push(draftBoard);
          }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('server/src/controllers/report.controller.ts', Buffer.from(content, 'utf8'));
  console.log('Fixed report logic to filter out old scoreboards based on cycle start_date');
} else {
  console.log('REGEX DID NOT MATCH!');
}
