import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { adaptEngineOutput, buildChartSuite } from "@/lib/core/chart-engine";
import { AstrologyContextBuilder } from "@/lib/core/context-builder/astroContextBuilder";
import { TransitAnalyzer, evaluateTransitRules, HEALTH_TRANSIT_RULES } from "@/lib/core/transit-engine";
import type { DashaInfo, Sign, PlanetName } from "@/lib/core/types";
import type { TransitSnapshot } from "@/lib/core/transit-engine/types";

export interface BirthInput {
  dateOfBirth: Date;
  timeOfBirth: string;   // "HH:mm"
  latitude:    number;
  longitude:   number;
  timezone:    string;
}

const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
];

/**
 * Birth details → natal chart, dasha, transits and the 8-layer symbolic
 * context. Shared by the chat route and the Gold Standard real-chart review
 * (scripts/pundit-review.ts) so both compute charts the same way.
 *
 * `transitDate` sets the sky (e.g. tomorrow); the dasha is taken at `dashaDate`
 * (the route uses now).
 */
export async function prepareChartContext(
  birth: BirthInput,
  opts: { transitDate?: Date; dashaDate?: Date } = {},
) {
  const { transitDate, dashaDate = new Date() } = opts;

  const chart = await calculateLagnaChart({
    date: birth.dateOfBirth.toISOString().split("T")[0],
    time: birth.timeOfBirth,
    latitude: birth.latitude,
    longitude: birth.longitude,
    timezone: birth.timezone,
  });

  const moon = chart.planets.find(p => p.name === "Moon");
  if (!moon) throw new Error("Moon data required");

  const nakshatra = getNakshatra(moon.longitude);
  const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
  const timeline = buildMahadashaTimeline(chart.birthUtc, nakshatra.lord, balance);
  const temporal = getDashaContext(timeline, dashaDate);
  const currentTransits = await calculateCurrentTransits(transitDate);

  // ── Symbolic Engine Build ─────────────────────────────────────────────────
  // Build ChartSuite (the 8-layer pipeline's input) from the SwissEph raw output.
  const { planets: sePlanets, lagna: seLagna } = adaptEngineOutput(chart.planets, chart.lagna);
  const chartSuite = buildChartSuite(sePlanets, seLagna);

  // Convert current transit positions → TransitSnapshot for the symbolic transit engine.
  const transitSnapshot: TransitSnapshot = {
    date:   (transitDate ?? new Date()).toISOString().split("T")[0],
    julDay: 0,
    positions: currentTransits.positions.map(p => ({
      planet:       p.name as PlanetName,
      longitude:    p.longitude,
      sign:         p.sign as Sign,
      signName:     SIGN_NAMES[p.sign - 1] ?? "Aries",
      degreeInSign: p.longitude % 30,
      speed:        p.speed,
      isRetrograde: p.speed < 0 && p.name !== "Sun" && p.name !== "Moon",
      isCombust:    false,
    })),
  };

  // Derive transit facts (which natal house each transiting planet occupies).
  const transitFacts = new TransitAnalyzer().analyze(
    transitSnapshot,
    chart.lagna.sign as Sign,
    chartSuite.D1.planets,
  );
  // Evaluate health transit rules (used for all domains — other domain rules will be added later).
  const symbolicTransitEvidence = evaluateTransitRules(transitFacts, HEALTH_TRANSIT_RULES);

  // Build DashaInfo from the dasha context (mahadasha + antardasha period dates).
  const dashaInfo: DashaInfo | undefined = temporal ? {
    mahadasha:   temporal.stack.mahadasha as PlanetName,
    antardasha:  temporal.stack.antardasha as PlanetName,
    periodStart: temporal.timing.startsAt.toISOString().split("T")[0],
    periodEnd:   temporal.timing.endsAt.toISOString().split("T")[0],
  } : undefined;

  // Today's Moon nakshatra index (0–26) — primary daily health differentiator.
  // Moon transits one nakshatra every ~24–27 hours; this makes the reading day-specific
  // even on days when no major house-based transit rules fire.
  const moonForNakshatra = currentTransits.positions.find(p => p.name === "Moon");
  const moonNakshatraIndex = moonForNakshatra
    ? Math.min(26, Math.floor((moonForNakshatra.longitude % 360) / (360 / 27)))
    : undefined;

  // Run the full 8-layer symbolic pipeline: yoga detection → activation → inference → hypothesis → graph.
  const symbolicCtx = new AstrologyContextBuilder().build(chartSuite, {
    dasha:              dashaInfo,
    transit:            symbolicTransitEvidence,
    horizon:            "daily",
    moonNakshatraIndex,
  });

  return { chart, timeline, temporal, currentTransits, dashaInfo, symbolicCtx };
}
