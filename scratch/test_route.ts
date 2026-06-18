import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { calculateLagnaChart } from "../src/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "../src/lib/astrology/dasha";
import { calculateCurrentTransits } from "../src/lib/astrology/transit";
import { extractAstroSignals } from "../src/lib/intelligence/astroSignals";
import { generateNarrative } from "../src/lib/intelligence/narrativeEngine";
import { generateKundaliReport } from "../src/lib/intelligence/reportEngine";
import { generateTransitIntelligence } from "../src/lib/intelligence/transit";
import { synthesizeLifeDomains } from "../src/lib/intelligence/domain";

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
  const domainIntelligence = synthesizeLifeDomains(chart, dashaCtx as any, transitIntelligence);
  console.log("Success! Compiled all chart data successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
