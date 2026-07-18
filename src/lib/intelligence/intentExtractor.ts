import { Intent, IntentDomain, IntentType, NarrativeStyle } from "./types";

/**
 * Pundit Intent Extractor v2.0
 * Supports 10 domains. Uses keyword scoring + regex pattern matching to
 * determine user domain, decision type, timeframe, and narrative style rotation.
 */

const STYLE_ROTATION: NarrativeStyle[] = ["A", "B", "C", "D", "E"];

/**
 * Deterministic style rotation: same user+hour → same style within a session,
 * but varies across sessions/hours. Falls back to "A" if no seed available.
 */
function pickNarrativeStyle(seed?: string): NarrativeStyle {
  if (!seed) return "A";
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hour = new Date().getUTCHours();
  return STYLE_ROTATION[(hash + hour) % STYLE_ROTATION.length];
}

export function extractIntent(question: string, userSeed?: string): Intent {
  const q = question.toLowerCase();

  // ── Domain Scoring ─────────────────────────────────────────────────────────
  const scores: Record<string, number> = {
    career: 0,
    finance: 0,
    relationship: 0,
    health: 0,
    spirituality: 0,
    family: 0,
    education: 0,
    business: 0,
    general: 0,
  };

  // Career
  if (/(job|career|switch|promotion|work|boss|profession|office|appraisal|management|appreciation)/i.test(q)) scores.career += 1;
  if (/(salary|hike|interview|colleague|manager|resign|fired|workplace|recognition|raise|increment|supervisor|performance|annual review|higher management|senior management)/i.test(q)) scores.career += 0.5;

  // Finance
  if (/(money|invest|loan|debt|wealth|saving|income|cash|finance|financial)/i.test(q)) scores.finance += 1;
  if (/(buy|sell|stock|crypto|property|house|expense|budget|funds|returns)/i.test(q)) scores.finance += 0.5;

  // Relationship
  if (/(marriage|love|relationship|partner|wife|husband|boyfriend|girlfriend)/i.test(q)) scores.relationship += 1;
  if (/(breakup|divorce|dating|romance|couple|compatibility|rishta|vivah)/i.test(q)) scores.relationship += 0.5;

  // Health
  if (/(health|sick|stress|sleep|body|medical|doctor|illness|disease|stomach|gut|digestion|liver|kidney|chest|lung|joint|back|skin|head|throat|allerg|fever|cold|cough)/i.test(q)) scores.health += 1;
  if (/(fitness|diet|mental|energy|fatigue|pain|surgery|recovery|wellbeing|nausea|acidity|gastric|constipat|bloat|migrain|tummy|abdomen)/i.test(q)) scores.health += 0.5;

  // Spirituality
  if (/(spiritual|meditation|karma|dharma|moksha|pooja|prayer|deity|temple|sadhana)/i.test(q)) scores.spirituality += 1;
  if (/(mantra|ritual|fast|vrat|pilgrimage|astral|soul|consciousness|awakening)/i.test(q)) scores.spirituality += 0.5;

  // Family
  if (/(family|parent|father|mother|child|son|daughter|sibling|brother|sister)/i.test(q)) scores.family += 1;
  if (/(parivar|ghar|home|domestic|in-laws|ancestor|grandparent|relative|joint family)/i.test(q)) scores.family += 0.5;

  // Education
  if (/(study|education|exam|college|university|course|degree|school|learning)/i.test(q)) scores.education += 1;
  if (/(marks|result|admission|student|teacher|scholarship|coaching|competitive exam)/i.test(q)) scores.education += 0.5;

  // Business
  if (/(business|startup|venture|entrepreneurship|company|client|profit|loss|partnership)/i.test(q)) scores.business += 1;
  if (/(brand|market|launch|investor|deal|contract|revenue|enterprise|self-employed)/i.test(q)) scores.business += 0.5;

  // ── Timeframe Detection ────────────────────────────────────────────────────
  const timeHits = {
    today:  /(today|now|tonight|this morning|abhi)/i.test(q),
    week:   /(this week|week|saptah)/i.test(q),
    month:  /(this month|month|mahina|monthly)/i.test(q),
    year:   /(this year|year|annual|long term|long-term|varshik)/i.test(q),
  };
  const timeframe = timeHits.today ? "today"
    : timeHits.week ? "week"
    : timeHits.month ? "month"
    : timeHits.year ? "year"
    : "general";

  // ── Intent Type ────────────────────────────────────────────────────────────
  let type: IntentType = "general";
  if (/(when|how long|clear|expect|timeline|date|soon|later)/i.test(q)) {
    type = "timing";
  } else if (/(should|shall i|do i|can i|buy|switch|take|move|action|decide)/i.test(q)) {
    type = "decision";
  } else if (/(why|stuck|problem|wrong|trouble|issue|not working|delay|struggle)/i.test(q)) {
    type = "problem";
  }

  // ── Pick Best Domain ───────────────────────────────────────────────────────
  let maxDomain: IntentDomain = "general";
  let maxScore = 0;
  for (const [domain, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxDomain = domain as IntentDomain;
    }
  }

  // ── Confidence ─────────────────────────────────────────────────────────────
  const totalHits = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(1, totalHits / 1.5);
  const finalDomain: IntentDomain = confidence < 0.35 ? "general" : maxDomain;

  // ── Narrative Style ────────────────────────────────────────────────────────
  const narrativeStyle = pickNarrativeStyle(userSeed);

  return {
    domain: finalDomain,
    type,
    confidence,
    timeframe,
    narrativeStyle,
  };
}
