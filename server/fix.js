const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove @@unique([student_id, subject]) from SubjectScoreBoard
content = content.replace('@@unique([student_id, subject])', '// @@unique([student_id, subject])');

// Add title String @default("B?ng ?i?m") to SubjectScoreBoard precisely
content = content.replace('subject       String\n  \n  daily_score', 'subject       String\n  title         String    @default("B?ng ?i?m")\n  daily_score');
// Also try \r\n if windows
content = content.replace('subject       String\r\n  \r\n  daily_score', 'subject       String\r\n  title         String    @default("B?ng ?i?m")\r\n  daily_score');

fs.writeFileSync('prisma/schema.prisma', Buffer.from(content, 'utf8'));
console.log('Schema updated.');
