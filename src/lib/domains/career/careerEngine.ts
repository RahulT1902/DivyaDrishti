import { AstrologyContext } from "../../core/types";
import { DomainEngine, DomainSignalEngine, RecommendationEngine, PromptContext } from "../../core/domain";
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

    const userMessage =
`CAREER ASSESSMENT — Engine v${assessment.ruleSetVersion}

OVERALL STATE: ${assessment.currentState}
CONFIDENCE: ${assessment.confidence}/100

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

---
${userQuery ?? "Provide a comprehensive career assessment based on the above."}`;

    return {
      domain: "Career",
      systemInstruction,
      userMessage,
    };
  }
}
