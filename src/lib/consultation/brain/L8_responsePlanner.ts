// Pundit Brain — Layer 8: Response Planner
//
// Before writing a single word, decide:
//   - How long should this response be?
//   - What sections should it include?
//   - What tone?
//   - Should we reference something from a prior conversation?
//   - Should we open with the cross-domain observation?
//
// The planner makes these decisions based on all prior layers.

import type {
  IntentAnalysis, AstrologicalDiagnosis, UserState,
  ObservationSet, PunditPersonality, DomainStoryArc,
  ResponsePlan, ResponseDepth,
} from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

// ── Depth decision ────────────────────────────────────────────────────────────

function selectDepth(intent: IntentAnalysis, userState: UserState): ResponseDepth {
  // Emotional distress → keep it human, not comprehensive
  if (intent.emotionalTone === "low" || intent.emotionalTone === "worried") {
    return "detailed"; // not "very_detailed" — they need warmth more than data
  }

  // Follow-up or short questions → quick response
  if (intent.isFollowUp) return "quick";
  if (intent.type === "FollowUp") return "quick";

  // Specific narrow questions → direct
  if (["PlanetQuestion", "DashaQuestion", "TransitQuestion"].includes(intent.type)) return "quick";

  // Decision and Timing deserve full treatment
  if (intent.type === "Decision" || intent.type === "Timing") return "very_detailed";

  // Deep conversation → detailed
  if (userState.conversationDepth === "deep") return "detailed";

  // Default: detailed for Forecast, quick for Explanation/FollowUp
  return intent.type === "Forecast" ? "detailed" : "quick";
}

function depthToLength(depth: ResponseDepth): string {
  switch (depth) {
    case "quick":        return "2–4 sentences. No headers or lists.";
    case "detailed":     return "150–250 words. Conversational paragraphs. No bullet lists.";
    case "very_detailed": return "250–350 words. You may use 2 short paragraphs. Still no bullet lists.";
  }
}

// ── Section inclusion ─────────────────────────────────────────────────────────

function decideSections(
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
  depth:     ResponseDepth,
): ResponsePlan["includeSections"] {
  const isQuick      = depth === "quick";
  const highConfidence = diagnosis.confidence !== "low";

  return {
    // Timeline: if timing question, or high probability + high confidence, or "detailed" depth
    timeline: !isQuick && diagnosis.timeline !== null && highConfidence
              && (intent.type === "Timing" || intent.type === "Forecast" || diagnosis.probability >= 65),

    // Probability: only when explicitly asked or decision question
    probability: intent.type === "Probability" || intent.type === "Decision",

    // Practical advice: always for Advice/Decision; for quick follow-ups on action questions
    practicalAdvice: ["Advice", "Decision", "Timing"].includes(intent.type)
                     || intent.subIntents.some(s => /should|do|action|step/i.test(s)),

    // Planetary explanation: only if user asked about planets, or "very_detailed"
    planetaryExplanation: intent.type === "PlanetQuestion" || depth === "very_detailed",

    // Spiritual remedy: only if explicitly requested or relationship/health "very_detailed"
    spiritualRemedy: depth === "very_detailed"
                     && (intent.domain === "health" || intent.domain === "relationship")
                     && diagnosis.overallState !== "Highly Favorable",

    // Follow-up question back: when domain is unclear or first interaction
    questionBackToUser: intent.isFollowUp && intent.domain === "general",
  };
}

// ── History reference ─────────────────────────────────────────────────────────

function buildHistoryReference(
  lifeStory: DomainStoryArc | null,
  memories:  StoredDomainMemory[],
  domain:    string,
  depth:     ResponseDepth,
): string | null {
  if (depth === "quick") return null;  // no reference in quick responses

  // From the life story arc
  if (lifeStory?.events.length) {
    const lastEvent = lifeStory.events[lifeStory.events.length - 1];
    return `${lastEvent.approximate_date} you mentioned that ${lastEvent.event.toLowerCase()}`;
  }

  // From stored memory
  const mem = memories.find(m => m.domain === domain);
  if (mem?.whySentence) {
    return `The last reading established: ${mem.whySentence}`;
  }
  if (mem?.overallLine) {
    return `The reading from our last session said: ${mem.overallLine}`;
  }

  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function planResponse(
  intent:      IntentAnalysis,
  diagnosis:   AstrologicalDiagnosis,
  userState:   UserState,
  observations: ObservationSet,
  personality: PunditPersonality,
  lifeStory:   DomainStoryArc | null,
  memories:    StoredDomainMemory[],
): ResponsePlan {
  const depth            = selectDepth(intent, userState);
  const includeSections  = decideSections(intent, diagnosis, depth);
  const referenceHistory = buildHistoryReference(lifeStory, memories, intent.domain, depth);

  // Open with cross-domain observation if it's genuinely off-topic and we have the space
  const openWithObservation = observations.isOffTopic && depth !== "quick";

  return {
    depth,
    targetLength:     depthToLength(depth),
    includeSections,
    referenceHistory,
    openWithObservation,
  };
}
