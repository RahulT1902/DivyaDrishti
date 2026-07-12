import { AstrologyContext, DraftConclusion, PlanetName } from "../../types";
import { SymbolRegistry } from "../symbolRegistry";
import { InferenceRule } from "./general";

// Marriage inference rules.
// Each rule checks the context via SymbolRegistry and produces a conclusion
// that the Marriage Domain Engine can consume without re-doing any
// astrological logic.
//
// Key marriage indicators:
//   7th house — primary marriage house
//   Venus     — karaka (significator) of marriage and romance
//   Jupiter   — protector; aspect on 7th = auspicious influence
//   D9        — Navamsa chart; marriage quality indicator
//   2nd house — family life and marital happiness
//   Moon      — emotional satisfaction in marriage

export const MARRIAGE_RULES: InferenceRule[] = [

  // ── 7th lord strong → high marriage potential ────────────────────────────
  {
    id: "marriage-7th-lord-strong",
    domain: "Marriage",
    priority: 1,
    test: (_ctx, sym) => sym.strengthOfHouseLord(7) >= 65,
    conclude: (ctx, sym): DraftConclusion => {
      const lord7    = sym.lordOf(7)!;
      const strength = sym.strengthOf(lord7);
      return {
        id:        "marriage-7th-lord-strong",
        domain:    "Marriage",
        statement: `7th lord ${lord7} is strong (${strength}/100) — high marriage potential and quality partnership`,
        confidence:          strength,
        probability:         Math.round(strength * 0.85),
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  [`7th lord: ${lord7}, strength: ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_POTENTIAL", "MARRIAGE_HARMONY"],
        planets:             [lord7],
      };
    },
  },

  // ── 7th lord weak → delayed or challenged marriage ───────────────────────
  {
    id: "marriage-7th-lord-weak",
    domain: "Marriage",
    priority: 2,
    test: (_ctx, sym) => sym.strengthOfHouseLord(7) < 35,
    conclude: (ctx, sym): DraftConclusion => {
      const lord7    = sym.lordOf(7)!;
      const strength = sym.strengthOf(lord7);
      return {
        id:        "marriage-7th-lord-weak",
        domain:    "Marriage",
        statement: `7th lord ${lord7} is weak (${strength}/100) — delayed or challenged marriage`,
        confidence:          100 - strength,
        probability:         Math.round((100 - strength) * 0.75),
        direction:           "Negative",
        timing:              "Natal",
        supportingEvidence:  [
          `7th lord: ${lord7}, strength: ${strength}/100 — below minimum threshold for reliable marriage timing`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_DELAY"],
        planets:             [lord7],
      };
    },
  },

  // ── Venus strong → romantic fulfillment ──────────────────────────────────
  {
    id: "marriage-venus-strong",
    domain: "Marriage",
    priority: 3,
    test: (_ctx, sym) => sym.strengthOf("Venus") >= 65,
    conclude: (_ctx, sym): DraftConclusion => {
      const strength = sym.strengthOf("Venus");
      return {
        id:        "marriage-venus-strong",
        domain:    "Marriage",
        statement: `Venus is strong (${strength}/100) — romantic fulfillment and deep marital harmony`,
        confidence:          strength,
        probability:         Math.round(strength * 0.85),
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  [`Venus (marriage karaka) strength: ${strength}/100`],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_VENUS", "MARRIAGE_HARMONY"],
        planets:             ["Venus"],
      };
    },
  },

  // ── Jupiter aspects or occupies 7th house → benefic marriage influence ───
  // Jupiter aspects 7th from: house 1 (7th aspect), house 3 (5th aspect = not 7th),
  // house 7 itself (conjunction), house 11 (9th aspect).
  // Simplified: Jupiter in house 1 aspects 7th (universal 7th aspect); Jupiter in 7th itself.
  // Formula: (jupiterHouse + 6 - 1) % 12 + 1 === 7 means jupiterHouse === 1.
  // Also capture Jupiter in house 7 itself.
  {
    id: "marriage-jupiter-7th-aspect",
    domain: "Marriage",
    priority: 4,
    test: (ctx, _sym) => {
      const jup = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter");
      if (!jup) return false;
      const h = jup.house;
      // Jupiter in house 7 (direct placement) or house 1 (universal 7th aspect from lagna)
      return h === 7 || ((h + 6 - 1) % 12 + 1) === 7;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const jup      = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter")!;
      const strength = sym.strengthOf("Jupiter");
      return {
        id:        "marriage-jupiter-7th-aspect",
        domain:    "Marriage",
        statement: `Jupiter from house ${jup.house} influences the 7th house — benefic and protective marriage environment`,
        confidence:          strength,
        probability:         Math.round(strength * 0.80),
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  [
          `Jupiter in house ${jup.house} casts its protective influence on the 7th house`,
          `Jupiter strength: ${strength}/100`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_JUPITER", "MARRIAGE_HARMONY"],
        planets:             ["Jupiter"],
      };
    },
  },

  // ── Natural benefics in 7th house → favorable marriage environment ────────
  {
    id: "marriage-benefics-7th",
    domain: "Marriage",
    priority: 5,
    test: (ctx, _sym) => {
      const in7th = ctx.chartSuite.D1.planets.filter(p => p.house === 7);
      return in7th.some(p =>
        p.planet === "Jupiter" ||
        p.planet === "Venus"   ||
        (p.planet === "Moon" && !p.isCombust),
      );
    },
    conclude: (ctx, _sym): DraftConclusion => {
      const beneficsIn7th = ctx.chartSuite.D1.planets.filter(p =>
        p.house === 7 && (
          p.planet === "Jupiter" ||
          p.planet === "Venus"   ||
          (p.planet === "Moon" && !p.isCombust)
        ),
      );
      const names = beneficsIn7th.map(p => p.planet);
      return {
        id:        "marriage-benefics-7th",
        domain:    "Marriage",
        statement: `Natural benefic(s) ${names.join(", ")} in 7th house — favorable marriage environment and partner quality`,
        confidence:          72,
        probability:         62,
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  names.map(n => `${n} placed in 7th house`),
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_HARMONY", "MARRIAGE_JUPITER", "MARRIAGE_VENUS"],
        planets:             beneficsIn7th.map(p => p.planet),
      };
    },
  },

  // ── Saturn in 7th house → delayed or karmic marriage ────────────────────
  {
    id: "marriage-saturn-7th",
    domain: "Marriage",
    priority: 6,
    test: (ctx, _sym) => {
      const sat = ctx.chartSuite.D1.planets.find(p => p.planet === "Saturn");
      return !!sat && sat.house === 7;
    },
    conclude: (_ctx, _sym): DraftConclusion => ({
      id:        "marriage-saturn-7th",
      domain:    "Marriage",
      statement: "Saturn in 7th house — delayed or karmic marriage; partner may be older, serious, or come with responsibilities",
      confidence:          70,
      probability:         60,
      direction:           "Mixed",
      timing:              "Natal",
      supportingEvidence:  [
        "Saturn placed in 7th house — karmic lessons and structural delays in partnerships",
      ],
      conflictingEvidence: [
        "Saturn also confers longevity and durability to established marriages",
      ],
      reasonCodes: ["MARRIAGE_DELAY", "MARRIAGE_KARMA"],
      planets:             ["Saturn"],
    }),
  },

  // ── Rahu in 7th house → unconventional or foreign marriage ──────────────
  {
    id: "marriage-rahu-7th",
    domain: "Marriage",
    priority: 7,
    test: (ctx, _sym) => {
      const rahu = ctx.chartSuite.D1.planets.find(p => p.planet === "Rahu");
      return !!rahu && rahu.house === 7;
    },
    conclude: (_ctx, _sym): DraftConclusion => ({
      id:        "marriage-rahu-7th",
      domain:    "Marriage",
      statement: "Rahu in 7th house — unconventional, intercultural, or foreign marriage; intense initial attraction",
      confidence:          68,
      probability:         58,
      direction:           "Mixed",
      timing:              "Natal",
      supportingEvidence:  [
        "Rahu placed in 7th house — non-traditional partnership patterns and amplified desires",
      ],
      conflictingEvidence: [
        "Rahu can introduce instability or illusion in relationships; clarity before commitment is essential",
      ],
      reasonCodes: ["MARRIAGE_KARMA", "MARRIAGE_POTENTIAL"],
      planets:             ["Rahu"],
    }),
  },

  // ── 7th lord in D9 kendra or trikona → marriage quality favorable ────────
  {
    id: "marriage-d9-7th-kendra",
    domain: "Marriage",
    priority: 8,
    test: (ctx, sym) => {
      const lord7 = sym.lordOf(7);
      if (!lord7) return false;
      const d9Placement = ctx.chartSuite.D9?.planets?.find(p => p.planet === lord7);
      if (!d9Placement) return false;
      return [1, 4, 5, 7, 9, 10].includes(d9Placement.house);
    },
    conclude: (ctx, sym): DraftConclusion => {
      const lord7    = sym.lordOf(7)!;
      const d9House  = ctx.chartSuite.D9?.planets?.find(p => p.planet === lord7)?.house ?? 0;
      const strength = sym.strengthOf(lord7);
      return {
        id:        "marriage-d9-7th-kendra",
        domain:    "Marriage",
        statement: `7th lord ${lord7} in D9 house ${d9House} (kendra/trikona) — marriage quality strengthened in Navamsa`,
        confidence:          Math.round(strength * 0.85),
        probability:         Math.round(strength * 0.75),
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  [
          `${lord7} (7th lord) placed in D9 house ${d9House} — kendra/trikona position in Navamsa`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_D9", "MARRIAGE_POTENTIAL"],
        planets:             [lord7],
      };
    },
  },

  // ── Venus in favorable D9 house → deep romantic fulfillment ─────────────
  {
    id: "marriage-venus-d9-strong",
    domain: "Marriage",
    priority: 9,
    test: (ctx, _sym) => {
      const venusD9 = ctx.chartSuite.D9?.planets?.find(p => p.planet === "Venus");
      if (!venusD9) return false;
      return [2, 4, 5, 7, 9, 10].includes(venusD9.house);
    },
    conclude: (ctx, sym): DraftConclusion => {
      const d9House  = ctx.chartSuite.D9?.planets?.find(p => p.planet === "Venus")?.house ?? 0;
      const strength = sym.strengthOf("Venus");
      return {
        id:        "marriage-venus-d9-strong",
        domain:    "Marriage",
        statement: `Venus in D9 house ${d9House} — favorable Navamsa position for deep romantic fulfillment`,
        confidence:          Math.round(strength * 0.90),
        probability:         Math.round(strength * 0.80),
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  [
          `Venus placed in D9 house ${d9House} — auspicious Navamsa position`,
          `Venus (D1) strength: ${strength}/100`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_VENUS", "MARRIAGE_D9", "RELATIONSHIP_HARMONY"],
        planets:             ["Venus"],
      };
    },
  },

  // ── 5th lord and 7th lord conjunct → love marriage potential ────────────
  {
    id: "marriage-5-7-lord-connection",
    domain: "Marriage",
    priority: 10,
    test: (ctx, sym) => {
      const lord5 = sym.lordOf(5);
      const lord7 = sym.lordOf(7);
      if (!lord5 || !lord7 || lord5 === lord7) return false;
      const p5 = ctx.chartSuite.D1.planets.find(p => p.planet === lord5);
      const p7 = ctx.chartSuite.D1.planets.find(p => p.planet === lord7);
      return !!p5 && !!p7 && p5.house === p7.house;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const lord5        = sym.lordOf(5)!;
      const lord7        = sym.lordOf(7)!;
      const sharedHouse  = ctx.chartSuite.D1.planets.find(p => p.planet === lord5)?.house ?? 0;
      const avgStrength  = Math.round((sym.strengthOf(lord5) + sym.strengthOf(lord7)) / 2);
      return {
        id:        "marriage-5-7-lord-connection",
        domain:    "Marriage",
        statement: `5th lord ${lord5} and 7th lord ${lord7} conjunct in house ${sharedHouse} — love marriage potential`,
        confidence:          avgStrength,
        probability:         Math.round(avgStrength * 0.80),
        direction:           "Positive",
        timing:              "Natal",
        supportingEvidence:  [
          `5th lord (${lord5}) and 7th lord (${lord7}) occupy the same house (${sharedHouse})`,
          `Average lord strength: ${avgStrength}/100`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["MARRIAGE_LOVE", "MARRIAGE_POTENTIAL", "RELATIONSHIP_HARMONY"],
        planets:             [lord5, lord7] as PlanetName[],
      };
    },
  },

];
