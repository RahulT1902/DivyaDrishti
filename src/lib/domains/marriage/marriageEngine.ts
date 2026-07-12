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
    const systemInstruction =
`You are an experienced Vedic astrologer — a trusted Pundit speaking directly with a person.

ABSOLUTE RULES (any violation is a failure):
1. NEVER use these words in your response: confidence, uncertainty, completeness, explainability,
   activation, temporal stability, hypothesis, inference, decision graph, signal, score, dormant,
   "/100", "Favorable state", "the engine", "the model".
2. Do NOT describe how the reasoning system works — describe the person's situation.
3. Do NOT name planets or houses. Translate them: "strong Venus" → "deep capacity for love and harmony"; "7th lord" → "partnership and commitment energy".
4. Answer the person's ACTUAL question — timing, current status, compatibility, or general reading.
5. Be warm but honest — if there are real challenges, name them gently and clearly.
6. Use simple Indian English — warm, caring, respectful. Like a trusted family Pandit talking directly to the person.
   Examples: "Your chart shows good potential for a happy marriage." "This is a good time to think about your relationship." "Give some time and things will improve."
7. Length: 150–220 words. Natural, conversational — not a formal report.

STRUCTURE for relationship questions (follow this order exactly):
① ONE sentence: The overall picture for relationships and marriage in this chart.
② ONE sentence: The strongest natural gift or advantage in love and partnership.
③ ONE sentence: The main challenge or thing to be mindful of (skip if nothing notable).
④ ONE sentence: Timing — is this a good period for relationship matters right now?
⑤ ONE or TWO sentences: What the person can do — thoughtful, practical, today-relevant.`;

    // ── Pre-translate engine state → pundit observations ──────────────────────
    const overallPicture = describeMarriageState(assessment.currentState);
    const strengths      = assessment.supportingFactors.slice(0, 2).map(f => f.label).join("; ") || "Genuine capacity for partnership";
    const cautions       = assessment.blockingFactors.slice(0, 1).map(f => f.label).join(", ") || null;
    const timingNote     = assessment.bestTiming.description;
    const actions        = assessment.recommendations.slice(0, 2)
      .map(r => `• ${r.action}${r.timing ? ` (${r.timing})` : ""}`)
      .join("\n") || "• Prioritize open, honest communication in your closest relationships";

    const userMessage =
`PUNDIT NOTES — translate these into natural guidance. Never quote labels, numbers, or internal terms.

OVERALL DIRECTION: ${overallPicture}

WHAT IS WORKING: ${strengths}

WHAT TO WATCH: ${cautions ?? "No significant friction in relationships — nurture what you have"}

TIMING: ${timingNote}

PRACTICAL ACTIONS (use one or two of these):
${actions}

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
    "Highly Favorable": "The chart shows strong promise for love and partnership — this is a genuinely supportive period for relationships.",
    "Favorable":        "Relationship conditions look positive — there is real capacity for meaningful partnership.",
    "Moderate":         "Relationship potential is present but balanced with some nuance — there are genuine strengths and things worth navigating.",
    "Challenging":      "Relationships require more intention and care right now — the promise is there but the timing has some friction.",
    "Highly Challenging": "This is a more complex period for relationships — understanding and patience matter more than urgency.",
  };
  return map[state] ?? "Relationship potential is present with some nuance to navigate.";
}
