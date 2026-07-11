import { DecisionFactor, TimingWindow, DecisionGraph } from "../../core/types";
import { DomainSignal, Recommendation } from "../../core/domain";

// CareerAssessment is the structured output of the Career Domain Engine.
//
// Intentional absences:
//   - No planet names
//   - No house numbers
//   - No yoga names
//   - No dasha lords
//
// All of those belong to earlier symbolic layers. The LLM narrator receives
// this structure and writes the human-readable interpretation from it.
// The narrator's job is language, not reasoning.

export interface CareerAssessment {
  domain: "Career";

  // ── Top-level state ────────────────────────────────────────────────────────
  currentState: string;           // "Highly Favorable" | "Favorable" | "Moderate" | "Challenging" | "Highly Challenging"
  confidence: number;             // 0–100 overall career confidence

  // ── Domain signals ─────────────────────────────────────────────────────────
  // Stable API — consumers filter/display these; never need the raw chart.
  signals: DomainSignal[];

  // ── Convenience accessors derived from signals ─────────────────────────────
  leadershipPotential:      number;  // 0–100
  entrepreneurshipPotential: number;  // 0–100
  jobStability:             number;  // 0–100
  promotionPotential:       number;  // 0–100
  growthPotential:          number;  // 0–100

  // ── Timing ────────────────────────────────────────────────────────────────
  bestTiming: TimingWindow;

  // ── Evidence ──────────────────────────────────────────────────────────────
  supportingFactors: DecisionFactor[];
  blockingFactors:   DecisionFactor[];
  risks:             string[];

  // ── Decision support ──────────────────────────────────────────────────────
  recommendations: Recommendation[];

  // ── Full decision graph (for LLM context) ─────────────────────────────────
  decisionGraph: DecisionGraph;

  // ── Traceability ──────────────────────────────────────────────────────────
  ruleSetVersion: string;
}
