import { PlanetName, NaturalNature } from "../types";

// Static natural (naisargika) classification — independent of lagna
export const NATURAL_NATURE: Record<PlanetName, NaturalNature> = {
  Jupiter: "GreatBenefic",
  Venus:   "Benefic",
  Moon:    "Benefic",      // assumes waxing; refine with Sun-Moon angle if needed
  Mercury: "Neutral",
  Sun:     "MildMalefic",
  Mars:    "Malefic",
  Saturn:  "Malefic",
  Rahu:    "Shadow",
  Ketu:    "Shadow",
};

export function isNaturalBenefic(planet: PlanetName): boolean {
  return ["GreatBenefic", "Benefic", "Neutral"].includes(NATURAL_NATURE[planet]);
}

export function isNaturalMalefic(planet: PlanetName): boolean {
  return ["MildMalefic", "Malefic"].includes(NATURAL_NATURE[planet]);
}
