import { PrismaClient } from "@prisma/client";
import { calculateLagnaChart } from "../src/lib/astrology/engine";

const prisma = new PrismaClient();

async function main() {
  const userEmail = "rahul.telang@hotmail.com";
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    include: { birthDetails: true },
  });

  if (!user || !user.birthDetails) {
    console.log("User not found!");
    return;
  }

  const chart = await calculateLagnaChart({
    date: user.birthDetails.dateOfBirth.toISOString().split('T')[0],
    time: user.birthDetails.timeOfBirth,
    latitude: user.birthDetails.latitude,
    longitude: user.birthDetails.longitude,
    timezone: user.birthDetails.timezone || "Asia/Kolkata",
  });

  console.log("CALCULATED CHART:");
  console.log("Lagna Sign Index:", chart.lagna.sign);
  console.log("Lagna Longitude:", chart.lagna.longitude);
  console.log("Planets:", JSON.stringify(chart.planets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
