import { DomainSignal } from "./types";

export interface TensionResolution {
  netState: string;
  primaryConflict: string;
  synthesis: string;
  pressure: number;
  opportunity: number;
  stability: number;
}

export function resolveTensions(
  supportive: DomainSignal[],
  restrictive: DomainSignal[]
): TensionResolution {
  const supportWeight = supportive.reduce((acc, s) => acc + s.weight, 0);
  const restrictWeight = restrictive.reduce((acc, s) => acc + s.weight, 0);
  
  const totalWeight = supportWeight + restrictWeight;
  const ratio = totalWeight > 0 ? supportWeight / totalWeight : 0.5;

  let netState = "stable flow";
  if (ratio > 0.7) netState = "accelerated growth";
  else if (ratio > 0.55) netState = "gradual expansion";
  else if (ratio < 0.3) netState = "structural decline";
  else if (ratio < 0.45) netState = "heavy restriction";
  else netState = "mixed pressures";

  // Identify Primary Conflict
  const topSupport = supportive.sort((a, b) => b.weight - a.weight)[0]?.factor || "General alignment";
  const topRestrict = restrictive.sort((a, b) => b.weight - a.weight)[0]?.factor || "General inertia";
  
  const primaryConflict = `${topSupport} vs ${topRestrict}`;

  // Generate Synthesis Text
  let synthesis = "";
  if (ratio > 0.6) {
    synthesis = `Growth is clearly visible, driven by ${topSupport.toLowerCase()}, though ${topRestrict.toLowerCase()} creates minor friction.`;
  } else if (ratio < 0.4) {
    synthesis = `Significant pressure from ${topRestrict.toLowerCase()} is dominating the phase, requiring ${topSupport.toLowerCase()} to be used as a stabilizing anchor.`;
  } else {
    synthesis = `A balanced state of 'slow expansion' where progress from ${topSupport.toLowerCase()} is met with equal discipline from ${topRestrict.toLowerCase()}.`;
  }

  // Multi-dimensional scoring
  const pressure = Math.min(10, Math.round(restrictWeight / 2));
  const opportunity = Math.min(10, Math.round(supportWeight / 2));
  const stability = Math.min(10, Math.max(1, 10 - Math.abs(supportWeight - restrictWeight)));

  return {
    netState,
    primaryConflict,
    synthesis,
    pressure,
    opportunity,
    stability
  };
}
