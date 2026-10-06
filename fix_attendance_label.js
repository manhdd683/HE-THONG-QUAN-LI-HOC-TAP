const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Reports/ReportsPage.tsx', 'utf8');

const regex = /{session\.attendance === 'PRESENT' \? 'Có mặt' : \(session\.attendance === 'ABSENT' \? 'Vắng mặt' : session\.attendance\)}/g;

const replacement = `{session.attendance === 'PRESENT' ? 'Có mặt' : session.attendance === 'ABSENT' ? 'Vắng mặt' : session.attendance === 'MAKE_UP' ? 'Học bù' : session.attendance === 'EXCUSED' ? 'Nghỉ phép' : session.attendance}`;

content = content.replace(regex, replacement);

fs.writeFileSync('client/src/pages/Reports/ReportsPage.tsx', Buffer.from(content, 'utf8'));
console.log('Fixed attendance label in ReportsPage');
