import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";

// ── Finance-domain Yoga Definitions ───────────────────────────────────────────
//
// These three yogas extend the existing DHANA_YOGAS (dhana.ts) without
// duplicating any that already appear there or in misc.ts.
//
// Already present in dhana.ts:  dhana-yoga, dhana-yoga-9-2, guru-dhana-yoga
// Already present in misc.ts:   budha-aditya, amala-yoga, parivartana-yoga,
//                                neecha-bhanga, veshi
//
// New yogas added here:
//   vasumati  — exceptional wealth through benefic upachaya occupation
//   kahala    — property and inherited fortune through strong 4th/9th lords
//   lakshmi   — divine prosperity when 9th lord is strong in kendra/trikona + Venus strong
//
// These are consumed by the Finance domain engine; registration in
// definitions/index.ts is handled separately.

// ── Vasumati Yoga ─────────────────────────────────────────────────────────────
// At least 3 of the 4 natural benefics (Jupiter, Venus, Mercury, Moon) occupy
// upachaya houses (3, 6, 10, 11).  Upachaya houses are "houses of growth" —
// they improve with time and generate progressive material gains.

function evalVasumati(ctx: EvaluationContext): ConditionResult {
  const upachayas: number[]   = [3, 6, 10, 11];
  const benefics: PlanetName[] = ["Jupiter", "Venus", "Mercury", "Moon"];

  const beneficsInUpachaya = benefics.filter(planet => {
    const placement = ctx.chart.planets.find(p => p.planet === planet);
    return placement !== undefined && upachayas.includes(placement.house);
  });

  if (beneficsInUpachaya.length < 3) return none();

  const descriptions = beneficsInUpachaya.map(p => {
    const placement = ctx.chart.planets.find(pl => pl.planet === p)!;
    return `${p} in house ${placement.house} (upachaya — house of growth)`;
  });

  return hit(beneficsInUpachaya, descriptions);
}

export const VASUMATI_YOGA: YogaDefinition = {
  id:            "vasumati",
  name:          "Vasumati Yoga",
  sanskritName:  "Vasumati",
  category:      "Dhana",
  domains:       ["Exceptional wealth", "Financial mastery"],
  severity:      88,
  priority:      60,
  conditions:    { type: "AND", rules: [] },
  evaluateFn:    evalVasumati,
  modifiers: [],
  description:
    "At least 3 of the 4 natural benefics (Jupiter, Venus, Mercury, Moon) occupy upachaya houses (3rd, 6th, 10th, 11th) — exceptional wealth accumulation, financial mastery, and sustained material prosperity through the progressive power of growth houses.",
  classicalReference: "Phaladeepika, Vasumati Yoga",
};

// ── Kahala Yoga ───────────────────────────────────────────────────────────────
// The 4th lord (property, home, fixed assets) and 9th lord (fortune, dharma,
// inherited blessings) are BOTH strong (≥ 60).  When the pillars of immovable
// property and divine fortune are simultaneously empowered, Kahala Yoga confers
// wealth through real estate and inheritance.

function evalKahala(ctx: EvaluationContext): ConditionResult {
  const l4Entry = ctx.chart.lords.find(l => l.house === 4);
  const l9Entry = ctx.chart.lords.find(l => l.house === 9);
  if (!l4Entry || !l9Entry) return none();

  const str4 = ctx.strengths.find(s => s.planet === l4Entry.lord)?.overallStrength ?? 0;
  const str9 = ctx.strengths.find(s => s.planet === l9Entry.lord)?.overallStrength ?? 0;

  if (str4 < 60 || str9 < 60) return none();

  // Same planet rules both houses — deduplicate
  const planets: PlanetName[] = l4Entry.lord === l9Entry.lord
    ? [l4Entry.lord]
    : [l4Entry.lord, l9Entry.lord];

  return hit(planets, [
    `4th lord ${l4Entry.lord} strong (${str4}/100) — property and home wealth`,
    `9th lord ${l9Entry.lord} strong (${str9}/100) — fortune and inherited blessing`,
  ]);
}

