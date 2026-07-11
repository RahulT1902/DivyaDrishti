import { PlanetName, PlanetPlacement, Aspect, Sign } from "../types";

// Special aspects beyond the universal 7th-house aspect
const SPECIAL_ASPECTS: Partial<Record<PlanetName, number[]>> = {
  Mars:    [4, 8],   // 4th and 8th
  Jupiter: [5, 9],   // 5th and 9th
  Saturn:  [3, 10],  // 3rd and 10th
};

const ASPECT_LABELS: Record<number, Aspect["aspectType"]> = {
  3: "3rd", 4: "4th", 5: "5th", 7: "7th",
  8: "8th", 9: "9th", 10: "10th",
};

export function computeAspects(planets: PlanetPlacement[]): Aspect[] {
  // Build sign → planet index for O(1) lookup
  const bySign = new Map<Sign, PlanetName[]>();
  for (const p of planets) {
    const list = bySign.get(p.sign) ?? [];
    list.push(p.planet);
    bySign.set(p.sign, list);
  }

  const aspects: Aspect[] = [];

  for (const p of planets) {
    const houseOffsets: Array<{ offset: number; isSpecial: boolean }> = [
      { offset: 7, isSpecial: false },
      ...(SPECIAL_ASPECTS[p.planet] ?? []).map(o => ({ offset: o, isSpecial: true })),
    ];

    for (const { offset, isSpecial } of houseOffsets) {
      // Whole-sign: count `offset` signs forward from planet's sign
      const toSign = (((p.sign - 1 + offset - 1) % 12) + 12) % 12 + 1 as Sign;
      const toHouse = (((p.house - 1 + offset - 1) % 12) + 12) % 12 + 1;
      const toPlanets = (bySign.get(toSign) ?? []).filter(n => n !== p.planet);

      aspects.push({
        fromPlanet: p.planet,
        toSign,
        toHouse,
        toPlanets,
        aspectType: ASPECT_LABELS[offset],
        isSpecial,
      });
    }
  }

  return aspects;
}
