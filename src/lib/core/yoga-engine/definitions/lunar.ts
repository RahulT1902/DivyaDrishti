import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";

// ── Chandra-Mangala Yoga ──────────────────────────────────────────────────────
// Moon and Mars in conjunction (same house) OR in mutual 7th aspect (6 houses apart).
// The union of lunar emotion and Martian drive creates strong material ambition
// and commercial acumen.

function evalChandraMangala(ctx: EvaluationContext): ConditionResult {
  const moon = ctx.chart.planets.find(p => p.planet === "Moon");
  const mars = ctx.chart.planets.find(p => p.planet === "Mars");
  if (!moon || !mars) return none();

  // Conjunction (same house)
  if (moon.house === mars.house) {
    return {
      matches: true,
      supportingPlanets: ["Moon", "Mars"],
      descriptions: [`Moon and Mars conjunct in house ${moon.house}`],
    };
  }

  // Mutual 7th aspect: the two planets are exactly 6 houses apart.
  // When Moon is in house X and Mars in house X+6, each sees the other's house
  // via the universal 7th-house aspect.
  const diff = ((moon.house - mars.house + 12) % 12);
  if (diff === 6) {
    return {
      matches: true,
      supportingPlanets: ["Moon", "Mars"],
      descriptions: [
        `Moon (house ${moon.house}) and Mars (house ${mars.house}) in mutual 7th aspect`,
      ],
    };
  }

  return none();
}

export const CHANDRA_MANGALA: YogaDefinition = {
  id: "chandra-mangala",
  name: "Chandra-Mangala Yoga",
  sanskritName: "Chandra-Mangala",
  category: "Chandra",
  domains: ["Wealth", "Business", "Commerce", "Drive", "Energy"],
  severity: 70,
  priority: 34,
  conditions: { type: "AND", rules: [] },   // evaluateFn drives detection
  evaluateFn: evalChandraMangala,
  modifiers: [
    {
      condition: { type: "PlanetIsExalted", planet: "Moon" },
      strengthDelta: +12,
      description: "Moon exalted — Chandra-Mangala wealth dimension amplified",
    },
    {
      condition: { type: "PlanetIsExalted", planet: "Mars" },
      strengthDelta: +12,
      description: "Mars exalted (Capricorn) — drive and ambition powerfully expressed",
    },
    {
      condition: { type: "PlanetIsDebilitated", planet: "Moon" },
      strengthDelta: -20,
      description: "Moon debilitated — emotional instability weakens the yoga",
    },
    {
      condition: { type: "PlanetIsDebilitated", planet: "Mars" },
      strengthDelta: -20,
      description: "Mars debilitated (Cancer) — drive is scattered, yoga weakened",
    },
    {
      condition: { type: "PlanetIsCombust", planet: "Mars" },
      strengthDelta: -15,
      description: "Mars combust — Chandra-Mangala energy suppressed",
    },
    {
      condition: { type: "PlanetStrength", planet: "Moon", op: ">=", value: 70 },
      strengthDelta: +8,
      description: "Moon strong — emotional intelligence underpins commercial success",
    },
    {
      condition: { type: "PlanetStrength", planet: "Mars", op: ">=", value: 70 },
      strengthDelta: +8,
      description: "Mars strong — execution power enhances business outcomes",
    },
  ],
  strengthFormula(ctx: EvaluationContext): number {
    const m = ctx.strengths.find(s => s.planet === "Moon")?.overallStrength  ?? 50;
    const ma = ctx.strengths.find(s => s.planet === "Mars")?.overallStrength ?? 50;
    return Math.round((m + ma) / 2);
  },
  description:
    "Moon and Mars in conjunction or mutual 7th aspect — the union of emotion and drive; strong commercial instinct, wealth through business, and energetic enterprise.",
  classicalReference: "Brihat Parashara Hora Shastra; Phaladeepika, Chandra-Mangala Yoga",
};

// ── Adhiyoga ──────────────────────────────────────────────────────────────────
// Mercury, Venus, or Jupiter (natural benefics) placed in the 6th, 7th, or 8th
// house from the Moon.  Having even one benefic qualifies; all three confers the
// highest form of the yoga.
//
// Classical interpretation: the native becomes a commander, chief minister, or
// leader with long life and good health.

