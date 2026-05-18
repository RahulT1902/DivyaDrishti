import { NatalChart, DashaContext } from "../types";
import { CompleteTransitReport } from "../transit/types";
import { DomainIntelligence } from "./types";
import { synthesizeCareer } from "../synthesizers/careerSynthesizer";
import { synthesizeFinance } from "../synthesizers/financeSynthesizer";

export function synthesizeLifeDomains(
  natal: NatalChart,
  dasha: DashaContext,
  transits: CompleteTransitReport
): DomainIntelligence[] {
  const career = synthesizeCareer(natal, dasha, transits.transits);
  const finance = synthesizeFinance(natal, dasha, transits.transits);
  
  return [career, finance];
}

export * from "./types";
