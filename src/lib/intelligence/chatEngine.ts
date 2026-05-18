import { Intent, ChatResponse, DeepInsight, IntentDomain, IntentType } from "./types";

/**
 * Chat Pundit Brain Adapter v2.1 (Conversational Refinement)
 * Implements fluid composition, timeframe awareness, and a strict jargon replacement layer.
 */

const JARGON_MAP: Record<string, string> = {
  "rahu": "this phase",
  "dasha": "your current phase",
  "mahadasha": "your life season",
  "antardasha": "your current sub-phase",
  "planetary": "underlying cosmic",
  "calibration": "adjustment",
  "alignment": "balance",
  "celestial": "natural",
  "configuration": "pattern"
};

export function buildChatResponse(
  question: string,
  intent: Intent,
  insight: DeepInsight
): ChatResponse {
  const timeframe = intent.timeframe || "general";

  // 1. Layer-by-Layer Logic Assembly
  const stance = getStance(intent, insight, timeframe);
  const anchor = getDomainAnchor(intent, insight, timeframe);
  const signalsText = getPhysicalSignalsText(insight);
  const reassurance = insight.reassurance || "";
  const mirror = getMirror(intent, insight, timeframe, insight.physicalSignals);
  const guidance = getDomainGuidance(intent, insight, timeframe, insight.physicalSignals);
  const closing = getClosing(insight, timeframe);

  // 2. Strict Fluid Composition (Stance -> Anchor -> Signals -> Reassurance -> Mirror -> Guidance -> Closing)
  const fullAnswer = composeNarrative({
    stance,
    anchor,
    signalsText,
    reassurance,
    mirror,
    guidance,
    closing
  });

  // 3. Validation & Integrity Check
  validateResponse(fullAnswer, intent.domain);

  // 4. Centralized Pipeline Logging
  console.log("Chat Engine Pipeline:", {
    question,
    intent: intent.domain,
    signals: insight.physicalSignals,
    dasha: `${insight.dashaContext.mahadasha}-${insight.dashaContext.antardasha}`,
    wordCount: fullAnswer.split(" ").length
  });

  // 5. Jargon Replacement Layer (Final Pass)
  const cleanAnswer = replaceJargon(fullAnswer);

  return {
    answer: cleanAnswer,
    followUp: generateFollowUp(intent, timeframe),
    confidence: insight.specifics.find((s: any) => s.label === "Clarity Level")?.value.toLowerCase() as any || "medium",
    intent: {
      domain: intent.domain,
      type: intent.type
    }
  };
}

function getStance(intent: Intent, insight: DeepInsight, timeframe: string): string {
  const isPositive = insight.phases[0]?.verdict?.includes("Proceed") || insight.verdict.toLowerCase().includes("clear");
  const isCautious = insight.verdict.toLowerCase().includes("discipline") || insight.verdict.toLowerCase().includes("slow") || insight.verdict.toLowerCase().includes("caution");

  const timeMarker = timeframe === "week" ? "this week " : timeframe === "month" ? "this month " : "";
  
  const domainStances: Record<string, Record<string, string>> = {
    health: {
      positive: `Your health ${timeMarker}looks generally stable.`,
      cautious: `Your health ${timeMarker}looks generally stable, but it may need a bit more attention than usual.`,
      neutral: `Your health ${timeMarker}looks generally stable, but minor imbalances are possible.`
    },
    finance: {
      positive: `This is a favorable window for financial decisions ${timeMarker}provided you plan carefully.`,
      cautious: `This is not the best time for aggressive or impulsive financial decisions ${timeMarker}.`,
      neutral: `Your financial environment ${timeMarker}favors stability over expansion right now.`
    },
    career: {
      positive: `This is a supportive time ${timeMarker}for strengthening your career position.`,
      cautious: `This ${timeMarker}is a phase of strengthening your position rather than making sudden moves.`,
      neutral: `Your career path ${timeMarker}requires steady maintenance rather than a shift.`
    }
  };

  const domainGroup = domainStances[intent.domain] || {
    positive: `This ${timeMarker}is a favorable phase for your current path.`,
    cautious: `This phase ${timeMarker}requires caution and structural stability.`,
    neutral: `This ${timeMarker}is a phase of steady calibration.`
  };

  if (isPositive) return domainGroup.positive;
  if (isCautious) return domainGroup.cautious;
  return domainGroup.neutral;
}

