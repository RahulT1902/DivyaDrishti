import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";

// ── Dhana Yoga ────────────────────────────────────────────────────────────────
// Lords of wealth houses (2nd and 11th) in conjunction or mutual aspect.

function evalDhanaYoga(ctx: EvaluationContext): ConditionResult {
  const { chart } = ctx;
  const l2  = chart.lords.find(l => l.house === 2);
  const l11 = chart.lords.find(l => l.house === 11);
  if (!l2 || !l11) return none();

  if (l2.lord === l11.lord) {
    return hit([l2.lord], [`${l2.lord} rules both 2nd and 11th houses — natural Dhana Yoga`]);
  }

  if (l2.lordPlacedInHouse === l11.lordPlacedInHouse) {
    return hit(
      [l2.lord, l11.lord],
      [`Lords of 2nd (${l2.lord}) and 11th (${l11.lord}) conjunct in house ${l2.lordPlacedInHouse}`],
    );
  }

  const twoDashes11 = chart.aspects.some(a =>
    a.fromPlanet === l2.lord && a.toHouse === l11.lordPlacedInHouse,
  );
  const elevenAspects2 = chart.aspects.some(a =>
    a.fromPlanet === l11.lord && a.toHouse === l2.lordPlacedInHouse,
  );

  if (twoDashes11 || elevenAspects2) {
    return hit(
      [l2.lord, l11.lord],
      [`Lords of 2nd (${l2.lord}) and 11th (${l11.lord}) in mutual aspect`],
    );
  }

  return none();
}

export const DHANA_YOGA: YogaDefinition = {
  id: "dhana-yoga",
  name: "Dhana Yoga",
  sanskritName: "Dhana Yoga",
  category: "Dhana",
  domains: ["Wealth", "Income", "Financial accumulation", "Material gains"],
  severity: 85,
  priority: 20,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalDhanaYoga,
  strengthFormula(ctx: EvaluationContext, planets: PlanetName[]): number {
    if (planets.length === 0) return 50;
    const avg = planets.reduce((s, p) => s + (ctx.strengths.find(x => x.planet === p)?.overallStrength ?? 50), 0)
      / planets.length;
    return Math.round(avg);
  },
  modifiers: [
    {
      condition: { type: "LordOfHouseInHouse", lordOf: 2, inHouse: 2 },
      strengthDelta: +10,
      description: "Lord of 2nd in own house — direct Dhana Yoga strengthened",
    },
    {
      condition: { type: "LordOfHouseInHouse", lordOf: 11, inHouse: 11 },
      strengthDelta: +10,
      description: "Lord of 11th in own house — gains maximized",
    },
  ],
  description:
    "Lords of the 2nd (wealth) and 11th (income) houses connected by conjunction or mutual aspect — financial prosperity and material accumulation.",
  classicalReference: "Brihat Parashara Hora Shastra, Dhana Yoga adhyaya",
};

// ── Dhana Yoga (9th + 2nd) ────────────────────────────────────────────────────
// Fortune (9th) lord connected to wealth (2nd) lord.

export const DHANA_YOGA_9_2: YogaDefinition = {
  id: "dhana-yoga-9-2",
  name: "Dhana Yoga (Fortune + Wealth)",
  sanskritName: "Bhagya Dhana Yoga",
  category: "Dhana",
  domains: ["Inherited wealth", "Fortune", "Paternal inheritance"],
  severity: 80,
  priority: 21,
  conditions: {
    type: "OR", rules: [
      { type: "HouseLordsConjunct",        house1: 9, house2: 2 },
      { type: "HouseLordAspectsHouseLord", fromHouse: 9, toHouse: 2 },
      { type: "HouseLordAspectsHouseLord", fromHouse: 2, toHouse: 9 },
    ],
  },
  modifiers: [],
  description:
    "Lord of the 9th (fortune) connected to lord of the 2nd (wealth) — inherited or fortunate wealth accumulation.",
};

// ── Jupiter in 2nd / 5th / 9th / 11th ────────────────────────────────────────
// Jupiter's natural karaka energy for wealth when in wealth houses.

export const GURU_DHANA_YOGA: YogaDefinition = {
  id: "guru-dhana-yoga",
  name: "Guru Dhana Yoga",
  category: "Dhana",
  domains: ["Wealth through wisdom", "Teaching income", "Advisory prosperity"],
  severity: 75,
  priority: 22,
  conditions: {
    type: "OR", rules: [
      { type: "PlanetInHouse", planet: "Jupiter", house: 2 },
      { type: "PlanetInHouse", planet: "Jupiter", house: 5 },
      { type: "PlanetInHouse", planet: "Jupiter", house: 9 },
      { type: "PlanetInHouse", planet: "Jupiter", house: 11 },
    ],
  },
  modifiers: [
    {
      condition: { type: "PlanetIsCombust", planet: "Jupiter" },
      strengthDelta: -20,
      description: "Jupiter combust — Guru Dhana Yoga weakened",
    },
    {
      condition: { type: "PlanetIsExalted", planet: "Jupiter" },
      strengthDelta: +20,
      description: "Jupiter exalted — exceptional financial grace",
    },
  ],
  description:
    "Jupiter in a wealth house (2nd, 5th, 9th, 11th) — prosperity through wisdom, teaching, counsel, or fortunate investments.",
};

export const DHANA_YOGAS: YogaDefinition[] = [DHANA_YOGA, DHANA_YOGA_9_2, GURU_DHANA_YOGA];

function hit(planets: PlanetName[], descriptions: string[]) {
  return { matches: true, supportingPlanets: planets, descriptions };
}
function none() {
  return { matches: false, supportingPlanets: [] as PlanetName[], descriptions: [] as string[] };
}
