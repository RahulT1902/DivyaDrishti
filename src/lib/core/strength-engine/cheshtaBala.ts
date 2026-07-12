import { PlanetName, AstrologicalEvidence } from "../types";

// Cheshta Bala (motional strength) measures how much vigour a planet expresses
// through its motion.  Full computation requires precise orbital speed data
// (degrees/day vs. mean daily motion).  This implementation uses the available
// retrograde and combust flags as a meaningful approximation:
//
//   Retrograde : 85 — planet moving contrary to zodiacal order; intense
//                     karmic focus; classical Vakra Cheshta (full cheshta)
//   Combust    : 15 — too close to Sun; motion effectively suppressed
//   Direct     : 50 — neutral baseline (no speed data to refine further)
//
// Sun and Moon never retrograde — they always return 50.

const NO_RETROGRADE_PLANETS: ReadonlySet<PlanetName> = new Set(["Sun", "Moon"]);

export interface CheshtaBalaResult {
  score: number;
  evidence: AstrologicalEvidence;
}

/**
 * Compute Cheshta Bala (motional strength) from retrograde / combust flags.
 *
 * @param planet       - the planet being evaluated
 * @param isRetrograde - true if the planet is currently retrograde
 * @param isCombust    - true if the planet is combust (within orb of Sun)
 */
export function computeCheshtaBala(
  planet: PlanetName,
  isRetrograde: boolean,
  isCombust: boolean,
): CheshtaBalaResult {
  // Sun and Moon don't retrograde — return neutral immediately
  if (NO_RETROGRADE_PLANETS.has(planet)) {
    return make(planet, 50, "Neutral — Sun and Moon do not retrograde");
  }

  if (isRetrograde) {
    return make(
      planet,
      85,
      "Retrograde (Vakra Cheshta) — intense contra-zodiacal motion; full motional vigour",
    );
  }

  if (isCombust) {
    return make(
      planet,
      15,
      "Combust — proximity to Sun suppresses independent motion; depleted Cheshta Bala",
    );
  }

  return make(planet, 50, "Direct motion — neutral Cheshta Bala baseline");
}

function make(
  planet: PlanetName,
  score: number,
  description: string,
): CheshtaBalaResult {
  return {
    score,
    evidence: {
      id:          `${planet}-cheshta`,
      category:    "Strength",
      description: `${planet}: ${description} — Cheshta Bala ${score}/100`,
      strength:    score,
      weight:      0.02,
      sourceChart: "D1",
      planet,
    },
  };
}
