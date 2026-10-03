const fs = require('fs');
let content = fs.readFileSync('server/src/controllers/tuition.controller.ts', 'utf8');

const regex = /let final_price = 0;\n\s*let total_amount = 0;\n\s*if \(subject && subject\.trim\(\) !== ''\) \{\n\s*if \(custom_total_amount !== undefined\) \{\n\s*total_amount = parseFloat\(custom_total_amount\);\n\s*final_price = parseFloat\(price_per_session\) \|\| 0;\n\s*\} else \{\n\s*final_price = parseFloat\(price_per_session\) \|\| 0;\n\s*total_amount = parseInt\(total_sessions\) \* final_price;\n\s*\}\n\s*\}/g;

const replacement = `      let final_price = parseFloat(price_per_session) || 0;
      let total_amount = 0;
      
      if (custom_total_amount !== undefined) {
        total_amount = parseFloat(custom_total_amount);
      } else if (subject && subject.trim() !== '') {
        total_amount = parseInt(total_sessions) * final_price;
      }`;

content = content.replace(regex, replacement);
fs.writeFileSync('server/src/controllers/tuition.controller.ts', Buffer.from(content, 'utf8'));
console.log('Fixed createTuitionCycle total_amount logic');
