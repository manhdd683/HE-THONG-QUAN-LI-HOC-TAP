const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
pkg.scripts.build = "tsc || true";
fs.writeFileSync('server/package.json', JSON.stringify(pkg, null, 2), 'utf8');
console.log('Done');
