import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { calculateLagnaChart } from "../src/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "../src/lib/astrology/dasha";
import { calculateCurrentTransits } from "../src/lib/astrology/transit";
import { extractAstroSignals } from "../src/lib/intelligence/astroSignals";
import { generateNarrative } from "../src/lib/intelligence/narrativeEngine";
import { generateTransitIntelligence } from "../src/lib/intelligence/transit";
import { synthesizeLifeDomains } from "../src/lib/intelligence/domain";

import { LifeStateSynthesizer } from "../src/lib/intelligence/synthesizers/lifeStateSynthesizer";
import { TimelineProjectionEngine } from "../src/lib/intelligence/timeline/timelineProjectionEngine";
import { DashboardStateComposer } from "../src/lib/dashboard/dashboardStateComposer";

async function getChartData() {
  const user = await prisma.user.findFirst({
    where: { email: "rahul.telang@hotmail.com" },
    include: { birthDetails: true },
  });

  if (!user || !user.birthDetails) {
    throw new Error("User or birth details not found");
  }

  const { birthDetails } = user;
  const chart = await calculateLagnaChart({
    date: birthDetails.dateOfBirth.toISOString().split('T')[0], 
    time: birthDetails.timeOfBirth,
    latitude: birthDetails.latitude,
    longitude: birthDetails.longitude,
    timezone: birthDetails.timezone,
  });

  const moon = chart.planets.find(p => p.name === "Moon");
  if (!moon) throw new Error("Moon data required");
  
  const nakshatra = getNakshatra(moon.longitude);
  const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
  const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
  const temporal = getDashaContext(timeline, new Date());
  const currentTransits = await calculateCurrentTransits();
  const signals = extractAstroSignals(chart, currentTransits.positions, temporal?.stack ?? null, {
    domain: "general",
    type: "general",
    confidence: 1,
    timeframe: "this-week"
  });
  
  const narrative = generateNarrative({
    domain: "general",
    type: "general",
    confidence: 1,
    timeframe: "this-week"
  }, "this-week", chart, temporal, signals);

  const transitIntelligence = generateTransitIntelligence(currentTransits.positions, chart.planets, chart.lagna.sign);
  const dashaCtx = {
    mahadasha: temporal?.stack?.mahadasha || "Saturn",
    antardasha: temporal?.stack?.antardasha || "Jupiter",
    pratyantar: temporal?.stack?.pratyantar || "Unknown",
    transitAnchors: []
  };

  const domainIntelligence = synthesizeLifeDomains(chart, dashaCtx as any, transitIntelligence);

  return {
    chart,
    temporal,
    timeline,
    transitIntelligence,
    domainIntelligence,
    narrative: narrative.realityTranslation || narrative.verdict,
    insights: {
      primary: narrative.heroInsight || "Hero...",
      caution: narrative.phases?.[0]?.cautions?.[0] || "Caution..."
    },
    guidance: {
      do: narrative.phases?.[0]?.opportunities || ["Do..."],
      avoid: narrative.phases?.[0]?.cautions || ["Avoid..."]
    }
  };
}

async function main() {
  console.log("Simulating API call...");
  const chartData = await getChartData();
  console.log("API simulation successful. Mocking UI state computation...");

  // Exactly replicate frontend code:
  const realNatal = chartData.chart;
  const realDashaCtx = { 
    currentMahadasha: chartData.temporal?.stack?.mahadasha, 
    currentAntardasha: chartData.temporal?.stack?.antardasha 
  };
  const realTransits = chartData.transitIntelligence?.signals || [];
  const rawTimeline = chartData.timeline || [];
  const realTimeline = rawTimeline.map((p: any) => ({
    planet: p.planet,
    start: new Date(p.start),
    end: new Date(p.end)
  }));

  console.log("Initializing synthesizers...");
  const synthesizer = new LifeStateSynthesizer();
  const projector = new TimelineProjectionEngine();
  const composer = new DashboardStateComposer();

  console.log("Synthesizing lifeState...");
  const lifeState = await synthesizer.synthesize(realNatal, realDashaCtx as any, realTimeline, realTransits);
  
  console.log("Projecting timeline...");
  const projection = await projector.project("90D",
    { primaryArchetype: "Architect", longTermThemes: ["Structure", "Growth"], confidence: 0.8 } as any,
    { intensity: 5, activeTriggers: [], data: {} } as any
  );

  console.log("Composing dashboard state...");
  const uiState = composer.compose(lifeState, projection);
  console.log("Success! Composed UI state successfully without errors.");
  console.log("Sample UI State overall title:", uiState.currentPhase.title);
}

main().catch(console.error).finally(() => prisma.$disconnect());
