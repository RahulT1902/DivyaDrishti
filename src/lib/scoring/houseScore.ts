/**
 * House Strength (Power) Engine
 * Trikona (1, 5, 9): 95 (Most Fortunate)
 * Kendra (1, 4, 7, 10): 85 (Action-oriented)
 * Succedent (2, 5, 8, 11): 65 (Growth)
 * Cadent (3, 6, 9, 12): 50 (Transformation)
 * Dusthana (6, 8, 12): 30 (Loss/Conflict)
 */

export function getHouseTypeScore(houseNumber: number): number {
  const TRIKONA = [1, 5, 9];
  const KENDRA = [1, 4, 7, 10];
  const DUSTHANA = [6, 8, 12];
  const SUCCEDENT = [2, 5, 8, 11];
  const CADENT = [3, 6, 9, 12];

  // Priority Override: Trikona > Kendra > Othets
  if (TRIKONA.includes(houseNumber)) return 95;
  if (KENDRA.includes(houseNumber)) return 85;
  if (DUSTHANA.includes(houseNumber)) return 30;
  if (SUCCEDENT.includes(houseNumber)) return 65;
  if (CADENT.includes(houseNumber)) return 50;

  return 55; // Default Neutral
}
