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
      ? `${recipientName}, à¤…à¤­à¥€ à¤œà¥‹ à¤¸à¤®à¤¯ à¤šà¤² à¤°à¤¹à¤¾ à¤¹à¥ˆ, à¤µà¤¹ ${cfg.label.toLowerCase()} à¤®à¥‡à¤‚ à¤§à¥€à¤°à¥‡-à¤§à¥€à¤°à¥‡ à¤®à¤œà¤¬à¥‚à¤¤ à¤ªà¥à¤°à¤—à¤¤à¤¿ à¤¬à¤¨à¤¾à¤¨à¥‡ à¤µà¤¾à¤²à¤¾ à¤šà¤°à¤£ à¤¹à¥ˆà¥¤`
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
    if (isSupportive) return ["Self-expression is highly empowered by benign cosmic configurations.", "Vitality and mental resilience are peak; excellent for initiating self-discipline.", "A strong sense of personal identity aligns with your active goals."];
    if (isSensitive) return ["Transits suggest high restlessness and physical tiredness. Prioritize sleep.", "Avoid taking criticism personally or acting in haste under stress.", "Mind and body require recovery blocks to handle daily pressures."];
    return ["A stable and grounded period for regular self-discipline.", "Keep focus on daily health routines and moderate movement.", "Good window for steady personal projects."];
  }
  if (id === "wealth") {
    if (isSupportive) return ["Financial stability is expanding; good time for long-term investments.", "Accumulated assets show positive trends under wise governance.", "Speech is highly persuasive and helps in settling old matters."];
    if (isSensitive) return ["Volatile financial trends suggest avoiding all speculative risks.", "Keep dynamic control over expenditures and avoid impulse buying.", "Verify all cash outflows and document financial commitments."];
    return ["Consolidate existing finances and track inflow/outflow.", "Maintain a structured budget without making major modifications.", "Good time for quiet savings."];
  }
  if (id === "siblings") {
    if (isSupportive) return ["Courage and personal self-efforts bring swift, constructive rewards.", "Short journeys or professional writing tasks show highly supportive outcomes.", "Collaborative projects with close contacts get positive momentum."];
    if (isSensitive) return ["Avoid unnecessary verbal friction or defensive discussions with colleagues.", "Short journeys might be slow or require dynamic rescheduling.", "Mindful communication is key to avoiding hasty responses."];
    return ["Maintain a calm and practical tone in daily discussions.", "Focus on executing daily self-efforts rather than waiting for help.", "Use structured communication."];
  }
  if (id === "home") {
    if (isSupportive) return ["Internal peace and domestic harmony are beautifully supported.", "Excellent period for improving home environment and family bonds.", "Mother's health is supportive; emotional stability is peak."];
    if (isSensitive) return ["Domestic atmosphere might feel slightly tense or demanding.", "Take deep care of mother's health and family stability.", "Emotional grounding is vital; practice daily mindfulness."];
    return ["Keep your domestic routine quiet and low-noise.", "Take steady decisions regarding real estate or home organization.", "Focus on home comfort."];
  }
  if (id === "children") {
    if (isSupportive) return ["Creative expression and academic growth are highly favored.", "Speculative intellect is sharp; excellent for strategic plans.", "Heartfelt romantic connections bring warmth and peace."];
    if (isSensitive) return ["Speculative risks must be completely avoided under active volatility.", "Patience is required with children or creative roadblocks.", "Channel emotional excitement into structured learning or hobby."];
    return ["Maintain a steady academic or creative routine.", "Keep romantic bonds realistic and mature.", "Practice calm, plan-based speculation if any."];
  }
  if (id === "health") {
    if (isSupportive) return ["Physical recovery systems are highly efficient and active.", "Obstacles are cleared smoothly through regular daily service.", "Excellent time to resolve long-pending health routine challenges."];
    if (isSensitive) return ["Physical digestion and sleep cycle require strict scheduling.", "Avoid overtraining or pushing through bodily exhaustion signals.", "Nervous-system downshift is necessary; limit evening screen noise."];
    return ["Keep meal timings regular and water intake adequate.", "Maintain a moderate but consistent exercise plan.", "Resolve daily chores calmly."];
  }
  if (id === "spouse") {
    if (isSupportive) return ["Partnerships and public agreements are in an expanding phase.", "Excellent alignment for resolving long-standing marital friction.", "Collaborative energy is high; shared goals feel natural."];
    if (isSensitive) return ["Expect high sensitivities in partnerships; speak slowly and gently.", "Avoid passive assumptions or postponing essential clarifications.", "Patience is the primary anchor to keep relational harmony."];
    return ["Maintain open, clear communication with your spouse/partners.", "Keep relationship expectations mature and balanced.", "Review contracts carefully."];
  }
  if (id === "transformation") {
    if (isSupportive) return ["Deep research, analytical work, and occult pursuits are highly favored.", "Sudden gains or resolving complex inheritances show positive trends.", "Transformative psychological clarity emerges from quiet contemplation."];
    if (isSensitive) return ["Unexpected shifts or slow-downs require a calm, detached mind.", "Avoid high-risk physical activities or rushing under stress.", "Focus on inner healing and let go of obsessive control patterns."];
    return ["Maintain deep focus on research and self-understanding.", "Keep a low profile regarding joint finances or tax files.", "A quiet time for contemplation."];
  }
  if (id === "wisdom") {
    if (isSupportive) return ["Wisdom, philosophical learning, and general fortune are peak.", "Father or mentors provide deep, timely guidance.", "Spiritual inclination is strong, bringing mental grounding."];
    if (isSensitive) return ["Philosophical doubts or delays in higher studies require patience.", "Be respectful and patient in discussions with mentors or father.", "Focus on applying wisdom to daily challenges rather than chasing ideals."];
    return ["Maintain a daily spiritual or reading routine.", "Reflect on long-term philosophy without rushing into shifts.", "A balanced time for guidance."];
  }
  if (id === "career") {
    if (isSupportive) return ["Professional authority, career growth, and recognition are supported.", "Excellent phase for taking leadership responsibility and executing.", "A highly productive window for professional visibility."];
    if (isSensitive) return ["Saturn/Rahu transits demand steady execution over rapid shifts.", "Avoid reactive arguments with seniors or authority figures.", "High workloads require systematic delegation and schedule discipline."];
    return ["Focus on completing existing projects with high quality.", "Keep professional progress documented and transparent.", "Execute daily responsibilities."];
  }
  if (id === "gains") {
    if (isSupportive) return ["Material gains, salary enhancements, and network support are high.", "Elder siblings or close friends provide valuable opportunities.", "Social circles compound positively, bringing key contacts."];
    if (isSensitive) return ["Delays in financial gains or returns require patient follow-up.", "Avoid speculative cash plays within social networks or associations.", "Verify network reliability before entering collaborative projects."];
    return ["Maintain healthy, stable networks without overcommitting.", "Track all dynamic streams of income with structure.", "Consolidate existing gains."];
  }
  // expenses
  if (isSupportive) return ["Spiritual isolation, meditation, and quiet times are peak.", "Sleep quality is deep, helping in complete cognitive recovery.", "Intelligent, planned expenditures for spiritual or family growth."];
  if (isSensitive) return ["Sleep disturbances or late-night overthinking can reduce vitality.", "Unplanned leakage of funds requires strict expenditure checks.", "Practice deep grounding and screen-free routines before bedtime."];
  return ["Maintain a balanced bedtime schedule and avoid late-night caffeine.", "Track small outflows of money systematically.", "A quiet period for self-reflection."];
}

