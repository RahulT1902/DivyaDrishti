import {
  AstrologyContext, ConfidenceProvenance, PlanetName,
} from "../../types";
import { SymbolRegistry } from "../symbolRegistry";

// A HypothesisDefinition is a named symbolic concept that:
//   - tests whether it applies to this chart
//   - computes a confidence score
//   - maps to multiple domains with domain-specific weights
//   - specifies which InferenceConclusion reasonCodes trigger it
//
// This keeps all reasoning generic — domain engines don't infer, they filter.

export interface HypothesisDefinition {
  id: string;
  label: string;
  description: string;
  // domain → relevance weight (0–1). Career=0.9 means this hypothesis
  // contributes with weight 0.9 to Career domain conclusions.
  domains: Record<string, number>;
  // InferenceConclusion.reasonCodes that activate this hypothesis
  triggerReasonCodes: string[];
  test: (ctx: AstrologyContext, sym: SymbolRegistry) => boolean;
  computeConfidence: (ctx: AstrologyContext, sym: SymbolRegistry) => number;
  computeProvenance: (ctx: AstrologyContext, sym: SymbolRegistry) => ConfidenceProvenance;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function yogaActivationScore(ctx: AstrologyContext, yogaId: string): number {
  return ctx.yogaAnalysis.activations.find(a => a.yogaId === yogaId)?.activationScore ?? 0;
}

function yogaBirthStrength(ctx: AstrologyContext, yogaId: string): number {
  return ctx.yogaAnalysis.birthPromises.find(p => p.id === yogaId)?.birthStrength ?? 0;
}

// ── Hypothesis Definitions ────────────────────────────────────────────────────

export const HYPOTHESIS_DEFINITIONS: HypothesisDefinition[] = [

  // Leadership Potential — authority, recognition, power
  {
    id: "leadership-potential",
    label: "Leadership Potential",
    description: "Capacity for authority, public recognition, and managing others",
    domains: { Career: 0.90, Education: 0.40, Spirituality: 0.30 },
    triggerReasonCodes: [
      "CAREER_AUTHORITY", "PROFESSIONAL_STATUS", "CAREER_RECOGNITION",
      "YOGAKARAKA_STRONG", "MANAGEMENT_APTITUDE",
    ],
    test: (ctx, sym) => {
      const hasRajYoga  = sym.yogaActivationStatus("raj-yoga") !== "Dormant";
      const sunStrong   = sym.strengthOf("Sun") >= 65;
      const lord10strong = sym.strengthOfHouseLord(10) >= 65;
      return hasRajYoga || sunStrong || lord10strong;
    },
    computeConfidence: (ctx, sym) => {
      const rajScore = yogaActivationScore(ctx, "raj-yoga");
      const sun      = sym.strengthOf("Sun");
      const l10      = sym.strengthOfHouseLord(10);
      return Math.round(Math.max(rajScore, sun, l10));
    },
    computeProvenance: (ctx, sym) => {
      const natal      = yogaBirthStrength(ctx, "raj-yoga") || sym.strengthOfHouseLord(10);
      const activation = yogaActivationScore(ctx, "raj-yoga");
      const strength   = sym.strengthOf("Sun");
      return { natal, activation, strength };
    },
  },

  // Discipline and Perseverance — structured effort over time
  {
    id: "discipline-perseverance",
    label: "Discipline and Perseverance",
    description: "Capacity for structured effort, endurance, and long-term commitment",
    domains: { Career: 0.75, Education: 0.80, Health: 0.60, Spirituality: 0.70 },
    triggerReasonCodes: [
      "CAREER_DISCIPLINE", "CAREER_GOVERNMENT", "CAREER_AUTHORITY",
    ],
    test: (ctx, sym) => {
      const saturnStrong = sym.strengthOf("Saturn") >= 55;
      const sasaYoga     = sym.yogaActivationStatus("sasa") !== "Dormant";
      return saturnStrong || sasaYoga;
    },
    computeConfidence: (ctx, sym) => {
      const saturnStr = sym.strengthOf("Saturn");
      const sasaScore = yogaActivationScore(ctx, "sasa");
      return Math.round(Math.max(saturnStr, sasaScore));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      yogaBirthStrength(ctx, "sasa") || sym.strengthOf("Saturn"),
      activation: yogaActivationScore(ctx, "sasa"),
      strength:   sym.strengthOf("Saturn"),
    }),
  },

