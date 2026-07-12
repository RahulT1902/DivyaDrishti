import { AstrologyContext, UncertaintyProfile, PredictionHorizon } from "../../core/types";
import { DomainEngine, DomainSignalEngine, RecommendationEngine, PromptContext, DomainSignal } from "../../core/domain";
import { DecisionGraphBuilder } from "../../core/decision-graph";
import { CORE_RULESET } from "../../core/inference-engine";
import { CAREER_KNOWLEDGE_PACK } from "./knowledgePack";
import { CareerAssessment } from "./careerTypes";

// CareerEngine is the reference implementation of DomainEngine<T>.
// Every future domain engine (Finance, Marriage, Health, Education, Spirituality)
// follows this exact pattern:
//
//   1. Compute domain signals   — DomainSignalEngine + DomainKnowledgePack
//   2. Build decision graph     — DecisionGraphBuilder.buildForDomain("Career")
//   3. Generate recommendations — RecommendationEngine + DomainKnowledgePack
//   4. Assemble TAssessment     — CareerAssessment (no planets, no houses)
//   5. Build narrator prompt    — buildPrompt() → tight PromptContext for LLM
//
// The engine does NOT:
//   - Inspect planets, houses, or yogas directly
//   - Call ActivationEngine, StrengthEngine, or InferenceEngine
//   - Compute dasha or transit conditions
//
// All of that is already in AstrologyContext when evaluate() is called.

export class CareerEngine implements DomainEngine<CareerAssessment> {
  readonly domain = "Career" as const;

  private readonly signalEngine          = new DomainSignalEngine();
  private readonly recommendationEngine  = new RecommendationEngine();
  private readonly decisionGraphBuilder  = new DecisionGraphBuilder();

  evaluate(ctx: AstrologyContext): CareerAssessment {
    // ── Step 1: Domain signals ─────────────────────────────────────────────
    const signals = this.signalEngine.compute(ctx, CAREER_KNOWLEDGE_PACK);

    // ── Step 2: Decision graph ────────────────────────────────────────────
    const decisionGraph = this.decisionGraphBuilder.buildForDomain(ctx, "Career");

    // ── Step 3: Recommendations ───────────────────────────────────────────
    const recommendations = this.recommendationEngine.generate(
      signals, decisionGraph, CAREER_KNOWLEDGE_PACK,
    );

    // ── Step 4: Convenience accessors ─────────────────────────────────────
    const sig = (id: string) => signals.find(s => s.id === id)?.score ?? 50;

    const risks = decisionGraph.blockingFactors.map(f => f.label);

    // ── Step 5: Uncertainty profile ───────────────────────────────────────
    const uncertainty = computeUncertainty(ctx, signals);

    // ── Step 6: Prediction horizon ────────────────────────────────────────
    const horizon = computeHorizon(decisionGraph.confidence, ctx);

    return {
      domain:                    "Career",
      currentState:              decisionGraph.currentState,
      confidence:                decisionGraph.confidence,
      signals,
      leadershipPotential:       sig("leadership"),
      entrepreneurshipPotential: sig("entrepreneurship"),
      jobStability:              sig("job-stability"),
      promotionPotential:        sig("promotion-potential"),
      growthPotential:           sig("professional-growth"),
      bestTiming:                decisionGraph.timing,
      supportingFactors:         decisionGraph.supportingFactors,
      blockingFactors:           decisionGraph.blockingFactors,
      risks,
      recommendations,
      decisionGraph,
      uncertainty,
      horizon,
      completeness:              ctx.completeness,
      explainability:            ctx.explainability,
      ruleSetVersion:            CORE_RULESET.version,
    };
  }

