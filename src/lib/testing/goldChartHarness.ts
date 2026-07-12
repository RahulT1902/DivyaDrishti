import {
  ChartSuite, DivisionalChart, PlanetPlacement, House, HouseLord,
  Sign, PlanetName, ChartMetadata, AstrologyContext, DashaInfo,
} from "../core/types";
import { AstrologyContextBuilder } from "../core/context-builder/astroContextBuilder";
import { GoldChartSpec, PlanetSpec } from "./goldChartTypes";

// ── Static lookup tables ──────────────────────────────────────────────────────

const SIGN_NAMES: Record<Sign, string> = {
  1: "Aries", 2: "Taurus", 3: "Gemini", 4: "Cancer",
  5: "Leo", 6: "Virgo", 7: "Libra", 8: "Scorpio",
  9: "Sagittarius", 10: "Capricorn", 11: "Aquarius", 12: "Pisces",
};

const SIGN_RULERS: Record<Sign, PlanetName> = {
  1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon",
  5: "Sun", 6: "Mercury", 7: "Venus", 8: "Mars",
  9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
};

const EXALTED_SIGN: Partial<Record<PlanetName, Sign>> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6,
  Jupiter: 4, Venus: 12, Saturn: 7,
};

const DEBILITATED_SIGN: Partial<Record<PlanetName, Sign>> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12,
  Jupiter: 10, Venus: 6, Saturn: 1,
};

// Default neutral sign for planets not specified in the spec
const NEUTRAL_SIGN: Record<PlanetName, Sign> = {
  Sun: 5, Moon: 4, Mars: 1, Mercury: 3,
  Jupiter: 9, Venus: 2, Saturn: 10,
  Rahu: 3, Ketu: 9,
};

const ALL_PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

// ── Computation helpers ───────────────────────────────────────────────────────

// Returns the sign that falls in house `h` for ascendant sign `asc` (whole-sign).
function houseSign(asc: Sign, h: number): Sign {
  return (((asc - 1) + (h - 1)) % 12 + 1) as Sign;
}

// Returns the house number that a given sign falls in for ascendant `asc`.
function signToHouse(asc: Sign, sign: Sign): number {
  return ((sign - asc + 12) % 12) + 1;
}

// ── DivisionalChart builder ───────────────────────────────────────────────────

function buildDivisionalChart(
  chartType: DivisionalChart["chartType"],
  meta: ChartMetadata,
  ascSign: Sign,
  planetSpecs: Partial<Record<PlanetName, PlanetSpec>>,
): DivisionalChart {
  const planets: PlanetPlacement[] = ALL_PLANETS.map(planet => {
    const spec = planetSpecs[planet];
    if (spec) {
      return {
        planet,
        sign: spec.sign,
        signName: SIGN_NAMES[spec.sign],
        house: spec.house,
        degreeInSign: spec.degreeInSign ?? 15,
        isRetrograde: spec.isRetrograde ?? false,
        isCombust:    spec.isCombust    ?? false,
        isVargottama: spec.isVargottama ?? false,
      };
    }
    // Planet not provided — place in default neutral sign
    const neutralSign  = NEUTRAL_SIGN[planet];
    const neutralHouse = signToHouse(ascSign, neutralSign);
    return {
      planet,
      sign: neutralSign,
      signName: SIGN_NAMES[neutralSign],
      house: neutralHouse,
      degreeInSign: 15,
      isRetrograde: false,
      isCombust:    false,
      isVargottama: false,
    };
  });

  // Build a planet-per-house index for the House[] entries
  const planetsByHouse = new Map<number, PlanetName[]>();
  for (const p of planets) {
    const list = planetsByHouse.get(p.house) ?? [];
    list.push(p.planet);
    planetsByHouse.set(p.house, list);
  }

  const houses: House[] = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const sign     = houseSign(ascSign, houseNum);
    return {
      number:   houseNum,
      sign,
      signName: SIGN_NAMES[sign],
      lord:     SIGN_RULERS[sign],
      planets:  planetsByHouse.get(houseNum) ?? [],
    };
  });

  // Build house lords — one entry per house
  const lords: HouseLord[] = houses.map(h => {
    const lordPlanet   = h.lord;
    const lordPlacement = planets.find(p => p.planet === lordPlanet);
    const lordSign      = lordPlacement?.sign ?? ascSign;   // fallback if planet somehow missing
    const lordHouse     = lordPlacement?.house ?? 1;
    return {
      house:            h.number,
      lord:             lordPlanet,
      lordPlacedInHouse: lordHouse,
      lordPlacedInSign:  lordSign,
      isInOwnHouse:     lordHouse === h.number,
      isExalted:        EXALTED_SIGN[lordPlanet]    === lordSign,
      isDebilitated:    DEBILITATED_SIGN[lordPlanet] === lordSign,
    };
  });

  return {
    chartType,
    ascendant: {
      sign:        ascSign,
      signName:    SIGN_NAMES[ascSign],
      degreeInSign: 0,
    },
    planets,
    houses,
    lords,
    aspects:      [],   // drikBala defaults to 50 — accurate enough for regression tests
    conjunctions: [],
    yogas:        [],   // populated by YogaEngine during build()
    strengths:    [],   // populated by StrengthEngine during build()
    metadata:     meta,
  };
}

