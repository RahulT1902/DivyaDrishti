import { PlanetName, AstrologicalEvidence } from "../types";

// Avastha (planetary state) is determined by the planet's degree within its sign (0–30°).
// It reflects the maturity and vitality of the planet's expression.

export interface AvasthaResult {
  score: number;
  evidence: AstrologicalEvidence;
}

/**
 * Compute Avastha Bala from a planet's degree within its sign (0–30°).
 *
 * State → degree range → score:
 *   Balya  (infant)   0– 6°  → 25  (vulnerable, nascent energy)
 *   Kumara (youth)    6–12°  → 50  (developing strength)
 *   Yuva   (adult)   12–18°  → 100 (peak strength)
 *   Vriddha (old)    18–24°  → 75  (experienced but declining)
 *   Mrita  (dead)    24–30°  → 50  (depleted)
 *
 * @param planet - the planet being evaluated
 * @param degree - degree within sign (0–30); defaults to 15 (Yuva) when unavailable
 */
export function computeAvastha(
  planet: PlanetName,
  degree: number,
): AvasthaResult {
  // Clamp degree to valid range in case of floating-point edge cases
  const d = Math.max(0, Math.min(30, degree));

  let label: string;
  let score: number;

  if (d < 6) {
    label = "Balya (infant)";
    score = 25;
  } else if (d < 12) {
    label = "Kumara (youth)";
    score = 50;
  } else if (d < 18) {
    label = "Yuva (adult)";
    score = 100;
  } else if (d < 24) {
    label = "Vriddha (old age)";
    score = 75;
  } else {
    label = "Mrita (dead)";
    score = 50;
  }

  return {
    score,
    evidence: {
      id:          `${planet}-avastha`,
      category:    "Strength",
      description: `${planet} is in ${label} state at ${d.toFixed(1)}° — Avastha Bala ${score}/100`,
      strength:    score,
      weight:      0.01,
      sourceChart: "D1",
      planet,
    },
  };
}
