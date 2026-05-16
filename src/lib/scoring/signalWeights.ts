import { AgentSignal } from "./agents/types";

/**
 * SignalScore System
 * Normalizes signals from various layers (Natal, Dasha, Transit) 
 * into a standard 0-100 impact scale.
 */

export const SOURCE_BIAS = {
  natal: 0.15, // Foundational promise
  dasha: 0.45, // Dominant timing narrative
  transit: 0.40 // Environmental triggers
};

export function calculateNormalizedScore(signals: AgentSignal[]): number {
  if (signals.length === 0) return 50;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const bias = SOURCE_BIAS[signal.source as keyof typeof SOURCE_BIAS] || 0.1;
    const direction = signal.impact === "supportive" ? 1 : (signal.impact === "restrictive" ? -1 : 0);
    
    // Impact = (Base Weight * Bias)
    const impact = signal.weight * bias;
    
    // Signal Contribution (-100 to 100)
    const contribution = direction * 100;
    
    totalWeightedScore += contribution * impact;
    totalWeight += impact;
  }

  if (totalWeight === 0) return 50;

  const normalized = (totalWeightedScore / totalWeight);
  
  // Map -100...100 to 0...100
  return Math.max(0, Math.min(100, 50 + (normalized / 2)));
}

export function calculatePressureLevel(signals: AgentSignal[]): number {
  const restrictive = signals.filter(s => s.impact === "restrictive");
  if (restrictive.length === 0) return 1;

  const totalPressure = restrictive.reduce((acc, s) => {
    const bias = SOURCE_BIAS[s.source as keyof typeof SOURCE_BIAS] || 0.1;
    return acc + (s.weight * bias);
  }, 0);

  return Math.min(10, Math.max(1, Math.round(totalPressure * 2)));
}

export function calculateOpportunityLevel(signals: AgentSignal[]): number {
  const supportive = signals.filter(s => s.impact === "supportive");
  if (supportive.length === 0) return 1;

  const totalOpportunity = supportive.reduce((acc, s) => {
    const bias = SOURCE_BIAS[s.source as keyof typeof SOURCE_BIAS] || 0.1;
    return acc + (s.weight * bias);
  }, 0);

  return Math.min(10, Math.max(1, Math.round(totalOpportunity * 2)));
}
