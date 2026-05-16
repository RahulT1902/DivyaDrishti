import { TimelineWindow } from "@prisma/client";

export interface GoalAlignedState {
  goalId: string;
  title: string;

  // Strategic Metrics
  alignmentScore: number;      // 0-1 (Weather vs. Destination)
  executionDifficulty: "low" | "moderate" | "high" | "extreme";
  
  timingSupport: {
    current: number;           // 0-10
    next90Days: number;        // Projected momentum
    next12Months: number;      // Long-term promise
  };

  strategicGuidance: {
    prioritizeNow: string[];   // Immediate high-ROI actions
    prepareNow: string[];      // Groundwork for future windows
    avoidNow: string[];        // High-friction actions
  };

  environmentalSupport: {
    momentum: number;          // Speed of current
    resistance: number;        // Headwinds (Saturn/Rahu)
    clarity: number;           // Decision-making environment
  };

  psychologicalRiskFactors: string[]; // e.g., "Impulsive Scaling", "Emotional Fatigue"

  recommendedExecutionStyle: string; // e.g., "Slow Disciplined Execution", "Bold Visibility"

  suggestedHabits: string[];   // Astrologically adapted habits for this goal

  // Goal-Specific Projected Windows
  cautionWindows: any[]; 
  opportunityWindows: any[];
}
