import {
  DivisionalChart, ChartType, PlanetInput, LagnaInput,
  PlanetPlacement, Sign, PlanetName,
} from "../types";
import { computeDivisionalSign } from "./divisionalCalculator";
import { computeAspects } from "./aspectEngine";
import { buildHouses, buildHouseLords } from "./lordEngine";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export function buildDivisionalChart(
  planets: PlanetInput[],
  lagna: LagnaInput,
  chartType: ChartType,
): DivisionalChart {
  const ascSign = computeDivisionalSign(lagna.longitude, chartType);
  const ascDeg  = lagna.longitude % 30;

  // 1. Place each planet in the divisional chart
  const placements: PlanetPlacement[] = planets.map(p => {
    const sign  = computeDivisionalSign(p.longitude, chartType);
    // Whole-sign house number relative to this chart's ascendant
    const house = (((sign - ascSign) % 12) + 12) % 12 + 1;

    return {
      planet:       p.name,
      sign,
      signName:     SIGN_NAMES[sign - 1],
      house,
      degreeInSign: chartType === "D1" ? p.longitude % 30 : 0,
      isRetrograde: p.isRetrograde,
      isCombust:    p.isCombust,
      isVargottama: p.isVargottama,
    };
  });

  // 2. Houses, lords, aspects, conjunctions
  const houses       = buildHouses(ascSign, placements);
  const lords        = buildHouseLords(houses, placements);
  const aspects      = computeAspects(placements);
  const conjunctions = buildConjunctions(placements);

  return {
    chartType,
    ascendant: { sign: ascSign, signName: SIGN_NAMES[ascSign - 1], degreeInSign: ascDeg },
    planets:      placements,
    houses,
    lords,
    aspects,
    conjunctions,
    yogas:     [],   // YogaEngine (Step 4) will populate
    strengths: [],   // StrengthEngine (Step 3) will populate
  };
}

function buildConjunctions(planets: PlanetPlacement[]) {
  const bySign = new Map<Sign, PlanetName[]>();
  for (const p of planets) {
    const list = bySign.get(p.sign) ?? [];
    list.push(p.planet);
    bySign.set(p.sign, list);
  }

  return Array.from(bySign.entries())
    .filter(([, ps]) => ps.length >= 2)
    .map(([sign, ps]) => ({
      planets: ps,
      sign:    sign as Sign,
      house:   planets.find(p => p.planet === ps[0])!.house,
    }));
}
