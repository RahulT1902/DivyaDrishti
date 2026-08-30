import type { PlanetName, Sign } from "../types";
import { getAscendantLordshipInfo } from "../astrology/lordshipEngine";
import { getDignityInfo, type DignityInfo, type PlanetaryCondition, type SignDignity } from "../astrology/dignityEngine";

export interface TransitTheme {
  topic: string;
  description: string;
  source: string; // e.g. "11th House Transit + Own Sign Dignity (Venus rules 6th & 11th)"
}

export interface TransitFactor {
  factor: string;
  impact: string;
}

export interface DashaAssessment {
  mahadasha: PlanetName;
  antardasha: PlanetName;
  alignment: "supported" | "mixed" | "conflicting" | "neutral";
  notes: string;
}

export interface TransitInterpretationAudit {
  chart: {
    ascendant: Sign;
    ascendantName: string;
    lagnaLord: PlanetName;
  };
  transit: {
    planet: PlanetName;
    sign: Sign;
    signName: string;
    house: number;
  };
  planetRole: {
    housesRuled: number[];
    signDignity: SignDignity;
    planetaryCondition: PlanetaryCondition;
    stateDescription: string;
  };
  themes: {
    primary: TransitTheme[];
    secondary: TransitTheme[];
    conditional: TransitTheme[];
    advisory: TransitTheme[];
  };
  supportingFactors: TransitFactor[];
  cautionFactors: TransitFactor[];
  dashaInteraction?: DashaAssessment;
  confidence: "high" | "medium" | "low";
  overallVerdict: "Highly Supportive" | "Supportive" | "Moderately Supportive" | "Mixed" | "Challenging";
  reasoningTrace: string[];
}

// House Core Meanings
const HOUSE_MEANINGS: Record<number, { title: string; primary: string[]; domain: string }> = {
  1:  { title: "1st House (Lagna / Self)", primary: ["vitality", "personal initiative", "baseline orientation", "self-expression"], domain: "general" },
  2:  { title: "2nd House (Wealth & Speech)", primary: ["accumulated wealth", "family assets", "speech and communication", "financial security"], domain: "finance" },
  3:  { title: "3rd House (Effort & Communication)", primary: ["communication", "courage and initiative", "short travels", "siblings and peers"], domain: "general" },
  4:  { title: "4th House (Home & Stability)", primary: ["home and domestic peace", "property and vehicles", "emotional stability", "foundational comfort"], domain: "relationship" },
  5:  { title: "5th House (Intelligence & Speculation)", primary: ["intelligence and strategy", "creative projects", "speculation and gains", "children"], domain: "growth" },
  6:  { title: "6th House (Work & Resolution)", primary: ["daily work and service", "colleagues and team dynamics", "resolution of disputes", "health management"], domain: "health" },
  7:  { title: "7th House (Partnerships)", primary: ["partnerships and marriage", "business contracts", "public alliances", "relational balance"], domain: "relationship" },
  8:  { title: "8th House (Transformation)", primary: ["unearned wealth / research", "deep transformation", "sudden changes", "joint finances"], domain: "finance" },
  9:  { title: "9th House (Fortune & Growth)", primary: ["higher learning and wisdom", "dharma and fortune", "mentorship", "long-distance travels"], domain: "growth" },
  10: { title: "10th House (Career & Status)", primary: ["career achievement", "public status and recognition", "professional leadership", "executive responsibilities"], domain: "career" },
  11: { title: "11th House (Gains & Networks)", primary: ["gains and income", "professional networks and contacts", "fulfillment of objectives", "support from alliances"], domain: "finance" },
  12: { title: "12th House (Expenses & Isolation)", primary: ["expenses and investments", "foreign connections", "rest and solitude", "spiritual detachment"], domain: "spirituality" },
};

// Natural Significances of Planets
const PLANET_NATURAL_SIGNIFICANCES: Record<PlanetName, { primary: string[]; secondary: string[] }> = {
  Venus:   { primary: ["relationships", "social harmony", "cooperation", "creativity"], secondary: ["luxuries", "comforts", "design and aesthetics"] },
  Jupiter: { primary: ["wisdom", "expansion", "growth", "mentorship"], secondary: ["optimism", "spiritual understanding", "prosperity"] },
  Saturn:  { primary: ["structure", "discipline", "patience", "long-term stability"], secondary: ["perseverance", "service", "systematic building"] },
  Mars:    { primary: ["drive", "courage", "execution energy", "initiative"], secondary: ["passion", "physical vitality", "assertiveness"] },
  Mercury: { primary: ["communication", "analytical sharpness", "trade and commerce"], secondary: ["learning", "adaptability", "data and writing"] },
  Sun:     { primary: ["authority", "visibility", "vitality", "leadership"], secondary: ["confidence", "reputation", "clarity of purpose"] },
  Moon:    { primary: ["emotions", "mind", "public reception", "nurturing"], secondary: ["fluidity", "intuition", "peace of mind"] },
  Rahu:    { primary: ["ambition", "unconventional leaps", "visibility spikes"], secondary: ["innovation", "intensity", "foreign aspects"] },
  Ketu:    { primary: ["detachment", "deep analysis", "spiritual insight"], secondary: ["research", "simplification", "karma resolution"] },
};

