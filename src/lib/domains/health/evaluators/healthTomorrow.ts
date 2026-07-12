import { ChartSuite, DashaInfo, PlanetPlacement, Sign } from "../../../core/types";
import { AstrologyContextBuilder } from "../../../core/context-builder";
import { TransitSnapshotBuilder } from "../../../core/transit-engine/transitSnapshotBuilder";
import { TransitAnalyzer }        from "../../../core/transit-engine/transitAnalyzer";
import { evaluateTransitRules }   from "../../../core/transit-engine/evaluateRules";
import { normalizeTransitEvidence } from "../../../core/transit-engine/evaluateRules";
import { HEALTH_TRANSIT_RULES }   from "../../../core/transit-engine/rules/health";
import { TransitEvidence }        from "../../../core/transit-engine/types";
import { HealthEngine }           from "../healthEngine";
import { HealthAssessment }       from "../healthTypes";

export interface HealthTomorrowResult {
  date:            string;
  assessment:      HealthAssessment;
  transitEvidence: TransitEvidence[];
  // Delta insight vs. today's transit activation (requires caller to compute today first, or we do both)
  activationDeltaVsToday: number | null;  // null when today not provided
  validUntil:      string;
  nextUpdateHint:  string;
  horizon:         "tomorrow";
}

// Evaluates health for "tomorrow" (date + 1 day).
// Optionally accepts todayTransitScore to compute a meaningful delta —
// a positive delta means tomorrow's transit picture is more supportive than today's.

export async function evaluateHealthTomorrow(
  chartSuite:       ChartSuite,
  natalPlanets:     PlanetPlacement[],
  natalLagna:       Sign,
  today:            Date = new Date(),
  dasha?:           DashaInfo,
  todayTransitScore?: number,
): Promise<HealthTomorrowResult> {
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // ── Transit computation for tomorrow ──────────────────────────────────────
  const snapshot = await new TransitSnapshotBuilder().build(tomorrow);
  const facts    = new TransitAnalyzer().analyze(snapshot, natalLagna, natalPlanets);
  const transit  = evaluateTransitRules(facts, HEALTH_TRANSIT_RULES);

  // ── Full pipeline ──────────────────────────────────────────────────────────
  const ctx        = new AstrologyContextBuilder().build(chartSuite, { dasha, transit, horizon: "daily" });
  const assessment = new HealthEngine().evaluate(ctx);

  // ── Delta ──────────────────────────────────────────────────────────────────
  const tomorrowScore = normalizeTransitEvidence(transit, "daily");
  const delta = todayTransitScore !== undefined
    ? Math.round(tomorrowScore - todayTransitScore)
    : null;

  // ── Valid-until ────────────────────────────────────────────────────────────
  const moonPosition  = snapshot.positions.find(p => p.planet === "Moon");
  const validUntil    = computeMoonTransitExpiry(tomorrow, moonPosition?.degreeInSign ?? 15);
  const nextUpdateHint = buildNextUpdateHint(moonPosition);

  return {
    date:                   snapshot.date,
    assessment,
    transitEvidence:        transit,
    activationDeltaVsToday: delta,
    validUntil,
    nextUpdateHint,
    horizon:                "tomorrow",
  };
}

function computeMoonTransitExpiry(from: Date, moonDegreeInSign: number): string {
  const remaining = Math.max(0.1, 30 - moonDegreeInSign);
  const days      = remaining / 13.2;
  const expiry    = new Date(from);
  expiry.setUTCDate(expiry.getUTCDate() + Math.round(days));
  return expiry.toISOString().slice(0, 10);
}

function buildNextUpdateHint(moonPos: { signName: string; degreeInSign: number } | undefined): string {
  if (!moonPos) return "Next update: when Moon changes signs (~2.5 days)";
  const remaining = Math.max(0.1, 30 - moonPos.degreeInSign);
  const days      = remaining / 13.2;
  if (days < 1) return `Next update: today, as Moon leaves ${moonPos.signName}`;
  if (days < 2) return `Next update: tomorrow, when Moon leaves ${moonPos.signName}`;
  return `Next update: ~${Math.round(days)} days, when Moon leaves ${moonPos.signName}`;
}
