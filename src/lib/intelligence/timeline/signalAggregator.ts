import { LifeState } from "../contracts/lifeState";
import { DashaAgentOutput, TransitAgentOutput } from "../agents/types";

export interface TimePointSignal {
  date: Date;
  intensity: number;
  sentiment: "supportive" | "challenging" | "mixed";
  dominantPlanet: string;
}

/**
 * SignalAggregator: The Time-Series Engine.
 * Responsibility: Samples cosmic signals over a range to identify energetic trends.
 */
export class SignalAggregator {
  aggregate(
    startDate: Date, 
    endDate: Date, 
    dasha: DashaAgentOutput, 
    baseTransit: TransitAgentOutput
  ): TimePointSignal[] {
    const signals: TimePointSignal[] = [];
    const dayStep = 3; // Sample every 3 days for efficiency

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // In a real implementation, we would call the Transit Engine for future dates
      // For MVP, we simulate future transits by modulating the baseTransit
      const modulation = Math.sin(currentDate.getTime() / (1000 * 60 * 60 * 24 * 7)); // Weekly wave
      
      signals.push({
        date: new Date(currentDate),
        intensity: Math.max(1, Math.min(10, baseTransit.intensity + (modulation * 2))),
        sentiment: modulation > 0.3 ? "supportive" : (modulation < -0.3 ? "challenging" : "mixed"),
        dominantPlanet: baseTransit.activeTriggers[0]?.planet || "General"
      });

      currentDate.setDate(currentDate.getDate() + dayStep);
    }

    return signals;
  }
}
