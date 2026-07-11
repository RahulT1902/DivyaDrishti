import { AstrologyContext, DraftConclusion } from "../../types";
import { SymbolRegistry } from "../symbolRegistry";
import { InferenceRule } from "./general";

// Career inference rules.
// Each rule checks the context via SymbolRegistry and produces a conclusion
// that the Career Domain Engine (Step 5) can consume without re-doing any
// astrological logic.

export const CAREER_RULES: InferenceRule[] = [

  // ── Raj Yoga active → career authority ───────────────────────────────────
  {
    id: "career-raj-yoga-active",
    domain: "Career",
    priority: 10,
    test: (ctx, sym) => {
      const status = sym.yogaActivationStatus("raj-yoga");
      return status === "Active" || status === "Peak";
    },
    conclude: (ctx, sym): DraftConclusion => {
      const promise = ctx.yogaAnalysis.birthPromises.find(p => p.id === "raj-yoga");
      const activation = ctx.yogaAnalysis.activations.find(a => a.yogaId === "raj-yoga");
      const score = activation?.activationScore ?? 0;
      return {
        id: "career-raj-yoga-active",
        domain: "Career",
        statement: "Raj Yoga active — high professional authority, status, and recognition",
        confidence: score,
        probability: Math.round(score * 0.85),
        direction: "Positive",
        timing: "Current",
        supportingEvidence: [
          `Raj Yoga birth strength: ${promise?.birthStrength ?? 0}/100`,
          `Activation status: ${activation?.status}`,
          ...(promise?.evidence.map(e => e.description) ?? []),
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_AUTHORITY", "PROFESSIONAL_STATUS", "CAREER_RECOGNITION"],
        planets: promise?.supportingPlanets ?? [],
      };
    },
  },

  // ── 10th lord strong in Kendra/Trikona ───────────────────────────────────
  {
    id: "career-10th-lord-strong",
    domain: "Career",
    priority: 11,
    test: (ctx, sym) => {
      const s = sym.strengthOfHouseLord(10);
      const lord10 = ctx.chartSuite.D1.lords.find(l => l.house === 10);
      const inKendraTrikona = lord10
        ? [1, 4, 5, 7, 9, 10].includes(lord10.lordPlacedInHouse)
        : false;
      return s >= 65 && inKendraTrikona;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const lord10 = ctx.chartSuite.D1.lords.find(l => l.house === 10)!;
      const strength = sym.strengthOf(lord10.lord);
      return {
        id: "career-10th-lord-strong",
        domain: "Career",
        statement: `10th lord ${lord10.lord} is strong (${strength}/100) in a Kendra/Trikona — professional success and career fulfillment`,
        confidence: strength,
        probability: Math.round(strength * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `10th lord: ${lord10.lord}, strength: ${strength}/100`,
          `Placed in house: ${lord10.lordPlacedInHouse}`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_SUCCESS", "10TH_LORD_STRONG"],
        planets: [lord10.lord],
      };
    },
  },

  // ── Hamsa Yoga → wisdom/academic/advisory career ──────────────────────────
  {
    id: "career-hamsa-yoga",
    domain: "Career",
    priority: 12,
    test: (ctx, sym) => {
      const status = sym.yogaActivationStatus("hamsa");
      return status !== "Dormant";
    },
    conclude: (ctx, sym): DraftConclusion => {
      const promise = ctx.yogaAnalysis.birthPromises.find(p => p.id === "hamsa");
      const score = promise?.birthStrength ?? 0;
      return {
        id: "career-hamsa-yoga",
        domain: "Career",
        statement: "Hamsa Yoga present — exceptional career in teaching, counseling, spiritual guidance, or wisdom professions",
        confidence: score,
        probability: Math.round(score * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Hamsa Yoga birth strength: ${score}/100`,
          "Jupiter in own/exaltation sign in a Kendra",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_WISDOM", "CAREER_TEACHING", "CAREER_ADVISORY"],
        planets: ["Jupiter"],
      };
    },
  },

  // ── Ruchaka Yoga → physical/martial/entrepreneurial career ───────────────
  {
    id: "career-ruchaka-yoga",
    domain: "Career",
    priority: 13,
    test: (ctx, sym) => sym.yogaActivationStatus("ruchaka") !== "Dormant",
    conclude: (ctx, sym): DraftConclusion => {
      const promise = ctx.yogaAnalysis.birthPromises.find(p => p.id === "ruchaka");
      const score = promise?.birthStrength ?? 0;
      return {
        id: "career-ruchaka-yoga",
        domain: "Career",
        statement: "Ruchaka Yoga present — strong aptitude for military, sports, engineering, surgery, or entrepreneurship",
        confidence: score,
        probability: Math.round(score * 0.78),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [`Ruchaka Yoga birth strength: ${score}/100`, "Mars in own/exaltation sign in a Kendra"],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_PHYSICAL", "CAREER_MARTIAL", "CAREER_LEADERSHIP"],
        planets: ["Mars"],
      };
    },
  },

  // ── Sasa Yoga → government/administrative/structured career ──────────────
  {
    id: "career-sasa-yoga",
    domain: "Career",
    priority: 14,
    test: (ctx, sym) => sym.yogaActivationStatus("sasa") !== "Dormant",
    conclude: (ctx, sym): DraftConclusion => {
      const promise = ctx.yogaAnalysis.birthPromises.find(p => p.id === "sasa");
      const score = promise?.birthStrength ?? 0;
      return {
        id: "career-sasa-yoga",
        domain: "Career",
        statement: "Sasa Yoga present — career in government, law, real estate, or disciplined structured professions",
        confidence: score,
        probability: Math.round(score * 0.78),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [`Sasa Yoga birth strength: ${score}/100`, "Saturn in own/exaltation sign in a Kendra"],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_GOVERNMENT", "CAREER_DISCIPLINE", "CAREER_AUTHORITY"],
        planets: ["Saturn"],
      };
    },
  },

  // ── 10th lord weak/debilitated → career challenges ───────────────────────
  {
    id: "career-10th-lord-weak",
    domain: "Career",
    priority: 20,
    test: (ctx, sym) => sym.strengthOfHouseLord(10) < 35,
    conclude: (ctx, sym): DraftConclusion => {
      const lord10 = ctx.chartSuite.D1.lords.find(l => l.house === 10)!;
      const strength = sym.strengthOf(lord10.lord);
      return {
        id: "career-10th-lord-weak",
        domain: "Career",
        statement: `10th lord ${lord10.lord} is weak (${strength}/100) — career direction requires sustained effort; early struggles possible`,
        confidence: 100 - strength,
        probability: Math.round((100 - strength) * 0.65),
        direction: "Negative",
        timing: "Natal",
        supportingEvidence: [
          `10th lord ${lord10.lord} strength: ${strength}/100`,
          `Placed in house: ${lord10.lordPlacedInHouse}`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_CHALLENGES", "10TH_LORD_WEAK"],
        planets: [lord10.lord],
      };
    },
  },

  // ── Sun strong in 10th or 1st → leadership role ──────────────────────────
  {
    id: "career-sun-leadership",
    domain: "Career",
    priority: 15,
    test: (ctx, sym) => {
      const sunPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Sun");
      const sunStrength  = sym.strengthOf("Sun");
      return !!sunPlacement && [1, 10].includes(sunPlacement.house) && sunStrength >= 60;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const sunPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Sun")!;
      const strength     = sym.strengthOf("Sun");
      return {
        id: "career-sun-leadership",
        domain: "Career",
        statement: `Sun in ${sunPlacement.house}th house with strength ${strength}/100 — leadership, management, and public authority`,
        confidence: strength,
        probability: Math.round(strength * 0.75),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Sun in house ${sunPlacement.house}, strength: ${strength}/100`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_LEADERSHIP", "MANAGEMENT_APTITUDE"],
        planets: ["Sun"],
      };
    },
  },

  // ── Neecha Bhanga + career planets → late but powerful success ────────────
  {
    id: "career-neecha-bhanga",
    domain: "Career",
    priority: 16,
    test: (ctx, sym) => {
      const status = sym.yogaActivationStatus("neecha-bhanga");
      const careerPlanets = [sym.lordOf(10), sym.lordOf(1)].filter(Boolean) as string[];
      const neechaYoga = ctx.yogaAnalysis.birthPromises.find(p => p.id === "neecha-bhanga");
      return status !== "Dormant" && !!neechaYoga &&
        neechaYoga.supportingPlanets.some(p => careerPlanets.includes(p));
    },
    conclude: (ctx, sym): DraftConclusion => {
      const promise = ctx.yogaAnalysis.birthPromises.find(p => p.id === "neecha-bhanga")!;
      const score   = promise.birthStrength;
      return {
        id: "career-neecha-bhanga",
        domain: "Career",
        statement: "Neecha Bhanga affects career planets — struggle followed by a powerful rise; late-blooming career",
        confidence: score,
        probability: Math.round(score * 0.72),
        direction: "Mixed",
        timing: "Natal",
        supportingEvidence: [
          `Neecha Bhanga involving ${promise.supportingPlanets.join(", ")}`,
          "Career planet debilitation is cancelled — weakness converts to resilience",
        ],
        conflictingEvidence: [
          "Early career period may involve significant obstacles",
        ],
        reasonCodes: ["CAREER_LATE_RISE", "CAREER_STRUGGLE_THEN_SUCCESS"],
        planets: promise.supportingPlanets,
      };
    },
  },

  // ── D10: Lagna lord strong in D10 → career structurally well-supported ────
  {
    id: "career-d10-lagna-lord-strong",
    domain: "Career",
    priority: 17,
    test: (ctx, sym) => sym.hasD10() && sym.d10StrengthOfHouseLord(1) >= 60,
    conclude: (ctx, sym): DraftConclusion => {
      const lord = sym.d10LordOf(1);
      const strength = sym.d10StrengthOfHouseLord(1);
      const fromD10 = sym.hasD10Strengths();
      return {
        id: "career-d10-lagna-lord-strong",
        domain: "Career",
        statement: `D10 lagna lord ${lord ?? "unknown"} is strong (${strength}/100) — career identity and professional personality well-supported`,
        confidence: strength,
        probability: Math.round(strength * 0.82),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `D10 lagna lord strength: ${strength}/100 (${fromD10 ? "D10 Shadbala" : "D1 strength proxy"})`,
          "Strong D10 lagna = professional identity is a natural expression of core character",
        ],
        conflictingEvidence: [],
        reasonCodes: ["D10_LAGNA_LORD_STRONG", "CAREER_AUTHORITY"],
        planets: lord ? [lord] : [],
      };
    },
  },

  // ── D10: 10th lord strong in D10 → strong career vocation signal ──────────
  {
    id: "career-d10-10th-lord-strong",
    domain: "Career",
    priority: 18,
    test: (ctx, sym) => {
      if (!sym.hasD10()) return false;
      const str = sym.d10StrengthOfHouseLord(10);
      const placedHouse = sym.d10LordPlacedInHouse(10);
      return str >= 60 && !!placedHouse && [1, 4, 5, 7, 9, 10].includes(placedHouse);
    },
    conclude: (ctx, sym): DraftConclusion => {
      const lord = sym.d10LordOf(10);
      const strength = sym.d10StrengthOfHouseLord(10);
      const placed = sym.d10LordPlacedInHouse(10);
      const fromD10 = sym.hasD10Strengths();
      return {
        id: "career-d10-10th-lord-strong",
        domain: "Career",
        statement: `D10 10th lord ${lord ?? "unknown"} strong in D10 Kendra/Trikona (house ${placed ?? "?"}) — powerful career vocation and professional trajectory`,
        confidence: strength,
        probability: Math.round(strength * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `D10 10th lord ${lord}: ${strength}/100 (${fromD10 ? "D10 Shadbala" : "D1 proxy"})`,
          `Placed in D10 house ${placed} (Kendra/Trikona) — vocation has structural support`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["D10_10TH_LORD_STRONG", "CAREER_SUCCESS", "PROFESSIONAL_STATUS"],
        planets: lord ? [lord] : [],
      };
    },
  },

  // ── D10: Sun in D10 Kendra → authority and public recognition via career ──
  {
    id: "career-d10-sun-prominent",
    domain: "Career",
    priority: 19,
    test: (ctx, sym) => {
      if (!sym.hasD10()) return false;
      return sym.d10PlanetInKendraTrikona("Sun") && sym.d10StrengthOf("Sun") >= 55;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const house = sym.d10PlanetHouse("Sun");
      const strength = sym.d10StrengthOf("Sun");
      const fromD10 = sym.hasD10Strengths();
      return {
        id: "career-d10-sun-prominent",
        domain: "Career",
        statement: `Sun in D10 house ${house ?? "?"} (Kendra/Trikona) with strength ${strength}/100 — authority, recognition, and leadership in professional life`,
        confidence: strength,
        probability: Math.round(strength * 0.78),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Sun in D10 house ${house} — authority and recognition through career`,
          `Sun D10 strength: ${strength}/100 (${fromD10 ? "D10 Shadbala" : "D1 proxy"})`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["D10_SUN_PROMINENT", "CAREER_RECOGNITION", "CAREER_AUTHORITY"],
        planets: ["Sun"],
      };
    },
  },

  // ── D10: Saturn strong in D10 → disciplined service career ───────────────
  {
    id: "career-d10-saturn-career",
    domain: "Career",
    priority: 21,
    test: (ctx, sym) => {
      if (!sym.hasD10()) return false;
      return sym.d10PlanetInKendraTrikona("Saturn") && sym.d10StrengthOf("Saturn") >= 55;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const house = sym.d10PlanetHouse("Saturn");
      const strength = sym.d10StrengthOf("Saturn");
      return {
        id: "career-d10-saturn-career",
        domain: "Career",
        statement: `Saturn prominent in D10 (house ${house}, strength ${strength}/100) — disciplined, structured career with strong service ethic; late but enduring success`,
        confidence: strength,
        probability: Math.round(strength * 0.82),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Saturn in D10 Kendra/Trikona: house ${house}, strength ${strength}/100`,
          "Saturn prominence in D10 = career built through sustained disciplined effort",
        ],
        conflictingEvidence: [],
        reasonCodes: ["D10_SATURN_CAREER", "CAREER_DISCIPLINE", "CAREER_GOVERNMENT"],
        planets: ["Saturn"],
      };
    },
  },

  // ── D10: 10th house afflicted → career obstacles ─────────────────────────
  {
    id: "career-d10-10th-afflicted",
    domain: "Career",
    priority: 22,
    test: (ctx, sym) => {
      if (!sym.hasD10()) return false;
      const d10 = ctx.chartSuite.D10;
      const malefics: string[] = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
      const tenthHousePlanets = d10?.planets.filter(p => p.house === 10) ?? [];
      const hasMaleficIn10th = tenthHousePlanets.some(p => malefics.includes(p.planet));
      const beneficAspect = d10?.aspects.some(a =>
        ["Jupiter", "Venus", "Mercury", "Moon"].includes(a.fromPlanet) &&
        a.toHouse === 10,
      ) ?? false;
      return hasMaleficIn10th && !beneficAspect;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const d10 = ctx.chartSuite.D10;
      const malefics: string[] = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
      const afflicting = (d10?.planets.filter(p => p.house === 10 && malefics.includes(p.planet)) ?? [])
        .map(p => p.planet);
      return {
        id: "career-d10-10th-afflicted",
        domain: "Career",
        statement: `D10 10th house afflicted by ${afflicting.join(", ")} without benefic relief — career obstacles, authority conflicts, or delayed professional recognition`,
        confidence: Math.min(90, afflicting.length * 30),
        probability: Math.round(Math.min(90, afflicting.length * 30) * 0.70),
        direction: "Negative",
        timing: "Natal",
        supportingEvidence: [
          `D10 10th house contains: ${afflicting.join(", ")}`,
          "No benefic aspect to D10 10th — obstacles lack relief",
        ],
        conflictingEvidence: [],
        reasonCodes: ["D10_10TH_AFFLICTED", "CAREER_CHALLENGES"],
        planets: afflicting as import("../../types").PlanetName[],
      };
    },
  },
];