export const KAHALA_YOGA: YogaDefinition = {
  id:           "kahala",
  name:         "Kahala Yoga",
  sanskritName: "Kahala",
  category:     "Dhana",
  domains:      ["Property wealth", "Inherited fortune"],
  severity:     70,
  priority:     61,
  conditions:   { type: "AND", rules: [] },
  evaluateFn:   evalKahala,
  modifiers: [],
  description:
    "The 4th lord (property) and 9th lord (fortune) are both strong — wealth through real estate, landed inheritance, and financial fortune arising from righteous living.",
  classicalReference: "Brihat Parashara Hora Shastra, Kahala Yoga",
};

// ── Lakshmi Yoga ──────────────────────────────────────────────────────────────
// The 9th lord (fortune) is strong AND placed in a kendra (1/4/7/10) or
// trikona (1/5/9) — combined: houses [1,4,5,7,9,10] — AND Venus (natural
// karaka of prosperity and Lakshmi's grace) is also strong (≥ 60).
// All three conditions together invoke divine financial grace.

function evalLakshmi(ctx: EvaluationContext): ConditionResult {
  const l9Entry = ctx.chart.lords.find(l => l.house === 9);
  if (!l9Entry) return none();

  const lord9 = l9Entry.lord;
  const str9  = ctx.strengths.find(s => s.planet === lord9)?.overallStrength ?? 0;
  if (str9 < 60) return none();

  // 9th lord must be placed in a kendra or trikona
  const lord9Placement = ctx.chart.planets.find(p => p.planet === lord9);
  if (!lord9Placement) return none();

  const kendraTrikona = [1, 4, 5, 7, 9, 10];
  if (!kendraTrikona.includes(lord9Placement.house)) return none();

  // Venus must be strong
  const venusStrength = ctx.strengths.find(s => s.planet === "Venus")?.overallStrength ?? 0;
  if (venusStrength < 60) return none();

  // Deduplicate when 9th lord is Venus
  const planets: PlanetName[] = lord9 === "Venus"
    ? ["Venus"]
    : [lord9, "Venus"];

  return hit(planets, [
    `9th lord ${lord9} strong (${str9}/100) placed in house ${lord9Placement.house} (kendra/trikona)`,
    `Venus strong (${venusStrength}/100) — Lakshmi's grace and prosperity`,
  ]);
}

export const LAKSHMI_YOGA: YogaDefinition = {
  id:           "lakshmi",
  name:         "Lakshmi Yoga",
  sanskritName: "Lakshmi",
  category:     "Dhana",
  domains:      ["Divine wealth", "Prosperity", "Fortune"],
  severity:     82,
  priority:     62,
  conditions:   { type: "AND", rules: [] },
  evaluateFn:   evalLakshmi,
  modifiers: [
    {
      condition:     { type: "PlanetIsExalted", planet: "Venus" },
      strengthDelta: +15,
      description:   "Venus exalted — Lakshmi Yoga at exceptional potency",
    },
    {
      condition:     { type: "PlanetIsCombust", planet: "Venus" },
      strengthDelta: -20,
      description:   "Venus combust — Lakshmi Yoga weakened",
    },
  ],
  description:
    "The 9th lord (fortune) is strong and positioned in a kendra or trikona, while Venus (karaka of Lakshmi and prosperity) is also strong — divine financial grace, sustained prosperity, and abundance through dharmic living.",
  classicalReference: "Phaladeepika, Lakshmi Yoga",
};

export const FINANCE_YOGAS: YogaDefinition[] = [VASUMATI_YOGA, KAHALA_YOGA, LAKSHMI_YOGA];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hit(planets: PlanetName[], descriptions: string[]): ConditionResult {
  return { matches: true, supportingPlanets: planets, descriptions };
}

function none(): ConditionResult {
  return { matches: false, supportingPlanets: [] as PlanetName[], descriptions: [] as string[] };
}
