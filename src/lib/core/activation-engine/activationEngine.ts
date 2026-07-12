import {
  YogaBirthPromise, YogaActivation, YogaStatus,
  PlanetRole, PlanetStrength, DashaInfo,
  DashaProvenance, DashaWeights, DEFAULT_DASHA_WEIGHTS,
  AstrologicalEvidence, AstrologyEngine,
} from "../types";
import { TransitEvidence, TemporalHorizon } from "../transit-engine/types";
import { normalizeTransitEvidence } from "../transit-engine/evaluateRules";

export interface ActivationInput {
  birthPromises:   YogaBirthPromise[];
  planetRoles:     PlanetRole[];
  planetStrengths: PlanetStrength[];
  dasha?:          DashaInfo;
  transit?:        TransitEvidence[];
  transitHorizon?: TemporalHorizon;
  weights?:        DashaWeights; // override defaults for A/B tuning
}

// The Activation Engine is the sole owner of YogaStatus.
//
// 5-component activation model:
//   Natal Promise    (40%) — yoga birth strength from the natal chart
//   Mahadasha        (30%) — mahadasha lord is a supporting planet
//   Antardasha       (15%) — antardasha lord is a supporting planet
//   Transit          (10%) — transit support (stub until TransitEngine)
//   Planet Strength   (5%) — average strength of supporting planets
//
// When a component has no data (e.g., no dasha provided), its weight is
// redistributed proportionally across available components so scores remain
// comparable across charts with different data completeness.
//
// Status thresholds:
//   Peak     ≥ 80  AND dasha active
//   Active   ≥ 60
//   Emerging ≥ 40
//   Dormant  < 40

export class ActivationEngine implements AstrologyEngine<ActivationInput, YogaActivation[]> {
  evaluate(input: ActivationInput): YogaActivation[] {
    const weights = input.weights ?? DEFAULT_DASHA_WEIGHTS;
    return input.birthPromises.map(promise =>
      this.activatePromise(promise, input, weights),
    );
  }

  private activatePromise(
    promise: YogaBirthPromise,
    input:   ActivationInput,
    weights: DashaWeights,
  ): YogaActivation {
    // ── Raw component values (each 0–100) ─────────────────────────────────
    const natalRaw   = promise.birthStrength;
    const mahaRaw    = computeMahaContribution(promise, input.dasha);
    const antarRaw   = computeAntarContribution(promise, input.dasha);
    const transitRaw  = normalizeTransitEvidence(input.transit ?? [], input.transitHorizon ?? "daily");
    const strengthRaw = computeAvgStrength(promise.supportingPlanets, input.planetStrengths);

    // ── Effective weights (redistribute unavailable) ───────────────────────
    const hasDasha   = !!input.dasha;
    const hasTransit = !!(input.transit?.length);

    const applied = redistributeWeights(weights, hasDasha, hasTransit);

    // ── Activation score ──────────────────────────────────────────────────
    const activationScore = Math.min(100, Math.max(0, Math.round(
      natalRaw    * applied.natalPromise  +
      mahaRaw     * applied.mahadasha     +
      antarRaw    * applied.antardasha    +
      transitRaw  * applied.transit       +
      strengthRaw * applied.planetStrength,
    )));

    // ── Status ────────────────────────────────────────────────────────────
    const isDashaActive   = hasDasha && (mahaRaw > 0 || antarRaw > 0);
    const isTransitActive = hasTransit;
    const status          = deriveStatus(activationScore, isDashaActive);

    // ── Dasha provenance ──────────────────────────────────────────────────
    const dashaProvenance: DashaProvenance = {
      natalPromise:   natalRaw,
      mahadasha:      mahaRaw,
      antardasha:     antarRaw,
      transit:        transitRaw,
      planetStrength: strengthRaw,
      appliedWeights: applied,
    };

    // ── Legacy fields (kept for backward compatibility) ───────────────────
    const strengthContribution  = Math.round(natalRaw);
    const dashaContribution     = Math.round(
      mahaRaw * applied.mahadasha + antarRaw * applied.antardasha,
    );
    const transitContribution   = 0;

    const evidence = buildEvidence(
      promise, status, activationScore, dashaProvenance, isDashaActive, applied,
    );

    return {
      yogaId:               promise.id,
      status,
      activationScore,
      strengthContribution,
      dashaContribution,
      transitContribution,
      isDashaActive,
      isTransitActive,
      dashaProvenance,
      evidence,
    };
  }
}

// ── Status derivation ─────────────────────────────────────────────────────────

