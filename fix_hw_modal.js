const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Homework/HomeworkDetailModal.tsx', 'utf8');

// Replace status logic
const statusRegex = /\{homework\.status === 'PENDING' \? 'Chờ nộp' : homework\.status === 'SUBMITTED' \? 'Đã nộp' : homework\.status === 'GRADED' \? 'Đã chấm' : homework\.status\}/g;
content = content.replace(statusRegex, "{homework.status === 'PENDING' ? 'Chưa làm' : 'Đã hoàn thành'}");

fs.writeFileSync('client/src/pages/Homework/HomeworkDetailModal.tsx', content);
console.log('Fixed HomeworkDetailModal status label');
