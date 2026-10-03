const fs = require('fs');
const content = fs.readFileSync('server/src/controllers/schedule.controller.ts', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes("if (['PRESENT', 'MAKE_UP'].includes(attendance) && (!existingSession"));
if (startIndex !== -1) {
  console.log(lines.slice(startIndex, startIndex + 50).join('\n'));
}
