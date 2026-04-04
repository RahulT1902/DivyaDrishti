import { 
  ReportSection, 
  KundaliReport, 
  CompositeStrength, 
  DecisionSignal, 
  ImpactWeight,
  DeepInsight,
  Phase,
  Intent,
  Timeframe
} from "./types";
import { generateNarrative } from "./narrativeEngine";

/**
 * Report Engine v3.0: Deep Intelligence Reports
 * Implements high-fidelity, structured astrological narratives.
 */

export function generateKundaliReport(chart: any, temporal: any, timeframe: string = "today"): KundaliReport {
  const lagna = getSignName(chart.lagna.sign);
  const moon = chart.planets.find((p: any) => p.name === "Moon");
  const rashi = getSignName(moon.sign);

  // 1. Resolve Global Decision State (Hero Tier)
  let hero;
  try {
    hero = generateHeroInsight(chart, temporal, timeframe);
  } catch (e) {
    console.error("FAILED to generate hero insight:", e);
    hero = {
      decisionState: "OBSERVE" as DecisionSignal,
      insight: "The celestial signals are currently resolving. Maintain steady observation.",
      timeAnchor: "Current Window",
      why: "Signal resolution in progress."
    };
  }

  // 2. Nature: Core & Inner
  const coreNature = getAscendantNature(lagna);
  const innerNature = {
    insight: "Your inner emotional landscape is driven by a deep need for stability.",
    meaning: "Reliable but resistant to sudden shifts in the emotional field.",
    guidance: ["Lean into your natural reliability"],
    weight: "foundation" as ImpactWeight,
    why: getTimeframeAwareWhy("lunar stability", timeframe)
  };

  // 3. Life Areas (Active Guidance Layer)
  const lifeAreas = {
    career: getCareerGuidance(chart, temporal, timeframe),
    finance: getFinanceGuidance(chart, temporal, timeframe),
    relationships: getRelationshipGuidance(chart, temporal, timeframe),
    health: getHealthGuidance(chart, temporal, timeframe),
    mind: getMindGuidance(chart, temporal, timeframe)
  };

  const observations = getReframedObservations(chart);
  const yogas = getSimplifiedYogas(chart);

  return {
    hero,
    blueprint: {
      lagna,
      rashi,
      nakshatra: "Purvashadha", 
      dashaAtBirth: `${temporal.current.mahadasha} (Seed phase)`
    },
    nature: {
      core: coreNature,
      inner: innerNature
    },
    lifeAreas,
    observations,
    transits: {
      insight: "Structural review of long-term responsibilities.",
      meaning: "Slow results requiring disciplined consistency.",
      guidance: ["Build systems that last, don't rush the outcome"],
      weight: "challenge" as ImpactWeight,
      why: getTimeframeAwareWhy("saturn structural audit", timeframe)
    },
    yogas,
    yearOverview: {
      theme: "Structured Growth & Internal Alignment",
      phases: ["Foundation Building", "Action & Results", "Integration"],
      caution: ["Avoid shortcuts in relationship matters", "Watch for emotional fatigue in August"]
    }
  };
}

// --- Deep Intelligence Phasing Logic ---

function solveDeepGuidance(intent: Intent, chart: any, temporal: any, timeframe: string): DeepInsight {
  const lagnaSign = chart.lagna.sign;
  
  // 1. Calculate Planet-House Placements for Transits (Environmental Layer)
  // This is how we get "Rahu in 10th", "Saturn in 9th", etc.
  const transitPositions = chart.planets.map((p: any) => {
    const house = ((p.sign - lagnaSign + 12) % 12) + 1;
    return {
       ...p,
       house,
       isStrongTransit: p.weight >= 4
    };
  });

  // 2. Delegate to Narrative Engine for Structured Content
  return generateNarrative(intent as Intent, timeframe as Timeframe, chart, temporal, transitPositions);
}

// --- Hardened Hero Generation ---

