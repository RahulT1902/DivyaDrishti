// Pundit Brain — Layer 4: Astrological Diagnosis Engine
//
// This is where ChatPundit becomes a real astrologer.
// Instead of immediately writing English, this layer first produces an
// internal diagnosis — no English yet, only structured astrological reasoning.
//
// Example internal output:
//   Career
//   - Saturn activating 10th house (strong)
//   - Jupiter supporting 2nd house (moderate)
//   - Mars creating friction in 1st (mild)
//   - Dasha: supportive
//   - Transit: favourable
//   - Probability: 82%
//   - Timeline: Within 3 weeks
//
// The LLM receives this as a fact sheet and narrates from it.

import type { AstrologyContext, DashaInfo, PlanetName } from "../../core/types";
import type { AstrologicalDiagnosis, DiagnosisState } from "./types";

// ── Domain → inference domain mapping ────────────────────────────────────────

const DOMAIN_MAP: Record<string, string> = {
  career:       "Career",
  health:       "Health",
  finance:      "Wealth",
  relationship: "Marriage",
  family:       "Marriage",
  business:     "Career",
  education:    "Education",
  general:      "Career",
};

// ── Score → state ─────────────────────────────────────────────────────────────

function scoreToState(score: number): DiagnosisState {
  if (score >= 80) return "Highly Favorable";
  if (score >= 65) return "Favorable";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Challenging";
  return "Difficult";
}

// ── Dasha alignment for domain ────────────────────────────────────────────────

function assessDashaAlignment(
  dasha:  DashaInfo | undefined,
  domain: string,
): "supportive" | "neutral" | "challenging" {
  if (!dasha) return "neutral";

  const BENEFIC_BY_DOMAIN: Record<string, string[]> = {
    career:       ["Sun", "Mars", "Jupiter", "Saturn", "Mercury"],
    health:       ["Moon", "Sun", "Jupiter", "Venus"],
    finance:      ["Jupiter", "Venus", "Mercury", "Moon"],
    relationship: ["Venus", "Moon", "Jupiter"],
    education:    ["Mercury", "Jupiter", "Venus"],
  };
  const MALEFIC_BY_DOMAIN: Record<string, string[]> = {
    career:       ["Ketu", "Rahu"],
    health:       ["Saturn", "Rahu", "Ketu", "Mars"],
    finance:      ["Saturn", "Rahu", "Ketu"],
    relationship: ["Saturn", "Rahu", "Ketu", "Mars"],
    education:    ["Rahu", "Saturn", "Ketu"],
  };

  const benefics  = BENEFIC_BY_DOMAIN[domain]  ?? [];
  const malefics  = MALEFIC_BY_DOMAIN[domain]  ?? [];
  const maScore = benefics.includes(dasha.mahadasha) ? 1 : malefics.includes(dasha.mahadasha) ? -1 : 0;
  const anScore = benefics.includes(dasha.antardasha) ? 1 : malefics.includes(dasha.antardasha) ? -1 : 0;

  const total = maScore * 2 + anScore;  // mahadasha weighs more
  if (total >= 1)  return "supportive";
  if (total <= -1) return "challenging";
  return "neutral";
}

// ── Transit alignment ─────────────────────────────────────────────────────────

function assessTransitAlignment(ctx: AstrologyContext): "favorable" | "neutral" | "unfavorable" {
  if (!ctx.transit?.length) return "neutral";
  const positiveCount = ctx.transit.filter(e => e.scoreDelta > 10).length;
  const negativeCount = ctx.transit.filter(e => e.scoreDelta < -10).length;
  if (positiveCount > negativeCount) return "favorable";
  if (negativeCount > positiveCount) return "unfavorable";
  return "neutral";
}

// ── Supporting and challenging factors from AstrologyContext ──────────────────

function extractFactors(ctx: AstrologyContext, domain: string) {
  const supporting:  string[] = [];
  const challenging: string[] = [];
  const domainKey = DOMAIN_MAP[domain] ?? "Career";

  // From inference conclusions
  for (const inf of ctx.inferences) {
    if (inf.domain !== domainKey) continue;
    if (inf.direction === "Positive" && inf.confidence > 55) {
      for (const s of inf.supportingEvidence.slice(0, 2)) {
        if (!supporting.includes(s)) supporting.push(s);
      }
    } else if (inf.direction === "Negative" && inf.confidence > 55) {
      for (const s of inf.conflictingEvidence.slice(0, 1)) {
        if (!challenging.includes(s)) challenging.push(s);
      }
    }
  }

  // From hypotheses
  for (const hyp of ctx.hypotheses) {
    const relevance = hyp.domains[domainKey] ?? 0;
    if (relevance < 0.4) continue;
    if (hyp.confidence >= 70) {
      supporting.push(`${hyp.label} (${Math.round(hyp.confidence)}% confidence)`);
    } else if (hyp.confidence < 40) {
      challenging.push(`${hyp.label} weakened`);
    }
  }

  // From top planet strengths
  const sorted = [...ctx.planetStrengths].sort((a, b) => b.overallStrength - a.overallStrength);
  const topPlanet = sorted[0];
  const weakPlanet = sorted[sorted.length - 1];
  if (topPlanet && topPlanet.overallStrength > 70 && supporting.length < 4) {
    supporting.push(`${topPlanet.planet} is strongly activated in the natal chart`);
  }
  if (weakPlanet && weakPlanet.overallStrength < 35 && challenging.length < 3) {
    challenging.push(`${weakPlanet.planet} is under stress or weakened`);
  }

  // From active yogas
  for (const yoga of ctx.yogaAnalysis.birthPromises.slice(0, 3)) {
    if (!yoga.affectedDomains.includes(domainKey)) continue;
    const activation = ctx.yogaAnalysis.activations.find(a => a.yogaId === yoga.id);
    if (!activation) continue;
    if (activation.activationScore >= 70) {
      supporting.push(`${yoga.name} yoga is active and supporting ${domain}`);
    } else if (activation.status === "Dormant") {
      challenging.push(`${yoga.name} potential is dormant in the current period`);
    }
  }

  return { supporting: supporting.slice(0, 5), challenging: challenging.slice(0, 3) };
}

