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
    // Pre-compute — LLM fills the template
    const overallLine = describeCareerState(assessment.currentState);
    const opportunity = assessment.supportingFactors[0]?.label ?? "Consistent effort is building long-term credibility";
    const challenge   = assessment.blockingFactors[0]?.label   ?? null;
    const timingNote  = assessment.bestTiming.description;
    const actions     = assessment.recommendations.slice(0, 2)
      .map(r => `• ${r.action}`)
      .join("\n") || "• Focus on quality and visibility — both matter equally now";

    const systemInstruction =
`You are writing a Vedic career consultation for a premium mobile app.

RULES (mandatory):
1. Never mention: planet names, house numbers, yoga names, engine terms, scores, percentages.
2. The WHY THIS PERIOD sentence must be used verbatim from PUNDIT NOTES.
3. Output EXACTLY in this template — no extra text, no extra sections.

OUTPUT TEMPLATE:

💼 Career Outlook

Overall: [OVERALL LINE]

Main Opportunity

[Translate the OPPORTUNITY into a 1–2 sentence human observation. Be specific and direct.
Example: "This is a real window for career advancement — your chart is showing strong support for
recognition and growth. If you've been waiting to have a key conversation or push for a bigger role,
now is a good time to do it."]

${challenge ? `Main Challenge

[Translate the CHALLENGE into 1–2 sentences. Be honest but not alarming.
Example: "The chart also shows some friction around recognition — what you achieve may not be
immediately acknowledged. Keep doing the work regardless — the results will show up."]

` : ""}Best Period For
[One sentence: what is this period specifically suited for — boldness, patience, learning, visibility, etc.]

Why this period?
[WHY THIS PERIOD — verbatim from notes]

Recommended Action
[GUIDANCE BULLETS]

Outlook
[OUTLOOK LINE]`;

    const whyPeriod = buildCareerWhySentence(assessment.currentState, challenge !== null);
    const outlookLine = buildCareerOutlookLine(assessment.currentState, timingNote);

    const userMessage =
`PUNDIT NOTES — use this content to fill the template:

OVERALL LINE: ${overallLine}

OPPORTUNITY: ${opportunity}

${challenge ? `CHALLENGE: ${challenge}` : "CHALLENGE: None significant — omit that section"}

TIMING / BEST PERIOD FOR: ${timingNote}

WHY THIS PERIOD (verbatim): ${whyPeriod}

GUIDANCE BULLETS:
${actions}

OUTLOOK LINE: ${outlookLine}

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
    "Highly Favorable":   "Strong. The chart is actively supporting career growth and recognition right now.",
    "Favorable":          "Good. Career conditions are positive — energy and opportunity are supportive.",
    "Moderate":           "Steady. Career is moving forward with some genuine strengths and a few things to navigate.",
    "Challenging":        "A more effortful period — momentum is possible but requires deliberate work.",
    "Highly Challenging": "A testing period — patience and consistency matter more than ambition right now.",
  };
  return map[state] ?? "Mixed — steady effort is the key right now.";
}

function buildCareerWhySentence(state: string, hasChallenge: boolean): string {
  if (state === "Highly Favorable") return "A strong combination of long-term chart patterns and current timing is creating genuine career momentum — this window is real, not coincidental.";
  if (state === "Favorable")        return "The current period in your chart aligns well with career growth — the foundation is solid and the timing is supportive.";
  if (state === "Moderate")         return "The chart shows a period of consolidation — what you build now is durable, even if results feel slower than expected.";
  if (state === "Challenging")      return "The current period asks for more discipline and less reliance on external validation — the chart rewards consistency over ambition right now.";
  return "The current period favors steady, deliberate work over bold moves — what you plant now grows later.";
}

function buildCareerOutlookLine(state: string, timingNote: string): string {
  if (state === "Highly Favorable")   return "This is a genuinely active career window — make the most of it.";
  if (state === "Favorable")          return "Career prospects are good. Stay consistent and take the opportunities that come.";
  if (state === "Moderate")           return "No major concern — progress is steady. The next active window is coming.";
  if (state === "Challenging")        return "This phase will pass. Keep building — what you create in a difficult period has lasting value.";
  if (state === "Highly Challenging") return "A patient period. Focus on skill and relationships — these will matter when the next cycle opens.";
  return timingNote || "Career looks steady — continue with focus and consistency.";
}
