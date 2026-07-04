/**
 * Chat Pundit V5 — Intent Engine
 * Classifies user questions with rich metadata that drives response strategy.
 * Returns questionType, engines to activate, emotional tone, and behavioral flags.
 */

export type QuestionType =
  | "general_status"   // "How's my career?" "How am I doing this month?"
  | "prediction"       // "Will I get promoted?" "Will I find a job?"
  | "probability"      // "What are my chances of promotion?"
  | "timing"           // "When will I get promoted?" "Which month?"
  | "decision"         // "Should I resign?" "Should I invest?"
  | "explanation"      // "Why am I not getting recognition?"
  | "planet_inquiry"   // "Which planet is helping me?"
  | "body_parts"       // "Which body parts will be affected?" — list areas first
  | "challenge"        // "Why is nothing working?" (premise needs gentle examination)
  | "general";

export type EmotionalTone =
  | "gentle"       // Health — caring, never alarming
  | "confident"    // Career / Education — direct, grounded
  | "empathetic"   // Relationship / Family — human first
  | "practical"    // Finance / Business — specific, not vague
  | "reflective";  // Spirituality / General — contemplative

export interface RichIntent {
  questionType: QuestionType;
  domain: string;
  subDomain: string;
  timeframe: string;           // Exact timeframe label for prompt injection
  timeframeLabel: string;      // Human-readable version for the LLM constraint
  isFollowUp: boolean;         // Short question with no domain — likely continues prior topic
  confidenceRequired: boolean; // Activate probability engine
  timingRequired: boolean;     // Activate timing engine
  challengeMode: boolean;      // Examine the premise before answering
  emotionalTone: EmotionalTone;
}

// ─── Question type patterns ────────────────────────────────────────────────────

