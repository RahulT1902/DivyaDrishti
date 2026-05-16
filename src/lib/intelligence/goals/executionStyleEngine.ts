import { LifeState } from "../contracts/lifeState";

/**
 * ExecutionStyleEngine: Translates "Weather" into "Behavioral Mode".
 * Responsibility: Recommends the optimal style of action for the current environment.
 */
export class ExecutionStyleEngine {
  recommendStyle(lifeState: LifeState): { style: string; behaviors: string[]; avoid: string[] } {
    const drivers = lifeState.metadata.dominantPlanetaryDrivers;
    
    if (drivers.includes("Saturn")) {
      return {
        style: "Architect Mode (Disciplined Execution)",
        behaviors: ["Structured planning", "Long-term documentation", "Incremental progress"],
        avoid: ["Impulsive pivots", "Cutting corners", "Rapid scaling"]
      };
    }

    if (drivers.includes("Mars") || drivers.includes("Rahu")) {
      return {
        style: "Warrior Mode (Strategic Boldness)",
        behaviors: ["Bold outreach", "Decisive experimentation", "Visible action"],
        avoid: ["Indecision", "Excessive caution", "Hiding progress"]
      };
    }

    if (drivers.includes("Jupiter") || drivers.includes("Venus")) {
      return {
        style: "Diplomat Mode (Collaborative Expansion)",
        behaviors: ["Networking", "Building partnerships", "Creative expression"],
        avoid: ["Isolation", "Unnecessary conflict", "Fixed thinking"]
      };
    }

    return {
      style: "Observer Mode (Fluid Adaptability)",
      behaviors: ["Active listening", "Refining systems", "Patience"],
      avoid: ["Forced growth", "Rigid deadlines"]
    };
  }
}