function evalAdhiyoga(ctx: EvaluationContext): ConditionResult {
  const moon = ctx.chart.planets.find(p => p.planet === "Moon");
  if (!moon) return none();

  // 6th, 7th, 8th from Moon (using the same house-offset formula as chandra.ts)
  const h6 = ((moon.house - 1 + 5) % 12) + 1;
  const h7 = ((moon.house - 1 + 6) % 12) + 1;
  const h8 = ((moon.house - 1 + 7) % 12) + 1;
  const targetHouses = [h6, h7, h8];

  const benefics: PlanetName[] = ["Mercury", "Venus", "Jupiter"];
  const found: PlanetName[] = [];

  for (const benefic of benefics) {
    const p = ctx.chart.planets.find(x => x.planet === benefic);
    if (p && targetHouses.includes(p.house)) {
      found.push(benefic);
    }
  }

  if (found.length === 0) return none();
  return {
    matches: true,
    supportingPlanets: ["Moon" as PlanetName, ...found],
    descriptions: [
      `${found.join(", ")} in 6th/7th/8th from Moon (houses ${h6}/${h7}/${h8}) — Adhiyoga`,
    ],
  };
}

export const ADHIYOGA: YogaDefinition = {
  id: "adhiyoga",
  name: "Adhiyoga",
  sanskritName: "Adhi Yoga",
  category: "Chandra",
  domains: ["Authority", "Leadership", "Health", "Longevity", "Prosperity"],
  severity: 75,
  priority: 35,
  conditions: { type: "AND", rules: [] },   // evaluateFn drives detection
  evaluateFn: evalAdhiyoga,
  modifiers: [
    // All three benefics present — Paripurna (complete) Adhiyoga
    {
      condition: { type: "PlanetInGroup", planet: "Mercury", group: "Kendra" },
      strengthDelta: +8,
      description: "Mercury also in Kendra — analytical authority strengthened",
    },
    {
      condition: { type: "PlanetInGroup", planet: "Venus", group: "Kendra" },
      strengthDelta: +8,
      description: "Venus also in Kendra — grace and influence amplified",
    },
    {
      condition: { type: "PlanetInGroup", planet: "Jupiter", group: "Kendra" },
      strengthDelta: +12,
      description: "Jupiter also in Kendra — wisdom and benevolent authority at peak",
    },
    {
      condition: { type: "PlanetIsExalted", planet: "Jupiter" },
      strengthDelta: +15,
      description: "Jupiter exalted — Adhiyoga at maximum potency",
    },
    {
      condition: { type: "PlanetIsExalted", planet: "Venus" },
      strengthDelta: +10,
      description: "Venus exalted — refined leadership and longevity blessed",
    },
    {
      condition: { type: "PlanetIsCombust", planet: "Mercury" },
      strengthDelta: -10,
      description: "Mercury combust — communicative edge of Adhiyoga reduced",
    },
    {
      condition: { type: "PlanetIsCombust", planet: "Jupiter" },
      strengthDelta: -20,
      description: "Jupiter combust — authority dimension of Adhiyoga weakened",
    },
  ],
  strengthFormula(ctx: EvaluationContext, planets: PlanetName[]): number {
    // Average strength of all supporting planets (Moon + found benefics)
    if (planets.length === 0) return 50;
    const total = planets.reduce(
      (sum, p) => sum + (ctx.strengths.find(s => s.planet === p)?.overallStrength ?? 50),
      0,
    );
    return Math.round(total / planets.length);
  },
  description:
    "Mercury, Venus, or Jupiter in the 6th, 7th, or 8th house from Moon — grants natural authority, leadership, health, and long-lasting prosperity; with all three benefics present the native rises to the highest positions.",
  classicalReference: "Brihat Parashara Hora Shastra, Adhi Yoga; Phaladeepika",
};

export const LUNAR_YOGAS: YogaDefinition[] = [CHANDRA_MANGALA, ADHIYOGA];

function none(): ConditionResult {
  return { matches: false, supportingPlanets: [], descriptions: [] };
}
