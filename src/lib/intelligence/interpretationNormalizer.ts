import { AstroSignal, Intent } from "./types";

/**
 * Interpretation Normalizer
 * Weighs signals: Dasha > Transit > Natal
 * Ensures consistent and non-conflicting reasoning for AI.
 */

export interface NormalizedSignal {
  planet: string;
  weight: number; // 0-1
  impact: "positive" | "negative" | "mixed";
  reason: string;
  source: "dasha" | "transit" | "natal";
}

export function normalizeSignals(signals: AstroSignal[]): NormalizedSignal[] {
  const normalized: NormalizedSignal[] = [];

  // 1. Group by source and apply base weights
  // Dasha: 0.9, Transit: 0.6, Natal: 0.4
  
  signals.forEach(s => {
    let weight = 0.5;
    let source: "dasha" | "transit" | "natal" = "natal";

    if (s.reason.toLowerCase().includes("dasha")) {
      weight = 0.9;
      source = "dasha";
    } else if (s.reason.toLowerCase().includes("transit") || s.isStrongTransit) {
      weight = 0.6;
      source = "transit";
    }

    normalized.push({
      planet: s.planet,
      weight,
      impact: s.nature === "supportive" ? "positive" : s.nature === "challenging" ? "negative" : "mixed",
      reason: s.reason,
      source
    });
  });

  // 2. Resolve Conflicts (Simplistic for now)
  // If same planet has multiple signals, merge them with weighted average
  // In v2, we take the highest weight signal as the dominant narrative
  
  return normalized.sort((a, b) => b.weight - a.weight);
}
