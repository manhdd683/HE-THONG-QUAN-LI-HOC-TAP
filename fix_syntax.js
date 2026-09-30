const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Scores/StudentScoreCard.tsx', 'utf8');

// Fix api.get
content = content.replace('const res = await api.get(/students/ + student.id + /scoreboards);', 'const res = await api.get(`/students/${student.id}/scoreboards`);');

// Fix api.put
content = content.replace('await api.put(/scoreboards/ + boardId, dataToSave);', 'await api.put(`/scoreboards/${boardId}`, dataToSave);');
content = content.replace('await api.put(/scoreboards/ + boardId, dataToSave);', 'await api.put(`/scoreboards/${boardId}`, dataToSave);'); // there are two

// Fix api.post
content = content.replace('await api.post(/scoreboards/ + boardId + /approve);', 'await api.post(`/scoreboards/${boardId}/approve`);');

// Fix title fallback
content = content.replace('{activeBoard.title || Bảng điểm Môn  + activeBoard.subject}', '{activeBoard.title || `Bảng điểm Môn ${activeBoard.subject}`}');

fs.writeFileSync('client/src/pages/Scores/StudentScoreCard.tsx', Buffer.from(content, 'utf8'));
console.log('Fixed syntax errors.');
