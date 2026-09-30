const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));

// Fix postinstall script
delete pkg.scripts.postinstall;

// Move prisma from devDependencies to dependencies
if (pkg.devDependencies && pkg.devDependencies['prisma']) {
  pkg.dependencies['prisma'] = pkg.devDependencies['prisma'];
  delete pkg.devDependencies['prisma'];
}
if (pkg.devDependencies && pkg.devDependencies['@prisma/client']) {
  pkg.dependencies['@prisma/client'] = pkg.devDependencies['@prisma/client'];
  delete pkg.devDependencies['@prisma/client'];
}

// Move typescript and ts-node to dependencies for build
if (pkg.devDependencies && pkg.devDependencies['typescript']) {
  pkg.dependencies['typescript'] = pkg.devDependencies['typescript'];
  delete pkg.devDependencies['typescript'];
}
if (pkg.devDependencies && pkg.devDependencies['ts-node']) {
  pkg.dependencies['ts-node'] = pkg.devDependencies['ts-node'];
  delete pkg.devDependencies['ts-node'];
}

fs.writeFileSync('server/package.json', JSON.stringify(pkg, null, 2), 'utf8');
console.log('Fixed server/package.json');
