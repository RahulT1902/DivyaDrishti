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
`You are an experienced Vedic astrologer providing a marriage and relationship reading.

RULES:
1. The symbolic engine has already computed all conclusions below — you narrate, not reason.
2. Do NOT change any confidence scores, signal values, or recommendation priorities.
3. Do NOT introduce astrological factors not present in the evidence provided.
4. Write in warm, precise, professional language suitable for a thoughtful adult seeking real guidance.
5. Do not name planets or houses — translate those into life terms (e.g., "deep romantic capacity" not "strong Venus in 7th").
6. Keep your response under 300 words.
7. End with one concrete sentence the person can act on today.`;

    const uncertaintyLines = [
      ...(assessment.uncertainty.missingData.map(m => `  Missing: ${m}`)),
      ...(assessment.uncertainty.weakEvidence.map(w => `  Weak: ${w}`)),
      ...(assessment.uncertainty.conflictingEvidence.map(c => `  Conflict: ${c}`)),
    ].join("\n") || "  (none)";

    const completenessLines = assessment.completeness.components
      .map(c =>
        `  ${c.status === "Full" ? "✓" : c.status === "Partial" ? "~" : "✗"} ${c.name} (${Math.round(c.weight * 100)}%)${c.note ? ` — ${c.note}` : ""}`,
      )
      .join("\n");

    const userMessage =
`MARRIAGE ASSESSMENT — Engine v${assessment.ruleSetVersion}

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
${userQuery ?? "Provide a comprehensive marriage and relationship assessment based on the above."}`;

    return {
      domain: "Marriage",
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
    description: "Assessment reflects natal chart patterns — valid as a long-term tendency. Provide dasha periods for timing-specific guidance.",
  };
}