  // Wisdom Expansion — intellectual and spiritual growth
  {
    id: "wisdom-expansion",
    label: "Wisdom and Expansion",
    description: "Capacity for higher learning, philosophy, and spiritual wisdom",
    domains: { Education: 0.90, Spirituality: 0.85, Career: 0.45 },
    triggerReasonCodes: [
      "CAREER_WISDOM", "CAREER_TEACHING", "CAREER_ADVISORY",
      "OVERALL_POSITIVE", "HIGH_CHART_QUALITY",
    ],
    test: (ctx, sym) => {
      const jupiterStrong = sym.strengthOf("Jupiter") >= 60;
      const hamsaYoga     = sym.yogaActivationStatus("hamsa") !== "Dormant";
      const lord9strong   = sym.strengthOfHouseLord(9) >= 60;
      return jupiterStrong || hamsaYoga || lord9strong;
    },
    computeConfidence: (ctx, sym) => {
      const jup     = sym.strengthOf("Jupiter");
      const hamsa   = yogaActivationScore(ctx, "hamsa");
      const l9      = sym.strengthOfHouseLord(9);
      return Math.round(Math.max(jup, hamsa, l9));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      yogaBirthStrength(ctx, "hamsa") || sym.strengthOf("Jupiter"),
      activation: yogaActivationScore(ctx, "hamsa"),
      strength:   sym.strengthOf("Jupiter"),
    }),
  },

  // Physical Vitality — body, energy, martial capacity
  {
    id: "physical-vitality",
    label: "Physical Vitality",
    description: "Bodily strength, energy, and physical competitive capacity",
    domains: { Health: 0.90, Career: 0.50, Education: 0.20 },
    triggerReasonCodes: [
      "CAREER_PHYSICAL", "CAREER_MARTIAL", "CAREER_LEADERSHIP",
      "VITALITY_HIGH",
    ],
    test: (ctx, sym) => {
      const marsStrong   = sym.strengthOf("Mars") >= 60;
      const ruchaka      = sym.yogaActivationStatus("ruchaka") !== "Dormant";
      const lord1strong  = sym.strengthOfHouseLord(1) >= 60;
      return marsStrong || ruchaka || lord1strong;
    },
    computeConfidence: (ctx, sym) => {
      const mars   = sym.strengthOf("Mars");
      const ruchak = yogaActivationScore(ctx, "ruchaka");
      const l1     = sym.strengthOfHouseLord(1);
      return Math.round(Math.max(mars, ruchak, l1));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      yogaBirthStrength(ctx, "ruchaka") || sym.strengthOf("Mars"),
      activation: yogaActivationScore(ctx, "ruchaka"),
      strength:   sym.strengthOf("Mars"),
    }),
  },

  // Wealth Generation — capacity to accumulate material resources
  {
    id: "wealth-generation",
    label: "Wealth Generation",
    description: "Capacity to attract, earn, and accumulate financial resources",
    domains: { Finance: 0.95, Career: 0.55 },
    triggerReasonCodes: [
      "CAREER_SUCCESS", "10TH_LORD_STRONG", "OVERALL_POSITIVE",
    ],
    test: (ctx, sym) => {
      const dhanaYoga  = sym.yogaActivationStatus("dhana-yoga") !== "Dormant";
      const lord2str   = sym.strengthOfHouseLord(2) >= 60;
      const lord11str  = sym.strengthOfHouseLord(11) >= 60;
      return dhanaYoga || lord2str || lord11str;
    },
    computeConfidence: (ctx, sym) => {
      const dhana  = yogaActivationScore(ctx, "dhana-yoga");
      const l2     = sym.strengthOfHouseLord(2);
      const l11    = sym.strengthOfHouseLord(11);
      return Math.round(Math.max(dhana, (l2 + l11) / 2));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      yogaBirthStrength(ctx, "dhana-yoga") || sym.strengthOfHouseLord(2),
      activation: yogaActivationScore(ctx, "dhana-yoga"),
      strength:   Math.round((sym.strengthOfHouseLord(2) + sym.strengthOfHouseLord(11)) / 2),
    }),
  },

  // Communication Excellence — articulation, persuasion, networking
  {
    id: "communication-excellence",
    label: "Communication Excellence",
    description: "Capacity for articulate expression, persuasion, and intellectual networking",
    domains: { Career: 0.65, Education: 0.60, Finance: 0.40 },
    triggerReasonCodes: ["CAREER_WISDOM", "CAREER_ADVISORY"],
    test: (ctx, sym) => {
      const mercuryStr  = sym.strengthOf("Mercury") >= 60;
      const budhaAditya = sym.yogaActivationStatus("budha-aditya") !== "Dormant";
      return mercuryStr || budhaAditya;
    },
    computeConfidence: (ctx, sym) => {
      const merc  = sym.strengthOf("Mercury");
      const budha = yogaActivationScore(ctx, "budha-aditya");
      return Math.round(Math.max(merc, budha));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      yogaBirthStrength(ctx, "budha-aditya") || sym.strengthOf("Mercury"),
      activation: yogaActivationScore(ctx, "budha-aditya"),
      strength:   sym.strengthOf("Mercury"),
    }),
  },

  // Relationship Harmony — partnerships, marriage, cooperation
  {
    id: "relationship-harmony",
    label: "Relationship Harmony",
    description: "Capacity for harmonious partnerships, marriage fulfillment, and social grace",
    domains: { Marriage: 0.90, Finance: 0.35, Career: 0.30 },
    triggerReasonCodes: ["OVERALL_POSITIVE"],
    test: (ctx, sym) => {
      const venusStr  = sym.strengthOf("Venus") >= 60;
      const malavya   = sym.yogaActivationStatus("malavya") !== "Dormant";
      const lord7str  = sym.strengthOfHouseLord(7) >= 55;
      return venusStr || malavya || lord7str;
    },
    computeConfidence: (ctx, sym) => {
      const venus = sym.strengthOf("Venus");
      const mal   = yogaActivationScore(ctx, "malavya");
      const l7    = sym.strengthOfHouseLord(7);
      return Math.round(Math.max(venus, mal, l7));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      yogaBirthStrength(ctx, "malavya") || sym.strengthOf("Venus"),
      activation: yogaActivationScore(ctx, "malavya"),
      strength:   sym.strengthOf("Venus"),
    }),
  },

  // Adversity Resilience — rise after hardship
  {
    id: "adversity-resilience",
    label: "Adversity Resilience",
    description: "Capacity to overcome hardship and emerge stronger — late-blooming patterns",
    domains: { Career: 0.60, Health: 0.50, Finance: 0.45 },
    triggerReasonCodes: [
      "CAREER_LATE_RISE", "CAREER_STRUGGLE_THEN_SUCCESS",
    ],
    test: (ctx, sym) => {
      const neechaBhanga  = sym.yogaActivationStatus("neecha-bhanga") !== "Dormant";
      const vipareeta     = ["harsha-yoga", "sarala-yoga", "vimala-yoga"]
        .some(id => sym.yogaActivationStatus(id) !== "Dormant");
      return neechaBhanga || vipareeta;
    },
    computeConfidence: (ctx, sym) => {
      const nb  = yogaActivationScore(ctx, "neecha-bhanga");
      const vip = Math.max(
        yogaActivationScore(ctx, "harsha-yoga"),
        yogaActivationScore(ctx, "sarala-yoga"),
        yogaActivationScore(ctx, "vimala-yoga"),
      );
      return Math.round(Math.max(nb, vip));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      Math.max(
        yogaBirthStrength(ctx, "neecha-bhanga"),
        yogaBirthStrength(ctx, "harsha-yoga"),
      ),
      activation: yogaActivationScore(ctx, "neecha-bhanga"),
      strength:   50,
    }),
  },

  // Spiritual Inclination — inner life, renunciation, transcendence
  {
    id: "spiritual-inclination",
    label: "Spiritual Inclination",
    description: "Orientation toward inner life, renunciation, and transcendent knowledge",
    domains: { Spirituality: 0.95, Health: 0.40, Education: 0.50 },
    triggerReasonCodes: ["OVERALL_POSITIVE"],
    test: (ctx, sym) => {
      const ketuHouse = ctx.chartSuite.D1.planets.find(p => p.planet === "Ketu");
      const ketuIn12or8 = ketuHouse && [8, 12].includes(ketuHouse.house);
      const jupInTrikona = (() => {
        const jup = ctx.chartSuite.D1.planets.find(p => p.planet === "Jupiter");
        return jup && [1, 5, 9].includes(jup.house);
      })();
      const lord12str = sym.strengthOfHouseLord(12) >= 55;
      return !!(ketuIn12or8 || jupInTrikona || lord12str);
    },
    computeConfidence: (ctx, sym) => {
      const jupStr  = sym.strengthOf("Jupiter");
      const l12     = sym.strengthOfHouseLord(12);
      return Math.round(Math.max(jupStr * 0.7, l12));
    },
    computeProvenance: (ctx, sym) => ({
      natal:      sym.strengthOf("Jupiter"),
      activation: 0,
      strength:   sym.strengthOfHouseLord(12),
    }),
  },
];
