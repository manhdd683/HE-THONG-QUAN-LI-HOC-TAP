const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');

content = content.replace(/allComments\.join\(' \| '\)/g, "allComments.join('. ')");

fs.writeFileSync('server/src/controllers/report.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed report finalComment separator');
