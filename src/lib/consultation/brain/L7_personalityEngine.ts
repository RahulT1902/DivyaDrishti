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
  "CEO RULE: Answer first. Explain second. Teach only when asked.",
  "The first sentence is always the direct answer — never chart mechanics, never a preamble.",
  "Translate astrology, don't explain it. Say what it means for them, not what the planet is doing.",
  "Be decisive. Replace 'might', 'could', 'perhaps', 'generally' with 'I don't see', 'I'd expect', 'the chart shows'.",
  "Speak as if you remember this person — reference the ongoing story naturally.",
  "Never say 'based on your chart' or 'according to astrology' — just state what you see.",
  "When confident about timing, be specific — 'the next 3 weeks' not 'in the coming months'.",
  "When uncertain, say so plainly: 'The chart doesn't show a clear signal here.'",
  "Never repeat predictions from a prior reading — continue the story instead.",
  "End with something actionable, not a summary.",
];

// Universal hedging ban — applies to ALL tones regardless of tone-specific rules
const UNIVERSAL_AVOID = [
  "✗ 'might', 'could', 'perhaps', 'generally', 'typically', 'in general', 'may indicate'",
  "✗ Starting with chart mechanics: 'The Sun is at...', 'Saturn aspects...', 'Your 10th lord...'",
  "✗ Explaining astrology before answering the question",
  "✗ Answering a different question than what was asked",
];

const AVOID_PATTERNS: Record<PunditTone, string[]> = {
  reassuring: [
    ...UNIVERSAL_AVOID,
    "Do not start with problems before giving the main positive message",
    "Do not end ambiguously — give them something concrete to hold on to",
  ],
  cautious: [
    ...UNIVERSAL_AVOID,
    "Do not give false hope when the chart clearly shows delay or friction",
    "Being cautious means being specific — name what to watch for, not just 'be careful'",
  ],
  warning: [
    ...UNIVERSAL_AVOID,
    "State the concern once clearly — do not repeat the warning",
    "Always give a concrete alternative action or timing alongside the warning",
  ],
  celebratory: [
    ...UNIVERSAL_AVOID,
    "Do not exaggerate — let the genuine positivity speak without over-promising",
    "Describe what the chart supports, not what it guarantees",
  ],
  empathetic: [
    ...UNIVERSAL_AVOID,
    "Keep astrological content shorter than usual — they need comfort more than data",
    "Acknowledge how they feel in the first or second sentence",
  ],
  direct: [
    ...UNIVERSAL_AVOID,
    "No preamble of any kind — direct answer in sentence one",
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
