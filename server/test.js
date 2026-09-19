const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: 'newparent@example.com' },
  data: { email: 'phuhuynh@example.com' }
}).then(console.log).finally(() => prisma.$disconnect());
