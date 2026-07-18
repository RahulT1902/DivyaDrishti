// Pundit Brain — Layer 1: Intent Engine
//
// Most people don't ask what they actually want.
// "How's my health today?" really means:
//   → Am I recovering? Should I worry? Is this temporary? What should I do?
//
// This layer infers the sub-intents behind the stated question,
// detects emotional tone and urgency, and builds the complete IntentAnalysis
// that orients the entire brain chain.

import type { IntentAnalysis, EmotionalTone, Urgency } from "./types";

// ── Domain patterns ───────────────────────────────────────────────────────────

const DOMAIN_PATTERNS: [string, RegExp][] = [
  ["career",       /career|job|work|profession|business|office|promotion|interview|resign|salary|hike|appraisal/i],
  ["health",       /health|sick|body|sleep|energy|pain|illness|doctor|fitness|recover|cold|fever/i],
  ["finance",      /finance|money|income|savings|invest|salary|wealth|loan|debt|expense|returns/i],
  ["relationship", /relationship|marriage|partner|spouse|love|romance|family|boyfriend|girlfriend/i],
  ["education",    /study|exam|college|education|degree|course|admission|academic/i],
];

function detectDomain(q: string): string {
  for (const [domain, pattern] of DOMAIN_PATTERNS) {
    if (pattern.test(q)) return domain;
  }
  return "general";
}

// ── Intent type ───────────────────────────────────────────────────────────────

type IntentType = "Forecast" | "Timing" | "Decision" | "Advice" | "Probability" | "Explanation" | "FollowUp";

function detectType(q: string): IntentType {
  if (/^why\??$|why (am i|is my|are my|isn'?t)|what('?s| is) (causing|blocking)/i.test(q)) return "Explanation";
  if (/^when\??$|when will|how (soon|long)|best time|right time|which month/i.test(q))      return "Timing";
  if (/should i|shall i|is it (good|right|wise) to|would it be better/i.test(q))            return "Decision";
  if (/what should i|how should i|how do i|what can i do|what must i do/i.test(q))           return "Advice";
  if (/what are (my |the )?chances|how likely|probability|odds of|percent/i.test(q))         return "Probability";
  return "Forecast";
}

// ── Emotional tone ────────────────────────────────────────────────────────────

function detectEmotionalTone(q: string, history: Array<{ role: string; content: string }>): EmotionalTone {
  const combined = [q, ...(history.filter(m => m.role === "user").slice(-3).map(m => m.content))].join(" ");
  if (/feeling (very )?low|feel (sad|down|depressed|terrible|awful)|very low today/i.test(combined)) return "low";
  if (/worried|nervous|scared|anxious|fear|concerned|tense/i.test(combined))                         return "worried";
  if (/frustrated|upset|angry|disappointed|irritated|fed up/i.test(combined))                        return "frustrated";
  if (/excited|happy|great news|thrilled|amazing|wonderful/i.test(combined))                         return "excited";
  if (/hopeful|optimistic|positive|looking forward|hope/i.test(combined))                            return "hopeful";
  if (/what|how|when|why|curious|wondering|interesting/i.test(q))                                   return "curious";
  return "neutral";
}

// ── Urgency ───────────────────────────────────────────────────────────────────

function detectUrgency(q: string): Urgency {
  if (/today|tomorrow|right now|urgent|asap|immediately|this moment/i.test(q)) return "high";
  if (/this week|soon|shortly|next few days/i.test(q))                         return "medium";
  return "low";
}

// ── Entities ──────────────────────────────────────────────────────────────────

function extractEntities(q: string): string[] {
  const entities: string[] = [];
  if (/\b(management|boss|manager|HR|supervisor|director|team lead)\b/i.test(q))           entities.push("management");
  if (/\b(promotion|hike|appraisal|increment|raise)\b/i.test(q))                           entities.push("promotion");
  if (/\b(job|role|position|offer|company|resignation|switch)\b/i.test(q))                  entities.push("job");
  if (/\b(investment|stock|mutual fund|property|crypto)\b/i.test(q))                        entities.push("investment");
  if (/\b(marriage|wedding|partner|spouse|propose)\b/i.test(q))                             entities.push("marriage");
  if (/\b(recovery|treatment|medicine|doctor|hospital)\b/i.test(q))                         entities.push("medical");
  return entities;
}

// ── Sub-intent inference ──────────────────────────────────────────────────────
// The core new capability: infer what the person ACTUALLY wants to know.

