import { PlanetName, Sign, AstrologicalEvidence } from "../types";
import { EXALTATION, DEBILITATION, OWN_SIGNS, SIGN_LORDS } from "../chart-engine/lordEngine";

// Moolatrikona signs (primary sign of ownership, stronger than regular own sign)
const MOOLATRIKONA: Partial<Record<PlanetName, Sign>> = {
  Sun: 5, Moon: 2, Mars: 1, Mercury: 6,
  Jupiter: 9, Venus: 7, Saturn: 11,
};

// Natural planetary friendships (Naisargika Maitri)
const FRIENDSHIP: Record<PlanetName, { friends: PlanetName[]; neutrals: PlanetName[]; enemies: PlanetName[] }> = {
  Sun:     { friends: ["Moon", "Mars", "Jupiter"],         neutrals: ["Mercury"],                          enemies: ["Saturn", "Venus"] },
  Moon:    { friends: ["Sun", "Mercury"],                  neutrals: ["Mars", "Jupiter", "Venus", "Saturn"], enemies: [] },
  Mars:    { friends: ["Sun", "Moon", "Jupiter"],          neutrals: ["Venus", "Saturn"],                  enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"],                    neutrals: ["Mars", "Jupiter", "Saturn"],        enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"],             neutrals: ["Saturn"],                           enemies: ["Mercury", "Venus"] },
  Venus:   { friends: ["Mercury", "Saturn"],               neutrals: ["Mars", "Jupiter"],                  enemies: ["Sun", "Moon"] },
  Saturn:  { friends: ["Mercury", "Venus"],                neutrals: ["Jupiter"],                          enemies: ["Sun", "Moon", "Mars"] },
  Rahu:    { friends: ["Mercury", "Venus", "Saturn"],      neutrals: ["Jupiter"],                          enemies: ["Sun", "Moon", "Mars"] },
  Ketu:    { friends: ["Mars", "Venus", "Saturn"],         neutrals: ["Jupiter"],                          enemies: ["Sun", "Moon", "Mercury"] },
};

export interface SthanaBalaResult {
  score: number;
  label: string;
  evidence: AstrologicalEvidence;
}

export function computeSthanaBala(
  planet: PlanetName,
  sign: Sign,
): SthanaBalaResult {
  const signLord = SIGN_LORDS[sign];

  // Exaltation
  if (EXALTATION[planet] === sign) {
    return result(planet, sign, 100, "Exalted");
  }

  // Debilitation
  if (DEBILITATION[planet] === sign) {
    return result(planet, sign, 10, "Debilitated");
  }

  // Own sign (Moolatrikona has slight edge)
  if (MOOLATRIKONA[planet] === sign) {
    return result(planet, sign, 82, "Moolatrikona");
  }

  if ((OWN_SIGNS[planet] as Sign[] | undefined)?.includes(sign)) {
    return result(planet, sign, 78, "Own Sign");
  }

  // Same planet as sign lord → own sign catch-all
  if (signLord === planet) {
    return result(planet, sign, 78, "Own Sign");
  }

  // Friendship with sign lord
  const rel = FRIENDSHIP[planet];
  if (rel.friends.includes(signLord)) {
    return result(planet, sign, 65, "Friendly Sign");
  }
  if (rel.neutrals.includes(signLord)) {
    return result(planet, sign, 50, "Neutral Sign");
  }
  if (rel.enemies.includes(signLord)) {
    return result(planet, sign, 28, "Enemy Sign");
  }

  return result(planet, sign, 50, "Neutral Sign");
}

function result(
  planet: PlanetName,
  sign: Sign,
  score: number,
  label: string,
): SthanaBalaResult {
  return {
    score,
    label,
    evidence: {
      id:          `${planet}-sthana`,
      category:    "Strength",
      description: `${planet} is ${label} — Sthana Bala ${score}/100`,
      strength:    score,
      weight:      0.25,
      sourceChart: "D1",
      planet,
      sign,
    },
  };
}
