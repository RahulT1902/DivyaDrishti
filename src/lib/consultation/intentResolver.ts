// Consultation Intelligence — Layer 2: Intent Resolver
//
// Maps the user's question to a rich consultation intent that drives
// response strategy. Extends V5's questionType taxonomy with the full
// set of intent types needed for natural consultation flow.
//
// Intent taxonomy:
//   Forecast       — "How's my career this month?"
//   Timing         — "When is the right time?"
//   Decision       — "Should I take this offer?"
//   Advice         — "What should I do about management?"
//   Probability    — "What are my chances?"
//   Explanation    — "Why?" / "Why is X not working?"
//   FollowUp       — Short continuation with no new domain
//   PlanetQuestion — "Which planet is helping me?"
//   DashaQuestion  — "When does my current period end?"
//   TransitQuestion— "How is Jupiter transiting?"
//   Comparison     — "Is this better than last month?"

import type { ConversationState } from "./conversationState";

export type ConsultationIntent =
  | "Forecast"
  | "Timing"
  | "Decision"
  | "Advice"
  | "Probability"
  | "Explanation"
  | "FollowUp"
  | "PlanetQuestion"
  | "DashaQuestion"
  | "TransitQuestion"
  | "Comparison";

export interface ResolvedConsultationIntent {
  type:              ConsultationIntent;
  domain:            string;
  timeframe:         string | null;    // resolved (may inherit from state)
  entities:          string[];         // extracted entities: "management", "promotion"
  isFollowUp:        boolean;
  inheritedDomain:   boolean;          // true if domain came from prior state
  inheritedTimeframe: boolean;         // true if timeframe came from prior state
  rawQuestion:       string;
}

// ─── Pattern libraries ────────────────────────────────────────────────────────

const P = {
  explanation:   /^why\??$|^how come\??$|^why is that\??$|why (am i|is my|are my|isn'?t|aren'?t|don'?t|doesn'?t|can'?t|won'?t)|what('?s| is) (causing|blocking|preventing|stopping)/i,
  timing:        /^when\??$|when will|which month|how (soon|long)|by when|best time|right time/i,
  decision:      /should i|shall i|is it (good|right|wise) to|would it be (better|wise)/i,
  advice:        /what should i|how should i|how do i|what (can|must) i do|what'?s (the best|my) (approach|move|step|action)/i,
  probability:   /what are (my |the )?chances|how likely|probability|odds of|percent/i,
  planet:        /which planet|what planet|who is (helping|supporting|blocking)|which (dasha|mahadasha|antardasha|nakshatra)/i,
  dasha:         /when does (my|this) (dasha|period|mahadasha|antardasha) (end|change|finish|shift)|how long (is|does) (my|this) (dasha|period)/i,
  transit:       /where is (jupiter|saturn|mars|sun|moon|venus|mercury|rahu|ketu)|how is (jupiter|saturn|mars) transiting/i,
  comparison:    /better than|worse than|compared to|how does this compare|last (month|week|year)/i,
  forecast:      /how (is|are|does|do|will)|what (does|is|are)|tell me about|give me/i,
};

const DOMAIN_PATTERNS: [string, RegExp][] = [
  ["career",       /career|job|work|profession|business|office|promotion|interview|resign|salary/i],
  ["health",       /health|sick|body|sleep|energy|pain|illness|doctor|fitness/i],
  ["finance",      /finance|money|income|savings|invest|salary|wealth|loan|debt|expense/i],
  ["relationship", /relationship|marriage|partner|spouse|love|romance|family/i],
  ["education",    /study|exam|college|education|degree|course|admission/i],
];

function detectDomain(question: string): string | null {
  for (const [domain, pattern] of DOMAIN_PATTERNS) {
    if (pattern.test(question)) return domain;
  }
  return null;
}

function detectTimeframe(question: string): string | null {
  if (/\btomorrow\b/i.test(question))  return "tomorrow";
  if (/\btoday\b/i.test(question))     return "today";
  if (/this month/i.test(question))    return "this month";
  if (/next month/i.test(question))    return "next month";
  if (/this week/i.test(question))     return "this week";
  if (/this year/i.test(question))     return "this year";
  if (/\bmonth\b/i.test(question))     return "this month";
  if (/\bweek\b/i.test(question))      return "this week";
  return null;
}

function extractEntities(question: string): string[] {
  const entities: string[] = [];
  if (/\b(management|boss|manager|my employer|HR|supervisor|director)\b/i.test(question)) entities.push("management");
  if (/\b(promotion|hike|appraisal|increment)\b/i.test(question)) entities.push("promotion");
  if (/\b(job|role|position|company|offer)\b/i.test(question)) entities.push("job");
  if (/\b(investment|stock|mutual fund|property)\b/i.test(question)) entities.push("investment");
  if (/\b(marriage|partner|spouse|relationship)\b/i.test(question)) entities.push("relationship");
  return entities;
}

// Detect a pure follow-up: short question with no strong domain signal
// or explicit continuation word
function isFollowUpQuestion(question: string, state: ConversationState): boolean {
  if (state.turnCount === 0) return false;
  const q = question.trim();
  const wordCount = q.split(/\s+/).length;
  const hasDomain = DOMAIN_PATTERNS.some(([, p]) => p.test(q));
  const startsWithContinuation = /^(and |but |so |then |what about |how about |ok |okay )/i.test(q);
  const isPureWh = /^(why|when|how|who|what|which)\??$/i.test(q.trim());

  return isPureWh || (!hasDomain && wordCount <= 10) || startsWithContinuation;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function resolveConsultationIntent(
  question: string,
  state:    ConversationState,
): ResolvedConsultationIntent {
  const q = question.trim();

  // Detect intent type
  let type: ConsultationIntent = "Forecast";
  if      (P.dasha.test(q))       type = "DashaQuestion";
  else if (P.transit.test(q))     type = "TransitQuestion";
  else if (P.planet.test(q))      type = "PlanetQuestion";
  else if (P.explanation.test(q)) type = "Explanation";
  else if (P.comparison.test(q))  type = "Comparison";
  else if (P.probability.test(q)) type = "Probability";
  else if (P.timing.test(q))      type = "Timing";
  else if (P.advice.test(q))      type = "Advice";
  else if (P.decision.test(q))    type = "Decision";

  // Domain resolution — question first, then inherit from state
  const detectedDomain  = detectDomain(q);
  const inheritedDomain = !detectedDomain && !!state.activeDomain;
  const domain          = detectedDomain ?? state.activeDomain ?? "general";

  // Timeframe resolution — question first, then inherit from state
  const detectedTimeframe  = detectTimeframe(q);
  const inheritedTimeframe = !detectedTimeframe && !!state.activeTimeframe;
  const timeframe          = detectedTimeframe ?? state.activeTimeframe;

  // Follow-up detection
  const followUp = isFollowUpQuestion(q, state);
  if (followUp && type === "Forecast") type = "FollowUp";

  return {
    type,
    domain,
    timeframe,
    entities:           extractEntities(q),
    isFollowUp:         followUp,
    inheritedDomain,
    inheritedTimeframe,
    rawQuestion:        question,
  };
}
