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
    const systemInstruction =
`You are an experienced Vedic astrologer — a trusted Pundit speaking directly with a person.

ABSOLUTE RULES (any violation is a failure):
1. NEVER use these words in your response: confidence, uncertainty, completeness, explainability,
   activation, temporal stability, hypothesis, inference, decision graph, signal, score, dormant,
   "/100", "Favorable state", "the engine", "the model".
2. Do NOT describe how the reasoning system works — describe the person's situation.
3. Do NOT name planets or houses. Translate them: "10th lord strong" → "career ambitions are well-supported".
4. Answer the person's ACTUAL question. Do not give a generic overview if they ask about timing.
5. Do NOT write sentences that could apply to anyone.
6. Use simple Indian English — clear, warm, direct. Like a trusted Pandit talking to a person, not writing a report.
   Examples: "This is a good time for you to focus on your work." "There may be some delay, but do not worry." "Keep doing your work sincerely."
7. Length: 150–220 words. Natural, conversational.

STRUCTURE for career questions (follow this order exactly):
① ONE sentence: The current overall direction for career — what the chart indicates right now.
② ONE sentence: The strongest advantage the person has in their professional life.
③ ONE sentence: The one real friction point or thing to be aware of (skip if nothing notable).
④ ONE sentence: Timing note — is this a sustained period or a passing window?
⑤ ONE or TWO sentences: What to actually do — specific, actionable, today-relevant.`;

    // ── Pre-translate engine state → pundit observations ──────────────────────
    const overallPicture = describeCareerState(assessment.currentState);
    const strengths      = assessment.supportingFactors.slice(0, 2).map(f => f.label).join("; ") || "Solid foundational chart indicators";
    const cautions       = assessment.blockingFactors.slice(0, 1).map(f => f.label).join(", ") || null;
    const timingNote     = assessment.bestTiming.description;
    const actions        = assessment.recommendations.slice(0, 2)
      .map(r => `• ${r.action}${r.timing ? ` (${r.timing})` : ""}`)
      .join("\n") || "• Stay consistent and document your work — visibility matters now";

    const userMessage =
`PUNDIT NOTES — translate these into natural guidance. Never quote labels, numbers, or internal terms.

OVERALL DIRECTION: ${overallPicture}

WHAT IS WORKING: ${strengths}

WHAT TO WATCH: ${cautions ?? "No significant friction identified — focus on momentum"}

TIMING: ${timingNote}

PRACTICAL ACTIONS (use one or two of these):
${actions}

---
${userQuery ?? "How does my career look right now?"}`;

    return { domain: "Career", systemInstruction, userMessage };
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

function describeCareerState(state: string): string {
  const map: Record<string, string> = {
    "Highly Favorable": "The chart strongly supports career ambitions right now — this is an active, productive period.",
    "Favorable":        "Career conditions look positive — energy and opportunity are generally supportive.",
    "Moderate":         "Career is moving along steadily, with some genuine strengths and a few things to navigate.",
    "Challenging":      "Career requires deliberate effort right now — momentum is possible but not automatic.",
    "Highly Challenging": "This is a more testing period for career — patience, strategy, and consistency matter more than ambition.",
  };
  return map[state] ?? "Career conditions are mixed — steady effort is the key.";
}
