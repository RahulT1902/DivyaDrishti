const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userEmail = "rahul.telang@hotmail.com";
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    include: { birthDetails: true },
  });
  console.log("USER:", JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
