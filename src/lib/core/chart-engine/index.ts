import { buildDivisionalChart } from "./chartBuilder";
import { PlanetInput, LagnaInput, ChartSuite } from "../types";

export { buildDivisionalChart } from "./chartBuilder";
export { computeDivisionalSign, getSignName } from "./divisionalCalculator";
export { SIGN_LORDS, EXALTATION, DEBILITATION, OWN_SIGNS } from "./lordEngine";

// Adapter: converts calculateLagnaChart() output → PlanetInput[] + LagnaInput
export function adaptEngineOutput(
  rawPlanets: Array<{
    name: string;
    longitude: number;
    speed: number;
    isRetrograde: boolean;
    isCombust: boolean;
    isVargottama: boolean;
  }>,
  rawLagna: { longitude: number },
): { planets: PlanetInput[]; lagna: LagnaInput } {
  return {
    planets: rawPlanets.map(p => ({
      name:         p.name as PlanetInput["name"],
      longitude:    p.longitude,
      speed:        p.speed,
      isRetrograde: p.isRetrograde,
      isCombust:    p.isCombust,
      isVargottama: p.isVargottama,
    })),
    lagna: { longitude: rawLagna.longitude },
  };
}

// Build all Phase-2 divisional charts in one call
export function buildChartSuite(
  planets: PlanetInput[],
  lagna: LagnaInput,
): ChartSuite {
  return {
    D1:  buildDivisionalChart(planets, lagna, "D1"),
    D2:  buildDivisionalChart(planets, lagna, "D2"),
    D3:  buildDivisionalChart(planets, lagna, "D3"),
    D4:  buildDivisionalChart(planets, lagna, "D4"),
    D7:  buildDivisionalChart(planets, lagna, "D7"),
    D9:  buildDivisionalChart(planets, lagna, "D9"),
    D10: buildDivisionalChart(planets, lagna, "D10"),
    D12: buildDivisionalChart(planets, lagna, "D12"),
  };
}
