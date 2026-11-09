/**
 * ChatPundit Gold Standard v1.0 — health chart evidence.
 * Spec: docs/CHATPUNDIT_GOLD_STANDARD_v1.md (§1 chart-first, §2 health factors,
 * §3 evidence hierarchy, §4 supporting vs contradicting, §7 qualitative strength).
 *
 * Renders the authoritative evidence block the LLM reasons from, built only
 * from computed chart facts and the CIE investigation — never invented.
 */

import type { ChartFacts } from "@/lib/core/astrology/chartFacts";
import type { PlanetName } from "@/lib/core/types";
import type { InvestigationReport } from "@/lib/consultation/brain/CIE_investigationEngine";
import type { TimingEvidence } from "@/lib/consultation/timing/timingEngine";
import { PLANETS, SPECIAL_ASPECTS, countFrom, ordinal } from "../timing/relations";

export type EvidenceStrength = "Strong" | "Moderate" | "Weak" | "Insufficient";

const HEALTH_HOUSES: Array<{ house: number; meaning: string }> = [
  { house: 1,  meaning: "body, vitality and constitution" },
  { house: 6,  meaning: "illness, immunity and day-to-day ailments" },
  { house: 8,  meaning: "chronic conditions, sudden events and longevity" },
  { house: 12, meaning: "hospitalisation, rest, sleep and recovery" },
];

export function aspectsOnHouse(facts: ChartFacts, house: number): PlanetName[] {
  return PLANETS.filter(p => {
    const pos = facts.natalPlanetPositions[p];
    if (!pos) return false;
    return [7, ...(SPECIAL_ASPECTS[p] ?? [])].some(n => countFrom(pos.house, n) === house);
  });
}

export function occupantsOf(facts: ChartFacts, house: number): PlanetName[] {
  return PLANETS.filter(p => facts.natalPlanetPositions[p]?.house === house);
}

export function describePlanet(facts: ChartFacts, p: PlanetName): string {
  const pos = facts.natalPlanetPositions[p];
  if (!pos) return `${p}: placement not available — do not assume one`;
  const cond = facts.planetaryConditions[p];
  const flags = [cond?.signDignity, cond?.retrograde ? "retrograde" : null, cond?.combust ? "combust" : null]
    .filter(Boolean).join(", ");
  const rules = (facts.planetLordships[p] ?? []).map(ordinal);
  return `${p} in your ${ordinal(pos.house)} house (${pos.signName})${flags ? ` — ${flags}` : ""}` +
    (rules.length ? `; rules your ${rules.join(" and ")}` : "");
}

/**
 * Qualitative strength of the evidence for the overall health reading (§7).
 * Based on how much evidence the CIE found and how much of it points the same
 * way — not a probability.
 */
export function healthEvidenceStrength(report?: InvestigationReport): EvidenceStrength {
  const items = (report?.evidence ?? []).filter(e => e.direction !== "neutral");
  if (items.length < 3) return "Insufficient";
  const weigh = (dir: string) => items.filter(e => e.direction === dir).reduce((s, e) => s + e.weight, 0);
  const sup = weigh("supporting"), ch = weigh("challenging");
  const agreement = Math.abs(sup - ch) / Math.max(1, sup + ch);
  if (items.length >= 6 && agreement >= 0.5) return "Strong";
  if (agreement >= 0.25) return "Moderate";
  return "Weak";
}

