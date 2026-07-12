import { AstrologyContext, UncertaintyProfile, PredictionHorizon } from "../../core/types";
import { DomainEngine, DomainSignalEngine, RecommendationEngine, PromptContext, DomainSignal } from "../../core/domain";
import { DecisionGraphBuilder } from "../../core/decision-graph";
import { CORE_RULESET } from "../../core/inference-engine";
import { MARRIAGE_KNOWLEDGE_PACK } from "./knowledgePack";
import { MarriageAssessment } from "./marriageTypes";

// MarriageEngine follows the identical structural pattern as CareerEngine.
// Every domain engine (Finance, Marriage, Health, Education, Spirituality)
// follows this exact pattern:
//
//   1. Compute domain signals   — DomainSignalEngine + DomainKnowledgePack
//   2. Build decision graph     — DecisionGraphBuilder.buildForDomain("Marriage")
//   3. Generate recommendations — RecommendationEngine + DomainKnowledgePack
//   4. Assemble TAssessment     — MarriageAssessment (no planets, no houses)
//   5. Build narrator prompt    — buildPrompt() → tight PromptContext for LLM
//
// The engine does NOT:
//   - Inspect planets, houses, or yogas directly
//   - Call ActivationEngine, StrengthEngine, or InferenceEngine
//   - Compute dasha or transit conditions
//
// All of that is already in AstrologyContext when evaluate() is called.

export class MarriageEngine implements DomainEngine<MarriageAssessment> {
  readonly domain = "Marriage" as const;

  private readonly signalEngine         = new DomainSignalEngine();
  private readonly recommendationEngine = new RecommendationEngine();
  private readonly decisionGraphBuilder = new DecisionGraphBuilder();

  evaluate(ctx: AstrologyContext): MarriageAssessment {
    // ── Step 1: Domain signals ─────────────────────────────────────────────
    const signals = this.signalEngine.compute(ctx, MARRIAGE_KNOWLEDGE_PACK);

    // ── Step 2: Decision graph ─────────────────────────────────────────────
    const decisionGraph = this.decisionGraphBuilder.buildForDomain(ctx, "Marriage");

    // ── Step 3: Recommendations ────────────────────────────────────────────
    const recommendations = this.recommendationEngine.generate(
      signals, decisionGraph, MARRIAGE_KNOWLEDGE_PACK,
    );

    // ── Step 4: Convenience accessors ─────────────────────────────────────
    const sig = (id: string) => signals.find(s => s.id === id)?.score ?? 50;

    const risks = decisionGraph.blockingFactors.map(f => f.label);

    // ── Step 5: Uncertainty profile ───────────────────────────────────────
    const uncertainty = computeUncertainty(ctx, signals);

    // ── Step 6: Prediction horizon ────────────────────────────────────────
    const horizon = computeHorizon(decisionGraph.confidence, ctx);

    return {
      domain:               "Marriage",
      currentState:         decisionGraph.currentState,
      confidence:           decisionGraph.confidence,
      signals,
      marriagePotential:    sig("marriage-potential"),
      partnerCompatibility: sig("partner-compatibility"),
      romanticHarmony:      sig("romantic-harmony"),
      marriageStability:    sig("marriage-stability"),
      relationshipTiming:   sig("relationship-timing"),
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
    };
  }

