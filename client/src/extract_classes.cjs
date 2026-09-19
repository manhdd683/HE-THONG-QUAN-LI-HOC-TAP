const fs = require('fs');
const path = require('path');

function getFiles(dir, exts, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, exts, fileList);
    } else if (exts.includes(path.extname(filePath))) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getFiles('.', ['.tsx', '.ts']);
const classes = new Set();
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /className=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    match[1].split(' ').forEach(c => {
      if (c.trim()) classes.add(c.trim());
    });
  }
});

console.log(Array.from(classes).sort().join('\n'));
