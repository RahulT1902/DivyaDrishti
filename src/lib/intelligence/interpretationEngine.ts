import { extractAstroSignals } from "./astroSignals";
import { mapAstroToMeaning } from "./meaningMapper";
import { buildMasterPrompt } from "./promptBuilder";
import { DecisionSignal, HumanGuidance, Intent, Timeframe } from "./types";

/**
 * Main Entry: Interpretation Engine (The Brain)
 */

export async function generateHumanGuidance(
  natalChart: any,
  currentTransits: any,
  dasha: any,
  intent: Intent,
  timeframe: Timeframe,
  lastDecisionSignal?: DecisionSignal
): Promise<HumanGuidance> {
  
  // 1. Layer 1: Extract Astro Truth
  const signals = extractAstroSignals(natalChart, currentTransits, dasha, intent);

  // 2. Layer 2: Map Meaning
  const state = mapAstroToMeaning(signals, intent, timeframe, lastDecisionSignal);

  // 3. Layer 3: Build Prompt (Contract for LLM)
  const prompt = buildMasterPrompt(state, intent, timeframe, signals);
  
  // 4. Simulated AI Generation (Fallback for implementation)
  return simulateAIGeneration(state, intent, timeframe);
}

/**
 * Simulated Fallback Generator (Deterministic-feeling logic)
 */
function simulateAIGeneration(state: any, intent: Intent, timeframe: Timeframe): HumanGuidance {
  const { decisionSignal, emotionalTone, conflictLevel, confidenceLevel, confidenceScore, evolution } = state;

  const oneLineTruth = decisionSignal === "ACT" 
    ? "Moving forward with clarity. Align your actions with your purpose."
    : decisionSignal === "WAIT"
    ? "Wait for the dust to settle. Patience is your greatest ally."
    : "Protect your energy. This is a phase of consolidation and review.";

  const timingInsight = timeframe === "today" 
    ? "Clarity improves toward the evening hours."
    : timeframe === "this-week"
    ? "Actionable windows emerge after Wednesday."
    : "Steady growth throughout the month.";

  return {
    oneLineTruth,
    emotionalTone,
    decisionSignal,
    conflictLevel,
    confidenceLevel,
    confidenceScore,
    evolution,
    currentSituation: "You are currently moving through a phase of shifting perspectives. The heavens are inviting you to reflect on your long-term goals while managing immediate responsibilities.",
    whatThisMeans: `In your ${intent}, this manifests as a need for balancing external pressure with internal peace. You may feel a pull toward rapid movement, but the alignment favors steady steps.`,
    whatToDo: [
      "Prioritize clarity over speed",
      "Engage in reflective observation",
      "Consolidate your current position"
    ],
    whatToAvoid: [
      "Impulsive commitments",
      "Overextending your energy",
      "Ignoring subtle internal warnings"
    ],
    timingInsight,
    timingBreakdown: {
      start: "Initial pressure, focus on routine.",
      mid: "A window of clarity opens for discussions.",
      end: "A phase of steady integration and results."
    }
  };
}
