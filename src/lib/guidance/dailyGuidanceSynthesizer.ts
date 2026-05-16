import { UserMemory, UserGoal } from "@prisma/client";
import { DashboardUIState } from "../dashboard/dashboardStateComposer";
import { LifeState } from "../intelligence/contracts/lifeState";
import { GoalAlignedState } from "../intelligence/contracts/goalState";
import { AdaptiveMemoryRanker } from "./adaptiveMemoryRanker";
import { FocusPrioritizer } from "./focusPrioritizer";
import { GuidanceCompressor, DailyBriefing } from "./guidanceCompressor";
import { NarrativePromptAssembler } from "../intelligence/narrative/narrativePromptAssembler";
import { NarrativeRenderer } from "../intelligence/narrative/narrativeRenderer";

export interface AdaptiveGuidanceOutput {
  briefing: DailyBriefing;
  humanizedHeadline: string;    // LLM-refined, guardrail-validated
  source: {
    memoryCount: number;
    goalCount: number;
    narrativeSource: "llm" | "template_fallback";
  };
}

/**
 * DailyGuidanceSynthesizer: The "Morning Briefing Orchestrator".
 *
 * Invariant: LLMs narrate. Deterministic systems reason.
 *
 * Pipeline:
 *   Memories → AdaptiveMemoryRanker
 *   Goals + State → FocusPrioritizer (≤3 priorities)
 *   All → GuidanceCompressor (lightweight DailyBriefing)
 *   Briefing → NarrativePromptAssembler → NarrativeRenderer (humanized)
 */
export class DailyGuidanceSynthesizer {
  private memoryRanker = new AdaptiveMemoryRanker();
  private focusPrioritizer = new FocusPrioritizer();
  private compressor = new GuidanceCompressor();
  private promptAssembler = new NarrativePromptAssembler();
  private renderer = new NarrativeRenderer();

  async synthesize(
    dashboardState: DashboardUIState,
    lifeState: LifeState,
    goals: GoalAlignedState[],
    memories: UserMemory[]
  ): Promise<AdaptiveGuidanceOutput> {

    // ── Stage 1: Rank memories for today's context ────────────────────────
    const rankedMemories = this.memoryRanker.rank(memories, lifeState);

    // ── Stage 2: Prioritize (hard cap: 3) ────────────────────────────────
    const priorities = this.focusPrioritizer.prioritize(dashboardState, goals, rankedMemories);

    // ── Stage 3: Compress into lightweight briefing ───────────────────────
    const briefing = this.compressor.compress(dashboardState, priorities, rankedMemories);

    // ── Stage 4: Humanize headline via controlled LLM call ────────────────
    const prompt = this.promptAssembler.assembleDailyBriefing(dashboardState);
    const narrative = await this.renderer.render(
      prompt,
      "DAILY_BRIEFING",
      { executionMode: dashboardState.currentPhase.executionMode }
    );

    // Inject humanized headline — deterministic briefing structure unchanged
    briefing.headline = narrative.text || briefing.headline;

    return {
      briefing,
      humanizedHeadline: briefing.headline,
      source: {
        memoryCount: rankedMemories.length,
        goalCount: goals.length,
        narrativeSource: narrative.source,
      },
    };
  }
}
