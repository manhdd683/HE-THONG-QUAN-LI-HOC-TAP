const fs = require('fs');
const lines = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8').split('\n');
for (let i = 100; i < 120; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
