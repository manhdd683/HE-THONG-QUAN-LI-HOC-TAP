const fs = require('fs');
let content = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
// Remove BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
  console.log('Removed BOM');
}
// Replace sqlite with postgresql
content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
content = content.replace(/url\s*=\s*"file:\.\/dev\.db"/, 'url = env("DATABASE_URL")');
// Write without BOM using Buffer
fs.writeFileSync('server/prisma/schema.prisma', Buffer.from(content, 'utf8'));
console.log('Done - schema.prisma fixed');
console.log(content.substring(0, 200));
