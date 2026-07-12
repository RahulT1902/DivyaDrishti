import { AstrologyContext, UncertaintyProfile, PredictionHorizon } from "../../core/types";
import { DomainEngine, DomainSignalEngine, RecommendationEngine, PromptContext, DomainSignal } from "../../core/domain";
import { DecisionGraphBuilder } from "../../core/decision-graph";
import { CORE_RULESET } from "../../core/inference-engine";
import { HEALTH_KNOWLEDGE_PACK } from "./knowledgePack";
import { HealthAssessment } from "./healthTypes";

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
    };
  }

  buildPrompt(assessment: HealthAssessment, userQuery?: string): PromptContext {
    const topSignals = [...assessment.signals]
      .sort((a, b) => b.score - a.score)
      .map(s => `  ${s.label}: ${s.score}/100`)
      .join("\n");

    const supportingList = assessment.supportingFactors.length > 0
      ? assessment.supportingFactors.map(f => `  • ${f.label} (${f.confidence}/100)`).join("\n")
      : "  (none identified)";

    const blockingList = assessment.blockingFactors.length > 0
      ? assessment.blockingFactors.map(f => `  • ${f.label} (${f.confidence}/100)`).join("\n")
      : "  (none identified)";

    const recsList = assessment.recommendations.length > 0
      ? assessment.recommendations.map(r =>
          `  ${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)} ${r.action}` +
          (r.timing ? ` [${r.timing}]` : ""),
        ).join("\n")
      : "  (no specific actions identified at this time)";

    const systemInstruction =
`You are an experienced Vedic astrologer providing a health reading.

RULES:
1. The symbolic engine has already computed all conclusions below — you narrate, not reason.
2. Do NOT change any confidence scores, signal values, or recommendation priorities.
3. Do NOT introduce astrological factors not present in the evidence provided.
4. Write in warm, precise, professional language suitable for a thoughtful adult seeking real guidance.
5. Do not name planets or houses — translate those into life terms (e.g., "constitutional resilience" not "strong lagna lord").
6. Keep your response under 300 words.
7. End with one concrete sentence the person can act on today.
8. Note: D6 (Shashtamsha) analysis is planned for Phase A and will add specificity to health timing — qualify timing statements accordingly.`;

    const uncertaintyLines = [
      ...(assessment.uncertainty.missingData.map(m => `  Missing: ${m}`)),
      ...(assessment.uncertainty.weakEvidence.map(w => `  Weak: ${w}`)),
      ...(assessment.uncertainty.conflictingEvidence.map(c => `  Conflict: ${c}`)),
    ].join("\n") || "  (none)";

    const completenessLines = assessment.completeness.components
      .map(c => `  ${c.status === "Full" ? "✓" : c.status === "Partial" ? "~" : "✗"} ${c.name} (${Math.round(c.weight * 100)}%)${c.note ? ` — ${c.note}` : ""}`)
      .join("\n");

    const userMessage =
`HEALTH ASSESSMENT — Engine v${assessment.ruleSetVersion}

OVERALL STATE: ${assessment.currentState}
CONFIDENCE: ${assessment.confidence}/100
HORIZON: ${assessment.horizon.label} — ${assessment.horizon.description}
UNCERTAINTY: ${assessment.uncertainty.overallUncertainty}

DOMAIN SIGNALS
${topSignals}

SUPPORTING FACTORS
${supportingList}

BLOCKING FACTORS
${blockingList}

TIMING: ${assessment.bestTiming.label}
${assessment.bestTiming.description}

RECOMMENDED ACTIONS
${recsList}

DATA QUALITY NOTES
${uncertaintyLines}

KNOWLEDGE COMPLETENESS: ${assessment.completeness.overall}/100
${completenessLines}
${assessment.completeness.missingComponents.length > 0
  ? `  → ${assessment.completeness.missingComponents.length} reasoning module(s) not yet applied. Scores are reliable within the applied model; see missing components above.`
  : "  → All available reasoning modules applied."}

EXPLAINABILITY: ${assessment.explainability.coverageScore}/100  (${assessment.explainability.fullyExplainable}/${assessment.explainability.total} fully traceable, ${assessment.explainability.partiallyExplainable} partial, ${assessment.explainability.opaque} opaque)
${assessment.temporalStability ? `
TEMPORAL STABILITY: ${assessment.temporalStability.label} (range: ${assessment.temporalStability.range} points across daily/weekly/monthly/yearly)
  Daily: ${assessment.temporalStability.scores.daily}  Weekly: ${assessment.temporalStability.scores.weekly}  Monthly: ${assessment.temporalStability.scores.monthly}  Yearly: ${assessment.temporalStability.scores.yearly}
  Insight: ${assessment.temporalStability.insight}
  → Use this to qualify your language: if Volatile, distinguish "today" from "this year". If Stable, one consistent reading applies across time horizons.` : ""}
---
${userQuery ?? "Provide a comprehensive health assessment based on the above."}`;

    return {
      domain: "Health",
      systemInstruction,
      userMessage,
    };
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
  // If dasha is available, the assessment is anchored to current dasha cycle
  if (ctx.dasha) {
    const dashaEnd = ctx.dasha.periodEnd;
    return {
      scope:       "CurrentDasha",
      label:       "Current Dasha Period",
      description: `Assessment is anchored to the current dasha cycle (ending ${dashaEnd}). Re-evaluate when dasha changes.`,
    };
  }

  // Without dasha, the assessment reflects natal patterns — long-term but less timing-specific
  return {
    scope:       "LongTerm",
    label:       "Long-Term Natal Tendency",
    description: "Assessment reflects natal chart patterns — valid as a long-term tendency. Provide dasha periods for timing-specific guidance.",
  };
}
