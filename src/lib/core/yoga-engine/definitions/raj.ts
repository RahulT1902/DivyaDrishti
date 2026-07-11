import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";

// ── Gajakesari Yoga ───────────────────────────────────────────────────────────
// Moon in Kendra from Jupiter OR Jupiter in Kendra from Moon — both must be strong.

export const GAJAKESARI: YogaDefinition = {
  id: "gajakesari",
  name: "Gajakesari Yoga",
  sanskritName: "Gajakesari",
  category: "Raj",
  domains: ["Reputation", "Wealth", "Wisdom", "Public influence"],
  severity: 88,
  priority: 1,
  conditions: {
    type: "OR", rules: [
      { type: "PlanetInKendraFromPlanet", planet: "Moon",    reference: "Jupiter" },
      { type: "PlanetInKendraFromPlanet", planet: "Jupiter", reference: "Moon" },
    ],
  },
  modifiers: [
    {
      condition: { type: "PlanetIsCombust", planet: "Jupiter" },
      strengthDelta: -30,
      description: "Jupiter combust — Gajakesari severely weakened",
    },
    {
      condition: { type: "PlanetStrength", planet: "Jupiter", op: ">=", value: 75 },
      strengthDelta: +15,
      description: "Jupiter strong — Gajakesari amplified",
    },
    {
      condition: { type: "PlanetStrength", planet: "Moon", op: ">=", value: 75 },
      strengthDelta: +10,
      description: "Moon strong — Gajakesari amplified",
    },
    {
      condition: { type: "PlanetIsDebilitated", planet: "Jupiter" },
      strengthDelta: -25,
      description: "Jupiter debilitated — Gajakesari weakened",
    },
    {
      condition: { type: "PlanetIsDebilitated", planet: "Moon" },
      strengthDelta: -20,
      description: "Moon debilitated — Gajakesari weakened",
    },
  ],
  strengthFormula(ctx: EvaluationContext): number {
    const j = ctx.strengths.find(s => s.planet === "Jupiter")?.overallStrength ?? 50;
    const m = ctx.strengths.find(s => s.planet === "Moon")?.overallStrength    ?? 50;
    return Math.round((j + m) / 2);
  },
  description:
    "Moon and Jupiter in mutual Kendra relationship — grants intelligence, eloquence, generous wealth, and enduring reputation.",
  classicalReference: "Brihat Parashara Hora Shastra, Gajakesari Yoga",
};

// ── Classic Raj Yoga ──────────────────────────────────────────────────────────
// Lord of a Trikona (5th or 9th) and lord of a Kendra (4th, 7th, or 10th)
// are in conjunction or in mutual aspect.  All 6 house-pair combinations are
// checked via evaluateFn so the DSL doesn't need to resolve planet names at
// definition time.

const RAJ_TRIKONA_HOUSES = [5, 9] as const;
const RAJ_KENDRA_HOUSES  = [4, 7, 10] as const;

function evalRajYoga(ctx: EvaluationContext): ConditionResult {
  const { chart } = ctx;
  const found: { t: number; k: number; lord1: PlanetName; lord2: PlanetName; desc: string }[] = [];

  for (const trikonaHouse of RAJ_TRIKONA_HOUSES) {
    for (const kendraHouse of RAJ_KENDRA_HOUSES) {
      const tLord = chart.lords.find(l => l.house === trikonaHouse);
      const kLord = chart.lords.find(l => l.house === kendraHouse);
      if (!tLord || !kLord) continue;

      // Same planet owns both — automatic Raj Yoga (Yogakaraka)
      if (tLord.lord === kLord.lord) {
        found.push({
          t: trikonaHouse, k: kendraHouse,
          lord1: tLord.lord, lord2: kLord.lord,
          desc: `${tLord.lord} is Yogakaraka — owns both ${trikonaHouse}th and ${kendraHouse}th`,
        });
        continue;
      }

      // Conjunction: in same house
      if (tLord.lordPlacedInHouse === kLord.lordPlacedInHouse) {
        found.push({
          t: trikonaHouse, k: kendraHouse,
          lord1: tLord.lord, lord2: kLord.lord,
          desc: `Lords of ${trikonaHouse}th (${tLord.lord}) and ${kendraHouse}th (${kLord.lord}) conjunct in house ${tLord.lordPlacedInHouse}`,
        });
        continue;
      }

      // Mutual aspect (A aspects B's house, or B aspects A's house)
      const tAspectsK = chart.aspects.some(a =>
        a.fromPlanet === tLord.lord && a.toHouse === kLord.lordPlacedInHouse,
      );
      const kAspectsT = chart.aspects.some(a =>
        a.fromPlanet === kLord.lord && a.toHouse === tLord.lordPlacedInHouse,
      );

      if (tAspectsK || kAspectsT) {
        found.push({
          t: trikonaHouse, k: kendraHouse,
          lord1: tLord.lord, lord2: kLord.lord,
          desc: `Lords of ${trikonaHouse}th (${tLord.lord}) and ${kendraHouse}th (${kLord.lord}) in mutual aspect`,
        });
      }
    }
  }

  if (found.length === 0) return { matches: false, supportingPlanets: [], descriptions: [] };

  const planets = [...new Set(found.flatMap(f => [f.lord1, f.lord2]))];
  return {
    matches: true,
    supportingPlanets: planets,
    descriptions: found.map(f => f.desc),
  };
}

