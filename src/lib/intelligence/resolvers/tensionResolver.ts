import { DomainSignal } from "../domain/types";

export interface TensionResolution {
  netState: string;
  primaryConflict: string;
  synthesis: string;
  pressure: number;
  opportunity: number;
  stability: number;
  resilienceRequirement: "low" | "medium" | "high";
}

/**
 * TensionResolver v2: The core logic for navigating life contradictions.
 * Resolves: Astrology vs Behavior, Goals vs Timing, Ambition vs Stability.
 */
export function resolveTensions(
  supportive: DomainSignal[],
  restrictive: DomainSignal[],
  context?: {
    goalAlignment?: number;
    emotionalStability?: number;
    behavioralConsistency?: number;
  }
): TensionResolution {
  const supportWeight = supportive.reduce((acc, s) => acc + s.weight, 0);
  const restrictWeight = restrictive.reduce((acc, s) => acc + s.weight, 0);
  
  const totalWeight = supportWeight + restrictWeight;
  let ratio = totalWeight > 0 ? supportWeight / totalWeight : 0.5;

  // Integrate Human Context into the ratio
  if (context?.behavioralConsistency) {
    // High consistency boosts the opportunity ratio; low consistency acts as a drag
    ratio = (ratio * 0.7) + (context.behavioralConsistency * 0.3);
  }

  let netState = "stable flow";
  if (ratio > 0.75) netState = "accelerated growth";
  else if (ratio > 0.6) netState = "gradual expansion";
  else if (ratio < 0.25) netState = "structural decline";
  else if (ratio < 0.4) netState = "heavy restriction";
  else netState = "mixed pressures";

  // Identify Primary Conflict
  const topSupport = supportive.sort((a, b) => b.weight - a.weight)[0]?.factor || "General alignment";
  const topRestrict = restrictive.sort((a, b) => b.weight - a.weight)[0]?.factor || "General inertia";
  
  const primaryConflict = `${topSupport} vs ${topRestrict}`;

  // Generate Synthesis (Context-Aware)
  let synthesis = "";
  const isEmotionallyVolatile = (context?.emotionalStability || 1) < 0.4;

  if (ratio > 0.65) {
    synthesis = `Growth is clearly visible, driven by ${topSupport.toLowerCase()}. `;
    if (isEmotionallyVolatile) {
      synthesis += "However, low emotional stability suggests a need for structured execution to avoid burnout.";
    } else {
      synthesis += `Friction from ${topRestrict.toLowerCase()} is manageable.`;
    }
  } else if (ratio < 0.35) {
    synthesis = `Significant pressure from ${topRestrict.toLowerCase()} is dominating. `;
    if (context?.goalAlignment && context.goalAlignment > 0.7) {
      synthesis += "Your strong goal alignment acts as a critical anchor during this structural test.";
    } else {
      synthesis += `Use ${topSupport.toLowerCase()} as a stabilizing anchor to navigate this phase.`;
    }
  } else {
    synthesis = `A balanced state of 'slow navigation' where ${topSupport.toLowerCase()} is met with equal discipline from ${topRestrict.toLowerCase()}.`;
  }

  // Multi-dimensional scoring
  const pressure = Math.min(10, Math.round(restrictWeight / 2));
  const opportunity = Math.min(10, Math.round(supportWeight / 2));
  const stability = Math.min(10, Math.max(1, 10 - Math.abs(supportWeight - restrictWeight)));

  const resilienceRequirement = pressure > 7 ? "high" : (pressure > 4 ? "medium" : "low");

  return {
    netState,
    primaryConflict,
    synthesis,
    pressure,
    opportunity,
    stability,
    resilienceRequirement
  };
}