function getCautionForDomain(
  id: string,
  primaryPlanet: string,
  transits: string[],
  mode: OutputMode
): string {
  const isPandit = mode === "PANDIT";

  if (isPandit) {
    if (id === "self") return "जल्दबाजी और क्रोध से बचें। शारीरिक थकान होने पर पर्याप्त विश्राम लें और अपनी वाणी को नम्र रखें।";
    if (id === "wealth") return "बिना सोचे-समझे किसी नए निवेश या बड़े खर्च से पूरी तरह बचें। उधार देने से आज परहेज करें।";
    if (id === "siblings") return "सहकर्मियों या करीबियों के साथ बातचीत में तंज या कड़वाहट से बचें। यात्रा में सावधानी रखें।";
    if (id === "home") return "पारिवारिक मामलों में बहस को तूल न दें। माता के स्वास्थ्य और मानसिक शांति का विशेष ध्यान रखें।";
    if (id === "children") return "शेयर बाजार या किसी भी शॉर्टकट वाले निवेश में पैसा लगाने से बिल्कुल बचें। धैर्य बनाए रखें।";
    if (id === "health") return "देर रात तक जागने और अनियमित खान-पान से बचें। पेट और गैस से जुड़ी समस्या परेशान कर सकती है।";
    if (id === "spouse") return "जीवनसाथी के साथ बातचीत में गुस्सा न करें। किसी भी गलतफहमी को शांत रहकर तुरंत बातचीत से दूर करें।";
    if (id === "transformation") return "वाहन चलाते समय सावधानी रखें। पुरानी नकारात्मक बातों को सोचकर खुद को मानसिक रूप से परेशान न करें।";
    if (id === "wisdom") return "गुरु या पिता के साथ वैचारिक मतभेद होने पर मौन रहें। भाग्य के भरोसे बैठकर काम टालने से बचें।";
    if (id === "career") return "कार्यक्षेत्र में अचानक अपनी नौकरी या काम बदलने का निर्णय न लें। उच्च अधिकारियों के साथ संयम रखें।";
    if (id === "gains") return "किसी मित्र के कहने पर उधार देने या बड़ी डीलिंग में शामिल होने से बचें। अपने पैसे को सुरक्षित रखें।";
    return "अनावश्यक खर्चों पर तुरंत रोक लगाएं। सोने से पहले स्क्रीन से दूर रहें ताकि नींद प्रभावित न हो।";
  }

  if (id === "self") return "Avoid hasty decisions and physical overexertion. Ensure you get adequate rest and remain humble in communication.";
  if (id === "wealth") return "Refrain from speculative investments or major unplanned purchases. Keep a firm boundary regarding lending cash.";
  if (id === "siblings") return "Avoid defensive or passive-aggressive communication with peers. Reschedule non-urgent journeys if needed.";
  if (id === "home") return "Do not escalate household arguments. Prioritize mother's wellness and maintain a calm living atmosphere.";
  if (id === "children") return "Completely avoid high-risk speculative plays. Practice active patience under creative blockages.";
  if (id === "health") return "Avoid irregular meal times and late-night screen scrolling. Listen to early bodily signals of fatigue.";
  if (id === "spouse") return "Avoid hasty reactions in primary relationships. Clear up assumptions early with calm, mutual dialogue.";
  if (id === "transformation") return "Exercise care during journeys and physical movement. Avoid ruminating on past emotional patterns.";
  if (id === "wisdom") return "Remain patient and respectful when dealing with mentors or senior advice. Do not procrastinate expecting luck.";
  if (id === "career") return "Avoid reactive career shifts or sudden verbal arguments at your workplace. Focus on system compliance.";
  if (id === "gains") return "Refrain from overcommitting cash inside social circles or unverified ventures. Protect your capital.";
  return "Control unnecessary budget leakage. Establish a strict screen-free routine before sleep to combat fatigue.";
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
      if (strength === "supportive") return `Beta, abhi tumhari dasha mein ${md} aur ${ad} ka achha prabhav chal raha hai, aur tumhare lagna swami ${primaryPlanet} ki sthiti kaafi anukul hai. Tumhare vyaktitva aur physical energy mein ek naya nikhara aayega. Apne confidence ko sahi disha mein lagao, naye routines shuru karo aur khud par poora vishwas rakho. Sab achha chal raha hai.`;
      if (strength === "sensitive") return `Beta, lagnesh ${primaryPlanet} aur gochar mein chal rahe sensitive planets ke karan body thoda heavy aur fatigue feel kar sakti hai. Is samay tumhare dasha chakra mein ${ad}/${pd} ka chalna bata raha hai ki tumhare mind par stress jaldi asar karega. Khud ko push mat karo, thoda rest aur recovery zaroori hai. Chinta bilkul mat karna, bas disciplined raho.`;
      return `Beta, lagnesh ${primaryPlanet} abhi normal sthiti mein hain. Tumhari dasha ${md}/${ad} ke chalte ek behad stable aur quiet period chal raha hai. Nayi planning aur self-discipline ke liye yeh behtareen samay hai. Apne daily routine ko simple aur organized rakho, dheere-dheere tarakki milegi.`;
    }
    if (id === "wealth") {
      if (strength === "supportive") return `Beta, tumhare dhana bhav ke swami ${primaryPlanet} hain aur abhi dasha mein ${ad} ki shakti mil rahi hai, jisse tumhari financial position behtar hone ke poore sanket hain. Purane ruke hue paise milne ki sambhavna hai. Apne budget par dhayan do aur disciplined savings shuru karo, yeh samay future secure karne ke liye bahut shubh hai.`;
      if (strength === "sensitive") return `Beta, abhi gochar mein sensitive planets tumhare dhana bhav ko prabhavit kar rahe hain, aur active dasha ${md}/${pd} ke chalte paise ke mamle mein volatility dikh rahi hai. Koi bhi bada investment ya speculative risk is samay bilkul mat lena. Apne kharchon ko tight rakho, bina planning ke impulse spending se bachna zaroori hai.`;
      return `Beta, tumhare dhana swami ${primaryPlanet} abhi stable hain. Tumhari dasha ke chalte paise ke inflow aur outflow mein ek balance bana rahega. Naya speculative risk lene ki jagah purani strategy par hi tike raho. Budgeting aur tracking clean rakhna, Laxmi ji ki kripa bani rahegi.`;
    }
    if (id === "siblings") {
      if (strength === "supportive") return `Beta, tumhari dasha mein ${ad} ka prabhav aur tritiya swami ${primaryPlanet} ka gochar tumhare andar ek naya sahas aur self-effort jagane wala hai. Tum jo bhi mehnat karoge, uska turant fal milega. Writing, communication aur siblings ke sath rishton mein anukulata rahegi. Apne idea ko bina darr ke aage badhao.`;
      if (strength === "sensitive") return `Beta, tritiya swami ${primaryPlanet} par sensitive transits ke karan is samay tumhari self-efforts mein thodi rukavat ya fatigue ho sakta hai. Tumhari active dasha ${md}/${pd} ke chalte colleagues ya close circles ke sath minor argument hone ki ashanka hai. Apni tone ko bilkul soft rakhna, reactive hone se bachna behtar rahega.`;
      return `Beta, tumhare sahas bhav ke swami ${primaryPlanet} abhi normal sthiti mein chal rahe hain. Mehnat aur consistency hi tumhara sabse bada weapon hai is samay. Daily tasks ko structured tareeqe se poora karo, kisi bade sudden change ki umeed kiye bina quietly kaam karte raho.`;
    }
    if (id === "home") {
      if (strength === "supportive") return `Beta, chaturtha swami ${primaryPlanet} aur gochar ke shubh asar se ghar ka vatavaran behad shant aur supportive banega. Tumhari dasha mein ${ad} tumhare internal peace aur emotional stability ko badha rahi hai. Ghar ke renovation ya vehicle se juda koi kaam shubh fal dega. Mata ji ka aashirwad tumhare sath hai.`;
      if (strength === "sensitive") return `Beta, tumhare chaturtha bhav par abhi sensitive planets ka pressure hai, jisse ghar mein thodi anban ya stress feel ho sakta hai. Tumhari dasha ${md}/${pd} ke chalte mata ji ki health ka dhayan rakhna zaroori hai. Jab bhi stress lage, ghar se thoda break lo aur emotional calm banaye rakho. Hanuman Chalisa ka paath karo, shanti milegi.`;
      return `Beta, tumhare chaturtha bhav ke swami ${primaryPlanet} abhi stable hain. Domestic life aur emotional peace bilkul normal rahegi. Apne home routine ko clean rakho aur emotional boundaries banaye rakho. Purane ghar ke pending kaamo ko quietly quietly nipatane ke liye behad anukul samay hai.`;
    }
    if (id === "children") {
      if (strength === "supportive") return `Beta, pancham swami ${primaryPlanet} aur dasha swami ${ad} ki kripa se tumhari buddhi aur creativity bilkul shikhara par hain. Agar tum padhai ya naye creative project mein ho, toh bada breakthrough milega. Relationships mein warmth rahegi aur intellect sahi decisions lene mein madad karega. Bhole Baba ka dhyan karo.`;
      if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} aur sensitive transit ke chalte pancham bhav par thoda pressure hai. Speculative market ya shares mein is samay galti se bhi paisa mat lagana, nuksan ho sakta hai. Creative projects mein temporary block feel ho toh pareshan mat hona, thoda ruk kar kaam shuru karna.`;
      return `Beta, pancham swami ${primaryPlanet} abhi stable phase mein hain. Education, creative learning aur romance ke mamle mein ek normal, consistent flow rahega. Mind ko clear rakhna aur daily study ya learning routine par focus banaye rakhna fayde mein rahega.`;
    }
    if (id === "health") {
      if (strength === "supportive") return `Beta, shastha swami ${primaryPlanet} aur dasha ki sthiti anukul hone se physical recovery bahut tez rahegi. Agar koi purani health issue thi, toh usme bada sudhaar dikhega. Tumhare shatru aur obstacles quietly khatam honge. Daily exercise aur wholesome routine banaye rakhna, body support karegi.`;
      if (strength === "sensitive") return `Beta, abhi gochar mein sensitive planets shastha bhav ko prabhavit kar rahe hain, jisse digestion, sleep aur overall energy down feel ho sakti hai. active dasha ${md}/${pd} ke chalte excessive workload se body par pressure badhega. Apne sleeping pattern aur water intake ko bilkul lock kar lo.`;
      return `Beta, shastha bhav ke swami ${primaryPlanet} abhi normal sthiti mein chal rahe hain. Health bilkul normal rahegi, bas routine mein consistency rakhna zaroori hai. Puraney schedule ko disciplined rakho aur body ke indicators ko quietly suno aur adjust karo.`;
    }
    if (id === "spouse") {
      if (strength === "supportive") return `Beta, saptam swami ${primaryPlanet} ki anukulata aur active dasha ${ad} ke shubh prabhav se partnerships aur marital life mein prem aur samanjasya badhega. Agar business mein koi naya partner jud raha hai, toh fayda hoga. Rishton mein badhaai aur clear, loving conversation ka daur rahega. Sukhi raho.`;
      if (strength === "sensitive") return `Beta, saptam swami ${primaryPlanet} par sensitive transits aur active dasha ${md}/${pd} ke prabhav ke karan rishton mein temporary miscommunication ya tension dikh rahi hai. Partner ki baat ko poore dhairya se suno, impulsive hokar koi reaction mat dena. Doosron ke behkave mein aakar rishta kharab mat karna.`;
      return `Beta, saptam bhav ke swami ${primaryPlanet} abhi stable hain. Personal aur professional partnerships bilkul normal chalenge. Ek-doosre ki expectations ko respect karo, communication open rakho aur quietly daily responsibilities ko milkat poora karo.`;
    }
    if (id === "transformation") {
      if (strength === "supportive") return `Beta, ashtam swami ${primaryPlanet} aur active dasha ${ad} ke shubh asar se research, occult science, aur deep psychology mein tumhara interest badhega. Unplanned resources ya inheritance se koi good news mil sakti hai. Apne inner thoughts ko purify karne aur deep learning ke liye bahut shubh samay hai.`;
      if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} aur ashtam bhav par sensitive transits ke chalte life mein temporary delays ya sudden changes feel ho sakte hain. Is pressure zone mein bilkul mat ghabrana, yeh tumhare badlav ka samay hai. Driving karte samay carefully raho aur extreme physical activity se parhez karo.`;
      return `Beta, ashtam swami ${primaryPlanet} abhi stable phase mein hain. Deep research aur tax/insurance se jude pending kaam bina kisi rukavat ke quietly pure ho jayenge. Apne routine ko calm rakho aur positive self-reflection par focus karo.`;
    }
    if (id === "wisdom") {
      if (strength === "supportive") return `Beta, navam swami ${primaryPlanet} ki shubh sthiti aur active dasha ${ad} tumhare bhagya ko mazboot kar rahi hai. Mentors, mentors aur father ka poora support milega. Spiritual journey ya higher education ke liye behad anukul samay hai. Tumhari kismat har sahi nirnay mein tumhara sath degi.`;
      if (strength === "sensitive") return `Beta, navam swami ${primaryPlanet} par active transits ke karan bhagya thoda slow chal sakta hai, aur kaam banne mein aakhiri waqt par thode delays ho sakte hain. Tumhari dasha ${md}/${pd} ke chalte father ki health ka dhayan rakhna zaroori hai. Karm karte raho, kismat ka umeed lene se bachna behtar hoga.`;
      return `Beta, navam swami ${primaryPlanet} abhi stable sthiti mein hain. Spiritual inclination aur higher wisdom normal bani rahegi. Father aur seniors ke sath respect banaye rakhein, aur daily spiritual practices ya books padhne mein thoda samay bitayein.`;
    }
    if (id === "career") {
      if (strength === "supportive") return `Beta, tumhare dasham bhav ke swami ${primaryPlanet} hain aur abhi dasha mein ${ad} की शक्ति मिल रही है, जिससे तुम्हारी professional recognition और authority बढ़ने के संकेत हैं। नए roles और leadership opportunities मिलने की पूरी सम्भावना है। अपने projects को confidence और systematic planning के साथ execute करो।`;
      if (strength === "sensitive") return `Beta, abhi dasham bhav par sensitive planets ka pressure hai, aur active dasha ${md}/${pd} ke chalte workplace par responsibilities aur pressure kafi jyada rahega. Apne seniors ke sath koi bhi ego conflict ya hasty debate se bilkul bachna. Apne kaam ko methodical aur calm hokar karte raho, sab thik hoga.`;
      return `Beta, dasham swami ${primaryPlanet} abhi stable hain. Tumhari career path par ek quiet building aur consistency ka phase chal raha hai. Kisi bade sudden decision ki jagah daily execution quality ko improve karne par focus karo. Mehnat ka fal zaroor milega.`;
    }
    if (id === "gains") {
      if (strength === "supportive") return `Beta, ekadash swami ${primaryPlanet} aur dasha ki anukulata tumhari income streams aur social networks ko expand karne wali hai. Elder siblings aur network circles se important benefits milenge. Tumhare long-term goals quietly materialize hone shuru honge. Laxmi ji ki kripa rahegi.`;
      if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} aur ekadash bhav par active transits ke chalte payments ya benefits aane mein temporary delays ho sakte hain. Social circles mein kisi ke sath financial deal ya loan dene se bachna. Apne cash allocations ko conservative rakhna, patience zaroori hai.`;
      return `Beta, ekadash swami ${primaryPlanet} abhi stable chal rahe hain. Income aur network stability bani rahegi. Nayi relationships build karne ke sath purane connections ko solid banaye rakhein. Apne budget and allocations ko stable tareeqe se manage karein.`;
    }
    // expenses
    if (strength === "supportive") return `Beta, dvadash swami ${primaryPlanet} aur active dasha ${ad} ke shubh asar se meditation, spiritual retreats aur deep sleep ka shubh yog hai. Expenditures dharmik ya long-term systems build karne mein honge. Solitude ka anand lo, khud ko internally discover karne ke liye anukul samay hai.`;
    if (strength === "sensitive") return `Beta, active dasha ${md}/${pd} aur sensitive transits ke karan late-night overthinking aur sleep disturbances ho sakti hain. Unplanned ya useless expenditures hone ki ashanka hai, jisse budget hil sakta hai. Sone se pehle mind ko shant rakho, screen se door raho aur budget control tight rakho.`;
    return `Beta, dvadash swami ${primaryPlanet} abhi stable hain. Solitude, spiritual practices aur expenditures bilkul normal flow mein rahenge. Screen time limit karke clean bed-time routine follow karein. Expenditures ko quietly track karte rahein.`;
  } else {
    if (id === "self") {
      if (strength === "supportive") return `My dear, you are currently experiencing a highly supportive planetary phase under the active cycles of ${md} and ${ad}. The planetary alignment for your physical ascendant, governed by ${primaryPlanet}, is exceptionally strong. This will bring a beautiful boost to your physical vitality and personal confidence. It is a wonderful time to initiate healthy personal habits and execute goals with self-assurance. Trust in your capabilities.`;
      if (strength === "sensitive") return `My dear, the governing ruler of your physical ascendant, ${primaryPlanet}, is currently receiving sensitive planetary transits. The current sub-cycles of ${ad} and ${pd} suggest that stress or heavy workloads can easily manifest as physical exhaustion. Do not push your boundaries too hard right now; structured rest and conscious recovery are absolutely essential. Proceed calmly and maintain a gentle daily routine.`;
      return `My dear, the governing ruler of your physical ascendant, ${primaryPlanet}, is in a balanced position. Under the current cycles of ${md} and ${ad}, you are entering a highly stable, introspective period. This is an ideal window to calmly organize your daily life, build mental discipline, and lay low-noise foundations for your personal projects. Focus on quiet daily execution.`;
    }
    if (id === "wealth") {
      if (strength === "supportive") return `My dear, the planetary ruler of your accumulated wealth, ${primaryPlanet}, is highly favored under the current active cycle of ${ad}. This indicates a highly constructive phase for financial enhancement and structural savings. Rusted resources or long-pending receivables may finally materialize. Focus on systematic long-term financial planning and secure your resources.`;
      if (strength === "sensitive") return `My dear, sensitive transits are currently passing through your financial sector, which, combined with the active cycle of ${md}/${pd}, brings financial volatility. It is highly advised to completely avoid speculative markets or high-risk investments during this window. Keep a tight control over your expenditures and avoid all emotionally driven purchases.`;
      return `My dear, the ruler of your accumulated wealth, ${primaryPlanet}, is in a stable position. Your financial inflow and outflow are set to maintain a balanced, predictable rhythm. Avoid making major adjustments or taking speculative risks. Keep your budget documented and your focus on steady capital preservation.`;
    }
    if (id === "siblings") {
      if (strength === "supportive") return `My dear, your active planetary cycles of ${ad} and the positive position of ${primaryPlanet} are igniting a strong wave of courage and personal self-efforts. Any methodical effort you invest in your goals right now will bear positive fruits. Writing, communication, and sibling dynamics will be highly constructive. Express your ideas with confidence.`;
      if (strength === "sensitive") return `My dear, the ruler of your personal effort sector, ${primaryPlanet}, is under sensitive transit pressure. The active cycle of ${md}/${pd} suggests minor delays or sudden exhaustion in daily communication. Avoid defensive arguments or hasty responses with peers and close contacts. Maintain a soft, professional, and patient tone in all interactions.`;
      return `My dear, the ruler of your self-effort sector, ${primaryPlanet}, is in a balanced position. Consistency and structured planning are your best tools right now. Continue executing your daily tasks calmly without expecting sudden external changes. Steady efforts will build a strong foundation.`;
    }
    if (id === "home") {
      if (strength === "supportive") return `My dear, the planetary ruler of your domestic life, ${primaryPlanet}, is in a highly supportive configuration, bringing calm and peace to your household. Your active cycle of ${ad} supports deep emotional stability and a nurturing home environment. Family relationships are set to improve significantly. Focus on domestic comfort and emotional grounding.`;
      if (strength === "sensitive") return `My dear, your domestic sector is currently receiving pressure from sensitive transits, which may cause minor household friction or emotional restlessness. Under the active cycle of ${md}/${pd}, it is important to pay close attention to your mother's wellness and maintain a calm living space. Cultivate peace through patient listening.`;
      return `My dear, the ruler of your domestic sector, ${primaryPlanet}, is in a stable state. Household matters and emotional peace will maintain a balanced, ordinary flow. Keep your home routine simple, avoid major real estate decisions, and focus on maintaining low-noise personal boundaries.`;
    }
    if (id === "children") {
      if (strength === "supportive") return `My dear, the active planetary cycle of ${ad} and the strong position of ${primaryPlanet} are highly expanding your intellect and creative faculties. If you are involved in structured learning, academic pursuits, or creative planning, you will experience highly positive breakthroughs. Romantic connections and creative expressions are deeply favored.`;
      if (strength === "sensitive") return `My dear, the active planetary sub-cycles of ${md}/${pd} and sensitive transits are placing minor pressure on your creative and speculative sector. It is highly critical to avoid all speculative investments, share market risks, or hasty financial moves. Remain patient if you encounter temporary creative blockages; focus on structured study.`;
      return `My dear, the ruler of your creative sector, ${primaryPlanet}, is in a balanced configuration. Your academic pursuits, romantic connections, and creative projects will move forward in a steady, predictable flow. Keep your daily learning structured and your intellectual goals highly realistic.`;
    }
    if (id === "health") {
      if (strength === "supportive") return `My dear, the planetary ruler of your health and recovery sector, ${primaryPlanet}, is exceptionally well-placed, ensuring a highly active phase for bodily healing and vitality. Ongoing health struggles will show significant improvement. Keep up with your positive lifestyle habits, as your body is in an excellent position to compound fitness gains.`;
      if (strength === "sensitive") return `My dear, sensitive transits are currently impacting your health sector. The active cycle of ${md}/${pd} suggests that high daily stress or workplace workloads could compromise your digestive and sleep patterns. Establish a firm daily routine, limit screen time, and prioritize wholesome nourishment.`;
      return `My dear, the ruler of your health sector, ${primaryPlanet}, is in a balanced state. Your physical wellness will maintain a stable path as long as you follow a structured routine. Avoid sudden changes in your diet or exercise habits, and listen calmly to your body's recovery signals.`;
    }
    if (id === "spouse") {
      if (strength === "supportive") return `My dear, the ruler of your relationship sector, ${primaryPlanet}, is well-placed, and the active cycle of ${ad} is bringing deep harmony and mutual understanding to your marital life and partnerships. If you are entering professional contracts or business alliances, they will prove highly beneficial. Engage in open, loving communication.`;
      if (strength === "sensitive") return `My dear, the ruler of your partnership sector, ${primaryPlanet}, is receiving sensitive transits. Under the active sub-cycles of ${md}/${pd}, temporary miscommunications or subtle friction could arise with partners. Listen patiently, avoid making reactive assumptions, and communicate with gentle clarity.`;
      return `My dear, the planetary ruler of your relationships, ${primaryPlanet}, is in a stable position. Your personal and professional partnerships will proceed in a steady, ordinary flow. Respect each other's boundaries, maintain open channels of dialogue, and handle shared duties with maturity.`;
    }
    if (id === "transformation") {
      if (strength === "supportive") return `My dear, the planetary ruler of your transformative sector, ${primaryPlanet}, is highly favored under the cycle of ${ad}, facilitating deep analytical research and spiritual contemplation. You may receive constructive updates regarding joint assets or estate inheritances. This is a highly shubh window for deep psychological healing.`;
      if (strength === "sensitive") return `My dear, the active cycle of ${md}/${pd} and sensitive transits in your transformative sector might trigger temporary delays or unexpected adjustments. Do not feel anxious under these shifts, as they are designed to build deep internal resilience. Exercise caution during travel and avoid high-risk physical activities.`;
      return `My dear, the ruler of your transformative sector, ${primaryPlanet}, is in a stable state. Deep analytical tasks, tax filings, or insurance-related documentation will proceed quietly without major bottlenecks. Keep your daily routine calm and focus on structured, positive contemplation.`;
    }
    if (id === "wisdom") {
      if (strength === "supportive") return `My dear, the ruler of your wisdom sector, ${primaryPlanet}, is highly active, bringing a strong phase of positive fortune and spiritual alignment. Mentors, teachers, and senior figures will extend valuable guidance. It is an exceptionally supportive period for pursuing higher education or deeper philosophical studies.`;
      if (strength === "sensitive") return `My dear, the ruler of your wisdom sector, ${primaryPlanet}, is under sensitive transit pressure, which might trigger minor delays in higher plans or general luck. Under the cycle of ${md}/${pd}, ensure you maintain a highly respectful and patient tone with mentors and father figures. Focus on methodical, practical execution.`;
      return `My dear, the ruler of your wisdom sector, ${primaryPlanet}, is in a balanced position. Your philosophical interests and spiritual practices will maintain a steady, comforting flow. Spend time in structured reading, avoid rushing into major structural shifts, and appreciate quiet guidance.`;
    }
    if (id === "career") {
      if (strength === "supportive") return `My dear, the ruler of your professional sector, ${primaryPlanet}, is exceptionally strong, and the active cycle of ${ad} is opening doors for career recognition and professional authority. Opportunities for leadership or advanced roles will manifest naturally. Execute your responsibilities with serene confidence and systematic planning.`;
      if (strength === "sensitive") return `My dear, your career sector is under sensitive transit pressure. The active sub-cycles of ${md}/${pd} suggest elevated professional workload and accountability. Avoid hasty debates or ego conflicts with workplace seniors. Focus entirely on methodical execution, and maintain structured communication.`;
      return `My dear, the ruler of your career sector, ${primaryPlanet}, is in a balanced configuration. Your professional path is undergoing a quiet building phase. Avoid taking sudden, reactive career leaps; instead, focus on improving the quality of your daily execution. Consistent efforts will yield durable rewards.`;
    }
    if (id === "gains") {
      if (strength === "supportive") return `My dear, the ruler of your financial gains sector, ${primaryPlanet}, is highly favored, and the active cycle of ${ad} is facilitating positive growth in your revenues and professional network. Valuable opportunities will emerge from senior associates. Your long-term goals will quietly begin to materialize.`;
      if (strength === "sensitive") return `My dear, the active cycle of ${md}/${pd} and sensitive transits in your sector of gains might trigger temporary delays in revenues or professional payouts. Refrain from lending money or committing capital inside unverified network circles. Keep your cash allocations highly conservative.`;
      return `My dear, the ruler of your gains sector, ${primaryPlanet}, is in a stable state. Your income flows and network relationships will maintain a balanced, predictable rhythm. Focus on strengthening your existing connections, and manage your budget with systematic tracking.`;
    }
    // expenses
    if (strength === "supportive") return `My dear, the ruler of your expenditures, ${primaryPlanet}, is well-placed under the cycle of ${ad}, supporting deep mental recovery, meditation, and quiet isolation. Any financial expenses incurred will be highly planned and directed toward long-term growth. Embrace quiet solitude and build inner spiritual power.`;
    if (strength === "sensitive") return `My dear, under the active cycle of ${md}/${pd} and sensitive transits, late-night overthinking or screen habits could disrupt your sleep quality. There is also a temporary risk of budget leakage or unplanned expenditures. Maintain a disciplined budget, and cultivate a quiet, screen-free routine before bedtime.`;
    return `My dear, the ruler of your expenditures, ${primaryPlanet}, is in a stable configuration. Your personal expenditures, solitude, and sleep quality will maintain a regular flow. Ensure you limit evening screen time, track all cash outflows systematically, and practice daily self-reflection.`;
  }
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

  return domainsData.map((d) => {
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

    let strength: "supportive" | "sensitive" | "neutral" = "neutral";
    if (transitsInHouse.includes("Jupiter")) {
      strength = "supportive";
    } else if (transitsInHouse.includes("Saturn") || transitsInHouse.includes("Rahu")) {
      strength = "sensitive";
    } else if (dasha.md.planet === primaryPlanet || dasha.ad.planet === primaryPlanet) {
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
    };
  });
}