function generateHeroInsight(chart: any, temporal: any, timeframe: string): KundaliReport['hero'] {
  const currentDasha = temporal.current.antardasha;
  const decisionState: DecisionSignal = calculateDecisionState(currentDasha, chart);
  
  let rawInsight = "";
  let why = "";

  if (currentDasha === "Jupiter" && temporal.current.mahadasha === "Saturn") {
    rawInsight = "Controlled expansion is favored; maintain balance between growth and discipline.";
    why = "Expansion and restriction are currently auditing your path.";
  } else if (currentDasha === "Mars") {
    rawInsight = "Dynamic momentum is high; focus on execution while allowing for rest.";
    why = "Martian intensity is peaking in your active window.";
  } else if (currentDasha === "Moon") {
    rawInsight = "Emotional sensitivity is high; prioritize internal reflection over external debate.";
    why = "Lunar transit is shifting your responsiveness today.";
  } else {
    rawInsight = "Maintain a steady pace; prioritize observation over major structural pivots.";
    why = "Planetary currents are in a neutral flow, favoring routine maintenance.";
  }

  rawInsight = removeSemanticDuplicates(rawInsight);
  const isValid = validateHeroInsight(timeframe, rawInsight);
  const insight = isValid 
    ? formatHeroWithContext(timeframe, rawInsight)
    : getFallbackInsight(timeframe, decisionState);

  return {
    decisionState,
    insight,
    timeAnchor: getTimeAnchorLabel(timeframe),
    why: getTimeframeAwareWhy(why, timeframe)
  };
}

function removeSemanticDuplicates(text: string): string {
  const segments = text.split(/[,;]/);
  if (segments.length < 2) return text;
  const seenVerbs = new Set<string>();
  const verbs = ["avoid", "prioritize", "maintain", "focus", "allow", "build", "lean"];
  const cleanedSegments = segments.filter(seg => {
    const lower = seg.toLowerCase();
    for (const v of verbs) {
      if (lower.includes(v)) {
        if (seenVerbs.has(v)) return false;
        seenVerbs.add(v);
        return true;
      }
    }
    return true;
  });
  return cleanedSegments.join(";").trim();
}

function validateHeroInsight(timeframe: string, insight: string): boolean {
  const wordCount = insight.split(/\s+/).length;
  if (wordCount > 18) return false;
  const clauseCount = (insight.match(/[,;]/g) || []).length + 1;
  if (clauseCount > 2) return false;
  const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
  for (const p of planets) {
    if (insight.toLowerCase().includes(p.toLowerCase())) return false;
  }
  return true;
}

function formatHeroWithContext(timeframe: string, insight: string): string {
  const label = timeframe === 'today' ? 'Today' : 
                timeframe === 'this-week' ? 'This week' : 
                timeframe === 'this-month' ? 'This month' : 'This year';
  return `${label}: ${insight}`;
}

function getFallbackInsight(timeframe: string, mode: DecisionSignal): string {
  const fallbacks: any = {
    today: {
      ACT: "Today: Conditions are favorable for focused progress; execute your primary goals with confidence.",
      WAIT: "Today: Practice patience and restraint; allow current patterns to settle before acting.",
      OBSERVE: "Today: Focus on balanced observation; avoid rushing into any major shifts."
    },
    this_week: {
      ACT: "This week: Momentum is supportive; push forward with structured initiative.",
      WAIT: "This week: A period for strategic regrouping; observe patterns before committing.",
      OBSERVE: "This week: Maintain your current pace; clarity is still developing."
    }
  };
  const timeframeKey = timeframe.replace("-", "_");
  const timeTable = fallbacks[timeframeKey] || fallbacks.today;
  return timeTable[mode] || timeTable.OBSERVE;
}

function getTimeframeAwareWhy(baseWhy: string, timeframe: string): string {
  if (timeframe === 'today' || timeframe === 'tomorrow') return `${baseWhy} affecting your immediate responding.`;
  if (timeframe === 'this-week') return `${baseWhy} shaping the weekly pattern of your flow.`;
  return `${baseWhy} auditing the structural integrity of your current path.`;
}

function calculateDecisionState(dasha: string, chart: any): DecisionSignal {
  if (["Mars", "Rahu"].includes(dasha)) return "WAIT";
  if (["Jupiter", "Sun", "Venus"].includes(dasha)) return "ACT";
  return "OBSERVE";
}

