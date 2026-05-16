import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import {
  DASHA_SEQUENCE,
  DASHA_YEARS,
  buildMahadashaTimeline,
  getBalanceYears,
  getCurrentDasha,
  getNakshatra,
  type Period,
} from "@/lib/astrology/dasha";

type Domain = "career" | "finance" | "health" | "relationships" | "growth" | "mind";
type Timeframe = "today" | "this-week" | "this-month" | "this-year";
type OutputMode = "PANDIT" | "SIMPLE_ENGLISH";
type PlanetName = (typeof DASHA_SEQUENCE)[number] | "Sun" | "Moon" | "Mars" | "Venus" | "Mercury" | "Rahu" | "Ketu" | "Jupiter" | "Saturn";
type ChartPlanet = { name: string; longitude: number; house?: number };
type ChartData = { lagna: { sign: number }; planets: ChartPlanet[] };
type TransitPosition = { name: string; longitude: number };
type TransitData = { positions: TransitPosition[] };

type DashaContext = {
  md: Period;
  ad: Period;
  pd: Period;
  previousPd: Period | null;
};

type WeightedBreakdown = {
  natal: number;
  dasha: number;
  transit: number;
  final: number;
};

type PhaseTag =
  | "FOUNDATION_PHASE"
  | "PRESSURE_PHASE"
  | "BREAKTHROUGH_WINDOW"
  | "DELAY_WITH_PURPOSE"
  | "ILLUSION_PHASE"
  | "STABILITY_BUILDING"
  | "EXPANSION_WINDOW";

type DomainConfig = {
  label: string;
  houses: number[];
  keyPlanets: PlanetName[];
  focusLine: string;
  doList: string[];
  avoidList: string[];
  outcomeLine: string;
};

const DOMAIN_CONFIG: Record<Domain, DomainConfig> = {
  career: {
    label: "Career",
    houses: [10, 6, 2],
    keyPlanets: ["Saturn", "Sun", "Mercury", "Jupiter"],
    focusLine: "execution quality, visibility discipline, and stable compounding",
    doList: [
      "Prioritize deep work and system reliability",
      "Communicate progress clearly to key stakeholders",
      "Build assets that compound over weeks and months",
    ],
    avoidList: [
      "Impulsive pivots without evidence",
      "Comparing your pace with others daily",
      "Dropping in-progress work mid-cycle",
    ],
    outcomeLine: "Career traction will follow consistent execution more than intensity spikes.",
  },
  finance: {
    label: "Finance",
    houses: [2, 11, 8],
    keyPlanets: ["Jupiter", "Venus", "Saturn", "Rahu"],
    focusLine: "cash discipline, risk governance, and intelligent allocation",
    doList: [
      "Track inflow and outflow with zero ambiguity",
      "Prioritize downside protection before upside chasing",
      "Commit to a plan-based allocation rhythm",
    ],
    avoidList: [
      "Speculative overexposure",
      "Emotional spending under stress",
      "Frequent strategy switching",
    ],
    outcomeLine: "Capital preservation plus process quality will outperform reactive decisions.",
  },
  health: {
    label: "Health",
    houses: [6, 1, 8],
    keyPlanets: ["Mars", "Moon", "Saturn", "Sun"],
    focusLine: "recovery quality, consistency, and stress regulation",
    doList: [
      "Lock sleep and meal timing",
      "Use moderate but consistent physical activity",
      "Reduce mental overload through structured downtime",
    ],
    avoidList: [
      "Overtraining when recovery is low",
      "Ignoring stress signals",
      "Inconsistent routines",
    ],
    outcomeLine: "Sustainable health gains come from rhythm, not occasional intensity.",
  },
  relationships: {
    label: "Relationships",
    houses: [7, 5, 4],
    keyPlanets: ["Venus", "Moon", "Mercury", "Jupiter"],
    focusLine: "emotional clarity, communication quality, and trust-building",
    doList: [
      "Speak directly and calmly",
      "Create intentional quality time",
      "Resolve friction early with empathy",
    ],
    avoidList: [
      "Passive assumptions",
      "Delayed difficult conversations",
      "Emotion-driven reactions in conflict",
    ],
    outcomeLine: "Relational strength improves through consistency and respectful clarity.",
  },
  growth: {
    label: "Personal Growth",
    houses: [9, 5, 1],
    keyPlanets: ["Jupiter", "Sun", "Ketu", "Mercury"],
    focusLine: "skill expansion, philosophical clarity, and disciplined evolution",
    doList: [
      "Build one high-leverage learning stack",
      "Document progress and reflection weekly",
      "Convert insights into repeatable habits",
    ],
    avoidList: [
      "Collecting knowledge without implementation",
      "Starting too many paths simultaneously",
      "Quitting right before momentum",
    ],
    outcomeLine: "Your evolution accelerates when learning and action stay tightly connected.",
  },
  mind: {
    label: "Mind & Peace",
    houses: [4, 12, 5],
    keyPlanets: ["Moon", "Mercury", "Ketu", "Jupiter"],
    focusLine: "mental clarity, emotional steadiness, and inner quiet",
    doList: [
      "Use structured reflection and journaling",
      "Limit cognitive clutter and noise",
      "Maintain a daily grounding practice",
    ],
    avoidList: [
      "Information overload",
      "Self-critical rumination loops",
      "Late-night overanalysis",
    ],
    outcomeLine: "Mental peace builds through boundaries, rest, and gentle structure.",
  },
};

const domainInsights: Record<Domain, { title: string; description: string }> = {
  career: {
    title: "Career Guidance",
    description: "Professional growth, job changes, and opportunities",
  },
  finance: {
    title: "Financial Insights",
    description: "Investments, income, and financial decisions",
  },
  health: {
    title: "Health & Wellness",
    description: "Physical and mental well-being",
  },
  relationships: {
    title: "Relationship Guidance",
    description: "Love, family, and social connections",
  },
  growth: {
    title: "Personal Growth",
    description: "Self-improvement and life evolution",
  },
  mind: {
    title: "Mind & Peace",
    description: "Mental clarity, meditation, and inner peace",
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get("timeframe") as Timeframe) || "today";
    const domain = (searchParams.get("domain") as Domain) || "career";
    const mode = normalizeOutputMode(searchParams.get("mode"));

    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user || !user.birthDetails) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const chart = await calculateLagnaChart({
      date: user.birthDetails.dateOfBirth.toISOString().split("T")[0],
      time: user.birthDetails.timeOfBirth,
      latitude: user.birthDetails.latitude,
      longitude: user.birthDetails.longitude,
      timezone: user.birthDetails.timezone,
    });

    const currentTransits = await calculateCurrentTransits();

    const moon = (chart as ChartData).planets.find((p) => p.name === "Moon");
    if (!moon) {
      return NextResponse.json(
        { success: false, error: "Moon position not found in chart" },
        { status: 400 }
      );
    }

    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(user.birthDetails.dateOfBirth, nakshatra.lord, balance);
    const now = new Date();
    const currentDasha = getCurrentDasha(timeline, now);

    if (!currentDasha?.md || !currentDasha?.ad) {
      return NextResponse.json(
        { success: false, error: "Current dasha period not available" },
        { status: 400 }
      );
    }

    const dashaContext = resolveDashaContext(currentDasha.md, currentDasha.ad, now);

    const predictions = generateDomainPredictions(
      chart,
      currentTransits,
      dashaContext,
      domain,
      timeframe,
      user.name ?? user.email ?? "You",
      mode
    );

    return NextResponse.json({
      success: true,
      predictions: {
        ...predictions,
        ...domainInsights[domain],
        timeframe,
        domain,
      },
    });
  } catch (error: unknown) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown prediction error" },
      { status: 500 }
    );
  }
}

function generateDomainPredictions(
  chart: ChartData,
  transits: TransitData,
  dasha: DashaContext,
  domain: Domain,
  timeframe: Timeframe,
  recipientName: string,
  mode: OutputMode
) {
  return generateDetailedDomainReport(chart, transits, dasha, domain, timeframe, recipientName, mode);
}

