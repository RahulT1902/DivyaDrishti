import { ChartSuite, DashaInfo, PlanetPlacement, Sign } from "../../../core/types";
import { AstrologyContextBuilder } from "../../../core/context-builder";
import { TransitSnapshotBuilder } from "../../../core/transit-engine/transitSnapshotBuilder";
import { TransitAnalyzer }        from "../../../core/transit-engine/transitAnalyzer";
import { evaluateTransitRules }   from "../../../core/transit-engine/evaluateRules";
import { HEALTH_TRANSIT_RULES }   from "../../../core/transit-engine/rules/health";
import { TransitEvidence }        from "../../../core/transit-engine/types";
import { normalizeTransitEvidence } from "../../../core/transit-engine/evaluateRules";
import { HealthEngine }           from "../healthEngine";
import { HealthAssessment }       from "../healthTypes";

// Result shape returned by evaluateHealthToday.
// The LLM narrator can include validUntil and nextUpdateHint in its response.

export interface HealthTodayResult {
  date:            string;              // "YYYY-MM-DD"
  assessment:      HealthAssessment;
  transitEvidence: TransitEvidence[];   // what transit rules fired
  validUntil:      string;              // ISO date of Moon's sign change (~2.5 days)
  nextUpdateHint:  string;              // human-readable: "Tomorrow, when Moon moves to Virgo"
  horizon:         "today";
}

// Evaluates health for a specific calendar date by:
//   1. Computing real transit positions via SwissEph
//   2. Deriving transit facts relative to the natal chart
//   3. Applying HEALTH_TRANSIT_RULES to produce TransitEvidence
//   4. Running the full 8-layer pipeline with transit wired in
//   5. Returning a fully typed HealthTodayResult

export async function evaluateHealthToday(
  chartSuite:   ChartSuite,
  natalPlanets: PlanetPlacement[],    // D1 placements for conjunction detection
  natalLagna:   Sign,
  date:         Date = new Date(),
  dasha?:       DashaInfo,
): Promise<HealthTodayResult> {
  // ── Transit computation ────────────────────────────────────────────────────
  const snapshot  = await new TransitSnapshotBuilder().build(date);
  const facts     = new TransitAnalyzer().analyze(snapshot, natalLagna, natalPlanets);
  const transit   = evaluateTransitRules(facts, HEALTH_TRANSIT_RULES);

  // ── Full pipeline ──────────────────────────────────────────────────────────
  const ctx        = new AstrologyContextBuilder().build(chartSuite, { dasha, transit, horizon: "daily" });
  const assessment = new HealthEngine().evaluate(ctx);

  // ── Valid-until metadata ───────────────────────────────────────────────────
  // Moon changes sign ~every 2.5 days — the primary driver of daily variation.
  const moonPosition  = snapshot.positions.find(p => p.planet === "Moon");
  const validUntil    = computeMoonTransitExpiry(date, moonPosition?.degreeInSign ?? 15);
  const nextUpdateHint = buildNextUpdateHint(moonPosition);

  return {
    date:            snapshot.date,
    assessment,
    transitEvidence: transit,
    validUntil,
    nextUpdateHint,
    horizon:         "today",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Estimate when Moon leaves its current sign.
// Average transit: 30° at ~13.2°/day = ~2.27 days.
// Remaining: (30 - degreeInSign) / 13.2 days.
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
