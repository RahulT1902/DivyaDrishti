import type { PlanetName, Sign } from "../types";

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const SIGN_RULERS: Record<Sign, PlanetName> = {
  1: "Mars",     // Aries
  2: "Venus",    // Taurus
  3: "Mercury",  // Gemini
  4: "Moon",     // Cancer
  5: "Sun",      // Leo
  6: "Mercury",  // Virgo
  7: "Venus",    // Libra
  8: "Mars",     // Scorpio
  9: "Jupiter",  // Sagittarius
  10: "Saturn",  // Capricorn
  11: "Saturn",  // Aquarius
  12: "Jupiter", // Pisces
};

export interface PlanetLordship {
  planet: PlanetName;
  housesRuled: number[];
}

export interface AscendantLordshipInfo {
  lagnaSign: Sign;
  lagnaSignName: string;
  lagnaLord: PlanetName;
  planetLordships: Record<PlanetName, PlanetLordship>;
  planetRuledHouses: Record<PlanetName, number[]>;
  houseRulers: Record<number, PlanetName>;
  houseSigns: Record<number, Sign>;
  houseSignNames: Record<number, string>;
}

export function getAscendantLordshipInfo(lagnaSign: Sign): AscendantLordshipInfo {
  const houseRulers: Record<number, PlanetName> = {};
  const houseSigns: Record<number, Sign> = {};
  const houseSignNames: Record<number, string> = {};
  const planetRuledHouses: Record<PlanetName, number[]> = {
    Sun: [], Moon: [], Mars: [], Mercury: [], Jupiter: [], Venus: [], Saturn: [], Rahu: [], Ketu: [],
  };

  for (let house = 1; house <= 12; house++) {
    const sign = (((lagnaSign + house - 2) % 12) + 1) as Sign;
    const ruler = SIGN_RULERS[sign];

    houseSigns[house] = sign;
    houseSignNames[house] = ZODIAC_SIGNS[sign - 1];
    houseRulers[house] = ruler;

    if (!planetRuledHouses[ruler].includes(house)) {
      planetRuledHouses[ruler].push(house);
    }
  }

  const planetLordships: Record<PlanetName, PlanetLordship> = {
    Sun:     { planet: "Sun",     housesRuled: planetRuledHouses.Sun },
    Moon:    { planet: "Moon",    housesRuled: planetRuledHouses.Moon },
    Mars:    { planet: "Mars",    housesRuled: planetRuledHouses.Mars },
    Mercury: { planet: "Mercury", housesRuled: planetRuledHouses.Mercury },
    Jupiter: { planet: "Jupiter", housesRuled: planetRuledHouses.Jupiter },
    Venus:   { planet: "Venus",   housesRuled: planetRuledHouses.Venus },
    Saturn:  { planet: "Saturn",  housesRuled: planetRuledHouses.Saturn },
    Rahu:    { planet: "Rahu",    housesRuled: planetRuledHouses.Rahu },
    Ketu:    { planet: "Ketu",    housesRuled: planetRuledHouses.Ketu },
  };

  return {
    lagnaSign,
    lagnaSignName: ZODIAC_SIGNS[lagnaSign - 1],
    lagnaLord: SIGN_RULERS[lagnaSign],
    planetLordships,
    planetRuledHouses,
    houseRulers,
    houseSigns,
    houseSignNames,
  };
}
