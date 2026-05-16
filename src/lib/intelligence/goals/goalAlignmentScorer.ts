import { LifeState } from "../contracts/lifeState";
import { UserGoal } from "@prisma/client";

/**
 * GoalAlignmentScorer: Measures weather-to-destination synergy.
 * Responsibility: Determines if current cycles support a specific goal category.
 */
export class GoalAlignmentScorer {
  calculateAlignment(goal: UserGoal, lifeState: LifeState): { score: number; difficulty: "low" | "moderate" | "high" | "extreme" } {
    const domain = goal.category.toLowerCase();
    const domainState = (lifeState.activeDomains as any)[domain];
    
    if (!domainState) return { score: 0.5, difficulty: "moderate" };

    // Base score from domain momentum and opportunity
    let score = (domainState.score / 100) * 0.4 + (lifeState.overallState.clarityScore / 10) * 0.3;
    
    // Adjust for timing windows
    const hasOpportunity = lifeState.opportunityWindows.some(w => w.domain === domain);
    if (hasOpportunity) score += 0.2;

    const hasCaution = lifeState.cautionAreas.some(c => c.domain === domain);
    if (hasCaution) score -= 0.15;

    // Difficulty mapping
    let difficulty: "low" | "moderate" | "high" | "extreme" = "moderate";
    const volatility = lifeState.overallState.volatilityScore;
    
    if (volatility > 7) difficulty = "extreme";
    else if (volatility > 5 || score < 0.4) difficulty = "high";
    else if (score > 0.7) difficulty = "low";

    return {
      score: Math.max(0, Math.min(1, score)),
      difficulty
    };
  }
}
