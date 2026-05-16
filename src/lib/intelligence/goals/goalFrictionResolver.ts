import { LifeState } from "../contracts/lifeState";
import { UserGoal } from "@prisma/client";

/**
 * GoalFrictionResolver: The "Sober Advisor".
 * Responsibility: Detects when goals are ill-timed or behaviorally unsupported.
 */
export class GoalFrictionResolver {
  resolveFriction(goal: UserGoal, lifeState: LifeState): { risks: string[]; guidance: string[] } {
    const risks: string[] = [];
    const guidance: string[] = [];

    const volatility = lifeState.overallState.volatilityScore;
    const resilience = lifeState.emotionalState.resilienceScore;

    // 1. Volatility vs. Aggression Friction
    if (volatility > 7 && (goal.priority === 5 || goal.title.toLowerCase().includes("launch"))) {
      risks.push("High environmental volatility makes aggressive scaling high-risk right now.");
      guidance.push("Delay full-scale execution; focus on strategic preparation and testing.");
    }

    // 2. Resilience vs. Pressure Friction
    if (resilience < 4) {
      risks.push("Low emotional resilience may lead to burnout if high-pressure goals are pursued aggressively.");
      guidance.push("Prioritize restorative habits and delegated execution to maintain momentum.");
    }

    // 3. Domain Specific Friction
    const domain = goal.category.toLowerCase();
    const domainState = (lifeState.activeDomains as any)[domain];
    
    if (domainState && domainState.momentum < 0) {
      risks.push(`Current ${domain} momentum is trending downward.`);
      guidance.push(`Consolidate existing ${domain} assets before initiating new ventures.`);
    }

    return { risks, guidance };
  }
}
