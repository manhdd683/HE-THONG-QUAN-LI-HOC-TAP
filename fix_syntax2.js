const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Scores/StudentScoreCard.tsx', 'utf8');

content = content.replace('{b.title || Bảng điểm chưa đặt tên}', '{b.title || `Bảng điểm chưa đặt tên`}');

fs.writeFileSync('client/src/pages/Scores/StudentScoreCard.tsx', Buffer.from(content, 'utf8'));
console.log('Fixed Bảng điểm chưa đặt tên.');
