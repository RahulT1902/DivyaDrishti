// Consultation Intelligence — Layer 1: Conversation State
//
// Extracts structured context from conversation history so the question
// planner can decide whether to reuse prior reasoning or trigger a fresh
// domain evaluation.
//
// When storedMemories are provided (cross-session), they seed the prior
// assessment if no in-session assessment has been established yet.

import type { StoredDomainMemory } from "./sessionMemory";

export interface PriorAssessment {
  domain:      string;   // "Career" | "Health" | etc.
  overallLine: string;   // The "Overall: ..." line from the prior response
  whySentence: string | null;  // The "Why today?/Why this period?" answer
  state:       string | null;  // "Favorable" | "Moderate" | etc.
}

export interface EntityMap {
  employer:  string | null;   // "management", "boss", "company", "HR"
  person:    string | null;   // named person in conversation
  timeRef:   string | null;   // resolved "this" → active timeframe
}

export interface ConversationState {
  activeDomain:     string | null;
  activeTimeframe:  string | null;   // "this month", "today", "tomorrow", etc.
  temporalLabel:    string;          // "Today" | "Tomorrow" | "This Month"
  priorTopics:      string[];        // sub-topics raised: ["promotion", "management"]
  priorAssessment:  PriorAssessment | null;
  entities:         EntityMap;
  turnCount:        number;          // number of prior exchanges
}

// ─── Domain emoji → domain name ───────────────────────────────────────────────

const DOMAIN_EMOJI_MAP: Record<string, string> = {
  "🌿": "health",
  "💼": "career",
  "💰": "finance",
  "💝": "relationship",
};

// ─── Extract prior assessment from the last assistant message ─────────────────

function extractPriorAssessment(content: string): PriorAssessment | null {
  // Detect domain from leading emoji
  let domain: string | null = null;
  for (const [emoji, d] of Object.entries(DOMAIN_EMOJI_MAP)) {
    if (content.trimStart().startsWith(emoji)) { domain = d; break; }
  }
  if (!domain) return null;

  // Extract "Overall: ..." line
  const overallMatch = content.match(/Overall:\s*(.+)/);
  const overallLine = overallMatch ? overallMatch[1].trim() : "";
  if (!overallLine) return null;

  // Infer state label from the overall line
  let state: string | null = null;
  if (/^Strong\b/i.test(overallLine))    state = "Highly Favorable";
  else if (/^Good\b/i.test(overallLine)) state = "Favorable";
  else if (/^Steady\b/i.test(overallLine)) state = "Moderate";
  else if (/^A more\b/i.test(overallLine) || /^A testing\b/i.test(overallLine)) state = "Challenging";

  // Extract the "Why" sentence — comes right after "Why today?" or "Why this period?"
  const whyMatch = content.match(/Why (?:today|tomorrow|this period)\?\s*\n([^\n]+)/);
  const whySentence = whyMatch ? whyMatch[1].trim() : null;

  return { domain, overallLine, whySentence, state };
}

// ─── Entity extraction from user messages ────────────────────────────────────

function extractEntities(recentUserMessages: string[]): EntityMap {
  const combined = recentUserMessages.join(" ");

  const employer = /\b(management|manager|boss|my company|my employer|HR|team lead|director|supervisor)\b/i.test(combined)
    ? combined.match(/\b(management|manager|boss|HR|director|supervisor|employer)\b/i)?.[0] ?? "management"
    : null;

  const person = /\b(my (?:friend|colleague|partner|husband|wife|spouse|brother|sister|father|mother))\b/i.exec(combined)?.[1] ?? null;

  return { employer, person, timeRef: null };
}

// ─── Timeframe resolution ─────────────────────────────────────────────────────

function extractActiveTimeframe(history: Array<{ role: string; content: string }>): string | null {
  // Scan user messages newest → oldest for a timeframe reference
  const userMessages = history.filter(m => m.role === "user").reverse();
  for (const m of userMessages) {
    const q = m.content;
    if (/\btomorrow\b/i.test(q))      return "tomorrow";
    if (/\btoday\b/i.test(q))         return "today";
    if (/this month/i.test(q))        return "this month";
    if (/next month/i.test(q))        return "next month";
    if (/this week/i.test(q))         return "this week";
    if (/this year/i.test(q))         return "this year";
  }
  return null;
}