function resolveDashaContext(md: Period, ad: Period, now: Date): DashaContext {
  const pdPeriods = buildPratyantar(ad);
  const pd = pdPeriods.find((p) => now >= p.start && now < p.end) ?? pdPeriods[pdPeriods.length - 1];
  const pdIndex = pdPeriods.findIndex(
    (p) => p.planet === pd.planet && p.start.getTime() === pd.start.getTime()
  );

  return {
    md,
    ad,
    pd,
    previousPd: pdIndex > 0 ? pdPeriods[pdIndex - 1] : null,
  };
}

function buildPratyantar(ad: Period): Period[] {
  const adTotalMs = ad.end.getTime() - ad.start.getTime();
  const periods: Period[] = [];
  let cursor = new Date(ad.start);
  const startIndex = DASHA_SEQUENCE.indexOf(ad.planet as (typeof DASHA_SEQUENCE)[number]);

  for (let i = 0; i < 9; i++) {
    const p = DASHA_SEQUENCE[(startIndex + i) % 9];
    const fraction = DASHA_YEARS[p] / 120;
    const durationMs = adTotalMs * fraction;
    const end = new Date(cursor.getTime() + durationMs);
    periods.push({ planet: p, start: cursor, end });
    cursor = new Date(end);
  }

  return periods;
}

function getSignName(signNumber: number): string {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  return signs[(signNumber - 1 + 12) % 12];
}

function getSignRuler(sign: string): string {
  const rulers: Record<string, string> = {
    Aries: "Mars",
    Taurus: "Venus",
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter",
  };
  return rulers[sign] || "Unknown";
}

function getPlanetDescription(planet: string): string {
  const descriptions: Record<string, string> = {
    Rahu: "Drives ambition, risk appetite, and unconventional leaps.",
    Jupiter: "Adds intelligence, strategy, guidance, and expansion potential.",
    Saturn: "Tests patience and discipline, then gives durable outcomes.",
    Mars: "Provides execution power and urgency.",
    Venus: "Brings harmony and creative expression.",
    Mercury: "Enhances communication and analytical sharpness.",
    Moon: "Influences emotions and intuition.",
    Sun: "Supports leadership and confidence.",
    Ketu: "Encourages detachment from distractions.",
  };
  return descriptions[planet] || "General planetary influence";
}

function getSignFromLongitude(longitude: number): number {
  return Math.floor(longitude / 30) + 1;
}

