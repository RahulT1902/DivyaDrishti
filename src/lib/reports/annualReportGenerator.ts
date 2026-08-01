/**
 * Annual Report Generator
 * Generates year_outlook depth readings for all 4 domains using the Pundit Brain.
 * Called after payment is verified — takes ~15–30s (4 sequential LLM calls).
 */

import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateNarrative } from "@/lib/intelligence/narrativeEngine";
import { extractIntent } from "@/lib/intelligence/intentExtractor";
import { callAI } from "@/lib/ai/provider";
import { computeBodyRiskProfile, getTopRisks } from "@/lib/intelligence/health/bodyRiskProfile";
import { buildHealthFindings } from "@/lib/intelligence/health/healthFindingsEngine";
import { classifyQuestion } from "@/lib/intelligence/v5/intentEngine";
import { buildAstrologicalBrief } from "@/lib/intelligence/v5/astrologicalBriefing";
import { NatalPromiseAnalyzer, LifeDomainActivationEngine, ManifestationRankingEngine } from "@/lib/intelligence/lifeInsights/services";
import { adaptEngineOutput, buildChartSuite } from "@/lib/core/chart-engine";
import { AstrologyContextBuilder } from "@/lib/core/context-builder/astroContextBuilder";
import { TransitAnalyzer, evaluateTransitRules, HEALTH_TRANSIT_RULES } from "@/lib/core/transit-engine";
import { assemblePunditBrain } from "@/lib/consultation/brain";
import type { ChartData } from "@/lib/consultation/brain";
import type { DashaInfo, Sign, PlanetName } from "@/lib/core/types";
import type { TransitSnapshot } from "@/lib/core/transit-engine/types";

const ZODIAC = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const CHAT_TO_VEDIC: Record<string, string> = {
  career: "Career", finance: "Wealth", relationship: "Marriage", health: "Health",
};

const DOMAIN_QUESTIONS: Record<string, (year: number) => string> = {
  career:       (y) => `Give me a complete career and professional outlook for ${y} — what are the major opportunities, challenges, and timing windows?`,
  health:       (y) => `What does ${y} look like for my health and physical wellbeing — what should I be mindful of throughout the year?`,
  finance:      (y) => `Give me a complete financial outlook for ${y} — income, investments, timing, and what to be careful about.`,
  relationship: (y) => `What can I expect in my relationships and personal life in ${y} — romantic, family, and social connections?`,
};

export interface AnnualReportDomains {
  career: string;
  health: string;
  finance: string;
  relationship: string;
}

