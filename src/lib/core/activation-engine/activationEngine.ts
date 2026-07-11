import {
  YogaBirthPromise, YogaActivation, YogaStatus,
  PlanetRole, PlanetStrength, DashaInfo, AstrologicalEvidence,
  AstrologyEngine,
} from "../types";

export interface ActivationInput {
  birthPromises:  YogaBirthPromise[];
  planetRoles:    PlanetRole[];
  planetStrengths: PlanetStrength[];
  // Populated by DashaEngine in Phase 5:
  dasha?:         DashaInfo;
  // Populated by TransitEngine in Phase 5:
  transit?:       unknown;
}

// The Activation Engine is the sole owner of YogaStatus.
//
// Without dasha/transit data (current phase):
//   activationScore = birthStrength (natal quality drives activation)
//   status cap = Active (Peak requires dasha confirmation)
//
// With dasha/transit (Phase 5):
//   activationScore = 60% natal + 30% dasha + 10% transit
//   status cap lifts to Peak when dasha supporting planet is running

export class ActivationEngine implements AstrologyEngine<ActivationInput, YogaActivation[]> {
  evaluate(input: ActivationInput): YogaActivation[] {
    return input.birthPromises.map(promise =>
      this.activatePromise(promise, input),
    );
  }

  private activatePromise(
    promise: YogaBirthPromise,
    input: ActivationInput,
  ): YogaActivation {
    const strengthContribution  = promise.birthStrength;
    const dashaContribution     = computeDashaContribution(promise, input.dasha);
    const transitContribution   = 0;   // stub until TransitEngine
    const isDashaActive         = dashaContribution > 0;
    const isTransitActive       = false;

    // Activation score weighting:
    // Without dasha: natal quality alone determines how active the yoga is
    // With dasha:    natal is anchor, dasha provides the timing boost
    let activationScore: number;
    if (!input.dasha) {
      activationScore = strengthContribution;
    } else {
      activationScore = Math.round(
        strengthContribution * 0.60 +
        dashaContribution    * 0.30 +
        transitContribution  * 0.10,
      );
    }
    activationScore = Math.min(100, Math.max(0, activationScore));

    const status = deriveStatus(activationScore, isDashaActive);

    const evidence = buildEvidence(
      promise, status, activationScore, strengthContribution,
      dashaContribution, isDashaActive,
    );

    return {
      yogaId:               promise.id,
      status,
      activationScore,
      strengthContribution: Math.round(strengthContribution),
      dashaContribution:    Math.round(dashaContribution),
      transitContribution:  Math.round(transitContribution),
      isDashaActive,
      isTransitActive,
      evidence,
    };
  }
}

// ── Status derivation ─────────────────────────────────────────────────────────
// Peak is reserved for confirmed dasha activation (Phase 5).
// Without dasha, even a 100/100 yoga caps at Active.

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

// ── Dasha contribution ────────────────────────────────────────────────────────
// If the Mahadasha or Antardasha lord is one of the yoga's supporting planets,
// the yoga receives a timing boost.

function computeDashaContribution(
  promise: YogaBirthPromise,
  dasha?: DashaInfo,
): number {
  if (!dasha) return 0;
  const { mahadasha, antardasha } = dasha;
  const isMainDasha = promise.supportingPlanets.includes(mahadasha);
  const isSubDasha  = promise.supportingPlanets.includes(antardasha);
  if (isMainDasha && isSubDasha) return 100;
  if (isMainDasha) return 70;
  if (isSubDasha)  return 40;
  return 0;
}

// ── Evidence ──────────────────────────────────────────────────────────────────

function buildEvidence(
  promise: YogaBirthPromise,
  status: YogaStatus,
  score: number,
  strength: number,
  dasha: number,
  isDashaActive: boolean,
): AstrologicalEvidence[] {
  const ev: AstrologicalEvidence[] = [
    {
      id:          `${promise.id}-activation`,
      category:    "Yoga",
      description: `${promise.name} activation: ${status} (score ${score}/100)`,
      strength:    score,
      weight:      1.0,
      sourceChart: "D1",
    },
    {
      id:          `${promise.id}-natal-contribution`,
      category:    "Yoga",
      description: `Natal birth strength contributes ${strength}/100`,
      strength:    strength,
      weight:      0.6,
      sourceChart: "D1",
    },
  ];

  if (isDashaActive) {
    ev.push({
      id:          `${promise.id}-dasha-contribution`,
      category:    "Dasha",
      description: `Active dasha of supporting planet adds ${dasha} activation points`,
      strength:    dasha,
      weight:      0.3,
      sourceChart: "D1",
    });
  } else {
    ev.push({
      id:          `${promise.id}-no-dasha`,
      category:    "Dasha",
      description: `No supporting dasha active — status capped at Active until DashaEngine integrates`,
      strength:    0,
      weight:      0.3,
      sourceChart: "D1",
    });
  }

  return ev;
}
