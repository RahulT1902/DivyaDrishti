/**
 * Dasha Strength Engine
 * Converts active time periods into a 0-100 favorable score.
 */

const BASE_WEIGHTS: Record<string, number> = {
  Jupiter: 20, Venus: 18, Mercury: 12, Moon: 10,
  Sun: 8, Mars: 5, Saturn: -5, Rahu: -8, Ketu: -8
};

const HOUSE_MOD: Record<number, number> = {
  1: 10, 5: 10, 9: 10,  // Trikona
  4: 8, 7: 8, 10: 8,    // Kendra
  2: 6, 11: 6,          // Wealth
  3: 2, 6: 2,           // Upachaya (minor)
  8: -12, 12: -12       // Dusthana
};

const clamp = (x: number, min = 0, max = 100) => 
  Math.max(min, Math.min(max, Math.round(x)));

/**
 * Compute the overall DashaScore (Time-Based Favorability)
 * Formula: (Dasha Planet Natal Strength * 0.5) + (Base Planet Weight * 0.6 + House Modifier * 0.4)
 */
export function computeDashaScore(
  mdPlanet: string, 
  adPlanet: string, 
  ctx: {
    planetStrength: Record<string, number>;
    planetHouse: Record<string, number>;
  }
) {
  // Base weights contribution
  const baseAvg = (BASE_WEIGHTS[mdPlanet] || 0) * 0.6 + (BASE_WEIGHTS[adPlanet] || 0) * 0.4;

  // Natal strength contribution (from Phase 3)
  const mdNatal = ctx.planetStrength[mdPlanet] || 50;
  const adNatal = ctx.planetStrength[adPlanet] || 50;
  const natalAvg = mdNatal * 0.6 + adNatal * 0.4;

  // House placement modifier
  const mdHouse = ctx.planetHouse[mdPlanet] || 1;
  const adHouse = ctx.planetHouse[adPlanet] || 1;
  const houseMod = (HOUSE_MOD[mdHouse] || 0) * 0.6 + (HOUSE_MOD[adHouse] || 0) * 0.4;

  // Final Algorithm
  const score = (natalAvg * 0.7) + baseAvg + houseMod;

  return clamp(score);
}
