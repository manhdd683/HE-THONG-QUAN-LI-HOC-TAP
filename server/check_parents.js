const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const parents = await prisma.user.findMany({
    where: { role: "PARENT" },
    select: { id: true, email: true, name: true, status: true, password_hash: true }
  });
  parents.forEach(p => {
    console.log(`Name: ${p.name} | Email: ${p.email} | Status: ${p.status} | HasPassword: ${!!p.password_hash}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
