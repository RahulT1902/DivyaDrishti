require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { load, Constants } = require("@fusionstrings/swisseph-wasi");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

async function getEngine() {
  const wasmPath = path.join(process.cwd(), "public", "wasm", "libswephe.wasm");
  const wasmSource = new Uint8Array(fs.readFileSync(wasmPath));
  const ephInstance = await load({ wasmSource });
  const ephePath = path.join(process.cwd(), "public", "ephe");
  ephInstance.swe_set_ephe_path(ephePath);
  return ephInstance;
}

function toUtcFromZonedDateTime(date, time, timezone) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const getParts = (ms) => {
    const parts = formatter.formatToParts(new Date(ms));
    const lookup = (type) => Number(parts.find((p) => p.type === type)?.value ?? "0");
    return {
      year: lookup("year"),
      month: lookup("month"),
      day: lookup("day"),
      hour: lookup("hour"),
      minute: lookup("minute"),
      second: lookup("second"),
    };
  };

  for (let i = 0; i < 2; i++) {
    const local = getParts(utcMs);
    const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const observedAsUtcMs = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second
    );
    utcMs += desiredAsUtcMs - observedAsUtcMs;
  }

  return new Date(utcMs);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "rahul.telang@hotmail.com" },
    include: { birthDetails: true }
  });
  if (!user || !user.birthDetails) {
    console.log("No Rahul user found");
    return;
  }
  const { dateOfBirth, timeOfBirth, latitude, longitude, timezone } = user.birthDetails;
  
  const formattedDate = dateOfBirth.toISOString().split("T")[0];
  const utDate = toUtcFromZonedDateTime(formattedDate, timeOfBirth, timezone);
  
  const year = utDate.getUTCFullYear();
  const month = utDate.getUTCMonth() + 1;
  const day = utDate.getUTCDate();
  const utDecimal = utDate.getUTCHours() + utDate.getUTCMinutes() / 60 + utDate.getUTCSeconds() / 3600;
  
  const eph = await getEngine();
  const julDay = eph.swe_julday(year, month, day, utDecimal, Constants.SE_GREG_CAL);
  
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
  const flags = Constants.SEFLG_SIDEREAL;
  const { ascmc } = eph.swe_houses_ex(julDay, flags, latitude, longitude, 'W'.charCodeAt(0));
  
  const lagnaLong = ascmc[0];
  const lagnaSign = Math.floor(lagnaLong / 30) + 1;
  
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  console.log("Lagna Longitude:", lagnaLong);
  console.log("Lagna Sign Index:", lagnaSign, "which is", signs[lagnaSign - 1]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
