// Pundit Brain — Layer 8: Response Planner + Answer Plan
//
// Two outputs:
//
// 1. ResponsePlan  — controls depth, sections, length
// 2. AnswerPlan    — pure conclusions for the LLM (no chart data)
//
// The AnswerPlan is the contract between the reasoning engine and the LLM.
// It contains only what an astrologer would SAY — not what they calculated.
//
//   directAnswer:          "Health is stable today."
//   confidence:            High (88%)
//   probabilities:         [{ label: "Serious concern", value: 5 }, ...]
//   timeline:              "Next 5–7 days"
//   mainObservation:       "Recovery phase — energy consolidating"
//   unexpectedObservation: "Mental fatigue is more significant than any physical risk"
//   recommendation:        "Maintain your routine. Don't overexert."
//
// Notice: no planets. No houses. No Sun at 65%.
// Those are supporting evidence — they stay inside the engine.

import type {
  IntentAnalysis, AstrologicalDiagnosis, UserState,
  ObservationSet, PunditPersonality, DomainStoryArc,
  ResponsePlan, ResponseDepth, SummaryCard,
  AnswerPlan, ProbabilityItem, ReasoningChain,
} from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

// ── Depth decision ────────────────────────────────────────────────────────────

function selectDepth(intent: IntentAnalysis, userState: UserState): ResponseDepth {
  if (intent.emotionalTone === "low" || intent.emotionalTone === "worried") return "detailed";
  if (intent.isFollowUp || intent.type === "FollowUp") return "quick";
  if (["PlanetQuestion", "DashaQuestion", "TransitQuestion"].includes(intent.type)) return "quick";
  if (intent.type === "Decision" || intent.type === "Timing") return "very_detailed";
  if (userState.conversationDepth === "deep") return "detailed";
  return intent.type === "Forecast" ? "detailed" : "quick";
}

function depthToLength(depth: ResponseDepth): string {
  switch (depth) {
    case "quick":         return "1 short paragraph (3–5 sentences). Answer then brief reason.";
    case "detailed":      return "2 paragraphs. Answer → Why → Advice. Optional 'What I'm watching' bullets.";
    case "very_detailed": return "3 paragraphs. Answer → Why → Timeline → Advice.";
  }
}

// ── Direct answer (the ONE sentence that opens the response) ──────────────────

function buildDirectAnswer(intent: IntentAnalysis, diagnosis: AstrologicalDiagnosis): string {
  const { overallState, probability, timeline, domain } = diagnosis;
  const question = intent.stated.toLowerCase();

  const isProbabilityQ = intent.type === "Probability"
    || /chances?|probability|likelihood|odds|how likely|will (i|it)/i.test(question);
  if (isProbabilityQ) {
    const level = probability >= 70 ? "High" : probability >= 50 ? "Moderate" : "Low";
    return `${level} — I'd put the probability around ${probability}%.`;
  }

  if ((intent.type === "Timing" || /when|by when|how long|timeline/i.test(question)) && timeline) {
    return `The window I'm seeing is ${timeline}.`;
  }

  if (intent.type === "Decision" || /should i|can i|is it (a )?good|right time/i.test(question)) {
    if (overallState === "Highly Favorable" || overallState === "Favorable") return `Yes — the current period supports moving forward on this.`;
    if (overallState === "Difficult")    return `I'd hold off — the timing isn't in your favour right now.`;
    if (overallState === "Challenging")  return `Proceed carefully — there's friction, but not a hard stop.`;
    return `It's a reasonable time to move, but with measured steps.`;
  }

  const map: Record<string, (d: string) => string> = {
    "Highly Favorable": (d) => `Your ${d} looks very strong right now — this is a genuinely good period.`,
    "Favorable":        (d) => `Your ${d} looks positive at the moment.`,
    "Moderate":         (d) => `Your ${d} is in a stable, moderate phase right now.`,
    "Challenging":      (d) => `There's some genuine friction in your ${d} right now.`,
    "Difficult":        (d) => `The ${d} picture is under real pressure right now.`,
  };
  return (map[overallState] ?? map["Moderate"])(domain);
}

