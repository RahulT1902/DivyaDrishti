import {
  AstrologyContext, DecisionGraph, DecisionFactor, TimingWindow,
  ConfidenceProvenance, Hypothesis,
} from "../types";
import { CORE_RULESET } from "../inference-engine/ruleSetMeta";

// DecisionGraphBuilder turns Hypotheses and InferenceConclusions into a
// structured domain output: what is the current state, what's helping/blocking,
// what timing window exists, and what action is recommended.
//
// One DecisionGraph is produced per domain (Career, Finance, Health, etc.).
// Domain engines can call buildForDomain() and narrate from the result.

export class DecisionGraphBuilder {
  buildForDomain(ctx: AstrologyContext, domain: string): DecisionGraph {
    // Gather hypotheses relevant to this domain
    const domainHypotheses = ctx.hypotheses.filter(
      h => domain in h.domains && h.domains[domain] >= 0.4,
    );

    // Partition into supporting (confidence >= 55) and blocking (< 45)
    const supporting: Hypothesis[] = domainHypotheses.filter(h => h.confidence >= 55);
    const blocking:   Hypothesis[] = domainHypotheses.filter(h => h.confidence < 45);

    // Weighted domain confidence
    const overallScore = computeWeightedScore(domainHypotheses, domain);

    // Map to DecisionFactor[]
    const supportingFactors: DecisionFactor[] = supporting.map(h => ({
      label:              h.label,
      confidence:         h.confidence,
      direction:          "Supporting",
      sourceHypothesisIds: [h.id],
      reasonCodes:        h.triggerReasonCodes,
    }));

    const blockingFactors: DecisionFactor[] = blocking.map(h => ({
      label:              h.label,
      confidence:         100 - h.confidence,   // invert: high inversion = stronger block
      direction:          "Blocking",
      sourceHypothesisIds: [h.id],
      reasonCodes:        h.triggerReasonCodes,
    }));

    // Timing: pull from active yoga activations
    const timing = buildTimingWindow(ctx, domain, domainHypotheses);

    // Current state: qualitative label
    const currentState = describeState(overallScore);

    // Recommended action: derived from state + timing
    const recommendedAction = recommendAction(domain, currentState, timing, ctx);

    // Aggregate provenance
    const provenance = aggregateProvenance(domainHypotheses, domain);

    return {
      domain,
      currentState,
      overallScore,
      supportingFactors,
      blockingFactors,
      timing,
      recommendedAction,
      confidence: overallScore,
      provenance,
      hypothesisIds: domainHypotheses.map(h => h.id),
      ruleSetVersion: CORE_RULESET.version,
    };
  }

  // Build DecisionGraphs for all domains present in hypotheses
  buildAll(ctx: AstrologyContext): DecisionGraph[] {
    const domains = new Set<string>(
      ctx.hypotheses.flatMap(h => Object.keys(h.domains)),
    );
    return [...domains].map(d => this.buildForDomain(ctx, d));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeWeightedScore(hypotheses: Hypothesis[], domain: string): number {
  if (hypotheses.length === 0) return 50;
  const totalWeight = hypotheses.reduce((s, h) => s + (h.domains[domain] ?? 0), 0);
  if (totalWeight === 0) return 50;
  const weightedSum  = hypotheses.reduce(
    (s, h) => s + h.confidence * (h.domains[domain] ?? 0), 0,
  );
  return Math.round(weightedSum / totalWeight);
}

function describeState(score: number): string {
  if (score >= 80) return "Highly Favorable";
  if (score >= 65) return "Favorable";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Challenging";
  return "Highly Challenging";
}

function buildTimingWindow(
  ctx: AstrologyContext,
  domain: string,
  hypotheses: Hypothesis[],
): TimingWindow {
  const dashaLord      = ctx.dasha?.mahadasha;
  const antardashaLord = ctx.dasha?.antardasha;

  // Check if any supporting planet appears in dasha/antardasha
  const supportingPlanets = hypotheses.flatMap(h => h.supportingPlanets);
  const isDashaSupported  = !!(
    dashaLord && supportingPlanets.includes(dashaLord) ||
    antardashaLord && supportingPlanets.includes(antardashaLord)
  );

  // Active yoga timing evidence
  const peakYogas = ctx.yogaAnalysis.activations.filter(a => a.status === "Peak");
  const activeYogas = ctx.yogaAnalysis.activations.filter(a => a.status === "Active");

  if (peakYogas.length > 0 && isDashaSupported) {
    return {
      label:           "Peak Activation Period",
      isDashaSupported: true,
      description:
        `${peakYogas.length} yoga(s) at Peak status with dasha support from ${dashaLord ?? ""}. ` +
        `This is the strongest timing window for ${domain} outcomes.`,
    };
  }

  if (activeYogas.length > 0) {
    return {
      label:           "Active Window",
      isDashaSupported,
      description:
        `${activeYogas.length} yoga(s) are Active. ` +
        (isDashaSupported
          ? `Dasha lord ${dashaLord ?? ""} supports ${domain} themes.`
          : "Dasha support pending — outcomes possible but not amplified."),
    };
  }

  return {
    label:           "Natal Potential (Dormant Timing)",
    isDashaSupported: false,
    description:
      `No active yogas at present. Natal ${domain} potential exists but awaits dasha activation.`,
  };
}

function recommendAction(
  domain:       string,
  state:        string,
  timing:       TimingWindow,
  ctx:          AstrologyContext,
): string {
  if (state === "Highly Favorable" && timing.isDashaSupported) {
    return `This is a prime activation window for ${domain}. Commit to major initiatives with confidence.`;
  }
  if (state === "Favorable") {
    return `${domain} conditions are supportive. Pursue deliberate, well-planned efforts.`;
  }
  if (state === "Moderate" && timing.isDashaSupported) {
    return `${domain} potential is present with dasha support. Focus on targeted efforts and skill-building.`;
  }
  if (state === "Challenging" || state === "Highly Challenging") {
    return `${domain} conditions are challenging. Consolidate, learn, and prepare — this is a foundation-building phase.`;
  }
  return `Monitor ${domain} conditions. Build foundational strength and await stronger timing.`;
}

function aggregateProvenance(
  hypotheses: Hypothesis[],
  domain: string,
): ConfidenceProvenance {
  if (hypotheses.length === 0) return { natal: 50, activation: 0, strength: 50 };
  const weights    = hypotheses.map(h => h.domains[domain] ?? 0);
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;

  const natal      = hypotheses.reduce((s, h, i) => s + h.provenance.natal      * weights[i], 0) / totalWeight;
  const activation = hypotheses.reduce((s, h, i) => s + h.provenance.activation * weights[i], 0) / totalWeight;
  const strength   = hypotheses.reduce((s, h, i) => s + h.provenance.strength   * weights[i], 0) / totalWeight;

  return {
    natal:      Math.round(natal),
    activation: Math.round(activation),
    strength:   Math.round(strength),
  };
}
