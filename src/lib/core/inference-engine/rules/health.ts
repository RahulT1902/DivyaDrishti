import { AstrologyContext, DraftConclusion, PlanetName } from "../../types";
import { SymbolRegistry } from "../symbolRegistry";
import { InferenceRule } from "./general";

// Health inference rules (D1-based — D6 Shashtamsha is Phase A).
//
// Vedic health framework applied here:
//   Lagna / 1st house : Constitution, body, vitality
//   6th house         : Disease, immunity, recovery
//   8th house         : Chronic conditions, surgery, longevity
//   Sun               : Vitality, heart, constitution
//   Moon              : Mental health, digestion, blood
//   Mars              : Immunity, blood, inflammation
//   Saturn            : Chronic disease, bones, longevity
//   Lagna lord        : Overall health indicator
//
// Malefics used throughout: Saturn, Mars, Rahu, Ketu, Sun (mild malefic).

const MALEFICS: PlanetName[] = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];

export const HEALTH_RULES: InferenceRule[] = [

  // ── 1. Lagna lord strong → strong constitution ───────────────────────────
  {
    id: "health-lagna-lord-strong",
    domain: "Health",
    priority: 1,
    test: (_ctx, sym) => sym.strengthOfHouseLord(1) >= 65,
    conclude: (_ctx, sym): DraftConclusion => {
      const lord     = sym.lordOf(1)!;
      const strength = sym.strengthOfHouseLord(1);
      return {
        id:       "health-lagna-lord-strong",
        domain:   "Health",
        statement: `Lagna lord ${lord} is strong (${strength}/100) — robust constitutional vitality and physical resilience`,
        confidence:  strength,
        probability: Math.round(strength * 0.85),
        direction:   "Positive",
        timing:      "Natal",
        supportingEvidence: [`${lord} (lagna lord) strength ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_VITALITY", "HEALTH_CONSTITUTION"],
        planets:     [lord],
      };
    },
  },

  // ── 2. Lagna lord weak → constitutional vulnerability ────────────────────
  {
    id: "health-lagna-lord-weak",
    domain: "Health",
    priority: 2,
    test: (_ctx, sym) => sym.strengthOfHouseLord(1) < 35,
    conclude: (_ctx, sym): DraftConclusion => {
      const lord     = sym.lordOf(1)!;
      const strength = sym.strengthOfHouseLord(1);
      return {
        id:       "health-lagna-lord-weak",
        domain:   "Health",
        statement: `Lagna lord ${lord} is weak (${strength}/100) — constitutional vulnerability; deliberate lifestyle support is beneficial`,
        confidence:  100 - strength,
        probability: Math.round((100 - strength) * 0.75),
        direction:   "Negative",
        timing:      "Natal",
        supportingEvidence: [`${lord} (lagna lord) strength ${strength}/100 — below constitutional threshold`],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_VULNERABILITY", "HEALTH_CONSTITUTION"],
        planets:     [lord],
      };
    },
  },

  // ── 3. Sun strong → vitality and cardiac strength ─────────────────────────
  {
    id: "health-sun-strong",
    domain: "Health",
    priority: 3,
    test: (_ctx, sym) => sym.strengthOf("Sun") >= 65,
    conclude: (_ctx, sym): DraftConclusion => {
      const strength = sym.strengthOf("Sun");
      return {
        id:       "health-sun-strong",
        domain:   "Health",
        statement: `Sun is strong (${strength}/100) — vitality, energy, and constitutional resilience are well-supported`,
        confidence:  strength,
        probability: Math.round(strength * 0.82),
        direction:   "Positive",
        timing:      "Natal",
        supportingEvidence: [`Sun strength ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_VITALITY"],
        planets:     ["Sun"],
      };
    },
  },

  // ── 4. Moon afflicted → mental health and digestive concerns ─────────────
  {
    id: "health-moon-afflicted",
    domain: "Health",
    priority: 4,
    test: (ctx, sym) => {
      const moonStrength = sym.strengthOf("Moon");
      if (moonStrength < 40) return true;
      const moonPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Moon");
      if (!moonPlacement) return false;
      const afflictors: PlanetName[] = ["Rahu", "Saturn", "Ketu"];
      return afflictors.some(a => {
        const pl = ctx.chartSuite.D1.planets.find(p => p.planet === a);
        return pl && pl.house === moonPlacement.house;
      });
    },
    conclude: (ctx, sym): DraftConclusion => {
      const moonStrength  = sym.strengthOf("Moon");
      const moonPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Moon");
      const afflictors: PlanetName[] = ["Rahu", "Saturn", "Ketu"];
      const conjunctAfflictors = moonPlacement
        ? afflictors.filter(a => {
            const pl = ctx.chartSuite.D1.planets.find(p => p.planet === a);
            return pl && pl.house === moonPlacement.house;
          })
        : [];
      const evidence: string[] = [];
      if (moonStrength < 40) evidence.push(`Moon strength ${moonStrength}/100 — below mental health threshold`);
      if (conjunctAfflictors.length > 0) evidence.push(`${conjunctAfflictors.join(", ")} conjunct Moon in house ${moonPlacement?.house}`);
      const confidence = Math.min(95, Math.round(((100 - moonStrength) + conjunctAfflictors.length * 15) / (conjunctAfflictors.length > 0 ? 1.5 : 1)));
      return {
        id:       "health-moon-afflicted",
        domain:   "Health",
        statement: "Moon is afflicted — mental health resilience and digestive stability warrant additional support",
        confidence:  Math.min(95, confidence),
        probability: Math.round(Math.min(95, confidence) * 0.70),
        direction:   "Negative",
        timing:      "Natal",
        supportingEvidence: evidence,
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_MENTAL"],
        planets:     ["Moon", ...conjunctAfflictors],
      };
    },
  },

  // ── 5. Strong malefic in 6th → fighting-disease immunity ─────────────────
  //    A strong malefic in the house of disease is a double-edged indicator:
  //    it sustains disease energy but also activates aggressive immunity.
  {
    id: "health-6th-malefic-strong",
    domain: "Health",
    priority: 5,
    test: (ctx, sym) => {
      return MALEFICS.some(m => {
        const pl = ctx.chartSuite.D1.planets.find(p => p.planet === m);
        return pl && pl.house === 6 && sym.strengthOf(m) >= 55;
      });
    },
    conclude: (ctx, sym): DraftConclusion => {
      const planet = MALEFICS.find(m => {
        const pl = ctx.chartSuite.D1.planets.find(p => p.planet === m);
        return pl && pl.house === 6 && sym.strengthOf(m) >= 55;
      })!;
      const strength = sym.strengthOf(planet);
      return {
        id:       "health-6th-malefic-strong",
        domain:   "Health",
        statement: `${planet} (strong malefic at ${strength}/100) in 6th house — fighting-disease constitution; strong immunity under adversity, but ongoing disease activation`,
        confidence:  strength,
        probability: Math.round(strength * 0.75),
        direction:   "Mixed",
        timing:      "Natal",
        supportingEvidence: [
          `${planet} in 6th house (disease/immunity house), strength ${strength}/100`,
          "Strong malefic in dusthana activates disease resistance pattern",
        ],
        conflictingEvidence: [
          "6th house malefic also sustains disease energy — vigilance over chronic patterns advised",
        ],
        reasonCodes: ["HEALTH_IMMUNITY", "HEALTH_RECOVERY"],
        planets:     [planet],
      };
    },
  },

  // ── 6. Weak malefic in 8th → chronic vulnerability ───────────────────────
  {
    id: "health-8th-malefic-weak",
    domain: "Health",
    priority: 6,
    test: (ctx, sym) => {
      return MALEFICS.some(m => {
        const pl = ctx.chartSuite.D1.planets.find(p => p.planet === m);
        return pl && pl.house === 8 && sym.strengthOf(m) < 45;
      });
    },
    conclude: (ctx, sym): DraftConclusion => {
      const planet = MALEFICS.find(m => {
        const pl = ctx.chartSuite.D1.planets.find(p => p.planet === m);
        return pl && pl.house === 8 && sym.strengthOf(m) < 45;
      })!;
      const strength = sym.strengthOf(planet);
      return {
        id:       "health-8th-malefic-weak",
        domain:   "Health",
        statement: `${planet} (weak malefic at ${strength}/100) in 8th house — chronic vulnerability signals; longevity and surgical risk factors need monitoring`,
        confidence:  100 - strength,
        probability: Math.round((100 - strength) * 0.70),
        direction:   "Negative",
        timing:      "Natal",
        supportingEvidence: [
          `${planet} in 8th house (longevity/chronic house), strength ${strength}/100 — weakened functional support`,
          "Weak malefic in 8th reduces constitutional buffer against chronic conditions",
        ],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_CHRONIC", "HEALTH_VULNERABILITY"],
        planets:     [planet],
      };
    },
  },

  // ── 7. Mars strong → strong immunity and recovery capacity ───────────────
  {
    id: "health-mars-strong",
    domain: "Health",
    priority: 7,
    test: (_ctx, sym) => sym.strengthOf("Mars") >= 65,
    conclude: (_ctx, sym): DraftConclusion => {
      const strength = sym.strengthOf("Mars");
      return {
        id:       "health-mars-strong",
        domain:   "Health",
        statement: `Mars is strong (${strength}/100) — active immune system, strong blood quality, and rapid recovery capacity`,
        confidence:  strength,
        probability: Math.round(strength * 0.82),
        direction:   "Positive",
        timing:      "Natal",
        supportingEvidence: [`Mars strength ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_IMMUNITY", "HEALTH_RECOVERY"],
        planets:     ["Mars"],
      };
    },
  },

  // ── 8. Saturn in 8th → chronic conditions / longevity focus ─────────────
  {
    id: "health-saturn-8th",
    domain: "Health",
    priority: 8,
    test: (ctx) => {
      const saturn = ctx.chartSuite.D1.planets.find(p => p.planet === "Saturn");
      return !!saturn && saturn.house === 8;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const strength = sym.strengthOf("Saturn");
      return {
        id:       "health-saturn-8th",
        domain:   "Health",
        statement: "Saturn in 8th house — chronic conditions pattern and longevity discipline focus; structured preventive care is essential",
        confidence:  Math.round(50 + (strength - 50) * 0.4),
        probability: 60,
        direction:   "Mixed",
        timing:      "Natal",
        supportingEvidence: [
          `Saturn in 8th house (longevity/chronic house), strength ${strength}/100`,
          "Saturn's slow, structured energy in 8th creates long-term chronic patterns",
        ],
        conflictingEvidence: strength >= 60
          ? ["Strong Saturn in 8th can also indicate exceptional longevity through disciplined lifestyle"]
          : [],
        reasonCodes: ["HEALTH_LONGEVITY", "HEALTH_CHRONIC"],
        planets:     ["Saturn"],
      };
    },
  },

  // ── 9. Kemadruma pattern → mental isolation risk ─────────────────────────
  //    Moon with no planet in either adjacent house (2nd or 12th from Moon).
  {
    id: "health-kemadruma",
    domain: "Health",
    priority: 9,
    test: (ctx) => {
      const moonPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Moon");
      if (!moonPlacement) return false;
      const moonHouse   = moonPlacement.house;
      const prevHouse   = ((moonHouse - 2 + 12) % 12) + 1;
      const nextHouse   = (moonHouse % 12) + 1;
      const hasAdjacentPlanet = ctx.chartSuite.D1.planets.some(
        p => p.planet !== "Moon" && (p.house === prevHouse || p.house === nextHouse),
      );
      return !hasAdjacentPlanet;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const moonPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Moon")!;
      const moonHouse     = moonPlacement.house;
      const prevHouse     = ((moonHouse - 2 + 12) % 12) + 1;
      const nextHouse     = (moonHouse % 12) + 1;
      const moonStrength  = sym.strengthOf("Moon");
      return {
        id:       "health-kemadruma",
        domain:   "Health",
        statement: "Moon is isolated (Kemadruma pattern) — mental and emotional isolation risk; sustained mental wellness practices are recommended",
        confidence:  Math.round(65 - moonStrength * 0.2),
        probability: Math.round((65 - moonStrength * 0.2) * 0.70),
        direction:   "Negative",
        timing:      "Natal",
        supportingEvidence: [
          `Moon in house ${moonHouse} has no planet in house ${prevHouse} or house ${nextHouse}`,
          `Moon strength ${moonStrength}/100`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_MENTAL"],
        planets:     ["Moon"],
      };
    },
  },

  // ── 10. Benefic in lagna → protective constitution ────────────────────────
  {
    id: "health-benefic-lagna",
    domain: "Health",
    priority: 10,
    test: (ctx) => {
      const lagnaHouseOccupants = ctx.chartSuite.D1.planets
        .filter(p => p.house === 1)
        .map(p => p.planet);
      return lagnaHouseOccupants.includes("Jupiter") || lagnaHouseOccupants.includes("Venus");
    },
    conclude: (ctx, sym): DraftConclusion => {
      const beneficsInLagna = ctx.chartSuite.D1.planets
        .filter(p => p.house === 1 && (p.planet === "Jupiter" || p.planet === "Venus"))
        .map(p => p.planet);
      const strengths = beneficsInLagna.map(p => sym.strengthOf(p));
      const avgStrength = Math.round(strengths.reduce((s, v) => s + v, 0) / strengths.length);
      return {
        id:       "health-benefic-lagna",
        domain:   "Health",
        statement: `${beneficsInLagna.join(" and ")} in 1st house — benefic protection on constitution, enhanced longevity and recovery support`,
        confidence:  avgStrength,
        probability: Math.round(avgStrength * 0.85),
        direction:   "Positive",
        timing:      "Natal",
        supportingEvidence: beneficsInLagna.map(p => `${p} in lagna, strength ${sym.strengthOf(p)}/100`),
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_PROTECTIVE", "HEALTH_CONSTITUTION"],
        planets:     beneficsInLagna as PlanetName[],
      };
    },
  },
];
