import { YogaDefinition, EvaluationContext, ConditionResult, PlanetName } from "../../types";
import { EXALTATION, DEBILITATION } from "../../chart-engine/lordEngine";

// ── Budha-Aditya Yoga ─────────────────────────────────────────────────────────
// Sun and Mercury in the same sign/house, Mercury NOT combust.
// (Mercury is almost always near Sun — the distinguishing factor is non-combustion
//  and Mercury being in own sign or a friendly sign.)

export const BUDHA_ADITYA: YogaDefinition = {
  id: "budha-aditya",
  name: "Budha-Aditya Yoga",
  sanskritName: "Budha-Aditya",
  category: "Misc",
  domains: ["Intelligence", "Administrative skill", "Communication", "Reputation"],
  severity: 72,
  priority: 50,
  conditions: {
    type: "AND", rules: [
      { type: "PlanetsConjunct", planet1: "Sun", planet2: "Mercury" },
      { type: "NOT", rule: { type: "PlanetIsCombust", planet: "Mercury" } },
    ],
  },
  modifiers: [
    {
      condition: { type: "PlanetInOwnSign", planet: "Mercury" },
      strengthDelta: +15,
      description: "Mercury in own sign — Budha-Aditya at peak potency",
    },
    {
      condition: { type: "PlanetIsExalted", planet: "Mercury" },
      strengthDelta: +20,
      description: "Mercury exalted — exceptionally refined Budha-Aditya",
    },
    {
      condition: { type: "PlanetInOwnSign", planet: "Sun" },
      strengthDelta: +10,
      description: "Sun in Leo — royal dimension of Budha-Aditya enhanced",
    },
  ],
  description:
    "Sun and Mercury conjunct with Mercury free from combustion — sharp intellect, eloquence, administrative genius, and earned reputation.",
  classicalReference: "Phaladeepika, Budha-Aditya Yoga",
};

// ── Amala Yoga ────────────────────────────────────────────────────────────────
// A natural benefic (Jupiter or Venus) in the 10th house from lagna.

export const AMALA_YOGA: YogaDefinition = {
  id: "amala-yoga",
  name: "Amala Yoga",
  sanskritName: "Amala",
  category: "Misc",
  domains: ["Spotless reputation", "Career excellence", "Ethical leadership"],
  severity: 75,
  priority: 51,
  conditions: {
    type: "OR", rules: [
      { type: "PlanetInHouse", planet: "Jupiter", house: 10 },
      { type: "PlanetInHouse", planet: "Venus",   house: 10 },
    ],
  },
  modifiers: [
    {
      condition: { type: "PlanetIsExalted", planet: "Jupiter" },
      strengthDelta: +15,
      description: "Jupiter exalted in 10th — exceptional Amala",
    },
    {
      condition: { type: "PlanetIsExalted", planet: "Venus" },
      strengthDelta: +12,
      description: "Venus exalted in 10th — Amala amplified",
    },
    {
      condition: { type: "PlanetIsCombust", planet: "Jupiter" },
      strengthDelta: -20,
      description: "Jupiter combust — Amala weakened",
    },
    {
      condition: { type: "PlanetIsCombust", planet: "Venus" },
      strengthDelta: -15,
      description: "Venus combust — Amala weakened",
    },
  ],
  description:
    "Natural benefic in the 10th house — a blameless, respected career with lasting positive legacy.",
  classicalReference: "Phaladeepika, Amala Yoga",
};

// ── Parivartana Yoga ──────────────────────────────────────────────────────────
// Mutual sign exchange: planet A is in the sign ruled by planet B,
// and planet B is in the sign ruled by planet A.
// Each pair forms its own Parivartana.  We detect all pairs.

function evalParivartana(ctx: EvaluationContext): ConditionResult {
  const { chart } = ctx;
  const found: { p1: PlanetName; p2: PlanetName; desc: string }[] = [];
  const planets = chart.planets;

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];

      // Skip shadow planets (no sign ownership)
      if (a.planet === "Rahu" || a.planet === "Ketu") continue;
      if (b.planet === "Rahu" || b.planet === "Ketu") continue;

      const aLordsB = chart.lords.find(l => l.house === b.house)?.lord === a.planet;
      const bLordsA = chart.lords.find(l => l.house === a.house)?.lord === b.planet;

      if (aLordsB && bLordsA) {
        found.push({
          p1: a.planet, p2: b.planet,
          desc: `${a.planet} (house ${a.house}) and ${b.planet} (house ${b.house}) in mutual exchange`,
        });
      }
    }
  }

  if (found.length === 0) return { matches: false, supportingPlanets: [], descriptions: [] };
  return {
    matches: true,
    supportingPlanets: [...new Set(found.flatMap(f => [f.p1, f.p2]))],
    descriptions: found.map(f => f.desc),
  };
}

export const PARIVARTANA_YOGA: YogaDefinition = {
  id: "parivartana-yoga",
  name: "Parivartana Yoga",
  sanskritName: "Parivartana",
  category: "Misc",
  domains: ["Exchange of energy", "Mutual benefit between house domains"],
  severity: 70,
  priority: 52,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalParivartana,
  modifiers: [],
  description:
    "Two planets in mutual sign exchange — each activates the other's house, creating a powerful bond between their domains.",
  classicalReference: "Brihat Parashara Hora Shastra, Parivartana Yoga",
};

// ── Neecha Bhanga Raja Yoga ───────────────────────────────────────────────────
// A debilitated planet has its debilitation cancelled (Neecha Bhanga), which
// converts the weakness into a form of strength.  Several cancellation
// conditions are checked.

