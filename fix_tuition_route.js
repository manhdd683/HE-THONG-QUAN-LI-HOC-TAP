const fs = require('fs');
const file = 'server/src/routes/tuition.routes.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('getUnbilledSessions', 'getUnbilledSessions, getStudentTuitionCycles');
content = content.replace('router.get(\'/\', getTuitionCycles);', 'router.get(\'/\', getTuitionCycles);\nrouter.get(\'/student/:studentId\', getStudentTuitionCycles);');

fs.writeFileSync(file, content);
console.log('Added route');
