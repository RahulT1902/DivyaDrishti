import { DecisionFactor, TimingWindow, DecisionGraph, UncertaintyProfile, PredictionHorizon, KnowledgeCompletenessScore, ExplainabilityCoverage } from "../../core/types";
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

  // ── Uncertainty ───────────────────────────────────────────────────────────
  // What data gaps, weak evidence, or conflicts reduce reliability.
  // Transparent to the LLM narrator so it can qualify its language appropriately.
  uncertainty: UncertaintyProfile;

  // ── Prediction horizon ────────────────────────────────────────────────────
  // How long this assessment is expected to remain valid.
  horizon: PredictionHorizon;

  // ── Knowledge completeness ────────────────────────────────────────────────
  // How much of the intended reasoning model was applied to produce this assessment.
  // Distinct from confidence: completeness measures reasoning breadth; confidence
  // measures belief strength within whatever reasoning was applied.
  completeness: KnowledgeCompletenessScore;

  // ── Explainability coverage ───────────────────────────────────────────────
  // What fraction of inference conclusions can be traced through the full
  // Fact → Inference → Hypothesis → Decision chain. A transparency metric —
  // opaque conclusions cannot be interrogated by "Why?" traversal.
  explainability: ExplainabilityCoverage;

  // ── Traceability ──────────────────────────────────────────────────────────
  ruleSetVersion: string;
}
