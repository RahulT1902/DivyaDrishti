import { Sign } from "../types";

export type HouseCategory =
  | "Trikona"   // 1, 5, 9  — auspicious trines
  | "Kendra"    // 1, 4, 7, 10 — angular houses
  | "Dusthana"  // 6, 8, 12 — houses of challenge
  | "Maraka"    // 2, 7  — mortality indicators
  | "Upachaya"  // 3, 6, 10, 11 — growth houses
  | "Neutral";  // 2, 3, 11 — remaining

export function classifyHouse(house: number): HouseCategory[] {
  const cats: HouseCategory[] = [];
  if ([1, 5, 9].includes(house))        cats.push("Trikona");
  if ([1, 4, 7, 10].includes(house))    cats.push("Kendra");
  if ([6, 8, 12].includes(house))       cats.push("Dusthana");
  if ([2, 7].includes(house))           cats.push("Maraka");
  if ([3, 6, 10, 11].includes(house))   cats.push("Upachaya");
  if (cats.length === 0)                cats.push("Neutral");
  return cats;
}

export function isTrikona(house: number): boolean  { return [1, 5, 9].includes(house); }
export function isKendra(house: number): boolean   { return [1, 4, 7, 10].includes(house); }
export function isDusthana(house: number): boolean { return [6, 8, 12].includes(house); }
export function isMaraka(house: number): boolean   { return [2, 7].includes(house); }

// Badhaka house depends on lagna type:
//   Movable lagna (1,4,7,10) → 11th house is Badhaka
//   Fixed lagna   (2,5,8,11) → 9th house is Badhaka
//   Dual lagna    (3,6,9,12) → 7th house is Badhaka
export function getBadhakaHouse(lagnaSign: Sign): number {
  if ([1, 4, 7, 10].includes(lagnaSign)) return 11;
  if ([2, 5, 8, 11].includes(lagnaSign)) return 9;
  return 7; // dual signs
}
