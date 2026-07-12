import { AstrologyContext, DraftConclusion, PlanetName } from "../../types";
import { SymbolRegistry } from "../symbolRegistry";
import { InferenceRule } from "./general";

// Wealth inference rules.
// Wealth in Vedic astrology is primarily governed by:
//   - 2nd house and lord (accumulated wealth, family resources)
//   - 11th house and lord (income, gains, fulfillment of desires)
//   - Jupiter (karaka of wealth and wisdom)
//   - Venus (karaka of luxury and material comfort)
//   - Dhana yogas (connections between 2nd/11th lords)

export const WEALTH_RULES: InferenceRule[] = [

  // ── 2nd and 11th lords connected → classic Dhana Yoga indicator ──────────
  {
    id: "wealth-dhana-lord-connection",
    domain: "Wealth",
    priority: 1,
    test: (ctx, sym) => {
      const lord2  = sym.lordOf(2);
      const lord11 = sym.lordOf(11);
      if (!lord2 || !lord11 || lord2 === lord11) return false;
      const h2Entry  = ctx.chartSuite.D1.lords.find(l => l.house === 2);
      const h11Entry = ctx.chartSuite.D1.lords.find(l => l.house === 11);
      if (!h2Entry || !h11Entry) return false;
      const h2Placed  = h2Entry.lordPlacedInHouse;
      const h11Placed = h11Entry.lordPlacedInHouse;
      // Mutual exchange, or one lord placed in the other's house
      return h2Placed === 11 || h11Placed === 2 || h2Placed === h11Placed;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const lord2     = sym.lordOf(2)!;
      const lord11    = sym.lordOf(11)!;
      const h2Entry   = ctx.chartSuite.D1.lords.find(l => l.house === 2)!;
      const h11Entry  = ctx.chartSuite.D1.lords.find(l => l.house === 11)!;
      const str2      = sym.strengthOf(lord2);
      const str11     = sym.strengthOf(lord11);
      const confidence = Math.round((str2 + str11) / 2);
      let connectionType = "co-placed";
      if (h2Entry.lordPlacedInHouse === 11) connectionType = "2nd lord in 11th";
      else if (h11Entry.lordPlacedInHouse === 2) connectionType = "11th lord in 2nd";
      return {
        id: "wealth-dhana-lord-connection",
        domain: "Wealth",
        statement: `2nd lord ${lord2} and 11th lord ${lord11} are connected (${connectionType}) — classic Dhana Yoga: wealth accumulation and income gains`,
        confidence,
        probability: Math.round(confidence * 0.85),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `2nd lord ${lord2} placed in house ${h2Entry.lordPlacedInHouse}, strength ${str2}/100`,
          `11th lord ${lord11} placed in house ${h11Entry.lordPlacedInHouse}, strength ${str11}/100`,
          `Connection type: ${connectionType}`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_DHANA", "WEALTH_ACCUMULATION", "INCOME_GAINS"],
        planets: [lord2, lord11],
      };
    },
  },

  // ── 2nd lord strong → financial accumulation potential ───────────────────
  {
    id: "wealth-2nd-lord-strong",
    domain: "Wealth",
    priority: 2,
    test: (ctx, sym) => sym.strengthOfHouseLord(2) >= 65,
    conclude: (ctx, sym): DraftConclusion => {
      const lord2    = sym.lordOf(2)!;
      const strength = sym.strengthOf(lord2);
      return {
        id: "wealth-2nd-lord-strong",
        domain: "Wealth",
        statement: `2nd lord ${lord2} is strong (${strength}/100) — financial accumulation potential: family wealth and resource-building`,
        confidence: strength,
        probability: Math.round(strength * 0.82),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `2nd lord ${lord2} strength: ${strength}/100`,
          "Strong 2nd lord: capacity to accumulate material resources and build family wealth",
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_ACCUMULATION", "FINANCIAL_STABILITY"],
        planets: [lord2],
      };
    },
  },

  // ── 11th lord strong → income and gains ──────────────────────────────────
  {
    id: "wealth-11th-lord-strong",
    domain: "Wealth",
    priority: 3,
    test: (ctx, sym) => sym.strengthOfHouseLord(11) >= 65,
    conclude: (ctx, sym): DraftConclusion => {
      const lord11   = sym.lordOf(11)!;
      const strength = sym.strengthOf(lord11);
      return {
        id: "wealth-11th-lord-strong",
        domain: "Wealth",
        statement: `11th lord ${lord11} is strong (${strength}/100) — strong income and gains: recurring financial inflows`,
        confidence: strength,
        probability: Math.round(strength * 0.82),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `11th lord ${lord11} strength: ${strength}/100`,
          "Strong 11th lord: sustained income growth, network gains, and financial fulfillment",
        ],
        conflictingEvidence: [],
        reasonCodes: ["INCOME_GAINS", "FINANCIAL_STABILITY"],
        planets: [lord11],
      };
    },
  },

  // ── Jupiter in 2nd/5th/9th/11th and strong → wisdom-based wealth ─────────
  {
    id: "wealth-jupiter-dhana-placement",
    domain: "Wealth",
    priority: 4,
    test: (ctx, sym) => {
      const jupiterHouse = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter")?.house;
      return !!jupiterHouse && [2, 5, 9, 11].includes(jupiterHouse) && sym.strengthOf("Jupiter") >= 60;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const jupiterPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter")!;
      const strength         = sym.strengthOf("Jupiter");
      return {
        id: "wealth-jupiter-dhana-placement",
        domain: "Wealth",
        statement: `Jupiter in ${jupiterPlacement.house}th house with strength ${strength}/100 — wisdom-based wealth: abundance through knowledge, teaching, and virtue`,
        confidence: strength,
        probability: Math.round(strength * 0.83),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Jupiter in house ${jupiterPlacement.house} (dhana house), strength ${strength}/100`,
          "Jupiter as karaka of wealth in a dhana house (2/5/9/11) strongly supports financial abundance",
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_JUPITER", "WEALTH_ACCUMULATION"],
        planets: ["Jupiter"],
      };
    },
  },

  // ── Venus strong in kendra → material comfort and luxury ─────────────────
  {
    id: "wealth-venus-kendra",
    domain: "Wealth",
    priority: 5,
    test: (ctx, sym) => {
      const venusHouse = ctx.chartSuite.D1.planets.find(p => p.planet === "Venus")?.house;
      return !!venusHouse && [1, 4, 7, 10].includes(venusHouse) && sym.strengthOf("Venus") >= 60;
    },
    conclude: (ctx, sym): DraftConclusion => {
      const venusPlacement = ctx.chartSuite.D1.planets.find(p => p.planet === "Venus")!;
      const strength       = sym.strengthOf("Venus");
      return {
        id: "wealth-venus-kendra",
        domain: "Wealth",
        statement: `Venus in kendra (house ${venusPlacement.house}) with strength ${strength}/100 — material comfort and luxury: aesthetic wealth and sensory abundance`,
        confidence: strength,
        probability: Math.round(strength * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `Venus in kendra house ${venusPlacement.house}, strength ${strength}/100`,
          "Venus as karaka of luxury in an angular house amplifies material comforts and financial elegance",
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_VENUS", "FINANCIAL_STABILITY"],
        planets: ["Venus"],
      };
    },
  },

  // ── Active Dhana Yoga → wealth manifestation window ──────────────────────
  {
    id: "wealth-dhana-yoga-active",
    domain: "Wealth",
    priority: 6,
    test: (ctx, sym) => {
      const dhanaYogas = ctx.yogaAnalysis.birthPromises.filter(p => p.category === "Dhana");
      return dhanaYogas.some(p => {
        const status = sym.yogaActivationStatus(p.id);
        return status === "Active" || status === "Peak";
      });
    },
    conclude: (ctx, sym): DraftConclusion => {
      const dhanaYogas = ctx.yogaAnalysis.birthPromises.filter(p => p.category === "Dhana");
      const activeYoga = dhanaYogas.find(p => {
        const status = sym.yogaActivationStatus(p.id);
        return status === "Active" || status === "Peak";
      }) ?? dhanaYogas[0];
      const activation = ctx.yogaAnalysis.activations.find(a => a.yogaId === activeYoga?.id);
      const score      = activation?.activationScore ?? activeYoga?.birthStrength ?? 50;
      return {
        id: "wealth-dhana-yoga-active",
        domain: "Wealth",
        statement: `Dhana Yoga (${activeYoga?.name ?? "unknown"}) is active — wealth manifestation window: financial gains are currently activated`,
        confidence: score,
        probability: Math.round(score * 0.85),
        direction: "Positive",
        timing: "Current",
        supportingEvidence: [
          `${activeYoga?.name ?? "Dhana Yoga"} birth strength: ${activeYoga?.birthStrength ?? 0}/100`,
          `Activation status: ${activation?.status ?? "Active"}`,
          ...(activeYoga?.evidence.map(e => e.description) ?? []),
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_DHANA", "INCOME_GAINS", "WEALTH_ACCUMULATION"],
        planets: activeYoga?.supportingPlanets ?? [],
      };
    },
  },

  // ── Both 2nd and 11th lords weak → financial challenges ──────────────────
  {
    id: "wealth-2nd-11th-weak",
    domain: "Wealth",
    priority: 7,
    test: (ctx, sym) =>
      sym.strengthOfHouseLord(2) < 35 && sym.strengthOfHouseLord(11) < 35,
    conclude: (ctx, sym): DraftConclusion => {
      const lord2  = sym.lordOf(2);
      const lord11 = sym.lordOf(11);
      const str2   = lord2  ? sym.strengthOf(lord2)  : 30;
      const str11  = lord11 ? sym.strengthOf(lord11) : 30;
      const avgWeakness = Math.round(((100 - str2) + (100 - str11)) / 2);
      const planets: PlanetName[] = [lord2, lord11].filter((p): p is PlanetName => !!p);
      return {
        id: "wealth-2nd-11th-weak",
        domain: "Wealth",
        statement: `2nd lord ${lord2 ?? "unknown"} (${str2}/100) and 11th lord ${lord11 ?? "unknown"} (${str11}/100) both weak — financial challenges: limited accumulation and income constraints`,
        confidence: avgWeakness,
        probability: Math.round(avgWeakness * 0.70),
        direction: "Negative",
        timing: "Natal",
        supportingEvidence: [
          `2nd lord ${lord2 ?? "unknown"} strength: ${str2}/100 (below threshold)`,
          `11th lord ${lord11 ?? "unknown"} strength: ${str11}/100 (below threshold)`,
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_CHALLENGE", "FINANCIAL_STABILITY"],
        planets,
      };
    },
  },

  // ── 9th lord strong → fortunate income / luck-based gains ────────────────
  {
    id: "wealth-9th-lord-strong",
    domain: "Wealth",
    priority: 8,
    test: (ctx, sym) => sym.strengthOfHouseLord(9) >= 65,
    conclude: (ctx, sym): DraftConclusion => {
      const lord9    = sym.lordOf(9)!;
      const strength = sym.strengthOf(lord9);
      return {
        id: "wealth-9th-lord-strong",
        domain: "Wealth",
        statement: `9th lord ${lord9} is strong (${strength}/100) — fortunate income: luck-based financial gains and dharmic wealth`,
        confidence: strength,
        probability: Math.round(strength * 0.80),
        direction: "Positive",
        timing: "Natal",
        supportingEvidence: [
          `9th lord ${lord9} strength: ${strength}/100`,
          "Strong 9th lord (dharma bhava): financial fortune through luck, divine blessings, and righteous action",
        ],
        conflictingEvidence: [],
        reasonCodes: ["WEALTH_FORTUNE", "INCOME_GAINS"],
        planets: [lord9],
      };
    },
  },
];
