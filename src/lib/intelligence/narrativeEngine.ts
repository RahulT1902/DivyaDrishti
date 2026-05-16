import { DeepInsight, Intent, Timeframe } from "./types";
import { buildSignals } from "./inference/buildSignals";
import { buildEvidence } from "./inference/buildEvidence";
import { solveTensions } from "./inference/tensionEngine";
import { generatePhases } from "./inference/timelineGenerator";
import { computeConfidence } from "./inference/confidenceEngine";
import { getDomainTranslation } from "./interpreters";

export function generateNarrative(
  intent: Intent,
  timeframe: Timeframe,
  chart: any,
  temporal: any,
  _signals?: any[] // Keep for backward compatibility, but we will recalculate
): DeepInsight {
  // 0. Safety Check
  if (!temporal || !temporal.stack) {
    return getFallbackNarrative(intent);
  }

  // 1. Build Signals
  const signals = buildSignals(chart, temporal.transits || [], temporal.stack, intent);

  // 2. Build Evidence Graph
  const evidence = buildEvidence(signals);

  // 3. Solve Tensions
  const tensions = solveTensions(evidence);

  // 4. Generate Phases
  const phases = generatePhases(evidence, intent.domain);

  // 5. Compute Confidence
  const confidence = computeConfidence(evidence);

  // 6. Domain Translation
  const realityTranslation = getDomainTranslation(intent.domain, evidence);

  // 7. Compose Final DeepInsight
  return {
    heroInsight: tensions[0]?.synthesis || "Cosmic alignment requires observation.",
    dashaContext: {
      mahadasha: temporal.stack.mahadasha || "Unknown",
      antardasha: temporal.stack.antardasha || "Unknown",
      pratyantar: temporal.stack.pratyantar || "Unknown",
      transitAnchors: evidence.filter(e => e.category === "transit").map(e => e.factor)
    },
    theme: `${intent.domain.charAt(0).toUpperCase() + intent.domain.slice(1)} Phase`,
    realityTranslation,
    evidence,
    tensions,
    phases,
    confidence,
    specifics: { domain: intent.domain, timeframe },
    verdict: "Proceed with awareness."
  };
}

function getFallbackNarrative(intent: Intent): DeepInsight {
  return {
    heroInsight: "Recalibrating cosmic alignment.",
    dashaContext: { mahadasha: "N/A", antardasha: "N/A", pratyantar: "N/A", transitAnchors: [] },
    theme: "Recalibration",
    realityTranslation: "Waiting for accurate birth data.",
    evidence: [],
    tensions: [],
    phases: [],
    confidence: { timing: 0, manifestation: 0, volatility: 0 },
    specifics: {},
    verdict: "Please update your profile details."
  };
}
