export const dynamic = "force-dynamic";

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

    const emailParam = searchParams.get("email") || "";
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (emailParam || emailHeader).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: userEmail ? { email: userEmail } : undefined,
      orderBy: userEmail ? undefined : { createdAt: "desc" },
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

    const lifeDomainPredictions = generateLifeDomainPredictions(
      chart,
      currentTransits,
      dashaContext,
      mode
    );

    return NextResponse.json({
      success: true,
      predictions: {
        ...predictions,
        ...domainInsights[domain],
        lifeDomainPredictions,
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

function generatePhaseBreakdown(timeframe: Timeframe, start: Date, end: Date, domain: Domain, mode: OutputMode): string {
  const cfg = DOMAIN_CONFIG[domain];
  const isPandit = mode === "PANDIT";

  if (isPandit) {
    if (timeframe === "today") {
      return `${formatShort(start)} (सुबह -> रात)\nदिन की शुरुआत योजना से करें, फिर सबसे महत्वपूर्ण कार्य को पूरा करने में ऊर्जा लगाएं। दिन के अंत में काम की समीक्षा करें, स्वयं की आलोचना नहीं।`;
    }
    if (timeframe === "this-week") {
      return `${formatShort(start)}-${formatShort(addDays(start, 1))}\nप्राथमिकताएं तय करें और ध्यान भटकाने वाली चीजों को दूर करें।\n\n${formatShort(addDays(start, 2))}-${formatShort(addDays(start, 4))}\nसबसे मजबूत कार्य करने का समय। मुख्य फोकस रखें।\n\n${formatShort(addDays(start, 5))}-${formatShort(end)}\nप्राप्त उपलब्धियों को मजबूत करें, सीखे हुए अनुभवों को लिखें और अगले सप्ताह की तैयारी करें।`;
    }
    if (timeframe === "this-month") {
      return `सप्ताह 1\nअपनी दिनचर्या को स्थिर करें और रुकावटों को दूर करें।\n\nसप्ताह 2-3\nमुख्य निर्माण और कार्य करने का समय।\n\nसप्ताह 4\nपरिणामों की जांच करें, अधूरे कार्यों को पूरा करें और अगले महीने की तैयारी करें।`;
    }
    return `तिमाही 1\nमजबूत आधार, कार्य प्रणाली और अनुशासन का निर्माण।\n\nतिमाही 2-3\nनिरंतरता और प्रयास से स्पष्ट और बड़े लाभ प्राप्त होने का समय।\n\nतिमाही 4\nपरिणामों को समेटना, रणनीतिक सुधार और अपनी स्थिति को मजबूत बनाना।`;
  }

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

  const isPandit = mode === "PANDIT";
  const strengthLabelHindi = score >= 7.5 ? "बहुत ही सहायक और उन्नति प्रदान करने वाला" : score >= 6 ? "मिलाजुला लेकिन सामान्य रूप से अनुकूल" : "संवेदनशील और सुधार की आवश्यकता वाला";
  const domainLabelHindi = getHindiDomainLabel(domain);

  const timeframeDetail = generateTimeframeLayer(timeframe, window.start, window.end, domain, mode);
  const areaSpecific = generateAreaSpecificLayer(domain, score, dasha, saturnHouse, jupiterHouse, rahuHouse, mode);
  const practicalLayer = generatePracticalLayer(domain, timeframe, weighted.final, mode);
  const realityCheck = generateRealityCheckLayer(domain, timeframe, weighted.final, mode);
  const crossImpact = generateCrossImpactLayer(domain, mode);
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
      ? `${recipientName}, अभी जो समय चल रहा है, वह ${cfg.label.toLowerCase()} में धीरे-धीरे मजबूत प्रगति बनाने वाला चरण है।`
      : `${recipientName}, right now you are in a structured phase of progress in ${cfg.label.toLowerCase()}.`,
    narrative,

    detailedReport: {
      natalPromise: {
        title: isPandit ? "कुंडली का मुख्य आधार (Natal Foundation)" : "Current Foundation",
        content: isPandit
          ? `आपके जन्मांग (Natal Chart) के अनुसार इस विषय के मुख्य भाव: ${keyHouseSummary} हैं।
आपके जन्म के समय के मुख्य ग्रह (Natal Anchors):
${keyNatal}

मूल स्वभाव (Natural Baseline):
आपके जीवन में ${domainLabelHindi} का सामान्य स्तर ${strengthLabelHindi} है। जब भी आप ${cfg.focusLine} का नियम पालन करते हैं, यह और मजबूत हो जाता है।`
          : `Relevant baseline houses: ${keyHouseSummary}
Key natal anchors:
${keyNatal}

Natural baseline:
Your default tendency in ${cfg.label.toLowerCase()} is ${strengthLabel}. This becomes stronger whenever you follow ${cfg.focusLine}.`,
      },
      dashaActivation: {
        title: isPandit ? "दशा स्वामी का प्रभाव (Why This Phase Feels This Way)" : "Why This Phase Feels This Way",
        content: isPandit
          ? `अभी आप महादशा स्वामी ${dasha.md.planet} (दीर्घकालिक प्रभाव), अंतर्दशा स्वामी ${dasha.ad.planet} (सक्रिय जीवन विषय), और प्रत्यंतर्दशा स्वामी ${dasha.pd.planet} (तात्कालिक प्रभाव) के प्रभाव में चल रहे हैं।

दशा का बदलाव:
आप ${
              dasha.previousPd ? `${dasha.md.planet}/${dasha.ad.planet}/${dasha.previousPd.planet}` : `${dasha.md.planet}/${dasha.ad.planet}`
            } से निकलकर ${dasha.md.planet}/${dasha.ad.planet}/${dasha.pd.planet} के प्रभाव में आए हैं।
यही कारण है कि यह समय आपसे जल्दबाजी की जगह पूरी तरह से अनुशासन और स्थिरता बनाए रखने की मांग कर रहा है।`
          : `You are currently moving under ${dasha.md.planet} (long-cycle direction), ${dasha.ad.planet} (active life theme), and ${dasha.pd.planet} (immediate trigger).

Current transition:
From ${
              dasha.previousPd ? `${dasha.md.planet}/${dasha.ad.planet}/${dasha.previousPd.planet}` : `${dasha.md.planet}/${dasha.ad.planet}`
            } to ${dasha.md.planet}/${dasha.ad.planet}/${dasha.pd.planet}.
This is why this phase asks for disciplined execution over impulsive movement.`,
      },
      transitInfluence: {
        title: isPandit ? "गोचर ग्रहों का प्रभाव (Active Planetary Transits)" : "What Is Influencing You Right Now",
        content: isPandit
          ? `शनि गोचर भाव: ${saturnHouse ?? "अज्ञात"}
गुरु गोचर भाव: ${jupiterHouse ?? "अज्ञात"}
राहु गोचर भाव: ${rahuHouse ?? "अज्ञात"}
चंद्र गोचर भाव: ${moonHouse ?? "अज्ञात"}

दबाव क्षेत्र:
शनि और राहु आपके ऊपर जीवन में अनुशासन, जिम्मेदारी और थोड़ी अस्थिरता (volatility) का दबाव बना रहे हैं।
सहायता क्षेत्र:
देवगुरु बृहस्पति (Jupiter) आपको सीखने, अपनी गलतियों को सुधारने और लंबी अवधि के विकास में पूरा सहयोग दे रहे हैं।`
          : `Saturn transit house: ${saturnHouse ?? "unknown"}
Jupiter transit house: ${jupiterHouse ?? "unknown"}
Rahu transit house: ${rahuHouse ?? "unknown"}
Moon transit house: ${moonHouse ?? "unknown"}

Pressure zones:
Saturn + Rahu are creating accountability and volatility pressure.
Support zones:
Jupiter is supporting learning, correction, and long-cycle improvement.`,
      },
      chartSynthesis: {
        title: isPandit ? "ग्रहों का मिलाजुला प्रभाव (Synthesis & Connection)" : "How Everything Connects",
        content: isPandit
          ? `${dasha.md.planet}: ${getPlanetDescriptionHindi(dasha.md.planet)}
${dasha.ad.planet}: ${getPlanetDescriptionHindi(dasha.ad.planet)}
${dasha.pd.planet}: ${getPlanetDescriptionHindi(dasha.pd.planet)}

वास्तविक स्थिति:
आपके जन्म के ग्रह, सक्रिय दशाएं और गोचर के ग्रह मिलकर इस समय को ${strengthLabelHindi} बना रहे हैं।
जब दशा और गोचर दोनों एक ही भाव को सक्रिय करते हैं, तो उसका असर बहुत साफ दिखता है। जब जन्म के अच्छे ग्रहों पर गोचर का दबाव होता है, तो थोड़े समय के लिए मेहनत ज्यादा लगती है पर परिणाम जरूर मिलता है।

आप कैसा महसूस कर सकते हैं:
आपको लग सकता है कि प्रयास बहुत अधिक हैं लेकिन परिणाम तुरंत नहीं दिख रहे। वह अंतर अस्थायी है और आपकी सही कार्यप्रणाली से दूर हो जाएगा।`
          : `${dasha.md.planet}: ${getPlanetDescription(dasha.md.planet)}
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
        title: isPandit ? "इस समय का प्रभाव (Timeframe Analysis)" : "How This Period Will Unfold",
        content: timeframeDetail,
      },
      areaSpecificInterpretation: {
        title: isPandit ? `आपके ${domainLabelHindi} पर प्रभाव` : `What This Means For ${cfg.label}`,
        content: areaSpecific,
      },
      practicalPrediction: {
        title: isPandit ? "क्या होने की संभावना है (Likely vs Unlikely)" : "What Is Likely Vs Not Likely",
        content: practicalLayer,
      },
      realityCheck: {
        title: isPandit ? "वास्तविकता की जांच (Reality Check)" : "Reality Check",
        content: realityCheck,
      },
      crossImpact: {
        title: isPandit ? "अन्य जीवन क्षेत्रों पर प्रभाव" : "Spillover Effect",
        content: crossImpact,
      },
      strategicGuidance: {
        title: isPandit ? "आपको अभी क्या करना चाहिए" : "What To Do Now",
        content: isPandit
          ? `क्या करें (What to do):
${cfg.doList.map((item) => `- ${translateGuidance(item, true)}`).join("\n")}

क्या करने से बचें (What to avoid):
${cfg.avoidList.map((item) => `- ${translateGuidance(item, false)}`).join("\n")}`
          : `What to do:
${cfg.doList.map((item) => `- ${item}`).join("\n")}

What to avoid:
${cfg.avoidList.map((item) => `- ${item}`).join("\n")}`,
      },
      finalVerdict: {
        title: isPandit ? "अंतिम निष्कर्ष (Bottom Line)" : "Bottom Line",
        content: isPandit
          ? `${domainLabelHindi} का कुल अंक: ${weighted.final} / 10
निष्कर्ष: ${weighted.final >= 7.5 ? "अत्यंत अनुकूल और उन्नति देने वाला समय" : weighted.final >= 6 ? "बुनियाद मजबूत करने और धीरे-धीरे बढ़ने का समय" : "सुधार करने और स्थिरता लाने का समय"}

एक पंक्ति का सत्य:
"आज का सही और निरंतर प्रयास भविष्य में बहुत बड़े परिणाम का निर्माण करेगा।"`
          : `${cfg.label} score: ${weighted.final} / 10
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

function generateTimeframeLayer(timeframe: Timeframe, start: Date, end: Date, domain: Domain, mode: OutputMode): string {
  const isPandit = mode === "PANDIT";
  if (isPandit) {
    if (timeframe === "today") {
      return `आज का मुख्य फोकस:
- सूक्ष्म संकेत: आपका मूड, शारीरिक ऊर्जा, और प्रतिक्रिया देने का तरीका
- मुख्य ग्रह प्रभाव: चंद्र देव और आपकी सक्रिय प्रत्यंतर्दशा
- सावधान रहें: जल्दबाजी या उत्तेजना में आकर कोई प्रतिक्रिया न दें

दिन का ऊर्जा स्तर (Energy Curve):
- सुबह: शुरुआत थोड़ी धीमी रहेगी, शांत मन से योजना बनाने के लिए उत्तम है
- दोपहर: कार्य करने और महत्वपूर्ण निर्णय लेने के लिए सबसे सक्रिय समय
- शाम: मानसिक थकान बढ़ सकती है, काम को समेटें और स्क्रीन से दूर रहें`;
    }
    if (timeframe === "this-week") {
      return `${generatePhaseBreakdown(timeframe, start, end, domain, mode)}

मुख्य दिन (Peak Days):
- ${formatShort(addDays(start, 2))} और ${formatShort(addDays(start, 3))}
संवेदनशील दिन (Sensitive Day):
- ${formatShort(addDays(start, 4))}`;
    }
    if (timeframe === "this-month") {
      return `${generatePhaseBreakdown(timeframe, start, end, domain, mode)}

मुख्य मोड़ (Turning Point):
- महीने का मध्य समय जहां अनुशासन बनाए रखने से आपकी स्थिति और मजबूत होगी।`;
    }
    return `${generatePhaseBreakdown(timeframe, start, end, domain, mode)}

दीर्घकालिक बदलाव:
- यह वर्ष आपकी निरंतरता और धैर्य का पुरस्कार देगा, जल्दबाजी का नहीं।`;
  }

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
    return `${generatePhaseBreakdown(timeframe, start, end, domain, mode)}

Peak days:
- ${formatShort(addDays(start, 2))} and ${formatShort(addDays(start, 3))}
Sensitive day:
- ${formatShort(addDays(start, 4))}`;
  }
  if (timeframe === "this-month") {
    return `${generatePhaseBreakdown(timeframe, start, end, domain, mode)}

Turning point:
- Mid-month correction window where clarity improves if discipline is maintained.`;
  }
  return `${generatePhaseBreakdown(timeframe, start, end, domain, mode)}

Macro shift:
- This year rewards cumulative consistency, not short-term intensity.`;
}

function generateAreaSpecificLayer(
  domain: Domain,
  score: number,
  dasha: DashaContext,
  saturnHouse: number | null,
  jupiterHouse: number | null,
  rahuHouse: number | null,
  mode: OutputMode
): string {
  const isPandit = mode === "PANDIT";
  
  if (isPandit) {
    if (domain === "career") {
      return `कार्य में स्थिरता: ${score >= 7 ? "स्पष्ट दिनचर्या और प्रयास से सुधर रही है" : "अनुशासन बनाए रखने से स्थिर रहेगी"}
अवसर: ${jupiterHouse === 10 || jupiterHouse === 11 ? "सफलता और मान-सम्मान के लिए बहुत अनुकूल है" : "मेहनत के बाद उपलब्ध होगा"}
काम का बोझ/दबाव: शनि का प्रभाव होने से काम की जिम्मेदारी और दबाव (गोचर भाव ${saturnHouse ?? "अज्ञात"}) रहेगा।`;
    }
    if (domain === "health") {
      return `मानसिक बनाम शारीरिक: मानसिक तनाव ही मुख्य कारण है; शरीर आपकी संचित थकान को दर्शाता है।
संवेदनशील अंग: तंत्रिका तंत्र, पाचन तंत्र और नींद की अनियमितता।
ऊर्जा का स्तर: उतार-चढ़ाव बना रहेगा, लेकिन एक अच्छी दिनचर्या से जल्दी ठीक हो जाएगा।`;
    }
    if (domain === "finance") {
      return `आय का प्रवाह: बजट और खर्चों पर कड़ी निगरानी रखने से स्थिति बेहतर होगी।
नुकसान का कारण: बिना सोचे-समझे या भावना में बहकर किए गए खर्च।
जोखिम का समय: राहु का प्रभाव (गोचर भाव ${rahuHouse ?? "अज्ञात"}) सक्रिय होने तक जोखिम को बिल्कुल सामान्य रखें।`;
    }
    if (domain === "relationships") {
      return `पारिवारिक वातावरण: आपकी वाणी की मधुरता और बात करने का तरीका ही शांति तय करेगा।
दबाव बिंदु: किसी बात को मन में दबाए रखना या गलतफहमी।
उन्नति का मार्ग: शांत रहकर खुलकर बात करना और आपसी तालमेल बढ़ाना।`;
    }
    if (domain === "growth") {
      return `विकास का मार्ग: कौशल बढ़ाएं, अनुशासित रहें और जो सीखा है उसे तुरंत लागू करें।
दबाव बिंदु: केवल जानकारी जुटाना और उस पर कोई काम न करना।
सफलता का नियम: एक स्पष्ट लक्ष्य चुनें और पूरे मन से उस पर काम करें।`;
    }
    return `मानसिक स्पष्टता: फालतू की सूचनाओं और मानसिक शोर को कम करने से बढ़ेगी।
दबाव बिंदु: पुरानी बातों को बार-बार सोचना और देर रात तक जागना।
स्थिरता का मार्ग: शांत चिंतन, समय पर सोना और जीवन में कुछ नियम बनाना।`;
  }

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

function generatePracticalLayer(domain: Domain, timeframe: Timeframe, score: number, mode: OutputMode): string {
  const isPandit = mode === "PANDIT";
  
  if (isPandit) {
    const windowTextHindi =
      timeframe === "today"
        ? "आज के दिन"
        : timeframe === "this-week"
          ? "इस सप्ताह में"
          : timeframe === "this-month"
            ? "इस महीने में"
            : "इस वर्ष में";
            
    return `क्या होने की पूरी संभावना है (${windowTextHindi}):
- पहले से तय किए गए और नियमित प्रयासों से प्रगति मिलना निश्चित है
- शांत रहने और भावना में न बहने से कार्यों में स्पष्टता आएगी

क्या होना बहुत कठिन है (${windowTextHindi}):
- बिना मेहनत या आधार तैयार किए अचानक कोई बड़ा बदलाव होना मुश्किल है
- बिना सोचे-समझे जल्दबाजी में लिए गए निर्णयों से सफलता मिलना असंभव है

जमीनी हकीकत:
इस समय आपका कुल बल ${score}/10 है, इसलिए सफलता आपके सही प्रयासों और निरंतरता पर निर्भर करती है।`;
  }

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

function generateRealityCheckLayer(domain: Domain, timeframe: Timeframe, score: number, mode: OutputMode): string {
  const isPandit = mode === "PANDIT";
  
  if (isPandit) {
    const periodHindi = timeframe === "today" ? "आज" : timeframe === "this-week" ? "इस सप्ताह" : timeframe === "this-month" ? "इस महीने" : "इस वर्ष";
    const baseHindi = score >= 7.5 ? "सहायक लेकिन सही प्रयासों पर निर्भर" : score >= 6 ? "रचनात्मक लेकिन धीमी प्रगति वाला" : "संवेदनशील और सुधार की आवश्यकता वाला";
    const domainHindi = getHindiDomainLabel(domain);
    
    return `यह समय क्या नहीं है:
- यह कोई रातों-रात बिना मेहनत के तुरंत बड़ी सफलता पाने का समय नहीं है
- जल्दबाजी या उत्साह में आकर कोई बड़ा जोखिम लेने के लिए यह समय ठीक नहीं है

वास्तविक स्थिति - ${domainHindi} (${periodHindi}):
यह एक ${baseHindi} समय है। संयमित और सोचे-समझे कदम काम करेंगे; जल्दबाजी और उत्साह में किए गए फैसले नुकसान दे सकते हैं।`;
  }

  const period = timeframe === "today" ? "today" : timeframe === "this-week" ? "this week" : timeframe === "this-month" ? "this month" : "this year";
  const base = score >= 7.5 ? "supportive but still process-dependent" : score >= 6 ? "constructive but not explosive" : "sensitive and correction-first";
  return `What this period is NOT:
- Not a guaranteed instant breakthrough window
- Not ideal for emotionally driven high-risk decisions

Reality check for ${domain} (${period}):
This is a ${base} phase. Measured actions will work; impulsive swings will not.`;
}

function generateCrossImpactLayer(domain: Domain, mode: OutputMode): string {
  const isPandit = mode === "PANDIT";
  
  if (isPandit) {
    if (domain === "career") {
      return "काम का दबाव आपकी सेहत और नींद पर असर डाल सकता है, इसलिए काम के साथ-साथ आराम का भी पूरा ध्यान रखें।";
    }
    if (domain === "health") {
      return "आपकी सेहत और शारीरिक ऊर्जा सीधे आपके काम करने की क्षमता और निर्णयों को प्रभावित करेगी।";
    }
    if (domain === "finance") {
      return "पैसे की चिंता आपके आपसी रिश्तों और मन की शांति को खराब कर सकती है, इसलिए शांत रहकर फैसले लें।";
    }
    if (domain === "relationships") {
      return "पारिवारिक रिश्तों का तनाव आपके काम की प्रोडक्टिविटी को कम कर सकता है, इसलिए विवादों को प्यार से सुलझाएं।";
    }
    if (domain === "growth") {
      return "खुद को बेहतर बनाने का आपका प्रयास आपके करियर और मन की शांति दोनों को काफी बढ़ाएगा।";
    }
    return "मन की शांति और प्रसन्नता आपके जीवन के हर क्षेत्र (करियर, सेहत, रिश्ते) में सफलता का मार्ग प्रशस्त करेगी।";
  }

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
  if (domain === "career") return "सुबह थोड़ा slow feel हो सकता है, दोपहर focused execution के लिए बेहतर रहेगी, और शाम review के लिए सही रहेगी, नए बड़े फैसलों के लिए नहीं।";
  if (domain === "finance") return "सुबह numbers calmly देखने का समय है, दोपहर planned action के लिए बेहतर है, और शाम impulse money decision से बचना चाहिए।";
  if (domain === "health") return "सुबह body थोड़ी heavy लग सकती है, दोपहर light movement के लिए अच्छी है, और शाम nervous-system को शांत करने के लिए रखें।";
  if (domain === "relationships") return "सुबह emotional sensitivity रह सकती है, दोपहर clear conversation के लिए बेहतर है, और शाम में tone soft रखना जरूरी है।";
  if (domain === "growth") return "सुबह learning setup, दोपहर focused practice, और शाम reflection के लिए सबसे बेहतर रहती है।";
  return "सुबह mind थोड़ा noisy लग सकता है, दोपहर clarity दे सकती है, और शाम को overthinking loop से बचाना ज़रूरी है।";
}

function getHindiDomainLabel(domain: Domain): string {
  if (domain === "career") return "करियर";
  if (domain === "finance") return "फाइनेंस";
  if (domain === "health") return "हेल्थ";
  if (domain === "relationships") return "रिलेशनशिप्स";
  if (domain === "growth") return "पर्सनल ग्रोथ";
  return "माइंड बैलेंस";
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

function getPlanetDescriptionHindi(planet: string): string {
  const descriptions: Record<string, string> = {
    Rahu: "महत्वाकांक्षा, नया जोखिम लेने की इच्छा और लीक से हटकर बड़े निर्णय लेने की शक्ति देता है।",
    Jupiter: "बुद्धि, रणनीति, सही मार्गदर्शन और ज्ञान का विस्तार करता है।",
    Saturn: "धैर्य और कड़े अनुशासन की परीक्षा लेता है, फिर टिकाऊ और बड़े परिणाम देता है।",
    Mars: "कार्य करने की शक्ति, उत्साह और निर्णय लेने की गति देता है।",
    Venus: "जीवन में आपसी सामंजस्य, आनंद और रचनात्मक अभिव्यक्ति लाता है।",
    Mercury: "वाणी की मधुरता, तार्किक स्पष्टता और विश्लेषण करने की क्षमता बढ़ाता है।",
    Moon: "मन की शांति, भावनाओं के उतार-चढ़ाव और अंतर्ज्ञान को प्रभावित करता है।",
    Sun: "आत्मविश्वास, नेतृत्व करने की क्षमता और मान-सम्मान को बढ़ाता है।",
    Ketu: "धार्मिक गहराई, शोध और सांसारिक लगाव से मुक्ति देता है।",
  };
  return descriptions[planet] || "ग्रह का सामान्य प्रभाव";
}

function translateGuidance(text: string, isDo: boolean): string {
  const mapping: Record<string, string> = {
    // Career
    "Prioritize deep work and system reliability": "गहन कार्य और अपनी कार्यप्रणाली की स्थिरता को प्राथमिकता दें",
    "Communicate progress clearly to key stakeholders": "अपने काम की प्रगति को वरिष्ठों के साथ स्पष्ट रूप से साझा करें",
    "Build assets that compound over weeks and months": "ऐसी चीजों पर काम करें जो आगे चलकर आपको बड़ा लाभ दें",
    "Impulsive pivots without evidence": "बिना किसी ठोस आधार के अचानक अपनी दिशा बदलने से बचें",
    "Comparing your pace with others daily": "रोज दूसरों से अपनी प्रगति की तुलना करने से बचें",
    "Dropping in-progress work mid-cycle": "हाथ में लिए गए काम को बीच में अधूरा न छोड़ें",
    // Finance
    "Track inflow and outflow with zero ambiguity": "अपने आय और व्यय का बिल्कुल स्पष्ट हिसाब रखें",
    "Prioritize downside protection before upside chasing": "बड़ा लाभ कमाने से पहले अपने पैसों की सुरक्षा को प्राथमिकता दें",
    "Commit to a plan-based allocation rhythm": "बजट और योजना के अनुसार ही पैसों का निवेश करें",
    "Speculative overexposure": "बिना सोचे-समझे किसी जोखिम भरे निवेश में ज्यादा पैसा लगाने से बचें",
    "Emotional spending under stress": "तनाव में आकर या भावनाओं में बहकर फिजूलखर्ची करने से बचें",
    "Frequent strategy switching": "बार-बार अपनी वित्तीय योजनाओं और रणनीतियों को बदलने से बचें",
    // Health
    "Lock sleep and meal timing": "अपने सोने और खाने के समय को बिल्कुल निश्चित करें",
    "Use moderate but consistent physical activity": "नियमित रूप से हल्की कसरत या सैर करना शुरू करें",
    "Reduce mental overload through structured downtime": "मानसिक दबाव कम करने के लिए शांत समय निकालें",
    "Overtraining when recovery is low": "थकान महसूस होने पर शरीर पर ज्यादा दबाव डालने से बचें",
    "Ignoring stress signals": "तनाव के शारीरिक संकेतों को नजरअंदाज करने से बचें",
    "Inconsistent routines": "दिनचर्या में बार-बार बदलाव करने से बचें",
    // Relationships
    "Speak directly and calmly": "बिना किसी हिचकिचाहट के शांत रहकर अपनी बात कहें",
    "Create intentional quality time": "अपने प्रियजनों के साथ बिताने के लिए शांत समय निकालें",
    "Resolve friction early with empathy": "किसी भी विवाद को समझदारी और प्रेम से जल्दी सुलझाएं",
    "Passive assumptions": "मन में कोई गलतफहमी या पूर्वग्रह पालने से बचें",
    "Delayed difficult conversations": "जरूरी बातों को टालने या छुपाने से बचें",
    "Emotion-driven reactions in conflict": "गुस्से या भावना में आकर तुरंत कोई तीखी प्रतिक्रिया देने से बचें",
    // Growth
    "Build one high-leverage learning stack": "किसी एक महत्वपूर्ण विषय को गहराई से सीखना शुरू करें",
    "Document progress and reflection weekly": "हर सप्ताह अपनी प्रगति और अनुभवों को डायरी में लिखें",
    "Convert insights into repeatable habits": "सीखी हुई बातों को अपनी दैनिक आदत में शामिल करें",
    "Collecting knowledge without implementation": "केवल जानकारी जुटाने और उसे लागू न करने से बचें",
    "Starting too many paths simultaneously": "एक साथ बहुत सारे काम शुरू करके ध्यान भटकाने से बचें",
    "Quitting right before momentum": "सफलता मिलने के ठीक पहले हौसला खोने से बचें",
    // Mind
    "Use structured reflection and journaling": "नियमित रूप से अपने विचारों को लिखना और ध्यान करना शुरू करें",
    "Limit cognitive clutter and noise": "फालतू की खबरों और शोर-शराबे से खुद को दूर रखें",
    "Maintain a daily grounding practice": "अपने मन को शांत रखने के लिए सुबह पूजा या ध्यान करें",
    "Information overload": "इंटरनेट और सोशल मीडिया पर ज्यादा समय बिताने से बचें",
    "Self-critical rumination loops": "स्वयं को कोसने या नकारात्मक विचारों में खोने से बचें",
    "Late-night overanalysis": "देर रात तक जागकर फालतू की चिंता करने से बचें"
  };
  return mapping[text] || text;
}

interface LifeDomainCard {
  id: string;
  icon: string;
  title: string;
  titleHindi: string;
  narrative: string;
  planetSignals: string[];
  activatedPatterns: string[];
  caution: string | null;
  primaryPlanet: string;
  strength: "supportive" | "sensitive" | "neutral";
  statusLabel?: string;
  statusLabelHindi?: string;
  emphasisTag?: "Most Active" | "Currently Influenced" | null;
  emphasisTagHindi?: "सर्वाधिक सक्रिय" | "वर्तमान में प्रभावित" | null;
  confidenceTone?: string;
  confidenceToneHindi?: string;
  timingWindow?: string;
  timingWindowHindi?: string;
  whyThisMatters?: {
    transitReasoning: string;
    transitReasoningHindi: string;
    dashaInfluence: string;
    dashaInfluenceHindi: string;
    practicalInterpretation: string;
    practicalInterpretationHindi: string;
    emotionalGuidance: string;
    emotionalGuidanceHindi: string;
  };
}

function getActivatedPatternsForDomain(
  id: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transits: string[]
): string[] {
  const isSupportive = strength === "supportive";
  const isSensitive = strength === "sensitive";

  if (id === "self") {
    if (isSupportive) return ["A surge of clarity brings personal goals into sharp focus today.", "Your natural presence resonates strongly, making it a wonderful time to establish new physical habits.", "Inner alignment feels steady, allowing self-expression to flow without friction."];
    if (isSensitive) return ["Physical energy might fluctuate today, reminding you to honor moments of rest.", "A gentle approach to self-expectations helps steer clear of minor frustrations.", "Taking a step back to recover preserves your vital momentum."];
    return ["A quiet, steady rhythm supports simple daily self-care.", "Consistent routines act as a comforting anchor for your mind.", "Focusing on immediate physical comfort brings stable grounding."];
  }
  if (id === "wealth") {
    if (isSupportive) return ["A disciplined approach to resources begins to show subtle, positive returns.", "Financial planning feels clear and structured, helping secure long-term goals.", "Conversations regarding family assets move forward with constructive ease."];
    if (isSensitive) return ["Patience with temporary resource delays protects your peace of mind.", "Evaluating expenses calmly prevents impulsive financial steps today.", "A cautious, structured boundary with outgoing funds is highly supportive."];
    return ["Maintaining a simple budget tracking routine keeps your mind relaxed.", "Focusing on capital preservation provides an excellent stable baseline.", "A quiet period for reviewing accounts supports long-term security."];
  }
  if (id === "siblings") {
    if (isSupportive) return ["Your daily self-efforts carry a determined, constructive energy today.", "Methodical communication opens smooth pathways with peers and close contacts.", "A courageous spark helps you initiate structured writing or local projects."];
    if (isSensitive) return ["Approaching colleagues with extra patience helps prevent minor misunderstandings.", "Short journeys or dynamic plans succeed when you allow extra time.", "Expressing thoughts softly keeps interactions cooperative."];
    return ["Quiet consistency in your daily checklist builds solid progress.", "A steady, practical tone resolves minor communication tasks smoothly.", "Focusing on immediate execution brings a quiet sense of accomplishment."];
  }
  if (id === "home") {
    if (isSupportive) return ["The domestic atmosphere shifts toward a quiet, comforting harmony.", "Spending calm moments at home restores your deep emotional reserves.", "A nurturing focus on your living space creates a beautiful sanctuary."];
    if (isSensitive) return ["Emotional boundaries at home help keep the domestic environment quiet.", "Offering extra care to family members' wellness creates gentle stability.", "Taking quiet pauses prevents household tasks from feeling urgent."];
    return ["A steady, low-noise domestic routine brings comfort today.", "Simple home organizing tasks support an orderly state of mind.", "Focusing on basic domestic comforts grounds your emotional core."];
  }
  if (id === "children") {
    if (isSupportive) return ["Creative inspiration flows easily when you trust your natural rhythm.", "Your intellectual focus is sharp, making it ideal for deep study or planning.", "Relational interactions feel warm, honest, and grounded in mutual respect."];
    if (isSensitive) return ["Patience with creative blockages allows fresh ideas to mature naturally.", "Steering clear of hasty speculative risks keeps your progress secure.", "Channeling emotional intensity into structured learning yields wonderful rewards."];
    return ["Maintaining a consistent study or creative routine builds confidence.", "Keeping expectations realistic supports stable, loving connections.", "A calm, methodical approach to learning feels highly sustainable."];
  }
  if (id === "health") {
    if (isSupportive) return ["The physical system recovers energy efficiently when given wholesome inputs.", "Approaching daily chores with a service-oriented mindset feels deeply satisfying.", "A balanced daily rhythm supports structural physical wellness."];
    if (isSensitive) return ["Listening carefully to your body's early rest signals preserves vitality.", "Regular meal timings and plenty of hydration support smooth digestion.", "A quiet, screen-free evening helps wind down a sensitive nervous system."];
    return ["Keeping a moderate, steady movement schedule supports joint comfort.", "Simple, consistent wellness choices protect your physical baseline.", "Managing daily chores methodically prevents mental fatigue."];
  }
  if (id === "spouse") {
    if (isSupportive) return ["Shared goals and collaborative plans feel naturally aligned today.", "An atmosphere of mutual understanding softens any historical frictions.", "Clear, gentle dialogues reinforce the strength of your primary bonds."];
    if (isSensitive) return ["Relationships flourish when sensitive topics are approached with patient listening.", "Clarifying assumptions early and softly keeps partnerships harmonious.", "A calm, unhurried tone prevents minor domestic debates from escalating."];
    return ["Maintaining open and quiet communication channels ensures steady harmony.", "Keeping mutual expectations mature and balanced feels deeply anchoring.", "Handling joint responsibilities methodically supports stable trust."];
  }
  if (id === "transformation") {
    if (isSupportive) return ["Quiet introspection yields beautiful psychological clarity today.", "Deep analytical tasks or research move forward with exceptional focus.", "Letting go of old emotional baggage feels liberating and natural."];
    if (isSensitive) return ["A calm, detached perspective makes handling minor delays effortlessly.", "Allowing plans to evolve organically clears away unnecessary pressure.", "Focusing on internal healing helps release obsessive control loops."];
    return ["A quiet phase supports steady contemplation and personal reflection.", "Managing pending tax, insurance, or joint account paperwork goes smoothly.", "Keeping a low profile allows you to process thoughts without external noise."];
  }
  if (id === "wisdom") {
    if (isSupportive) return ["A deep sense of wisdom guides your decisions into productive avenues.", "Philosophical insights offer a beautiful sense of perspective and direction.", "Conversations with mentors or father figures carry mutual respect and learning."];
    if (isSensitive) return ["Philosophical doubts clear up when you focus on simple, practical truths.", "Respectful listening during senior discussions preserves harmony.", "Patience with long-term educational plans allows details to settle nicely."];
    return ["A regular daily reading or meditation habit grounds your mindset.", "Reflecting quietly on long-term goals keeps your steps aligned.", "A balanced appreciation of senior guidance supports steady growth."];
  }
  if (id === "career") {
    if (isSupportive) return ["Professional execution feels clear, helping you build positive momentum.", "A methodical approach to leadership responsibilities gains quiet respect.", "Your focus on project quality supports long-term career positioning."];
    if (isSensitive) return ["Saturn's steady transit requires disciplined execution over rapid shifts.", "Approaching workspace changes with a calm, methodical attitude ensures stability.", "Relying on clear project logs and documentation prevents minor miscommunications."];
    return ["Quietly executing your current tasks ensures reliable progress.", "Keeping professional logs transparent and up-to-date supports trust.", "A stable routine keeps workload stress completely manageable."];
  }
  if (id === "gains") {
    if (isSupportive) return ["Collaborative network opportunities align beautifully with your goals.", "Interactions with elder siblings or friends bring constructive support.", "Methodical progress toward revenue streams shows steady, reliable gains."];
    if (isSensitive) return ["A conservative approach to joint financial plans keeps your assets safe.", "Patience with processing delays in payments prevents unnecessary worry.", "Verifying collaborative details thoroughly before committing protects your interests."];
    return ["Maintaining clean boundaries with social acquaintances keeps life simple.", "Tracking your secondary streams of revenue calmly supports budgeting.", "Consistent check-ins with reliable associates foster long-term ties."];
  }
  // expenses
  if (isSupportive) return ["Quiet solitude provides a deeply restorative and healing influence.", "Planned allocations toward long-term learning feel highly constructive.", "A quiet bedtime schedule supports deep, refreshing sleep quality."];
  if (isSensitive) return ["Restricting evening cognitive stimulation helps calm a busy mind for sleep.", "Strict, structured tracking prevents minor leaks in your daily budget.", "Creating a low-noise wind-down window restores physical vitality."];
  return ["Consistent sleep hygiene practices support deep cellular recovery.", "A simple tracking habit keeps outflow of funds highly predictable.", "Allocating brief moments for quiet self-reflection grounds the day."];
}

function getCautionForDomain(
  id: string,
  primaryPlanet: string,
  transits: string[],
  mode: OutputMode
): string {
  const isPandit = mode === "PANDIT";

  if (isPandit) {
    if (id === "self") return "सकारात्मक सोच बनाए रखें और स्वास्थ्य पर ध्यान दें।";
    if (id === "wealth") return "बिना सोचे-मत समझे निवेश करने या पैसे उधार देने से बचें।";
    if (id === "siblings") return "दूसरों के साथ बातचीत में तंज या कड़वाहट से बचें।";
    if (id === "home") return "पारिवारिक शांति बनाए रखने के लिए प्रतिक्रिया देने में थोड़ा रुकें।";
    if (id === "children") return "शॉर्टकट वाले निवेशों और अति-उत्साह में बड़े जोखिमों से बचें।";
    if (id === "health") return "सोने और खाने के समय को नियमित रखें, देर रात जागने से बचें।";
    if (id === "spouse") return "जीवनसाथी के साथ बातचीत में संयम और उदारता बनाए रखें।";
    if (id === "transformation") return "वाहन चलाते समय अतिरिक्त सावधानी रखें और अनावश्यक विचारों से बचें।";
    if (id === "wisdom") return "वरिष्ठों के साथ वैचारिक मतभेद होने पर मौन रहकर विचार करें।";
    if (id === "career") return "कार्यक्षेत्र में जल्दबाजी में निर्णय न लें और नियमित काम पर टिके रहें।";
    if (id === "gains") return "किसी मित्र के कहने पर उधार देने या बड़ी डीलिंग में शामिल होने से बचें।";
    return "अनावश्यक खर्चों पर नियंत्रण रखें और रात को स्क्रीन से दूर रहें।";
  }

  if (id === "self") return "Nurture positive thoughts and honor bodily recovery signals.";
  if (id === "wealth") return "Refrain from speculative investments or unverified lending commitments.";
  if (id === "siblings") return "Avoid reactive or sharp exchanges with colleagues and associates.";
  if (id === "home") return "Pace your interactions to support home and domestic harmony.";
  if (id === "children") return "Steer completely clear of volatile speculative financial channels.";
  if (id === "health") return "Lock in sleep schedules and avoid late-night caffeine or screens.";
  if (id === "spouse") return "Use gentle, clear expressions and patient dialogue in partnerships.";
  if (id === "transformation") return "Take extra care during transit and release obsolete emotional loops.";
  if (id === "wisdom") return "Remain patient and receptive when listening to elder counsel.";
  if (id === "career") return "Avoid sudden professional shifts; focus on methodical execution.";
  if (id === "gains") return "Exercise structured caution regarding collaborative capital commitments.";
  return "Establish strict limits on outflow and protect bedtime rest quality.";
}

function buildDomainNarrativeBox(
  id: string,
  title: string,
  titleHindi: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transits: string[],
  dasha: DashaContext,
  mode: OutputMode
): string {
  const isPandit = mode === "PANDIT";
  
  const md = dasha.md.planet;
  const ad = dasha.ad.planet;
  const pd = dasha.pd.planet;

  if (isPandit) {
    if (id === "self") {
      if (strength === "supportive") return `Beta, abhi tumhari dasha mein ${md} aur ${ad} ka achha prabhav chal raha hai, aur tumhare lagna swami ${primaryPlanet} ki sthiti kaafi anukul hai. Vyaktitva aur physical energy mein ek naya nikhara aane ke yog hain. Confidence ko sahi disha mein lagao aur khud par poora vishwas rakho.`;
      if (strength === "sensitive") return `Beta, lagnesh ${primaryPlanet} aur gochar mein sensitive planets ke prabhav ke karan body thoda heavy feel kar sakti hai. Is samay tumhare dasha chakra mein ${ad}/${pd} ka chalna bata raha hai ki chinta se door rehna aur thoda rest lena faydemand rahega.`;
      return `Beta, lagnesh ${primaryPlanet} abhi normal sthiti mein hain. Tumhari active dasha ${md}/${ad} ke chalte ek behad stable aur quiet period chal raha hai. Daily routine ko simple aur organized rakho.`;
    }
    if (id === "wealth") {
      if (strength === "supportive") return `Beta, tumhare dhana bhav ke swami ${primaryPlanet} hain aur abhi dasha mein ${ad} ki shakti mil rahi hai, jisse financial position behtar hone ke sanket hain. Disciplined savings shuru karo, yeh shubh samay hai.`;
      if (strength === "sensitive") return `Beta, abhi gochar mein sensitive planets dhana bhav ko prabhavit kar rahe hain. active dasha ${md}/${pd} ke chalte koi bhi speculative risk mat lena, budget par dhyan do.`;
      return `Beta, tumhare dhana swami ${primaryPlanet} abhi stable hain. Budgeting aur tracking clean rakhna, Laxmi ji ki kripa bani rahegi.`;
    }
    if (id === "siblings") {
      if (strength === "supportive") return `Beta, tritiya swami ${primaryPlanet} ka gochar aur active dasha sahas ko badhane wala hai. Writing aur communication ke kshetr mein tarakki ho sakti hai.`;
      if (strength === "sensitive") return `Beta, tritiya swami ${primaryPlanet} par sensitive transits ke karan peers ke sath communication mein tone bilkul soft rakhna zaroori hai.`;
      return `Beta, sahas bhav ke swami ${primaryPlanet} normal sthiti mein chal rahe hain. quiet consistency se apne kaam karte raho.`;
    }
    if (id === "home") {
      if (strength === "supportive") return `Beta, chaturtha swami ${primaryPlanet} aur gochar ke shubh asar se ghar ka vatavaran behad shant rahega. Mata ji ka aashirwad tumhare sath hai.`;
      if (strength === "sensitive") return `Beta, chaturtha bhav par sensitive planets ka pressure hai. active dasha ${md}/${pd} ke chalte mata ji ki health aur domestic peace ka dhyan rakhna zaroori hai.`;
      return `Beta, chaturtha bhav ke swami ${primaryPlanet} stable hain. Domestic comfort aur home maintenance ke pending kaamo ko quietly nipatane ke liye anukul samay hai.`;
    }
    if (id === "children") {
      if (strength === "supportive") return `Beta, pancham swami ${primaryPlanet} aur dasha swami ${ad} ki kripa se creative learning aur studies mein breakthrough mil sakta hai. Bhole Baba ka dhyan karo.`;
      if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} aur sensitive transit ke chalte shares ya speculative market mein galti se bhi paisa mat lagana.`;
      return `Beta, pancham swami ${primaryPlanet} stable phase mein hain. Methodical study aur consistent learning routine banaye rakhein.`;
    }
    if (id === "health") {
      if (strength === "supportive") return `Beta, shastha swami ${primaryPlanet} aur dasha ki sthiti anukul hone se physical recovery bahut tez rahegi. exercise aur wholesome diet support karegi.`;
      if (strength === "sensitive") return `Beta, gochar mein sensitive planets shastha bhav ko dekh rahe hain. sleep aur routine ko lock kar lo, push mat karo.`;
      return `Beta, shastha bhav ke swami ${primaryPlanet} normal sthiti mein hain. Health stable rahegi, bas daily schedules regular rakhein.`;
    }
    if (id === "spouse") {
      if (strength === "supportive") return `Beta, saptam swami ${primaryPlanet} ki anukulata se marital life aur partnerships mein prem badhega. Sukhi raho.`;
      if (strength === "sensitive") return `Beta, saptam swami ${primaryPlanet} par sensitive transits ke prabhav ke karan partner ki baat ko poore dhairya se suno, reactive mat hona.`;
      return `Beta, saptam bhav ke swami ${primaryPlanet} stable hain. open communication aur mutual respect se balance bana rahega.`;
    }
    if (id === "transformation") {
      if (strength === "supportive") return `Beta, ashtam swami ${primaryPlanet} aur active dasha research ya deep psychology mein interest badhayegi. inner healing ke liye shubh samay hai.`;
      if (strength === "sensitive") return `Beta, ashtam bhav par pressure zone hai. Driving carefully karo aur sudden changes ke samay ghabrana mat.`;
      return `Beta, ashtam swami ${primaryPlanet} stable hain. pending tax ya insurance se jude kaam bina kisi rukavat ke quietly pure honge.`;
    }
    if (id === "wisdom") {
      if (strength === "supportive") return `Beta, navam swami ${primaryPlanet} ki shubh sthiti bhagya ko mazboot karegi. Mentors aur father ka support milega.`;
      if (strength === "sensitive") return `Beta, navam swami ${primaryPlanet} par transit ke karan karma par focus rakho, bhagya के bharose kaam mat talo.`;
      return `Beta, navam swami ${primaryPlanet} stable hain. daily spiritual practice aur seniors ke sath respect banaye rakhein.`;
    }
    if (id === "career") {
      if (strength === "supportive") return `Beta, tumhare dasham bhav ke swami ${primaryPlanet} hain aur dasha mein ${ad} ki shakti mil rahi hai, jisse authority aur recognition badhne ke yog hain. Projects confidence se execute karo.`;
      if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} ke chalte workspace par responsibilities aur workload kafi rahega. Ego conflicts se bacho aur methodical kaam karo.`;
      return `Beta, dasham swami ${primaryPlanet} stable hain. Quiet consistency hi career mein steady growth degi.`;
    }
    if (id === "gains") {
      if (strength === "supportive") return `Beta, ekadash swami ${primaryPlanet} aur dasha ki anukulata income aur networks ko expand karegi. long-term goals quietly materialize honge.`;
      if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} ke chalte payments aane mein temporary delays ho sakte hain. Loan dene se bacho.`;
      return `Beta, ekadash swami ${primaryPlanet} stable hain. cash allocations conservative rakho aur budget systematically manage karo.`;
    }
    // expenses
    if (strength === "supportive") return `Beta, dvadash swami ${primaryPlanet} aur active dasha ${ad} ke asar se mediation aur deep sleep ka shubh yog hai. Solitude ka anand lo.`;
    if (strength === "sensitive") return `Beta, gochar aur active dasha ke chalte overthinking ho sakti hai. Budget control tight rakho aur sone se pehle screen band karo.`;
    return `Beta, dvadash swami ${primaryPlanet} stable hain. sleep schedule regular rakho aur expenditures quietly track karo.`;
  } else {
    if (id === "self") {
      if (strength === "supportive") return `My dear, governed by your ascendant lord ${primaryPlanet}, your vitality and personal clarity receive a highly constructive boost. It is a wonderful phase for implementing positive habits and executing personal goals.`;
      if (strength === "sensitive") return `My dear, with sensitive transits affecting your ascendant ruler ${primaryPlanet}, physical fatigue can manifest under heavy workloads. Prioritize recovery and proceed with a gentle daily pace.`;
      return `My dear, with ascendant ruler ${primaryPlanet} in a stable position, you are in a quiet building phase. Keep your daily routine steady and grounded.`;
    }
    if (id === "wealth") {
      if (strength === "supportive") return `My dear, your wealth lord ${primaryPlanet} is well-placed, suggesting a highly constructive window for financial discipline and systematic asset building.`;
      if (strength === "sensitive") return `My dear, sensitive transits passing through your financial sector indicate financial volatility. Completely avoid speculative risks and maintain a structured budget.`;
      return `My dear, your accumulated wealth lord ${primaryPlanet} is stable. Keep inflow and outflow in a balanced, predictable routine.`;
    }
    if (id === "siblings") {
      if (strength === "supportive") return `My dear, the position of effort ruler ${primaryPlanet} ignites positive courage and methodical progress in daily communication and peer projects.`;
      if (strength === "sensitive") return `My dear, your effort sector ruler ${primaryPlanet} is under sensitive transit pressure. Maintain a soft, patient, and professional tone to bypass minor peer friction.`;
      return `My dear, with effort ruler ${primaryPlanet} stable, quiet consistency and structured execution will be your best assets today.`;
    }
    if (id === "home") {
      if (strength === "supportive") return `My dear, the ruler of your domestic life, ${primaryPlanet}, supports a comforting, peaceful atmosphere. Spend quiet moments restoring your emotional reserves.`;
      if (strength === "sensitive") return `My dear, sensitive transits in your home house suggest minor domestic friction or maternal wellness checks. Keep your living space calm and low-noise.`;
      return `My dear, home ruler ${primaryPlanet} is stable. Focus quietly on minor domestic maintenance or pending family adjustments.`;
    }
    if (id === "children") {
      if (strength === "supportive") return `My dear, creative and intellectual projects move forward beautifully as pancham swami ${primaryPlanet} brings sharp focus and clear choices.`;
      if (strength === "sensitive") return `My dear, active dasha ${md}/${pd} and sensitive transits require pausing speculative financial risks. Channel emotional drive into structured learning.`;
      return `My dear, children house lord ${primaryPlanet} is in a stable configuration. Keep romantic expectations and academic routines steady.`;
    }
    if (id === "health") {
      if (strength === "supportive") return `My dear, with health house ruler ${primaryPlanet} supportive, physical recovery is efficient. wholsome routine choices will easily compound fitness gains.`;
      if (strength === "sensitive") return `My dear, sensitive transits affecting health ruler ${primaryPlanet} demand structured sleep and digestion hygiene. Listen to early bodily signals.`;
      return `My dear, recovery ruler ${primaryPlanet} is stable. Maintain standard wellness habits and avoid unnecessary physical push today.`;
    }
    if (id === "spouse") {
      if (strength === "supportive") return `My dear, your relationship ruler ${primaryPlanet} is well-placed, encouraging loving, clear, and highly supportive connections in your partnerships.`;
      if (strength === "sensitive") return `My dear, relationship ruler ${primaryPlanet} receives sensitive transits. Avoid reactive debates; listen patiently and clear assumptions early.`;
      return `My dear, partner lord ${primaryPlanet} is in a stable state. Mutual expectations will proceed in a steady, mature, and balanced flow.`;
    }
    if (id === "transformation") {
      if (strength === "supportive") return `My dear, the ruler of your transformative house, ${primaryPlanet}, supports deep research, tax filings, and Occult studies. Insights emerge during quietude.`;
      if (strength === "sensitive") return `My dear, sensitive transits indicate unexpected timeline shifts. Maintain a detached, calm mind and take extra care during journeys.`;
      return `My dear, transformation lord ${primaryPlanet} is stable. Resolve insurance, tax, or joint estate paperwork quietly without rush.`;
    }
    if (id === "wisdom") {
      if (strength === "supportive") return `My dear, wisdom ruler ${primaryPlanet} is highly active, bringing supportive guidance from father or mentors. A great time for philosophical learning.`;
      if (strength === "sensitive") return `My dear, wisdom lord ${primaryPlanet} is under sensitive pressure. Respect senior guidance and avoid forcing long-term travel plans today.`;
      return `My dear, wisdom ruler ${primaryPlanet} is stable. Keep up with spiritual practice and structured philosophical reading.`;
    }
    if (id === "career") {
      if (strength === "supportive") return `My dear, governed by career lord ${primaryPlanet}, you are in a highly constructive positioning phase. leadership opportunities can materialize through systematic planning.`;
      if (strength === "sensitive") return `My dear, career house ruler ${primaryPlanet} receives sensitive transits, indicating elevated workplace workloads. Avoid workplace debates; focus on systematic task completion.`;
      return `My dear, career lord ${primaryPlanet} is stable. Continue building professional quality calmly; consistent progress will bear results.`;
    }
    if (id === "gains") {
      if (strength === "supportive") return `My dear, gains lord ${primaryPlanet} expands network opportunities and secondary revenues. Your long-term goals quietly begin to align.`;
      if (strength === "sensitive") return `My dear, active dasha ${md}/${pd} in your gains house can trigger minor payout delays. Keep cash allocation conservative and verify network associations.`;
      return `My dear, gains ruler ${primaryPlanet} is in a stable configuration. Track revenue details quietly and keep social boundaries clear.`;
    }
    // expenses
    if (strength === "supportive") return `My dear, expenditures ruler ${primaryPlanet} supports planned long-term allocations and restful solitude. Sleep quality is deep.`;
    if (strength === "sensitive") return `My dear, sensitive transits in your solitude house suggest sleep interruptions. Keep a disciplined screen-free bedtime routine.`;
    return `My dear, expenditure ruler ${primaryPlanet} is stable. Track minor outflow details quietly and cultivate moments of self-reflection.`;
  }
}

function getDomainStatusLabels(
  id: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transitsInHouse: string[],
  dasha: DashaContext
): { label: string; labelHindi: string } {
  if (transitsInHouse.includes("Jupiter")) {
    return { label: "Breakthrough", labelHindi: "अनुकूल" };
  }
  if (transitsInHouse.includes("Saturn")) {
    return { label: "Disciplined", labelHindi: "संतुलित" };
  }
  if (transitsInHouse.includes("Rahu") || transitsInHouse.includes("Ketu")) {
    return { label: "Transformational", labelHindi: "परिवर्तनशील" };
  }
  if (dasha.md.planet === primaryPlanet || dasha.ad.planet === primaryPlanet) {
    return { label: "Active", labelHindi: "सक्रिय" };
  }
  if (strength === "sensitive") {
    return { label: "Under Pressure", labelHindi: "दबावयुक्त" };
  }
  if (id === "spouse" || id === "siblings") {
    return { label: "Collaborative", labelHindi: "सहयोगी" };
  }
  return { label: "Stable", labelHindi: "स्थिर" };
}

function buildWhyThisMatters(
  id: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transitsInHouse: string[],
  dasha: DashaContext
) {
  let transitReasoning = "";
  let transitReasoningHindi = "";
  if (transitsInHouse.length > 0) {
    transitReasoning = `The transit of ${transitsInHouse.join(" and ")} through this house directly activates its core themes, prompting active adjustments in this sphere.`;
    transitReasoningHindi = `इस भाव में ${transitsInHouse.join(" और ")} का गोचर इसके मुख्य विषयों को सीधे जागृत कर रहा है, जिससे इस क्षेत्र में बदलाव आ रहे हैं।`;
  } else {
    transitReasoning = "No major slow transits are directly affecting this house, allowing its affairs to settle into a quiet, stable phase.";
    transitReasoningHindi = "कोई भी बड़ा गोचर सीधे इस भाव को प्रभावित नहीं कर रहा है, जिससे इसके कार्य एक शांत और स्थिर चरण में बने हुए हैं।";
  }

  let dashaInfluence = "";
  let dashaInfluenceHindi = "";
  if (dasha.md.planet === primaryPlanet) {
    dashaInfluence = `Governed by the Mahadasha lord (${primaryPlanet}), this house represents a long-term central focus of your entire current life cycle.`;
    dashaInfluenceHindi = `महादशा स्वामी (${primaryPlanet}) द्वारा शासित होने के कारण, यह भाव आपके वर्तमान जीवन चक्र का एक दीर्घकालिक केंद्रीय फोकस है।`;
  } else if (dasha.ad.planet === primaryPlanet) {
    dashaInfluence = `Governed by the active Antardasha lord (${primaryPlanet}), this house undergoes dynamic activation, bringing immediate priorities to the forefront.`;
    dashaInfluenceHindi = `सक्रिय अंतर्दशा स्वामी (${primaryPlanet}) द्वारा शासित, यह भाव गतिशील रूप से सक्रिय है, जिससे तात्कालिक प्राथमिकताएं सामने आ रही हैं।`;
  } else {
    dashaInfluence = `The active Dasha lords are not directly ruling this sector, allowing its energy to function as a quiet, supportive background layer.`;
    dashaInfluenceHindi = `सक्रिय दशा स्वामी सीधे इस क्षेत्र पर शासन नहीं कर रहे हैं, जिससे इसकी ऊर्जा एक शांत, सहायक पृष्ठभूमि के रूप में कार्य कर रही है।`;
  }

  const practicalMap = {
    self: {
      supportive: "Establishing a clean, regular morning routine helps capture the day's peak productive energy.",
      sensitive: "A structured limit on daily physical commitments prevents sudden fatigue.",
      neutral: "Documenting simple daily wins keeps self-motivation naturally high.",
      supportiveH: "एक स्वच्छ, नियमित सुबह की दिनचर्या स्थापित करने से दिन की उच्च उत्पादक ऊर्जा को हासिल करने में मदद मिलती है।",
      sensitiveH: "दैनिक शारीरिक प्रतिबद्धताओं पर एक व्यवस्थित सीमा लगाने से अचानक होने वाली थकान से बचाव होता है।",
      neutralH: "दैनिक छोटी जीतों को दर्ज करने से आत्म-प्रेरणा स्वाभाविक रूप से बनी रहती है।"
    },
    wealth: {
      supportive: "A systematic review of long-term allocations ensures assets remain productive.",
      sensitive: "Verifying transaction statements and pausing major expenditures keeps cash protected.",
      neutral: "Tracking daily outflows calmly builds a clear picture of financial health.",
      supportiveH: "दीर्घकालिक आवंटन की एक व्यवस्थित समीक्षा यह सुनिश्चित करती है कि संपत्ति उत्पादक बनी रहे।",
      sensitiveH: "लेन-देन के विवरणों को सत्यापित करना और बड़े खर्चों को टालना नकदी को सुरक्षित रखता है।",
      neutralH: "दैनिक खर्चों को शांत रहकर ट्रैक करने से वित्तीय स्थिति की स्पष्ट तस्वीर बनती है।"
    },
    siblings: {
      supportive: "Drafting clear outlines before meetings keeps daily self-efforts efficient.",
      sensitive: "Drafting emails calmly and delaying sensitive responses avoids communication friction.",
      neutral: "Quietly completing your scheduled writing tasks ensures clean progress.",
      supportiveH: "बैठकों से पहले स्पष्ट रूपरेखा तैयार करने से दैनिक प्रयास कुशल बने रहते हैं।",
      sensitiveH: "शांत रहकर ईमेल लिखना और संवेदनशील प्रतिक्रियाओं को टालना संचार घर्षण से बचाता है।",
      neutralH: "निर्धारित लेखन कार्यों को शांति से पूरा करना स्पष्ट प्रगति सुनिश्चित करता है।"
    },
    home: {
      supportive: "Decluttering your immediate workspace at home immediately refreshes domestic harmony.",
      sensitive: "Setting a low-noise, comfortable space for evening family rest supports everyone.",
      neutral: "Steady domestic maintenance tasks keep your surroundings structured.",
      supportiveH: "घर पर अपने कार्यक्षेत्र को व्यवस्थित करने से पारिवारिक सामंजस्य तुरंत ताज़ा हो जाता है।",
      sensitiveH: "शाम के पारिवारिक आराम के लिए एक शांत और आरामदायक स्थान निर्धारित करना सभी का समर्थन करता है।",
      neutralH: "निरंतर घरेलू रखरखाव के कार्य आपके परिवेश को व्यवस्थित बनाए रखते हैं।"
    },
    children: {
      supportive: "Dedicate block-time to structured learning or a creative skill to harness peak focus.",
      sensitive: "Pausing all speculative investment actions keeps your primary funds safe.",
      neutral: "A regular, realistic learning schedule builds stable knowledge compounding.",
      supportiveH: "शिखर ध्यान केंद्रित करने के लिए व्यवस्थित अध्ययन या रचनात्मक कौशल के लिए समय समर्पित करें।",
      sensitiveH: "सभी सट्टा निवेशों पर रोक लगाना आपके प्राथमिक धन को सुरक्षित रखता है।",
      neutralH: "एक नियमित और वास्तविक अध्ययन कार्यक्रम ज्ञान के स्थिर संचय का निर्माण करता है।"
    },
    health: {
      supportive: "Simple, clean dietary choices and light exercise support a high energy level.",
      sensitive: "Locking in exact sleep and meal times protects your physical system.",
      neutral: "Steady, moderate daily movement keeps the body feeling light and ready.",
      supportiveH: "सरल, स्वच्छ आहार विकल्प और हल्का व्यायाम ऊर्जा के स्तर को ऊंचा बनाए रखते हैं।",
      sensitiveH: "सोने और खाने के सटीक समय को निश्चित करना आपके शारीरिक स्वास्थ्य की रक्षा करता है।",
      neutralH: "निरंतर और मध्यम दैनिक गतिविधि शरीर को हल्का और तैयार महसूस कराती है।"
    },
    spouse: {
      supportive: "Setting aside dedicated quality time for collaborative dialogue deepens trust.",
      sensitive: "Using direct, gentle phrases and active listening resolves minor issues smoothly.",
      neutral: "Regular, calm check-ins on shared tasks keep alliances operating smoothly.",
      supportiveH: "सहयोगात्मक संवाद के लिए समर्पित गुणवत्तापूर्ण समय निकालना आपसी विश्वास को गहरा करता है।",
      sensitiveH: "सीधे, कोमल शब्दों का उपयोग और सक्रिय रूप से सुनना छोटी समस्याओं को आसानी से हल करता है।",
      neutralH: "साझा कार्यों पर नियमित, शांत चर्चा गठजोड़ को सुचारू रूप से संचालित रखती है।"
    },
    transformation: {
      supportive: "Quiet research or structural reviews of paperwork move forward with ease.",
      sensitive: "Delaying major high-risk activities and keeping driving speed moderate is wise.",
      neutral: "Resolving pending insurance or filing duties quietly prevents administrative lag.",
      supportiveH: "शांत अनुसंधान या कागजी कार्रवाई की संरचनात्मक समीक्षा आसानी से आगे बढ़ती है।",
      sensitiveH: "उच्च जोखिम वाली गतिविधियों को टालना और वाहन की गति मध्यम रखना बुद्धिमानी है।",
      neutralH: "लंबित बीमा या कर कागजात को शांति से हल करना प्रशासनिक देरी को रोकता है।"
    },
    wisdom: {
      supportive: "Reflecting on philosophical books or senior guidance offers clear direction.",
      sensitive: "Approaching conversations with mentors with patient, respectful listening is helpful.",
      neutral: "A regular morning reading session adds stable value to your long-term vision.",
      supportiveH: "दार्शनिक पुस्तकों या वरिष्ठों के मार्गदर्शन पर विचार करना स्पष्ट दिशा प्रदान करता है।",
      sensitiveH: "गुरुओं के साथ बातचीत में धैर्य और सम्मानपूर्वक सुनना मददगार होता है।",
      neutralH: "सुबह की नियमित अध्ययन दिनचर्या आपके दीर्घकालिक दृष्टिकोण में मूल्य जोड़ती है।"
    },
    career: {
      supportive: "Documenting accomplishments clearly and taking on structured duties gains respect.",
      sensitive: "Focusing entirely on executing existing projects methodically secures your position.",
      neutral: "Keeping professional records organized and updated ensures reliable progress.",
      supportiveH: "उपलब्धियों को स्पष्ट रूप से दर्ज करना और संरचित कर्तव्यों को संभालना सम्मान दिलाता है।",
      sensitiveH: "मौजूदा परियोजनाओं को व्यवस्थित रूप से निष्पादित करने पर ध्यान केंद्रित करना आपकी स्थिति सुरक्षित करता है।",
      neutralH: "पेशेवर अभिलेखों को व्यवस्थित और अद्यतित रखना विश्वसनीय प्रगति सुनिश्चित करता है।"
    },
    gains: {
      supportive: "Reaching out to verified network contacts opens very constructive avenues.",
      sensitive: "Keeping cash allocations conservative and postponing peer lending is highly recommended.",
      neutral: "Calmly tracking secondary income streams keeps financial goals clear.",
      supportiveH: "सत्यापित संपर्कों से संपर्क साधना अत्यंत रचनात्मक मार्ग प्रशस्त करता है।",
      sensitiveH: "नकदी के आवंटन को रूढ़िवादी रखना और दूसरों को उधार देना टालना अत्यधिक अनुशंसित है।",
      neutralH: "द्वितीयक आय धाराओं को शांत रहकर ट्रैक करना वित्तीय लक्ष्यों को स्पष्ट रखता है।"
    },
    expenses: {
      supportive: "Structuring a quiet meditation or reflection retreat restores your energy.",
      sensitive: "Setting strict limits on evening screen usage immediately supports sleep quality.",
      neutral: "Tracking minor cash outflows methodically ensures zero budget surprises.",
      supportiveH: "एक शांत ध्यान या आत्मनिरीक्षण की दिनचर्या बनाना आपकी ऊर्जा को पुनर्जीवित करता है।",
      sensitiveH: "शाम को स्क्रीन के उपयोग पर सख्त सीमाएं लगाना तुरंत नींद की गुणवत्ता का समर्थन करता है।",
      neutralH: "छोटे खर्चों को व्यवस्थित रूप से ट्रैक करना बजट में किसी भी अनपेक्षित आश्चर्य से बचाता है।"
    }
  };

  const emotionalMap = {
    self: {
      supportive: "Emotional balance feels natural when personal time is protected.",
      sensitive: "Slowing down your breathing during hectic moments preserves vital peace.",
      neutral: "Quiet self-acceptance acts as a strong anchor against outer noise.",
      supportiveH: "व्यक्तिगत समय सुरक्षित रहने पर भावनात्मक संतुलन स्वाभाविक महसूस होता है।",
      sensitiveH: "व्यस्त क्षणों में सांसों की गति को धीमा करना महत्वपूर्ण शांति बनाए रखता है।",
      neutralH: "शांत आत्म-स्वीकृति बाहरी कोलाहल के खिलाफ एक मजबूत आधार का काम करती है।"
    },
    wealth: {
      supportive: "A quiet confidence in your resources allows you to focus on growth.",
      sensitive: "Reminding yourself that capital preservation is a form of active progress reduces worry.",
      neutral: "Gratitude for small financial stabilities creates a harmonious money mindset.",
      supportiveH: "अपने संसाधनों में शांत आत्मविश्वास आपको विकास पर ध्यान केंद्रित करने की अनुमति देता है।",
      sensitiveH: "स्वयं को यह याद दिलाना कि पूंजी की सुरक्षा भी सक्रिय प्रगति है, चिंता को कम करता है।",
      neutralH: "छोटी वित्तीय स्थिरता के लिए आभार व्यक्त करना एक सामंजस्यपूर्ण सोच का निर्माण करता है।"
    },
    siblings: {
      supportive: "A serene confidence in your capabilities makes execution feel natural.",
      sensitive: "Steering clear of defensive verbal loops preserves mental clarity.",
      neutral: "A practical focus on execution rather than external approval grounds your mind.",
      supportiveH: "अपनी क्षमताओं में शांत आत्मविश्वास कार्य निष्पादन को स्वाभाविक बनाता है।",
      sensitiveH: "बचावात्मक तर्कों से दूर रहना मानसिक स्पष्टता की रक्षा करता है।",
      neutralH: "बाहरी अनुमोदन के बजाय काम पर व्यावहारिक ध्यान देना आपके दिमाग को केंद्रित रखता है।"
    },
    home: {
      supportive: "Resting quietly in a comfortable corner restores your emotional reserve.",
      sensitive: "Reminding yourself that domestic peace is a process helps handle daily chores calmly.",
      neutral: "A peaceful living environment naturally reflects in your daily decisions.",
      supportiveH: "एक आरामदायक कोने में शांति से विश्राम करना आपकी भावनात्मक ऊर्जा को बहाल करता है।",
      sensitiveH: "स्वयं को यह याद दिलाना कि घरेलू शांति एक प्रक्रिया है, दैनिक कार्यों को शांत रखता है।",
      neutralH: "एक शांतिपूर्ण जीवन वातावरण स्वाभाविक रूप से आपके दैनिक निर्णयों में झलकता है।"
    },
    children: {
      supportive: "Creative confidence rises when you express ideas without self-doubt.",
      sensitive: "Allowing creative blockages to pass without frustration restores inspiration.",
      neutral: "Keeping romantic or personal expectations realistic creates lasting peace.",
      supportiveH: "आत्म-संदेह के बिना विचारों को व्यक्त करने से रचनात्मक आत्मविश्वास बढ़ता है।",
      sensitiveH: "रचनात्मक अवरोधों को बिना निराशा के गुजरने देने से प्रेरणा पुनः लौट आती है।",
      neutralH: "व्यक्तिगत अपेक्षाओं को वास्तविक रखना स्थायी शांति का निर्माण करता है।"
    },
    health: {
      supportive: "A clean body rhythm naturally yields a highly optimized state of mind.",
      sensitive: "Responding gently to early bodily fatigue signs avoids energy exhaustion.",
      neutral: "Approaching daily wellness choices without pressure supports steady health.",
      supportiveH: "शरीर की स्वच्छ लय स्वाभाविक रूप से मन की एक अत्यधिक अनुकूलित अवस्था प्रदान करती है।",
      sensitiveH: "शारीरिक थकान के शुरुआती संकेतों पर कोमलता से प्रतिक्रिया देने से ऊर्जा क्षय से बचाव होता है।",
      neutralH: "दबाव के बिना दैनिक स्वास्थ्य विकल्पों को अपनाना निरंतर स्वास्थ्य का समर्थन करता है।"
    },
    spouse: {
      supportive: "A serene trust in shared relationships makes daily interactions harmonious.",
      sensitive: "Letting go of small relational expectations keeps the atmosphere light.",
      neutral: "Approaching partnerships with maturity keeps emotional boundaries clear.",
      supportiveH: "साझा संबंधों में शांत विश्वास दैनिक अंतःक्रियाओं को सामंजस्यपूर्ण बनाता है।",
      sensitiveH: "छोटी-मोटी आपसी अपेक्षाओं को जाने देना वातावरण को हल्का बनाए रखता है।",
      neutralH: "परिपक्वता के साथ साझेदारी को अपनाना भावनात्मक सीमाओं को स्पष्ट रखता है।"
    },
    transformation: {
      supportive: "Deep psychological insight emerges when outer noise is reduced.",
      sensitive: "Accepting that timing adjustments are a natural part of growth reduces stress.",
      neutral: "Quiet contemplation helps process thoughts in a balanced, grounded way.",
      supportiveH: "बाहरी शोर कम होने पर गहरी मनोवैज्ञानिक समझ उभरती है।",
      sensitiveH: "यह स्वीकार करना कि समय का समायोजन विकास का एक स्वाभाविक हिस्सा है, तनाव कम करता है।",
      neutralH: "शांत चिंतन विचारों को संतुलित और जमीनी रूप सेसंशोधित करने में मदद करता है।"
    },
    wisdom: {
      supportive: "A deep, serene trust in timing brings quiet reassurance.",
      sensitive: "Accepting slow developments with patience keeps you focused.",
      neutral: "Wisdom flows naturally when you align daily choices with mature principles.",
      supportiveH: "समय चक्र पर गहरा, शांत विश्वास मन को आश्वस्त करता है।",
      sensitiveH: "धीमी प्रगति को धैर्य के साथ स्वीकार करना आपको केंद्रित रखता है।",
      neutralH: "जब आप दैनिक विकल्पों को परिपक्व सिद्धांतों के साथ संरेखित करते हैं, तो ज्ञान स्वतः प्रवाहित होता है।"
    },
    career: {
      supportive: "A calm confidence in your execution quality brings career peace.",
      sensitive: "Steering clear of office politics or reactive arguments keeps you grounded.",
      neutral: "Recognizing that steady execution precedes external recognition maintains focus.",
      supportiveH: "कार्य की गुणवत्ता में शांत आत्मविश्वास करियर में शांति लाता है।",
      sensitiveH: "कार्यालय की राजनीति या तीखे तर्कों से दूर रहना आपको जमीनी रूप से स्थिर रखता है।",
      neutralH: "यह समझना कि निरंतर कार्य बाहरी पहचान से पहले आता है, ध्यान बनाए रखता है।"
    },
    gains: {
      supportive: "A harmonious connection with close friends brings warm reassurance.",
      sensitive: "Staying detached from social circle gossip preserves your mental energy.",
      neutral: "A quiet network presence allows you to focus on immediate personal goals.",
      supportiveH: "करीबी दोस्तों के साथ सामंजस्यपूर्ण संबंध हार्दिक आश्वासन लाते हैं।",
      sensitiveH: "सामाजिक मंडल की गपशप से दूर रहना आपकी मानसिक ऊर्जा की रक्षा करता है।",
      neutralH: "एक शांत नेटवर्क उपस्थिति आपको तात्कालिक व्यक्तिगत लक्ष्यों पर ध्यान केंद्रित करने देती है।"
    },
    expenses: {
      supportive: "Deep rest in solitude restores your vital reserves and psychological balance.",
      sensitive: "Reminding yourself that quiet isolation is recovery, not loneliness, supports calm.",
      neutral: "A peaceful wind-down routine prepares the mind for deep recovery.",
      supportiveH: "एकांत में गहरा विश्राम आपकी जीवन शक्ति और मनोवैज्ञानिक संतुलन को बहाल करता है।",
      sensitiveH: "स्वयं को यह याद दिलाना कि शांत एकांत सुधार है, अकेलापन नहीं, मन को शांत रखता है।",
      neutralH: "एक शांतिपूर्ण शाम की दिनचर्या मन को गहरी रिकवरी के लिए तैयार करती है।"
    }
  };

  const practical = (practicalMap as any)[id] || practicalMap.self;
  const emotional = (emotionalMap as any)[id] || emotionalMap.self;

  return {
    transitReasoning,
    transitReasoningHindi,
    dashaInfluence,
    dashaInfluenceHindi,
    practicalInterpretation: strength === "supportive" ? practical.supportive : strength === "sensitive" ? practical.sensitive : practical.neutral,
    practicalInterpretationHindi: strength === "supportive" ? practical.supportiveH : strength === "sensitive" ? practical.sensitiveH : practical.neutralH,
    emotionalGuidance: strength === "supportive" ? emotional.supportive : strength === "sensitive" ? emotional.sensitive : emotional.neutral,
    emotionalGuidanceHindi: strength === "supportive" ? emotional.supportiveH : strength === "sensitive" ? emotional.sensitiveH : emotional.neutralH,
  };
}

function generateLifeDomainPredictions(
  chart: ChartData,
  transits: TransitData,
  dasha: DashaContext,
  mode: OutputMode
): LifeDomainCard[] {
  const lagnaSign = chart.lagna.sign;
  
  const domainsData = [
    { id: "self", icon: "👤", title: "Identity & Vitality", titleHindi: "प्रथम भाव (तनु भाव)", houseNum: 1 },
    { id: "wealth", icon: "💰", title: "Accumulated Wealth & Family", titleHindi: "द्वितीय भाव (धन भाव)", houseNum: 2 },
    { id: "siblings", icon: "💪", title: "Self-Efforts & Courage", titleHindi: "तृतीय भाव (सहज भाव)", houseNum: 3 },
    { id: "home", icon: "🏠", title: "Mother, Home & Peace", titleHindi: "चतुर्थ भाव (सुख भाव)", houseNum: 4 },
    { id: "children", icon: "🎓", title: "Creativity, Intellect & Romance", titleHindi: "पंचम भाव (पुत्र भाव)", houseNum: 5 },
    { id: "health", icon: "🛡️", title: "Physical Recovery & Service", titleHindi: "षष्ठ भाव (शत्रु/रोग भाव)", houseNum: 6 },
    { id: "spouse", icon: "🤝", title: "Partnerships & Marriage", titleHindi: "सप्तम भाव (जाया भाव)", houseNum: 7 },
    { id: "transformation", icon: "🌊", title: "Longevity & Unexpected Changes", titleHindi: "अष्टम भाव (आयु/मृत्यु भाव)", houseNum: 8 },
    { id: "wisdom", icon: "🪔", title: "Wisdom, Father & Fortune", titleHindi: "नवम भाव (धर्म/भाग्य भाव)", houseNum: 9 },
    { id: "career", icon: "💼", title: "Profession & Status", titleHindi: "दशम भाव (कर्म भाव)", houseNum: 10 },
    { id: "gains", icon: "📈", title: "Material Gains & Networks", titleHindi: "एकादश भाव (लाभ भाव)", houseNum: 11 },
    { id: "expenses", icon: "🌙", title: "Solitude & Expenditures", titleHindi: "द्वादश भाव (व्यय भाव)", houseNum: 12 },
  ];

  const planetWeights = {
    Saturn: 1.0,
    Rahu: 0.95,
    Jupiter: 0.9,
    Ketu: 0.85,
    Mars: 0.6,
    Venus: 0.5,
    Sun: 0.4,
    Moon: 0.2,
    Mercury: 0.4,
  };

  const mdPlanet = dasha.md.planet;
  const adPlanet = dasha.ad.planet;
  const pdPlanet = dasha.pd.planet;

  const houseDetails = domainsData.map((d) => {
    const houseSignNum = ((lagnaSign - 1 + (d.houseNum - 1)) % 12) + 1;
    const signName = getSignName(houseSignNum);
    const primaryPlanet = getSignRuler(signName);

    const transitsInHouse: string[] = [];
    transits.positions.forEach((p) => {
      const transitHouse = getHouseFromLagna(lagnaSign, p.longitude);
      if (transitHouse === d.houseNum) {
        transitsInHouse.push(p.name);
      }
    });

    let transitScore = 0;
    transitsInHouse.forEach((p) => {
      transitScore += ((planetWeights as any)[p] || 0.3);
    });

    let dashaScore = 0;
    if (primaryPlanet === mdPlanet) dashaScore += 1.0;
    if (primaryPlanet === adPlanet) dashaScore += 0.8;
    if (primaryPlanet === pdPlanet) dashaScore += 0.6;

    const totalActivation = transitScore + dashaScore;

    return {
      d,
      primaryPlanet,
      signName,
      transitsInHouse,
      totalActivation,
    };
  });

  const sortedDetails = [...houseDetails].sort((a, b) => b.totalActivation - a.totalActivation);
  const mostActiveIds = new Set();
  let activeCount = 0;
  for (const item of sortedDetails) {
    if (item.totalActivation >= 0.8 && activeCount < 2) {
      mostActiveIds.add(item.d.id);
      activeCount++;
    }
  }

  return houseDetails.map(({ d, primaryPlanet, signName, transitsInHouse }) => {
    const isMostActive = mostActiveIds.has(d.id);

    let strength: "supportive" | "sensitive" | "neutral" = "neutral";
    if (transitsInHouse.includes("Jupiter")) {
      strength = "supportive";
    } else if (transitsInHouse.includes("Saturn") || transitsInHouse.includes("Rahu") || transitsInHouse.includes("Ketu")) {
      strength = "sensitive";
    } else if (mdPlanet === primaryPlanet || adPlanet === primaryPlanet) {
      strength = "supportive";
    }

    const planetSignals = [
      `Lord: ${primaryPlanet}`,
      `House: ${signName}`,
      ...transitsInHouse.map((p) => `${p} Transit`),
    ];

    const activatedPatterns = getActivatedPatternsForDomain(d.id, strength, primaryPlanet, transitsInHouse);
    const caution = strength === "sensitive"
      ? getCautionForDomain(d.id, primaryPlanet, transitsInHouse, mode)
      : null;

    const narrative = buildDomainNarrativeBox(d.id, d.title, d.titleHindi, strength, primaryPlanet, transitsInHouse, dasha, mode);
    const statusLabels = getDomainStatusLabels(d.id, strength, primaryPlanet, transitsInHouse, dasha);

    let emphasisTag: "Most Active" | "Currently Influenced" | null = null;
    let emphasisTagHindi: "सर्वाधिक सक्रिय" | "वर्तमान में प्रभावित" | null = null;

    if (isMostActive) {
      emphasisTag = "Most Active";
      emphasisTagHindi = "सर्वाधिक सक्रिय";
    } else if (transitsInHouse.length > 0 || primaryPlanet === mdPlanet || primaryPlanet === adPlanet || primaryPlanet === pdPlanet) {
      emphasisTag = "Currently Influenced";
      emphasisTagHindi = "वर्तमान में प्रभावित";
    }

    let confidenceTone = "Stable Anchor";
    let confidenceToneHindi = "स्थिर आधार";

    if (emphasisTag === "Most Active") {
      if (strength === "sensitive") {
        confidenceTone = "Temporarily Sensitive";
        confidenceToneHindi = "अस्थायी संवेदनशील";
      } else {
        confidenceTone = "Strongly Activated";
        confidenceToneHindi = "सक्रिय प्रभाव";
      }
    } else if (emphasisTag === "Currently Influenced") {
      if (strength === "sensitive") {
        confidenceTone = "Mildly Influenced";
        confidenceToneHindi = "मंद प्रभाव";
      } else {
        confidenceTone = "Gradually Building";
        confidenceToneHindi = "क्रमशः निर्मित";
      }
    }

    let timingWindow = "Stable, long-term alignment.";
    let timingWindowHindi = "स्थिर और दीर्घकालिक प्रभाव।";

    if (transitsInHouse.includes("Moon")) {
      timingWindow = "Most noticeable over the next 24–48 hours.";
      timingWindowHindi = "अगले 24-48 घंटों के दौरान सबसे प्रभावी।";
    } else if (transitsInHouse.includes("Saturn") || transitsInHouse.includes("Rahu") || transitsInHouse.includes("Ketu")) {
      timingWindow = "Core theme over the next 30–45 days.";
      timingWindowHindi = "अगले 30-45 दिनों के दौरान मुख्य प्रभाव।";
    } else if (transitsInHouse.some((p) => ["Sun", "Mars", "Mercury", "Venus"].includes(p))) {
      timingWindow = "Active influence for the next 7–14 days.";
      timingWindowHindi = "अगले 7-14 दिनों तक सक्रिय प्रभाव।";
    }

    const whyThisMatters = buildWhyThisMatters(d.id, strength, primaryPlanet, transitsInHouse, dasha);

    return {
      id: d.id,
      icon: d.icon,
      title: d.title,
      titleHindi: d.titleHindi,
      narrative,
      planetSignals,
      activatedPatterns,
      caution,
      primaryPlanet,
      strength,
      statusLabel: statusLabels.label,
      statusLabelHindi: statusLabels.labelHindi,
      emphasisTag,
      emphasisTagHindi,
      confidenceTone,
      confidenceToneHindi,
      timingWindow,
      timingWindowHindi,
      whyThisMatters,
    };
  });
}