// ── Domain-specific probabilities ─────────────────────────────────────────────

function buildDomainProbabilities(domain: string, diagnosis: AstrologicalDiagnosis): ProbabilityItem[] {
  const { overallScore, probability } = diagnosis;

  switch (domain) {
    case "health":
      return [
        { label: "Serious concern",   value: Math.max(5,  Math.min(55, 100 - overallScore)) },
        { label: "Minor sensitivity", value: overallScore < 60 ? 35 : 15 },
        { label: "Recovery pace",     value: Math.min(95, overallScore) },
      ];
    case "career":
      return [
        { label: "Positive outcome",  value: probability },
        { label: "Delay or friction", value: Math.max(10, Math.min(60, 100 - probability - 15)) },
      ];
    case "finance":
      return [
        { label: "Financial gain",   value: overallScore >= 65 ? probability : Math.min(40, probability) },
        { label: "Loss risk",        value: overallScore < 50 ? 30 : 10 },
      ];
    case "relationship":
      return [
        { label: "Harmony improving", value: overallScore >= 50 ? probability : Math.max(20, probability - 20) },
        { label: "Tension easing",    value: overallScore >= 65 ? 75 : 40 },
      ];
    default:
      return [{ label: "Positive direction", value: probability }];
  }
}

// ── Main observation (plain-English summary of life arc + state) ──────────────

function buildMainObservation(
  lifeStory: DomainStoryArc | null,
  diagnosis: AstrologicalDiagnosis,
  domain:    string,
): string {
  if (lifeStory?.currentStage && lifeStory.events.length > 0) {
    const lastEvent = lifeStory.events[lifeStory.events.length - 1];
    return `${lastEvent.event} — now in ${lifeStory.currentStage} phase`;
  }
  if (lifeStory?.currentStage) {
    return `Currently in ${lifeStory.currentStage} phase for ${domain}`;
  }
  const plain: Record<string, string> = {
    "Highly Favorable": `Strong positive period for ${domain}`,
    "Favorable":        `Good period for ${domain}`,
    "Moderate":         `Stable, moderate phase for ${domain}`,
    "Challenging":      `Friction and resistance in ${domain} right now`,
    "Difficult":        `Significant pressure in ${domain}`,
  };
  return plain[diagnosis.overallState] ?? `${domain}: ${diagnosis.overallState}`;
}

// ── Recommendation (what to actually do) ─────────────────────────────────────

function buildRecommendation(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  reasoning: ReasoningChain,
): string {
  const silentAdvice = reasoning.silentQuestions[5];
  if (silentAdvice && silentAdvice.length > 15 && !silentAdvice.startsWith("Stay consistent")) {
    return silentAdvice;
  }

  const map: Record<string, Record<string, string>> = {
    health: {
      "Highly Favorable": "Continue your current routine. Your body is working well — don't interrupt it.",
      "Favorable":        "Maintain your routine and rest adequately.",
      "Moderate":         "Don't overexert. Consistency matters more than new remedies right now.",
      "Challenging":      "Slow down and prioritise recovery. This is not a period to push through fatigue.",
      "Difficult":        "Seek medical attention if symptoms persist. Rest is non-negotiable.",
    },
    career: {
      "Highly Favorable": "Move forward confidently. The timing is genuinely in your favour.",
      "Favorable":        "Keep the momentum. Consistent effort pays off more than big moves.",
      "Moderate":         "Focus on quality over speed. Avoid impulsive decisions.",
      "Challenging":      "Hold your position. The friction is temporary — don't let it push you into reactive choices.",
      "Difficult":        "Don't force outcomes. Use this period to prepare, not execute.",
    },
    finance: {
      "Highly Favorable": "This is a good window for financial decisions you've been considering.",
      "Favorable":        "Proceed with planned decisions, but maintain discipline.",
      "Moderate":         "Smaller, safer moves over large commitments right now.",
      "Challenging":      "Avoid major financial moves. Protect what you have.",
      "Difficult":        "No new commitments. Focus on stability.",
    },
    relationship: {
      "Highly Favorable": "This is a good time for important conversations you've been postponing.",
      "Favorable":        "Small, consistent gestures matter more than grand ones right now.",
      "Moderate":         "Stay patient. Minor misunderstandings are temporary.",
      "Challenging":      "Don't escalate. Give things space and let time work.",
      "Difficult":        "Avoid high-stakes conversations this week. Let things settle first.",
    },
  };

  return map[domain]?.[diagnosis.overallState] ?? "Stay consistent with your current energy.";
}

