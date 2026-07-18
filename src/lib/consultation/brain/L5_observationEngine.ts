// Pundit Brain — Layer 5: Observation Engine
//
// Real astrologers always notice things you didn't ask about.
//
// Example:
//   User: "How's my finance?"
//   Pundit: "Your finances appear stable, but what actually stands out
//             is your career right now. The chart suggests your income
//             is more likely to improve through a role change than
//             through unexpected gains."
//
// This layer scans ALL domain scores (not just the asked domain) and surfaces
// the most noteworthy pattern — even if it's off-topic.

import type { AstrologicalDiagnosis, ObservationSet } from "./types";
import type { StoredDomainMemory } from "../sessionMemory";
import type { AstrologyContext } from "../../core/types";

// ── Domain scores for comparison ──────────────────────────────────────────────

const DOMAIN_MAP: Record<string, string> = {
  career:       "Career",
  health:       "Health",
  finance:      "Wealth",
  relationship: "Marriage",
};

function getDomainScoreFromCtx(ctx: AstrologyContext, domain: string): number {
  const key = DOMAIN_MAP[domain];
  if (!key) return 50;

  const hyps = ctx.hypotheses.filter(h => (h.domains[key] ?? 0) > 0.3);
  if (!hyps.length) return Math.round(ctx.yogaAnalysis.overallBirthStrength);

  const weighted = hyps.reduce((s, h) => s + h.confidence * (h.domains[key] ?? 0), 0);
  const weights  = hyps.reduce((s, h) => s + (h.domains[key] ?? 0), 0);
  return Math.round(weighted / weights);
}

// ── Build cross-domain observation ───────────────────────────────────────────

function findMostActiveAlternateDomain(
  askedDomain:  string,
  ctx:          AstrologyContext,
  memories:     StoredDomainMemory[],
): { domain: string; score: number; reason: string } | null {
  const others = ["career", "health", "finance", "relationship"].filter(d => d !== askedDomain);
  let best: { domain: string; score: number; reason: string } | null = null;

  for (const domain of others) {
    const score = getDomainScoreFromCtx(ctx, domain);
    if (!best || score > best.score) {
      const mem = memories.find(m => m.domain === domain);
      const reason = mem?.overallLine
        ? `(previous reading: ${mem.overallLine})`
        : `(chart score: ${score}/100)`;
      best = { domain, score, reason };
    }
  }

  return best;
}

const DOMAIN_VERBS: Record<string, string> = {
  career:       "career and professional momentum",
  health:       "health and energy",
  finance:      "finances and income flow",
  relationship: "relationship and emotional life",
};

function buildCrossDomainInsight(
  askedDomain:   string,
  askedScore:    number,
  topDomain:     { domain: string; score: number; reason: string },
): string | null {
  // Only flag if the alternate domain is meaningfully higher
  if (topDomain.score < askedScore + 15) return null;

  const askedVerb = DOMAIN_VERBS[askedDomain] ?? askedDomain;
  const topVerb   = DOMAIN_VERBS[topDomain.domain] ?? topDomain.domain;

  if (askedScore >= 65) {
    return `While your ${askedVerb} looks reasonably stable, what actually stands out right now is your ${topVerb}. The chart is showing stronger signals there.`;
  }
  return `What actually catches my attention most is your ${topVerb}, not your ${askedVerb}. The chart is more active there right now.`;
}

// ── Proactive notes ───────────────────────────────────────────────────────────

function buildProactiveNotes(
  diagnosis:   AstrologicalDiagnosis,
  memories:    StoredDomainMemory[],
  ctx:         AstrologyContext,
): string[] {
  const notes: string[] = [];

  // Dasha change approaching
  if (diagnosis.dashaAlignment === "challenging") {
    notes.push("The current dasha period is creating background pressure — patience matters more than pushing right now.");
  }

  // Strong yoga dormant
  const dormantYoga = ctx.yogaAnalysis.activations.find(a => a.status === "Dormant" && a.activationScore > 40);
  if (dormantYoga) {
    const yoga = ctx.yogaAnalysis.birthPromises.find(y => y.id === dormantYoga.yogaId);
    if (yoga) {
      notes.push(`Your chart carries a ${yoga.name} — a significant promise that is not fully activated yet. It may become more visible in the next dasha period.`);
    }
  }

  // Unresolved prior prediction
  const priorMemory = memories.find(m => m.domain === diagnosis.domain);
  if (priorMemory?.situation && !diagnosis.supportingFactors.some(f => f.toLowerCase().includes(priorMemory.situation!.toLowerCase()))) {
    notes.push(`The ${priorMemory.situation} phase from our earlier reading is still in play — the conditions haven't changed fundamentally.`);
  }

  // High transit volatility
  if (ctx.transit && ctx.transit.filter(e => e.scoreDelta < -10).length >= 3) {
    notes.push("There are several challenging transits active simultaneously. This can create a heavier-than-usual period across multiple areas of life.");
  }

  return notes.slice(0, 2);
}

// ── Primary observation ───────────────────────────────────────────────────────

function buildPrimaryObservation(
  diagnosis:         AstrologicalDiagnosis,
  ctx:               AstrologyContext,
  crossDomainInsight: string | null,
): string {
  if (crossDomainInsight) return crossDomainInsight;

  const { overallState, probability, timeline, keyPlanet, domain } = diagnosis;

  if (overallState === "Highly Favorable") {
    return `What stands out here is that the chart is genuinely supportive for ${domain} right now${keyPlanet ? ` — ${keyPlanet} is particularly active` : ""}.`;
  }
  if (overallState === "Challenging" || overallState === "Difficult") {
    return `The chart is flagging some genuine resistance in ${domain} right now. This doesn't mean nothing will happen, but timing and approach matter.`;
  }
  if (probability >= 75 && timeline) {
    return `There's a specific window forming for ${domain}. The chart is pointing toward ${timeline} as a meaningful period.`;
  }
  if (diagnosis.dashaAlignment === "supportive") {
    return `The current dasha period is working in your favour for ${domain}. This is a slow but steady build.`;
  }

  return `The chart shows a moderate picture for ${domain} — not a standout peak, but nothing deeply concerning either.`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildObservations(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  memories:  StoredDomainMemory[],
  ctx:       AstrologyContext,
): ObservationSet {
  const topAlternate   = findMostActiveAlternateDomain(domain, ctx, memories);
  const crossDomainInsight = topAlternate
    ? buildCrossDomainInsight(domain, diagnosis.overallScore, topAlternate)
    : null;

  const isOffTopic       = !!crossDomainInsight;
  const primaryObservation = buildPrimaryObservation(diagnosis, ctx, crossDomainInsight);
  const proactiveNotes     = buildProactiveNotes(diagnosis, memories, ctx);

  return {
    primaryObservation,
    isOffTopic,
    crossDomainInsight,
    proactiveNotes,
  };
}
