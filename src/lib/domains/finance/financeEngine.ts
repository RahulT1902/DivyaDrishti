import { AstrologyContext, UncertaintyProfile, PredictionHorizon } from "../../core/types";
import {
  DomainEngine, DomainSignalEngine, RecommendationEngine,
  PromptContext, DomainSignal,
} from "../../core/domain";
import { DecisionGraphBuilder } from "../../core/decision-graph";
import { CORE_RULESET } from "../../core/inference-engine";
import { FINANCE_KNOWLEDGE_PACK } from "./knowledgePack";
import { FinanceAssessment } from "./financeTypes";

// FinanceEngine follows the reference pattern of CareerEngine exactly.
// Every domain engine (Finance, Marriage, Health, Education, Spirituality)
// follows this pattern:
//
//   1. Compute domain signals   — DomainSignalEngine + FINANCE_KNOWLEDGE_PACK
//   2. Build decision graph     — DecisionGraphBuilder.buildForDomain("Finance")
//   3. Generate recommendations — RecommendationEngine + FINANCE_KNOWLEDGE_PACK
//   4. Assemble FinanceAssessment (no planets, no houses)
//   5. Build narrator prompt    — buildPrompt() → tight PromptContext for LLM
//
// Signal grounding: Finance signals tap the Wealth inference layer via the
// hypothesis system. The "wealth-generation" hypothesis (Finance weight: 0.95)
// accumulates confidence from WEALTH_RULES conclusions regardless of domain —
// hypotheses are cross-domain. Finance signals pick up WEALTH_DHANA,
// WEALTH_ACCUMULATION, INCOME_GAINS, FINANCIAL_STABILITY, WEALTH_JUPITER,
// WEALTH_VENUS, WEALTH_CHALLENGE, and WEALTH_FORTUNE reason codes.
//
// D2 (Hora chart) analysis is planned for Phase A. Until then, signals use
// D1 natal chart inference as the sole source of wealth-specific data.

export class FinanceEngine implements DomainEngine<FinanceAssessment> {
  readonly domain = "Finance" as const;

  private readonly signalEngine          = new DomainSignalEngine();
  private readonly recommendationEngine  = new RecommendationEngine();
  private readonly decisionGraphBuilder  = new DecisionGraphBuilder();

  evaluate(ctx: AstrologyContext): FinanceAssessment {
    // ── Step 1: Domain signals ─────────────────────────────────────────────
    // DomainSignalEngine blends:
    //   - Hypothesis confidence (wealth-generation, adversity-resilience, etc.)
    //     filtered to hypotheses whose domains map includes "Finance"
    //   - InferenceConclusion confidence matched by reason codes from WEALTH_RULES
    const signals = this.signalEngine.compute(ctx, FINANCE_KNOWLEDGE_PACK);

    // ── Step 2: Decision graph ────────────────────────────────────────────
    const decisionGraph = this.decisionGraphBuilder.buildForDomain(ctx, "Finance");

    // ── Step 3: Recommendations ───────────────────────────────────────────
    const recommendations = this.recommendationEngine.generate(
      signals, decisionGraph, FINANCE_KNOWLEDGE_PACK,
    );

    // ── Step 4: Convenience accessors ─────────────────────────────────────
    const sig = (id: string) => signals.find(s => s.id === id)?.score ?? 50;

    const risks = decisionGraph.blockingFactors.map(f => f.label);

    // ── Step 5: Uncertainty profile ───────────────────────────────────────
    const uncertainty = computeUncertainty(ctx, signals);

    // ── Step 6: Prediction horizon ────────────────────────────────────────
    const horizon = computeHorizon(decisionGraph.confidence, ctx);

    return {
      domain:             "Finance",
      currentState:       decisionGraph.currentState,
      confidence:         decisionGraph.confidence,
      signals,
      wealthAccumulation: sig("wealth-accumulation"),
      incomePotential:    sig("income-potential"),
      investmentAptitude: sig("investment-aptitude"),
      financialStability: sig("financial-stability"),
      luckFactor:         sig("luck-factor"),
      debtRisk:           sig("debt-risk"),
      bestTiming:         decisionGraph.timing,
      supportingFactors:  decisionGraph.supportingFactors,
      blockingFactors:    decisionGraph.blockingFactors,
      risks,
      recommendations,
      decisionGraph,
      uncertainty,
      horizon,
      completeness:       ctx.completeness,
      explainability:     ctx.explainability,
      ruleSetVersion:     CORE_RULESET.version,
    };
  }