// ── Severity (how bad is the concern — only for negative states) ──────────────

function buildSeverity(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
): "Minor" | "Moderate" | "Significant" | "Life-changing" | null {
  if (diagnosis.overallState === "Highly Favorable" || diagnosis.overallState === "Favorable") return null;

  if (domain === "health") {
    if (diagnosis.overallState === "Moderate")    return "Minor";
    if (diagnosis.overallState === "Challenging") return "Moderate";
    if (diagnosis.overallState === "Difficult")   return "Significant";
  }
  if (domain === "career" || domain === "finance") {
    if (diagnosis.overallState === "Challenging") return "Minor";
    if (diagnosis.overallState === "Difficult")   return "Moderate";
  }
  if (domain === "relationship") {
    if (diagnosis.overallState === "Challenging") return "Moderate";
    if (diagnosis.overallState === "Difficult")   return "Significant";
  }
  return null;
}

// ── Affected area (specific sub-domain, not just the domain name) ─────────────

function buildAffectedArea(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  intent:    IntentAnalysis,
): string | null {
  const q = intent.stated.toLowerCase();

  if (domain === "health") {
    if (/sleep|rest|tired|fatigue|insomnia/.test(q))     return "Sleep & Energy";
    if (/digest|stomach|gut|acid|bloat/.test(q))          return "Digestive System";
    if (/breath|lung|respirat|cold|cough|flu/.test(q))   return "Respiratory System";
    if (/eye|vision|sight/.test(q))                       return "Eyes";
    if (/skin|rash|allerg/.test(q))                       return "Skin";
    if (/muscle|pain|joint|back/.test(q))                 return "Muscles & Joints";
    if (/immune|immunit/.test(q))                         return "Immunity";
    return diagnosis.overallScore >= 65 ? "Energy & Immunity" : "Energy Levels";
  }
  if (domain === "career") {
    if (/promot|apprais/.test(q))                         return "Promotion";
    if (/salary|increment|raise|pay|hike/.test(q))        return "Salary";
    if (/job.chang|switch|resign|new.job/.test(q))        return "Job Change";
    if (/recogni|appreciat/.test(q))                      return "Recognition";
    if (/leadership|manag|team|direct/.test(q))           return "Leadership";
    if (/learn|train|skill/.test(q))                      return "Learning & Growth";
    return diagnosis.overallScore >= 65 ? "Recognition & Growth" : "Career Momentum";
  }
  if (domain === "finance") {
    if (/invest|market|stock|mutual/.test(q))             return "Investments";
    if (/property|house|real.estate|flat/.test(q))        return "Property";
    if (/save|saving/.test(q))                            return "Savings";
    if (/debt|loan|borrow|emi/.test(q))                   return "Debt Management";
    if (/income|salary|earn/.test(q))                     return "Income";
    return diagnosis.overallScore >= 65 ? "Income & Stability" : "Cash Flow";
  }
  if (domain === "relationship") {
    if (/communicat|talk|discuss|argument/.test(q))       return "Communication";
    if (/trust|honest|lie|cheat/.test(q))                 return "Trust";
    if (/marr|wed|engag/.test(q))                         return "Marriage";
    if (/family|parent|sibling|mother|father/.test(q))    return "Family Dynamics";
    if (/distance|apart|long.dist/.test(q))               return "Distance";
    return diagnosis.overallScore >= 65 ? "Emotional Harmony" : "Communication & Connection";
  }
  return null;
}

