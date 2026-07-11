import { AstrologyContext } from "../types";
import { DomainKnowledgePack, DomainSignal, SignalMapping } from "./contract";

// DomainSignalEngine computes DomainSignal[] from the AstrologyContext
// using a declarative DomainKnowledgePack.
//
// For each SignalMapping it:
//   1. Finds matching Hypotheses and averages their confidence (weighted by domain relevance)
//   2. Finds matching InferenceConclusions by reasonCode and averages their confidence
//   3. Blends the two scores using hypothesisWeight / inferenceWeight
//
// This means the signal is grounded in two independent evidence streams:
//   - Structural (natal yoga quality) via Hypotheses
//   - Functional (rule-fired conclusions) via Inferences

export class DomainSignalEngine {
  compute(ctx: AstrologyContext, pack: DomainKnowledgePack): DomainSignal[] {
    return pack.signals.map(mapping => this.computeSignal(ctx, pack.domain, mapping));
  }

  private computeSignal(
    ctx:     AstrologyContext,
    domain:  string,
    mapping: SignalMapping,
  ): DomainSignal {
    // ── Hypothesis contribution ────────────────────────────────────────────────
    const matchingHyps = ctx.hypotheses.filter(h =>
      mapping.hypothesisIds.includes(h.id) && domain in h.domains,
    );

    const hypScore = weightedHypothesisScore(matchingHyps, domain);

    // ── Inference contribution ─────────────────────────────────────────────────
    const matchingInfs = ctx.inferences.filter(c =>
      c.reasonCodes.some(rc => mapping.reasonCodes.includes(rc)) &&
      c.direction !== "Negative",
    );

    const infScore = matchingInfs.length === 0
      ? 50
      : Math.round(matchingInfs.reduce((s, c) => s + c.confidence, 0) / matchingInfs.length);

    // ── Blend ──────────────────────────────────────────────────────────────────
    const totalWeight = mapping.hypothesisWeight + mapping.inferenceWeight;
    const raw = (
      hypScore * mapping.hypothesisWeight +
      infScore * mapping.inferenceWeight
    ) / totalWeight;

    const score = Math.min(100, Math.max(0, Math.round(raw)));

    // Confidence = how much evidence we actually found (not just defaults)
    const evidenceDepth = Math.min(1, (matchingHyps.length * 0.4 + matchingInfs.length * 0.15));
    const confidence    = Math.round(40 + evidenceDepth * 60);

    return {
      id:                  mapping.id,
      label:               mapping.label,
      score,
      confidence,
      sourceHypothesisIds: matchingHyps.map(h => h.id),
      sourceReasonCodes:   [
        ...new Set(matchingInfs.flatMap(c =>
          c.reasonCodes.filter(rc => mapping.reasonCodes.includes(rc)),
        )),
      ],
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function weightedHypothesisScore(
  hyps:   AstrologyContext["hypotheses"],
  domain: string,
): number {
  if (hyps.length === 0) return 50;
  const totalWeight = hyps.reduce((s, h) => s + (h.domains[domain] ?? 0), 0);
  if (totalWeight === 0) return 50;
  return Math.round(
    hyps.reduce((s, h) => s + h.confidence * (h.domains[domain] ?? 0), 0) / totalWeight,
  );
}
