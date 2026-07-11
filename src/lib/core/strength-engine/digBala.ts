import { PlanetName, AstrologicalEvidence } from "../types";

// House of maximum Dig Bala (directional strength) for each planet
const DIG_STRONG_HOUSE: Record<PlanetName, number | null> = {
  Sun:     10,   // south direction
  Moon:    4,    // north direction
  Mars:    10,   // south direction
  Mercury: 1,    // east direction (lagna)
  Jupiter: 1,    // east direction (lagna)
  Venus:   4,    // north direction
  Saturn:  7,    // west direction
  Rahu:    null, // shadow planet — no classical Dig Bala
  Ketu:    null,
};

export interface DigBalaResult {
  score: number;
  evidence: AstrologicalEvidence;
}

export function computeDigBala(planet: PlanetName, house: number): DigBalaResult {
  const strongHouse = DIG_STRONG_HOUSE[planet];

  if (strongHouse === null) {
    return neutral(planet, house, "Shadow planet — Dig Bala not applicable");
  }

  // Distance from strong house (circular, max = 6 houses away)
  const distance = Math.min(
    Math.abs(house - strongHouse),
    12 - Math.abs(house - strongHouse),
  );

  // 0 distance = 100, 6 distance = 0 (linear interpolation)
  const score = Math.round(100 - (distance / 6) * 100);

  const desc = score >= 80
    ? `${planet} in ${house}${ordinal(house)} house — strong Dig Bala (near ${strongHouse}${ordinal(strongHouse)})`
    : score >= 50
    ? `${planet} in ${house}${ordinal(house)} house — moderate Dig Bala`
    : `${planet} in ${house}${ordinal(house)} house — weak Dig Bala (far from ${strongHouse}${ordinal(strongHouse)})`;

  return {
    score,
    evidence: {
      id:          `${planet}-digbala`,
      category:    "Strength",
      description: desc,
      strength:    score,
      weight:      0.20,
      sourceChart: "D1",
      planet,
      house,
    },
  };
}

function neutral(planet: PlanetName, house: number, desc: string): DigBalaResult {
  return {
    score: 50,
    evidence: {
      id:          `${planet}-digbala`,
      category:    "Strength",
      description: desc,
      strength:    50,
      weight:      0.20,
      sourceChart: "D1",
      planet,
      house,
    },
  };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
