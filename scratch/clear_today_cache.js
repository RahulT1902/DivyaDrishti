const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getMidnightUTC(date) {
  const d = date ? new Date(date) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const email = "rahul.telang@hotmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  const targetDate = getMidnightUTC();
  console.log("Deleting daily insight cache for user:", email, "on UTC date:", targetDate.toISOString());

  const result = await prisma.dailyInsight.deleteMany({
    where: {
      userId: user.id,
      date: targetDate,
    },
  });

  console.log("SUCCESS: Deleted", result.count, "cached records.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
