import {
  AstrologyContext, ChartSuite, PlanetRole, PlanetStrength,
  YogaAnalysis, YogaActivation, DashaInfo,
  KnowledgeCompletenessScore, ExplainabilityCoverage,
} from "../types";
import { TransitEvidence, TemporalHorizon } from "../transit-engine/types";
import { computeTemporalStability } from "../transit-engine/evaluateRules";
import { PlanetIntelligenceEngine } from "../planet-intelligence";
import { PlanetStrengthEngine } from "../strength-engine";
import { YogaEngine } from "../yoga-engine";
import { ActivationEngine } from "../activation-engine";
import {
  InferenceEngine, HypothesisEngine,
  InferenceGraphBuilder, computeExplainabilityCoverage,
} from "../inference-engine";
import { KnowledgeCompletenessEngine } from "../knowledge-completeness";

export interface BuildOptions {
  dasha?:   DashaInfo;
  transit?: TransitEvidence[];
  // Temporal horizon — controls how fast vs slow planet transits are weighted.
  // Defaults to "daily" when omitted.
  horizon?: TemporalHorizon;
  // Today's Moon nakshatra index (0–26). Passed from the route where the transit Moon
  // position is available. Used by domain engines as the daily health differentiator.
  moonNakshatraIndex?: number;
}

// AstrologyContextBuilder is the single orchestration layer.
// It runs all symbolic engines in order and assembles the complete context.
//
// Architecture:
//   Swiss Ephemeris output
//        ↓
//   ChartSuite (built externally by chart-engine)
//        ↓
//   PlanetIntelligenceEngine  → planetRoles
//        ↓
//   PlanetStrengthEngine      → planetStrengths
//        ↓
//   YogaEngine                → YogaDetectionResult (birthPromises)
//        ↓
//   ActivationEngine          → YogaActivation[] (timing-aware status)
//        ↓
//   YogaAnalysis (assembled)
//        ↓
//   InferenceEngine           → InferenceConclusion[] (stamped with provenance + version)
//        ↓
//   HypothesisEngine          → Hypothesis[] (cross-domain abstract concepts)
//        ↓
//   InferenceGraphBuilder          → InferenceNode[] (bidirectional "Why?" graph)
//        ↓
//   KnowledgeCompletenessEngine    → KnowledgeCompletenessScore (how much of the model was applied)
//   computeExplainabilityCoverage  → ExplainabilityCoverage (what fraction is fully graph-traceable)
//        ↓
//   AstrologyContext (complete)

export class AstrologyContextBuilder {
  private readonly intelligenceEngine  = new PlanetIntelligenceEngine();
  private readonly strengthEngine      = new PlanetStrengthEngine();
  private readonly yogaEngine          = new YogaEngine();
  private readonly activationEngine    = new ActivationEngine();
  private readonly inferenceEngine     = new InferenceEngine();
  private readonly hypothesisEngine    = new HypothesisEngine();
  private readonly inferenceGraphBuilder = new InferenceGraphBuilder();

  build(chartSuite: ChartSuite, options: BuildOptions = {}): AstrologyContext {
    const d1 = chartSuite.D1;

    // ── Layer 1: Functional roles ────────────────────────────────────────────
    const planetRoles: PlanetRole[] = this.intelligenceEngine.evaluate(d1);

    // ── Layer 2: Planetary strengths ─────────────────────────────────────────
    const planetStrengths: PlanetStrength[] = this.strengthEngine.evaluate(d1);

    // ── Layer 3: Yoga detection (birth promises, immutable) ──────────────────
    const detection = this.yogaEngine.evaluate({ chart: d1, roles: planetRoles, strengths: planetStrengths });

    // ── Layer 4: Activation (timing-aware, mutable) ──────────────────────────
    const activations: YogaActivation[] = this.activationEngine.evaluate({
      birthPromises:    detection.birthPromises,
      planetRoles,
      planetStrengths,
      dasha:            options.dasha,
      transit:          options.transit,
      transitHorizon:   options.horizon,
    });

    const yogaAnalysis: YogaAnalysis = {
      // Detection (immutable)
      birthPromises:        detection.birthPromises,
      dominantPromises:     detection.dominantPromises,
      conflictingYogas:     detection.conflictingYogas,
      missed:               detection.missed,
      overallBirthStrength: detection.overallBirthStrength,

      // Activation (mutable)
      activations,
      overallActivationScore: computeActivationScore(activations),

      evidence: detection.evidence,
    };

    // ── Build partial context (needed for subsequent engines) ─────────────────
    // temporalStability is computed here, alongside the transit data, so all
    // downstream consumers (HealthEngine, narrator prompt) can read it directly.
    const temporalStability = options.transit?.length
      ? computeTemporalStability(options.transit)
      : undefined;

    const withYoga: Omit<AstrologyContext, "inferences" | "hypotheses" | "inferenceGraph" | "completeness" | "explainability"> = {
      chartSuite,
      planetRoles,
      planetStrengths,
      yogaAnalysis,
      dasha:               options.dasha,
      transit:             options.transit,
      temporalStability,
      moonNakshatraIndex:  options.moonNakshatraIndex,
    };

    // ── Layer 5: Inference (pre-derived conclusions, provenance-stamped) ──────
    const inferences = this.inferenceEngine.derive({
      ...withYoga,
      inferences: [], hypotheses: [], inferenceGraph: [],
      completeness:   STUB_COMPLETENESS,
      explainability: STUB_EXPLAINABILITY,
    });

    const withInferences: AstrologyContext = {
      ...withYoga,
      inferences,
      hypotheses:     [],
      inferenceGraph: [],
      completeness:   STUB_COMPLETENESS,
      explainability: STUB_EXPLAINABILITY,
    };

    // ── Layer 6: Hypothesis (abstract cross-domain concepts) ──────────────────
    const hypotheses = this.hypothesisEngine.derive(withInferences);

    const withHypotheses: AstrologyContext = { ...withInferences, hypotheses };

    // ── Layer 7: Inference graph (bidirectional Why? traversal) ───────────────
    const inferenceGraph = this.inferenceGraphBuilder.build(withHypotheses);

    // ── Layer 8: Meta-quality metrics (computed last — need full context) ─────
    // completeness: how much of the reasoning model was applied (uses dasha/transit presence)
    // explainability: what fraction of conclusions trace through Fact→…→Decision
    const withGraph: Omit<AstrologyContext, "completeness" | "explainability"> = {
      ...withHypotheses,
      inferenceGraph,
    };
    const completeness   = KnowledgeCompletenessEngine.compute(withGraph);
    const explainability = computeExplainabilityCoverage(inferences, inferenceGraph);

    return { ...withGraph, completeness, explainability };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Stubs for meta-quality metrics in intermediate pipeline steps (Layers 5–7).
// Replaced with real values at Layer 8 once the full context is assembled.
// Never exposed to external consumers.

const STUB_COMPLETENESS: KnowledgeCompletenessScore = {
  overall:           0,
  components:        [],
  missingComponents: [],
  partialComponents: [],
  implementedWeight: 0,
};

const STUB_EXPLAINABILITY: ExplainabilityCoverage = {
  total:                0,
  fullyExplainable:     0,
  partiallyExplainable: 0,
  opaque:               0,
  coverageScore:        0,
};

function computeActivationScore(activations: YogaActivation[]): number {
  if (activations.length === 0) return 0;
  const active = activations.filter(a => a.status !== "Dormant");
  if (active.length === 0) return 0;
  return Math.round(
    active.reduce((sum, a) => sum + a.activationScore, 0) / active.length,
  );
}