  buildPrompt(assessment: MarriageAssessment, userQuery?: string): PromptContext {
    // Pre-compute — LLM fills the template
    const overallLine = describeMarriageState(assessment.currentState);
    const climate     = assessment.supportingFactors[0]?.label ?? "Genuine warmth and capacity for partnership";
    const tension     = assessment.blockingFactors[0]?.label   ?? null;
    const timingNote  = assessment.bestTiming.description;
    const actions     = assessment.recommendations.slice(0, 2)
      .map(r => `• ${r.action}`)
      .join("\n") || "• Prioritise open, honest communication in your closest relationships";

    const systemInstruction =
`You are writing a Vedic relationship consultation for a premium mobile app.

RULES (mandatory):
1. Never mention: planet names, house numbers, yoga names, engine terms, scores, percentages.
2. The WHY THIS PERIOD sentence must be used verbatim from PUNDIT NOTES.
3. Output EXACTLY in this template — no extra text, no extra sections.
4. Be warm, honest, and direct. Do not be vague to avoid difficult truths.

OUTPUT TEMPLATE:

💝 Relationship Outlook

Overall: [OVERALL LINE]

Emotional Climate

[Translate CLIMATE into 1–2 warm, honest sentences about the quality of emotional connection and relationship energy right now.]

${tension ? `Area to Navigate

[Translate CHALLENGE into 1–2 honest sentences about what deserves care or attention. Be clear, not alarming.
Never say "this means bad luck for marriage" — say "this is a period where X deserves extra care."]

` : ""}Communication
[One sentence on how communication and connection feel right now — easy and warm, or requiring more effort?]

Why this period?
[WHY THIS PERIOD — verbatim from notes]

Guidance
[GUIDANCE BULLETS]

Outlook
[OUTLOOK LINE]`;

    const whyPeriod  = buildMarriageWhySentence(assessment.currentState, tension !== null);
    const outlookLine = buildMarriageOutlookLine(assessment.currentState);

    const userMessage =
`PUNDIT NOTES — use this content to fill the template:

OVERALL LINE: ${overallLine}

CLIMATE: ${climate}

${tension ? `CHALLENGE: ${tension}` : "CHALLENGE: None — omit the 'Area to Navigate' section entirely"}

TIMING: ${timingNote}

WHY THIS PERIOD (verbatim): ${whyPeriod}

GUIDANCE BULLETS:
${actions}

OUTLOOK LINE: ${outlookLine}

---
${userQuery ?? "How do relationships and marriage look in my chart?"}`;

    return { domain: "Marriage", systemInstruction, userMessage };
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
  if ((ctx.chartSuite.D9?.planets?.length ?? 0) === 0) {
    missing.push("D9 (Navamsa) planets not computed — partner compatibility and D9 signals use D1 proxy");
  }

  // Weak evidence
  const marriageInferences = ctx.inferences.filter(i => i.domain === "Marriage");
  if (marriageInferences.length < 3) {
    weak.push(`Only ${marriageInferences.length} marriage inference rule(s) fired — limited signal diversity`);
  }
  const lowConfidenceSignals = signals.filter(s => s.confidence < 55);
  if (lowConfidenceSignals.length > 2) {
    weak.push(`Low evidence confidence on: ${lowConfidenceSignals.map(s => s.label).join(", ")}`);
  }

  // Conflicting evidence
  const marriagePotential = signals.find(s => s.id === "marriage-potential")?.score ?? 50;
  const delayRisk         = signals.find(s => s.id === "delay-risk")?.score         ?? 50;
  const romanticHarmony   = signals.find(s => s.id === "romantic-harmony")?.score   ?? 50;
  const stability         = signals.find(s => s.id === "marriage-stability")?.score  ?? 50;

  if (marriagePotential >= 72 && delayRisk >= 60) {
    conflicting.push(
      "High marriage potential + elevated delay risk: strong natal promise but timing obstacles are active — patience and remediation required",
    );
  }
  if (romanticHarmony >= 70 && stability < 40) {
    conflicting.push(
      "High romantic harmony + low marriage stability: intense attraction without structural durability — foundation-building before formalizing is advised",
    );
  }

  // Check for Kalatra Dosha contradicting positive marriage signals
  const kalatraDosha = ctx.inferences.some(
    i => (i.id === "marriage-saturn-7th" || i.id === "marriage-rahu-7th") && i.direction === "Mixed",
  );
  const hasStrongMarriageYoga = ctx.inferences.some(
    i => i.domain === "Marriage" && i.direction === "Positive" && i.confidence >= 70,
  );
  if (kalatraDosha && hasStrongMarriageYoga) {
    conflicting.push(
      "Strong marriage yoga (natal) vs. karmic obstacle in 7th house — promise is real but requires navigating relational karma with awareness",
    );
  }

  const overallUncertainty: "Low" | "Medium" | "High" =
    conflicting.length > 0 || missing.length >= 3 ? "High" :
    missing.length >= 1  || weak.length > 0        ? "Medium" : "Low";

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

function describeMarriageState(state: string): string {
  const map: Record<string, string> = {
    "Highly Favorable":   "Strong. The chart shows excellent support for love, partnership, and emotional connection right now.",
    "Favorable":          "Good. Relationship energy is warm and supportive — genuine connection is available.",
    "Moderate":           "Steady. Relationships are moving along with genuine strengths and a few things worth navigating.",
    "Challenging":        "A period that requires more care and intention in relationships — the potential is there, but communication matters more than usual.",
    "Highly Challenging": "A complex period for relationships — patience, understanding, and giving each other space are more valuable than pressure.",
  };
  return map[state] ?? "Relationship energy is present, with some nuance to navigate.";
}

function buildMarriageWhySentence(state: string, hasTension: boolean): string {
  if (state === "Highly Favorable") return "A deeply supportive period for emotional connection and partnership — the chart aligns well with closeness and commitment right now.";
  if (state === "Favorable")        return "The current period in your chart supports open-heartedness and meaningful connection — a good time to invest in your closest relationships.";
  if (state === "Moderate")         return "The chart shows a period where relationships reward effort and honest communication — not effortless, but deeply worthwhile.";
  if (state === "Challenging")      return "The current period brings some relational complexity — it is a time for understanding and patience, not pressure or urgency.";
  return hasTension
    ? "This period asks for more patience and care in relationships than usual — understanding goes further than urgency right now."
    : "The current chart period supports steady, genuine connection — warmth is available if you reach for it.";
}

function buildMarriageOutlookLine(state: string): string {
  if (state === "Highly Favorable")   return "An excellent time for deepening relationships, commitment, or beginning new ones.";
  if (state === "Favorable")          return "Relationships look warm and supportive. Nurture what you have and be open to what comes.";
  if (state === "Moderate")           return "Relationships are progressing steadily. Consistent communication and warmth will serve you well.";
  if (state === "Challenging")        return "This phase will ease. The relationship lessons of this period often create deeper bonds later.";
  if (state === "Highly Challenging") return "A patient period — prioritise understanding over resolution. Things will settle in time.";
  return "Steady progress in relationships. Stay warm and communicative.";
}
