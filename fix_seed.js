const fs = require('fs');
const file = 'server/seed-comprehensive.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/date_of_birth/g, 'dob');
fs.writeFileSync(file, content);
console.log('Fixed dob field');
