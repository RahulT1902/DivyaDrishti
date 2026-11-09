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

const TRANSIT_CONTEXT = /\btransit(?:ing|s)?\b|\bgochar\b|\bcurrently\b|\bright now\b|\bthis (?:week|month|year)\b|\bis moving\b/i;

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
          new RegExp(`(?<!D10\\s+)\\b${house}(?:st|nd|rd|th)?[- ]house lord ${planet}\\b`, "i"),
          new RegExp(`(?<!D10\\s+)\\b${house}(?:st|nd|rd|th)? lord ${planet}\\b`, "i"),
          new RegExp(`\\blord of (?:your |the |a )?${house}(?:st|nd|rd|th)? house is ${planet}\\b`, "i"),
          new RegExp(`(?<!D10\\s+)\\b${planet} is (?:your |the |a )?${house}(?:st|nd|rd|th)?[- ]house lord\\b`, "i"),
          new RegExp(`(?<!D10\\s+)\\b${planet} is (?:your |the |a )?${house}(?:st|nd|rd|th)? lord\\b`, "i"),
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

  // Placement Mismatch Validation — checked per sentence. A sentence about a
  // transit ("transiting Saturn is in house 11") is checked against the
  // transit position, not the natal one; otherwise every correct transit
  // statement failed the gate.
  const sentences = textToValidate.split(/(?<=[.!?])\s+|\n+/);
  for (const sentence of sentences) {
    const explicitlyNatal = /\bnatal\b|\bbirth chart\b|\bat birth\b/i.test(sentence);
    const aboutTransit = !explicitlyNatal && TRANSIT_CONTEXT.test(sentence);
    const positions = aboutTransit ? chartFacts.transitPlanetPositions : chartFacts.natalPlanetPositions;
    const label = aboutTransit ? "transit" : "natal";

    for (const planet of ALL_PLANETS) {
      const fact = positions[planet];
      if (!fact) continue;
      for (let wrongHouse = 1; wrongHouse <= 12; wrongHouse++) {
        if (wrongHouse === fact.house) continue;
        const placementPattern = new RegExp(`\\b${planet} (?:is )?in (?:natal )?house ${wrongHouse}\\b`, "i");
        if (placementPattern.test(sentence)) {
          errors.push(
            `Placement Integrity Failure: Text asserts '${planet}' is in ${label} house ${wrongHouse}, but authoritative chart facts place '${planet}' in house ${fact.house}.`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateInterpretationSynthesis(
  report: { conclusion: { overallScore: number }; evidence?: Array<{ source: string; direction: string; weight: number }> },
  textToValidate: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const score = report.conclusion.overallScore;

  // 1. CERTAINTY Class: FORBIDDEN for any prediction regardless of score.
  // Bare "certain" is the ordinary adjective ("avoid certain foods") and was
  // rejecting normal answers, so only certainty *claims* are matched.
  // "not guaranteed" / "rather than guaranteed outcomes" deny certainty, which
  // the Gold Standard limits paragraph asks for, so the negated forms pass.
  const CERTAINTY_PATTERNS = [
    /(?<!\b(?:not|never|rather than|isn't|aren't|nothing is)\s+(?:yet\s+|always\s+)?)\bguaranteed\b/i,
    /\binevitable\b/i,
    /\b(?:is|are|be|seems|looks) (?:almost |absolutely )?certain\b/i,
    /\bfor certain\b/i,
    /\bcertain to\b/i,
    /\bcertainly (?:will|happen|occur|come|succeed)\b/i,
    /\bwill certainly\b/i,
    /\bdefinitely\b/i,
    /\bwithout a doubt\b/i,
    /\b100% (?:certain|sure|guaranteed)\b/i,
  ];
  for (const pattern of CERTAINTY_PATTERNS) {
    if (pattern.test(textToValidate)) {
      errors.push(
        `Synthesis Integrity Failure: Text uses prohibited CERTAINTY phrasing matching '${pattern}'. Astrological readings must remain probabilistic.`
      );
    }
  }

  // 2. VERY_STRONG Class: Allowed ONLY if Signal Strength >= 72 and Dasha is not challenging
  const dashaChallenging = (report.evidence ?? []).some(e => e.source === "Dasha" && e.direction === "challenging");
  const VERY_STRONG_PATTERNS = [
    /\bexplosive growth\b/i,
    /\bmassive breakthrough\b/i,
    /\bexceptional success\b/i,
    /\bpowerfully indicated\b/i,
    /\bunprecedented surge\b/i,
  ];
  if (score < 72 || dashaChallenging) {
    for (const pattern of VERY_STRONG_PATTERNS) {
      if (pattern.test(textToValidate)) {
        errors.push(
          `Synthesis Integrity Failure: Text uses VERY_STRONG claim matching '${pattern}', but Signal Strength is ${score}/100 (requires >=72) or Dasha creates friction.`
        );
      }
    }
  }

  // 3. STRONG Class: Allowed ONLY if Signal Strength >= 60
  const STRONG_PATTERNS = [
    /\bstrongly supports\b/i,
    /\bhighly favorable\b/i,
    /\bstrong potential\b/i,
    /\bmajor advancement\b/i,
  ];
  if (score < 60) {
    for (const pattern of STRONG_PATTERNS) {
      if (pattern.test(textToValidate)) {
        errors.push(
          `Synthesis Integrity Failure: Text uses STRONG claim matching '${pattern}', but Signal Strength is ${score}/100 (requires >=60).`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