// ── Probability ───────────────────────────────────────────────────────────────

function computeProbability(
  overallScore:    number,
  dashaAlignment:  string,
  transitAlignment: string,
): number {
  let prob = overallScore;

  if (dashaAlignment === "supportive")    prob += 8;
  if (dashaAlignment === "challenging")   prob -= 10;
  if (transitAlignment === "favorable")   prob += 5;
  if (transitAlignment === "unfavorable") prob -= 7;

  return Math.min(95, Math.max(20, Math.round(prob)));
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function estimateTimeline(
  ctx:             AstrologyContext,
  domain:          string,
  dashaAlignment:  string,
  overallScore:    number,
): string | null {
  if (overallScore < 50) return null;  // not favorable enough to commit to timeline

  // Check if transit-driven (short timeline) or dasha-driven (longer)
  const hasActiveTransit = ctx.transit && ctx.transit.some(e => e.scoreDelta > 15);

  if (hasActiveTransit && dashaAlignment !== "challenging") {
    if (overallScore >= 80) return "within the next 2–4 weeks";
    return "within the next 1–2 months";
  }

  if (dashaAlignment === "supportive") {
    if (overallScore >= 75) return "within the next 1–2 months";
    return "over the next 3–6 months";
  }

  return "over the next 3–4 months";
}

// ── Key planet ────────────────────────────────────────────────────────────────

function findKeyPlanet(ctx: AstrologyContext, domain: string): string | null {
  const domainKey = DOMAIN_MAP[domain] ?? "Career";

  // Find the hypothesis with highest relevance to this domain
  const domainHyp = [...ctx.hypotheses]
    .sort((a, b) => (b.domains[domainKey] ?? 0) - (a.domains[domainKey] ?? 0))[0];

  if (domainHyp?.supportingPlanets.length) {
    return domainHyp.supportingPlanets[0];
  }

  // Fallback: top planet by strength
  return ctx.planetStrengths.sort((a, b) => b.overallStrength - a.overallStrength)[0]?.planet ?? null;
}

// ── Overall domain score from DecisionGraph ───────────────────────────────────

function getDomainScore(ctx: AstrologyContext, domain: string): number {
  const domainKey = DOMAIN_MAP[domain] ?? "Career";

  // Use yoga activation score + hypothesis average
  const domainHypotheses = ctx.hypotheses.filter(h => (h.domains[domainKey] ?? 0) > 0.3);
  if (domainHypotheses.length > 0) {
    const avg = domainHypotheses.reduce((s, h) => s + h.confidence * (h.domains[domainKey] ?? 0), 0)
              / domainHypotheses.reduce((s, h) => s + (h.domains[domainKey] ?? 0), 0);
    return Math.round(avg);
  }

  // Fallback: yoga overall birth strength
  return Math.round(ctx.yogaAnalysis.overallBirthStrength);
}

// ── Confidence ────────────────────────────────────────────────────────────────

function assessConfidence(ctx: AstrologyContext): "high" | "medium" | "low" {
  const completeness = ctx.completeness.overall;
  if (completeness >= 70) return "high";
  if (completeness >= 45) return "medium";
  return "low";
}

// ── Internal summary ──────────────────────────────────────────────────────────

function buildInternalSummary(
  domain:          string,
  overallState:    DiagnosisState,
  dashaAlignment:  string,
  probability:     number,
  timeline:        string | null,
  dasha:           DashaInfo | undefined,
): string {
  const dashaStr = dasha ? `${dasha.mahadasha}/${dasha.antardasha}` : "current period";
  const lines = [
    `${domain}: ${overallState}`,
    `Dasha (${dashaStr}): ${dashaAlignment}`,
    `Probability: ${probability}%`,
    timeline ? `Expected window: ${timeline}` : "Timeline: unclear",
  ];
  return lines.join(" | ");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function runDiagnosticEngine(
  ctx:      AstrologyContext,
  dasha:    DashaInfo | undefined,
  domain:   string,
): AstrologicalDiagnosis {
  const overallScore     = getDomainScore(ctx, domain);
  const dashaAlignment   = assessDashaAlignment(dasha, domain);
  const transitAlignment = assessTransitAlignment(ctx);
  const { supporting, challenging } = extractFactors(ctx, domain);
  const overallState     = scoreToState(overallScore);
  const probability      = computeProbability(overallScore, dashaAlignment, transitAlignment);
  const timeline         = estimateTimeline(ctx, domain, dashaAlignment, overallScore);
  const keyPlanet        = findKeyPlanet(ctx, domain);
  const confidence       = assessConfidence(ctx);
  const internalSummary  = buildInternalSummary(domain, overallState, dashaAlignment, probability, timeline, dasha);

  return {
    domain,
    supportingFactors:  supporting,
    challengingFactors: challenging,
    dashaAlignment,
    transitAlignment,
    overallState,
    overallScore,
    probability,
    timeline,
    confidence,
    keyPlanet,
    internalSummary,
  };
}
