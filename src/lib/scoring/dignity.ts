/**
 * Dignity Score Table (Deterministic Matrix)
 * Exalted: 100
 * Own Sign: 85
 * Friendly: 70
 * Neutral: 55
 * Enemy: 35
 * Debilitated: 15
 */

interface DignityMap {
  [planet: string]: {
    exalted: number;
    own: number[];
    debilitated: number;
    friendly: number[];
    enemy: number[];
  };
}

const DIGNITY_MAP: DignityMap = {
  Sun: {
    exalted: 1, // Aries
    own: [5], // Leo
    debilitated: 7, // Libra
    friendly: [9, 12, 1, 8], // Jupiter, Mars signs
    enemy: [2, 7, 10, 11], // Venus, Saturn signs
  },
  Moon: {
    exalted: 2, // Taurus
    own: [4], // Cancer
    debilitated: 8, // Scorpio
    friendly: [3, 6], // Mercury signs
    enemy: [], // Moon has no enemies in standard Vedic
  },
  Mars: {
    exalted: 10, // Capricorn
    own: [1, 8], // Aries, Scorpio
    debilitated: 4, // Cancer
    friendly: [5, 9, 12, 4], // Sun, Jupiter, Moon signs
    enemy: [3, 6], // Mercury signs
  },
  Mercury: {
    exalted: 6, // Virgo
    own: [3, 6], // Gemini, Virgo
    debilitated: 12, // Pisces
    friendly: [5, 2, 7], // Sun, Venus signs
    enemy: [4], // Moon sign
  },
  Jupiter: {
    exalted: 4, // Cancer
    own: [9, 12], // Sagittarius, Pisces
    debilitated: 10, // Capricorn
    friendly: [1, 8, 5, 4], // Mars, Sun, Moon signs
    enemy: [3, 6, 2, 7], // Mercury, Venus signs
  },
  Venus: {
    exalted: 12, // Pisces
    own: [2, 7], // Taurus, Libra
    debilitated: 6, // Virgo
    friendly: [3, 6, 10, 11], // Mercury, Saturn signs
    enemy: [5, 4], // Sun, Moon signs
  },
  Saturn: {
    exalted: 7, // Libra
    own: [10, 11], // Capricorn, Aquarius
    debilitated: 1, // Aries
    friendly: [2, 7, 3, 6], // Venus, Mercury signs
    enemy: [5, 4, 1, 8], // Sun, Moon, Mars signs
  },
  Rahu: {
    exalted: 2, // Taurus (common view)
    own: [], 
    debilitated: 8, // Scorpio
    friendly: [3, 6, 10, 11, 2, 7], // Mercury, Saturn, Venus signs
    enemy: [5, 4], // Sun, Moon signs
  },
  Ketu: {
    exalted: 8, // Scorpio (common view)
    own: [], 
    debilitated: 2, // Taurus
    friendly: [1, 8, 5, 9, 12], // Mars, Sun, Jupiter signs
    enemy: [3, 6, 2, 7], // Mercury, Venus signs
  },
};

export function getPlanetDignityScore(planetName: string, sign: number): number {
  const map = DIGNITY_MAP[planetName];
  if (!map) return 55; // Default Neutral

  if (map.exalted === sign) return 100;
  if (map.debilitated === sign) return 15;
  if (map.own.includes(sign)) return 85;
  if (map.friendly.includes(sign)) return 70;
  if (map.enemy.includes(sign)) return 35;

  return 55; // Neutral
}
