import { AstroEvidence, ConfidenceLayer } from "../types";

export function computeConfidence(evidence: AstroEvidence[]): ConfidenceLayer {
  let baseScore = 7;
  
  const hasStrongTransit = evidence.some(e => e.category === "transit" && e.strength >= 8);
  const hasMixedSignals = evidence.some(e => e.impact === "mixed") || 
                          (evidence.some(e => e.impact === "supportive") && evidence.some(e => e.impact === "restrictive"));
                          
  if (hasStrongTransit) baseScore += 1;
  if (hasMixedSignals) baseScore -= 1;
  
  return {
    timing: Math.min(10, baseScore + 1),
    manifestation: Math.min(10, baseScore),
    volatility: hasMixedSignals ? 7 : 4
  };
}