function getTimeAnchorLabel(timeframe: string): string {
  if (timeframe === 'today') return "Current Day";
  if (timeframe === 'tomorrow') return "Upcoming Day";
  if (timeframe === 'this-week') return "Weekly View";
  if (timeframe === 'this-month') return "Monthly View";
  return "Yearly Roadmap";
}

function getSignName(sign: number): string {
  if (!sign || sign < 1 || sign > 12) return "Unknown";
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}

function getAscendantNature(lagna: string): any {
  const defaultNature = { 
    insight: "Your core identity is in a state of balanced evolution.", 
    meaning: "Versatile and adaptive to changing environments.", 
    guidance: ["Observe before taking major initiative"],
    weight: "foundation" as ImpactWeight, 
    why: "Mixed elemental influences at the time of your birth." 
  };

  const map: any = {
    Aries: {
      insight: "Dynamic momentum with initiative.",
      meaning: "Designed to lead through direct action.",
      guidance: ["Focus on finishing what you start"],
      weight: "foundation" as ImpactWeight,
      why: "Martian core identity values speed over deliberation."
    },
    Libra: {
       insight: "Architect of balance and harmony.",
       meaning: "Strength lies in finding the middle path.",
       guidance: ["Avoid decision-paralysis"],
       weight: "foundation" as ImpactWeight,
       why: "Venusian core prioritizing relational symmetry."
    }
  };
  return map[lagna] || defaultNature;
}

function getCareerGuidance(chart: any, temporal: any, timeframe: string): ReportSection {
  return {
    insight: "Independent creative autonomy is favored.",
    meaning: "Structured environments may feel restrictive.",
    guidance: ["Leverage niche skills"],
    weight: "active",
    why: getTimeframeAwareWhy("10th house independent signals", timeframe),
    deepIntelligence: (timeframe === 'this-week' || timeframe === 'this-month') 
      ? solveDeepGuidance("career", chart, temporal, timeframe)
      : undefined
  };
}

function getFinanceGuidance(chart: any, temporal: any, timeframe: string): ReportSection {
  return {
    insight: "Wealth accumulation through knowledge sharing.",
    meaning: "Information is the primary conduit for flow.",
    guidance: ["Avoid speculative risks"],
    weight: "active",
    why: getTimeframeAwareWhy("2nd house intellectual focus", timeframe),
    deepIntelligence: (timeframe === 'this-week' || timeframe === 'this-month') 
      ? solveDeepGuidance("finance", chart, temporal, timeframe)
      : undefined
  };
}

function getRelationshipGuidance(chart: any, temporal: any, timeframe: string): ReportSection {
  return {
    insight: "Intellectual compatibility is your foundation.",
    meaning: "Dialogue is the bridge to intimacy.",
    guidance: ["Practice active listening"],
    weight: "active",
    why: getTimeframeAwareWhy("Venusian rapport logic", timeframe)
  };
}

function getHealthGuidance(chart: any, temporal: any, timeframe: string): ReportSection {
  return {
    insight: "Sensitive digestive system linked to internal stress.",
    meaning: "Your body reacts quickly to mental restlessness.",
    guidance: ["Prioritize calm eating environments"],
    weight: "active" as ImpactWeight,
    why: getTimeframeAwareWhy("mars transit stress", timeframe)
  };
}

function getMindGuidance(chart: any, temporal: any, timeframe: string): ReportSection {
  return {
    insight: "Inquisitive mind prone to over-analysis.",
    meaning: "Information processing is faster than physical action.",
    guidance: ["Limit information intake before sleep"],
    weight: "active" as ImpactWeight,
    why: getTimeframeAwareWhy("mercury-node conceptual speed", timeframe)
  };
}

function getReframedObservations(chart: any): ReportSection[] {
  return [
    {
      insight: "Relational Intensity",
      meaning: "Potential friction when expectations aren't met.",
      guidance: ["Wait 24 hours before resolving conflicts"],
      weight: "challenge",
      why: "Mars influence creates heat-seeking emotional responses."
    }
  ];
}

function getSimplifiedYogas(chart: any): ReportSection[] {
  return [
    {
      insight: "Structured Growth Asset",
      meaning: "Alignment for building deep foundations.",
      guidance: ["Patience multiplies your results"],
      weight: "foundation",
      why: "Saturn-Jupiter connection creates slow momentum."
    }
  ];
}
