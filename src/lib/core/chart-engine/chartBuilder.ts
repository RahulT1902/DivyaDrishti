import {
  DivisionalChart, ChartType, ChartMetadata, PlanetInput, LagnaInput,
  PlanetPlacement, Sign, PlanetName,
} from "../types";

const CHART_METADATA: Record<ChartType, ChartMetadata> = {
  D1:  { varga: 1,  purpose: "Overall Life",          accuracyWeight: 1.00, source: "Computed" },
  D2:  { varga: 2,  purpose: "Wealth & Finance",       accuracyWeight: 0.85, source: "Computed" },
  D3:  { varga: 3,  purpose: "Courage & Siblings",     accuracyWeight: 0.80, source: "Computed" },
  D4:  { varga: 4,  purpose: "Property & Vehicles",    accuracyWeight: 0.80, source: "Computed" },
  D6:  { varga: 6,  purpose: "Diseases",               accuracyWeight: 0.85, source: "Computed" },
  D7:  { varga: 7,  purpose: "Children",               accuracyWeight: 0.85, source: "Computed" },
  D9:  { varga: 9,  purpose: "Marriage & Destiny",     accuracyWeight: 0.95, source: "Computed" },
  D10: { varga: 10, purpose: "Career & Fame",          accuracyWeight: 0.95, source: "Computed" },
  D12: { varga: 12, purpose: "Parents",                accuracyWeight: 0.85, source: "Computed" },
  D16: { varga: 16, purpose: "Vehicles & Comforts",    accuracyWeight: 0.75, source: "Computed" },
  D20: { varga: 20, purpose: "Spiritual Growth",       accuracyWeight: 0.80, source: "Computed" },
  D24: { varga: 24, purpose: "Education & Learning",   accuracyWeight: 0.85, source: "Computed" },
  D27: { varga: 27, purpose: "Strength & Vitality",    accuracyWeight: 0.75, source: "Computed" },
  D30: { varga: 30, purpose: "Health & Misfortune",    accuracyWeight: 0.85, source: "Computed" },
  D40: { varga: 40, purpose: "Auspicious Effects",     accuracyWeight: 0.70, source: "Computed" },
  D45: { varga: 45, purpose: "Character & Conduct",    accuracyWeight: 0.70, source: "Computed" },
  D60: { varga: 60, purpose: "Past Karma",             accuracyWeight: 0.90, source: "Computed" },
};
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
    planets:   placements,
    houses,
    lords,
    aspects,
    conjunctions,
    yogas:     [],   // YogaEngine (Step 4) will populate
    strengths: [],   // StrengthEngine (Step 3) will populate
    metadata:  CHART_METADATA[chartType],
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
