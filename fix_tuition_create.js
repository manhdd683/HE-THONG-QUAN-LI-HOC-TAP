const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/tuition.controller.ts', 'utf8');

const regex = /total_amount,\n\s*status: 'UNPAID'\n\s*},\n\s*include: { student: true }/g;
const replacement = `total_amount,
              status: 'UNPAID',
              completed_sessions: session_ids ? session_ids.length : 0
            },
            include: { student: true }`;

content = content.replace(regex, replacement);
fs.writeFileSync('server/src/controllers/tuition.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed createTuitionCycle completed_sessions');
