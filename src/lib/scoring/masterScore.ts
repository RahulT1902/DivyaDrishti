/**
 * Master Scoring Engine
 * Combines Dasha Strength, Transit Scores, and Natal Promise alongside Conflict Penalties
 * to generate the unified predictive mathematical Edge (0-100).
 */

export function calculateMasterScore(
  dashaScore: number,
  transitScore: number,
  natalPromiseScore: number,
  conflictPenalty: number
): number {
  const score = (dashaScore * 0.40) + (transitScore * 0.35) + (natalPromiseScore * 0.15) + (conflictPenalty * 0.10);
  return Math.max(0, Math.min(100, score));
}
