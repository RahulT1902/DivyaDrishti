import { DashboardUIState } from "../dashboard/dashboardStateComposer";
import { GoalAlignedState } from "../intelligence/contracts/goalState";
import { RankedMemory } from "./adaptiveMemoryRanker";

export interface DailyPriority {
  rank: 1 | 2 | 3;
  focus: string;
  rationale: string; // Internal — used for prompt assembly, not shown in UI
  category: "action" | "avoid" | "mindset";
}

/**
 * FocusPrioritizer: The "Cognitive Load Governor".
 *
 * RULE: NEVER output more than 3 priorities.
 * 
 * Responsibility: Synthesizes signals from the life state, active goals,
 * and ranked memories into a single, clear Top 3 focus list for the day.
 */
export class FocusPrioritizer {
  prioritize(
    state: DashboardUIState,
    activeGoals: GoalAlignedState[],
    memories: RankedMemory[]
  ): DailyPriority[] {
    const candidates: Array<{ focus: string; rationale: string; score: number; category: DailyPriority["category"] }> = [];

    // ── SIGNAL 1: State behavioral guidance ──────────────────────────────────
    state.currentPhase.focus.slice(0, 2).forEach(f => {
      candidates.push({
        focus: f,
        rationale: `Current execution mode (${state.currentPhase.executionMode}) rewards this behavior.`,
        score: 0.8,
        category: "action",
      });
    });

    // ── SIGNAL 2: Highest-priority active goal ───────────────────────────────
    const topGoal = activeGoals.sort((a, b) => b.alignmentScore - a.alignmentScore)[0];
    if (topGoal) {
      const topAction = topGoal.strategicGuidance.prioritizeNow[0];
      if (topAction) {
        candidates.push({
          focus: `[${topGoal.title}] — ${topAction}`,
          rationale: `Goal alignment at ${Math.round(topGoal.alignmentScore * 100)}%.`,
          score: topGoal.alignmentScore,
          category: "action",
        });
      }
    }

    // ── SIGNAL 3: Memory-influenced caution ──────────────────────────────────
    const cautionMemory = memories.find(m => m.influence === "caution");
    if (cautionMemory && state.lifeScores.volatility > 50) {
      candidates.push({
        focus: "Practice deliberate pauses before major commitments today",
        rationale: `Behavioral pattern (${cautionMemory.content}) may be amplified by current volatility.`,
        score: 0.7,
        category: "mindset",
      });
    }

    // ── SIGNAL 4: Transition warning ─────────────────────────────────────────
    if (state.nextTransition.daysRemaining <= 7) {
      candidates.push({
        focus: `Begin consolidating momentum before the upcoming ${state.nextTransition.to} phase`,
        rationale: `Major phase shift in ${state.nextTransition.daysRemaining} days.`,
        score: 0.85,
        category: "action",
      });
    }

    // ── HARD CONSTRAINT: Top 3 only, deduplicated ────────────────────────────
    const seen = new Set<string>();
    const top3 = candidates
      .sort((a, b) => b.score - a.score)
      .filter(c => {
        if (seen.has(c.focus)) return false;
        seen.add(c.focus);
        return true;
      })
      .slice(0, 3);

    return top3.map((c, i) => ({
      rank: (i + 1) as 1 | 2 | 3,
      focus: c.focus,
      rationale: c.rationale,
      category: c.category,
    }));
  }
}
