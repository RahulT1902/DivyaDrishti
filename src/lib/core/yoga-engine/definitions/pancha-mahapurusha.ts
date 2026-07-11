import { YogaDefinition, EvaluationContext, PlanetName } from "../../types";

// Pancha Mahapurusha = Five Great Person Yogas
// Each: the planet must be in own or exaltation sign AND in a Kendra (1/4/7/10)
// from the ascendant.

function panchaMahapurushaStrength(ctx: EvaluationContext, planets: PlanetName[]): number {
  const planet = planets[0];
  const s = ctx.strengths.find(x => x.planet === planet);
  return s ? Math.round(s.overallStrength) : 50;
}

export const PANCHA_MAHAPURUSHA_YOGAS: YogaDefinition[] = [
  {
    id: "ruchaka",
    name: "Ruchaka Yoga",
    sanskritName: "Ruchaka",
    category: "PanchaMahapurusha",
    domains: ["Courage", "Physical prowess", "Leadership", "Wealth"],
    severity: 90,
    priority: 10,
    conditions: {
      type: "AND", rules: [
        { type: "OR", rules: [
          { type: "PlanetInOwnSign",  planet: "Mars" },
          { type: "PlanetIsExalted",  planet: "Mars" },
        ]},
        { type: "PlanetInGroup", planet: "Mars", group: "Kendra" },
      ],
    },
    modifiers: [
      {
        condition: { type: "PlanetIsCombust", planet: "Mars" },
        strengthDelta: -30,
        description: "Mars combust — Ruchaka severely weakened",
      },
      {
        condition: { type: "PlanetIsVargottama", planet: "Mars" },
        strengthDelta: +12,
        description: "Mars Vargottama — Ruchaka further amplified",
      },
    ],
    strengthFormula: panchaMahapurushaStrength,
    description: "Mars in own/exalted sign in a Kendra — courage, military prowess, and strong physical constitution.",
    classicalReference: "Brihat Parashara Hora Shastra, Pancha Mahapurusha adhyaya",
  },

  {
    id: "bhadra",
    name: "Bhadra Yoga",
    sanskritName: "Bhadra",
    category: "PanchaMahapurusha",
    domains: ["Intelligence", "Communication", "Business", "Learning"],
    severity: 88,
    priority: 11,
    conditions: {
      type: "AND", rules: [
        { type: "OR", rules: [
          { type: "PlanetInOwnSign", planet: "Mercury" },
          { type: "PlanetIsExalted", planet: "Mercury" },
        ]},
        { type: "PlanetInGroup", planet: "Mercury", group: "Kendra" },
      ],
    },
    modifiers: [
      {
        condition: { type: "PlanetIsCombust", planet: "Mercury" },
        strengthDelta: -20,
        description: "Mercury combust — Bhadra weakened (though Mercury is less susceptible near Sun)",
      },
      {
        condition: { type: "PlanetIsVargottama", planet: "Mercury" },
        strengthDelta: +10,
        description: "Mercury Vargottama — Bhadra strengthened",
      },
    ],
    strengthFormula: panchaMahapurushaStrength,
    description: "Mercury in own/exalted sign in a Kendra — exceptional intelligence, eloquence, and business acumen.",
    classicalReference: "Brihat Parashara Hora Shastra, Pancha Mahapurusha adhyaya",
  },

  {
    id: "hamsa",
    name: "Hamsa Yoga",
    sanskritName: "Hamsa",
    category: "PanchaMahapurusha",
    domains: ["Wisdom", "Spirituality", "Dharma", "Teaching", "Prosperity"],
    severity: 92,
    priority: 12,
    conditions: {
      type: "AND", rules: [
        { type: "OR", rules: [
          { type: "PlanetInOwnSign", planet: "Jupiter" },
          { type: "PlanetIsExalted", planet: "Jupiter" },
        ]},
        { type: "PlanetInGroup", planet: "Jupiter", group: "Kendra" },
      ],
    },
    modifiers: [
      {
        condition: { type: "PlanetIsCombust", planet: "Jupiter" },
        strengthDelta: -25,
        description: "Jupiter combust — Hamsa weakened",
      },
      {
        condition: { type: "PlanetIsVargottama", planet: "Jupiter" },
        strengthDelta: +15,
        description: "Jupiter Vargottama — Hamsa at peak potency",
      },
    ],
    strengthFormula: panchaMahapurushaStrength,
    description: "Jupiter in own/exalted sign in a Kendra — wisdom, prosperity, spiritual elevation, and ethical leadership.",
    classicalReference: "Brihat Parashara Hora Shastra, Pancha Mahapurusha adhyaya",
  },

  {
    id: "malavya",
    name: "Malavya Yoga",
    sanskritName: "Malavya",
    category: "PanchaMahapurusha",
    domains: ["Luxury", "Beauty", "Love", "Wealth", "Arts"],
    severity: 88,
    priority: 13,
    conditions: {
      type: "AND", rules: [
        { type: "OR", rules: [
          { type: "PlanetInOwnSign", planet: "Venus" },
          { type: "PlanetIsExalted", planet: "Venus" },
        ]},
        { type: "PlanetInGroup", planet: "Venus", group: "Kendra" },
      ],
    },
    modifiers: [
      {
        condition: { type: "PlanetIsCombust", planet: "Venus" },
        strengthDelta: -20,
        description: "Venus combust — Malavya weakened",
      },
      {
        condition: { type: "PlanetIsVargottama", planet: "Venus" },
        strengthDelta: +12,
        description: "Venus Vargottama — Malavya further amplified",
      },
    ],
    strengthFormula: panchaMahapurushaStrength,
    description: "Venus in own/exalted sign in a Kendra — luxury, refinement, artistic gifts, and material abundance.",
    classicalReference: "Brihat Parashara Hora Shastra, Pancha Mahapurusha adhyaya",
  },

  {
    id: "sasa",
    name: "Sasa Yoga",
    sanskritName: "Shasha",
    category: "PanchaMahapurusha",
    domains: ["Authority", "Discipline", "Perseverance", "Property", "Service"],
    severity: 85,
    priority: 14,
    conditions: {
      type: "AND", rules: [
        { type: "OR", rules: [
          { type: "PlanetInOwnSign", planet: "Saturn" },
          { type: "PlanetIsExalted", planet: "Saturn" },
        ]},
        { type: "PlanetInGroup", planet: "Saturn", group: "Kendra" },
      ],
    },
    modifiers: [
      {
        condition: { type: "PlanetIsCombust", planet: "Saturn" },
        strengthDelta: -25,
        description: "Saturn combust — Sasa weakened",
      },
      {
        condition: { type: "PlanetIsRetrograde", planet: "Saturn" },
        strengthDelta: +10,
        description: "Saturn retrograde — intensified Saturnine focus",
      },
      {
        condition: { type: "PlanetIsVargottama", planet: "Saturn" },
        strengthDelta: +12,
        description: "Saturn Vargottama — Sasa amplified",
      },
    ],
    strengthFormula: panchaMahapurushaStrength,
    description: "Saturn in own/exalted sign in a Kendra — authority, administrative skill, endurance, and mastery of material challenges.",
    classicalReference: "Brihat Parashara Hora Shastra, Pancha Mahapurusha adhyaya",
  },
];
