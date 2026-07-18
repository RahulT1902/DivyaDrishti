// Pundit Brain — Layer 6: Reasoning Engine
//
// Real astrologers never jump to conclusions. They reason internally.
// This layer builds an explicit reasoning chain — not English prose, just steps.
//
// Example:
//   Promotion → Saturn in 10th → activating recognition → Dasha supportive
//   → Manager already showed support → Transit window approaching
//   → Previous prediction: promotion likely
//   → Probability: 82% | Timeline: 3 weeks
//   → Main risk: internal approvals pending
//
// It also answers the 6 silent questions the Pundit asks before every response.

import type {
  IntentAnalysis, UserState, DomainStoryArc,
  AstrologicalDiagnosis, ObservationSet, ReasoningChain,
} from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

// ── Build reasoning steps ─────────────────────────────────────────────────────

function buildReasoningSteps(
  intent:    IntentAnalysis,
  userState: UserState,
  diagnosis: AstrologicalDiagnosis,
  lifeStory: DomainStoryArc | null,
): string[] {
  const steps: string[] = [];

  // Step 1: What the person asked
  steps.push(`Question: "${intent.stated}"`);

  // Step 2: Story context
  if (lifeStory?.currentStage) {
    steps.push(`Current life chapter (${diagnosis.domain}): ${lifeStory.currentStage}`);
    if (lifeStory.events.length > 0) {
      steps.push(`Story so far: ${lifeStory.storyLine}`);
    }
  }

  // Step 3: Dasha context
  steps.push(`Dasha (${userState.dashaPhase}): ${diagnosis.dashaAlignment} for ${diagnosis.domain}`);

  // Step 4: Supporting factors (top 3)
  if (diagnosis.supportingFactors.length > 0) {
    steps.push(`Supporting: ${diagnosis.supportingFactors.slice(0, 3).join("; ")}`);
  }

  // Step 5: Challenging factors
  if (diagnosis.challengingFactors.length > 0) {
    steps.push(`Friction: ${diagnosis.challengingFactors.slice(0, 2).join("; ")}`);
  }

  // Step 6: Transit
  steps.push(`Transits: ${diagnosis.transitAlignment}`);

  // Step 7: Probability and timeline
  steps.push(`Assessment: ${diagnosis.overallState} (${diagnosis.probability}% probability)`);
  if (diagnosis.timeline) {
    steps.push(`Window: ${diagnosis.timeline}`);
  }

  return steps;
}

// ── Build conclusion ──────────────────────────────────────────────────────────

function buildConclusion(diagnosis: AstrologicalDiagnosis, intent: IntentAnalysis): string {
  const { overallState, probability, timeline, domain } = diagnosis;

  if (intent.type === "Timing" && timeline) {
    return `The most favourable window for ${domain} is ${timeline}.`;
  }
  if (intent.type === "Probability") {
    return `The probability for the ${domain} outcome is approximately ${probability}%.`;
  }
  if (intent.type === "Decision") {
    if (probability >= 65) return `The chart supports proceeding in ${domain}, though timing matters.`;
    if (probability < 45)  return `The chart suggests waiting — conditions aren't aligned yet for ${domain}.`;
    return `The chart is mixed — caution is warranted before committing in ${domain}.`;
  }

  if (overallState === "Highly Favorable") return `Strong ${domain} momentum — this is an active period.`;
  if (overallState === "Favorable")        return `${domain} is in a positive phase. Progress is possible with steady effort.`;
  if (overallState === "Moderate")         return `${domain} is stable — a maintenance phase, not a peak.`;
  if (overallState === "Challenging")      return `${domain} requires patience. The chart shows friction but not permanent blockage.`;
  return `${domain} is under pressure. This phase will pass, but the timing isn't ideal for major moves.`;
}

// ── Key factor ────────────────────────────────────────────────────────────────

function findKeyFactor(diagnosis: AstrologicalDiagnosis): string {
  if (diagnosis.supportingFactors.length > 0) return diagnosis.supportingFactors[0];
  if (diagnosis.dashaAlignment === "supportive") return `The ${diagnosis.domain} dasha alignment is the primary driver`;
  if (diagnosis.transitAlignment === "favorable") return "Current transits are creating a temporary opportunity window";
  return "The natal chart's overall potential for this domain";
}

// ── Uncertainties ─────────────────────────────────────────────────────────────

