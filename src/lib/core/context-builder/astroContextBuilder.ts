import {
  AstrologyContext, ChartSuite, PlanetRole, PlanetStrength,
  YogaAnalysis, YogaActivation, DashaInfo,
} from "../types";
import { PlanetIntelligenceEngine } from "../planet-intelligence";
import { PlanetStrengthEngine } from "../strength-engine";
import { YogaEngine } from "../yoga-engine";
import { ActivationEngine } from "../activation-engine";
import { InferenceEngine } from "../inference-engine";

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
//   InferenceEngine           → InferenceConclusion[] (for domain engines)
//        ↓
//   AstrologyContext (complete)

export class AstrologyContextBuilder {
  private readonly intelligenceEngine = new PlanetIntelligenceEngine();
  private readonly strengthEngine     = new PlanetStrengthEngine();
  private readonly yogaEngine         = new YogaEngine();
  private readonly activationEngine   = new ActivationEngine();
  private readonly inferenceEngine    = new InferenceEngine();

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

    // ── Build partial context (needed for InferenceEngine) ───────────────────
    const partialCtx: AstrologyContext = {
      chartSuite,
      planetRoles,
      planetStrengths,
      yogaAnalysis,
      inferences: [],     // populated below
      dasha:      options.dasha,
    };

    // ── Layer 5: Inference (pre-derived conclusions for domain engines) ───────
    const inferences = this.inferenceEngine.derive(partialCtx);

    return { ...partialCtx, inferences };
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