function getDomainAnchor(intent: Intent, insight: DeepInsight, timeframe: string): string {
  const timeMarker = timeframe === "week" ? "This week " : timeframe === "month" ? "This month " : "This phase ";
  
  if (intent.domain === "health") return `${timeMarker}is more about maintaining balance than pushing limits.`;
  if (intent.domain === "finance") return `${timeMarker}is a phase where caution and planning matter more than new opportunities.`;
  if (intent.domain === "career") return `${timeMarker}is a phase where stability and maintenance matter more than rapid growth.`;
  
  return insight.domainAnchor || `${timeMarker}favors consistency over sudden movement.`;
}

function getPhysicalSignalsText(insight: DeepInsight): string {
  if (!insight.physicalSignals || insight.physicalSignals.length === 0) return "";
  
  const signals = insight.physicalSignals;
  const prefix = signals.length > 1 ? "You may notice " : "There could be chances of ";
  return `${prefix}${signals.join(", ")}.`;
}

function getReasoning(insight: DeepInsight, timeframe: string): string {
  const base = insight.bigPicture || "";
  if (timeframe === "week") {
    return `${base} In the short term, you may notice slight fluctuations in your energy or pace.`;
  }
  return base;
}

function getMirror(intent: Intent, insight: DeepInsight, timeframe: string, signals?: string[]): string {
  if (intent.domain === "health") {
    return `You may feel like doing more, but your body may respond with fatigue or discomfort if pushed too hard right now.`;
  }

  const timeMarker = timeframe === "week" ? " this week" : "";
  const mirrors: Record<IntentDomain, string> = {
    career: `You may feel an urge to move faster${timeMarker}, but situations are forcing you to slow down.`,
    finance: `You may feel ready to commit resources${timeMarker}, but the conditions favor security over movement.`,
    relationship: `You may notice dynamics feeling more demanding${timeMarker}, requiring steady patience.`,
    health: `You may feel an internal mismatch between your ambition and your body's need for rest${timeMarker}.`,
    general: `You may be experiencing slower results${timeMarker} despite consistent effort.`,
    mind: `You may feel a sense of mental restriction${timeMarker} or a need for deeper internal clarity.`
  };
  return mirrors[intent.domain] || mirrors.general;
}

function getDomainGuidance(intent: Intent, insight: DeepInsight, timeframe: string, signals?: string[]): string {
  const guidanceMap: Record<string, { do: string[], avoid: string[] }> = {
    health: {
      do: ["maintain consistent routines", "focus on balanced meals", "prioritize regular sleep"],
      avoid: ["sudden lifestyle changes", "overexertion", "irregular habits"]
    },
    finance: {
      do: ["plan expenses carefully", "focus on stability", "build reserves"],
      avoid: ["large commitments", "speculative risks", "impulsive purchases"]
    },
    career: {
      do: ["strengthen current role", "plan next move carefully", "build skills"],
      avoid: ["sudden job switches", "rushed decisions", "burning bridges"]
    }
  };

  const domainGuidance = guidanceMap[intent.domain] || {
    do: insight.verdictMatrix?.favor || [],
    avoid: insight.verdictMatrix?.avoid || []
  };

  let primaryDo = "";
  let primaryAvoid = "";

  // Contextual overrides based on signals (Gold Standard)
  if (signals?.some(s => s.includes("acidity") || s.includes("digestive") || s.includes("appetite"))) {
    primaryDo = "proper meals";
    primaryAvoid = "irregular meals or heavy food";
  }
  if (signals?.some(s => s.includes("fatigue") || s.includes("stiffness") || s.includes("energy"))) {
    primaryDo = "proper rest";
    primaryAvoid = "overexertion";
  }
  if (signals?.some(s => s.includes("cold") || s.includes("throat") || s.includes("cough"))) {
    primaryDo = "care of hydration";
    primaryAvoid = "sudden changes in environment";
  }

  // Deduplication & Assembly
  const doItems = Array.from(new Set([primaryDo, ...domainGuidance.do])).filter(i => i !== "");
  const avoidItems = Array.from(new Set([primaryAvoid, ...domainGuidance.avoid])).filter(i => i !== "");

  return `Focus on ${doItems[0]} and ${doItems[1]}. Try to avoid ${avoidItems[0]} and ${avoidItems[1]} during this time.`;
}