  buildPrompt(assessment: CareerAssessment, userQuery?: string): PromptContext {
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
`You are an experienced Vedic astrologer providing a career reading.

RULES:
1. The symbolic engine has already computed all conclusions below — you narrate, not reason.
2. Do NOT change any confidence scores, signal values, or recommendation priorities.
3. Do NOT introduce astrological factors not present in the evidence provided.
4. Write in warm, precise, professional language suitable for a thoughtful adult seeking real guidance.
5. Do not name planets or houses — translate those into life terms (e.g., "organizational leadership" not "strong Sun in 10th").
6. Keep your response under 300 words.
7. End with one concrete sentence the person can act on today.`;

    const uncertaintyLines = [
      ...(assessment.uncertainty.missingData.map(m => `  Missing: ${m}`)),
      ...(assessment.uncertainty.weakEvidence.map(w => `  Weak: ${w}`)),
      ...(assessment.uncertainty.conflictingEvidence.map(c => `  Conflict: ${c}`)),
    ].join("\n") || "  (none)";

    const completenessLines = assessment.completeness.components
      .map(c => `  ${c.status === "Full" ? "✓" : c.status === "Partial" ? "~" : "✗"} ${c.name} (${Math.round(c.weight * 100)}%)${c.note ? ` — ${c.note}` : ""}`)
      .join("\n");

    const userMessage =
`CAREER ASSESSMENT — Engine v${assessment.ruleSetVersion}

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

---
${userQuery ?? "Provide a comprehensive career assessment based on the above."}`;

    return {
      domain: "Career",
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

  // Missing data
  if (!ctx.dasha) {
    missing.push("Dasha periods not provided — maha/antardasha contribution is 0");
  }
  if (!ctx.transit) {
    missing.push("Current transit positions not provided — transit component is 0");
  }
  const d10StrengthsMissing = (ctx.chartSuite.D10?.strengths?.length ?? 0) === 0;
  if (d10StrengthsMissing) {
    missing.push("D10 (Dashamsa) Shadbala not computed — D10 signals use D1 strength proxy");
  }
  const hasKalaBala = ctx.planetStrengths.some(
    s => Object.keys(s.components ?? {}).some(k => k.toLowerCase().includes("kala")),
  );
  if (!hasKalaBala) {
    missing.push("Kala Bala (temporal strength) not computed — planet strength scores are partial");
  }

  // Weak evidence
  const careerInferences = ctx.inferences.filter(i => i.domain === "Career");
  if (careerInferences.length < 3) {
    weak.push(`Only ${careerInferences.length} career inference rule(s) fired — limited signal diversity`);
  }
  const lowConfidenceSignals = signals.filter(s => s.confidence < 55);
  if (lowConfidenceSignals.length > 2) {
    weak.push(`Low evidence confidence on: ${lowConfidenceSignals.map(s => s.label).join(", ")}`);
  }

  // Conflicting evidence
  const leadership  = signals.find(s => s.id === "leadership")?.score    ?? 50;
  const stability   = signals.find(s => s.id === "job-stability")?.score  ?? 50;
  const promotion   = signals.find(s => s.id === "promotion-potential")?.score ?? 50;

  if (leadership >= 72 && stability < 38) {
    conflicting.push(
      "High leadership potential + low job stability: strong career drive, but structured employment may not be the right vehicle — entrepreneurship or consulting warranted",
    );
  }
  if (promotion >= 70 && leadership < 40) {
    conflicting.push(
      "High promotion potential + low leadership: advancement through specialist depth rather than managerial authority",
    );
  }

  // Check D10 10th afflicted rule contradicting positive signals
  const d10Afflicted = ctx.inferences.some(
    i => i.id === "career-d10-10th-afflicted" && i.direction === "Negative",
  );
  const hasStrongCareerYoga = ctx.inferences.some(
    i => i.domain === "Career" && i.direction === "Positive" && i.confidence >= 70,
  );
  if (d10Afflicted && hasStrongCareerYoga) {
    conflicting.push(
      "Strong career yoga (D1) vs. afflicted D10 10th house — natal promise is strong but professional environment may present structural friction",
    );
  }

  const overallUncertainty: "Low" | "Medium" | "High" =
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
