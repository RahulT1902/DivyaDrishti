import { ActionableSignal } from "./interpreter";

export interface MasterSignal {
  state: "AGGRESSIVE" | "RESTRICTIVE" | "NEUTRAL";
  bias: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  stability: "LOW" | "MEDIUM" | "HIGH";
  agreementIndex: number;
  tradableWindow: string;
  reasoning: string;
  dominantPlanet: string;
  favor: string[];
  avoid: string[];
}

const STRENGTH_THRESHOLD = 5.0; // Minimum total strength to fire a master signal

/**
 * The Final Truth Layer.
 * Resolves conflicting signals and produces a singular, actionable Master Signal.
 */
export function resolveSignals(signals: ActionableSignal[]): MasterSignal {
  // 1. Edge-Case Guard: No meaningful alignment
  const totalStrength = signals.reduce((sum, s) => sum + s.strength, 0);
  if (signals.length === 0 || totalStrength < STRENGTH_THRESHOLD) {
    return {
      state: "NEUTRAL",
      bias: "WAIT",
      confidence: 40,
      stability: "HIGH",
      agreementIndex: 0,
      tradableWindow: "N/A",
      reasoning: "No significant celestial alignment detected. Market noise level is high.",
      dominantPlanet: "None",
      favor: ["Patient observation", "Risk conservation"],
      avoid: ["Impulsive entries", "Over-signaling"]
    };
  }

  // 2. Identify Dominant Signal (Conflict Resolution)
  // Higher weight planets (Saturn/Rahu) override lower weight (Mars/Moon)
  const sortedSignals = [...signals].sort((a, b) => b.strength - a.strength);
  const dominant = sortedSignals[0];

  // 3. Agreement Index Calculation
  const alignedSignals = signals.filter(s => s.bias === dominant.bias).length;
  const agreementIndex = alignedSignals / signals.length;

  // 4. Stability Score Calculation
  // Low variance in bias + high agreement = High Stability
  let stability: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  if (agreementIndex >= 0.8) stability = "HIGH";
  if (agreementIndex <= 0.4) stability = "LOW";

  // 5. Confidence Calibration
  // agreement boosts or reduces confidence
  let finalConfidence = dominant.confidence;
  if (agreementIndex > 0.7) finalConfidence = Math.min(finalConfidence + 10, 100);
  if (agreementIndex < 0.4) finalConfidence = Math.max(finalConfidence - 15, 20);

  // 6. Tradable Window Formatting
  const startTime = new Date(dominant.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(dominant.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tradableWindow = `${startTime} – ${endTime}`;

  return {
    state: dominant.bias === "AGGRESSIVE" ? "AGGRESSIVE" : dominant.bias === "RESTRICTIVE" ? "RESTRICTIVE" : "NEUTRAL",
    bias: dominant.bias === "AGGRESSIVE" ? "LONG" : dominant.bias === "RESTRICTIVE" ? "SHORT" : "WAIT",
    confidence: finalConfidence,
    stability,
    agreementIndex,
    tradableWindow,
    reasoning: dominant.reason,
    dominantPlanet: dominant.planet,
    favor: dominant.favor,
    avoid: dominant.avoid
  };
}