export function healthTiming(
  dasha?: { mahadasha: string; antardasha: string; periodEnd?: string },
  timing?: TimingEvidence | null,
): string | null {
  const d = timing?.dashaStart;
  if (d) {
    const until = d.pd.end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${d.md.planet}–${d.ad.planet}, ${d.pd.planet} sub-period until ~${until}`;
  }
  if (!dasha) return null;
  const until = dasha.periodEnd
    ? ` until ${new Date(dasha.periodEnd).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
    : "";
  return `${dasha.mahadasha}–${dasha.antardasha} period${until}`;
}

export function renderHealthEvidence(opts: {
  facts: ChartFacts;
  dasha?: { mahadasha: string; antardasha: string; periodStart?: string; periodEnd?: string };
  pratyantar?: string | null;
  report?: InvestigationReport;
  /** Rendered TIMING EVIDENCE block; replaces the single-day transit snapshot. */
  timing?: string;
}): string {
  const { facts, dasha, pratyantar, report, timing } = opts;
  const lines: string[] = [];
  lines.push(`━━━ HEALTH CHART EVIDENCE (authoritative — computed from this chart; use ONLY these facts) ━━━`);

  // Natal framework (§3 step 1): Ascendant, 6th, 8th, 12th and their lords.
  lines.push(`NATAL FRAMEWORK (${facts.ascendantSignName} Ascendant):`);
  for (const { house, meaning } of HEALTH_HOUSES) {
    const lord = facts.houseLords[house];
    const occupants = occupantsOf(facts, house);
    const aspects = aspectsOnHouse(facts, house);
    lines.push(
      `  ${ordinal(house)} house — ${meaning}: ${facts.houseSignNames[house]}. ` +
      `Lord: ${describePlanet(facts, lord)}. ` +
      `Occupants: ${occupants.length ? occupants.join(", ") : "none"}. ` +
      `Aspected by: ${aspects.length ? aspects.join(", ") : "none"}.`
    );
  }
  const moon = facts.natalPlanetPositions.Moon;
  if (moon) {
    const withMoon = occupantsOf(facts, moon.house).filter(p => p !== "Moon");
    const onMoon = aspectsOnHouse(facts, moon.house).filter(p => p !== "Moon");
    lines.push(
      `  Moon (mind, fluids, emotional resilience): ${describePlanet(facts, "Moon")}. ` +
      `Conjunct: ${withMoon.length ? withMoon.join(", ") : "none"}. Aspected by: ${onMoon.length ? onMoon.join(", ") : "none"}.`
    );
  } else {
    lines.push(`  Moon: placement not available — say the Moon cannot be assessed.`);
  }

  // Dasha activation (§3 step 2).
  if (dasha) {
    const end = dasha.periodEnd ? `, running until ${new Date(dasha.periodEnd).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}` : "";
    lines.push(`DASHA ACTIVATION: ${dasha.mahadasha} Mahadasha / ${dasha.antardasha} Antardasha` +
      `${pratyantar ? ` / ${pratyantar} Pratyantar` : ""}${end}.`);
    for (const p of [dasha.mahadasha, dasha.antardasha, pratyantar].filter((x): x is string => !!x)) {
      if (PLANETS.includes(p as PlanetName)) lines.push(`  ${describePlanet(facts, p as PlanetName)}.`);
    }
  } else {
    lines.push(`DASHA ACTIVATION: not available — say the dasha cannot be assessed; do not guess one.`);
  }

  // Transits (§3 step 3), counted from the Ascendant and from the Moon. With the
  // timing engine the dated windows below carry the transits, so the
  // single-day snapshot is left out (it would also cost tokens twice).
  const transits = PLANETS
    .map(p => facts.transitPlanetPositions[p])
    .filter((t): t is NonNullable<typeof t> => !!t);
  if (timing) {
    // covered by TIMING EVIDENCE
  } else if (transits.length) {
    lines.push(`CURRENT TRANSITS (timing and temporary influences):`);
    for (const t of transits) {
      const fromMoon = moon ? `, ${ordinal(((t.sign - moon.sign + 12) % 12) + 1)} from the Moon` : "";
      lines.push(`  ${t.planet} transiting ${t.signName}: your ${ordinal(t.house)} house${fromMoon}.`);
    }
  } else {
    lines.push(`CURRENT TRANSITS: not available — do not describe transits.`);
  }

  // Supporting vs contradicting (§4), from the CIE investigation.
  // CIE findings carry engine scores ("(73/100)", "(81% activation)"); §7 bans
  // percentages in the answer, so they are stripped before the model sees them.
  const plain = (s: string) => s.replace(/\s*\(\d+(?:\/100|%)[^)]*\)/g, "").trim();
  const ev = report?.evidence ?? [];
  const sup = ev.filter(e => e.direction === "supporting").slice(0, 5);
  const ch = ev.filter(e => e.direction === "challenging").slice(0, 5);
  lines.push(`PROTECTIVE / SUPPORTING FACTORS:`);
  lines.push(...(sup.length ? sup.map(e => `  ✓ ${plain(e.finding)}`) : [`  (none found)`]));
  lines.push(`CHALLENGING FACTORS:`);
  lines.push(...(ch.length ? ch.map(e => `  ✗ ${plain(e.finding)}`) : [`  (none found)`]));

  lines.push(`EVIDENCE STRENGTH: ${healthEvidenceStrength(report)}  ← state this in words; never as a percentage.`);
  if (timing) lines.push(timing);
  return lines.join("\n");
}
