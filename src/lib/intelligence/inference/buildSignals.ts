import { AstroSignal, Intent } from "../types";
import { extractAstroSignals } from "../astroSignals";

export function buildSignals(
  natalChart: any,
  currentTransits: any,
  dasha: any,
  intent: Intent
): AstroSignal[] {
  // Delegate to existing logic for now, this can be extended with deterministic rules
  return extractAstroSignals(natalChart, currentTransits, dasha, intent);
}
