import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";

// Arishta Yogas — health challenge indicators.
//
// Only yogas NOT already present in chandra.ts or misc.ts are defined here.
// Notably:
//   - Kemadrum/Kemadruma is ALREADY defined in chandra.ts (id: "kemadrum") — omitted.
//
// Yogas included:
//   1. Chandal Yoga     — Jupiter + Rahu in same house (Guru-Chandala)
//   2. Shakata Yoga     — Moon in 6th, 8th, or 12th from Jupiter

// ── Helpers ───────────────────────────────────────────────────────────────────

function none(): ConditionResult {
  return { matches: false, supportingPlanets: [], descriptions: [] };
}

// ── Chandal Yoga (Guru-Chandala) ─────────────────────────────────────────────
// Jupiter and Rahu in the same house.
// Jupiter's wisdom is disrupted by Rahu's materialistic, taboo-crossing energy.
// The native may hold unorthodox beliefs, experience disrupted dharmic judgment,
// and be prone to unconventional or impulsive decisions in health and life choices.

function evalChandal(ctx: EvaluationContext): ConditionResult {
  const jupiter = ctx.chart.planets.find(p => p.planet === "Jupiter");
  const rahu    = ctx.chart.planets.find(p => p.planet === "Rahu");
  if (!jupiter || !rahu) return none();
  if (jupiter.house !== rahu.house) return none();
  return {
    matches:           true,
    supportingPlanets: ["Jupiter", "Rahu"] as PlanetName[],
    descriptions: [
      `Jupiter and Rahu conjunct in house ${jupiter.house} — Guru-Chandala conjunction active`,
    ],
  };
}

export const CHANDAL_YOGA: YogaDefinition = {
  id:           "chandal",
  name:         "Chandal Yoga",
  sanskritName: "Guru-Chandala",
  category:     "Misc",
  domains:      ["Wisdom disrupted", "Unconventional beliefs"],
  severity:     42,
  priority:     70,
  conditions:   { type: "AND", rules: [] },
  evaluateFn:   evalChandal,
  modifiers: [
    {
      condition:     { type: "PlanetIsExalted", planet: "Jupiter" },
      strengthDelta: -15,
      description:   "Jupiter exalted — Chandal Yoga partially mitigated by Jupiter's inherent strength",
    },
    {
      condition:     { type: "PlanetStrength", planet: "Jupiter", op: ">=", value: 70 },
      strengthDelta: -10,
      description:   "Strong Jupiter can partially overcome Rahu's disruption",
    },
  ],
  description:
    "Jupiter and Rahu conjunct (Guru-Chandala) — wisdom and dharmic judgment are disrupted by materialistic or taboo-driven impulses; unconventional beliefs may lead to poor life and health decisions.",
  classicalReference: "Phaladeepika, Guru-Chandala Yoga",
};

// ── Shakata Yoga ──────────────────────────────────────────────────────────────
// Moon in the 6th, 8th, or 12th house from Jupiter.
// Jupiter's protective and benefic influence does not extend to the Moon's house,
// leaving the emotional and mental sphere unsupported.  This creates fluctuating
// health, reduced emotional stability, and vulnerability to mental-health challenges.
//
// Detection: relativePos = ((Moon.house - Jupiter.house + 12) % 12) + 1
//   relativePos 6  → Moon is in 6th from Jupiter  (6-1 = 5 houses ahead)
//   relativePos 8  → Moon is in 8th from Jupiter
//   relativePos 12 → Moon is in 12th from Jupiter

function evalShakata(ctx: EvaluationContext): ConditionResult {
  const jupiter = ctx.chart.planets.find(p => p.planet === "Jupiter");
  const moon    = ctx.chart.planets.find(p => p.planet === "Moon");
  if (!jupiter || !moon) return none();

  // Relative position of Moon counted from Jupiter (1-indexed)
  const relativePos = ((moon.house - jupiter.house + 12) % 12) + 1;

  if (![6, 8, 12].includes(relativePos)) return none();

  return {
    matches:           true,
    supportingPlanets: ["Moon", "Jupiter"] as PlanetName[],
    descriptions: [
      `Moon in house ${moon.house} is in the ${relativePos}th position from Jupiter (house ${jupiter.house}) — Shakata Yoga formed`,
    ],
  };
}

export const SHAKATA_YOGA: YogaDefinition = {
  id:           "shakata",
  name:         "Shakata Yoga",
  sanskritName: "Shakata",
  category:     "Misc",
  domains:      ["Emotional fluctuation", "Health challenges"],
  severity:     45,
  priority:     71,
  conditions:   { type: "AND", rules: [] },
  evaluateFn:   evalShakata,
  modifiers: [
    {
      condition:     { type: "PlanetStrength", planet: "Moon", op: ">=", value: 65 },
      strengthDelta: -20,
      description:   "Strong Moon partially overcomes Shakata's emotional destabilization",
    },
    {
      condition:     { type: "PlanetIsExalted", planet: "Moon" },
      strengthDelta: -25,
      description:   "Moon exalted — Shakata Yoga considerably weakened",
    },
    {
      condition:     { type: "PlanetInKendraFromPlanet", planet: "Moon", reference: "Jupiter" },
      strengthDelta: -30,
      description:   "Moon in Kendra from Jupiter (contradicts Shakata) — yoga cancelled",
    },
  ],
  description:
    "Moon in 6th, 8th, or 12th from Jupiter — Jupiter's protective influence does not reach the Moon's house; emotional fluctuation, health vulnerability, and intermittent mental-health challenges are indicated.",
  classicalReference: "Brihat Parashara Hora Shastra, Shakata Yoga",
};

export const ARISHTA_YOGAS: YogaDefinition[] = [CHANDAL_YOGA, SHAKATA_YOGA];
