const { PrismaClient } = require("@prisma/client");
const { getEngine } = require("../src/lib/astrology/engine");
const { Constants } = require("@fusionstrings/swisseph-wasi");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "rekha@globuzinc.com" },
    include: { birthDetails: true }
  });
  if (!user || !user.birthDetails) {
    console.log("No Rekha user found");
    return;
  }
  const { dateOfBirth, timeOfBirth, latitude, longitude, timezone } = user.birthDetails;
  
  const [hours, minutes] = timeOfBirth.split(":").map(Number);
  const birthDate = new Date(dateOfBirth);
  
  const now = new Date(Date.UTC(
    birthDate.getUTCFullYear(),
    birthDate.getUTCMonth(),
    birthDate.getUTCDate(),
    hours,
    minutes,
    0
  ));
  
  // Calculate UT decimal hours
  const utDecimal = now.getUTCHours() + now.getUTCMinutes() / 60;
  
  const eph = await getEngine();
  const julDay = eph.swe_julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    utDecimal,
    Constants.SE_GREG_CAL
  );
  
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
  const flags = Constants.SEFLG_SIDEREAL;
  const { ascmc } = eph.swe_houses_ex(julDay, flags, latitude, longitude, 'W'.charCodeAt(0));
  
  const lagnaLong = ascmc[0];
  const lagnaSign = Math.floor(lagnaLong / 30) + 1;
  
  console.log("Lagna Longitude:", lagnaLong);
  console.log("Lagna Sign Index:", lagnaSign); // 1 = Aries, 12 = Pisces
}

main().catch(console.error).finally(() => prisma.$disconnect());
