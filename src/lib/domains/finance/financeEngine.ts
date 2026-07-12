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
    // Pre-compute — LLM fills the template
    const overallLine = describeFinanceState(assessment.currentState);
    const moneyFlow   = assessment.supportingFactors[0]?.label ?? "Steady wealth-building potential";
    const risk        = assessment.blockingFactors[0]?.label   ?? null;
    const opportunity = assessment.supportingFactors[1]?.label ?? assessment.bestTiming.description;
    const timingNote  = assessment.bestTiming.description;
    const actions     = assessment.recommendations.slice(0, 2)
      .map(r => `• ${r.action}${r.timing ? ` (${r.timing})` : ""}`)
      .join("\n") || "• Track your expenses this month and avoid impulsive spending";

    const systemInstruction =
`You are writing a Vedic financial consultation for a premium mobile app.

RULES (mandatory):
1. Never mention: planet names, house numbers, yoga names, engine terms, scores, percentages.
2. The WHY THIS PERIOD sentence must be used verbatim from PUNDIT NOTES.
3. Output EXACTLY in this template — no extra text, no extra sections.
4. Be warm, honest, and direct. Do not be vague to avoid difficult truths.

OUTPUT TEMPLATE:

💰 Financial Outlook

Overall: [OVERALL LINE]

Money Flow

[Translate MONEY FLOW into 1–2 honest sentences about the current financial energy — income, spending, savings potential.]

${risk ? `Risk to Watch

[Translate RISK into 1–2 sentences. Be honest but not alarming.
Example: "There is some risk of unplanned expenses right now. Being a little careful before making large commitments will help."]

` : ""}Opportunity Right Now
[One sentence: what this period is specifically well-suited for — saving, investing, income growth, etc.]

Why this period?
[WHY THIS PERIOD — verbatim from notes]

Recommendation
[GUIDANCE BULLETS]

Outlook
[OUTLOOK LINE]`;

    const whyPeriod  = buildFinanceWhySentence(assessment.currentState, risk !== null);
    const outlookLine = buildFinanceOutlookLine(assessment.currentState);

    const userMessage =
`PUNDIT NOTES — use this content to fill the template:

OVERALL LINE: ${overallLine}

MONEY FLOW: ${moneyFlow}

${risk ? `RISK: ${risk}` : "RISK: None significant — omit the 'Risk to Watch' section entirely"}

OPPORTUNITY RIGHT NOW: ${opportunity}

TIMING: ${timingNote}

WHY THIS PERIOD (verbatim): ${whyPeriod}

GUIDANCE BULLETS:
${actions}

OUTLOOK LINE: ${outlookLine}

---
${userQuery ?? "How do my finances look right now?"}`;

    return { domain: "Finance", systemInstruction, userMessage };
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
    "Highly Favorable":   "Strong. The chart shows excellent conditions for financial growth and wealth-building right now.",
    "Favorable":          "Good. Financial energy is positive — a solid time to save, plan, and take measured steps.",
    "Moderate":           "Steady. Finances are moving along with genuine strengths and a few things to navigate carefully.",
    "Challenging":        "A more careful period — big financial moves deserve extra thought before acting.",
    "Highly Challenging": "Financial matters need careful handling right now — stability and patience matter more than ambition.",
  };
  return map[state] ?? "Finances look steady — slow and careful is the right approach now.";
}

function buildFinanceWhySentence(state: string, hasRisk: boolean): string {
  if (state === "Highly Favorable") return "A strong alignment of long-term chart patterns and current timing is supporting financial momentum — this is a genuine window for growth, not coincidence.";
  if (state === "Favorable")        return "The current period in your chart supports financial activity — conditions are supportive for saving, planning, and careful investment.";
  if (state === "Moderate")         return "The chart shows a consolidation period — what you save and build now is durable, even if big gains feel slower than expected.";
  if (state === "Challenging")      return "The current period asks for more caution and less reliance on big moves — the chart rewards careful, steady financial behaviour right now.";
  return hasRisk
    ? "This period calls for financial care and patience — steady management goes further than bold decisions right now."
    : "The current chart period supports steady, careful financial progress — what you plant now grows later.";
}

function buildFinanceOutlookLine(state: string): string {
  if (state === "Highly Favorable")   return "An excellent period for financial progress — make the most of this window.";
  if (state === "Favorable")          return "Financial outlook is positive. Stay consistent and take the opportunities that come your way.";
  if (state === "Moderate")           return "No major concern — steady progress is happening. The next active financial window is building.";
  if (state === "Challenging")        return "This phase will ease. Careful management now protects you for the stronger period ahead.";
  if (state === "Highly Challenging") return "A patient period — focus on stability and essentials. Things will settle and improve in time.";
  return "Finances look steady — continue with focus and care.";
}
