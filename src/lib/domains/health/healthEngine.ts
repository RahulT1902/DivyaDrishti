import { AstrologyContext, UncertaintyProfile, PredictionHorizon } from "../../core/types";
import { DomainEngine, DomainSignalEngine, RecommendationEngine, PromptContext, DomainSignal } from "../../core/domain";
import { DecisionGraphBuilder } from "../../core/decision-graph";
import { CORE_RULESET } from "../../core/inference-engine";
import { HEALTH_KNOWLEDGE_PACK } from "./knowledgePack";
import { HealthAssessment } from "./healthTypes";
import { evaluateBodySystems, formatBodySystemsForNarrator } from "./diagnostics";

// HealthEngine is the Health domain implementation of DomainEngine<T>.
// It follows the CareerEngine reference pattern exactly:
//
//   1. Compute domain signals   — DomainSignalEngine + HEALTH_KNOWLEDGE_PACK
//   2. Build decision graph     — DecisionGraphBuilder.buildForDomain("Health")
//   3. Generate recommendations — RecommendationEngine + HEALTH_KNOWLEDGE_PACK
//   4. Assemble HealthAssessment (no planets, no houses, no yogas — structure only)
//   5. Build narrator prompt    — buildPrompt() → tight PromptContext for LLM
//
// IMPORTANT DATA LIMITATION:
//   D6 (Shashtamsha — the health divisional chart) is NOT yet in ChartSuite.
//   This engine is therefore D1-based only.  All signals are derived from the
//   birth chart's lagna, 6th, 8th house lords, and planetary strengths.
//   Phase A will integrate D6 and improve health timing specificity significantly.

export class HealthEngine implements DomainEngine<HealthAssessment> {
  readonly domain = "Health" as const;

  private readonly signalEngine         = new DomainSignalEngine();
  private readonly recommendationEngine = new RecommendationEngine();
  private readonly decisionGraphBuilder = new DecisionGraphBuilder();

  evaluate(ctx: AstrologyContext): HealthAssessment {
    // ── Step 1: Domain signals ─────────────────────────────────────────────
    const signals = this.signalEngine.compute(ctx, HEALTH_KNOWLEDGE_PACK);

    // ── Step 2: Decision graph ─────────────────────────────────────────────
    const decisionGraph = this.decisionGraphBuilder.buildForDomain(ctx, "Health");

    // ── Step 3: Recommendations ────────────────────────────────────────────
    const recommendations = this.recommendationEngine.generate(
      signals, decisionGraph, HEALTH_KNOWLEDGE_PACK,
    );

    // ── Step 4: Convenience accessors ─────────────────────────────────────
    const sig = (id: string) => signals.find(s => s.id === id)?.score ?? 50;

    const risks = decisionGraph.blockingFactors.map(f => f.label);

    // ── Step 5: Uncertainty profile ────────────────────────────────────────
    const uncertainty = computeUncertainty(ctx, signals);

    // ── Step 6: Prediction horizon ─────────────────────────────────────────
    const horizon = computeHorizon(decisionGraph.confidence, ctx);

    return {
      domain:               "Health",
      currentState:         decisionGraph.currentState,
      confidence:           decisionGraph.confidence,
      signals,
      constitutionStrength: sig("constitution"),
      immunityResilience:   sig("immunity"),
      mentalHealthScore:    sig("mental-health"),
      longevityIndicator:   sig("longevity"),
      recoveryCapacity:     sig("recovery-capacity"),
      bestTiming:           decisionGraph.timing,
      supportingFactors:    decisionGraph.supportingFactors,
      blockingFactors:      decisionGraph.blockingFactors,
      risks,
      recommendations,
      decisionGraph,
      uncertainty,
      horizon,
      completeness:         ctx.completeness,
      explainability:       ctx.explainability,
      ruleSetVersion:       CORE_RULESET.version,
      temporalStability:    ctx.temporalStability,
      transit:              ctx.transit,
      bodySystemReports:    evaluateBodySystems(ctx),
    };
  }

