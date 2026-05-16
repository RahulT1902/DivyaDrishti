import { DashboardUIState } from "../../dashboard/dashboardStateComposer";
import { GoalAlignedState } from "../contracts/goalState";
import {
  EXECUTION_MODE_NARRATIVE,
  WINDOW_CATEGORY_LANGUAGE,
  TRAJECTORY_LANGUAGE,
  deriveCareerNarrative,
  deriveFinanceNarrative,
} from "./narrativeStyleGuide";
import { SYSTEM_PROMPT_CONSTITUTION } from "./narrativeGuardrails";

export type NarrativeType =
  | "STRATEGIC_SUMMARY"
  | "TRANSITION_NARRATIVE"
  | "GOAL_GUIDANCE"
  | "EXECUTION_COACHING"
  | "DAILY_BRIEFING";

export interface NarrativePrompt {
  systemPrompt: string;
  userPayload: string;
  maxTokens: number;
  temperature: number;
}

/**
 * NarrativePromptAssembler: The LLM Governor.
 * 
 * Responsibility: Build controlled, structured prompts from sanitized state data.
 * NEVER exposes raw astrological data to the LLM.
 * ALWAYS injects constitutional rules and tonal guidelines.
 */
export class NarrativePromptAssembler {

  assembleStrategicSummary(state: DashboardUIState): NarrativePrompt {
    const execMode = state.currentPhase.executionMode as string;
    const modeGuide = EXECUTION_MODE_NARRATIVE[execMode] || EXECUTION_MODE_NARRATIVE.ARCHITECT;
    const careerCard = state.momentum.find(m => m.label === "Career Momentum");
    const trajectory = state.timeline.overallTrajectory;

    const payload = `
LIFE PHASE INTELLIGENCE REPORT
================================
Current Phase Title: ${state.currentPhase.title}
Execution Mode: ${execMode} — ${modeGuide.summary}
Overall Trajectory: ${trajectory.direction} (${TRAJECTORY_LANGUAGE[trajectory.direction]})

DOMAIN MOMENTUM:
Career: ${careerCard?.score || 50}% (${careerCard?.trend || "stable"})
Financial Stability: ${state.momentum.find(m => m.label === "Financial Stability")?.score || 50}%
Emotional Load: ${state.momentum.find(m => m.label === "Emotional Load")?.score || 50}%

RESILIENCE METRICS:
Stability Score: ${state.lifeScores.stability}%
Clarity Score: ${state.lifeScores.clarity}%
Volatility: ${state.lifeScores.volatility}%

STRATEGIC FOCUS:
${state.currentPhase.focus.map((f, i) => `${i + 1}. ${f}`).join("\n")}

AVOID:
${state.currentPhase.avoid.map((a, i) => `${i + 1}. ${a}`).join("\n")}

UPCOMING SHIFT:
In ${state.nextTransition.daysRemaining} days: ${state.nextTransition.from} → ${state.nextTransition.to}

TASK:
Write a 3-4 sentence Strategic Summary for the user's current life phase.
Lead with the environmental condition, then the recommended approach, then the upcoming shift.
DO NOT use astrology jargon. Speak like a strategic advisor briefing a senior executive.
Keep the tone: calm, intelligent, non-alarming, actionable.
`;

    return {
      systemPrompt: SYSTEM_PROMPT_CONSTITUTION,
      userPayload: payload.trim(),
      maxTokens: 200,
      temperature: 0.4, // Low temperature for consistency
    };
  }

  assembleGoalGuidance(state: DashboardUIState, goal: GoalAlignedState): NarrativePrompt {
    const payload = `
GOAL INTELLIGENCE REPORT
========================
Goal: ${goal.title}
Current Alignment Score: ${Math.round(goal.alignmentScore * 100)}%
Execution Difficulty: ${goal.executionDifficulty.toUpperCase()}
Recommended Execution Style: ${goal.recommendedExecutionStyle}

ENVIRONMENTAL SUPPORT:
Momentum: ${goal.environmentalSupport.momentum}/10
Resistance: ${goal.environmentalSupport.resistance}/10
Clarity: ${goal.environmentalSupport.clarity}/10

STRATEGIC GUIDANCE:
Prioritize Now: ${goal.strategicGuidance.prioritizeNow.join(", ")}
Prepare Now: ${goal.strategicGuidance.prepareNow.join(", ")}
Avoid Now: ${goal.strategicGuidance.avoidNow.slice(0, 3).join(", ")}

PSYCHOLOGICAL RISK FACTORS:
${goal.psychologicalRiskFactors.join(", ") || "None elevated"}

TASK:
Write 2-3 sentences of goal-specific guidance for someone pursuing: "${goal.title}".
Acknowledge both environmental support and the difficulty.
Be concrete and strategic, not vague or motivational.
`;

    return {
      systemPrompt: SYSTEM_PROMPT_CONSTITUTION,
      userPayload: payload.trim(),
      maxTokens: 150,
      temperature: 0.3, // Very low — goal guidance must be precise
    };
  }

  assembleTransitionNarrative(state: DashboardUIState): NarrativePrompt {
    const { nextTransition } = state;

    const payload = `
TRANSITION INTELLIGENCE
=======================
Current Phase: ${nextTransition.from}
Incoming Phase: ${nextTransition.to}
Days Until Transition: ${nextTransition.daysRemaining}
Incoming Intensity: ${nextTransition.intensity}/10

TASK:
Write 2 sentences describing the upcoming energetic shift in plain, strategic language.
First sentence: What the transition means.
Second sentence: How to prepare.
Tone: calm, anticipatory, not alarming.
`;

    return {
      systemPrompt: SYSTEM_PROMPT_CONSTITUTION,
      userPayload: payload.trim(),
      maxTokens: 100,
      temperature: 0.35,
    };
  }

  assembleExecutionCoaching(executionMode: string): NarrativePrompt {
    const guide = EXECUTION_MODE_NARRATIVE[executionMode] || EXECUTION_MODE_NARRATIVE.ARCHITECT;

    const payload = `
EXECUTION MODE COACHING
=======================
Active Mode: ${executionMode}
Deterministic Summary: ${guide.summary}

TASK:
Expand this into 2-3 coaching sentences for someone in ${executionMode} mode.
Be specific about what "winning" looks like in this mode.
Use direct, non-generic language. Avoid motivational clichés.
`;

    return {
      systemPrompt: SYSTEM_PROMPT_CONSTITUTION,
      userPayload: payload.trim(),
      maxTokens: 120,
      temperature: 0.4,
    };
  }

  assembleDailyBriefing(state: DashboardUIState): NarrativePrompt {
    const payload = `
DAILY BRIEFING PAYLOAD
======================
Phase: ${state.currentPhase.title}
Mode: ${state.currentPhase.executionMode}
Top Focus: ${state.currentPhase.focus[0] || "Structured execution"}
Top Avoid: ${state.currentPhase.avoid[0] || "Reactive decisions"}
Emotional Load: ${state.momentum.find(m => m.label === "Emotional Load")?.score || 50}%
Days to Next Shift: ${state.nextTransition.daysRemaining}

TASK:
Write a single powerful opening sentence for the user's daily briefing.
Format: "[Environmental condition] — [Strategic priority] — [One key warning]"
Max 40 words. Extremely concise. No fluff.
`;

    return {
      systemPrompt: SYSTEM_PROMPT_CONSTITUTION,
      userPayload: payload.trim(),
      maxTokens: 60,
      temperature: 0.3,
    };
  }
}