  buildPrompt(assessment: FinanceAssessment, userQuery?: string): PromptContext {
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
`You are an experienced Vedic astrologer providing a finance and wealth reading.

RULES:
1. The symbolic engine has already computed all conclusions below — you narrate, not reason.
2. Do NOT change any confidence scores, signal values, or recommendation priorities.
3. Do NOT introduce astrological factors not present in the evidence provided.
4. Write in warm, precise, professional language suitable for a thoughtful adult seeking real financial guidance.
5. Do not name planets or houses — translate those into life terms (e.g., "financial fortune is strongly supported" not "9th lord in 10th house").
6. Keep your response under 300 words.
7. End with one concrete financial action the person can take today.
8. Note: D2 (Hora chart for wealth) analysis is planned for Phase A — current assessment is based on D1 natal chart patterns.`;

    const uncertaintyLines = [
      ...(assessment.uncertainty.missingData.map(m => `  Missing: ${m}`)),
      ...(assessment.uncertainty.weakEvidence.map(w => `  Weak: ${w}`)),
      ...(assessment.uncertainty.conflictingEvidence.map(c => `  Conflict: ${c}`)),
    ].join("\n") || "  (none)";

    const completenessLines = assessment.completeness.components
      .map(c =>
        `  ${c.status === "Full" ? "✓" : c.status === "Partial" ? "~" : "✗"} ${c.name} (${Math.round(c.weight * 100)}%)` +
        (c.note ? ` — ${c.note}` : ""),
      )
      .join("\n");

    const userMessage =
`FINANCE ASSESSMENT — Engine v${assessment.ruleSetVersion}

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

PHASE A NOTE: D2 (Hora chart for wealth) analysis is not yet applied. When available, D2-specific planetary strengths and house placements will add a dedicated wealth-chart signal layer, improving accuracy for wealth accumulation and inheritance assessments.

---
${userQuery ?? "Provide a comprehensive finance and wealth assessment based on the above."}`;

    return {
      domain: "Finance",
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

  // ── Missing data ─────────────────────────────────────────────────────────

  if (!ctx.dasha) {
    missing.push("Dasha periods not provided — maha/antardasha contribution is 0");
  }
  if (!ctx.transit) {
    missing.push("Current transit positions not provided — transit component is 0");
  }

  // D2 (Hora chart) is the primary varga for wealth; flag if its strengths are absent
  const d2StrengthsMissing = (ctx.chartSuite.D2?.strengths?.length ?? 0) === 0;
  if (d2StrengthsMissing) {
    missing.push(
      "D2 (Hora chart for wealth) Shadbala not computed — D2-specific wealth signals unavailable; D1 strength used as proxy (Phase A will address this)",
    );
  }

  const hasKalaBala = ctx.planetStrengths.some(
    s => Object.keys(s.components ?? {}).some(k => k.toLowerCase().includes("kala")),
  );
  if (!hasKalaBala) {
    missing.push("Kala Bala (temporal strength) not computed — planet strength scores are partial");
  }

  // ── Weak evidence ─────────────────────────────────────────────────────────

  const wealthInferences = ctx.inferences.filter(i => i.domain === "Wealth");
  if (wealthInferences.length === 0) {
    missing.push("No wealth inference rules fired — finance signals derived from hypotheses only");
  } else if (wealthInferences.length < 3) {
    weak.push(
      `Only ${wealthInferences.length} wealth inference rule(s) fired — limited financial signal diversity`,
    );
  }

  const lowConfidenceSignals = signals.filter(s => s.confidence < 55);
  if (lowConfidenceSignals.length > 2) {
    weak.push(
      `Low evidence confidence on: ${lowConfidenceSignals.map(s => s.label).join(", ")}`,
    );
  }

  // ── Conflicting evidence ──────────────────────────────────────────────────

  const wealthAcc  = signals.find(s => s.id === "wealth-accumulation")?.score ?? 50;
  const debtRisk   = signals.find(s => s.id === "debt-risk")?.score           ?? 50;
  const stability  = signals.find(s => s.id === "financial-stability")?.score  ?? 50;
  const luckFactor = signals.find(s => s.id === "luck-factor")?.score          ?? 50;

  if (wealthAcc >= 70 && debtRisk >= 60) {
    conflicting.push(
      "High wealth accumulation potential + elevated debt risk: wealth-building capacity exists but financial discipline is critical to prevent liability accumulation",
    );
  }
  if (luckFactor >= 72 && stability < 38) {
    conflicting.push(
      "High luck factor + low financial stability: fortune-driven gains may be irregular — build structural foundations alongside windfall opportunities",
    );
  }

  // Negative wealth inference vs. positive wealth signals
  const negativeWealthInference = ctx.inferences.some(
    i => i.id === "wealth-2nd-11th-weak" && i.direction === "Negative",
  );
  const hasStrongWealthSignal = signals.some(
    s => (s.id === "wealth-accumulation" || s.id === "income-potential") && s.score >= 65,
  );
  if (negativeWealthInference && hasStrongWealthSignal) {
    conflicting.push(
      "Weak 2nd/11th lords (inference) vs. strong wealth signals: chart has mixed indicators — some wealth channels are open but structural wealth accumulation has constraints",
    );
  }

  const overallUncertainty: "Low" | "Medium" | "High" =
    conflicting.length > 0 || missing.length >= 3 ? "High" :
    missing.length >= 1  || weak.length > 0        ? "Medium" : "Low";

  return {
    missingData:         missing,
    weakEvidence:        weak,
    conflictingEvidence: conflicting,
    overallUncertainty,
  };
}

function computeHorizon(confidence: number, ctx: AstrologyContext): PredictionHorizon {
  // If dasha is available, the assessment is anchored to the current dasha cycle
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
    description: "Assessment reflects natal chart patterns — valid as a long-term tendency. Provide dasha periods for timing-specific financial guidance.",
  };
}
