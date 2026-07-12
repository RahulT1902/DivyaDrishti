import { DecisionFactor, TimingWindow, DecisionGraph, UncertaintyProfile, PredictionHorizon, KnowledgeCompletenessScore, ExplainabilityCoverage } from "../../core/types";
import { DomainSignal, Recommendation } from "../../core/domain";
import { TemporalStabilityScore } from "../../core/transit-engine/types";

// HealthAssessment is the structured output of the Health Domain Engine.
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
//
// Note: D6 (Shashtamsha — the health divisional chart) is NOT yet in ChartSuite.
// This assessment is therefore D1-based only.  D6 integration is planned for
// Phase A and will significantly improve health timing specificity.

export interface HealthAssessment {
  domain: "Health";

  // ── Top-level state ────────────────────────────────────────────────────────
  currentState: string;    // "Highly Favorable" | "Favorable" | "Moderate" | "Challenging" | "Highly Challenging"
  confidence:   number;    // 0–100 overall health confidence

  // ── Domain signals ─────────────────────────────────────────────────────────
  // Stable API — consumers filter/display these; never need the raw chart.
  signals: DomainSignal[];

  // ── Convenience accessors derived from signals ─────────────────────────────
  constitutionStrength: number;  // 0–100
  immunityResilience:   number;  // 0–100
  mentalHealthScore:    number;  // 0–100
  longevityIndicator:   number;  // 0–100
  recoveryCapacity:     number;  // 0–100

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

  // ── Temporal Stability ────────────────────────────────────────────────────
  // How consistent is the health picture across daily/weekly/monthly/yearly?
  // Present only when transit evidence is available.
  // The LLM narrator uses `insight` to distinguish "today" from "this year":
  //   Stable  → consistent outlook regardless of horizon asked
  //   Volatile → "Long-term promise is strong, but a short-lived transit is
  //               creating temporary sensitivity"
  temporalStability?: TemporalStabilityScore;
}
