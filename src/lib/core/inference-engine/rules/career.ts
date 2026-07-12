import { AstrologyContext, DraftConclusion, PlanetName } from "../../types";
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

  // ── Sun strong in 10th house → solar authority / government / recognition ──
  {
    id: "career-sun-10th-authority",
    domain: "Career",
    priority: 23,
    test: (ctx, sym) => {
      const sunPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Sun");
      return !!sunPlacement && sunPlacement.house === 10 && sym.strengthOf("Sun") >= 65;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const strength = sym.strengthOf("Sun");
      return {
        id: "career-sun-10th-authority",
        domain: "Career",
        statement: `Sun in 10th house with strength ${strength}/100 — solar authority in career: recognition, leadership, and government roles`,
        confidence: strength,
        probability: Math.round(strength * 0.82),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Sun in 10th house (karma bhava), strength ${strength}/100`,
          "Sun in 10th bestows public recognition, administrative authority, and career prominence",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_AUTHORITY", "SUN_10TH"],
        planets: ["Sun"],
      };
    },
  },

  // ── Mercury strong in kendra → communication / intellectual career ─────────
  {
    id: "career-mercury-intellectual",
    domain: "Career",
    priority: 24,
    test: (ctx, sym) => {
      const mercuryPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Mercury");
      return (
        !!mercuryPlacement &&
        [1, 4, 7, 10].includes(mercuryPlacement.house) &&
        sym.strengthOf("Mercury") >= 60
      );
    },
    conclude: (ctx, sym): DraftConclusion => {
      const mercuryPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Mercury")!;
      const strength = sym.strengthOf("Mercury");
      return {
        id: "career-mercury-intellectual",
        domain: "Career",
        statement: `Mercury in kendra (house ${mercuryPlacement.house}) with strength ${strength}/100 — communication and intellectual career favored`,
        confidence: strength,
        probability: Math.round(strength * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Mercury in kendra house ${mercuryPlacement.house}, strength ${strength}/100`,
          "Mercury in angular house amplifies analytical, writing, teaching, and communication career paths",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_COMMUNICATION", "INTELLECTUAL_APTITUDE"],
        planets: ["Mercury"],
      };
    },
  },

  // ── Jupiter in 9th or 11th, strong → advisory / teaching / wisdom career ───
  {
    id: "career-jupiter-advisory",
    domain: "Career",
    priority: 25,
    test: (ctx, sym) => {
      const jupiterPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter");
      return (
        !!jupiterPlacement &&
        [9, 11].includes(jupiterPlacement.house) &&
        sym.strengthOf("Jupiter") >= 60
      );
    },
    conclude: (ctx, sym): DraftConclusion => {
      const jupiterPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter")!;
      const strength = sym.strengthOf("Jupiter");
      const houseLabel = jupiterPlacement.house === 9 ? "dharma (9th)" : "gains (11th)";
      return {
        id: "career-jupiter-advisory",
        domain: "Career",
        statement: `Jupiter in ${houseLabel} house with strength ${strength}/100 — advisory, teaching, or wisdom-based career`,
        confidence: strength,
        probability: Math.round(strength * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Jupiter in house ${jupiterPlacement.house} (${houseLabel}), strength ${strength}/100`,
          "Jupiter's higher wisdom expressed through 9th/11th: counseling, teaching, and advisory roles",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_ADVISORY", "CAREER_TEACHING", "WISDOM_CAREER"],
        planets: ["Jupiter"],
      };
    },
  },

  // ── Venus in 10th or 7th, strong → creative / luxury / relationship career ─
  {
    id: "career-venus-creative",
    domain: "Career",
    priority: 26,
    test: (ctx, sym) => {
      const venusPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Venus");
      return (
        !!venusPlacement &&
        [7, 10].includes(venusPlacement.house) &&
        sym.strengthOf("Venus") >= 60
      );
    },
    conclude: (ctx, sym): DraftConclusion => {
      const venusPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Venus")!;
      const strength = sym.strengthOf("Venus");
      return {
        id: "career-venus-creative",
        domain: "Career",
        statement: `Venus in ${venusPlacement.house}th house with strength ${strength}/100 — creative, luxury, or relationship-focused career domains`,
        confidence: strength,
        probability: Math.round(strength * 0.78),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Venus in house ${venusPlacement.house}, strength ${strength}/100`,
          "Venus in 7th/10th: career in arts, beauty, luxury goods, relationships, or diplomacy",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_CREATIVE", "VENUS_CAREER"],
        planets: ["Venus"],
      };
    },
  },

  // ── Mars strong in 3rd/6th/10th → technical / engineering / martial career ─
  {
    id: "career-mars-technical",
    domain: "Career",
    priority: 27,
    test: (ctx, sym) => {
      const marsPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Mars");
      return (
        !!marsPlacement &&
        [3, 6, 10].includes(marsPlacement.house) &&
        sym.strengthOf("Mars") >= 60
      );
    },
    conclude: (ctx, sym): DraftConclusion => {
      const marsPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Mars")!;
      const strength = sym.strengthOf("Mars");
      return {
        id: "career-mars-technical",
        domain: "Career",
        statement: `Mars in ${marsPlacement.house}th house with strength ${strength}/100 — technical execution, engineering, defense, or competitive career`,
        confidence: strength,
        probability: Math.round(strength * 0.78),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Mars in house ${marsPlacement.house}, strength ${strength}/100`,
          "Mars in 3rd/6th/10th: drive, technical aptitude, and competitive edge channeled into career",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_TECHNICAL", "CAREER_MARTIAL"],
        planets: ["Mars"],
      };
    },
  },

  // ── 2nd lord + 11th lord both strong → career wealth potential ────────────
  {
    id: "career-wealth-foundation",
    domain: "Career",
    priority: 28,
    test: (ctx, sym) =>
      sym.strengthOfHouseLord(2) >= 60 && sym.strengthOfHouseLord(11) >= 60,
    conclude: (ctx, sym): DraftConclusion => {
      const lord2  = sym.lordOf(2);
      const lord11 = sym.lordOf(11);
      const str2   = lord2  ? sym.strengthOf(lord2)  : 60;
      const str11  = lord11 ? sym.strengthOf(lord11) : 60;
      const avg    = Math.round((str2 + str11) / 2);
      const planets: PlanetName[] = [lord2, lord11].filter((p): p is PlanetName => !!p);
      return {
        id: "career-wealth-foundation",
        domain: "Career",
        statement: `2nd lord ${lord2 ?? "unknown"} (${str2}/100) and 11th lord ${lord11 ?? "unknown"} (${str11}/100) both strong — strong financial foundation and income gains from career`,
        confidence: avg,
        probability: Math.round(avg * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `2nd lord ${lord2 ?? "unknown"}: ${str2}/100 — wealth accumulation`,
          `11th lord ${lord11 ?? "unknown"}: ${str11}/100 — income and gains`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_WEALTH", "INCOME_GAINS"],
        planets,
      };
    },
  },

  // ── 5th lord strong in kendra → intellectual / creative professional rise ───
  {
    id: "career-5th-lord-kendra",
    domain: "Career",
    priority: 29,
    test: (ctx, sym) => {
      const lord5Entry = ctx.chartSuite.D1.lords.find(l => l.house === 5);
      const lord5      = sym.lordOf(5);
      return (
        !!lord5 &&
        !!lord5Entry &&
        [1, 4, 7, 10].includes(lord5Entry.lordPlacedInHouse) &&
        sym.strengthOf(lord5) >= 60
      );
    },
    conclude: (ctx, sym): DraftConclusion => {
      const lord5      = sym.lordOf(5)!;
      const lord5Entry = ctx.chartSuite.D1.lords.find(l => l.house === 5)!;
      const strength   = sym.strengthOf(lord5);
      return {
        id: "career-5th-lord-kendra",
        domain: "Career",
        statement: `5th lord ${lord5} in kendra (house ${lord5Entry.lordPlacedInHouse}) with strength ${strength}/100 — intellect, strategy, and creative professional achievement`,
        confidence: strength,
        probability: Math.round(strength * 0.78),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `5th lord ${lord5} placed in kendra house ${lord5Entry.lordPlacedInHouse}, strength ${strength}/100`,
          "5th lord in kendra: intelligence and creative aptitude channeled into professional achievement",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_CREATIVE", "PROFESSIONAL_STATUS"],
        planets: [lord5],
      };
    },
  },

  // ── D1 10th house afflicted by weak malefics → career obstacles / delays ───
  {
    id: "career-10th-malefic-afflicted",
    domain: "Career",
    priority: 30,
    test: (ctx, sym) => {
      const malefics: PlanetName[] = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
      return ctx.chartSuite.D1.planets.some(
        p => p.house === 10 && malefics.includes(p.planet) && sym.strengthOf(p.planet) < 40,
      );
    },
    conclude: (ctx, sym): DraftConclusion => {
      const malefics: PlanetName[] = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
      const afflicting = ctx.chartSuite.D1.planets
        .filter(p => p.house === 10 && malefics.includes(p.planet) && sym.strengthOf(p.planet) < 40)
        .map(p => p.planet);
      const avgWeakness = Math.round(
        afflicting.reduce((s, p) => s + (100 - sym.strengthOf(p)), 0) / afflicting.length,
      );
      return {
        id: "career-10th-malefic-afflicted",
        domain: "Career",
        statement: `D1 10th house afflicted by weak malefic(s) ${afflicting.join(", ")} — career obstacles: structural friction and delayed recognition`,
        confidence: Math.min(85, avgWeakness),
        probability: Math.round(Math.min(85, avgWeakness) * 0.65),
        direction: "Negative",
        timing: "Natal",
        supportingEvidence: [
          `Weak malefic(s) in D1 10th house: ${afflicting.join(", ")}`,
          "Debilitated or weak malefics in the career house create friction and recognition delays",
        ],
        conflictingEvidence: [],
        reasonCodes: ["CAREER_OBSTACLES", "CAREER_DELAYS"],
        planets: afflicting,
      };
    },
  },
];
