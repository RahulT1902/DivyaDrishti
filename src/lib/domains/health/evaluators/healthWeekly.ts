import { ChartSuite, DashaInfo, PlanetPlacement, Sign } from "../../../core/types";
import { AstrologyContextBuilder } from "../../../core/context-builder";
import { TransitSnapshotBuilder }   from "../../../core/transit-engine/transitSnapshotBuilder";
import { TransitAnalyzer }          from "../../../core/transit-engine/transitAnalyzer";
import { evaluateTransitRules, normalizeTransitEvidence } from "../../../core/transit-engine/evaluateRules";
import { HEALTH_TRANSIT_RULES }     from "../../../core/transit-engine/rules/health";
import { TransitEvidence }          from "../../../core/transit-engine/types";
import { HealthEngine }             from "../healthEngine";
import { HealthAssessment }         from "../healthTypes";

export interface DailyHealthSnapshot {
  date:            string;
  dayLabel:        string;           // "Monday", "Tuesday", etc.
  activationScore: number;           // weekly-horizon transit score (0–100, 50=neutral)
  confidence:      number;           // HealthAssessment.confidence
  currentState:    string;
  transitEvidence: TransitEvidence[];
}

// A meaningful shift in the weekly energy pattern.
// Magnitude:
//   Moderate   — |delta| >= 10  (worth noting)
//   Significant — |delta| >= 20  (the narrator should call it out explicitly)

export interface WeeklyChangePoint {
  fromDay:    string;    // "Wednesday"
  toDay:      string;    // "Thursday"
  fromScore:  number;
  toScore:    number;
  delta:      number;    // toScore − fromScore (negative = declining energy)
  direction:  "Improving" | "Declining";
  magnitude:  "Moderate" | "Significant";
}

export interface HealthWeeklyResult {
  startDate:    string;
  endDate:      string;
  days:         DailyHealthSnapshot[];

  // Aggregates
  bestDays:     string[];          // day labels at peak score
  cautiousDays: string[];          // day labels with score < 45
  weeklyTrend:  "Improving" | "Declining" | "Stable" | "Variable";
  peakScore:    number;
  lowestScore:  number;
  avgScore:     number;

  // Energy transitions — the narrator turns these into natural-language warnings.
  // Example: "The week's energy shifts noticeably around Thursday."
  changePoints: WeeklyChangePoint[];

  // Full HealthAssessment for the peak-activation day
  bestDayAssessment: HealthAssessment;

  horizon: "weekly";
}

// Runs 7 sequential daily evaluations (today through today+6) and aggregates
// into a weekly health picture.
//
// The natal base (yoga, strength, dasha) does not change day-to-day —
// only the transit component changes.  Within a week the slow planets (Jupiter,
// Saturn) barely move, so the weekly horizon weights Moon/Sun/Mars highest and
// lets Saturn/Rahu fade to near-zero.  This is correct: in one week Saturn moves
// < 0.1° — it cannot meaningfully distinguish Monday from Sunday.

export async function evaluateHealthWeekly(
  chartSuite:   ChartSuite,
  natalPlanets: PlanetPlacement[],
  natalLagna:   Sign,
  startDate:    Date = new Date(),
  dasha?:       DashaInfo,
): Promise<HealthWeeklyResult> {
  const snapshotBuilder = new TransitSnapshotBuilder();
  const analyzer        = new TransitAnalyzer();
  const engine          = new HealthEngine();
  const builder         = new AstrologyContextBuilder();

  const days: DailyHealthSnapshot[] = [];
  let bestDayAssessment: HealthAssessment | null = null;
  let bestScore = -1;

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + i);

    const snapshot = await snapshotBuilder.build(date);
    const facts    = analyzer.analyze(snapshot, natalLagna, natalPlanets);
    const transit  = evaluateTransitRules(facts, HEALTH_TRANSIT_RULES);

    const ctx        = builder.build(chartSuite, { dasha, transit, horizon: "weekly" });
    const assessment = engine.evaluate(ctx);

    // Use "weekly" weights for the displayed score so Moon's ~2.5-day cycle
    // doesn't completely dominate a 7-day picture.
    const activationScore = normalizeTransitEvidence(transit, "weekly");
    const dayLabel        = DAY_NAMES[date.getUTCDay()];

    days.push({
      date:            snapshot.date,
      dayLabel,
      activationScore,
      confidence:      assessment.confidence,
      currentState:    assessment.currentState,
      transitEvidence: transit,
    });

    if (activationScore > bestScore) {
      bestScore         = activationScore;
      bestDayAssessment = assessment;
    }
  }

  // ── Aggregates ────────────────────────────────────────────────────────────
  const scores      = days.map(d => d.activationScore);
  const peakScore   = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const avgScore    = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const bestDays    = days.filter(d => d.activationScore === peakScore).map(d => d.dayLabel);
  const cautiousDays = days.filter(d => d.activationScore < 45).map(d => d.dayLabel);

  const weeklyTrend = computeTrend(scores);
  const changePoints = detectChangePoints(days);

  return {
    startDate:         days[0].date,
    endDate:           days[6].date,
    days,
    bestDays,
    cautiousDays,
    weeklyTrend,
    peakScore,
    lowestScore,
    avgScore,
    changePoints,
    bestDayAssessment: bestDayAssessment!,
    horizon:           "weekly",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeTrend(scores: number[]): HealthWeeklyResult["weeklyTrend"] {
  if (scores.length < 2) return "Stable";

  const first = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last  = scores.slice(4).reduce((a, b) => a + b, 0) / 3;
  const range = Math.max(...scores) - Math.min(...scores);

  if (range > 25) return "Variable";
  if (last - first >  8) return "Improving";
  if (first - last >  8) return "Declining";
  return "Stable";
}

// Finds consecutive-day transitions where the activation score shifts
// meaningfully — either up or down.  Both directions are reported so the
// narrator can say both "energy picks up from Thursday" and "the dip on
// Tuesday is worth noting."

const CHANGE_POINT_MODERATE    = 10;  // |delta| >= 10 → Moderate
const CHANGE_POINT_SIGNIFICANT = 20;  // |delta| >= 20 → Significant

function detectChangePoints(days: DailyHealthSnapshot[]): WeeklyChangePoint[] {
  const result: WeeklyChangePoint[] = [];

  for (let i = 0; i < days.length - 1; i++) {
    const from  = days[i];
    const to    = days[i + 1];
    const delta = to.activationScore - from.activationScore;
    const abs   = Math.abs(delta);

    if (abs < CHANGE_POINT_MODERATE) continue;

    result.push({
      fromDay:   from.dayLabel,
      toDay:     to.dayLabel,
      fromScore: from.activationScore,
      toScore:   to.activationScore,
      delta,
      direction: delta > 0 ? "Improving" : "Declining",
      magnitude: abs >= CHANGE_POINT_SIGNIFICANT ? "Significant" : "Moderate",
    });
  }

  return result;
}
