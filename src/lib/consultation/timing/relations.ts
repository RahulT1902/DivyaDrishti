/**
 * Classical relationship tables shared by every domain's evidence:
 * graha drishti, naisargika (natural) friendship, sign lords and the
 * house-to-house relationship between two planets.
 */

import type { PlanetName } from "../../core/types";

export const PLANETS: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Lord of each sign (1 = Aries). */
export const SIGN_LORD: Record<number, PlanetName> = {
  1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon", 5: "Sun", 6: "Mercury",
  7: "Venus", 8: "Mars", 9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
};

// Every planet aspects the 7th from itself; Mars also the 4th and 8th, Jupiter
// the 5th and 9th, Saturn the 3rd and 10th. Nodes get only the 7th (their
// special aspects are disputed).
export const SPECIAL_ASPECTS: Partial<Record<PlanetName, number[]>> = {
  Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10],
};

/** House (or sign) reached by counting `nth` from `from`, inclusive (7th from 1 = 7). */
export const countFrom = (from: number, nth: number) => ((from - 1 + nth - 1) % 12) + 1;

/** Position of `to` counted from `from` (same = 1). */
export const nthFrom = (from: number, to: number) => (((to - from) % 12) + 12) % 12 + 1;

export function aspectsFrom(planet: PlanetName, sign: number): number[] {
  return [7, ...(SPECIAL_ASPECTS[planet] ?? [])].map(n => countFrom(sign, n));
}

export const ordinal = (n: number) =>
  `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

// Naisargika maitri (Brihat Parashara Hora Shastra). Nodes are not listed:
// they act through the lord of the sign they occupy.
const FRIENDS: Record<string, PlanetName[]> = {
  Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"], Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"], Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};
const ENEMIES: Record<string, PlanetName[]> = {
  Sun: ["Venus", "Saturn"], Moon: [], Mars: ["Mercury"], Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"], Venus: ["Sun", "Moon"], Saturn: ["Sun", "Moon", "Mars"],
};

export function naturalView(of: PlanetName, toward: PlanetName): "friend" | "enemy" | "neutral" {
  if (FRIENDS[of]?.includes(toward)) return "friend";
  if (ENEMIES[of]?.includes(toward)) return "enemy";
  return "neutral";
}

/** Meaning of two planets sitting n/m houses from each other. */
export function houseRelation(n: number): string {
  const m = ((13 - n) % 12) + 1; // the reciprocal count: B is nth from A ⇒ A is mth from B
  const pair = [n, m].sort((a, b) => a - b).join("/");
  switch (pair) {
    case "1/1":   return "conjunct (same sign) — they act together";
    case "7/7":   return "1/7 — opposite each other, in mutual aspect";
    case "4/10":  return "4/10 (kendra) — a strong working link";
    case "5/9":   return "5/9 (trine) — harmonious, mutually supporting";
    case "3/11":  return "3/11 — cooperative, gains through effort";
    case "2/12":  return "2/12 — a draining link, expenses or fatigue";
    case "6/8":   return "6/8 (shadashtaka) — friction and strain between them";
    default:      return `${pair}`;
  }
}
