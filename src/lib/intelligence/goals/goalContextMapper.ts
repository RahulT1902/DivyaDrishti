import { LifeState } from "../contracts/lifeState";
import { GoalAlignedState } from "../contracts/goalState";
import { GoalAlignmentScorer } from "./goalAlignmentScorer";
import { GoalFrictionResolver } from "./goalFrictionResolver";
import { ExecutionStyleEngine } from "./executionStyleEngine";
import { UserGoal } from "@prisma/client";

/**
 * GoalContextMapper: The "Route Planner".
 * Responsibility: Maps a specific user destination (Goal) against the current terrain (LifeState).
 */
export class GoalContextMapper {
  private scorer = new GoalAlignmentScorer();
  private frictionResolver = new GoalFrictionResolver();
  private styleEngine = new ExecutionStyleEngine();

  async mapGoalToState(goal: UserGoal, lifeState: LifeState): Promise<GoalAlignedState> {
    const alignment = this.scorer.calculateAlignment(goal, lifeState);
    const friction = this.frictionResolver.resolveFriction(goal, lifeState);
    const execution = this.styleEngine.recommendStyle(lifeState);

    return {
      goalId: goal.id,
      title: goal.title,

      alignmentScore: alignment.score,
      executionDifficulty: alignment.difficulty,

      timingSupport: {
        current: Math.round(alignment.score * 10),
        next90Days: 7, // To be implemented by TimelineProjector
        next12Months: 8
      },

      strategicGuidance: {
        prioritizeNow: execution.behaviors.slice(0, 2),
        prepareNow: friction.guidance,
        avoidNow: [...execution.avoid, ...friction.risks]
      },

      environmentalSupport: {
        momentum: lifeState.overallState.momentumScore,
        resistance: lifeState.overallState.volatilityScore,
        clarity: lifeState.overallState.clarityScore
      },

      psychologicalRiskFactors: friction.risks,

      recommendedExecutionStyle: execution.style,

      suggestedHabits: execution.behaviors.map(b => `${b} (Aligned with ${lifeState.metadata.dominantPlanetaryDrivers[0]})`),

      cautionWindows: lifeState.cautionAreas.filter(c => c.domain === goal.category.toLowerCase()),
      opportunityWindows: lifeState.opportunityWindows.filter(w => w.domain === goal.category.toLowerCase())
    };
  }
}
