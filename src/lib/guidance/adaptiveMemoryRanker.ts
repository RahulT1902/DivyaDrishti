import { UserMemory } from "@prisma/client";
import { LifeState } from "../intelligence/contracts/lifeState";

export interface RankedMemory {
  content: string;
  relevanceScore: number;
  type: string;
  influence: "tone" | "focus" | "caution" | "reinforcement";
}

/**
 * AdaptiveMemoryRanker: Makes guidance feel personally aware.
 *
 * Responsibility: Surfaces the most contextually relevant memories for the
 * current life phase and execution mode. Does NOT expose raw memory to the LLM —
 * only distilled influence signals are passed downstream.
 */
export class AdaptiveMemoryRanker {
  rank(memories: UserMemory[], lifeState: LifeState): RankedMemory[] {
    const currentMode = lifeState.metadata.dominantPlanetaryDrivers[0] || "General";
    const currentVolatility = lifeState.overallState.volatilityScore;
    const ranked: RankedMemory[] = [];

    for (const memory of memories) {
      let score = memory.importance; // Base from stored importance

      // Boost FEAR memories during high-volatility phases
      // (They warrant extra caution emphasis in guidance)
      if (memory.memoryType === "FEAR" && currentVolatility > 6) {
        score += 0.3;
      }

      // Boost AMBITION memories during expansion phases
      if (memory.memoryType === "AMBITION" && currentVolatility < 5) {
        score += 0.2;
      }

      // Boost OBSERVATION memories always — they contain behavioral patterns
      if (memory.memoryType === "OBSERVATION") {
        score += 0.15;
      }

      // Decay old memories (recency bias)
      const daysSince = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - daysSince / 90); // Decays over 90 days
      score *= (0.6 + 0.4 * recencyFactor);

      ranked.push({
        content: memory.content,
        relevanceScore: Math.min(1, score),
        type: memory.memoryType,
        influence: this.deriveInfluence(memory.memoryType, currentVolatility),
      });
    }

    // Return top 3 most relevant — never flood the guidance engine
    return ranked
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }

  private deriveInfluence(
    type: string,
    volatility: number
  ): RankedMemory["influence"] {
    if (type === "FEAR") return volatility > 5 ? "caution" : "tone";
    if (type === "AMBITION") return "reinforcement";
    if (type === "OBSERVATION") return "focus";
    if (type === "PREFERENCE") return "tone";
    return "tone";
  }
}
