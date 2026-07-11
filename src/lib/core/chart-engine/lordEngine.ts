import { Sign, PlanetName, House, HouseLord, PlanetPlacement } from "../types";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const SIGN_LORDS: Record<Sign, PlanetName> = {
  1:  "Mars",
  2:  "Venus",
  3:  "Mercury",
  4:  "Moon",
  5:  "Sun",
  6:  "Mercury",
  7:  "Venus",
  8:  "Mars",
  9:  "Jupiter",
  10: "Saturn",
  11: "Saturn",
  12: "Jupiter",
};

export const EXALTATION: Partial<Record<PlanetName, Sign>> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6,
  Jupiter: 4, Venus: 12, Saturn: 7,
};

export const DEBILITATION: Partial<Record<PlanetName, Sign>> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12,
  Jupiter: 10, Venus: 6, Saturn: 1,
};

export const OWN_SIGNS: Partial<Record<PlanetName, Sign[]>> = {
  Sun:     [5],
  Moon:    [4],
  Mars:    [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus:   [2, 7],
  Saturn:  [10, 11],
};

export function buildHouses(ascendantSign: Sign, planets: PlanetPlacement[]): House[] {
  return Array.from({ length: 12 }, (_, i) => {
    const h    = i + 1;
    const sign = (((ascendantSign - 1 + i) % 12) + 12) % 12 + 1 as Sign;
    return {
      number: h,
      sign,
      signName: SIGN_NAMES[sign - 1],
      lord: SIGN_LORDS[sign],
      planets: planets.filter(p => p.house === h).map(p => p.planet),
    };
  });
}

export function buildHouseLords(houses: House[], planets: PlanetPlacement[]): HouseLord[] {
  return houses.map(house => {
    const lordPlacement = planets.find(p => p.planet === house.lord);
    const lordSign  = lordPlacement?.sign  ?? house.sign;
    const lordHouse = lordPlacement?.house ?? house.number;

    return {
      house: house.number,
      lord: house.lord,
      lordPlacedInHouse: lordHouse,
      lordPlacedInSign:  lordSign,
      isInOwnHouse:   lordHouse === house.number,
      isExalted:      EXALTATION[house.lord]   === lordSign,
      isDebilitated:  DEBILITATION[house.lord] === lordSign,
    };
  });
}
