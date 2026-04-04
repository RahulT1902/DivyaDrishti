import { NatalChart, Planet, Intent, Timeframe } from "./types";
import { normalizeSignals } from "./interpretationNormalizer";
import { extractAstroSignals } from "./astroSignals";

/**
 * Prediction Context Builder
 * Packages chart, transit, and dasha data in a consistent format
 * Prevents AI hallucinations by providing a structured truth.
 */

export interface PredictionContext {
  chartType: "D1" | "D9";
  period: Timeframe;
  category: Intent;
  summary: string;
  signals: any[];
}

export function buildPredictionContext(
  natalChart: NatalChart,
  currentTransits: any,
  dasha: any,
  intent: Intent,
  timeframe: Timeframe,
  chartType: "D1" | "D9" = "D1"
): PredictionContext {
  
  // 1. Extract and Normalize Signals
  const rawSignals = extractAstroSignals(natalChart, currentTransits, dasha, intent);
  const normalized = normalizeSignals(rawSignals);

  // 2. Format Core Assets (Natal placements)
  const natalPlacements = natalChart.planets.map(p => {
    const badges = [
      p.isRetrograde ? "Retrograde" : "",
      p.isCombust ? "Combust" : "",
      p.isVargottama ? "Vargottama" : ""
    ].filter(Boolean).join(", ");
    
    return `${p.name} at ${p.degree}° in ${getSignName(p.sign)} ${badges ? `(${badges})` : ""}`;
  }).join("; ");

  // 3. Format Dasha
  const dashaContext = `MD: ${dasha.md.planet}, AD: ${dasha.ad.planet}`;

  // 4. Build Structured Summary
  const summary = `
    Focus: ${intent} over ${timeframe}.
    Chart: ${chartType} (Birth Alignment).
    Birth Placements: ${natalPlacements}.
    Active Timing (Dasha): ${dashaContext}.
    Dominant Signal: ${normalized[0]?.reason || "Observation Mode"}.
    Risk Level: ${normalized.some(s => s.impact === "negative" && s.weight > 0.6) ? "High" : "Moderate"}.
  `.trim();

  return {
    chartType,
    period: timeframe,
    category: intent,
    summary,
    signals: normalized
  };
}

function getSignName(sign: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}
