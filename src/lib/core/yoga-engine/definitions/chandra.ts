import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";

const NON_SHADOW: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const NON_SUN_PLANETS: PlanetName[] = ["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

// ── Sunapha Yoga ──────────────────────────────────────────────────────────────
// A planet other than the Sun occupies the 2nd house from Moon.

function evalSunapha(ctx: EvaluationContext): ConditionResult {
  const moon = ctx.chart.planets.find(p => p.planet === "Moon");
  if (!moon) return none();
  const targetHouse = ((moon.house - 1 + 1) % 12) + 1; // 2nd from Moon

  const planets = NON_SUN_PLANETS.filter(p => {
    const pl = ctx.chart.planets.find(x => x.planet === p);
    return pl && pl.house === targetHouse;
  });

  if (planets.length === 0) return none();
  return {
    matches: true,
    supportingPlanets: ["Moon", ...planets],
    descriptions: [`${planets.join(", ")} in 2nd house from Moon (house ${targetHouse})`],
  };
}

export const SUNAPHA: YogaDefinition = {
  id: "sunapha",
  name: "Sunapha Yoga",
  sanskritName: "Sunapha",
  category: "Chandra",
  domains: ["Wealth", "Fame", "Intelligence", "Royal favour"],
  severity: 72,
  priority: 30,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalSunapha,
  modifiers: [],
  description:
    "A planet (excluding Sun) in the 2nd house from Moon — wealth, self-made prosperity, and mental acuity.",
  classicalReference: "Phaladeepika, Chandra Yoga section",
};

// ── Anapha Yoga ───────────────────────────────────────────────────────────────
// A planet other than the Sun occupies the 12th house from Moon.

function evalAnapha(ctx: EvaluationContext): ConditionResult {
  const moon = ctx.chart.planets.find(p => p.planet === "Moon");
  if (!moon) return none();
  const targetHouse = ((moon.house - 2 + 12) % 12) + 1; // 12th from Moon

  const planets = NON_SUN_PLANETS.filter(p => {
    const pl = ctx.chart.planets.find(x => x.planet === p);
    return pl && pl.house === targetHouse;
  });

  if (planets.length === 0) return none();
  return {
    matches: true,
    supportingPlanets: ["Moon", ...planets],
    descriptions: [`${planets.join(", ")} in 12th house from Moon (house ${targetHouse})`],
  };
}

export const ANAPHA: YogaDefinition = {
  id: "anapha",
  name: "Anapha Yoga",
  sanskritName: "Anapha",
  category: "Chandra",
  domains: ["Renown", "Good health", "Charitable nature", "Enjoyment"],
  severity: 70,
  priority: 31,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalAnapha,
  modifiers: [],
  description:
    "A planet (excluding Sun) in the 12th house from Moon — fame, vitality, and a generous, enjoyment-seeking nature.",
  classicalReference: "Phaladeepika, Chandra Yoga section",
};

// ── Durudhara Yoga ────────────────────────────────────────────────────────────
// Planets (excluding Sun) on BOTH sides of Moon (2nd and 12th).

function evalDurudhara(ctx: EvaluationContext): ConditionResult {
  const moon = ctx.chart.planets.find(p => p.planet === "Moon");
  if (!moon) return none();

  const house2nd  = ((moon.house - 1 + 1) % 12) + 1;
  const house12th = ((moon.house - 2 + 12) % 12) + 1;

  const in2nd  = NON_SUN_PLANETS.filter(p => ctx.chart.planets.find(x => x.planet === p)?.house === house2nd);
  const in12th = NON_SUN_PLANETS.filter(p => ctx.chart.planets.find(x => x.planet === p)?.house === house12th);

  if (in2nd.length === 0 || in12th.length === 0) return none();

  const all = [...new Set(["Moon" as PlanetName, ...in2nd, ...in12th])];
  return {
    matches: true,
    supportingPlanets: all,
    descriptions: [
      `Planets in 2nd from Moon (house ${house2nd}): ${in2nd.join(", ")}`,
      `Planets in 12th from Moon (house ${house12th}): ${in12th.join(", ")}`,
    ],
  };
}

export const DURUDHARA: YogaDefinition = {
  id: "durudhara",
  name: "Durudhara Yoga",
  sanskritName: "Durudhara",
  category: "Chandra",
  domains: ["Wealth", "Charity", "Comfort", "Balanced mind"],
  severity: 78,
  priority: 32,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalDurudhara,
  modifiers: [
    {
      condition: { type: "PlanetStrength", planet: "Moon", op: ">=", value: 65 },
      strengthDelta: +12,
      description: "Moon strong — Durudhara amplified",
    },
  ],
  description:
    "Planets on both sides of Moon (2nd and 12th) — full Chandra Yoga; balanced wealth, comforts, and philanthropic nature.",
  classicalReference: "Phaladeepika, Chandra Yoga section",
};

// ── Kemadrum Yoga (anti-yoga, negative) ──────────────────────────────────────
// No planets in 2nd OR 12th from Moon (Moon completely alone).

function evalKemadrum(ctx: EvaluationContext): ConditionResult {
  const moon = ctx.chart.planets.find(p => p.planet === "Moon");
  if (!moon) return none();

  const house2nd  = ((moon.house - 1 + 1) % 12) + 1;
  const house12th = ((moon.house - 2 + 12) % 12) + 1;

  const in2nd  = NON_SHADOW.filter(p => p !== "Moon" && ctx.chart.planets.find(x => x.planet === p)?.house === house2nd);
  const in12th = NON_SHADOW.filter(p => p !== "Moon" && ctx.chart.planets.find(x => x.planet === p)?.house === house12th);

  if (in2nd.length > 0 || in12th.length > 0) return none();

  return {
    matches: true,
    supportingPlanets: ["Moon"],
    descriptions: ["Moon is completely isolated — no planet in 2nd or 12th from it"],
  };
}

export const KEMADRUM: YogaDefinition = {
  id: "kemadrum",
  name: "Kemadrum Yoga",
  sanskritName: "Kemadrum",
  category: "Chandra",
  domains: ["Mental isolation", "Emotional hardship"],
  severity: 65,
  priority: 33,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalKemadrum,
  modifiers: [
    {
      condition: { type: "PlanetIsExalted", planet: "Moon" },
      strengthDelta: -40,
      description: "Moon exalted — Kemadrum partially cancelled",
    },
    {
      condition: { type: "PlanetInKendraFromPlanet", planet: "Moon", reference: "Jupiter" },
      strengthDelta: -35,
      description: "Jupiter in Kendra from Moon — Kemadrum partially cancelled (Gajakesari overlap)",
    },
  ],
  description:
    "Moon isolated with no planets in adjacent houses — emotional instability, mental restlessness, and difficulty with sustained focus.",
  classicalReference: "Phaladeepika, Chandra Yoga section",
};

export const CHANDRA_YOGAS: YogaDefinition[] = [SUNAPHA, ANAPHA, DURUDHARA, KEMADRUM];

function none(): ConditionResult {
  return { matches: false, supportingPlanets: [], descriptions: [] };
}