function inferSubIntents(
  q:        string,
  domain:   string,
  type:     IntentType,
  entities: string[],
  tone:     EmotionalTone,
  history:  Array<{ role: string; content: string }>,
): string[] {
  const intents: string[] = [];
  const isFollowUp = history.filter(m => m.role === "user").length > 0;

  switch (domain) {
    case "career":
      if (entities.includes("promotion")) {
        intents.push("Will the decision come through?");
        intents.push("Will my salary or designation change?");
        intents.push("Should I push for it now or wait?");
        intents.push("What could cause it to be delayed?");
        if (entities.includes("management")) intents.push("Will management support this?");
      } else if (entities.includes("job")) {
        intents.push("Is the timing right to make this move?");
        intents.push("Will the new role be better than the current one?");
        intents.push("Should I negotiate or accept as-is?");
        intents.push("What's the chart's view on changing companies?");
      } else {
        intents.push("Am I in a growth phase or a consolidation phase?");
        intents.push("When is my next peak period for visibility?");
        intents.push("What's holding me back right now?");
        intents.push("What should I focus on this period?");
      }
      break;

    case "health":
      if (tone === "worried" || tone === "anxious") {
        intents.push("Is this something serious or temporary?");
        intents.push("Should I be taking more precautions right now?");
        intents.push("When can I expect to feel better?");
        intents.push("What does the chart say about recovery?");
      } else if (isFollowUp) {
        intents.push("Am I continuing to recover?");
        intents.push("Is there anything new I should watch for?");
        intents.push("Will my energy levels improve soon?");
        intents.push("Is today better or worse than yesterday?");
      } else {
        intents.push("Is my physical health stable right now?");
        intents.push("Are there any warning signs I should watch for?");
        intents.push("What's my energy and immunity like this period?");
        intents.push("What can I do to maintain my health?");
      }
      break;

    case "finance":
      if (entities.includes("investment")) {
        intents.push("Is this investment likely to perform well?");
        intents.push("Is the timing favourable for putting money in?");
        intents.push("What's the risk I should be aware of?");
        intents.push("Should I wait for a better period?");
      } else {
        intents.push("Will my income increase this period?");
        intents.push("Are there unexpected expenses or losses to watch for?");
        intents.push("Is this a good time to save or to spend?");
        intents.push("What's the chart's view on financial flow right now?");
      }
      break;

    case "relationship":
      if (entities.includes("marriage")) {
        intents.push("When is the right period for marriage?");
        intents.push("Are there obstacles in the chart to watch for?");
        intents.push("Is the current partner suitable per the chart?");
        intents.push("What should I do to improve the chances?");
      } else {
        intents.push("Is the relationship improving or going through difficulty?");
        intents.push("What's creating the current distance or tension?");
        intents.push("When will things feel more settled?");
        intents.push("What should I do differently right now?");
      }
      break;

    default:
      // Emotional state questions ("I'm feeling low")
      if (tone === "low" || tone === "worried") {
        intents.push("Why am I feeling this way right now?");
        intents.push("Will this feeling pass soon?");
        intents.push("Is the chart reflecting what I'm going through?");
        intents.push("What can I do to feel more grounded?");
      } else {
        intents.push("What's the overall energy of this period?");
        intents.push("What should I be prioritising right now?");
        intents.push("Is something significant shifting in my chart?");
      }
  }

  // Timing questions always add timeline sub-intent
  if (type === "Timing") {
    intents.unshift("What's the specific window I should aim for?");
  }
  // Decision questions add risk sub-intent
  if (type === "Decision") {
    intents.push("What are the risks if I proceed?");
    intents.push("What does the chart recommend — act or wait?");
  }

  return intents.slice(0, 5);
}

// ── Follow-up detection ───────────────────────────────────────────────────────

function detectFollowUp(q: string, history: Array<{ role: string; content: string }>): boolean {
  if (history.filter(m => m.role === "user").length === 0) return false;
  const words = q.trim().split(/\s+/).length;
  const hasDomain = DOMAIN_PATTERNS.some(([, p]) => p.test(q));
  const continuationWord = /^(and |but |so |then |what about |how about |ok |okay |also )/i.test(q.trim());
  const pureWh = /^(why|when|how|who|what|which)\??$/i.test(q.trim());
  return pureWh || (!hasDomain && words <= 8) || continuationWord;
}

// ── Timeframe ─────────────────────────────────────────────────────────────────

function detectTimeframe(q: string): string | null {
  if (/\btomorrow\b/i.test(q))      return "tomorrow";
  if (/\btoday\b/i.test(q))         return "today";
  if (/this month/i.test(q))        return "this month";
  if (/next month/i.test(q))        return "next month";
  if (/this week/i.test(q))         return "this week";
  if (/this year/i.test(q))         return "this year";
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function analyzeIntent(
  question: string,
  history:  Array<{ role: string; content: string }>,
): IntentAnalysis {
  const q        = question.trim();
  const domain   = detectDomain(q);
  const type     = detectType(q);
  const tone     = detectEmotionalTone(q, history);
  const urgency  = detectUrgency(q);
  const entities = extractEntities(q);
  const isFollowUp = detectFollowUp(q, history);
  const timeframe  = detectTimeframe(q);

  const subIntents = inferSubIntents(q, domain, type, entities, tone, history);

  return {
    stated:       question,
    subIntents,
    emotionalTone: tone,
    urgency,
    domain,
    type: isFollowUp ? "FollowUp" : type,
    timeframe,
    entities,
    isFollowUp,
  };
}
