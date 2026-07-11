import { AstrologyContext, Hypothesis, AstrologicalEvidence, PlanetName } from "../types";
import { SymbolRegistry } from "./symbolRegistry";
import { HYPOTHESIS_DEFINITIONS } from "./hypotheses/definitions";

// HypothesisEngine derives abstract symbolic concepts (Hypotheses) from
// the current AstrologyContext. Each Hypothesis represents a cross-domain
// psychological/material capacity (e.g., Leadership Potential) that
// feeds into multiple domain engines with different relevance weights.
//
// Flow:
//   InferenceConclusion[] + YogaAnalysis + PlanetStrengths
//        ↓
//   HypothesisEngine.derive()
//        ↓
//   Hypothesis[] → stored in AstrologyContext.hypotheses
//        ↓
//   Career/Finance/Health domain engines filter by domain weight

export class HypothesisEngine {
  derive(ctx: AstrologyContext): Hypothesis[] {
    const sym    = new SymbolRegistry(ctx);
    const result: Hypothesis[] = [];

    for (const def of HYPOTHESIS_DEFINITIONS) {
      try {
        if (!def.test(ctx, sym)) continue;

        const confidence = Math.min(100, Math.max(0, def.computeConfidence(ctx, sym)));
        const provenance = def.computeProvenance(ctx, sym);

        // Collect evidence from matching inference conclusions
        const matchingConclusions = ctx.inferences.filter(c =>
          c.reasonCodes.some(rc => def.triggerReasonCodes.includes(rc)),
        );

        const sourceInferenceIds = matchingConclusions.map(c => c.id);

        // Supporting planets: any planet named in matching conclusions
        const planetSet = new Set(matchingConclusions.flatMap(c => c.planets));
        const supportingPlanets = [...planetSet];

        // Aggregate reason codes that fired for this hypothesis
        const reasonCodeSet = new Set(
          matchingConclusions.flatMap(c =>
            c.reasonCodes.filter(rc => def.triggerReasonCodes.includes(rc)),
          ),
        );
        const triggerReasonCodes = [...reasonCodeSet];

        // Evidence — synthesised from conclusions + yoga birthStrengths
        const evidence: AstrologicalEvidence[] = buildEvidence(ctx, def.id, confidence);

        result.push({
          id:                  def.id,
          label:               def.label,
          confidence,
          domains:             def.domains,
          supportingPlanets,
          triggerReasonCodes,
          sourceInferenceIds,
          provenance,
          evidence,
        });
      } catch {
        // Isolated hypothesis failure must not stop others
      }
    }

    return result.sort((a, b) => b.confidence - a.confidence);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildEvidence(
  ctx: AstrologyContext,
  hypothesisId: string,
  confidence: number,
): AstrologicalEvidence[] {
  const evidence: AstrologicalEvidence[] = [];

  // Highest-strength active yoga supporting this hypothesis
  const topYoga = ctx.yogaAnalysis.activations
    .filter(a => a.status === "Active" || a.status === "Peak")
    .sort((a, b) => b.activationScore - a.activationScore)[0];

  if (topYoga) {
    const promise = ctx.yogaAnalysis.birthPromises.find(p => p.id === topYoga.yogaId);
    if (promise) {
      evidence.push({
        id:          `hyp-${hypothesisId}-yoga`,
        category:    "Yoga",
        description: `${promise.name} (activation: ${topYoga.activationScore.toFixed(0)}%)`,
        strength:    topYoga.activationScore,
        weight:      1.0,
        sourceChart: "D1",
        planet:      promise.supportingPlanets[0],
      });
    }
  }

  // Overall hypothesis confidence as a synthesized strength evidence item
  evidence.push({
    id:          `hyp-${hypothesisId}-synthesis`,
    category:    "Strength",
    description: `Hypothesis '${hypothesisId}' derived with ${confidence.toFixed(0)}% confidence from chart synthesis`,
    strength:    confidence,
    weight:      0.5,
    sourceChart: "D1",
  });

  return evidence;
}
