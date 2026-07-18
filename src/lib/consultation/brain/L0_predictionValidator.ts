// Pundit Brain — Layer 0b: Prediction Validator
//
// Every prediction the Pundit makes should eventually be assessed:
//
//   Validated          → "I got the promotion" (it happened)
//   Delayed            → "Still no news" (within expected window, not yet)
//   Partially Occurred → "Got a raise but not the full promotion"
//   Failed             → "It didn't happen and the window passed"
//   Pending            → Not enough signal to assess
//
// The validator scans prior assistant messages for prediction language,
// then reads the current user message for outcome signals.

import type { PredictionAssessment, PredictionStatus } from "./types";

// ── Prediction extraction ─────────────────────────────────────────────────────

const PREDICTION_PATTERNS = [
  /within (the next )?\d+[–\-]\d+ (weeks?|months?)/gi,
  /by (end of|next|this) \w+/gi,
  /likely (to |within )\w[\w\s]{5,50}/gi,
  /\d{1,2}[–\-]\d{1,2} (weeks?|months?)/gi,
  /in the next (few )?(weeks?|months?)/gi,
  /window (of|for|is) \w[\w\s]{5,50}/gi,
  /I see \w[\w\s,.]{10,80}/gi,
  /probability.{0,30}\d{2}%/gi,
  /(expect|anticipate|see) .{10,80}/gi,
];

function extractPredictionsFromHistory(
  history: Array<{ role: string; content: string }>,
): string[] {
  const seen  = new Set<string>();
  const preds: string[] = [];

  for (const msg of history) {
    if (msg.role !== "assistant") continue;
    for (const pattern of PREDICTION_PATTERNS) {
      const matches = msg.content.match(pattern) ?? [];
      for (const m of matches) {
        const clean = m.trim().toLowerCase();
        if (!seen.has(clean) && clean.length > 8) {
          seen.add(clean);
          preds.push(m.trim());
        }
      }
    }
  }

  return preds.slice(-6); // keep last 6 unique predictions
}

// ── Status assessment ─────────────────────────────────────────────────────────

function assessStatus(currentMessage: string): PredictionStatus {
  const msg = currentMessage.toLowerCase();

  if (/it happened|came true|actually.*happen|did.*happen|you were right|got it|confirmation|finally.*happen|just.*happen|as you said/i.test(msg)) {
    return "Validated";
  }
  if (/didn.t happen|nothing happened|never happened|it didn.t|didn.t come through|wrong.*predict|still nothing/i.test(msg)) {
    return "Failed";
  }
  if (/kind of|sort of|partially|some.*aspect|half.*happen|almost.*happen|not exactly/i.test(msg)) {
    return "Partially Occurred";
  }
  if (/still waiting|not yet|hasn.t happened|delayed|postponed|still.*same|no.*news|nothing.*moved|waiting.*still/i.test(msg)) {
    return "Delayed";
  }

  return "Pending";
}

// ── Main export ───────────────────────────────────────────────────────────────

export function assessPredictions(
  history:        Array<{ role: string; content: string }>,
  currentMessage: string,
): PredictionAssessment[] {
  const predictions = extractPredictionsFromHistory(history);
  if (!predictions.length) return [];

  const status = assessStatus(currentMessage);

  // If message contains no outcome signal at all, all predictions stay Pending
  // — avoid noise when user is just asking a question
  const hasOutcomeSignal = /(happen|true|confirm|still|delay|waiting|didn.t|failed|right|wrong|came through)/i.test(currentMessage);
  if (!hasOutcomeSignal) return [];

  return predictions.map(pred => ({
    prediction: pred,
    status,
    evidence:   currentMessage.slice(0, 100),
  }));
}