const P = {
  // Matches: "what are my chances", "what are the chances", "chances of getting/achieving/having",
  // "how likely", "probability", "likelihood", "odds", "how probable", "percent chance", "% chance"
  probability: /what are (my |the )?chances|chances of (getting|achieving|receiving|having|getting|making)|how likely|probability|likelihood|\bodds\b|prospects of|how probable|percent(age)? chance|\d+%.*chance|chance of (getting|making|receiving)/i,

  timing:      /when will|which month|how (soon|long)|what time|timeline|by when|how many months|expected (date|time)|when (can|should|would)/i,

  prediction:  /will i (get|find|have|achieve|receive|be|become|land|pass|clear|make it|succeed)|is it possible|can i expect|do i (have|stand) a chance/i,

  decision:    /should i|shall i|must i|is it (good|right|wise|advisable) to|would it be (better|wise)|do i (need to|have to)|which (is better|option)/i,

  explanation: /why (am i|is my|are my|isn't|aren't|don't|doesn't|can't|won't)|what('s| is) (causing|blocking|stopping|holding|preventing|creating)|reason (for|behind)/i,

  planet:      /which planet|what planet|which (dasha|house|period|nakshatra|antardasha|mahadasha)|who is (helping|supporting|affecting|influencing|blocking)|what force/i,
  body_parts:  /which (body parts?|parts?|areas?|systems?|organs?)|what (body parts?|parts?|areas?) (will|are|might|could|likely|get)|body parts? (affected|sensitive|vulnerable|at risk)|which all/i,

  challenge:   /why (am i not|is my .* not|aren't i|don't i|can't i|haven't i)|why (nothing|everything) (works|is happening|is improving|is changing)|why (stuck|stagnant|delayed|blocked)|what('s| is) wrong with/i,
};

// ─── Sub-domain extraction ─────────────────────────────────────────────────────

const SUBDOMAINS: [string, RegExp][] = [
  ["promotion",       /promot|hike|appraisal|increment|next level|senior|manag/i],
  ["job_change",      /switch.*job|new job|new company|resign|quit|offer letter|interview/i],
  ["marriage",        /marriage|wedding|vivah|shaadi|propose|engagement|rishta/i],
  ["business_launch", /launch|start.*business|startup|new venture/i],
  ["investment",      /invest|stock|mutual fund|crypto|property.*buy/i],
  ["exam_result",     /exam|result|marks|rank|admission|entrance|competitive/i],
  ["children",        /child|baby|pregnant|conception|kids/i],
];

function extractSubDomain(q: string): string {
  for (const [sub, pattern] of SUBDOMAINS) {
    if (pattern.test(q)) return sub;
  }
  return "";
}

function extractTimeframe(q: string): { key: string; label: string } {
  if (/today|now|tonight|this morning/i.test(q))
    return { key: "today", label: "today only" };

  // "next X months/weeks" — extract exact number
  const nextMatch = q.match(/next\s+(\d+|two|three|four|five|six|seven|eight|nine|ten)\s*(months?|weeks?|days?)/i);
  if (nextMatch) {
    const num = nextMatch[1];
    const unit = nextMatch[2].toLowerCase();
    return { key: "near-term", label: `the next ${num} ${unit}` };
  }

  if (/next\s+month/i.test(q))  return { key: "next-month",  label: "next month" };
  if (/next\s+week/i.test(q))   return { key: "next-week",   label: "next week" };
  if (/next\s+year/i.test(q))   return { key: "next-year",   label: "next year" };
  if (/this\s+week|this\s+7\s*days/i.test(q)) return { key: "week", label: "this week" };
  if (/this\s+month/i.test(q))  return { key: "month",  label: "this month" };
  if (/this\s+year|annual/i.test(q)) return { key: "year", label: "this year" };
  if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(q)) {
    const m = q.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
    return { key: "month", label: m ? m[1] : "that month" };
  }
  if (/week/i.test(q))  return { key: "week",  label: "this week" };
  if (/month/i.test(q)) return { key: "month", label: "this month" };
  if (/year/i.test(q))  return { key: "year",  label: "this year" };

  return { key: "general", label: "" };
}

// Detect follow-up questions: short, no strong domain keyword, references continuation
function detectFollowUp(q: string, _domain: string): boolean {
  const hasDomainKeyword = /career|job|promot|salary|hike|health|body|finance|money|income|relationship|marriage|family|business|education|spirituality/i.test(q);
  const isShort = q.trim().split(/\s+/).length <= 12;
  const startsLikeContinuation = /^(how about|what about|and (in|for|about)|but (what|how)|so (in|for|what)|tell me more|what if|going forward|in that case|ok (so|but)|what (are|is) (my|the))/i.test(q.trim());
  return (isShort && !hasDomainKeyword) || startsLikeContinuation;
}

// ─── Domain emotional tone ─────────────────────────────────────────────────────

const DOMAIN_TONE: Record<string, EmotionalTone> = {
  health:       "gentle",
  career:       "confident",
  finance:      "practical",
  relationship: "empathetic",
  family:       "empathetic",
  spirituality: "reflective",
  education:    "confident",
  business:     "practical",
  mind:         "reflective",
  general:      "reflective",
};

// ─── Main export ───────────────────────────────────────────────────────────────

export function classifyQuestion(
  question: string,
  domain: string
): RichIntent {
  const q = question.trim();

  let questionType: QuestionType = "general_status";

  if (P.probability.test(q))       questionType = "probability";
  else if (P.challenge.test(q))    questionType = "challenge";
  else if (P.timing.test(q))       questionType = "timing";
  else if (P.body_parts.test(q))   questionType = "body_parts";
  else if (P.planet.test(q))       questionType = "planet_inquiry";
  else if (P.decision.test(q))     questionType = "decision";
  else if (P.explanation.test(q))  questionType = "explanation";
  else if (P.prediction.test(q))   questionType = "prediction";

  const tf = extractTimeframe(q);
  const isFollowUp = detectFollowUp(q, domain);

  return {
    questionType,
    domain,
    subDomain: extractSubDomain(q),
    timeframe: tf.key,
    timeframeLabel: tf.label,
    isFollowUp,
    confidenceRequired: questionType === "probability" || questionType === "prediction"
      || /chances|probability|how likely|how probable|odds of/i.test(q),
    timingRequired: questionType === "timing" || /when\b/i.test(q),
    challengeMode: questionType === "challenge",
    emotionalTone: (DOMAIN_TONE[domain] ?? "reflective") as EmotionalTone,
  };
}