function deriveStatus(score: number, dashaActive: boolean): YogaStatus {
  if (dashaActive) {
    if (score >= 80) return "Peak";
    if (score >= 60) return "Active";
    if (score >= 40) return "Emerging";
    return "Dormant";
  }
  // No dasha confirmation — cap at Active
  if (score >= 60) return "Active";
  if (score >= 40) return "Emerging";
  return "Dormant";
}

// ── Component computations ────────────────────────────────────────────────────

function computeMahaContribution(promise: YogaBirthPromise, dasha?: DashaInfo): number {
  if (!dasha) return 0;
  return promise.supportingPlanets.includes(dasha.mahadasha) ? 100 : 0;
}

function computeAntarContribution(promise: YogaBirthPromise, dasha?: DashaInfo): number {
  if (!dasha) return 0;
  return promise.supportingPlanets.includes(dasha.antardasha) ? 100 : 0;
}

function computeAvgStrength(planets: string[], strengths: PlanetStrength[]): number {
  if (planets.length === 0) return 50;
  const found = planets.map(p =>
    strengths.find(s => s.planet === p)?.overallStrength ?? 50,
  );
  return Math.round(found.reduce((a, b) => a + b, 0) / found.length);
}

// ── Weight redistribution ─────────────────────────────────────────────────────
// When dasha/transit data is absent, redistribute those weights to available
// components so scores are comparable regardless of data completeness.

function redistributeWeights(
  base:       DashaWeights,
  hasDasha:   boolean,
  hasTransit: boolean,
): DashaWeights {
  let unavailable = 0;
  if (!hasDasha)   unavailable += base.mahadasha + base.antardasha;
  if (!hasTransit) unavailable += base.transit;

  if (unavailable === 0) return base;

  // Distribute the unused weight to natal and strength proportionally
  const availableNatal    = base.natalPromise / (base.natalPromise + base.planetStrength);
  const availableStrength = base.planetStrength / (base.natalPromise + base.planetStrength);

  return {
    natalPromise:   base.natalPromise   + unavailable * availableNatal,
    mahadasha:      hasDasha   ? base.mahadasha   : 0,
    antardasha:     hasDasha   ? base.antardasha  : 0,
    transit:        hasTransit ? base.transit      : 0,
    planetStrength: base.planetStrength + unavailable * availableStrength,
  };
}

// ── Evidence ──────────────────────────────────────────────────────────────────

function buildEvidence(
  promise:   YogaBirthPromise,
  status:    YogaStatus,
  score:     number,
  prov:      DashaProvenance,
  dashaActive: boolean,
  applied:   DashaWeights,
): AstrologicalEvidence[] {
  const ev: AstrologicalEvidence[] = [
    {
      id:          `${promise.id}-activation`,
      category:    "Yoga",
      description: `${promise.name} activation: ${status} (${score}/100)`,
      strength:    score,
      weight:      1.0,
      sourceChart: "D1",
    },
    {
      id:          `${promise.id}-natal`,
      category:    "Yoga",
      description: `Natal birth strength: ${prov.natalPromise}/100 (weight: ${(applied.natalPromise * 100).toFixed(0)}%)`,
      strength:    prov.natalPromise,
      weight:      applied.natalPromise,
      sourceChart: "D1",
    },
    {
      id:          `${promise.id}-planet-strength`,
      category:    "Strength",
      description: `Supporting planet avg strength: ${prov.planetStrength}/100 (weight: ${(applied.planetStrength * 100).toFixed(0)}%)`,
      strength:    prov.planetStrength,
      weight:      applied.planetStrength,
      sourceChart: "D1",
    },
  ];

  if (dashaActive) {
    ev.push({
      id:          `${promise.id}-mahadasha`,
      category:    "Dasha",
      description: `Mahadasha contribution: ${prov.mahadasha}/100 (weight: ${(applied.mahadasha * 100).toFixed(0)}%)`,
      strength:    prov.mahadasha,
      weight:      applied.mahadasha,
      sourceChart: "D1",
    });
    ev.push({
      id:          `${promise.id}-antardasha`,
      category:    "Dasha",
      description: `Antardasha contribution: ${prov.antardasha}/100 (weight: ${(applied.antardasha * 100).toFixed(0)}%)`,
      strength:    prov.antardasha,
      weight:      applied.antardasha,
      sourceChart: "D1",
    });
  } else {
    ev.push({
      id:          `${promise.id}-no-dasha`,
      category:    "Dasha",
      description: `No dasha data — maha/antar weights redistributed to natal (${(applied.natalPromise * 100).toFixed(0)}%) and strength (${(applied.planetStrength * 100).toFixed(0)}%)`,
      strength:    0,
      weight:      0,
      sourceChart: "D1",
    });
  }

  return ev;
}
