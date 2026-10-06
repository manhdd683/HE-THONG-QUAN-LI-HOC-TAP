const fs = require('fs');
const content = fs.readFileSync('server/src/controllers/schedule.controller.ts', 'utf8');
const index = content.indexOf('await prisma.session.update({');
if (index !== -1) {
  console.log(content.substring(index, index + 500));
} else {
  console.log('Not found');
}
