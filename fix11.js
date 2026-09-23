const fs = require('fs');
const file = 'server/src/controllers/achievement.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the gte: 5.0 with gte: 8.0
content = content.replace('average_score: { gte: 5.0 } // Passed', 'average_score: { gte: 8.0 } // Excellent');

// Replace the if/else generation block
const oldBlock = `          if (!existing) {
            // Generate certificate based on score
            let title = \`Hoàn thành môn \${board.subject}\`;
            let description = \`Học sinh đã hoàn thành chương trình môn \${board.subject} với điểm trung bình \${board.average_score?.toFixed(1)}.\`;
            
            if (board.average_score && board.average_score >= 8.0) {
              title = \`Xuất sắc môn \${board.subject}\`;
              description = \`Học sinh đạt thành tích xuất sắc môn \${board.subject} với điểm trung bình \${board.average_score?.toFixed(1)}.\`;
            }

            const metrics = JSON.stringify({`;

const newBlock = `          if (!existing) {
            // Generate certificate based on score (only >= 8.0 now)
            let title = \`Xuất sắc môn \${board.subject}\`;
            let description = \`Học sinh đạt thành tích xuất sắc môn \${board.subject} với điểm trung bình \${board.average_score?.toFixed(1)}.\`;

            const metrics = JSON.stringify({`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(file, content);
console.log('Fixed achievement criteria');