// Empty DivisionalChart shell — for divisional charts not covered in the spec.
// Stamped as "Placeholder" and carries zero planets/lords so that:
//   (a) sym.hasD10() returns false → D10 rules skip
//   (b) ctx.chartSuite.D9?.planets?.find() returns undefined → D9 rules skip
//   (c) KnowledgeCompletenessEngine marks it as "Missing"
function emptyChart(
  chartType: DivisionalChart["chartType"],
  varga: number,
  purpose: string,
  ascSign: Sign,
): DivisionalChart {
  const houses: House[] = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const sign     = houseSign(ascSign, houseNum);
    return { number: houseNum, sign, signName: SIGN_NAMES[sign], lord: SIGN_RULERS[sign], planets: [] };
  });

  return {
    chartType,
    ascendant:    { sign: ascSign, signName: SIGN_NAMES[ascSign], degreeInSign: 0 },
    planets:      [],
    houses,
    lords:        [],
    aspects:      [],
    conjunctions: [],
    yogas:        [],
    strengths:    [],
    metadata:     { varga, purpose, accuracyWeight: 0, source: "Placeholder" },
  };
}

// ── Public harness API ────────────────────────────────────────────────────────

const builder = new AstrologyContextBuilder();

export function runGoldChart(spec: GoldChartSpec): AstrologyContext {
  const asc = spec.ascendantSign;

  const d1 = buildDivisionalChart(
    "D1",
    { varga: 1, purpose: "Natal", accuracyWeight: 1.0, source: "Computed" },
    asc,
    spec.planets,
  );

  const d9Asc   = (spec.d9?.ascendantSign  ?? asc) as Sign;
  const d10Asc  = (spec.d10?.ascendantSign ?? asc) as Sign;

  const d9 = spec.d9
    ? buildDivisionalChart("D9",  { varga: 9,  purpose: "Soul/Marriage", accuracyWeight: 0.7, source: "Computed" }, d9Asc,  spec.d9.planets)
    : emptyChart("D9",  9,  "Soul/Marriage", asc);

  const d10 = spec.d10
    ? buildDivisionalChart("D10", { varga: 10, purpose: "Career",        accuracyWeight: 0.8, source: "Computed" }, d10Asc, spec.d10.planets)
    : emptyChart("D10", 10, "Career",        asc);

  const chartSuite: ChartSuite = {
    D1:  d1,
    D2:  emptyChart("D2",  2,  "Wealth",   asc),
    D3:  emptyChart("D3",  3,  "Siblings", asc),
    D4:  emptyChart("D4",  4,  "Property", asc),
    D7:  emptyChart("D7",  7,  "Children", asc),
    D9:  d9,
    D10: d10,
    D12: emptyChart("D12", 12, "Parents",  asc),
  };

  const dashaInfo: DashaInfo | undefined = spec.dasha
    ? {
        mahadasha:   spec.dasha.mahadasha,
        antardasha:  spec.dasha.antardasha,
        periodStart: spec.dasha.periodStart,
        periodEnd:   spec.dasha.periodEnd,
      }
    : undefined;

  return builder.build(chartSuite, {
    dasha:   dashaInfo,
    transit: spec.transitEvidence,
  });
}
