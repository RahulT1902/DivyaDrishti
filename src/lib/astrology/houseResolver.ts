// ─── HouseMappingResolver ────────────────────────────────────────────────────
// Unified, canonical source of truth for zodiac sign and house lord mapping.
// Prevent calculation disparities between UI, prediction engines, and dashboards.

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export const SIGN_RULERS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter"
};

export interface HouseMapping {
  houseNum: number;
  sign: string;
  signIndex: number; // 1-based
  lord: string;
}

/**
 * Deterministically computes the sign and ruling planet for all 12 houses
 * given a specific 1-based Ascendant (Lagna) sign index.
 * @param lagnaSign 1-based index of Lagna sign (1 = Aries ... 12 = Pisces)
 */
export function resolveHouseMappings(lagnaSign: number): HouseMapping[] {
  // Normalize lagnaSign to 1-12
  const normalizedLagna = ((lagnaSign - 1) % 12 + 12) % 12 + 1;
  
  const mappings: HouseMapping[] = [];
  
  for (let houseNum = 1; houseNum <= 12; houseNum++) {
    // 1-based index of the sign governing this house (Whole Sign system)
    const signIndex = ((normalizedLagna - 1 + (houseNum - 1)) % 12) + 1;
    const signName = ZODIAC_SIGNS[signIndex - 1] ?? "Aries";
    const lordName = SIGN_RULERS[signName] ?? "Unknown";
    
    mappings.push({
      houseNum,
      sign: signName,
      signIndex,
      lord: lordName
    });
  }
  
  return mappings;
}

/**
 * Returns a specific house mapping directly for a given Ascendant sign.
 */
export function resolveHouseSignAndLord(lagnaSign: number, houseNum: number): HouseMapping {
  const all = resolveHouseMappings(lagnaSign);
  return all[houseNum - 1] ?? all[0];
}
