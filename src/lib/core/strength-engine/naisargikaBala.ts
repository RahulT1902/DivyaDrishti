import { PlanetName, AstrologicalEvidence } from "../types";

// Natural/inherent strength (Naisargika Bala) — independent of chart position
// Derived from classical Shadbala Rupas: Sun=60, Moon=51.43, Venus=42.86,
// Jupiter=34.28, Mercury=25.71, Mars=17.14, Saturn=8.57 → normalized to 0–100
const NAISARGIKA_SCORE: Record<PlanetName, number> = {
  Sun:     100,
  Moon:    86,
  Venus:   71,
  Jupiter: 57,
  Mercury: 43,
  Mars:    29,
  Saturn:  14,
  Rahu:    40,  // non-classical; treated as moderate shadow influence
  Ketu:    40,
};

const NAISARGIKA_LABEL: Record<PlanetName, string> = {
  Sun:     "Highest natural strength (Sun)",
  Moon:    "High natural strength (Moon)",
  Venus:   "Strong natural strength (Venus)",
  Jupiter: "Moderate-high natural strength (Jupiter)",
  Mercury: "Moderate natural strength (Mercury)",
  Mars:    "Moderate-low natural strength (Mars)",
  Saturn:  "Lowest natural strength (Saturn)",
  Rahu:    "Shadow node — moderate influence",
  Ketu:    "Shadow node — moderate influence",
};

export interface NaisargikaBalaResult {
  score: number;
  evidence: AstrologicalEvidence;
}

export function computeNaisargikaBala(planet: PlanetName): NaisargikaBalaResult {
  const score = NAISARGIKA_SCORE[planet];
  return {
    score,
    evidence: {
      id:          `${planet}-naisargika`,
      category:    "Strength",
      description: NAISARGIKA_LABEL[planet],
      strength:    score,
      weight:      0.12,
      sourceChart: "D1",
      planet,
    },
  };
}
