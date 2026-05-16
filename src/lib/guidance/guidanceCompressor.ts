import { DailyPriority } from "./focusPrioritizer";
import { DashboardUIState } from "../dashboard/dashboardStateComposer";
import { RankedMemory } from "./adaptiveMemoryRanker";

export interface DailyBriefing {
  date: string;
  executionMode: string;
  headline: string;            // Single sentence — the "why today matters"
  priorities: string[];        // Exactly 1-3 items
  avoid: string[];             // Exactly 1-2 items
  memoryInfluence?: string;    // Optional — only shown if memory is highly relevant
  transitionAlert?: string;    // Only shown if shift is within 7 days
  confidenceScore: number;
}

/**
 * GuidanceCompressor: The "Brevity Enforcer".
 *
 * Responsibility: Takes rich internal signals and compresses them into a
 * lightweight, scannable briefing. Enforces hard output size limits.
 */
export class GuidanceCompressor {
  compress(
    state: DashboardUIState,
    priorities: DailyPriority[],
    memories: RankedMemory[]
  ): DailyBriefing {
    // ── Headline: One sentence max ──────────────────────────────────────────
    const headline = this.deriveHeadline(state);

    // ── Priorities: Max 3 ───────────────────────────────────────────────────
    const priorityTexts = priorities
      .filter(p => p.category === "action" || p.category === "mindset")
      .slice(0, 3)
      .map(p => p.focus);

    // ── Avoid list: Max 2 (from state, not raw astrology) ───────────────────
    const avoid = state.currentPhase.avoid.slice(0, 2);

    // ── Memory influence: Only surface if high relevance ────────────────────
    const dominantMemory = memories.find(m => m.relevanceScore > 0.7);
    const memoryInfluence = dominantMemory?.influence === "caution"
      ? "Your historical patterns suggest extra vigilance around reactive decisions today."
      : undefined;

    // ── Transition alert: Only within 7 days ────────────────────────────────
    const transitionAlert = state.nextTransition.daysRemaining <= 7
      ? `Shift approaching in ${state.nextTransition.daysRemaining} days — begin consolidating current phase.`
      : undefined;

    return {
      date: new Date().toISOString(),
      executionMode: state.currentPhase.executionMode,
      headline,
      priorities: priorityTexts,
      avoid,
      memoryInfluence,
      transitionAlert,
      confidenceScore: state.timeline.confidenceScore,
    };
  }

  private deriveHeadline(state: DashboardUIState): string {
    const trajectory = state.timeline.overallTrajectory.direction;
    const mode = state.currentPhase.executionMode;

    const headlines: Record<string, string> = {
      ASCENDING:      `Momentum is building — ${mode.toLowerCase()} execution amplifies today's advantage.`,
      STABLE:         `Steady conditions favor consistent, deliberate progress over reactive pivots.`,
      VOLATILE:       `Elevated complexity today — measured responses consistently outperform instinct.`,
      RESTRUCTURING:  `This is a phase for building, not expanding — disciplined foundations pay long-term dividends.`,
    };

    return headlines[trajectory] || headlines.STABLE;
  }
}
