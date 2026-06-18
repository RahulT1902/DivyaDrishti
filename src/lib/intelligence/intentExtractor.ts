import { Intent, IntentDomain, IntentType } from "./types";

/**
 * Pundit Intent Extractor v1.0
 * Uses keyword scoring and regex pattern matching to determine user domain and decision type.
 */
export function extractIntent(question: string): Intent {
  const q = question.toLowerCase();

  const hits = {
    career: (/(job|career|switch|promotion|work|boss|profession)/i.test(q) ? 1 : 0) +
            (/(office|salary|hike|interview)/i.test(q) ? 0.5 : 0),
    finance: (/(buy|money|invest|loan|car|house|property|stock|crypto)/i.test(q) ? 1 : 0) +
             (/(wealth|debt|saving|expense)/i.test(q) ? 0.5 : 0),
    relationship: (/(marriage|love|relationship|partner|wife|husband|boyfriend|girlfriend)/i.test(q) ? 1 : 0) +
                  (/(breakup|divorce|dating|family)/i.test(q) ? 0.5 : 0),
    health: (/(health|sick|stress|sleep|body|medical|doctor)/i.test(q) ? 1 : 0) +
            (/(fitness|diet|mental|energy)/i.test(q) ? 0.5 : 0),
    timing: (/(when|time|soon|later|date|duration)/i.test(q) ? 1 : 0) ? 1 : 0,
    week: (/(week)/i.test(q) ? 1 : 0),
    month: (/(month)/i.test(q) ? 1 : 0),
    today: (/(today|now)/i.test(q) ? 1 : 0),
    year: (/(year|annual|long term|long-term)/i.test(q) ? 1 : 0)
  };

  const timeframe = hits.week ? "week" : hits.month ? "month" : hits.year ? "year" : hits.today ? "today" : "general";

  // Determine Max Domain
  let maxDomain: IntentDomain = "general";
  let maxScore = 0;

  for (const [domain, score] of Object.entries(hits)) {
    if (domain !== "timing" && score > maxScore) {
      maxScore = score;
      maxDomain = domain as IntentDomain;
    }
  }

  // Determine Intent Type
  let type: IntentType = "general";
  if (hits.timing > 0.5) {
    type = "timing";
  } else if (/(should|buy|switch|do|take|move|action)/i.test(q)) {
    type = "decision";
  } else if (/(why|stuck|problem|wrong|trouble|issue)/i.test(q)) {
    type = "problem";
  }

  // Confidence Calculation
  const totalHits = Object.values(hits).reduce((a, b) => a + b, 0);
  const confidence = Math.min(1, totalHits / 1.5);

  return {
    domain: confidence < 0.4 ? "general" : maxDomain,
    type,
    confidence,
    timeframe
  };
}
