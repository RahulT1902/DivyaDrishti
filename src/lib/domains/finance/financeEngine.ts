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
    const systemInstruction =
`You are an experienced Vedic astrologer — a trusted family Pandit speaking directly with a person.

ABSOLUTE RULES (any violation is a failure):
1. NEVER use these words in your response: confidence, uncertainty, completeness, explainability,
   activation, temporal stability, hypothesis, inference, decision graph, signal, score, dormant,
   "/100", "Favorable state", "the engine", "the model".
2. Do NOT describe how the reasoning system works — describe the person's situation.
3. Do NOT name planets or houses. Translate them into plain life terms.
4. Answer the person's ACTUAL question — growth, timing, savings, income, investment, or general wealth.
5. Use simple Indian English — warm, direct, clear. Like a trusted Pandit talking to a person, not a finance report.
   Examples: "Your chart shows good potential for saving money." "This is not a good time to take big financial risks." "Slow and steady will work well for you now."
6. Length: 150–220 words. Natural, caring, honest.

STRUCTURE for finance questions (follow this order exactly):
① ONE sentence: What the chart says about finances right now overall.
② ONE sentence: The strongest financial advantage or opportunity this person has.
③ ONE sentence: The main thing to be careful about (skip if nothing notable).
④ ONE sentence: Timing — is this a good period to act, invest, or wait?
⑤ ONE or TWO sentences: What to do — simple, practical, actionable.`;

    // ── Pre-translate engine state → pundit observations ──────────────────────
    const overallPicture = describeFinanceState(assessment.currentState);
    const strengths      = assessment.supportingFactors.slice(0, 2).map(f => f.label).join("; ") || "Steady wealth-building potential";
    const cautions       = assessment.blockingFactors.slice(0, 1).map(f => f.label).join(", ") || null;
    const timingNote     = assessment.bestTiming.description;
    const actions        = assessment.recommendations.slice(0, 2)
      .map(r => `• ${r.action}${r.timing ? ` (${r.timing})` : ""}`)
      .join("\n") || "• Track your expenses this month and avoid impulsive spending";

    const userMessage =
`PUNDIT NOTES — translate these into natural guidance. Never quote labels, numbers, or internal terms.

OVERALL DIRECTION: ${overallPicture}

WHAT IS WORKING: ${strengths}

WHAT TO WATCH: ${cautions ?? "No major financial risks indicated right now"}

TIMING: ${timingNote}

PRACTICAL ACTIONS (use one or two of these):
${actions}

---
${userQuery ?? "How do my finances look right now?"}`;

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
    description: "Assessment reflects natal chart patterns — valid as a long-term tendency. Provide dasha periods for timing-specific financial guidance.",
  };
}

function describeFinanceState(state: string): string {
  const map: Record<string, string> = {
    "Highly Favorable": "Your chart is showing very good indications for financial growth right now.",
    "Favorable":        "Things are looking positive for money and finances — good time to save and plan.",
    "Moderate":         "Finances are reasonably steady, with some good potential and a few things to be careful about.",
    "Challenging":      "This is not the easiest time for big financial moves — caution and patience will serve you better.",
    "Highly Challenging": "Financial matters need careful handling right now — avoid big risks and focus on stability.",
  };
  return map[state] ?? "Finances look steady — slow and careful is the right approach now.";
}