function toTemporalLabel(timeframe: string | null): string {
  if (!timeframe) return "Today";
  if (timeframe === "tomorrow")   return "Tomorrow";
  if (timeframe === "today")      return "Today";
  if (timeframe === "this month") return "This Month";
  if (timeframe === "next month") return "Next Month";
  if (timeframe === "this week")  return "This Week";
  return "Today";
}

// ─── Topic extraction from user messages ─────────────────────────────────────

const TOPIC_PATTERNS: [string, RegExp][] = [
  ["promotion",   /promot|hike|appraisal|increment|raise/i],
  ["management",  /management|boss|manager|supervisor|team lead|director/i],
  ["job_change",  /switch.*job|new job|resign|quit|interview|offer/i],
  ["marriage",    /marriage|wedding|partner|spouse|propose/i],
  ["investment",  /invest|stock|mutual fund|crypto|property/i],
  ["health",      /health|sick|pain|recovery|energy/i],
  ["timing",      /when|which month|right time|best time/i],
  ["planet",      /which planet|planet|dasha|transit/i],
];

function extractPriorTopics(history: Array<{ role: string; content: string }>): string[] {
  const topics = new Set<string>();
  for (const m of history.filter(m => m.role === "user")) {
    for (const [topic, pattern] of TOPIC_PATTERNS) {
      if (pattern.test(m.content)) topics.add(topic);
    }
  }
  return [...topics];
}

// ─── Stored memory → PriorAssessment ────────────────────────────────────────

function memoryToPriorAssessment(memory: StoredDomainMemory): PriorAssessment | null {
  if (!memory.overallLine) return null;
  return {
    domain:      memory.domain,
    overallLine: memory.overallLine,
    whySentence: memory.whySentence ?? null,
    state:       memory.state       ?? null,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildConversationState(
  question:       string,
  history:        Array<{ role: string; content: string }>,
  storedMemories?: StoredDomainMemory[],
): ConversationState {
  const turnCount = history.filter(m => m.role === "user").length;

  // Last assistant message → in-session prior assessment
  const lastAssistant = history.filter(m => m.role === "assistant").slice(-1)[0];
  let priorAssessment = lastAssistant ? extractPriorAssessment(lastAssistant.content) : null;

  // No in-session assessment yet — try seeding from cross-session memory.
  // Use the most recently updated stored memory to orient the conversation.
  if (!priorAssessment && storedMemories && storedMemories.length > 0) {
    // Prefer domain-matched memory if the question has a clear domain signal
    const questionLower = question.toLowerCase();
    const domainMatch = storedMemories.find(m =>
      questionLower.includes(m.domain) ||
      (m.domain === "health"       && /health|sick|body|sleep|energy/i.test(question)) ||
      (m.domain === "career"       && /career|job|work|promot/i.test(question))        ||
      (m.domain === "finance"      && /finance|money|income|invest/i.test(question))   ||
      (m.domain === "relationship" && /relation|marriage|partner|love/i.test(question)),
    );
    const candidate = domainMatch ?? storedMemories[0];
    priorAssessment = memoryToPriorAssessment(candidate);
  }

  // Active domain — from prior assessment or last domain-keyword in user messages
  const activeDomain = priorAssessment?.domain ?? null;

  // Timeframe — scan history
  const activeTimeframe = extractActiveTimeframe(history);
  const temporalLabel   = toTemporalLabel(activeTimeframe);

  // Topics raised in the conversation
  const priorTopics = extractPriorTopics(history);

  // Entities from recent user messages
  const recentUserMessages = history
    .filter(m => m.role === "user")
    .slice(-3)
    .map(m => m.content);
  const entities = extractEntities([...recentUserMessages, question]);

  return {
    activeDomain,
    activeTimeframe,
    temporalLabel,
    priorTopics,
    priorAssessment,
    entities,
    turnCount,
  };
}
