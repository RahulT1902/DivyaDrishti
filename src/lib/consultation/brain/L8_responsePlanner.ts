// Pundit Brain — Layer 8: Response Planner
//
// Before writing a single word, the planner answers 5 questions:
//   1. What exactly did the user ask?
//   2. What is the one-sentence answer?
//   3. How confident am I?
//   4. Why do I think that?
//   5. What's the practical advice?
//
// The directAnswer and summaryCard lock the LLM into Answer-first format.
// Without them, the LLM drifts into explanation mode.

import type {
  IntentAnalysis, AstrologicalDiagnosis, UserState,
  ObservationSet, PunditPersonality, DomainStoryArc,
  ResponsePlan, ResponseDepth, SummaryCard, DiagnosisState,
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
    case "quick":        return "1 short paragraph (3–5 sentences). Answer → Why → Advice.";
    case "detailed":     return "Summary card + 2 short paragraphs. Answer → Why → Advice. May include 'What I'm watching' if relevant.";
    case "very_detailed": return "Summary card + 3 paragraphs. Answer → Why → Timeline → Advice. May include 'What I'm watching'.";
  }
}

// ── Direct answer (the ONE sentence that opens the response) ──────────────────
// The LLM is instructed to use this or a natural adaptation as its first line.
// This prevents the drift into chart-mechanics mode.

function buildDirectAnswer(
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
): string {
  const { overallState, probability, timeline, domain } = diagnosis;
  const question = intent.stated.toLowerCase();

  // Probability / chance questions → give the number immediately
  const isProbabilityQ = intent.type === "Probability"
    || /chances?|probability|likelihood|odds|how likely|will (i|it)/i.test(question);
  if (isProbabilityQ) {
    const level = probability >= 70 ? "High" : probability >= 50 ? "Moderate" : "Low";
    return `${level} — I'd put the probability around ${probability}%.`;
  }

  // Timing questions → give the window
  if ((intent.type === "Timing" || /when|by when|how long|timeline/i.test(question)) && timeline) {
    return `The window I'm seeing is ${timeline}.`;
  }

  // Decision questions → yes/no/hold first
  if (intent.type === "Decision" || /should i|can i|is it (a )?good|right time/i.test(question)) {
    if (overallState === "Highly Favorable" || overallState === "Favorable") {
      return `Yes — the current period supports moving forward on this.`;
    }
    if (overallState === "Difficult") {
      return `I'd hold off — the timing isn't in your favour right now.`;
    }
    if (overallState === "Challenging") {
      return `Proceed carefully — the chart shows some friction but not a hard stop.`;
    }
    return `It's a reasonable time to move, but with measured steps.`;
  }

  // Forecast / general state questions → one-sentence state assessment
  const stateMap: Record<DiagnosisState, (d: string) => string> = {
    "Highly Favorable": (d) => `Your ${d} looks very strong right now — this is a genuinely good period.`,
    "Favorable":        (d) => `Your ${d} looks positive at the moment.`,
    "Moderate":         (d) => `Your ${d} is in a stable, moderate phase — nothing alarming, nothing exceptional.`,
    "Challenging":      (d) => `There's some genuine friction in your ${d} right now.`,
    "Difficult":        (d) => `The ${d} picture is under real pressure right now.`,
  };

  return (stateMap[overallState] ?? stateMap["Moderate"])(domain);
}

// ── Summary card ──────────────────────────────────────────────────────────────
// Visual snapshot at the top of every response. Users get the status at a glance
// before reading a single word of explanation.

function scoreToStars(score: number): number {
  if (score >= 80) return 5;
  if (score >= 65) return 4;
  if (score >= 50) return 3;
  if (score >= 35) return 2;
  return 1;
}