export function interpretChartTransit(
  ascendant: Sign,
  transitingPlanet: PlanetName,
  transitSign: Sign,
  options: {
    isRetrograde?: boolean;
    isCombust?: boolean;
    dashaInfo?: { mahadasha: PlanetName; antardasha: PlanetName };
    thirdHouseAfflicted?: boolean;
    seventhHouseAfflicted?: boolean;
  } = {}
): TransitInterpretationAudit {
  const lordship = getAscendantLordshipInfo(ascendant);
  const transitHouse = (((transitSign - ascendant + 12) % 12) + 1);
  const housesRuled = lordship.planetRuledHouses[transitingPlanet] ?? [];
  const dignityInfo = getDignityInfo(transitingPlanet, transitSign, options);

  const reasoningTrace: string[] = [];
  reasoningTrace.push(`1. Ascendant: ${lordship.lagnaSignName} (House 1 ruler: ${lordship.lagnaLord})`);
  reasoningTrace.push(`2. Transiting planet: ${transitingPlanet} in ${dignityInfo.signName} (House ${transitHouse})`);
  reasoningTrace.push(`3. Houses ruled by ${transitingPlanet} for ${lordship.lagnaSignName}: House(s) ${housesRuled.join(", ")}`);
  reasoningTrace.push(`4. Dignity: ${dignityInfo.condition.signDignity.toUpperCase()} (${dignityInfo.description})`);

  const houseMeta = HOUSE_MEANINGS[transitHouse] ?? HOUSE_MEANINGS[1];
  const naturalSig = PLANET_NATURAL_SIGNIFICANCES[transitingPlanet];

  const supportingFactors: TransitFactor[] = [];
  const cautionFactors: TransitFactor[] = [];

  // Dignity impact on baseline score
  const isDignityStrong = dignityInfo.condition.signDignity === "own" || dignityInfo.condition.signDignity === "exalted";
  const isDignityWeak = dignityInfo.condition.signDignity === "debilitated";

  if (isDignityStrong) {
    supportingFactors.push({
      factor: `${transitingPlanet} in ${dignityInfo.condition.signDignity.toUpperCase()} sign (${dignityInfo.signName})`,
      impact: "Materially elevates baseline transit strength and positive manifestation",
    });
  } else if (isDignityWeak) {
    cautionFactors.push({
      factor: `${transitingPlanet} Debilitated in ${dignityInfo.signName}`,
      impact: "Reduces planetary efficiency and creates administrative or delivery delays",
    });
  }

  // ── 1. PRIMARY Themes (House + Lordship + Dignity) ──────────────────────────
  const primaryThemes: TransitTheme[] = [];

  // Lordship + House synthesis
  const lordshipHouseStr = housesRuled.map(h => `${h}th lord`).join(" & ");
  const sourceLabel = `${transitHouse}th House Transit + ${dignityInfo.condition.signDignity.toUpperCase()} dignity (${transitingPlanet} rules ${housesRuled.join("&")}th houses)`;

  if (transitHouse === 11) {
    primaryThemes.push(
      { topic: "Gains & Income Flow", description: `Activation of the 11th house brings financial opportunities, income flow, and material rewards.`, source: sourceLabel },
      { topic: "Professional Networks & Alliances", description: `Strong support from contacts, professional networks, colleagues, and key decision-makers.`, source: sourceLabel },
      { topic: "Fulfillment of Objectives", description: `Progress and realization of pending goals, projects, and career milestones.`, source: sourceLabel }
    );
    if (housesRuled.includes(6)) {
      primaryThemes.push({
        topic: "Gains from Work & Resolution",
        description: `Positive returns and recognition arising from daily work, service commitments, competition, or resolution of pending disputes.`,
        source: `${sourceLabel} (6th Lord in 11th)`,
      });
    }
  } else if (transitHouse === 10) {
    primaryThemes.push(
      { topic: "Career Momentum & Status", description: `Elevation in professional standing, public recognition, and career visibility.`, source: sourceLabel },
      { topic: "Leadership & Responsibility", description: `Opportunities to lead initiatives, present key work, and gain authority.`, source: sourceLabel }
    );
  } else if (transitHouse === 4) {
    primaryThemes.push(
      { topic: "Domestic Comfort & Peace", description: `Focus on home stability, property matters, vehicles, and inner emotional grounding.`, source: sourceLabel },
      { topic: "Foundational Security", description: `Building a stable environment and consolidating core personal assets.`, source: sourceLabel }
    );
  } else {
    // General house primary themes
    houseMeta.primary.forEach(item => {
      primaryThemes.push({
        topic: item.charAt(0).toUpperCase() + item.slice(1),
        description: `${transitingPlanet}'s transit through the ${transitHouse}th house activates ${item}.`,
        source: sourceLabel,
      });
    });
  }

  // ── 2. SECONDARY Themes (Natural Significances) ─────────────────────────────
  const secondaryThemes: TransitTheme[] = [];
  naturalSig.primary.forEach(sig => {
    secondaryThemes.push({
      topic: sig.charAt(0).toUpperCase() + sig.slice(1),
      description: `${transitingPlanet}'s natural signification of ${sig} harmonizes with the ${transitHouse}th house themes.`,
      source: `Natural Signification of ${transitingPlanet}`,
    });
  });

  // ── 3. CONDITIONAL Themes (Requires Explicit Astrological Causal Support) ─────
  const conditionalThemes: TransitTheme[] = [];

  // Communication negative warning causal check:
  // ONLY IF 3rd house is transited OR 3rd house/Mercury is explicitly afflicted
  if (transitHouse === 3 || options.thirdHouseAfflicted) {
    conditionalThemes.push({
      topic: "Communication Focus",
      description: "Pay attention to clarity in written and spoken communications to avoid misunderstandings.",
      source: "3rd House / Mercury Causal Mechanism Active",
    });
    reasoningTrace.push("5. Communication theme included because 3rd house / Mercury mechanism is explicitly active.");
  } else {
    reasoningTrace.push("5. Communication warning SUPPRESSED — no 3rd house/Mercury affliction present.");
  }

  // Relationship friction causal check:
  if (transitHouse === 7 || options.seventhHouseAfflicted) {
    conditionalThemes.push({
      topic: "Relational Dynamics",
      description: "Navigating interpersonal expectations and maintaining patience during discussions.",
      source: "7th House Causal Mechanism Active",
    });
  }

  // ── 4. ADVISORY Themes (Practical Advice — Separated from Predictions) ──────
  const advisoryThemes: TransitTheme[] = [
    {
      topic: "Practical Focus",
      description: isDignityStrong
        ? "Leverage this supportive window to consolidate network connections and execute planned initiatives."
        : "Maintain steady discipline, document agreements, and avoid rushing outcomes.",
      source: "Practical Advisory Guidance",
    },
    {
      topic: "Strategic Communication",
      description: "Present work clearly and keep stakeholders updated on progress.",
      source: "Practical Advisory Guidance",
    },
  ];

  // ── 5. Dasha Interaction ───────────────────────────────────────────────────
  let dashaInteraction: DashaAssessment | undefined;
  if (options.dashaInfo) {
    const md = options.dashaInfo.mahadasha;
    const ad = options.dashaInfo.antardasha;
    const dashaSameDomain = housesRuled.includes(10) || housesRuled.includes(11) || housesRuled.includes(1);
    const alignment: DashaAssessment["alignment"] = dashaSameDomain ? "supported" : "neutral";

    dashaInteraction = {
      mahadasha: md,
      antardasha: ad,
      alignment,
      notes: alignment === "supported"
        ? `The active ${md}/${ad} dasha period reinforces the ${transitHouse}th house transit objectives.`
        : `The active ${md}/${ad} dasha operates alongside this transit, providing steady baseline support.`,
    };
    reasoningTrace.push(`6. Dasha interaction: ${md}/${ad} (${alignment})`);
  }

  // Confidence & Verdict
  const confidence = isDignityStrong ? "high" : isDignityWeak ? "medium" : "high";
  const overallVerdict =
    isDignityStrong && (transitHouse === 11 || transitHouse === 10 || transitHouse === 1) ? "Highly Supportive"
    : isDignityStrong ? "Supportive"
    : isDignityWeak ? "Mixed"
    : "Moderately Supportive";

  return {
    chart: {
      ascendant,
      ascendantName: lordship.lagnaSignName,
      lagnaLord: lordship.lagnaLord,
    },
    transit: {
      planet: transitingPlanet,
      sign: transitSign,
      signName: dignityInfo.signName,
      house: transitHouse,
    },
    planetRole: {
      housesRuled,
      signDignity: dignityInfo.condition.signDignity,
      planetaryCondition: dignityInfo.condition,
      stateDescription: dignityInfo.description,
    },
    themes: {
      primary: primaryThemes,
      secondary: secondaryThemes,
      conditional: conditionalThemes,
      advisory: advisoryThemes,
    },
    supportingFactors,
    cautionFactors,
    dashaInteraction,
    confidence,
    overallVerdict,
    reasoningTrace,
  };
}
