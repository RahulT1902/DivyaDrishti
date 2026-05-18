import { TransitIntelligence } from "../transit/types";
import { synthesizeCosmicClimate } from "../transit/transitSynthesizer";
import { AgentResult, TransitAgentOutput, AgentSignal } from "./types";
import { AstroSignal } from "../types";

/**
 * TransitAgent: Analyzes current planetary transits and short-term timing.
 * Responsibility: Detects environmental triggers and immediate "Life OS" pressures.
 */
export class TransitAgent {
  name = "TransitAgent";

  async process(transits: TransitIntelligence[]): Promise<AgentResult<TransitAgentOutput>> {
    const climate = synthesizeCosmicClimate(transits);
    
    // Extract signals for synthesis
    const signals: AgentSignal[] = transits.map(t => ({
      agentName: this.name,
      factor: `Transit ${t.planet}`,
      source: "transit",
      impact: (t.intensity?.pressure ?? 0) > 7 ? "restrictive" : ((t.intensity?.opportunity ?? 0) > 7 ? "supportive" : "mixed"),
      weight: t.tier === 1 ? 8 : 4,
      confidence: 0.9,
      reason: t.nature
    }));

    const activeTriggers: AstroSignal[] = transits.map(t => ({
      planet: t.planet,
      strength: (t.intensity?.pressure ?? 0) > 7 ? "strong" : "neutral",
      strengthScore: (t.intensity?.opportunity ?? 0) * 10,
      nature: (t.intensity?.pressure ?? 0) > 7 ? "challenging" : "supportive",
      area: Object.entries(t.affectedDomains ?? {})   // ← null guard
        .filter(([_, val]) => (val as number) > 5)
        .map(([key]) => key),
      reason: t.nature
    }));

    const data: TransitAgentOutput = {
      activeTriggers,
      intensity: ((climate.netPressure ?? 0) + (climate.netOpportunity ?? 0) + (climate.netVolatility ?? 0)) / 3,
      manifestations: {
        external: transits.flatMap(t => t.manifestations?.external ?? []).slice(0, 5),
        internal: transits.flatMap(t => t.manifestations?.internal ?? []).slice(0, 5)
      }
    };

    return {
      data,
      signals,
      confidence: 0.88,
      reasoning: [
        climate.headline,
        `Detected ${activeTriggers.length} significant transit triggers.`,
        `Net Cosmic Volatility: ${climate.netVolatility}/10`
      ]
    };
  }
}
