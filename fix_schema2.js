const fs = require('fs');
let content = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
content = content.replace(/@default\("B\?ng \?i\?m"\)/g, '@default("Bảng điểm")');
fs.writeFileSync('server/prisma/schema.prisma', Buffer.from(content, 'utf8'));
console.log('Fixed schema.prisma');
