const fs = require('fs');
const file = 'client/src/pages/Reports/ReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('<td>{students.find(s => s.id === history.student_id)?.name || history.student_id}</td>', '<td>{history.student?.name || students.find(s => s.id === history.student_id)?.name || history.student_id}</td>');

fs.writeFileSync(file, content);
console.log('Fixed history student name display');
