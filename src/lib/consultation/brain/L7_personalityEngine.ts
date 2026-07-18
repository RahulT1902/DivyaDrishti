// Pundit Brain — Layer 7: Personality Engine (Pundit DNA)
//
// This is where most AI apps fail.
// Every real astrologer has a recognisable style.
// ChatPundit has one too.
//
// The Pundit:
//   - Opens with what naturally catches their attention (not with "Based on your chart")
//   - Uses "Hmm..." when genuinely pausing to observe
//   - Says "If I were sitting across from you, I'd tell you..."
//   - References prior conversations as if they remember them naturally
//   - Never repeats predictions already made
//   - Speaks with authority but not arrogance
//   - Is honest about uncertainty — doesn't pretend to know what the chart doesn't show

import type {
  IntentAnalysis, AstrologicalDiagnosis, UserState,
  PunditPersonality, PunditTone,
} from "./types";

// ── Tone selection ────────────────────────────────────────────────────────────

function selectTone(
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
  userState: UserState,
): PunditTone {
  // Emotional state takes priority
  if (intent.emotionalTone === "low" || intent.emotionalTone === "worried" || intent.emotionalTone === "anxious") {
    return diagnosis.overallState === "Highly Favorable" ? "reassuring" : "empathetic";
  }
  if (intent.emotionalTone === "frustrated") {
    return "direct";
  }

  // Diagnosis drives tone
  if (diagnosis.overallState === "Highly Favorable" && intent.emotionalTone === "excited") {
    return "celebratory";
  }
  if (diagnosis.overallState === "Highly Favorable" || diagnosis.overallState === "Favorable") {
    return "reassuring";
  }
  if (diagnosis.overallState === "Difficult") {
    return "cautious";
  }
  if (diagnosis.probability < 40) {
    return "cautious";
  }

  // Dasha background
  if (userState.dashaAlignment === "challenging" && diagnosis.overallState === "Moderate") {
    return "empathetic";
  }

  return "direct";
}

// ── Opening line ──────────────────────────────────────────────────────────────
// Context-appropriate openers that feel human and specific.

function buildOpeningLine(
  tone:      PunditTone,
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
): string {
  const domain = intent.domain;

  // Emotional state openers
  if (intent.emotionalTone === "low" || intent.emotionalTone === "worried") {
    return "I can understand why today feels heavier than usual.";
  }
  if (intent.emotionalTone === "frustrated") {
    return "I hear your frustration, and I think the chart can actually give you a clearer direction here.";
  }

  // Cross-domain observation opener
  if (domain !== intent.domain) {
    return `Hmm — what immediately catches my attention isn't your ${intent.domain}...`;
  }

  // Tone-driven openers
  switch (tone) {
    case "celebratory":
      return `There's something genuinely positive showing up in your chart right now.`;
    case "reassuring":
      if (diagnosis.overallScore >= 75) {
        return `What immediately stands out is that your ${domain} energy is in good shape.`;
      }
      return `I wouldn't be overly concerned here — the chart is showing something more manageable than it might feel.`;
    case "cautious":
      return `I want to be honest with you about what I see in the chart.`;
    case "empathetic":
      return `The chart actually reflects what you might be feeling right now — let me explain.`;
    case "direct":
      return `Let me give you a direct read on this.`;
    default:
      return `What stands out in your chart right now is this:`;
  }
}

// ── Voice guidelines ──────────────────────────────────────────────────────────

const CORE_VOICE_GUIDELINES = [
  "Speak as if you remember this person from previous consultations — never start from zero.",
  "Reference the ongoing life story naturally: 'You mentioned the cold had started...'",
  "Never say 'based on your chart' or 'according to astrology' — just state what you see.",
  "Use 'Hmm...' sparingly, only when genuinely pausing to observe something specific.",
  "'If I were sitting across from you, I would tell you...' for advice moments.",
  "When confident about timing, be specific — 'the next 3 weeks' not 'in the coming months'.",
  "When uncertain, say so plainly: 'The chart doesn't clearly show...'",
  "Never repeat predictions from a prior reading — continue the story instead.",
  "Answer what they actually asked, not what they literally said — read the sub-intent.",
  "End with something actionable or a natural next step, not a summary.",
];

const AVOID_PATTERNS: Record<PunditTone, string[]> = {
  reassuring: [
    "Do not catastrophise or amplify worry",
    "Do not start with a list of problems before the main message",
    "Do not end ambiguously — give them something to hold on to",
  ],
  cautious: [
    "Do not give false hope when the chart clearly shows delay or friction",
    "Be honest but not harsh — frame difficulty as information, not verdict",
    "Do not be vague — being cautious means being specific about what to watch for",
  ],
  warning: [
    "State the concern clearly and once — do not repeat the warning",
    "Always give a concrete alternative action or timing",
    "Do not leave the person without something constructive",
  ],
  celebratory: [
    "Do not exaggerate — let the chart's genuine positivity speak",
    "Do not promise outcomes — describe what is supported, not guaranteed",
  ],
  empathetic: [
    "Do not lecture or over-explain the astrology",
    "Lead with acknowledgment of how they feel before the reading",
    "Keep the astrological content shorter than usual — they need comfort more than data",
  ],
  direct: [
    "No preamble — get to the point in the first sentence",
    "Do not soften the message with excessive caveats",
    "One clear recommendation, not a list of possibilities",
  ],
};

// ── Main export ───────────────────────────────────────────────────────────────

export function buildPersonality(
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
  userState: UserState,
): PunditPersonality {
  const tone        = selectTone(intent, diagnosis, userState);
  const openingLine = buildOpeningLine(tone, intent, diagnosis);
  const avoidPatterns = AVOID_PATTERNS[tone] ?? AVOID_PATTERNS.direct;

  return {
    tone,
    openingLine,
    voiceGuidelines: CORE_VOICE_GUIDELINES,
    avoidPatterns,
  };
}
