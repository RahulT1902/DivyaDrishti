import type { PlanetName, Sign } from "../types";

export type SignDignity =
  | "exalted"
  | "own"
  | "moolatrikona"
  | "friendly"
  | "neutral"
  | "enemy"
  | "debilitated";

export interface PlanetaryCondition {
  signDignity: SignDignity;
  retrograde: boolean;
  combust: boolean;
  otherModifiers?: string[];
}

export interface DignityInfo {
  planet: PlanetName;
  sign: Sign;
  signName: string;
  condition: PlanetaryCondition;
  score: number; // 0–100 numerical representation of strength
  description: string;
}

const EXALTATION_SIGNS: Partial<Record<PlanetName, Sign | Sign[]>> = {
  Sun: 1,       // Aries
  Moon: 2,      // Taurus
  Mars: 10,     // Capricorn
  Mercury: 6,   // Virgo
  Jupiter: 4,   // Cancer
  Venus: 12,    // Pisces
  Saturn: 7,    // Libra
  Rahu: [2, 3], // Taurus / Gemini
  Ketu: [8, 9], // Scorpio / Sagittarius
};

const DEBILITATION_SIGNS: Partial<Record<PlanetName, Sign | Sign[]>> = {
  Sun: 7,        // Libra
  Moon: 8,       // Scorpio
  Mars: 4,       // Cancer
  Mercury: 12,   // Pisces
  Jupiter: 10,   // Capricorn
  Venus: 6,      // Virgo
  Saturn: 1,     // Aries
  Rahu: [8, 9],  // Scorpio / Sagittarius
  Ketu: [2, 3],  // Taurus / Gemini
};

const OWN_SIGNS: Record<PlanetName, Sign[]> = {
  Sun: [5],
  Moon: [4],
  Mars: [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus: [2, 7],
  Saturn: [10, 11],
  Rahu: [11],
  Ketu: [8],
};

const PLANET_RELATIONS: Record<PlanetName, Partial<Record<PlanetName, number>>> = {
  Sun:     { Moon: 1, Mars: 1, Jupiter: 1, Mercury: 0, Venus: -1, Saturn: -1, Rahu: -1, Ketu: -1 },
  Moon:    { Sun: 1, Mercury: 1, Mars: 0, Jupiter: 0, Venus: 0, Saturn: 0, Rahu: -1, Ketu: -1 },
  Mars:    { Sun: 1, Moon: 1, Jupiter: 1, Venus: 0, Saturn: 0, Mercury: -1, Rahu: -1, Ketu: 0 },
  Mercury: { Sun: 1, Venus: 1, Mars: 0, Jupiter: 0, Saturn: 0, Moon: -1, Rahu: 1, Ketu: 0 },
  Jupiter: { Sun: 1, Moon: 1, Mars: 1, Saturn: 0, Mercury: -1, Venus: -1, Rahu: 0, Ketu: 1 },
  Venus:   { Mercury: 1, Saturn: 1, Rahu: 1, Mars: 0, Jupiter: 0, Sun: -1, Moon: -1, Ketu: 0 },
  Saturn:  { Mercury: 1, Venus: 1, Rahu: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1, Ketu: 0 },
  Rahu:    { Venus: 1, Saturn: 1, Mercury: 1, Jupiter: 0, Sun: -1, Moon: -1, Mars: -1, Ketu: -1 },
  Ketu:    { Mars: 1, Jupiter: 1, Venus: 0, Saturn: 0, Mercury: 0, Sun: -1, Moon: -1, Rahu: -1 },
};

const SIGN_RULER_MAP: Record<Sign, PlanetName> = {
  1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon",
  5: "Sun", 6: "Mercury", 7: "Venus", 8: "Mars",
  9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
};

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export function getDignityInfo(
  planet: PlanetName,
  sign: Sign,
  options: { isRetrograde?: boolean; isCombust?: boolean } = {}
): DignityInfo {
  const signName = SIGN_NAMES[sign - 1];
  const retrograde = !!options.isRetrograde;
  const combust = !!options.isCombust;
  const modifiers: string[] = [];

  if (retrograde) modifiers.push("retrograde");
  if (combust) modifiers.push("combust");

  // 1. Exaltation check
  const exSigns = EXALTATION_SIGNS[planet];
  const isExalted = Array.isArray(exSigns) ? exSigns.includes(sign) : exSigns === sign;
  if (isExalted) {
    return {
      planet,
      sign,
      signName,
      condition: { signDignity: "exalted", retrograde, combust, otherModifiers: modifiers },
      score: 95,
      description: `${planet} is Exalted in ${signName} — maximum strength and positive expression`,
    };
  }

  // 2. Debilitation check
  const debSigns = DEBILITATION_SIGNS[planet];
  const isDebilitated = Array.isArray(debSigns) ? debSigns.includes(sign) : debSigns === sign;
  if (isDebilitated) {
    return {
      planet,
      sign,
      signName,
      condition: { signDignity: "debilitated", retrograde, combust, otherModifiers: modifiers },
      score: 20,
      description: `${planet} is Debilitated in ${signName} — weakened expression and subtle friction`,
    };
  }

  // 3. Own Sign check
  const ownSigns = OWN_SIGNS[planet] ?? [];
  if (ownSigns.includes(sign)) {
    return {
      planet,
      sign,
      signName,
      condition: { signDignity: "own", retrograde, combust, otherModifiers: modifiers },
      score: 85,
      description: `${planet} is in its Own Sign (${signName}) — strong, stable, and naturally supported`,
    };
  }

  // 4. Friend / Neutral / Enemy based on Sign Ruler
  const signRuler = SIGN_RULER_MAP[sign];
  const rel = PLANET_RELATIONS[planet]?.[signRuler] ?? 0;

  if (rel === 1) {
    return {
      planet,
      sign,
      signName,
      condition: { signDignity: "friendly", retrograde, combust, otherModifiers: modifiers },
      score: 70,
      description: `${planet} is in a Friendly sign (${signName}, ruled by ${signRuler}) — positive placement`,
    };
  }

  if (rel === -1) {
    return {
      planet,
      sign,
      signName,
      condition: { signDignity: "enemy", retrograde, combust, otherModifiers: modifiers },
      score: 40,
      description: `${planet} is in an Enemy sign (${signName}, ruled by ${signRuler}) — mild friction`,
    };
  }

  return {
    planet,
    sign,
    signName,
    condition: { signDignity: "neutral", retrograde, combust, otherModifiers: modifiers },
    score: 55,
    description: `${planet} is in a Neutral sign (${signName}) — steady baseline placement`,
  };
}