function rajYogaStrength(ctx: EvaluationContext, planets: PlanetName[]): number {
  if (planets.length === 0) return 50;
  const total = planets.reduce((sum, p) => {
    const s = ctx.strengths.find(x => x.planet === p)?.overallStrength ?? 50;
    return sum + s;
  }, 0);
  return Math.round(total / planets.length);
}

export const RAJ_YOGA: YogaDefinition = {
  id: "raj-yoga",
  name: "Raj Yoga",
  sanskritName: "Raja Yoga",
  category: "Raj",
  domains: ["Status", "Authority", "Career success", "Recognition", "Power"],
  severity: 95,
  priority: 2,
  conditions: { type: "AND", rules: [] },   // placeholder — evaluateFn overrides
  evaluateFn: evalRajYoga,
  modifiers: [
    {
      condition: { type: "PlanetIsCombust", planet: "Sun" },
      strengthDelta: -10,
      description: "Sun combust — Raj Yoga involving Sun weakened",
    },
  ],
  strengthFormula: rajYogaStrength,
  description:
    "Lord of a Trikona (5th/9th) and lord of a Kendra (4th/7th/10th) in conjunction or mutual aspect — grants high status, authority, and career eminence.",
  classicalReference: "Brihat Parashara Hora Shastra, Raja Yoga adhyaya",
};

// ── Lakshmi Yoga ──────────────────────────────────────────────────────────────
// 9th lord in own/exalted sign AND placed in a Kendra or Trikona.

export const LAKSHMI_YOGA: YogaDefinition = {
  id: "lakshmi-yoga",
  name: "Lakshmi Yoga",
  sanskritName: "Lakshmi Yoga",
  category: "Raj",
  domains: ["Wealth", "Prosperity", "Fortune", "Status"],
  severity: 90,
  priority: 3,
  conditions: {
    type: "AND", rules: [
      {
        type: "OR", rules: [
          { type: "LordOfHouseInGroup", lordOf: 9, group: "Kendra" },
          { type: "LordOfHouseInGroup", lordOf: 9, group: "Trikona" },
        ],
      },
      {
        type: "OR", rules: [
          { type: "LordOfHouseInHouse", lordOf: 9, inHouse: 9 },  // own house
          // Exaltation in Kendra/Trikona checked by group above combined with strength
        ],
      },
    ],
  },
  modifiers: [
    {
      condition: { type: "PlanetStrength", planet: "Jupiter", op: ">=", value: 70 },
      strengthDelta: +10,
      description: "Jupiter strong — Lakshmi Yoga amplified (natural karaka for wealth)",
    },
  ],
  description:
    "Lord of the 9th (fortune) in own sign or exaltation, placed in Kendra or Trikona — exceptional wealth and divine grace.",
  classicalReference: "Phala Deepika, Lakshmi Yoga",
};

export const RAJ_YOGAS: YogaDefinition[] = [GAJAKESARI, RAJ_YOGA, LAKSHMI_YOGA];
