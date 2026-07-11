import { PlanetName, AstrologicalEvidence } from "../types";

// ── Combustion ────────────────────────────────────────────────────────────────

export interface ModifierResult {
  score: number;
  evidence: AstrologicalEvidence;
}

export function computeCombustion(planet: PlanetName, isCombust: boolean): ModifierResult {
  const score = isCombust ? 15 : 100;
  return {
    score,
    evidence: {
      id:          `${planet}-combustion`,
      category:    "Strength",
      description: isCombust
        ? `${planet} is combust — severely weakened by proximity to the Sun`
        : `${planet} is not combust`,
      strength:    score,
      weight:      0.15,
      sourceChart: "D1",
      planet,
    },
  };
}

// ── Retrograde ────────────────────────────────────────────────────────────────

export function computeRetrograde(planet: PlanetName, isRetrograde: boolean): ModifierResult {
  // Retrograde planets gain extra power (vakri bala) in Vedic tradition
  const score = isRetrograde ? 80 : 50;
  return {
    score,
    evidence: {
      id:          `${planet}-retrograde`,
      category:    "Strength",
      description: isRetrograde
        ? `${planet} is retrograde (Vakri) — amplified intensity and karmic weight`
        : `${planet} is direct in motion`,
      strength:    score,
      weight:      0.10,
      sourceChart: "D1",
      planet,
    },
  };
}

// ── Vargottama ────────────────────────────────────────────────────────────────

export function computeVargottama(planet: PlanetName, isVargottama: boolean): ModifierResult {
  // Vargottama = same sign in D1 and D9 — planet gains stability and strength
  const score = isVargottama ? 88 : 50;
  return {
    score,
    evidence: {
      id:          `${planet}-vargottama`,
      category:    "Strength",
      description: isVargottama
        ? `${planet} is Vargottama — same sign in D1 and D9, conferring extra stability`
        : `${planet} is not Vargottama`,
      strength:    score,
      weight:      0.10,
      sourceChart: "D1",
      planet,
    },
  };
}
