const fs = require('fs');
const file = 'server/src/controllers/tuition.controller.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('const { studentId } = req.params;', 'const studentId = req.params.studentId as string;');
fs.writeFileSync(file, content);
console.log('Fixed typescript in tuition.controller');
