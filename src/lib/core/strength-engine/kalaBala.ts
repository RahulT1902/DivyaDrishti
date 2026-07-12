import { PlanetName, DivisionalChart, AstrologicalEvidence } from "../types";

// ── Kala Bala (Temporal Strength) — Approximation ────────────────────────────
//
// IMPORTANT: This is a meaningful approximation of Kala Bala.
// Full classical Kala Bala requires birth datetime for:
//   • Paksha Bala    — exact lunar phase (tithi) at birth
//   • Vara Bala      — weekday ruler at birth
//   • Hora Bala      — planetary hora (hour) at birth
//   • Ayana Bala     — solar uttarayana / dakshinayana position
//   • Masa Bala      — lunar month (Chaitra, Vaishakha, …)
//   • Thribhaga Bala — division of day (dawn/noon/dusk)
//
// Since DivisionalChart does not carry birth datetime, we approximate using
// Moon's house position as a Paksha proxy:
//
//   Moon in houses 1–6  → treat as Shukla Paksha (waxing)
//     → benefics (Jupiter, Venus, Mercury, Moon) +15
//   Moon in houses 7–12 → treat as Krishna Paksha (waning)
//     → malefics (Saturn, Mars) +10; benefics −5
//
// Naisargika (inherent) temporal vigor:
//   Sun and Mars receive an additional +5 for innate temporal strength.
//
// Rahu and Ketu: shadow nodes have no meaningful temporal strength in this
//   approximation; they return the neutral score of 50.
//
// Base score : 50
// Final score is clamped to 0–100.
// ─────────────────────────────────────────────────────────────────────────────

const SHADOW_PLANETS: ReadonlySet<PlanetName>   = new Set(["Rahu", "Ketu"]);
const NATURAL_BENEFICS: ReadonlySet<PlanetName> = new Set(["Jupiter", "Venus", "Mercury", "Moon"]);
const NATURAL_MALEFICS: ReadonlySet<PlanetName> = new Set(["Saturn", "Mars", "Sun"]);
// Planets with inherent naisargika temporal vigour
const TEMPORAL_VIGOROUS: ReadonlySet<PlanetName> = new Set(["Sun", "Mars"]);

export interface KalaBalaResult {
  score: number;
  evidence: AstrologicalEvidence;
}

/**
 * Compute Kala Bala (temporal strength) using Moon's house position as a
 * Paksha (lunar phase) approximation.
 *
 * NOTE: This is an approximation only.  Full Kala Bala requires birth
 * datetime (tithi, vara, hora, ayana) which is not present in DivisionalChart.
 *
 * @param planet   - the planet being evaluated
 * @param d1Chart  - the natal D1 chart
 */
export function computeKalaBala(
  planet: PlanetName,
  d1Chart: DivisionalChart,
): KalaBalaResult {
  // Shadow planets: no meaningful temporal approximation → neutral
  if (SHADOW_PLANETS.has(planet)) {
    return make(
      planet,
      50,
      "Rahu/Ketu — Kala Bala approximation not applicable; returning neutral 50/100 " +
      "(full Kala Bala requires birth datetime)",
    );
  }

  let score = 50;

  // Determine Paksha from Moon's house position
  const moonPlacement = d1Chart.planets.find(p => p.planet === "Moon");
  // If Moon placement is missing, default to house 7 (neutral waning start)
  const moonHouse = moonPlacement?.house ?? 7;

  // Houses 1–6 approximate Shukla Paksha (waxing Moon is in first half of its cycle)
  const isWaxing = moonHouse >= 1 && moonHouse <= 6;

  if (isWaxing) {
    // Shukla Paksha — benefics thrive; malefics at neutral
    if (NATURAL_BENEFICS.has(planet)) {
      score += 15; // benefics gain temporal strength during waxing phase
    }
    // malefics and Sun receive no bonus in Shukla Paksha
  } else {
    // Krishna Paksha — malefics gain some strength; benefics slightly diminished
    if (NATURAL_MALEFICS.has(planet)) {
      score += 10; // Saturn and Mars gain temporal authority during waning phase
    } else if (NATURAL_BENEFICS.has(planet)) {
      score -= 5;  // benefics slightly weakened in Krishna Paksha
    }
  }

  // Naisargika temporal vigor — Sun and Mars have inherent temporal strength
  if (TEMPORAL_VIGOROUS.has(planet)) {
    score += 5;
  }

  // Clamp to valid range
  score = Math.max(0, Math.min(100, score));

  const paksha = isWaxing
    ? `Shukla Paksha approx. (Moon in house ${moonHouse})`
    : `Krishna Paksha approx. (Moon in house ${moonHouse})`;

  return make(
    planet,
    score,
    `${planet}: Kala Bala ${score}/100 via ${paksha} — approximation only; full Kala Bala requires birth datetime`,
  );
}

function make(
  planet: PlanetName,
  score: number,
  description: string,
): KalaBalaResult {
  return {
    score,
    evidence: {
      id:          `${planet}-kala`,
      category:    "Strength",
      description,
      strength:    score,
      weight:      0.04,
      sourceChart: "D1",
      planet,
    },
  };
}
