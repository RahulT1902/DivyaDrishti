import { AstrologyContext, ChartSuite, PlanetRole, PlanetStrength, YogaAnalysis } from "../types";
import { PlanetIntelligenceEngine } from "../planet-intelligence";
import { PlanetStrengthEngine } from "../strength-engine";
import { YogaEngine } from "../yoga-engine";

// AstrologyContextBuilder is the single orchestration layer that runs all
// symbolic engines and assembles their outputs into the AstrologyContext.
//
// Every domain engine (Career, Wealth, Marriage, Health) receives this context
// as its sole input — they do not call individual engines themselves.

export class AstrologyContextBuilder {
  private readonly intelligenceEngine = new PlanetIntelligenceEngine();
  private readonly strengthEngine     = new PlanetStrengthEngine();
  private readonly yogaEngine         = new YogaEngine();

  build(chartSuite: ChartSuite): AstrologyContext {
    const d1 = chartSuite.D1;

    // Step 1: Functional roles — who each planet is for this lagna
    const planetRoles: PlanetRole[] = this.intelligenceEngine.evaluate(d1);

    // Step 2: Planetary strengths — how powerfully each planet operates
    const planetStrengths: PlanetStrength[] = this.strengthEngine.evaluate(d1);

    // Step 3: Yoga detection — what combinations are present and how active
    const yogaAnalysis: YogaAnalysis = this.yogaEngine.evaluate({
      chart:    d1,
      roles:    planetRoles,
      strengths: planetStrengths,
    });

    return {
      chartSuite,
      planetRoles,
      planetStrengths,
      yogaAnalysis,
    };
  }
}