// ── Answer Plan (the LLM contract) ────────────────────────────────────────────

export function buildAnswerPlan(
  intent:       IntentAnalysis,
  diagnosis:    AstrologicalDiagnosis,
  lifeStory:    DomainStoryArc | null,
  observations: ObservationSet,
  reasoning:    ReasoningChain,
): AnswerPlan {
  const confidenceMap: Record<string, number> = { high: 88, medium: 65, low: 45 };

  return {
    directAnswer:          buildDirectAnswer(intent, diagnosis),
    confidence:            diagnosis.confidence === "high" ? "High" : diagnosis.confidence === "medium" ? "Medium" : "Low",
    confidencePercent:     confidenceMap[diagnosis.confidence] ?? 65,
    probabilities:         buildDomainProbabilities(intent.domain, diagnosis),
    timeline:              diagnosis.timeline,
    severity:              buildSeverity(intent.domain, diagnosis),
    affectedArea:          buildAffectedArea(intent.domain, diagnosis, intent),
    mainObservation:       buildMainObservation(lifeStory, diagnosis, intent.domain),
    unexpectedObservation: observations.crossDomainInsight ?? observations.proactiveNotes[0] ?? null,
    recommendation:        buildRecommendation(intent.domain, diagnosis, reasoning),
  };
}

// ── Summary card (pre-rendered server-side — LLM never touches this) ──────────
// Plain text only — the mobile app renders this in a special card widget that
// does not parse markdown. The first \n\n-separated paragraph (the header)
// gets a left amber border; the stats paragraph renders as plain middle text.

export function renderSummaryCard(card: SummaryCard): string {
  const filled = "★".repeat(card.ratingOf5);
  const empty  = "☆".repeat(5 - card.ratingOf5);

  const header = `${card.title}  ${filled}${empty}\n${card.phase}`;
  const stats  = card.stats.length
    ? card.stats.map(s => `${s.label}: ${s.value}`).join("  ·  ")
    : "";

  return stats ? `${header}\n\n${stats}` : header;
}

// ── Summary card builder ──────────────────────────────────────────────────────

function buildSummaryCard(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  lifeStory: DomainStoryArc | null,
  intent:    IntentAnalysis,
): SummaryCard {
  const { overallScore, probability, timeline, challengingFactors } = diagnosis;
  const stars  = overallScore >= 80 ? 5 : overallScore >= 65 ? 4 : overallScore >= 50 ? 3 : overallScore >= 35 ? 2 : 1;
  const phase  = lifeStory?.currentStage ?? diagnosis.overallState;

  const statsMap: Record<string, Array<{ label: string; value: string }>> = {
    health: [
      { label: "Risk",     value: overallScore >= 65 ? "Low"     : overallScore >= 50 ? "Moderate" : "Elevated" },
      { label: "Energy",   value: overallScore >= 70 ? "Good"    : overallScore >= 50 ? "Moderate" : "Low" },
      { label: "Recovery", value: phase === "Recovery" ? "Ongoing" : overallScore >= 65 ? "Not needed" : "Possible" },
      { label: "Concern",  value: overallScore >= 65 ? "None"    : overallScore >= 50 ? "Mild"     : "Present" },
    ],
    career: [
      { label: "Probability", value: `${probability}%` },
      { label: "Momentum",    value: overallScore >= 65 ? "Building"  : overallScore >= 50 ? "Stable" : "Slow" },
      { label: "Timeline",    value: timeline ?? "Unclear" },
      { label: "Risk",        value: challengingFactors.length > 1 ? "Present" : "Low" },
    ],
    finance: [
      { label: "Direction",   value: diagnosis.overallState === "Challenging" || diagnosis.overallState === "Difficult" ? "Caution" : "Positive" },
      { label: "Risk",        value: overallScore >= 65 ? "Low" : overallScore >= 50 ? "Moderate" : "Elevated" },
      { label: "Opportunity", value: overallScore >= 70 ? "Yes" : overallScore >= 50 ? "Moderate" : "Limited" },
      { label: "Timeline",    value: timeline ?? "Not specific" },
    ],
    relationship: [
      { label: "Harmony",   value: overallScore >= 65 ? "Good"  : overallScore >= 50 ? "Mixed"    : "Strained" },
      { label: "Tension",   value: challengingFactors.length > 1 ? "Present" : "Low" },
      { label: "Direction", value: lifeStory?.nextChapter ?? "Stable" },
      { label: "Focus",     value: overallScore >= 65 ? "Growth" : "Resolution" },
    ],
  };

  const timeLabel = intent.timeframe === "today" ? " Today"
    : /week/i.test(intent.timeframe ?? "") ? " This Week" : "";
  const title = `${domain.charAt(0).toUpperCase() + domain.slice(1)}${timeLabel}`;

  return { title, ratingOf5: stars, phase, stats: statsMap[domain] ?? [] };
}

