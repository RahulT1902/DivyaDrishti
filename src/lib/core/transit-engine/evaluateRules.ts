import { AstrologicalEvidence } from "../types";
import { TransitFact, TransitEvidence, TransitRule, TemporalHorizon, TEMPORAL_WEIGHTS, TemporalStabilityScore } from "./types";

// Applies a set of TransitRules to a set of TransitFacts and returns the
// matched evidence, sorted by priority ascending (lower priority = first).
//
// Each matching rule produces one TransitEvidence.  The AstrologicalEvidence
// array is constructed from the fact so that downstream graph code has a
// proper evidence node to link to.

export function evaluateTransitRules(
  facts:  TransitFact[],
  rules:  TransitRule[],
): TransitEvidence[] {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  const results: TransitEvidence[] = [];

  for (const fact of facts) {
    for (const rule of sorted) {
      if (rule.test(fact)) {
        const partial   = rule.conclude(fact);
        const evidence  = buildEvidence(fact, rule.id, partial.label, partial.scoreDelta);

        results.push({ ...partial, evidence: [evidence] });
      }
    }
  }

  return results;
}

// Normalises an array of TransitEvidence into a single activation score
// suitable for the ActivationEngine's transit component (0–100, neutral=50).
//
// Formula: 50 + Σ(scoreDelta × temporalWeight[planet]), clamped to [0, 100].
// The temporal weight scales each planet's contribution by how relevant it is
// to the requested horizon:
//
//   daily:   Moon=1.0, Saturn=0.05 — today changes because Moon moves, not Saturn
//   yearly:  Moon=0.05, Saturn=1.0 — the year is shaped by slow planets
//
// With no evidence the score is exactly 50 (neutral, horizon-independent).

export function normalizeTransitEvidence(
  evidence: TransitEvidence[],
  horizon:  TemporalHorizon = "daily",
): number {
  if (!evidence.length) return 50;
  const weights = TEMPORAL_WEIGHTS[horizon];
  const sum = evidence.reduce((acc, e) => {
    const w = weights[e.planet] ?? 1.0;
    return acc + e.scoreDelta * w;
  }, 0);
  return Math.min(100, Math.max(0, Math.round(50 + sum)));
}

// Computes Temporal Stability by evaluating the same evidence at all four
// horizons and measuring the spread.
//
// Range thresholds:
//   0–10  → Stable    (slow and fast planets agree — no disruptive transits)
//   11–20 → Moderate  (some variation, worth noting)
//   21–30 → Variable  (meaningful divergence between short and long view)
//   31+   → Volatile  (a fast-moving transit is creating a temporary departure)

export function computeTemporalStability(evidence: TransitEvidence[]): TemporalStabilityScore {
  const HORIZONS: TemporalHorizon[] = ["daily", "weekly", "monthly", "yearly"];

  const scores = {} as Record<TemporalHorizon, number>;
  for (const h of HORIZONS) {
    scores[h] = normalizeTransitEvidence(evidence, h);
  }

  const values = HORIZONS.map(h => scores[h]);
  const range  = Math.max(...values) - Math.min(...values);

  const label: TemporalStabilityScore["label"] =
    range <= 10 ? "Stable"
    : range <= 20 ? "Moderate"
    : range <= 30 ? "Variable"
    : "Volatile";

  const insight = buildStabilityInsight(scores, range);

  return { scores, range, label, insight };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildStabilityInsight(scores: Record<TemporalHorizon, number>, range: number): string {
  if (range <= 5) {
    return "Transit picture is consistent across all time horizons.";
  }

  const daily   = scores.daily;
  const weekly  = scores.weekly;
  const monthly = scores.monthly;
  const yearly  = scores.yearly;

  // Short-term lower than long-term — temporary dip
  if (daily < yearly - 15) {
    return yearly >= 62
      ? "Long-term promise is strong; a short-lived transit is creating temporary sensitivity."
      : "Near-term challenges ease as the week progresses — the longer arc is less pressured.";
  }

  // Short-term higher than long-term — temporary boost
  if (daily > yearly + 15) {
    return yearly < 50
      ? "Today's picture is more supportive than the longer trend — the background cycle is more challenging."
      : "A fast-moving transit is providing a short-term boost; the longer arc remains steady.";
  }

  // Weekly/monthly diverge significantly
  if (Math.abs(weekly - monthly) > 15) {
    return weekly > monthly
      ? "The outlook improves near-term but softens over the coming weeks."
      : "A mid-period sensitivity appears — watch the coming weeks more carefully.";
  }

  return "Moderate variation across time horizons — no single dominant transit pattern.";
}

// ── Evidence builder ──────────────────────────────────────────────────────────

function buildEvidence(fact: TransitFact, ruleId: string, label: string, scoreDelta: number): AstrologicalEvidence {
  const modifiers: string[] = [];
  if (fact.isRetrograde) modifiers.push("retrograde");
  if (fact.isCombust)    modifiers.push("combust");
  if (fact.conjunctsNatalPlanet) {
    modifiers.push(`conjunct natal ${fact.conjunctsNatalPlanet} (${fact.degreesFromNatalPlanet?.toFixed(1)}°)`);
  }

  const suffix = modifiers.length ? ` [${modifiers.join(", ")}]` : "";

  return {
    id:          `${ruleId}-ev`,
    category:    "Transit",
    description: `${label}${suffix}`,
    // strength: map scoreDelta (-30..+30) → 0..100, neutral=50
    strength:    Math.min(100, Math.max(0, 50 + scoreDelta * (50 / 30))),
    weight:      1.0,
    sourceChart: "D1",
    planet:      fact.planet,
    house:       fact.natalHouse,
  };
}