  buildPrompt(assessment: HealthAssessment, userQuery?: string): PromptContext {
    const systemInstruction =
`You are an experienced Vedic astrologer — a trusted Pundit speaking directly with a person.

ABSOLUTE RULES (any violation is a failure):
1. NEVER use these words in your response: confidence, uncertainty, completeness, explainability,
   activation, temporal stability, hypothesis, inference, decision graph, signal, score, dormant,
   "Medium uncertainty", "/100", "Favorable state", "the engine", "the model".
2. Do NOT describe how the reasoning system works — describe the person's situation.
3. Do NOT name planets or houses. "Moon in 6th" → "digestion may be sensitive". "Strong lagna lord" → "your constitution is resilient".
4. Answer the person's ACTUAL question. If they ask about today, focus on today — not lifelong patterns.
5. Do NOT write generic sentences that could apply to anyone.
6. Use simple Indian English — warm, caring, direct. Like a trusted family Pandit talking to a person.
   Examples: "Today looks good for your health." "Be a little careful about your digestion today." "There is nothing to worry about right now."
7. Length: 150–220 words. Natural, conversational — a Pundit speaking, not writing a report.

STRUCTURE — follow this EXACT order:
1. ONE sentence: Overall health picture for today.
2. BODY SYSTEMS — this is the MOST IMPORTANT part. Look at BODY SYSTEM ASSESSMENT below:
   - If any system is marked [VULNERABLE]: NAME it and say what's likely.
     "Your respiratory system is a little sensitive today — slightly higher chance of sore throat
      or nasal congestion, especially if you go out in the cold."
   - If digestive: "Digestion may be a bit sensitive — acidity or bloating is possible."
   - If nothing vulnerable: "No specific health concern stands out today."
   - NEVER list systems that are not vulnerable. Do NOT say "sleep is fine, digestion is fine."
3. ONE sentence on duration — only if a [VULNERABLE] system is present.
4. ONE or TWO sentences: Specific practical advice tied to the vulnerable system(s).
   Respiratory flagged → "Drink warm water. Avoid cold drinks and cold air."
   Digestive flagged → "Eat light and on time. Avoid oily or heavy food today."
   Nothing flagged → simple general advice only.

Length: 130–200 words. Never mention engine terms.`;

    // ── Body system reports are the core of the health answer ─────────────────
    const bodySystemSection = formatBodySystemsForNarrator(assessment.bodySystemReports);
    const overallPicture    = describeHealthState(assessment.currentState);
    const stabilityNote     = buildStabilityNote(assessment.temporalStability);
    const actions = assessment.recommendations
      .filter(r => r.stars >= 4)
      .slice(0, 2)
      .map(r => `• ${r.action}`)
      .join("\n") || "• Stay hydrated and eat on time";

    const userMessage =
`PUNDIT NOTES — translate into natural conversation. Never quote labels, numbers, or engine terms.

OVERALL PICTURE: ${overallPicture}

BODY SYSTEM ASSESSMENT (this drives the specifics of your answer):
${bodySystemSection}
${stabilityNote ? `\nPATTERN NOTE: ${stabilityNote}` : ""}

FALLBACK ACTIONS if no specific system is vulnerable:
${actions}

---
${userQuery ?? "How is my health today?"}`;

    return { domain: "Health", systemInstruction, userMessage };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeUncertainty(ctx: AstrologyContext, signals: DomainSignal[]): UncertaintyProfile {
  const missing: string[]     = [];
  const weak: string[]        = [];
  const conflicting: string[] = [];

  // D6 (Shashtamsha) is the primary health divisional chart — its absence is
  // a significant data gap that limits health timing specificity.
  missing.push(
    "D6 (Shashtamsha) not in ChartSuite — health timing and divisional chart analysis is unavailable; " +
    "all signals are D1-based only (Phase A will address this)",
  );

  // Standard timing data
  if (!ctx.dasha) {
    missing.push("Dasha periods not provided — maha/antardasha contribution is 0");
  }
  if (!ctx.transit) {
    missing.push("Current transit positions not provided — transit component is 0");
  }

  // Weak evidence
  const healthInferences = ctx.inferences.filter(i => i.domain === "Health");
  if (healthInferences.length < 3) {
    weak.push(
      `Only ${healthInferences.length} health inference rule(s) fired — limited signal diversity. ` +
      "Ensure HEALTH_RULES are registered in the InferenceEngine (see inferenceEngine.ts Phase 5+ comment).",
    );
  }
  const lowConfidenceSignals = signals.filter(s => s.confidence < 55);
  if (lowConfidenceSignals.length > 2) {
    weak.push(`Low evidence confidence on: ${lowConfidenceSignals.map(s => s.label).join(", ")}`);
  }

  // Conflicting evidence
  const constitution    = signals.find(s => s.id === "constitution")?.score   ?? 50;
  const immunity        = signals.find(s => s.id === "immunity")?.score        ?? 50;
  const mentalHealth    = signals.find(s => s.id === "mental-health")?.score   ?? 50;
  const chronicRisk     = signals.find(s => s.id === "chronic-risk")?.score    ?? 50;

  if (constitution >= 70 && chronicRisk >= 65) {
    conflicting.push(
      "Strong constitution + elevated chronic risk: robust natal vitality but structural vulnerabilities co-exist — preventive focus is warranted",
    );
  }
  if (immunity >= 70 && mentalHealth < 40) {
    conflicting.push(
      "High physical immunity + low mental health: body is resilient but psychological well-being requires separate, deliberate support",
    );
  }

  // Check if negative health inference contradicts positive
  const hasNegativeHealth = ctx.inferences.some(
    i => i.domain === "Health" && i.direction === "Negative" && i.confidence >= 65,
  );
  const hasPositiveHealth = ctx.inferences.some(
    i => i.domain === "Health" && i.direction === "Positive" && i.confidence >= 70,
  );
  if (hasNegativeHealth && hasPositiveHealth) {
    conflicting.push(
      "Strong positive health indicators co-exist with notable negative ones — the chart shows mixed constitutional signals; a nuanced, area-specific approach is recommended",
    );
  }

  const overallUncertainty: "Low" | "Medium" | "High" =
    // D6 missing is always significant — minimum Medium
    conflicting.length > 0 || missing.length >= 3 ? "High" :
    missing.length >= 1 || weak.length > 0 ? "Medium" : "Low";

  return { missingData: missing, weakEvidence: weak, conflictingEvidence: conflicting, overallUncertainty };
}

function computeHorizon(confidence: number, ctx: AstrologyContext): PredictionHorizon {
  if (ctx.dasha) {
    return {
      scope:       "CurrentDasha",
      label:       "Current Dasha Period",
      description: `Assessment is anchored to the current dasha cycle (ending ${ctx.dasha.periodEnd}). Re-evaluate when dasha changes.`,
    };
  }
  return {
    scope:       "LongTerm",
    label:       "Long-Term Natal Tendency",
    description: "Assessment reflects natal chart patterns — valid as a long-term tendency. Provide dasha periods for timing-specific guidance.",
  };
}

// ── Narrator translation helpers ──────────────────────────────────────────────
// These convert engine state (Layer 1) → pundit observations (Layer 2).
// The LLM narrator only sees Layer 2 and produces the human conversation (Layer 3).

function describeHealthState(state: string): string {
  const map: Record<string, string> = {
    "Highly Favorable": "Today is very supportive for health — energy and vitality are well-supported.",
    "Favorable":        "Today looks good for health overall — no significant concerns are indicated.",
    "Moderate":         "Today is reasonably balanced for health, with a few things worth being mindful of.",
    "Challenging":      "Today calls for some extra care — pace yourself and pay attention to your body.",
    "Highly Challenging": "Today is a more demanding day for health — rest, hydration, and self-care are especially important.",
  };
  return map[state] ?? "Today is reasonably balanced for health.";
}

// Hardcoded observations per transit rule — this is astrological knowledge, not algorithm.
const HEALTH_TRANSIT_OBSERVATIONS: Record<string, string> = {
  "transit-moon-1st-health":      "Energy and vitality get a small natural lift today (short-lived, ~2–3 days).",
  "transit-moon-6th-health":      "Digestion may be a little more sensitive than usual today (short-lived, ~2–3 days).",
  "transit-moon-8th-health":      "There may be a sense of hidden fatigue or emotional heaviness today (short-lived, ~2–3 days).",
  "transit-moon-12th-health":     "Sleep and rest may be unusually light or deep today — wind down early (short-lived, ~2–3 days).",
  "transit-moon-4th-health":      "Emotional comfort supports recovery today — staying in familiar surroundings helps (short-lived, ~2–3 days).",
  "transit-moon-5th-health":      "Mood and energy are slightly elevated today — a good day to stay gently active (short-lived, ~2–3 days).",
  "transit-moon-9th-health":      "Mental clarity and positive outlook are good today (short-lived, ~2–3 days).",
  "transit-jupiter-lagna-health": "A longer beneficial cycle is currently supporting overall constitution and vitality (ongoing).",
  "transit-jupiter-6th-health":   "Immune resilience and recovery are strengthened by a positive cycle right now (ongoing).",
  "transit-saturn-lagna-health":  "A slower, more demanding cycle is creating some background pressure on vitality — pace yourself (ongoing, months to years).",
  "transit-saturn-6th-health":    "Health responds best to consistent routine and discipline right now — structure is the key (ongoing, months to years).",
  "transit-saturn-8th-health":    "An ongoing cycle is drawing attention to chronic or underlying health matters — steady care matters (ongoing, months to years).",
  "transit-mars-6th-health":      "The immune system is in a more reactive state right now — avoid overexertion and support recovery (weeks to months).",
  "transit-mars-lagna-health":    "Physical drive and energy are elevated — good for activity, but avoid reckless effort (weeks to months).",
};

function buildHealthTransitNote(transit: import("../../core/transit-engine/types").TransitEvidence[]): string | null {
  if (!transit.length) return null;
  const lines = transit
    .filter(t => t.direction !== "Neutral")
    .map(t => HEALTH_TRANSIT_OBSERVATIONS[t.ruleId] ?? `${t.label} — ${t.direction.toLowerCase()} influence.`);
  return lines.length ? lines.join(" ") : null;
}

function buildStabilityNote(stability: import("../../core/transit-engine/types").TemporalStabilityScore | undefined): string | null {
  if (!stability) return null;
  if (stability.label === "Volatile")  return "Note: today's reading is shaped by a temporary short-lived influence. The longer-term health picture looks different from today.";
  if (stability.label === "Variable")  return "Note: today's picture differs somewhat from the longer-term pattern — this is partly driven by a passing influence.";
  return null; // Stable / Moderate: no need to qualify
}