function validateResponse(text: string, domain: string): void {
  const lowerText = text.toLowerCase();
  
  // 1. Mandatory Probability Language
  const hasProbability = ["may", "chances", "could", "possible"].some(w => lowerText.includes(w));
  if (!hasProbability) throw new Error("Response integrity check failed: Missing probability language.");

  // 2. Forbidden Phrases (Internal Jargon)
  const forbidden = ["rahu", "ketu", "dasha", "antardasha", "mahadasha", "structural stability"];
  const foundForbidden = forbidden.find(w => lowerText.includes(w));
  if (foundForbidden) throw new Error(`Response integrity check failed: Forbidden word '${foundForbidden}' detected.`);

  // 3. Mandatory Signals for Health
  if (domain === "health") {
    // Check if the manifestation paragraph (p2) is present and has content
    // We can check the text for known keywords from generatePhysicalSignals
    const healthKeywords = ["fatigue", "cold", "cough", "appetite", "acidity", "energy", "stiffness", "discomfort"];
    const hasSignal = healthKeywords.some(w => lowerText.includes(w));
    if (!hasSignal) throw new Error("Response integrity check failed: Health response missing physical signals.");
  }

  // 4. Length Constraint
  const wordCount = text.split(" ").length;
  if (wordCount > 130) throw new Error(`Response integrity check failed: Word count (${wordCount}) exceeds limit.`);
}

function getClosing(insight: DeepInsight, timeframe: string): string {
  const timeText = timeframe === "week" ? "This week" : "This phase";
  return `👉 ${timeText} favors stability, not strain.`;
}

function composeNarrative(parts: {
  stance: string;
  anchor: string;
  signalsText: string;
  reassurance: string;
  mirror: string;
  guidance: string;
  closing: string;
}): string {
  // Structure: Stance -> Anchor -> Signals -> Reassurance -> Mirror -> Guidance -> Closing
  
  const p1 = `${parts.stance} ${parts.anchor}`;
  const p2 = parts.signalsText ? `${parts.signalsText} ${parts.reassurance}` : "";
  const p3 = parts.mirror;
  const p4 = parts.guidance;
  const p5 = parts.closing;

  return [p1, p2, p3, p4, p5].filter(p => p !== "").join("\n\n");
}

function replaceJargon(text: string): string {
  let cleanText = text;
  for (const [jargon, replacement] of Object.entries(JARGON_MAP)) {
    const regex = new RegExp(jargon, "gi");
    cleanText = cleanText.replace(regex, replacement);
  }
  return cleanText;
}

function maybeSignature(insight: DeepInsight): string {
  const clarity = insight.specifics.find((s: any) => s.label === "Clarity Level")?.value;
  if (clarity === "High" && (insight.verdictMatrix?.caution?.length || 0) > 0) {
    return "This phase is not stopping you—it is shaping you.";
  }
  return "";
}

function generateFollowUp(intent: Intent, timeframe: string): string {
  if (timeframe === "week") {
    return "Have you noticed any recent changes in your energy or routine this week?";
  }
  
  if (intent.domain === "career") return "Are you planning a change soon, or just exploring options?";
  if (intent.domain === "finance") return "Is this a near-term decision or part of long-term planning?";
  if (intent.domain === "relationship") return "Is this about a specific situation or your general path?";
  return "Is this something you're planning now or just exploring?";
}

export function generateGeneralTimingResponse(insight: DeepInsight): string {
  return [
    "This is a phase for consolidation rather than big moves.",
    insight.bigPicture || "",
    "You may be experiencing slower movement, which is natural for this cycle.",
    "Stay disciplined and focus on your foundations. This is a time for preparation.",
    insight.verdict
  ].join("\n\n");
}
