import type { PlanetName, Sign } from "../types";
import { getAscendantLordshipInfo, getHouseLord, getHouseSign, ZODIAC_SIGNS } from "./lordshipEngine";
import { getDignityInfo, type DignityInfo, type PlanetaryCondition, type SignDignity } from "./dignityEngine";

export interface PlanetPlacementFact {
  planet: PlanetName;
  sign: Sign;
  signName: string;
  house: number;
}

export interface ChartFacts {
  ascendantSign: Sign;
  ascendantSignName: string;
  lagnaLord: PlanetName;
  houseSigns: Record<number, Sign>;
  houseSignNames: Record<number, string>;
  houseLords: Record<number, PlanetName>;
  planetLordships: Record<PlanetName, number[]>;
  natalPlanetPositions: Partial<Record<PlanetName, PlanetPlacementFact>>;
  transitPlanetPositions: Partial<Record<PlanetName, PlanetPlacementFact>>;
  planetaryDignities: Partial<Record<PlanetName, SignDignity>>;
  planetaryConditions: Partial<Record<PlanetName, PlanetaryCondition>>;
}

export function buildChartFacts(
  ascendantSign: Sign,
  natalPlanets: Array<{ planet: PlanetName; sign: Sign; house?: number }>,
  transitPlanets: Array<{ planet: PlanetName; sign: Sign; house?: number }> = [],
  options: { isRetrograde?: boolean; isCombust?: boolean } = {}
): ChartFacts {
  const lordshipInfo = getAscendantLordshipInfo(ascendantSign);
  const natalPositions: Partial<Record<PlanetName, PlanetPlacementFact>> = {};
  const transitPositions: Partial<Record<PlanetName, PlanetPlacementFact>> = {};
  const dignities: Partial<Record<PlanetName, SignDignity>> = {};
  const conditions: Partial<Record<PlanetName, PlanetaryCondition>> = {};

  for (const p of natalPlanets) {
    const calculatedHouse = p.house ?? (((((p.sign - ascendantSign) % 12) + 12) % 12) + 1);
    natalPositions[p.planet] = {
      planet: p.planet,
      sign: p.sign,
      signName: ZODIAC_SIGNS[p.sign - 1],
      house: calculatedHouse,
    };
    const dignity = getDignityInfo(p.planet, p.sign, options);
    dignities[p.planet] = dignity.condition.signDignity;
    conditions[p.planet] = dignity.condition;
  }

  for (const p of transitPlanets) {
    const calculatedHouse = p.house ?? (((((p.sign - ascendantSign) % 12) + 12) % 12) + 1);
    transitPositions[p.planet] = {
      planet: p.planet,
      sign: p.sign,
      signName: ZODIAC_SIGNS[p.sign - 1],
      house: calculatedHouse,
    };
  }

  return {
    ascendantSign,
    ascendantSignName: lordshipInfo.lagnaSignName,
    lagnaLord: lordshipInfo.lagnaLord,
    houseSigns: lordshipInfo.houseSigns,
    houseSignNames: lordshipInfo.houseSignNames,
    houseLords: lordshipInfo.houseRulers,
    planetLordships: lordshipInfo.planetRuledHouses,
    natalPlanetPositions: natalPositions,
    transitPlanetPositions: transitPositions,
    planetaryDignities: dignities,
    planetaryConditions: conditions,
  };
}

export function validateInterpretationFacts(
  chartFacts: ChartFacts,
  textToValidate: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ALL_PLANETS: PlanetName[] = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"
  ];

  for (let house = 1; house <= 12; house++) {
    const authoritativeLord = chartFacts.houseLords[house];
    for (const planet of ALL_PLANETS) {
      if (planet !== authoritativeLord) {
        // Strict pattern checks for incorrect house lord claims
        const patterns = [
          new RegExp(`\\b${house}(?:st|nd|rd|th)?[- ]house lord ${planet}\\b`, "i"),
          new RegExp(`\\b${house}(?:st|nd|rd|th)? lord ${planet}\\b`, "i"),
          new RegExp(`\\blord of (?:your |the |a )?${house}(?:st|nd|rd|th)? house is ${planet}\\b`, "i"),
          new RegExp(`\\b${planet} is (?:your |the |a )?${house}(?:st|nd|rd|th)?[- ]house lord\\b`, "i"),
          new RegExp(`\\b${planet} is (?:your |the |a )?${house}(?:st|nd|rd|th)? lord\\b`, "i"),
        ];

        for (const pattern of patterns) {
          if (pattern.test(textToValidate)) {
            errors.push(
              `Calculation Integrity Failure: Text incorrectly asserts '${planet}' is the ${house}th house lord for ${chartFacts.ascendantSignName} Ascendant. Authoritative ${house}th house lord is '${authoritativeLord}'.`
            );
          }
        }
      }
    }
  }

  // Placement Mismatch Validation
  for (const planet of ALL_PLANETS) {
    const natalFact = chartFacts.natalPlanetPositions[planet];
    if (natalFact) {
      for (let wrongHouse = 1; wrongHouse <= 12; wrongHouse++) {
        if (wrongHouse !== natalFact.house) {
          const placementPattern = new RegExp(`\\b${planet} (?:is )?in (?:natal )?house ${wrongHouse}\\b`, "i");
          if (placementPattern.test(textToValidate)) {
            errors.push(
              `Placement Integrity Failure: Text asserts '${planet}' is in natal house ${wrongHouse}, but authoritative chart facts place '${planet}' in house ${natalFact.house}.`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
