import { Signal } from "./triggers";

export interface ActionableSignal extends Signal {
  type: string;
  signalName: string;
  bias: "AGGRESSIVE" | "RESTRICTIVE" | "NEUTRAL";
  confidence: number;
  intensity: "SCALP" | "INTRADAY" | "SWING";
  reason: string;
  favor: string[];
  avoid: string[];
}

/**
 * Translates raw astrological triggers into institutional-grade action objects.
 * This is the Decision-Intelligence Layer.
 */
export function interpretSignal(signal: Signal): ActionableSignal {
  // Base confidence derived from strength
  const confidence = Math.min(Math.floor(signal.strength * 20), 100);

  let bias: "AGGRESSIVE" | "RESTRICTIVE" | "NEUTRAL" = "NEUTRAL";
  let intensity: "SCALP" | "INTRADAY" | "SWING" = "INTRADAY";
  let signalName = `${signal.planet} Catalyst`;
  let reason = `${signal.planet} is activating your natal ${signal.natalPlanet}.`;
  let favor: string[] = [];
  let avoid: string[] = [];

  // Domain-specific interpretation logic
  switch (signal.planet) {
    case "Mars":
      bias = "AGGRESSIVE";
      signalName = "Momentum Surge Window";
      intensity = "SCALP";
      favor = ["Quick execution", "High-frequency activity", "Direct confrontation"];
      avoid = ["Passive waiting", "Indecision", "Long-term planning"];
      break;
    case "Saturn":
      bias = "RESTRICTIVE";
      signalName = "Structural Constraint";
      intensity = "SWING";
      favor = ["System audits", "Risk management", "Debt clearance"];
      avoid = ["New expansions", "Aggressive risk", "Shortcut attempts"];
      break;
    case "Jupiter":
      bias = "AGGRESSIVE";
      signalName = "Expansion Window";
      intensity = "SWING";
      favor = ["Strategic growth", "Resource allocation", "Optimistic outreach"];
      avoid = ["Micro-management", "Extreme caution", "Fear-based exits"];
      break;
    case "Mercury":
      bias = "NEUTRAL";
      signalName = "Information Velocity";
      intensity = "SCALP";
      favor = ["Data analysis", "Contract negotiation", "Communications"];
      avoid = ["Ignoring details", "Technical assumptions", "Silent operations"];
      break;
    case "Rahu":
      bias = "AGGRESSIVE";
      signalName = "Probabilistic Outlier";
      intensity = "INTRADAY";
      favor = ["Trend following", "Innovative disruption", "High-stakes focus"];
      avoid = ["Conventional wisdom", "Conservative entries", "Predictability"];
      break;
    case "Ketu":
      bias = "RESTRICTIVE";
      signalName = "Liquidation Window";
      intensity = "INTRADAY";
      favor = ["Cutting losses", "Introspective review", "Minimalism"];
      avoid = ["Material attachment", "Identity-seeking trades", "Complexity"];
      break;
    default:
      bias = "NEUTRAL";
      intensity = "INTRADAY";
  }

  return {
    ...signal,
    type: "DECISION_SIGNAL",
    signalName,
    bias,
    confidence,
    intensity,
    reason,
    favor,
    avoid
  };
}