function getHouseFromLagna(lagnaSign: number, longitude: number): number {
  const planetSign = getSignFromLongitude(longitude);
  return ((planetSign - lagnaSign + 12) % 12) + 1;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function addDays(date: Date, days: number): Date {
  const output = new Date(date);
  output.setDate(output.getDate() + days);
  return output;
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

function calculateCareerScore(dasha: DashaContext, transits: TransitData, lagnaSign: number): number {
  let score = 6;

  if (dasha.pd.planet === "Saturn") score += 0.5;
  if (dasha.ad.planet === "Jupiter") score += 0.5;
  if (dasha.md.planet === "Rahu") score += 0.3;

  const saturn = transits.positions?.find((p) => p.name === "Saturn");
  const jupiter = transits.positions?.find((p) => p.name === "Jupiter");
  const rahu = transits.positions?.find((p) => p.name === "Rahu");

  const saturnHouse = saturn ? getHouseFromLagna(lagnaSign, saturn.longitude) : 0;
  const jupiterHouse = jupiter ? getHouseFromLagna(lagnaSign, jupiter.longitude) : 0;
  const rahuHouse = rahu ? getHouseFromLagna(lagnaSign, rahu.longitude) : 0;

  if (saturnHouse === 9 || saturnHouse === 10) score += 0.2;
  if (jupiterHouse === 10 || jupiterHouse === 11) score += 0.3;
  if (rahuHouse === 10) score += 0.3;

  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

function getTransitHouse(transits: TransitData, lagnaSign: number, planet: PlanetName): number | null {
  const point = transits.positions.find((p) => p.name === planet);
  return point ? getHouseFromLagna(lagnaSign, point.longitude) : null;
}

function getNatalHouse(chart: ChartData, planet: PlanetName): number | null {
  const point = chart.planets.find((p) => p.name === planet);
  return point ? getHouseFromLagna(chart.lagna.sign, point.longitude) : null;
}

function getTimeframeWindow(timeframe: Timeframe, now: Date) {
  if (timeframe === "today") {
    return { label: `Today (${formatDate(now)})`, start: now, end: now };
  }
  if (timeframe === "this-week") {
    return { label: `This Week (${formatShort(now)} - ${formatShort(addDays(now, 6))})`, start: now, end: addDays(now, 6) };
  }
  if (timeframe === "this-month") {
    return { label: `This Month (${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })})`, start: now, end: addDays(now, 29) };
  }
  return { label: `This Year (${now.getFullYear()})`, start: now, end: addDays(now, 364) };
}

function calculateDomainScore(domain: Domain, dasha: DashaContext, transits: TransitData, lagnaSign: number): number {
  const cfg = DOMAIN_CONFIG[domain];
  let score = 5.8;

  if (cfg.keyPlanets.includes(dasha.md.planet as PlanetName)) score += 0.5;
  if (cfg.keyPlanets.includes(dasha.ad.planet as PlanetName)) score += 0.7;
  if (cfg.keyPlanets.includes(dasha.pd.planet as PlanetName)) score += 0.5;

  const jupiterHouse = getTransitHouse(transits, lagnaSign, "Jupiter");
  const saturnHouse = getTransitHouse(transits, lagnaSign, "Saturn");
  const rahuHouse = getTransitHouse(transits, lagnaSign, "Rahu");

  if (jupiterHouse !== null && cfg.houses.includes(jupiterHouse)) score += 0.4;
  if (saturnHouse !== null && cfg.houses.includes(saturnHouse)) score += 0.3;
  if (rahuHouse !== null && cfg.houses.includes(rahuHouse)) score += 0.2;

  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

function calculateWeightedBreakdown(
  chart: ChartData,
  domain: Domain,
  dasha: DashaContext,
  transits: TransitData
): WeightedBreakdown {
  const cfg = DOMAIN_CONFIG[domain];
  const lagnaSign = chart.lagna.sign;

  const natalHits = cfg.keyPlanets.reduce((acc, planet) => {
    const house = getNatalHouse(chart, planet);
    return house !== null && cfg.houses.includes(house) ? acc + 1 : acc;
  }, 0);
  const natal = Math.min(10, 4 + (natalHits / Math.max(cfg.keyPlanets.length, 1)) * 6);

  let dashaRaw = 4;
  if (cfg.keyPlanets.includes(dasha.md.planet as PlanetName)) dashaRaw += 2;
  if (cfg.keyPlanets.includes(dasha.ad.planet as PlanetName)) dashaRaw += 2.5;
  if (cfg.keyPlanets.includes(dasha.pd.planet as PlanetName)) dashaRaw += 1.5;
  const dashaScore = Math.min(10, dashaRaw);

  const transitPlanets: PlanetName[] = ["Saturn", "Jupiter", "Rahu", "Moon"];
  const transitHits = transitPlanets.reduce((acc, p) => {
    const house = getTransitHouse(transits, lagnaSign, p);
    return house !== null && cfg.houses.includes(house) ? acc + 1 : acc;
  }, 0);
  const transit = Math.min(10, 4 + (transitHits / transitPlanets.length) * 6);

  const finalRaw = natal * 0.35 + dashaScore * 0.4 + transit * 0.25;
  const final = Math.min(10, Math.max(1, Math.round(finalRaw * 10) / 10));

  return {
    natal: Math.round(natal * 10) / 10,
    dasha: Math.round(dashaScore * 10) / 10,
    transit: Math.round(transit * 10) / 10,
    final,
  };
}

function buildStateTags(dasha: DashaContext, breakdown: WeightedBreakdown): PhaseTag[] {
  const tags: PhaseTag[] = [];
  if (breakdown.final >= 7.6) tags.push("BREAKTHROUGH_WINDOW");
  if (breakdown.final >= 6 && breakdown.final < 7.6) tags.push("FOUNDATION_PHASE");
  if (breakdown.final < 6) tags.push("PRESSURE_PHASE");
  if (dasha.pd.planet === "Saturn") tags.push("STABILITY_BUILDING");
  if (dasha.md.planet === "Rahu") tags.push("ILLUSION_PHASE");
  if (dasha.ad.planet === "Jupiter") tags.push("EXPANSION_WINDOW");
  if (dasha.pd.planet === "Saturn" && dasha.ad.planet === "Jupiter") tags.push("DELAY_WITH_PURPOSE");
  return Array.from(new Set(tags));
}

function generatePhaseBreakdown(timeframe: Timeframe, start: Date, end: Date, domain: Domain): string {
  const cfg = DOMAIN_CONFIG[domain];
  if (timeframe === "today") {
    return `${formatShort(start)} (Morning -> Night)\nStart with planning and grounding, then execute the single highest-leverage action in ${cfg.label.toLowerCase()}.\nEnd the day with review, not emotional judgment.`;
  }
  if (timeframe === "this-week") {
    return `${formatShort(start)}-${formatShort(addDays(start, 1))}\nSet priorities and remove noise.\n\n${formatShort(addDays(start, 2))}-${formatShort(addDays(start, 4))}\nStrongest execution window. Focus on ${cfg.focusLine}.\n\n${formatShort(addDays(start, 5))}-${formatShort(end)}\nConsolidate gains, document learning, and prepare next cycle.`;
  }
  if (timeframe === "this-month") {
    return `Week 1\nStabilize routines and remove bottlenecks.\n\nWeek 2-3\nMain build and execution cycle for ${cfg.label.toLowerCase()}.\n\nWeek 4\nAudit outcomes, close loose ends, and lock next-month systems.`;
  }
  return `Quarter 1\nFoundation, process design, and discipline.\n\nQuarter 2-3\nCompounding phase where consistency creates visible gains.\n\nQuarter 4\nConsolidation, strategic correction, and durable positioning.`;
}

function generateDetailedDomainReport(
  chart: ChartData,
  transits: TransitData,
  dasha: DashaContext,
  domain: Domain,
  timeframe: Timeframe,
  recipientName: string,
  mode: OutputMode
) {
  const now = new Date();
  const cfg = DOMAIN_CONFIG[domain];
  const window = getTimeframeWindow(timeframe, now);

  const transitionLine =
    daysBetween(dasha.pd.start, now) <= 14
      ? `your Dasha shifted to ${dasha.md.planet}-${dasha.ad.planet}-${dasha.pd.planet} on ${formatDate(dasha.pd.start)}`
      : `you are currently in ${dasha.md.planet}-${dasha.ad.planet}-${dasha.pd.planet}, active since ${formatDate(dasha.pd.start)}`;

  const saturnHouse = getTransitHouse(transits, chart.lagna.sign, "Saturn");
  const jupiterHouse = getTransitHouse(transits, chart.lagna.sign, "Jupiter");
  const rahuHouse = getTransitHouse(transits, chart.lagna.sign, "Rahu");
  const moonHouse = getTransitHouse(transits, chart.lagna.sign, "Moon");

  const keyNatal = cfg.keyPlanets
    .map((planet) => `${planet}: house ${getNatalHouse(chart, planet) ?? "unknown"}`)
    .join("\n");

  const score =
    domain === "career"
      ? calculateCareerScore(dasha, transits, chart.lagna.sign)
      : calculateDomainScore(domain, dasha, transits, chart.lagna.sign);
  const weighted = calculateWeightedBreakdown(chart, domain, dasha, transits);
  const stateTags = buildStateTags(dasha, weighted);
  const currentPhase = stateTags[0] ?? "FOUNDATION_PHASE";
  const strengthLabel = score >= 7.5 ? "supportive" : score >= 6 ? "mixed but workable" : "sensitive and correction-oriented";
  const keyHouseSummary = cfg.houses
    .map((h) => {
      const sign = getSignName(((chart.lagna.sign + h - 2) % 12) + 1);
      return `House ${h} (${sign}, ruled by ${getSignRuler(sign)})`;
    })
    .join(", ");

  const timeframeDetail = generateTimeframeLayer(timeframe, window.start, window.end, domain);
  const areaSpecific = generateAreaSpecificLayer(domain, score, dasha, saturnHouse, jupiterHouse, rahuHouse);
  const practicalLayer = generatePracticalLayer(domain, timeframe, weighted.final);
  const realityCheck = generateRealityCheckLayer(domain, timeframe, weighted.final);
  const crossImpact = generateCrossImpactLayer(domain);
  const narrative = generateNarrativeLayer(
    mode,
    recipientName,
    cfg,
    domain,
    timeframe,
    transitionLine,
    weighted.final,
    currentPhase,
    now,
    dasha,
    saturnHouse,
    jupiterHouse,
    rahuHouse,
    moonHouse
  );

  return {
    analysis: mode === "PANDIT"
      ? `${recipientName}, à¤…à¤­à¥€ à¤œà¥‹ à¤¸à¤®à¤¯ à¤šà¤² à¤°à¤¹à¤¾ à¤¹à¥ˆ, à¤µà¤¹ ${cfg.label.toLowerCase()} à¤®à¥‡à¤‚ à¤§à¥€à¤°à¥‡-à¤§à¥€à¤°à¥‡ à¤®à¤œà¤¬à¥‚à¤¤ à¤ªà¥à¤°à¤—à¤¤à¤¿ à¤¬à¤¨à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤šà¤°à¤£ à¤¹à¥ˆà¥¤`
      : `${recipientName}, right now you are in a structured phase of progress in ${cfg.label.toLowerCase()}.`,
    narrative,

    detailedReport: {
      natalPromise: {
        title: "Current Foundation",
        content: `Relevant baseline houses: ${keyHouseSummary}
Key natal anchors:
${keyNatal}

Natural baseline:
Your default tendency in ${cfg.label.toLowerCase()} is ${strengthLabel}. This becomes stronger whenever you follow ${cfg.focusLine}.`,
      },
      dashaActivation: {
        title: "Why This Phase Feels This Way",
        content: `You are currently moving under ${dasha.md.planet} (long-cycle direction), ${dasha.ad.planet} (active life theme), and ${dasha.pd.planet} (immediate trigger).

Current transition:
From ${
          dasha.previousPd ? `${dasha.md.planet}/${dasha.ad.planet}/${dasha.previousPd.planet}` : `${dasha.md.planet}/${dasha.ad.planet}`
        } to ${dasha.md.planet}/${dasha.ad.planet}/${dasha.pd.planet}.
This is why this phase asks for disciplined execution over impulsive movement.`,
      },
      transitInfluence: {
        title: "What Is Influencing You Right Now",
        content: `Saturn transit house: ${saturnHouse ?? "unknown"}
Jupiter transit house: ${jupiterHouse ?? "unknown"}
Rahu transit house: ${rahuHouse ?? "unknown"}
Moon transit house: ${getTransitHouse(transits, chart.lagna.sign, "Moon") ?? "unknown"}

Pressure zones:
Saturn + Rahu are creating accountability and volatility pressure.
Support zones:
Jupiter is supporting learning, correction, and long-cycle improvement.`,
      },
      chartSynthesis: {
        title: "How Everything Connects",
        content: `${dasha.md.planet}: ${getPlanetDescription(dasha.md.planet)}
${dasha.ad.planet}: ${getPlanetDescription(dasha.ad.planet)}
${dasha.pd.planet}: ${getPlanetDescription(dasha.pd.planet)}

Real situation:
Natal promise + active dasha + transit pressure indicate a ${strengthLabel} window.
Reinforcement exists where both dasha and transits activate the same houses.
Conflict appears when strong natal promise meets short-term pressure transits.

What this can feel like in real life:
You may feel that effort is high but outcomes are not always immediately visible. That gap is temporary and process-driven.`,
      },
      timeframeInterpretation: {
        title: "How This Period Will Unfold",
        content: timeframeDetail,
      },
      areaSpecificInterpretation: {
        title: `What This Means For ${cfg.label}`,
        content: areaSpecific,
      },
      practicalPrediction: {
        title: "What Is Likely Vs Not Likely",
        content: practicalLayer,
      },
      realityCheck: {
        title: "Reality Check",
        content: realityCheck,
      },
      crossImpact: {
        title: "Spillover Effect",
        content: crossImpact,
      },
      strategicGuidance: {
        title: "What To Do Now",
        content: `What to do:
${cfg.doList.map((item) => `- ${item}`).join("\n")}

What to avoid:
${cfg.avoidList.map((item) => `- ${item}`).join("\n")}`,
      },
      finalVerdict: {
        title: "Bottom Line",
        content: `${cfg.label} score: ${weighted.final} / 10
Verdict: ${weighted.final >= 7.5 ? "Breakthrough-supportive window" : weighted.final >= 6 ? "Foundation-building phase" : "Correction and stabilization phase"}

One-line truth:
"Structured consistency now will create visible outcomes in the next cycle."`,
      },
    },

    keyPoints: [
      `Prioritize ${cfg.focusLine}`,
      "Follow process over mood",
      "Use review loops and measurable checkpoints",
      "Avoid impulsive changes in direction",
      "Think in cycles, not isolated events",
    ],
  };
}

function generateTimeframeLayer(timeframe: Timeframe, start: Date, end: Date, domain: Domain): string {
  if (timeframe === "today") {
    return `Today focus:
- Micro-signals: mood, energy, and response pattern
- Key trigger planet: Moon + active pratyantar
- Watch for overreaction windows and correct in real time

Energy curve:
- Morning: slow activation, better for planning and low-noise tasks
- Afternoon: highest productive window for execution and decisions
- Evening: mental fatigue risk rises; reduce stimulation and close loops`;
  }
  if (timeframe === "this-week") {
    return `${generatePhaseBreakdown(timeframe, start, end, domain)}

Peak days:
- ${formatShort(addDays(start, 2))} and ${formatShort(addDays(start, 3))}
Sensitive day:
- ${formatShort(addDays(start, 4))}`;
  }
  if (timeframe === "this-month") {
    return `${generatePhaseBreakdown(timeframe, start, end, domain)}

Turning point:
- Mid-month correction window where clarity improves if discipline is maintained.`;
  }
  return `${generatePhaseBreakdown(timeframe, start, end, domain)}

Macro shift:
- This year rewards cumulative consistency, not short-term intensity.`;
}

function generateAreaSpecificLayer(
  domain: Domain,
  score: number,
  dasha: DashaContext,
  saturnHouse: number | null,
  jupiterHouse: number | null,
  rahuHouse: number | null
): string {
  if (domain === "career") {
    return `Job stability: ${score >= 7 ? "improving with clear structure" : "stable if discipline stays high"}
Opportunities: ${jupiterHouse === 10 || jupiterHouse === 11 ? "supportive for growth and recognition" : "available but effort-led"}
Workload/pressure: elevated when Saturn pressure rises (house ${saturnHouse ?? "unknown"}).`;
  }
  if (domain === "health") {
    return `Mental vs physical: mind load is the primary trigger; body reflects accumulated stress.
Sensitive zones: nervous system, digestion, and sleep rhythm.
Energy pattern: fluctuating but recoverable with routine discipline.`;
  }
  if (domain === "finance") {
    return `Income flow: better when planning and tracking are tight.
Blockage pattern: leakage through impulsive or unplanned decisions.
Risk timing: keep risk moderate while Rahu pressure remains active (house ${rahuHouse ?? "unknown"}).`;
  }
  if (domain === "relationships") {
    return `Relational climate: communication quality determines harmony.
Pressure point: assumptions and delayed conversations.
Growth vector: calm honesty and consistency.`;
  }
  if (domain === "growth") {
    return `Growth channel: skill + discipline + applied learning.
Pressure point: overconsumption without implementation.
Breakthrough mode: one focused path executed deeply.`;
  }
  return `Mental clarity: improves with reduced information noise.
Pressure point: rumination loops and late-night overthinking.
Stability path: structured reflection + boundaries + sleep hygiene.`;
}

function generatePracticalLayer(domain: Domain, timeframe: Timeframe, score: number): string {
  const windowText =
    timeframe === "today"
      ? "within the day"
      : timeframe === "this-week"
        ? "over this week"
        : timeframe === "this-month"
          ? "over this month"
          : "over this year";
  return `What is likely to happen ${windowText}:
- Progress comes through planned, repeatable actions
- Clarity increases when emotional reactivity is reduced

What is unlikely to happen ${windowText}:
- Sudden life-changing jump without groundwork
- Stable results from impulsive decision patterns

Ground reality:
Current strength level is ${score}/10, so outcomes are real but process-dependent.`;
}

function generateRealityCheckLayer(domain: Domain, timeframe: Timeframe, score: number): string {
  const period = timeframe === "today" ? "today" : timeframe === "this-week" ? "this week" : timeframe === "this-month" ? "this month" : "this year";
  const base = score >= 7.5 ? "supportive but still process-dependent" : score >= 6 ? "constructive but not explosive" : "sensitive and correction-first";
  return `What this period is NOT:
- Not a guaranteed instant breakthrough window
- Not ideal for emotionally driven high-risk decisions

Reality check for ${domain} (${period}):
This is a ${base} phase. Measured actions will work; impulsive swings will not.`;
}

function generateCrossImpactLayer(domain: Domain): string {
  if (domain === "career") {
    return "Career pressure can spill into health as mental fatigue and sleep disruption if recovery is ignored.";
  }
  if (domain === "health") {
    return "Health rhythm this period will directly affect career clarity and decision quality.";
  }
  if (domain === "finance") {
    return "Financial stress can bleed into relationships and mental peace through overcontrol or anxiety loops.";
  }
  if (domain === "relationships") {
    return "Relationship tension can reduce productivity and increase emotional spending or impulsive decisions.";
  }
  if (domain === "growth") {
    return "Personal growth discipline will raise stability in both career performance and mental peace.";
  }
  return "Mental-state hygiene in this period will amplify outcomes across career, health, and relationships.";
}

function normalizeOutputMode(mode: string | null): OutputMode {
  if (!mode) return "PANDIT";
  const cleaned = mode.trim().toUpperCase();
  return cleaned === "SIMPLE_ENGLISH" ? "SIMPLE_ENGLISH" : "PANDIT";
}

function monthWeekRanges(now: Date): string[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const r1s = start;
  const r1e = new Date(y, m, Math.min(7, end.getDate()));
  const r2s = new Date(y, m, Math.min(8, end.getDate()));
  const r2e = new Date(y, m, Math.min(14, end.getDate()));
  const r3s = new Date(y, m, Math.min(15, end.getDate()));
  const r3e = new Date(y, m, Math.min(21, end.getDate()));
  const r4s = new Date(y, m, Math.min(22, end.getDate()));
  const r4e = end;
  return [
    `${formatShort(r1s)}-${formatShort(r1e)}`,
    `${formatShort(r2s)}-${formatShort(r2e)}`,
    `${formatShort(r3s)}-${formatShort(r3e)}`,
    `${formatShort(r4s)}-${formatShort(r4e)}`,
  ];
}

function weekdayName(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "long" });
}

function getDomainNarrativeFlavor(
  mode: OutputMode,
  domain: Domain,
  dasha: DashaContext,
  saturnHouse: number | null,
  jupiterHouse: number | null,
  rahuHouse: number | null,
  moonHouse: number | null
) {
  if (mode === "SIMPLE_ENGLISH") {
    if (domain === "career") {
      return {
        why: `In career, this is mainly a structure-and-positioning cycle where Saturn (house ${saturnHouse ?? "?"}) slows visibility while Jupiter (house ${jupiterHouse ?? "?"}) supports long-term growth.`,
        feel: "You may feel that effort is strong but recognition is delayed; this is a classic build phase, not a failure signal.",
        doNow: "Focus on execution quality, completion discipline, and strategic visibility.",
        avoidNow: "Avoid sudden pivots, emotional resigning thoughts, and comparing timelines.",
      };
    }
    if (domain === "finance") {
      return {
        why: `In finance, Rahu (house ${rahuHouse ?? "?"}) can increase risk appetite while Jupiter supports planning and correction.`,
        feel: "You may feel tempted to act fast with money decisions, especially when outcomes feel uncertain.",
        doNow: "Use planned allocation, strict tracking, and downside protection first.",
        avoidNow: "Avoid impulse entries, emotional spending, and frequent strategy switching.",
      };
    }
    if (domain === "health") {
      return {
        why: `In health, Moon (house ${moonHouse ?? "?"}) plus active ${dasha.pd.planet} can convert mental load into physical signals.`,
        feel: "You may feel mind fatigue before body fatigue, with stress showing up as sleep or digestion disturbance.",
        doNow: "Prioritize sleep rhythm, light movement, and reduced mental noise.",
        avoidNow: "Avoid irregular meals, over-stimulation, and late-night overthinking.",
      };
    }
    if (domain === "relationships") {
      return {
        why: "In relationships, emotional sensitivity can be high, while pressure can make communication feel heavier than usual.",
        feel: "You may feel emotionally sensitive and easily misunderstood if conversations stay delayed.",
        doNow: "Keep communication simple, calm, and timely.",
        avoidNow: "Avoid assumptions, passive silence, and reaction-first conversations.",
      };
    }
    if (domain === "growth") {
      return {
        why: `For personal growth, this cycle supports disciplined learning, especially when ${dasha.ad.planet} and ${dasha.pd.planet} are used practically.`,
        feel: "You may feel pulled between learning more and applying less.",
        doNow: "Convert one insight into one daily repeatable action.",
        avoidNow: "Avoid over-consuming information without implementation.",
      };
    }
    return {
      why: `For mind and peace, Moon (house ${moonHouse ?? "?"}) and Rahu (house ${rahuHouse ?? "?"}) can amplify thought loops if boundaries are weak.`,
      feel: "You may feel mentally busy even when external work is not heavy.",
      doNow: "Create silence windows, journaling, and a fixed sleep wind-down.",
      avoidNow: "Avoid doom-scrolling, overanalysis, and late mental stimulation.",
    };
  }

  if (domain === "career") {
    return {
      why: "करियर में इस समय फोकस दिखावे से ज्यादा काम की गुणवत्ता और सही दिशा पर रखना जरूरी है।",
      feel: "आपको लग सकता है कि मेहनत ज्यादा है लेकिन पहचान तुरंत नहीं मिल रही।",
      doNow: "जिस काम पर हाथ रखा है उसे पूरा करें और रोज थोड़ा measurable progress रखें।",
      avoidNow: "जल्दी में दिशा बदलने या तुलना करके decision लेने से बचें।",
    };
  }
  if (domain === "finance") {
    return {
      why: "फाइनेंस में अभी stability बनाना ज्यादा महत्वपूर्ण है, इसलिए planning के बिना impulsive step लेना बेहतर नहीं रहेगा।",
      feel: "कभी-कभी जल्दी पैसा move करने का मन हो सकता है, खासकर uncertainty में।",
      doNow: "छोटे लेकिन disciplined फैसले लें, allocation और tracking साफ रखें।",
      avoidNow: "emotion में आकर risk लेना या बार-बार strategy बदलना नुकसान दे सकता है।",
    };
  }
  if (domain === "health") {
    return {
      why: "हेल्थ के मामले में अभी दिमाग का दबाव शरीर पर जल्दी असर दिखा सकता है, इसलिए routine और recovery जरूरी है।",
      feel: "थकान शरीर से पहले मन में महसूस हो सकती है, और फिर sleep या digestion प्रभावित हो सकते हैं।",
      doNow: "खाना, पानी, नींद और हल्की movement को simple rhythm में रखें।",
      avoidNow: "late-night जागना, meal skip करना और लगातार स्क्रीन पर रहना बढ़ा दें तो दिक्कत बढ़ सकती है।",
    };
  }
  if (domain === "relationships") {
    return {
      why: "रिश्तों में इस समय tone और timing दोनों बहुत महत्व रखते हैं; बात सही हो लेकिन तरीका नरम हो।",
      feel: "आपको ऐसा महसूस हो सकता है कि सामने वाला आपको गलत समझ रहा है।",
      doNow: "छोटी बातों को साफ, समय पर और बिना तंज के बोलना बेहतर रहेगा।",
      avoidNow: "चुप रहकर मन में रखना या impulsive reaction देना दूरी बढ़ा सकता है।",
    };
  }
  if (domain === "growth") {
    return {
      why: "पर्सनल growth के लिए अभी सीखने से ज्यादा लागू करने की आदत आपको आगे ले जाएगी।",
      feel: "एक साथ बहुत कुछ सीखने का मन हो सकता है, पर असली बदलाव consistent implementation से आएगा।",
      doNow: "हर दिन एक छोटा action चुनें जो आपके बड़े लक्ष्य से जुड़ा हो।",
      avoidNow: "knowledge collect करके उसे postpone करना progress धीमा कर देगा।",
    };
  }
  return {
    why: "मन की शांति के लिए अभी mental noise कम करना सबसे बड़ा उपाय है।",
    feel: "बाहर काम कम हो तब भी अंदर overthinking चल सकती है।",
    doNow: "दिन में छोटे pause लें, लिखें, और रात को दिमाग को शांत करने का fixed तरीका रखें।",
    avoidNow: "बार-बार फोन check करना और late-night overthinking से बचना जरूरी है।",
  };
}
function getTodayTimingLine(mode: OutputMode, domain: Domain): string {
  if (mode === "SIMPLE_ENGLISH") {
    if (domain === "career") return "Morning can feel slow, afternoon supports focused execution, and evening is better for review than fresh strategic decisions.";
    if (domain === "finance") return "Morning is best for checking numbers calmly, afternoon for planned actions, and evening should avoid impulse money decisions.";
    if (domain === "health") return "Morning may feel heavy in the body, afternoon suits light movement, and evening should be used for nervous-system downshift.";
    if (domain === "relationships") return "Morning can carry emotional sensitivity, afternoon is better for clear conversation, and evening needs softer tone and patience.";
    if (domain === "growth") return "Morning is ideal for learning setup, afternoon for focused practice, and evening for reflection on what was actually applied.";
    return "Morning may feel mentally noisy, afternoon can bring clarity, and evening should be protected from overthinking loops.";
  }
  if (domain === "career") return "à¤¸à¥à¤¬à¤¹ à¤¥à¥‹à¤¡à¤¼à¤¾ slow feel à¤¹à¥‹ à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆ, à¤¦à¥‹à¤ªà¤¹à¤° focused execution à¤•à¥‡ à¤²à¤¿à¤ à¤¬à¥‡à¤¹à¤¤à¤° à¤°à¤¹à¥‡à¤—à¥€, à¤”à¤° à¤¶à¤¾à¤® review à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤¹à¥€ à¤°à¤¹à¥‡à¤—à¥€, à¤¨à¤ à¤¬à¤¡à¤¼à¥‡ à¤«à¥ˆà¤¸à¤²à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ à¤¨à¤¹à¥€à¤‚à¥¤";
  if (domain === "finance") return "à¤¸à¥à¤¬à¤¹ numbers calmly à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¤¾ à¤¸à¤®à¤¯ à¤¹à¥ˆ, à¤¦à¥‹à¤ªà¤¹à¤° planned action à¤•à¥‡ à¤²à¤¿à¤ à¤¬à¥‡à¤¹à¤¤à¤° à¤¹à¥ˆ, à¤”à¤° à¤¶à¤¾à¤® impulse money decision à¤¸à¥‡ à¤¬à¤šà¤¨à¤¾ à¤šà¤¾à¤¹à¤¿à¤à¥¤";
  if (domain === "health") return "à¤¸à¥à¤¬à¤¹ body à¤¥à¥‹à¤¡à¤¼à¥€ heavy à¤²à¤— à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆ, à¤¦à¥‹à¤ªà¤¹à¤° light movement à¤•à¥‡ à¤²à¤¿à¤ à¤…à¤šà¥à¤›à¥€ à¤¹à¥ˆ, à¤”à¤° à¤¶à¤¾à¤® nervous-system à¤•à¥‹ à¤¶à¤¾à¤‚à¤¤ à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤°à¤–à¥‡à¤‚à¥¤";
  if (domain === "relationships") return "à¤¸à¥à¤¬à¤¹ emotional sensitivity à¤°à¤¹ à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆ, à¤¦à¥‹à¤ªà¤¹à¤° clear conversation à¤•à¥‡ à¤²à¤¿à¤ à¤¬à¥‡à¤¹à¤¤à¤° à¤¹à¥ˆ, à¤”à¤° à¤¶à¤¾à¤® à¤®à¥‡à¤‚ tone soft à¤°à¤–à¤¨à¤¾ à¤œà¤°à¥‚à¤°à¥€ à¤¹à¥ˆà¥¤";
  if (domain === "growth") return "à¤¸à¥à¤¬à¤¹ learning setup, à¤¦à¥‹à¤ªà¤¹à¤° focused practice, à¤”à¤° à¤¶à¤¾à¤® reflection à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤¬à¤¸à¥‡ à¤¬à¥‡à¤¹à¤¤à¤° à¤°à¤¹à¤¤à¥€ à¤¹à¥ˆà¥¤";
  return "à¤¸à¥à¤¬à¤¹ mind à¤¥à¥‹à¤¡à¤¼à¤¾ noisy à¤²à¤— à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆ, à¤¦à¥‹à¤ªà¤¹à¤° clarity à¤¦à¥‡ à¤¸à¤•à¤¤à¥€ à¤¹à¥ˆ, à¤”à¤° à¤¶à¤¾à¤® à¤•à¥‹ overthinking loop à¤¸à¥‡ à¤¬à¤šà¤¾à¤¨à¤¾ à¤œà¤¼à¤°à¥‚à¤°à¥€ à¤¹à¥ˆà¥¤";
}

function getHindiDomainLabel(domain: Domain): string {
  if (domain === "career") return "à¤•à¤°à¤¿à¤¯à¤°";
  if (domain === "finance") return "à¤«à¤¾à¤‡à¤¨à¥‡à¤‚à¤¸";
  if (domain === "health") return "à¤¹à¥‡à¤²à¥à¤¥";
  if (domain === "relationships") return "à¤°à¤¿à¤²à¥‡à¤¶à¤¨à¤¶à¤¿à¤ªà¥à¤¸";
  if (domain === "growth") return "à¤ªà¤°à¥à¤¸à¤¨à¤² à¤—à¥à¤°à¥‹à¤¥";
  return "à¤®à¤¾à¤‡à¤‚à¤¡ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸";
}

function buildTodayNarrative(
  mode: OutputMode,
  recipientName: string,
  domain: Domain,
  phaseText: string,
  transitionLine: string,
  flavor: { why: string; feel: string; doNow: string; avoidNow: string }
): string {
  if (mode === "SIMPLE_ENGLISH") {
    if (domain === "career") {
      return `${recipientName}, today in career you are in a ${phaseText}.

This is happening because ${transitionLine}. In career terms, this is a positioning day, not a visibility day.

You may feel that effort is high but output recognition is low. That can create self-doubt, but it is temporary and process-linked.
${flavor.why}

${getTodayTimingLine(mode, domain)}
${flavor.feel}

What to do: ${flavor.doNow}
What to avoid: ${flavor.avoidNow}

One-line takeaway: today is for strong execution quality, not external validation.`;
    }
    if (domain === "finance") {
      return `${recipientName}, today in finance you are in a ${phaseText}.

This is happening because ${transitionLine}. In finance terms, this is a control-and-clarity day, not a high-risk day.

You may feel tempted to move money quickly, especially if uncertainty is present. The better move is measured decision-making.
${flavor.why}

${getTodayTimingLine(mode, domain)}
${flavor.feel}

What to do: ${flavor.doNow}
What to avoid: ${flavor.avoidNow}

One-line takeaway: protect capital first; speed can come later.`;
    }
    if (domain === "health") {
      return `${recipientName}, today in health you are in a ${phaseText}.

This is happening because ${transitionLine}. In health terms, this is a regulation day, not a performance day.

You may feel mind-body mismatch, where stress appears physically even without heavy work. That is a load-management signal.
${flavor.why}

${getTodayTimingLine(mode, domain)}
${flavor.feel}

What to do: ${flavor.doNow}
What to avoid: ${flavor.avoidNow}

One-line takeaway: calm the system today, and the body will follow.`;
    }
    if (domain === "relationships") {
      return `${recipientName}, today in relationships you are in a ${phaseText}.

This is happening because ${transitionLine}. In relationship terms, this is a communication-quality day, not a reaction day.

You may feel emotionally sensitive and misunderstood if conversations are delayed. Tone and timing matter more than volume.
${flavor.why}

${getTodayTimingLine(mode, domain)}
${flavor.feel}

What to do: ${flavor.doNow}
What to avoid: ${flavor.avoidNow}

One-line takeaway: calm clarity will work better than emotional intensity today.`;
    }
    if (domain === "growth") {
      return `${recipientName}, today in personal growth you are in a ${phaseText}.

This is happening because ${transitionLine}. In growth terms, this is an implementation day, not an information day.

You may feel inspired to learn many things, but results today will come only from focused application.
${flavor.why}

${getTodayTimingLine(mode, domain)}
${flavor.feel}

What to do: ${flavor.doNow}
What to avoid: ${flavor.avoidNow}

One-line takeaway: one applied action today is worth more than ten ideas.`;
    }
    return `${recipientName}, today for mind and peace you are in a ${phaseText}.

This is happening because ${transitionLine}. This is a nervous-system hygiene day, not a high-input day.

You may feel mentally crowded even when external tasks are moderate. Reducing noise will immediately improve clarity.
${flavor.why}

${getTodayTimingLine(mode, domain)}
${flavor.feel}

What to do: ${flavor.doNow}
What to avoid: ${flavor.avoidNow}

One-line takeaway: less mental noise today means better decisions tomorrow.`;
  }

  if (domain === "career") {
    return `${recipientName}, आज करियर के मामले में दिन ऐसा रहेगा कि काम की जिम्मेदारी ज्यादा महसूस होगी, लेकिन उसका असर तुरंत दिखे यह जरूरी नहीं है।

अभी जो समय चल रहा है उसमें बाहर की तालियों से ज्यादा अंदर की स्थिरता महत्वपूर्ण है। इसका कारण यह है कि यह समय आपको दिशा, धैर्य और काम की quality पर टिके रहने की ट्रेनिंग दे रहा है। इसलिए बीच-बीच में doubt आना या “इतनी मेहनत का output कब दिखेगा?” जैसा विचार आना सामान्य है।

सुबह शुरुआत थोड़ी धीमी लग सकती है, दोपहर में फोकस बेहतर रहेगा और execution साफ रहेगा, जबकि शाम तक हल्की मानसिक थकान या overthinking बढ़ सकती है। शाम में नए बड़े फैसले लेने की जगह पूरे हुए काम का शांत review ज्यादा फायदेमंद रहेगा।

आज अगर आप बिना घबराहट direction stable रखेंगे, तो दिन productive निकलेगा। impulsive career shift, comparison और mood के आधार पर decision लेने से बचना बेहतर रहेगा।

सीधी बात यह है: आज consistency रखेंगे तो कल visibility खुद बनेगी।`;
  }
  if (domain === "finance") {
    return `${recipientName}, आज फाइनेंस के मामले में दिन थोड़ा sensitive रहेगा, खासकर तब जब जल्दी निर्णय लेने का मन करे।

अभी जो समय चल रहा है उसमें पैसा बढ़ाने से पहले पैसा बचाने की समझ ज्यादा काम आएगी। इसका कारण यह है कि इस समय impulsive decision का असर जल्दी पड़ता है, जबकि planned कदम धीरे-धीरे मजबूत परिणाम देते हैं।

सुबह numbers और current position को शांत दिमाग से देखने का समय है, दोपहर planned action के लिए बेहतर है, और शाम में emotional या impulse spending से बचना जरूरी रहेगा। uncertainty में risk लेने की इच्छा बढ़ सकती है, इसलिए pace से ज्यादा clarity चुनें।

आज छोटे लेकिन disciplined फैसले आपको सही दिशा देंगे। बार-बार strategy बदलना, excitement में entry लेना, या बिना plan capital move करना avoid करें।

सीधी बात यह है: आज नियंत्रण रखेंगे तो आगे growth ज्यादा सुरक्षित बनेगी।`;
  }
  if (domain === "health") {
    return `${recipientName}, आज हेल्थ के हिसाब से दिन ऐसा रह सकता है जिसमें शरीर से पहले मन थका हुआ महसूस हो।

अभी जो समय चल रहा है उसमें मानसिक प्रेशर का असर शरीर पर जल्दी दिखता है। इसका कारण यह है कि stress जमा होकर sleep, digestion, shoulders या energy level में हल्की गड़बड़ी दे सकता है, भले बीमारी जैसी कोई बड़ी बात न हो।

सुबह body थोड़ी heavy लग सकती है, दोपहर में हल्की चाल या stretching से राहत मिलेगी, और शाम में nervous system को शांत करना जरूरी रहेगा। शाम तक अगर स्क्रीन और overthinking बढ़े तो fatigue ज्यादा महसूस हो सकती है।

आज अपने शरीर के साथ softness रखें, push नहीं। समय पर खाना, पानी, हल्की movement और रात को दिमाग शांत करने की आदत दिन को काफी balanced रखेगी।

सीधी बात यह है: आज recovery को priority देंगे तो कल ऊर्जा अपने आप बेहतर लगेगी।`;
  }
  if (domain === "relationships") {
    return `${recipientName}, आज रिश्तों में छोटी बात भी थोड़ी ज्यादा दिल पर लग सकती है, इसलिए बोलने का तरीका बहुत फर्क डालेगा।

अभी जो समय चल रहा है उसमें misunderstanding का chance तब बढ़ता है जब बात मन में रोक ली जाए या देर से कही जाए। इसका कारण यह है कि emotional sensitivity बढ़ी हुई रहती है और tone गलत जाते ही दूरी महसूस होने लगती है।

सुबह मन थोड़ा नाजुक रह सकता है, दोपहर खुलकर और साफ बात करने के लिए बेहतर है, और शाम में प्रतिक्रिया देने से पहले कुछ सेकंड रुकना ज्यादा समझदारी होगी। इस flow को समझकर चलेंगे तो unnecessary friction से बचेंगे।

आज बहस जीतने से ज्यादा रिश्ता संभालना महत्वपूर्ण है। सीधे लेकिन नरम शब्द चुनें, अनुमान लगाने या चुप रहकर नाराज रहने से बचें।

सीधी बात यह है: आज सही tone रखेंगे तो रिश्ता हल्का और सुरक्षित महसूस होगा।`;
  }
  if (domain === "growth") {
    return `${recipientName}, आज personal growth के लिए दिन अच्छा है, लेकिन शर्त यह है कि सीखने से ज्यादा लागू करने पर ध्यान रहे।

अभी जो समय चल रहा है उसमें ideas बहुत आएंगे, पर असली बदलाव उसी से बनेगा जो आप आज करके दिखाएंगे। इसका कारण यह है कि यह समय ज्ञान से ज्यादा disciplined action को reward करता है।

सुबह planning और clarity के लिए ठीक रहेगी, दोपहर focused practice के लिए मजबूत समय है, और शाम में review करके देखना जरूरी है कि आज सच में क्या लागू हुआ। यहीं से confidence बनता है।

आज एक छोटा लेकिन पूरा किया हुआ काम, अधूरे बड़े प्लान से बेहतर रहेगा। एक दिशा पकड़कर चलना आपको overthinking से भी बचाएगा।

सीधी बात यह है: आज implementation करेंगे तो growth सच में महसूस होगी।`;
  }
  return `${recipientName}, आज मन के स्तर पर दिन ऐसा रह सकता है जिसमें बाहर का काम सामान्य हो, लेकिन अंदर विचार ज्यादा चलते रहें।

अभी जो समय चल रहा है उसमें clarity पाने का तरीका और input जोड़ना नहीं, बल्कि mental noise कम करना है। इसका कारण यह है कि overthinking के समय दिमाग जानकारी नहीं, ठहराव मांगता है।

सुबह mind थोड़ा scattered लग सकता है, दोपहर में clarity बेहतर आ सकती है, और शाम में अगर pause न लिया तो thought loop बढ़ सकता है। इसीलिए शाम को हल्का routine और digital break बहुत काम देगा।

आज खुद पर pressure बढ़ाने की बजाय खुद को space देना बेहतर रहेगा। थोड़ी writing, थोड़ी silence और सरल routine पूरे दिन को stable बना सकता है।

सीधी बात यह है: आज मन संभालेंगे तो कल फैसले ज्यादा साफ होंगे।`;
}

function buildPanditWeekNarrative(
  recipientName: string,
  domain: Domain,
  d1: string,
  d2: string,
  d3: string,
  d4: string,
  d5: string,
  d6: string,
  d7: string
): string {
  if (domain === "career") return `${recipientName}, इस हफ्ते करियर में शुरुआत थोड़ी heavy, बीच में मजबूत momentum और अंत में patience का test रहेगा।\n\n${d1}-${d2} में direction doubt आ सकता है, ${d3}-${d4} में काम की पकड़ मजबूत होगी, ${d5} पर pressure बढ़ सकता है, और ${d6}-${d7} में review mode रखना बेहतर रहेगा।\n\neffort और visible result में gap महसूस हो सकता है, लेकिन direction stable रखेंगे तो यह हफ्ता आगे की मजबूत तैयारी देगा।\n\nसीधी बात यह है: इस हफ्ते consistency ही आपकी सबसे बड़ी ताकत है।`;
  if (domain === "finance") return `${recipientName}, इस हफ्ते फाइनेंस में जल्दबाजी से ज्यादा planning काम करेगी।\n\n${d1}-${d2} में impulsive decisions का मन बन सकता है, ${d3}-${d4} में clarity के साथ allocation बेहतर होगा, ${d5} पर risk temptation बढ़ सकता है, और ${d6}-${d7} तक disciplined approach का फायदा साफ दिखेगा।\n\nnumbers लिखकर देखना, risk limit fixed रखना और mood-based moves से दूर रहना जरूरी रहेगा।\n\nसीधी बात यह है: इस हफ्ते control रखेंगे तो financial stress कम रहेगा।`;
  if (domain === "health") return `${recipientName}, इस हफ्ते हेल्थ में mind-to-body pattern चलेगा, यानी मानसिक दबाव का असर शरीर पर दिख सकता है।\n\n${d1}-${d2} में energy low लग सकती है, ${d3}-${d4} में routine से राहत मिलेगी, ${d5} पर stiffness या sleep disturbance जैसे संकेत आ सकते हैं, और ${d6}-${d7} recovery पर ध्यान जरूरी रहेगा।\n\npush कम और rhythm ज्यादा रखेंगे तो हफ्ता संतुलित रहेगा।\n\nसीधी बात यह है: इस हफ्ते body को support चाहिए, stress नहीं।`;
  if (domain === "relationships") return `${recipientName}, इस हफ्ते रिश्तों में tone और timing बहुत महत्वपूर्ण रहेंगे।\n\n${d1}-${d2} में sensitivity ज्यादा रह सकती है, ${d3}-${d4} में clear communication से चीजें सुधरेंगी, ${d5} पर emotional reaction बढ़ सकता है, और ${d6}-${d7} में soft बातचीत connection मजबूत करेगी।\n\nमन में रखने से दूरी बढ़ती है, समय पर शांत बात करने से भरोसा बढ़ता है।\n\nसीधी बात यह है: इस हफ्ते रिश्ते समझदारी से संभालेंगे तो हल्कापन बना रहेगा।`;
  if (domain === "growth") return `${recipientName}, इस हफ्ते personal growth का मतलब सीखने से ज्यादा लागू करना है।\n\n${d1}-${d2} planning के लिए ठीक है, ${d3}-${d4} implementation के लिए best है, ${d5} पर distraction बढ़ सकता है, और ${d6}-${d7} review से actual progress दिखेगी।\n\nछोटे consistent actions इस हफ्ते सबसे बड़ा confidence बनाएंगे।\n\nसीधी बात यह है: इस हफ्ते action-based learning ही असली growth देगी।`;
  return `${recipientName}, इस हफ्ते mind balance में शुरुआत में overthinking, बीच में clarity और अंत में reset की जरूरत महसूस होगी।\n\n${d1}-${d2} में thoughts ज्यादा चल सकते हैं, ${d3}-${d4} में focus बेहतर होगा, ${d5} पर emotional triggers आ सकते हैं, और ${d6}-${d7} में rest जरूरी रहेगा।\n\nmental noise कम रखेंगे तो decision quality हर area में बेहतर रहेगी।\n\nसीधी बात यह है: इस हफ्ते मन को हल्का रखना ही सबसे बड़ा उपाय है।`;
}

function buildPanditMonthNarrative(recipientName: string, domain: Domain, w1: string, w2: string, w3: string, w4: string): string {
  if (domain === "career") return `${recipientName}, इस महीने करियर धीरे-धीरे खुलने वाला है।\n\n${w1} में setup, ${w2} में clarity, ${w3} में pressure plus opportunity, और ${w4} में consolidation रहेगा। बीच का समय turning point रहेगा, इसलिए जल्दबाजी में दिशा न बदलें।\n\nसीधी बात यह है: इस महीने steady execution आगे की visibility बनाएगा।`;
  if (domain === "finance") return `${recipientName}, इस महीने फाइनेंस में safe और structured approach सबसे ज्यादा काम करेगी।\n\n${w1} में cash discipline, ${w2} में planned allocation, ${w3} में risk control, और ${w4} में clarity और stability बनेगी।\n\nसीधी बात यह है: इस महीने impulsive फैसले नहीं, disciplined decisions फायदा देंगे।`;
  if (domain === "health") return `${recipientName}, इस महीने हेल्थ में routine ही असली medicine रहेगा।\n\n${w1} में rhythm set करें, ${w2} में energy improve होगी, ${w3} में stress management जरूरी होगा, और ${w4} में recovery का असर साफ दिखेगा।\n\nसीधी बात यह है: इस महीने consistency रखेंगे तो body balance बेहतर रहेगा।`;
  if (domain === "relationships") return `${recipientName}, इस महीने रिश्तों में clear communication और patience बहुत फर्क डालेंगे।\n\n${w1} में पुरानी friction surface हो सकती है, ${w2} में softness लौटेगी, ${w3} में emotional handling जरूरी होगी, और ${w4} में trust मजबूत हो सकता है।\n\nसीधी बात यह है: इस महीने tone सही रखेंगे तो relationship stable रहेगा।`;
  if (domain === "growth") return `${recipientName}, इस महीने personal growth का सीधा नियम है: रोज थोड़ा, लेकिन पक्का।\n\n${w1} में दिशा तय करें, ${w2} में habit पकड़े, ${w3} में discipline test होगा, और ${w4} में actual result दिखने लगेगा।\n\nसीधी बात यह है: इस महीने implementation आपको आगे ले जाएगा।`;
  return `${recipientName}, इस महीने mind balance step-by-step बेहतर हो सकता है।\n\n${w1} में thought overload, ${w2} में clarity, ${w3} में emotional fluctuation, और ${w4} में internal stability का मौका रहेगा।\n\nसीधी बात यह है: इस महीने mental hygiene रखेंगे तो बाकी areas भी बेहतर चलेंगे।`;
}

function buildPanditYearNarrative(recipientName: string, domain: Domain): string {
  if (domain === "career") return `${recipientName}, इस साल करियर में पहले build-up, फिर movement, फिर testing और अंत में परिणाम का साफ pattern रहेगा।\n\nबीच के pressure में direction न बदलना सबसे जरूरी रहेगा।\n\nसीधी बात यह है: यह साल स्थिर मेहनत को मजबूत पहचान में बदलेगा।`;
  if (domain === "finance") return `${recipientName}, इस साल फाइनेंस में growth तभी टिकेगी जब discipline और risk control साथ चलेंगे।\n\nशुरुआत में structure, बीच में opportunity plus risk, और अंत में clear outcome दिखेगा।\n\nसीधी बात यह है: इस साल controlled strategy पैसा टिकाएगी भी और बढ़ाएगी भी।`;
  if (domain === "health") return `${recipientName}, इस साल हेल्थ में rhythm और recovery ही आपकी core strength रहेगी।\n\nroutine बनेगा तो energy, sleep और overall wellness में steadily सुधार दिखेगा।\n\nसीधी बात यह है: इस साल balance intensity से ज्यादा powerful रहेगा।`;
  if (domain === "relationships") return `${recipientName}, इस साल रिश्तों में maturity, listening और calm communication सबसे बड़ा फर्क डालेंगे।\n\nreaction कम और समझदारी ज्यादा रखेंगे तो साल के अंत तक भरोसा मजबूत होगा।\n\nसीधी बात यह है: इस साल रिश्ते consistency से गहरे होंगे।`;
  if (domain === "growth") return `${recipientName}, इस साल personal growth का acceleration संभव है, पर daily discipline जरूरी रहेगा।\n\nclear direction, regular implementation और distraction control आपको अलग level पर ले जा सकते हैं।\n\nसीधी बात यह है: इस साल छोटे कदम मिलकर बड़ा बदलाव बनाएंगे।`;
  return `${recipientName}, इस साल मन की स्थिरता आपकी decision quality तय करेगी।\n\noverthinking कम करके boundaries और calm routine बनाए रखेंगे तो clarity मजबूत होती जाएगी।\n\nसीधी बात यह है: मन शांत रहेगा तो बाकी जीवन क्षेत्र भी संतुलित रहेंगे।`;
}
function generateNarrativeLayer(
  mode: OutputMode,
  recipientName: string,
  cfg: DomainConfig,
  domain: Domain,
  timeframe: Timeframe,
  transitionLine: string,
  score: number,
  phase: PhaseTag,
  now: Date,
  dasha: DashaContext,
  saturnHouse: number | null,
  jupiterHouse: number | null,
  rahuHouse: number | null,
  moonHouse: number | null
): string {
  const phaseText = phase.replaceAll("_", " ").toLowerCase();
  const weekStart = now;
  const d1 = weekdayName(weekStart);
  const d2 = weekdayName(addDays(weekStart, 1));
  const d3 = weekdayName(addDays(weekStart, 2));
  const d4 = weekdayName(addDays(weekStart, 3));
  const d5 = weekdayName(addDays(weekStart, 4));
  const d6 = weekdayName(addDays(weekStart, 5));
  const d7 = weekdayName(addDays(weekStart, 6));
  const [w1, w2, w3, w4] = monthWeekRanges(now);
  const flavor = getDomainNarrativeFlavor(
    mode,
    domain,
    dasha,
    saturnHouse,
    jupiterHouse,
    rahuHouse,
    moonHouse
  );

  if (mode === "SIMPLE_ENGLISH") {
    if (timeframe === "today") {
      return buildTodayNarrative(mode, recipientName, domain, phaseText, transitionLine, flavor);
    }
    if (timeframe === "this-week") {
      return `${recipientName}, this week in ${cfg.label.toLowerCase()} is more about steady progress than dramatic outcomes.

This is happening because ${transitionLine}. In practical terms, the week starts with adjustment, gets stronger in the middle, and asks for balance toward the end.

At the start (${d1}-${d2}), you may feel slower clarity and mild pressure. Around ${d3}-${d4}, momentum improves and your best structured work can move forward. Around ${d5}, intensity can rise, so avoid rushing. By ${d6}-${d7}, use the time for review, closure, and reset.

${flavor.why}
${flavor.feel}
Stay consistent and avoid emotional pivots.

One-line takeaway: this week rewards stability over speed.`;
    }
    if (timeframe === "this-month") {
      return `${recipientName}, this month in ${cfg.label.toLowerCase()} unfolds in phases rather than one straight line.

This is happening because ${transitionLine}. ${w1} is for setup, ${w2} for clearer direction, ${w3} for pressure-plus-opportunity, and ${w4} for consolidation.

${flavor.why}
${flavor.feel}
Keep your process steady and avoid over-correcting too early.

One-line takeaway: structured consistency will matter more than occasional intensity this month.`;
    }
    return `${recipientName}, this year in ${cfg.label.toLowerCase()} is a gradual build with clear evolution.

This is happening because ${transitionLine}. Early months build structure, middle months test and refine it, and later months convert it into visible outcomes.

${flavor.why}
${flavor.feel}
Stay patient through adjustments and avoid abandoning your core plan during temporary slowdowns.

One-line takeaway: this year turns disciplined effort into durable results.`;
  }

  if (timeframe === "today") {
    return buildTodayNarrative(mode, recipientName, domain, phaseText, transitionLine, flavor);
  }
  if (timeframe === "this-week") {
    return buildPanditWeekNarrative(recipientName, domain, d1, d2, d3, d4, d5, d6, d7);
  }
  if (timeframe === "this-month") {
    return buildPanditMonthNarrative(recipientName, domain, w1, w2, w3, w4);
  }
  return buildPanditYearNarrative(recipientName, domain);
}
