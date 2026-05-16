import { AstroSignal, AstroEvidence } from "../types";

export function buildEvidence(signals: AstroSignal[]): AstroEvidence[] {
  return signals.map(signal => {
    let impact: "supportive" | "restrictive" | "mixed" = "mixed";
    
    if (signal.nature === "supportive" || signal.strength === "strong") {
      impact = "supportive";
    }
    if (signal.nature === "challenging" || signal.strength === "weak") {
      impact = "restrictive";
    }
    if (signal.planet === "Saturn" && signal.nature !== "supportive") {
      impact = "restrictive";
    }
    
    // Create explanatory text mapping
    let explanation = signal.reason;
    if (signal.planet === "Saturn") {
      explanation = "Creates increased responsibility before recognition.";
    } else if (signal.planet === "Jupiter") {
      explanation = "Increases visibility and provides systemic support.";
    } else if (signal.planet === "Rahu") {
      explanation = "Increases ambition but may cloud clear judgment.";
    }

    return {
      factor: `${signal.planet} influence`,
      category: signal.isStrongTransit ? "transit" : "dasha",
      impact,
      strength: Math.ceil((signal.strengthScore || 50) / 10), // Scale 1-10
      explanation
    };
  });
}
