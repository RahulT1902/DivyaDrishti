import { load, Constants } from "@fusionstrings/swisseph-wasi";
import path from "path";
import fs from "fs";

// Singleton engine instance to prevent multiple WASM loads
let ephInstance: any = null;

export async function getEngine() {
  if (!ephInstance) {
    // 1. Manually load the WASM binary from the public folder
    // This bypasses Turbopack's 'Module not found' resolution issues in node_modules
    const wasmPath = path.join(process.cwd(), "public", "wasm", "libswephe.wasm");
    const wasmSource = new Uint8Array(fs.readFileSync(wasmPath));

    // 2. Initialize the engine with the manual source
    ephInstance = await load({ wasmSource });

    // 3. Default ephemeris path to public/ephe
    const ephePath = path.join(process.cwd(), "public", "ephe");
    ephInstance.swe_set_ephe_path(ephePath);
  }
  return ephInstance;
}

export interface ChartParams {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  latitude: number;
  longitude: number;
  timezone?: string; // e.g. "Asia/Kolkata"
}

function toUtcFromZonedDateTime(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  // Initial UTC guess, then corrected against the timezone-formatted wall clock.
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

  const getParts = (ms: number) => {
    const parts = formatter.formatToParts(new Date(ms));
    const lookup = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
    return {
      year: lookup("year"),
      month: lookup("month"),
      day: lookup("day"),
      hour: lookup("hour"),
      minute: lookup("minute"),
      second: lookup("second"),
    };
  };

  // Two iterations are enough for timezone/DST correction.
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

export async function calculateLagnaChart(params: ChartParams) {
  const eph = await getEngine();
  
  // 1. Prepare Time (UT) from timezone-aware local birth time
  const timezone = params.timezone || "Asia/Kolkata";
  const utDate = toUtcFromZonedDateTime(params.date, params.time, timezone);
  
  const year = utDate.getUTCFullYear();
  const month = utDate.getUTCMonth() + 1;
  const day = utDate.getUTCDate();
  const utDecimal = utDate.getUTCHours() + utDate.getUTCMinutes() / 60 + utDate.getUTCSeconds() / 3600;
  
  // 2. Julian Day
  const julDay = eph.swe_julday(year, month, day, utDecimal, Constants.SE_GREG_CAL);
  
  // 3. Set Sidereal Mode (Lahiri / Chitra Paksha)
  // SE_SIDM_LAHIRI = 1
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
  
  // 4. Calculate Planets
  const planetsToCalc = [
    { id: Constants.SE_SUN, name: "Sun" },
    { id: Constants.SE_MOON, name: "Moon" },
    { id: Constants.SE_MARS, name: "Mars" },
    { id: Constants.SE_MERCURY, name: "Mercury" },
    { id: Constants.SE_JUPITER, name: "Jupiter" },
    { id: Constants.SE_VENUS, name: "Venus" },
    { id: Constants.SE_SATURN, name: "Saturn" },
    { id: Constants.SE_MEAN_NODE, name: "Rahu" }, 
    { id: -1, name: "Ketu" }, // Ketu is Rahu + 180
  ];

  const roles: Record<string, string> = { 
    Sun: "Vitalizer", Moon: "Nurturer", Mars: "Warrior", 
    Mercury: "Communicator", Jupiter: "Teacher", 
    Venus: "Harmonizer", Saturn: "Builder", 
    Rahu: "Amplifier", Ketu: "Disruptor" 
  };

  interface PlanetResult {
    name: string;
    longitude: number;
    speed: number;
    sign: number;
    positionInSign: number;
    degree: number; 
    navamsaSign: number;
    strengthLevel: string;
    role: string;
    isRetrograde: boolean;
    isCombust: boolean;
    isVargottama: boolean;
  }

  const results: PlanetResult[] = [];
  const flags = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;

  for (const p of planetsToCalc) {
    let planetId = p.id;
    let longitude = 0;
    let speed = 0;

    if (p.name === "Ketu") {
      // Find Rahu longitude first
      const rahu = results.find(r => r.name === "Rahu");
      if (!rahu) throw new Error("Rahu must be calculated before Ketu");
      longitude = (rahu.longitude + 180) % 360;
      speed = rahu.speed;
    } else {
      const { xx } = eph.swe_calc_ut(julDay, planetId, flags);
      longitude = xx[0];
      speed = xx[3];
    }
    
    const sign = Math.floor(longitude / 30) + 1; // 1-12
    const positionInSign = longitude % 30;
    
    // 4b. Calculate Navamsa (D9)
    // A sign is divided into 9 parts of 3.333... degrees each
    const navamsaIndex = Math.floor(positionInSign / (30 / 9)); 
    let navamsaStartSign = 1; // Default Aries
    
    if ([1, 5, 9].includes(sign)) navamsaStartSign = 1; // Fire -> Aries
    else if ([2, 6, 10].includes(sign)) navamsaStartSign = 10; // Earth -> Capricorn
    else if ([3, 7, 11].includes(sign)) navamsaStartSign = 7; // Air -> Libra
    else if ([4, 8, 12].includes(sign)) navamsaStartSign = 4; // Water -> Cancer
    
    const navamsaSign = ((navamsaStartSign + navamsaIndex - 1) % 12) + 1;

    results.push({
      name: p.name,
      longitude,
      speed: speed,
      sign,
      positionInSign,
      degree: Math.floor(positionInSign),
      navamsaSign,
      strengthLevel: "Neutral", // To be updated below
      role: roles[p.name] || "Force",
      isRetrograde: p.name !== "Sun" && p.name !== "Moon" && speed < 0,
      isCombust: false, // Calculated after all planets are known
      isVargottama: sign === navamsaSign,
    });
  }

  // 4c. Combustion & Final Strength Refinement
  const sun = results.find(r => r.name === "Sun");
  const combustionThresholds: Record<string, number> = {
    Mercury: 14, Venus: 10, Mars: 17, Jupiter: 11, Saturn: 15, Moon: 12
  };

  results.forEach(p => {
    if (sun && p.name !== "Sun" && combustionThresholds[p.name]) {
      let diff = Math.abs(p.longitude - sun.longitude);
      if (diff > 180) diff = 360 - diff;
      if (diff < combustionThresholds[p.name]) {
        p.isCombust = true;
      }
    }

    // Update Strength Logic (Consolidated)
    const exalts: any = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7 };
    const debts: any = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1 };
    const own: any = { Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11] };

    if (exalts[p.name] === p.sign) p.strengthLevel = "Dominant";
    else if (debts[p.name] === p.sign) p.strengthLevel = "Weak";
    else if (own[p.name]?.includes(p.sign)) p.strengthLevel = "Supportive";
    else if (p.isVargottama) p.strengthLevel = "Supportive";
    
    if (p.isCombust) p.strengthLevel = "Weak"; // Combustion usually weakens
  });

  // 5. Calculate Lagna (Ascendant) and Houses
  // swe_houses needs UTC, lat, lng, and house system code ('W' for Whole Sign)
  const { cusps, ascmc } = eph.swe_houses_ex(julDay, flags, params.latitude, params.longitude, 'W'.charCodeAt(0));
  
  const lagnaLong = ascmc[0];
  const lagnaSign = Math.floor(lagnaLong / 30) + 1;

  return {
    metadata: {
      julDay,
      ayanamsha: eph.swe_get_ayanamsa_ut(julDay),
    },
    lagna: {
      longitude: lagnaLong,
      sign: lagnaSign,
      positionInSign: lagnaLong % 30,
      degree: Math.floor(lagnaLong % 30),
      navamsaSign: calculateNavamsaForDegree(lagnaLong),
    },
    planets: results,
    // Houses in Whole Sign are just signs starting from Lagna Sign
    houses: cusps.slice(1, 13), 
  };
}

function calculateNavamsaForDegree(longitude: number): number {
  const sign = Math.floor(longitude / 30) + 1;
  const positionInSign = longitude % 30;
  const navamsaIndex = Math.floor(positionInSign / (30 / 9));
  
  let navamsaStartSign = 1;
  if ([1, 5, 9].includes(sign)) navamsaStartSign = 1; 
  else if ([2, 6, 10].includes(sign)) navamsaStartSign = 10;
  else if ([3, 7, 11].includes(sign)) navamsaStartSign = 7;
  else if ([4, 8, 12].includes(sign)) navamsaStartSign = 4;
  
  return ((navamsaStartSign + navamsaIndex - 1) % 12) + 1;
}

function getSignName(sign: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}
