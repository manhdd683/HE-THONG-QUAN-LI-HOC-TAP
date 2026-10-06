const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');

const regex = /}\n\s*}\n\s*}\n\n\s*\/\/ We don't have homework rate anymore/g;
content = content.replace(regex, `}\n      }\n\n      // We don't have homework rate anymore`);

fs.writeFileSync('server/src/controllers/report.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed extra }');
