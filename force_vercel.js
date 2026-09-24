const fs = require('fs');
const content = JSON.stringify({
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]
}, null, 2);

fs.writeFileSync('client/vercel.json', content, 'utf8');
fs.writeFileSync('vercel.json', content, 'utf8');
console.log('JSON written purely by JSON.stringify');
