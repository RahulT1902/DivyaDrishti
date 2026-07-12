import { PlanetName, DivisionalChart, AstrologicalEvidence } from "../types";

// Drik Bala (aspectual strength) measures the net benefit or harm a planet
// receives from other planets aspecting it.
//
// Natural benefics:  Jupiter, Venus, Moon, Mercury
// Natural malefics:  Saturn, Mars, Sun, Rahu, Ketu
//
// Vedic aspect rules (whole-sign, from aspectEngine.ts):
//   All planets aspect the 7th sign from themselves.
//   Mars    additionally aspects 4th and 8th.
//   Jupiter additionally aspects 5th and 9th.
//   Saturn  additionally aspects 3rd and 10th.
//
// The DivisionalChart.aspects array (built by aspectEngine) already contains all
// aspect relationships with their toPlanets lists, so we scan it directly.
//
// Scoring:
//   Base score  : 50
//   Benefic aspect received : +15
//   Malefic aspect received : −15
//   Final score clamped to 0–100.

const NATURAL_BENEFICS: ReadonlySet<PlanetName> = new Set([
  "Jupiter", "Venus", "Moon", "Mercury",
]);

const NATURAL_MALEFICS: ReadonlySet<PlanetName> = new Set([
  "Saturn", "Mars", "Sun", "Rahu", "Ketu",
]);

export interface DrikBalaResult {
  score: number;
  evidence: AstrologicalEvidence;
}

/**
 * Compute Drik Bala (aspectual strength) for a planet using the pre-computed
 * aspect list in the D1 chart.
 *
 * @param planet   - the planet receiving aspects
 * @param d1Chart  - the natal D1 chart (aspects must be populated)
 */
export function computeDrikBala(
  planet: PlanetName,
  d1Chart: DivisionalChart,
): DrikBalaResult {
  let score = 50;
  const beneficAspectors: PlanetName[] = [];
  const maleficAspectors: PlanetName[] = [];

  for (const aspect of d1Chart.aspects) {
    // Skip self-originated aspects and aspects that don't hit this planet
    if (aspect.fromPlanet === planet) continue;
    if (!aspect.toPlanets.includes(planet)) continue;

    const aspector = aspect.fromPlanet;

    if (NATURAL_BENEFICS.has(aspector)) {
      beneficAspectors.push(aspector);
      score += 15;
    } else if (NATURAL_MALEFICS.has(aspector)) {
      maleficAspectors.push(aspector);
      score -= 15;
    }
  }

  // Clamp to valid range
  score = Math.max(0, Math.min(100, score));

  const parts: string[] = [];
  if (beneficAspectors.length > 0) {
    parts.push(`benefic aspects from ${beneficAspectors.join(", ")}`);
  }
  if (maleficAspectors.length > 0) {
    parts.push(`malefic aspects from ${maleficAspectors.join(", ")}`);
  }
  const description = parts.length > 0
    ? `${planet} receives ${parts.join("; ")} — Drik Bala ${score}/100`
    : `${planet} receives no planetary aspects — Drik Bala ${score}/100 (neutral)`;

  return {
    score,
    evidence: {
      id:          `${planet}-drik`,
      category:    "Strength",
      description,
      strength:    score,
      weight:      0.01,
      sourceChart: "D1",
      planet,
    },
  };
}
