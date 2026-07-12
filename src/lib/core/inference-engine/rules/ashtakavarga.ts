import { AstrologyContext, DraftConclusion } from "../../types";
import { SymbolRegistry } from "../symbolRegistry";
import { InferenceRule } from "./general";

// Ashtakavarga inference rules.
// These rules query the Binna and Sarva Ashtakavarga scores computed lazily
// inside SymbolRegistry.  They expose point-based strength/weakness signals
// that domain engines can consume without re-implementing the algorithm.

export const ASHTAKAVARGA_RULES: InferenceRule[] = [

  // ── Jupiter in high-sarva zone → wisdom and prosperity supported ──────────
  {
    id: "avk-jupiter-high-sarva",
    domain: "Wealth",
    priority: 50,
    test: (ctx, sym) => sym.sarvaAtPlanet("Jupiter") >= 30,
    conclude: (ctx, sym): DraftConclusion => {
      const sarva = sym.sarvaAtPlanet("Jupiter");
      const confidence = Math.min(100, Math.round(sarva * 1.5));
      return {
        id: "avk-jupiter-high-sarva",
        domain: "Wealth",
        statement: `Jupiter occupies a sign with Sarva Ashtakavarga score ${sarva}/56 — collective planetary support amplifies Jupiter's significations of wisdom, dharmic income, and prosperity`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Jupiter's natal sign has Sarva Ashtakavarga score ${sarva}/56 (threshold: ≥30)`,
          "High sarva bindhu in Jupiter's sign reduces friction around expansion, wealth, and spiritual growth",
          "Collective planetary harmony supports Jupiter's role as significator of fortune and wisdom",
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_FORTUNE", "CAREER_WISDOM", "OVERALL_POSITIVE"],
        planets: ["Jupiter"],
      };
    },
  },

  // ── Venus in high-binna sign → luxury, relationships, material gains ──────
  {
    id: "avk-venus-high-binna",
    domain: "Wealth",
    priority: 51,
    test: (ctx, sym) => sym.binnaAtPlanet("Venus") >= 5,
    conclude: (ctx, sym): DraftConclusion => {
      const binna = sym.binnaAtPlanet("Venus");
      const confidence = Math.min(100, binna * 10);
      return {
        id: "avk-venus-high-binna",
        domain: "Wealth",
        statement: `Venus in high-bindhu sign (Binna Ashtakavarga: ${binna}/8) — material comforts, luxury, and relationship harmony are astrologically well-supported`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Venus Binna Ashtakavarga in natal sign: ${binna}/8 (threshold: ≥5)`,
          "High Venus bindhu strengthens material comfort, aesthetic enjoyment, and partnership harmony",
          "Favorable for luxury goods, artistic income, marriage satisfaction, and sensory pleasures",
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_VENUS", "MARRIAGE_VENUS", "WEALTH_FORTUNE"],
        planets: ["Venus"],
      };
    },
  },

  // ── Sun in high-binna sign → vitality, recognition, authority ────────────
  {
    id: "avk-sun-high-binna",
    domain: "Career",
    priority: 52,
    test: (ctx, sym) => sym.binnaAtPlanet("Sun") >= 5,
    conclude: (ctx, sym): DraftConclusion => {
      const binna = sym.binnaAtPlanet("Sun");
      const confidence = Math.min(100, binna * 10);
      return {
        id: "avk-sun-high-binna",
        domain: "Career",
        statement: `Solar Ashtakavarga strong — Sun in high-bindhu sign (Binna: ${binna}/8); vitality, recognition, and authority flow with natural support`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Sun Binna Ashtakavarga in natal sign: ${binna}/8 (threshold: ≥5)`,
          "High Sun bindhu amplifies solar significations: constitutional vitality, public recognition, and administrative authority",
          "Favorable for government roles, leadership positions, and sustained prominence in the public eye",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_AUTHORITY", "CAREER_RECOGNITION", "HEALTH_VITALITY"],
        planets: ["Sun"],
      };
    },
  },

  // ── Moon in high-binna sign → mental clarity, prosperity, emotional support
  {
    id: "avk-moon-high-binna",
    domain: "General",
    priority: 53,
    test: (ctx, sym) => sym.binnaAtPlanet("Moon") >= 5,
    conclude: (ctx, sym): DraftConclusion => {
      const binna = sym.binnaAtPlanet("Moon");
      const confidence = Math.min(100, binna * 10);
      return {
        id: "avk-moon-high-binna",
        domain: "General",
        statement: `Lunar Ashtakavarga strong — Moon in high-bindhu sign (Binna: ${binna}/8); mental clarity, prosperity, and emotional stability are well-indicated`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Moon Binna Ashtakavarga in natal sign: ${binna}/8 (threshold: ≥5)`,
          "High Moon bindhu supports emotional equilibrium, mental clarity, and public popularity",
          "Favorable for wealth through fluid assets, strong maternal bond, and social-emotional resilience",
        ],
        conflictingEvidence: [],
        reasonCodes: ["OVERALL_POSITIVE", "WEALTH_FORTUNE", "VITALITY_HIGH"],
        planets: ["Moon"],
      };
    },
  },

  // ── Saturn in low-sarva zone → Saturn's challenges amplified ─────────────
  {
    id: "avk-saturn-low-sarva",
    domain: "General",
    priority: 54,
    test: (ctx, sym) => sym.sarvaAtPlanet("Saturn") <= 22,
    conclude: (ctx, sym): DraftConclusion => {
      const sarva = sym.sarvaAtPlanet("Saturn");
      // Confidence rises as sarva falls below 22 — more pronounced at lower scores
      const confidence = Math.min(100, Math.round((25 - sarva) * 3));
      return {
        id: "avk-saturn-low-sarva",
        domain: "General",
        statement: `Saturn occupies a low-bindhu zone (Sarva Ashtakavarga: ${sarva}/56) — Saturn's restrictive and karmic significations are amplified; delays and structural obstacles more pronounced than usual`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Negative",
        timing: "Natal",
        supportingEvidence: [
          `Saturn's natal sign has Sarva Ashtakavarga score ${sarva}/56 (threshold: ≤22)`,
          "Low bindhu in Saturn's sign reduces collective planetary support, intensifying delays and karmic friction",
          "Saturn's natural malefic qualities face reduced counterbalance from other planetary energies",
        ],
        conflictingEvidence: [],
        reasonCodes: ["OVERALL_NEGATIVE", "CAREER_CHALLENGES"],
        planets: ["Saturn"],
      };
    },
  },

  // ── Mars in high-binna sign → energy, immunity, achievement drive ─────────
  {
    id: "avk-mars-high-binna",
    domain: "Health",
    priority: 55,
    test: (ctx, sym) => sym.binnaAtPlanet("Mars") >= 5,
    conclude: (ctx, sym): DraftConclusion => {
      const binna = sym.binnaAtPlanet("Mars");
      const confidence = Math.min(100, binna * 10);
      return {
        id: "avk-mars-high-binna",
        domain: "Health",
        statement: `Mars in high-bindhu sign (Binna Ashtakavarga: ${binna}/8) — physical energy, immune resilience, and achievement drive are astrologically supported`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Mars Binna Ashtakavarga in natal sign: ${binna}/8 (threshold: ≥5)`,
          "High Mars bindhu amplifies physical vitality, immune system strength, and competitive drive",
          "Favorable for athletic performance, surgical resilience, and determined goal achievement",
        ],
        conflictingEvidence: [],
        reasonCodes: ["HEALTH_VITALITY", "HEALTH_IMMUNITY", "CAREER_PHYSICAL"],
        planets: ["Mars"],
      };
    },
  },

];
