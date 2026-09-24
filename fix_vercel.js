const fs = require('fs');

const content = `{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`;

fs.writeFileSync('client/vercel.json', content, 'utf8');
fs.writeFileSync('vercel.json', content, 'utf8');
