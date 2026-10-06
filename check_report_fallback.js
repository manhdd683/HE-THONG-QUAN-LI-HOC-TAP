const fs = require('fs');
const content = fs.readFileSync('server/src/controllers/report.controller.ts', 'utf8');
const index = content.indexOf('if (scoreboards.length === 0)');
if (index !== -1) {
  console.log(content.substring(index, index + 1000));
} else {
  console.log('Not found');
}
