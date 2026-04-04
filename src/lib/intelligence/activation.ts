/**
 * Domain Activation Engine
 * Determines if a life domain is DORMANT, ACTIVE, or PEAK based on Dasha.
 */

const DOMAIN_PLANETS: Record<string, string[]> = {
  career: ["Sun", "Saturn", "Mercury"],
  finance: ["Jupiter", "Venus"],
  health: ["Moon", "Mars"],
  relationships: ["Venus", "Moon"],
  self: ["Sun"],
};

const clamp = (x: number, min = 0, max = 100) => 
  Math.max(min, Math.min(max, Math.round(x)));

const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

export function calculateActivation(
  domain: string, 
  dasha: { md: string; ad: string }, 
  planetStrength: Record<string, number>
) {
  const rulers = DOMAIN_PLANETS[domain] || [];

  // 1. Dasha Activation (PRIMARY GATE)
  const isMDActive = rulers.includes(dasha.md) ? 0.6 : 0;
  const isADActive = rulers.includes(dasha.ad) ? 0.4 : 0;
  const dashaHit = isMDActive + isADActive;

  // 2. Natal Potential Factor (from Phase 3)
  const natalAvg = average(rulers.map(p => planetStrength[p] || 50)) / 100;

  // Final Activation Score: (Dasha Hit * 0.7) + (Natal Average * 0.3)
  const score = (dashaHit * 0.7 * 100) + (natalAvg * 0.3 * 100);
  const finalScore = clamp(score);

  return {
    score: finalScore,
    state: getActivationState(finalScore),
  };
}

function getActivationState(score: number): "PEAK" | "ACTIVE" | "DORMANT" {
  if (score >= 75) return "PEAK";
  if (score >= 55) return "ACTIVE";
  return "DORMANT";
}