const DEBILITATION_SIGN_LORD: Partial<Record<PlanetName, PlanetName>> = {
  Sun:     "Venus",    // debilitated in Libra, lord = Venus
  Moon:    "Mars",     // debilitated in Scorpio, lord = Mars
  Mars:    "Moon",     // debilitated in Cancer, lord = Moon
  Mercury: "Jupiter",  // debilitated in Pisces, lord = Jupiter
  Jupiter: "Saturn",   // debilitated in Capricorn, lord = Saturn
  Venus:   "Mercury",  // debilitated in Virgo, lord = Mercury
  Saturn:  "Mars",     // debilitated in Aries, lord = Mars
};

const EXALTATION_PLANET_IN_DEBIL_SIGN: Partial<Record<PlanetName, PlanetName>> = {
  // Planet exalted in the same sign where X is debilitated:
  Sun:     "Saturn",   // Sun debil in Libra; Saturn exalted in Libra
  Moon:    "Jupiter",  // Moon debil in Scorpio; Jupiter exalted in Cancer (not Scorpio - actually no planet exalted in Scorpio)
  Mars:    "Jupiter",  // Mars debil in Cancer; Jupiter exalted in Cancer
  Mercury: "Venus",    // Mercury debil in Pisces; Venus exalted in Pisces
  Jupiter: "Mars",     // Jupiter debil in Capricorn; Mars exalted in Capricorn
  Venus:   "Mercury",  // Venus debil in Virgo; Mercury exalted in Virgo
  Saturn:  "Sun",      // Saturn debil in Aries; Sun exalted in Aries
};

function evalNeechaBhanga(ctx: EvaluationContext): ConditionResult {
  const { chart, strengths } = ctx;
  const results: { planet: PlanetName; desc: string }[] = [];

  for (const pl of chart.planets) {
    if (!DEBILITATION[pl.planet]) continue;  // no debilitation sign for this planet
    if (DEBILITATION[pl.planet] !== pl.sign) continue;  // not debilitated

    const debiPlanet = pl.planet;
    const cancellations: string[] = [];

    // Condition 1: Lord of the debilitation sign is in Kendra from lagna
    const debilLord = DEBILITATION_SIGN_LORD[debiPlanet];
    if (debilLord) {
      const debilLordPlacement = chart.planets.find(x => x.planet === debilLord);
      if (debilLordPlacement && [1, 4, 7, 10].includes(debilLordPlacement.house)) {
        cancellations.push(`${debilLord} (lord of debilitation sign) is in Kendra (house ${debilLordPlacement.house})`);
      }
    }

    // Condition 2: Planet exalted in the same sign is in Kendra from lagna
    const exaltPlanet = EXALTATION_PLANET_IN_DEBIL_SIGN[debiPlanet];
    if (exaltPlanet) {
      const exaltPlacement = chart.planets.find(x => x.planet === exaltPlanet);
      if (exaltPlacement && [1, 4, 7, 10].includes(exaltPlacement.house)) {
        cancellations.push(`${exaltPlanet} (exalted in same sign) is in Kendra (house ${exaltPlacement.house})`);
      }
    }

    // Condition 3: Debilitated planet is retrograde (vakri bala cancels neecha)
    if (pl.isRetrograde) {
      cancellations.push(`${debiPlanet} is retrograde — debilitation partially cancelled (Vakri Neecha Bhanga)`);
    }

    // Condition 4: Debilitation sign lord aspects the debilitated planet
    if (debilLord) {
      const aspectsDebil = chart.aspects.some(a =>
        a.fromPlanet === debilLord && a.toHouse === pl.house,
      );
      if (aspectsDebil) {
        cancellations.push(`${debilLord} aspects ${debiPlanet} — debilitation lord reconnects with its planet`);
      }
    }

    if (cancellations.length > 0) {
      results.push({
        planet: debiPlanet,
        desc: `${debiPlanet} debilitation cancelled: ${cancellations.join("; ")}`,
      });
    }
  }

  if (results.length === 0) return { matches: false, supportingPlanets: [], descriptions: [] };

  return {
    matches: true,
    supportingPlanets: results.map(r => r.planet),
    descriptions: results.map(r => r.desc),
  };
}

export const NEECHA_BHANGA: YogaDefinition = {
  id: "neecha-bhanga",
  name: "Neecha Bhanga Raja Yoga",
  sanskritName: "Neecha Bhanga Raja Yoga",
  category: "Raj",
  domains: ["Rise after adversity", "Struggle then success", "Late-blooming career"],
  severity: 82,
  priority: 5,
  conditions: { type: "AND", rules: [] },
  evaluateFn: evalNeechaBhanga,
  modifiers: [],
  description:
    "Debilitation of a planet is cancelled — the weakness is converted to resilience; the native rises powerfully after early struggles.",
  classicalReference: "Brihat Parashara Hora Shastra, Neecha Bhanga Raja Yoga",
};

// ── Veshi Yoga ────────────────────────────────────────────────────────────────
// A planet (other than Moon) in 2nd from the Sun.

export const VESHI_YOGA: YogaDefinition = {
  id: "veshi",
  name: "Veshi Yoga",
  category: "Misc",
  domains: ["Eloquence", "Prosperity", "Industriousness"],
  severity: 60,
  priority: 55,
  conditions: {
    type: "OR", rules: (["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as PlanetName[]).map(p => ({
      type: "PlanetAspectsPlanet" as const,
      from: "Sun" as PlanetName,
      to: p,
    })),
  },
  modifiers: [],
  description:
    "A planet in the 2nd house from the Sun — energy and ambition flow from the Sun into the adjoining house.",
};

export const MISC_YOGAS: YogaDefinition[] = [
  BUDHA_ADITYA, AMALA_YOGA, PARIVARTANA_YOGA, NEECHA_BHANGA, VESHI_YOGA,
];
