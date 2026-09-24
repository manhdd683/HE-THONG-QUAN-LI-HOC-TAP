const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: { role: "PARENT", status: "ARCHIVED" },
    data: { status: "ACTIVE" }
  });
  console.log("Done - activated all archived parents");
}
main().catch(console.error).finally(() => prisma.$disconnect());
