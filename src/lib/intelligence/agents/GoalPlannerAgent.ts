import { AgentResult, AgentSignal } from "./types";
import { DashaAgentOutput, TransitAgentOutput } from "./types";

export interface GoalInput {
  title: string;
  domain: string;
  targetDate?: string;
}

export interface GoalAnalysis {
  alignmentScore: number; // 0-1
  roadmap: string[];
  bestWindow: string;
  cautionWindow: string;
}

/**
 * GoalPlannerAgent: Maps user goals against timing cycles.
 * Responsibility: Provides an action roadmap aligned with astrological "Power Windows".
 */
export class GoalPlannerAgent {
  name = "GoalPlannerAgent";

  async analyzeGoal(
    goal: GoalInput,
    dasha: DashaAgentOutput,
    transit: TransitAgentOutput
  ): Promise<AgentResult<GoalAnalysis>> {
    
    // Simple alignment logic
    let alignmentScore = 0.5;
    const roadmap: string[] = [
      `Define milestones for ${goal.title}`,
      "Review current resource allocation"
    ];

    const domainTriggers = transit.activeTriggers.filter(t => t.area.includes(goal.domain));
    const isChallenging = domainTriggers.some(t => t.nature === "challenging");
    const isSupportive = domainTriggers.some(t => t.nature === "supportive");

    if (isSupportive) {
      alignmentScore += 0.2;
      roadmap.push("Accelerate Phase 1 during current supportive transit.");
    }
    if (isChallenging) {
      alignmentScore -= 0.2;
      roadmap.push("Implement risk mitigation strategies for current structural pressures.");
    }

    // Dasha alignment
    if (dasha.longTermThemes.some(theme => theme.toLowerCase().includes(goal.domain))) {
      alignmentScore += 0.2;
    }

    const data: GoalAnalysis = {
      alignmentScore: Math.max(0, Math.min(1, alignmentScore)),
      roadmap,
      bestWindow: "Next 45 days (High Momentum)",
      cautionWindow: "Last week of the quarter (Retrograde Shift)"
    };

    const signals: AgentSignal[] = [
      {
        agentName: this.name,
        factor: `Goal Alignment: ${goal.title}`,
        source: "natal", // Simplified
        impact: alignmentScore > 0.6 ? "supportive" : (alignmentScore < 0.4 ? "restrictive" : "mixed"),
        weight: 5,
        confidence: 0.8,
        reason: `Goal alignment score based on current Dasha/Transit stack is ${Math.round(alignmentScore * 100)}%`
      }
    ];

    return {
      data,
      signals,
      confidence: 0.85,
      reasoning: [
        `Analyzed goal "${goal.title}" against ${domainTriggers.length} domain triggers.`,
        `Dasha narrative supports ${goal.domain} themes.`
      ]
    };
  }
}
