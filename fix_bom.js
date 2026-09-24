const fs = require('fs');
let content = fs.readFileSync('client/package.json', 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
fs.writeFileSync('client/package.json', content, 'utf8');
