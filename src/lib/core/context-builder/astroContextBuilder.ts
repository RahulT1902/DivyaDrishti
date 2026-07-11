import {
  AstrologyContext, ChartSuite, PlanetRole, PlanetStrength,
  YogaAnalysis, YogaActivation, DashaInfo,
} from "../types";
import { PlanetIntelligenceEngine } from "../planet-intelligence";
import { PlanetStrengthEngine } from "../strength-engine";
import { YogaEngine } from "../yoga-engine";
import { ActivationEngine } from "../activation-engine";
import { InferenceEngine, HypothesisEngine, InferenceGraphBuilder } from "../inference-engine";

export interface BuildOptions {
  dasha?:   DashaInfo;   // current dasha period — activates dasha-based yoga status
  transit?: unknown;     // current transit positions — Phase 5
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
//   InferenceGraphBuilder     → InferenceNode[] (bidirectional "Why?" graph)
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
      birthPromises:   detection.birthPromises,
      planetRoles,
      planetStrengths,
      dasha:           options.dasha,
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
    const withYoga: Omit<AstrologyContext, "inferences" | "hypotheses" | "inferenceGraph"> = {
      chartSuite,
      planetRoles,
      planetStrengths,
      yogaAnalysis,
      dasha: options.dasha,
    };

    // ── Layer 5: Inference (pre-derived conclusions, provenance-stamped) ──────
    const inferences = this.inferenceEngine.derive({ ...withYoga, inferences: [], hypotheses: [], inferenceGraph: [] });

    const withInferences: AstrologyContext = {
      ...withYoga,
      inferences,
      hypotheses:    [],
      inferenceGraph: [],
    };

    // ── Layer 6: Hypothesis (abstract cross-domain concepts) ──────────────────
    const hypotheses = this.hypothesisEngine.derive(withInferences);

    const withHypotheses: AstrologyContext = { ...withInferences, hypotheses };

    // ── Layer 7: Inference graph (bidirectional Why? traversal) ───────────────
    const inferenceGraph = this.inferenceGraphBuilder.build(withHypotheses);

    return { ...withHypotheses, inferenceGraph };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeActivationScore(activations: YogaActivation[]): number {
  if (activations.length === 0) return 0;
  const active = activations.filter(a => a.status !== "Dormant");
  if (active.length === 0) return 0;
  return Math.round(
    active.reduce((sum, a) => sum + a.activationScore, 0) / active.length,
  );
}
