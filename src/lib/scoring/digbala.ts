/**
 * Directional Strength (Dig Bala) Engine
 * Sun/Mars: 10H (Karma/Power)
 * Jupiter/Mercury: 1H (Self/Intelligence)
 * Saturn: 7H (Relationships/Public)
 * Moon/Venus: 4H (Inner Peace/Home)
 */

interface DigBalaMap {
  [planet: string]: number;
}

const DIG_BALA_MAP: DigBalaMap = {
  Sun: 10,
  Mars: 10,
  Jupiter: 1,
  Mercury: 1,
  Saturn: 7,
  Moon: 4,
  Venus: 4,
};

export function getDigBalaScore(planetName: string, house: number): number {
  const strongHouse = DIG_BALA_MAP[planetName];
  if (!strongHouse) return 60; // Default Average

  // Standard opposite house rule (Zero directional strength)
  const oppositeHouse = (strongHouse + 6 - 1) % 12 + 1;

  if (house === strongHouse) return 100;
  if (house === oppositeHouse) return 30;

  // Intermediate houses (linear interpolation can be complex, using simple 60 for now)
  return 60;
}
