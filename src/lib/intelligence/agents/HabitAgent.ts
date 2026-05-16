import { AgentResult, AgentSignal } from "./types";
import { DashaAgentOutput, TransitAgentOutput } from "./types";

export interface HabitInput {
  title: string;
  category: string;
}

export interface HabitGuidance {
  adaptation: string;
  intensity: "high" | "moderate" | "low";
  coachingTip: string;
}

/**
 * HabitReinforcementAgent: Creates personalized behavioral guidance.
 * Responsibility: Adapts habits to the current "Cosmic Climate".
 */
export class HabitAgent {
  name = "HabitAgent";

  async adaptHabit(
    habit: HabitInput,
    dasha: DashaAgentOutput,
    transit: TransitAgentOutput
  ): Promise<AgentResult<HabitGuidance>> {
    
    let adaptation = "Maintain consistency in your routine.";
    let intensity: "high" | "moderate" | "low" = "moderate";
    let coachingTip = "Focus on the small wins today.";

    // Example logic: Saturn transits favor discipline/heavy habits
    const hasSaturnPressure = transit.activeTriggers.some(t => t.planet === "Saturn");
    const hasMarsEnergy = transit.activeTriggers.some(t => t.planet === "Mars");

    if (habit.category === "discipline") {
      if (hasSaturnPressure) {
        adaptation = "Current Saturn cycles favor deep structural habits. Double down on discipline.";
        intensity = "high";
        coachingTip = "The structural pressure you feel is fuel for long-term growth.";
      }
    }

    if (habit.category === "meditation" || habit.category === "health") {
      if (hasMarsEnergy) {
        adaptation = "High Mars energy can lead to burnout. Use physical activity to ground the energy.";
        intensity = "high";
        coachingTip = "Move your body to clear the mental static.";
      }
    }

    const data: HabitGuidance = {
      adaptation,
      intensity,
      coachingTip
    };

    return {
      data,
      signals: [],
      confidence: 0.8,
      reasoning: [
        `Mapped habit "${habit.title}" against active transit triggers.`,
        hasSaturnPressure ? "Saturn trigger detected: favoring discipline." : "No major discipline triggers."
      ]
    };
  }
}
