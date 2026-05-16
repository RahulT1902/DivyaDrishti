export const SIGN_LORDS: Record<number, string> = {
  1: "Mars",
  2: "Venus",
  3: "Mercury",
  4: "Moon",
  5: "Sun",
  6: "Mercury",
  7: "Venus",
  8: "Mars",
  9: "Jupiter",
  10: "Saturn",
  11: "Saturn",
  12: "Jupiter"
};

export function getHouseLord(houseNumber: number, lagnaSign: number): string {
  // House 1 is lagnaSign
  // House 2 is (lagnaSign + 1) % 12, etc. (normalized to 1-12)
  const sign = ((lagnaSign + houseNumber - 2) % 12) + 1;
  return SIGN_LORDS[sign];
}

export function getLordOfDomain(domain: string, lagnaSign: number): string[] {
  const map: Record<string, number[]> = {
    career: [10, 11],
    finance: [2, 11],
    relationship: [7],
    health: [1, 6],
    mind: [1, 4, 5]
  };

  const houses = map[domain] || [1];
  return houses.map(h => getHouseLord(h, lagnaSign));
}