// ── Section inclusion ─────────────────────────────────────────────────────────

function decideSections(
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
  depth:     ResponseDepth,
): ResponsePlan["includeSections"] {
  const isQuick        = depth === "quick";
  const highConfidence = diagnosis.confidence !== "low";

  return {
    timeline:             !isQuick && diagnosis.timeline !== null && highConfidence
                          && (intent.type === "Timing" || intent.type === "Forecast" || diagnosis.probability >= 65),
    probability:          intent.type === "Probability" || intent.type === "Decision",
    practicalAdvice:      ["Advice", "Decision", "Timing"].includes(intent.type)
                          || intent.subIntents.some(s => /should|do|action|step/i.test(s)),
    planetaryExplanation: intent.type === "PlanetQuestion",
    spiritualRemedy:      depth === "very_detailed"
                          && (intent.domain === "health" || intent.domain === "relationship")
                          && diagnosis.overallState !== "Highly Favorable",
    questionBackToUser:   intent.isFollowUp && intent.domain === "general",
    watchingList:         !isQuick && diagnosis.challengingFactors.length > 0,
  };
}

// ── History reference ─────────────────────────────────────────────────────────

function buildHistoryReference(
  lifeStory: DomainStoryArc | null,
  memories:  StoredDomainMemory[],
  domain:    string,
  depth:     ResponseDepth,
): string | null {
  if (depth === "quick") return null;

  if (lifeStory?.events.length) {
    const last = lifeStory.events[lifeStory.events.length - 1];
    return `${last.approximate_date} you mentioned that ${last.event.toLowerCase()}`;
  }

  const mem = memories.find(m => m.domain === domain);
  if (mem?.whySentence) return `Last reading: ${mem.whySentence}`;
  if (mem?.overallLine)  return `From our last session: ${mem.overallLine}`;

  return null;
}

// ── Main exports ──────────────────────────────────────────────────────────────

export function planResponse(
  intent:       IntentAnalysis,
  diagnosis:    AstrologicalDiagnosis,
  userState:    UserState,
  observations: ObservationSet,
  personality:  PunditPersonality,
  lifeStory:    DomainStoryArc | null,
  memories:     StoredDomainMemory[],
): ResponsePlan {
  const depth            = selectDepth(intent, userState);
  const summaryCard      = buildSummaryCard(intent.domain, diagnosis, lifeStory, intent);
  const includeSections  = decideSections(intent, diagnosis, depth);
  const referenceHistory = buildHistoryReference(lifeStory, memories, intent.domain, depth);
  const openWithObservation = observations.isOffTopic && depth !== "quick";

  return {
    depth,
    targetLength:     depthToLength(depth),
    directAnswer:     buildDirectAnswer(intent, diagnosis),
    summaryCard,
    includeSections,
    referenceHistory,
    openWithObservation,
  };
}
