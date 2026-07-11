import { DivisionalChart, PlanetRole, AstrologyEngine } from "../types";
import { computePlanetRoles } from "./functionalEngine";

export { computePlanetRoles } from "./functionalEngine";
export { NATURAL_NATURE, isNaturalBenefic, isNaturalMalefic } from "./naturalNature";
export { classifyHouse, getBadhakaHouse } from "./houseClassifier";

// Planet Intelligence Engine — implements the universal AstrologyEngine contract
export class PlanetIntelligenceEngine implements AstrologyEngine<DivisionalChart, PlanetRole[]> {
  evaluate(d1Chart: DivisionalChart): PlanetRole[] {
    return computePlanetRoles(d1Chart.ascendant.sign);
  }
}
