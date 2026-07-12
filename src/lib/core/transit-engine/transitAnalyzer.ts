import { Sign, PlanetName, PlanetPlacement } from "../types";
import { TransitSnapshot, TransitFact } from "./types";

// Converts raw astronomy into symbolic facts relative to a specific natal chart.
// This is pure computation — no astrological rules, no scoring, no I/O.
//
// The key operation: for each transiting planet, determine which NATAL HOUSE
// it falls in.  For whole-sign houses, this is simply:
//   natalHouse = ((transitSign - natalLagnaSign + 12) % 12) + 1
//
// TransitFact is the shared input for all TransitInferenceRules.  Rules inspect
// facts — they never inspect raw planet positions.

const CONJUNCTION_ORB_DEGREES = 6;  // within 6° counts as a transit conjunction

export class TransitAnalyzer {
  analyze(
    snapshot:        TransitSnapshot,
    natalLagnaSign:  Sign,
    natalPlanets:    PlanetPlacement[] = [],
  ): TransitFact[] {
    return snapshot.positions.map(pos => {
      // Which natal house does this transit sign correspond to?
      const natalHouse = ((pos.sign - natalLagnaSign + 12) % 12) + 1;

      // Conjunction check: is the transiting planet within orb of any natal planet?
      let conjunctsNatalPlanet: PlanetName | undefined;
      let degreesFromNatalPlanet: number | undefined;

      for (const natalP of natalPlanets) {
        if (natalP.sign !== pos.sign) continue;  // must be in the same sign
        const diff = Math.abs(pos.degreeInSign - natalP.degreeInSign);
        if (diff <= CONJUNCTION_ORB_DEGREES) {
          if (degreesFromNatalPlanet === undefined || diff < degreesFromNatalPlanet) {
            conjunctsNatalPlanet    = natalP.planet;
            degreesFromNatalPlanet  = diff;
          }
        }
      }

      return {
        planet:                 pos.planet,
        transitSign:            pos.sign,
        natalHouse,
        isRetrograde:           pos.isRetrograde,
        isCombust:              pos.isCombust,
        conjunctsNatalPlanet,
        degreesFromNatalPlanet,
      } satisfies TransitFact;
    });
  }
}