function buildSummaryCard(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  lifeStory: DomainStoryArc | null,
  intent:    IntentAnalysis,
): SummaryCard {
  const { overallScore, overallState, probability, timeline, challengingFactors } = diagnosis;
  const stars = scoreToStars(overallScore);
  const phase = lifeStory?.currentStage ?? overallState;

  // Domain-specific stats
  const statsMap: Record<string, Array<{ label: string; value: string }>> = {
    health: [
      { label: "Risk",     value: overallScore >= 65 ? "Low"      : overallScore >= 50 ? "Moderate" : "Elevated" },
      { label: "Energy",   value: overallScore >= 70 ? "Good"     : overallScore >= 50 ? "Moderate" : "Low" },
      { label: "Recovery", value: phase === "Recovery" ? "Ongoing" : overallScore >= 65 ? "Not needed" : "Possible" },
      { label: "Concern",  value: overallScore >= 65 ? "None"     : overallScore >= 50 ? "Mild"     : "Present" },
    ],
    career: [
      { label: "Probability", value: `${probability}%` },
      { label: "Momentum",    value: overallScore >= 65 ? "Building"  : overallScore >= 50 ? "Stable" : "Slow" },
      { label: "Timeline",    value: timeline ?? "Unclear" },
      { label: "Risk",        value: challengingFactors.length > 1 ? "Present" : "Low" },
    ],
    finance: [
      { label: "Direction",   value: overallState === "Challenging" || overallState === "Difficult" ? "Caution" : "Positive" },
      { label: "Risk",        value: overallScore >= 65 ? "Low" : overallScore >= 50 ? "Moderate" : "Elevated" },
      { label: "Opportunity", value: overallScore >= 70 ? "Yes" : overallScore >= 50 ? "Moderate" : "Limited" },
      { label: "Timeline",    value: timeline ?? "Not specific" },
    ],
    relationship: [
      { label: "Harmony",   value: overallScore >= 65 ? "Good"   : overallScore >= 50 ? "Mixed"   : "Strained" },
      { label: "Tension",   value: challengingFactors.length > 1 ? "Present" : "Low" },
      { label: "Direction", value: lifeStory?.nextChapter ?? "Stable" },
      { label: "Focus",     value: overallScore >= 65 ? "Growth" : "Resolution" },
    ],
  };

  // Title: include timeframe if asked about today/this week
  const timeLabel = intent.timeframe === "today" ? " Today"
    : /week/i.test(intent.timeframe ?? "") ? " This Week"
    : "";
  const title = `${domain.charAt(0).toUpperCase() + domain.slice(1)}${timeLabel}`;

  return {
    title,
    ratingOf5: stars,
    phase,
    stats: statsMap[domain] ?? [],
  };
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
    timeline: !isQuick && diagnosis.timeline !== null && highConfidence
              && (intent.type === "Timing" || intent.type === "Forecast" || diagnosis.probability >= 65),

    probability: intent.type === "Probability" || intent.type === "Decision",

    practicalAdvice: ["Advice", "Decision", "Timing"].includes(intent.type)
                     || intent.subIntents.some(s => /should|do|action|step/i.test(s)),

    planetaryExplanation: intent.type === "PlanetQuestion",

    spiritualRemedy: depth === "very_detailed"
                     && (intent.domain === "health" || intent.domain === "relationship")
                     && diagnosis.overallState !== "Highly Favorable",

    questionBackToUser: intent.isFollowUp && intent.domain === "general",

    // "What I'm watching" bullets: only when there are real concerns and space to mention them
    watchingList: !isQuick && diagnosis.challengingFactors.length > 0,
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
  if (mem?.whySentence) return `The last reading established: ${mem.whySentence}`;
  if (mem?.overallLine)  return `From our last session: ${mem.overallLine}`;

  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

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
  const directAnswer     = buildDirectAnswer(intent, diagnosis);
  const summaryCard      = buildSummaryCard(intent.domain, diagnosis, lifeStory, intent);
  const includeSections  = decideSections(intent, diagnosis, depth);
  const referenceHistory = buildHistoryReference(lifeStory, memories, intent.domain, depth);
  const openWithObservation = observations.isOffTopic && depth !== "quick";

  return {
    depth,
    targetLength:     depthToLength(depth),
    directAnswer,
    summaryCard,
    includeSections,
    referenceHistory,
    openWithObservation,
  };
}
