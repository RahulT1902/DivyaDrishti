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
];
