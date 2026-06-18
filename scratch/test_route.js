require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { calculateLagnaChart } = require("../src/lib/astrology/engine");
const { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } = require("../src/lib/astrology/dasha");
const { calculateCurrentTransits } = require("../src/lib/astrology/transit");
const { extractAstroSignals } = require("../src/lib/intelligence/astroSignals");
const { generateNarrative } = require("../src/lib/intelligence/narrativeEngine");
const { generateKundaliReport } = require("../src/lib/intelligence/reportEngine");
const { generateTransitIntelligence } = require("../src/lib/intelligence/transit");
const { synthesizeLifeDomains } = require("../src/lib/intelligence/domain");

const prisma = new PrismaClient();

async function main() {
  const userEmail = "rahul.telang@hotmail.com";
  console.log("Fetching user...");
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    include: { birthDetails: true },
  });

  if (!user || !user.birthDetails) {
    console.log("User not found or birth details missing!");
    return;
  }

  const { birthDetails } = user;
  console.log("Calculating lagna chart...");
  const chart = await calculateLagnaChart({
    date: birthDetails.dateOfBirth.toISOString().split('T')[0], 
    time: birthDetails.timeOfBirth,
    latitude: birthDetails.latitude,
    longitude: birthDetails.longitude,
    timezone: birthDetails.timezone,
  });

  const moon = chart.planets.find(p => p.name === "Moon");
  if (!moon) throw new Error("Moon data required");
  
  console.log("Nakshatra & Balance...");
  const nakshatra = getNakshatra(moon.longitude);
  const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
  const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
  
  console.log("Dasha context & current transits...");
  const temporal = getDashaContext(timeline, new Date());
  const currentTransits = await calculateCurrentTransits();
  
  console.log("Astro signals...");
  let signals = extractAstroSignals(chart, currentTransits.positions, temporal?.stack ?? null, {
    domain: "general",
    type: "general",
    confidence: 1,
    timeframe: "this-week"
  });
  
  console.log("Narrative...");
  const narrative = generateNarrative({
    domain: "general",
    type: "general",
    confidence: 1,
    timeframe: "this-week"
  }, "this-week", chart, temporal, signals);

  console.log("Kundali report...");
  const report = generateKundaliReport(chart, temporal, "this-week");

  console.log("Transit intelligence...");
  const transitIntelligence = generateTransitIntelligence(currentTransits.positions, chart.planets, chart.lagna.sign);
  
  const dashaCtx = {
    mahadasha: temporal?.stack?.mahadasha || "Saturn",
    antardasha: temporal?.stack?.antardasha || "Jupiter",
    pratyantar: temporal?.stack?.pratyantar || "Unknown",
    transitAnchors: []
  };

  console.log("Synthesize domains...");
  const domainIntelligence = synthesizeLifeDomains(chart, dashaCtx, transitIntelligence);
  console.log("Success! Compiled all chart data successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
