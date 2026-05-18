import { LifeState } from "../intelligence/contracts/lifeState";
import { TimelineProjection } from "../intelligence/contracts/timelineState";
import { differenceInDays } from "date-fns";

export interface DashboardUIState {
  currentPhase: {
    title: string;
    summary: string;
    executionMode: string;
    focus: string[];
    avoid: string[];
    dominantTone: string;
  };
  
  momentum: {
    label: string;
    score: number;
    trend: "up" | "down" | "stable";
    color: "purple" | "emerald" | "rose" | "amber";
  }[];

  nextTransition: {
    label: string;
    daysRemaining: number;
    from: string;
    to: string;
    intensity: number;
  };

  timeline: TimelineProjection;
  
  lifeScores: {
    stability: number;
    clarity: number;
    volatility: number;
  };
}

/**
 * DashboardStateComposer: The "UI Payload Engine".
 * Responsibility: Normalizes and compresses complex intelligence into a scannable dashboard state.
 */
export class DashboardStateComposer {
  compose(lifeState: LifeState, timeline: TimelineProjection): DashboardUIState {
    // 1. Derive Momentum Cards
    const momentum = [
      { 
        label: "Career Momentum", 
        score: lifeState.activeDomains.career.score, 
        trend: lifeState.activeDomains.career.momentum > 0 ? "up" : "down" as any,
        color: "purple" as any
      },
      { 
        label: "Financial Stability", 
        score: lifeState.activeDomains.finance.score, 
        trend: "stable" as any,
        color: "emerald" as any
      },
      { 
        label: "Emotional Load", 
        score: lifeState.emotionalState.emotionalLoad * 10, 
        trend: lifeState.emotionalState.emotionalLoad > 5 ? "up" : "stable" as any,
        color: "rose" as any
      }
    ];

    // 2. Identify Next Major Transition
    const nextWindow = timeline.windows.find(w => new Date(w.startDate) > new Date());
    const nextTransition = {
      label: nextWindow ? `Next: ${nextWindow.category}` : "Stable Cycle",
      daysRemaining: nextWindow ? differenceInDays(new Date(nextWindow.startDate), new Date()) : 0,
      from: lifeState.overallState.title.split(":")[0],
      to: nextWindow ? nextWindow.title : "Unknown",
      intensity: nextWindow?.intensity || 5
    };

    return {
      currentPhase: {
        title: lifeState.overallState.title,
        summary: lifeState.overallState.summary,
        executionMode: lifeState.metadata.dominantPlanetaryDrivers.includes("Saturn") ? "ARCHITECT" : "WARRIOR",
        focus: lifeState.behavioralGuidance.recommendedBehaviors,
        avoid: lifeState.behavioralGuidance.avoidBehaviors,
        dominantTone: lifeState.emotionalState.dominantTone
      },
      momentum,
      nextTransition,
      timeline,
      lifeScores: {
        stability: lifeState.overallState.stabilityScore * 10,
        clarity: lifeState.overallState.clarityScore,
        volatility: lifeState.overallState.volatilityScore * 10
      }
    };
  }
}
