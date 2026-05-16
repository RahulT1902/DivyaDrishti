import { TimelineWindow } from "../contracts/timelineState";

/**
 * NarrativeStyleGuide: Vocabulary and tone reference for the LLM governor.
 * Provides deterministic chapter titles and framing words before LLM refinement.
 */

// ── EXECUTION MODE LANGUAGE ───────────────────────────────────────────────────

export const EXECUTION_MODE_NARRATIVE: Record<string, { title: string; summary: string }> = {
  ARCHITECT: {
    title: "Structured Execution Phase",
    summary: "This phase rewards steady, disciplined progress. Build systems, document decisions, and extend your long-term foundations rather than chasing rapid visibility.",
  },
  WARRIOR: {
    title: "Strategic Boldness Phase",
    summary: "Current conditions favor decisive action and visible leadership. Initiate projects, make outreach, and push forward initiatives that require momentum.",
  },
  DIPLOMAT: {
    title: "Collaborative Expansion Phase",
    summary: "This is a powerful window for relationship-building, partnership formation, and collaborative growth. Lead with openness rather than assertion.",
  },
  HEALER: {
    title: "Internal Integration Phase",
    summary: "The environment currently supports deep reflection and internal recalibration. Recovery and restoration now build the resilience needed for future expansion.",
  },
  OBSERVER: {
    title: "Adaptive Observation Phase",
    summary: "A fluid phase that rewards patience, listening, and refinement over decisive action. Resist forcing outcomes; let clarity emerge naturally.",
  },
};

// ── CATEGORY LANGUAGE MAP ─────────────────────────────────────────────────────

export const WINDOW_CATEGORY_LANGUAGE: Record<TimelineWindow["category"], string> = {
  EXPANSION: "growth and forward momentum",
  DISCIPLINE: "structural execution and long-term building",
  VOLATILITY: "navigating uncertainty with measured responses",
  RECOVERY: "integration, restoration, and internal recalibration",
  TRANSFORMATION: "deep systemic change and paradigm shifts",
  VISIBILITY: "public presence, leadership, and outward expression",
  EMOTIONAL_PROCESSING: "emotional intelligence and internal clarity",
};

// ── TRAJECTORY LANGUAGE ───────────────────────────────────────────────────────

export const TRAJECTORY_LANGUAGE: Record<string, string> = {
  ASCENDING:      "building upward momentum",
  STABLE:         "maintaining steady consistent progress",
  VOLATILE:       "navigating a period of heightened change",
  RESTRUCTURING:  "undergoing necessary systemic transformation",
};

// ── DOMAIN MOMENTUM LANGUAGE ──────────────────────────────────────────────────

export function deriveCareerNarrative(score: number, trend: string): string {
  if (score > 75 && trend === "up") return "Professional momentum is accelerating. This period rewards visible leadership and bold initiative.";
  if (score > 60) return "Career stability is solid. This phase supports steady execution over aggressive pivoting.";
  if (score < 40) return "Professional conditions may feel slower than desired. This phase rewards consolidation and long-term positioning.";
  return "Career conditions are balanced. Measured, strategic moves carry the best long-term ROI.";
}

export function deriveFinanceNarrative(score: number): string {
  if (score > 70) return "Financial clarity is elevated. Conditions tend to support structural asset growth and strategic investment decisions.";
  if (score < 40) return "Financial conditions may require conservative liquidity management. This phase favors protection over aggressive growth.";
  return "Financial conditions are in a consolidation phase. Building long-term stability tends to outperform short-term plays now.";
}