function findUncertainties(diagnosis: AstrologicalDiagnosis, intent: IntentAnalysis): string[] {
  const uncertainties: string[] = [];

  if (diagnosis.confidence === "low") {
    uncertainties.push("Chart completeness is limited — the assessment has broader uncertainty than usual");
  }
  if (diagnosis.challengingFactors.length > 0) {
    uncertainties.push(`The main risk: ${diagnosis.challengingFactors[0]}`);
  }
  if (diagnosis.dashaAlignment === "challenging" && diagnosis.overallScore > 60) {
    uncertainties.push("The natal promise is good but the current dasha period may delay manifestation");
  }
  if (intent.entities.includes("management") || intent.entities.includes("promotion")) {
    uncertainties.push("External human decisions (approvals, politics) cannot be fully read from the chart");
  }

  return uncertainties.slice(0, 2);
}

// ── The 6 silent questions ────────────────────────────────────────────────────
// Every answer should silently answer these before the response is generated.

function buildSilentQuestions(
  intent:    IntentAnalysis,
  userState: UserState,
  diagnosis: AstrologicalDiagnosis,
  lifeStory: DomainStoryArc | null,
  memories:  StoredDomainMemory[],
): string[] {
  const domainMemory = memories.find(m => m.domain === diagnosis.domain);

  // Q1: What is the user actually worried about?
  const q1map: Record<string, string> = {
    worried:    `They are worried — primarily about ${intent.subIntents[0] ?? "the situation resolving"}`,
    anxious:    `Anxiety is present — they need reassurance that the outcome is not blocked`,
    low:        `They are in a low emotional state and need grounding, not just information`,
    frustrated: `They are frustrated — they want a clear direction, not more ambiguity`,
    curious:    `Genuinely curious — open to detail and nuance`,
    neutral:    `Calm and seeking an honest read`,
  };
  const q1 = q1map[intent.emotionalTone] ?? "Seeking clarity on the situation";

  // Q2: What happened since the last conversation?
  const q2 = lifeStory?.events.length
    ? `Story update: ${lifeStory.events.slice(-2).map(e => e.event).join(", ")}`
    : domainMemory?.overallLine
    ? `Last reading established: ${domainMemory.overallLine}`
    : "This appears to be their first question on this domain";

  // Q3: Which prediction has already manifested?
  const q3 = domainMemory?.situation
    ? `Previous phase "${domainMemory.situation}" is ongoing — it hasn't fully resolved yet`
    : "No prior prediction established to verify";

  // Q4: What is changing now?
  const q4 = diagnosis.transitAlignment !== "neutral"
    ? `Transit picture is ${diagnosis.transitAlignment} — creating a temporary shift in the energy`
    : diagnosis.dashaAlignment !== "neutral"
    ? `The dasha alignment is ${diagnosis.dashaAlignment} for ${diagnosis.domain} right now`
    : "The conditions are relatively stable — not a dramatic change moment";

  // Q5: What should the user know next?
  const q5 = lifeStory?.nextChapter
    ? `The next chapter in their ${diagnosis.domain} story is: ${lifeStory.nextChapter}`
    : diagnosis.timeline
    ? `A significant window is forming: ${diagnosis.timeline}`
    : "The current phase is likely to continue for some time — patience is the theme";

  // Q6: What advice would an experienced astrologer naturally give?
  const q6adviceMap: Record<string, string> = {
    career:       "Focus on visibility and preparation — the chart rewards those who are ready when the window opens",
    health:       "Rest and allow the chart's natural recovery energy to work — don't rush restoration",
    finance:      "Avoid impulsive financial moves — this is a period to protect and consolidate, not to gamble",
    relationship: "Communication is more powerful than action right now — the chart favours dialogue over confrontation",
  };
  const q6 = q6adviceMap[intent.domain] ?? "Stay consistent and aligned with the current chart energy";

  return [q1, q2, q3, q4, q5, q6];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildReasoningChain(
  intent:    IntentAnalysis,
  userState: UserState,
  diagnosis: AstrologicalDiagnosis,
  lifeStory: DomainStoryArc | null,
  memories:  StoredDomainMemory[],
): ReasoningChain {
  return {
    steps:           buildReasoningSteps(intent, userState, diagnosis, lifeStory),
    conclusion:      buildConclusion(diagnosis, intent),
    keyFactor:       findKeyFactor(diagnosis),
    uncertainties:   findUncertainties(diagnosis, intent),
    silentQuestions: buildSilentQuestions(intent, userState, diagnosis, lifeStory, memories),
  };
}