interface BirthDetails {
  dateOfBirth: Date;
  timeOfBirth: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

async function generateDomain(
  domain: string,
  year: number,
  userId: string,
  birthDetails: BirthDetails,
): Promise<string> {
  const question = DOMAIN_QUESTIONS[domain](year);

  const chart = await calculateLagnaChart({
    date: birthDetails.dateOfBirth.toISOString().split("T")[0],
    time: birthDetails.timeOfBirth,
    latitude: birthDetails.latitude,
    longitude: birthDetails.longitude,
    timezone: birthDetails.timezone,
  });

  const moon = chart.planets.find(p => p.name === "Moon");
  if (!moon) throw new Error("Moon data required");

  const nakshatra  = getNakshatra(moon.longitude);
  const balance    = getBalanceYears(nakshatra.lord, nakshatra.progress);
  const timeline   = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
  const temporal   = getDashaContext(timeline, new Date());
  const currentTransits = await calculateCurrentTransits();

  const { planets: sePlanets, lagna: seLagna } = adaptEngineOutput(chart.planets, chart.lagna);
  const chartSuite = buildChartSuite(sePlanets, seLagna);

  const transitSnapshot: TransitSnapshot = {
    date: new Date().toISOString().split("T")[0],
    julDay: 0,
    positions: currentTransits.positions.map(p => ({
      planet:       p.name as PlanetName,
      longitude:    p.longitude,
      sign:         p.sign as Sign,
      signName:     ZODIAC[p.sign - 1] ?? "Aries",
      degreeInSign: p.longitude % 30,
      speed:        p.speed,
      isRetrograde: p.speed < 0 && p.name !== "Sun" && p.name !== "Moon",
      isCombust:    false,
    })),
  };

  const transitFacts = new TransitAnalyzer().analyze(
    transitSnapshot,
    chart.lagna.sign as Sign,
    chartSuite.D1.planets,
  );
  const symbolicTransitEvidence = evaluateTransitRules(transitFacts, HEALTH_TRANSIT_RULES);

  const dashaInfo: DashaInfo | undefined = temporal ? {
    mahadasha:   temporal.stack.mahadasha as PlanetName,
    antardasha:  temporal.stack.antardasha as PlanetName,
    periodStart: temporal.timing.startsAt.toISOString().split("T")[0],
    periodEnd:   temporal.timing.endsAt.toISOString().split("T")[0],
  } : undefined;

  const symbolicCtx = new AstrologyContextBuilder().build(chartSuite, {
    dasha:   dashaInfo,
    transit: symbolicTransitEvidence,
    horizon: "yearly",
  });

  const intent = { domain, type: "year_outlook", confidence: 1, timeframe: "year" };
  const narrative = generateNarrative(intent as any, "year" as any, chart, {
    ...temporal,
    transits: currentTransits.positions,
  });

  const lagnaSignName     = ZODIAC[chart.lagna.sign - 1] ?? "Aries";
  const natalMoon         = chart.planets.find(p => p.name === "Moon");
  const natalMoonSignName = ZODIAC[(natalMoon?.sign ?? 1) - 1] ?? "Aries";

  const transitSummary = currentTransits.positions.map(p => {
    const house = ((p.sign - chart.lagna.sign + 12) % 12) + 1;
    return `${p.name} in ${ZODIAC[p.sign - 1]} (House ${house})${p.speed < 0 ? " ℞" : ""}`;
  }).join("\n");

  const vedaDomainKey    = CHAT_TO_VEDIC[domain] || "Career";
  const mdLord           = temporal?.stack?.mahadasha || "Saturn";
  const adLord           = temporal?.stack?.antardasha || "Jupiter";
  const natalPromises    = NatalPromiseAnalyzer.evaluate(chart as any);
  const promiseMap       = natalPromises.reduce((acc, p) => { acc[p.domain] = p.score; return acc; }, {} as Record<string, number>);
  const domainPromise    = natalPromises.find(p => p.domain === vedaDomainKey);
  const activations      = LifeDomainActivationEngine.evaluate(mdLord, adLord, chart as any, promiseMap);
  const domainActivation = activations.find(a => a.domain === vedaDomainKey) || activations.sort((a, b) => b.score - a.score)[0];
  const manifestations   = domain !== "health"
    ? ManifestationRankingEngine.getRanked(vedaDomainKey, mdLord, adLord, chart as any, domainPromise?.potential ?? 60)
    : null;

  let bodyRiskProfile = null;
  let healthFindings  = null;
  if (domain === "health" && temporal?.stack) {
    bodyRiskProfile = computeBodyRiskProfile(chart, temporal.stack, currentTransits.positions);
    healthFindings  = buildHealthFindings(bodyRiskProfile);
  }

  const richIntent = classifyQuestion(question, domain);
  const brief = buildAstrologicalBrief(
    narrative as any,
    temporal?.stack ?? { mahadasha: "unknown", antardasha: "unknown" },
    currentTransits.positions,
    chart as any,
    domain,
  );

  const chartData: ChartData = {
    bodyRiskProfile:  domain === "health" ? bodyRiskProfile : null,
    healthFindings:   domain === "health" ? healthFindings  : null,
    natalPromise:     domainPromise ?? null,
    domainActivation: domainActivation ?? null,
    manifestations:   domain !== "health" ? manifestations  : null,
  };

  const brain = await assemblePunditBrain(
    question,
    [],
    userId,
    [],
    symbolicCtx,
    dashaInfo,
    domain,
    chartData,
  );

  const { text } = await callAI({
    system: brain.systemPrompt,
    prompt: brain.userPrompt,
    temperature: brain.temperature,
  });

  const cleanText = text
    .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\nEXPLORE:\s*.+?(?:\n|$)/g, "")
    .trim();

  return brain.renderedSummaryCard
    ? `${brain.renderedSummaryCard}\n\n${cleanText}`
    : cleanText;
}

export async function generateAnnualReport(
  year: number,
  userId: string,
  birthDetails: BirthDetails,
): Promise<AnnualReportDomains> {
  const domains = ["career", "health", "finance", "relationship"] as const;
  const results: Partial<AnnualReportDomains> = {};

  for (const domain of domains) {
    results[domain] = await generateDomain(domain, year, userId, birthDetails);
  }

  return results as AnnualReportDomains;
}
