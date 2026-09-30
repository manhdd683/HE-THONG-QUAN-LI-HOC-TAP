const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Scores/StudentScoreCard.tsx');
if (content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf) {
  content = content.slice(3);
}
fs.writeFileSync('client/src/pages/Scores/StudentScoreCard.tsx', content);
console.log('BOM removed');
