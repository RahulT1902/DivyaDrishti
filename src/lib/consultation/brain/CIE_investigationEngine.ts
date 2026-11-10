// Chart Investigation Engine (CIE)
//
// Architecture principle: an astrologer investigates before speaking.
// The engine determines which divisional charts, houses, planets, dashas, yogas,
// and transit evidence are relevant for the question — gathers it all — then
// produces an InvestigationReport BEFORE the LLM is invoked.
//
// The LLM receives the report and narrates it.
// It must NEVER decide which charts to examine — the engine decides.
// It must NEVER fabricate evidence beyond what the engine collected.
//
// Flow:
//   domain + AstrologyContext → Investigation Plan → Evidence Collection →
//   Reasoning Synthesis → InvestigationReport → renderInvestigationReport →
//   prepended to system prompt (before DIAGNOSIS block)

import type { AstrologyContext, DashaInfo, PlanetName, Sign, ChartType, DivisionalChart } from "../../core/types";
import type { ChartData } from "./DIE_domainInterpreter";
import { interpretChartTransit, type TransitInterpretationAudit } from "../../core/transit-engine/chartTransitInterpreter";
import { getHouseLord } from "../../core/astrology/lordshipEngine";

// ── Chart Intelligence Matrix ─────────────────────────────────────────────────
// Maps domain → which charts, which houses, and which planets to examine.
// Lives in CODE. Never shown to the LLM.

export interface InvestigationRequirements {
  charts:  Array<"D1" | "D9" | "D10" | "D2" | "D4" | "D12" | "D24">;
  houses:  number[];     // key houses in D1 to evaluate
  planets: PlanetName[]; // key planets for this domain (ordered by importance)
}

export const CHART_INTELLIGENCE_MATRIX: Record<string, InvestigationRequirements> = {
  health: {
    charts:  ["D1"],
    houses:  [1, 6, 8, 12],     // lagna, disease/chronic house, longevity, loss-of-health
    planets: ["Moon", "Sun", "Saturn", "Mars"],
  },
  career: {
    charts:  ["D1", "D10"],
    houses:  [10, 6, 2, 11],    // career, service/daily work, income, gains
    planets: ["Sun", "Saturn", "Jupiter", "Mercury"],
  },
  finance: {
    charts:  ["D1", "D2"],
    houses:  [2, 11, 5, 9],     // accumulated wealth, gains, speculation, fortune
    planets: ["Jupiter", "Venus", "Mercury", "Moon"],
  },
  property: {
    charts:  ["D1", "D4"],
    houses:  [4, 2, 11, 8],     // home, land and vehicles; savings; gains; loans and inheritance
    planets: ["Mars", "Venus", "Moon", "Saturn"],
  },
  family: {
    charts:  ["D1", "D12"],
    houses:  [4, 9, 3, 2],      // mother and home; father; siblings; family unit
    planets: ["Moon", "Sun", "Mars", "Jupiter"],
  },
  relationship: {
    charts:  ["D1", "D9"],
    houses:  [7, 4, 2, 11],     // partner, happiness/home, family, fulfillment
    planets: ["Venus", "Moon", "Jupiter", "Mars"],
  },
  education: {
    charts:  ["D1", "D24"],
    houses:  [4, 5, 9],         // learning, creativity, higher education
    planets: ["Mercury", "Jupiter", "Moon", "Saturn"],
  },
  spirituality: {
    charts:  ["D1"],
    houses:  [9, 12, 5],        // dharma, moksha, devotion
    planets: ["Jupiter", "Ketu", "Saturn"],
  },
  general: {
    charts:  ["D1"],
    houses:  [1, 10],
    planets: ["Sun", "Moon", "Saturn"],
  },
};

// ── Evidence types ────────────────────────────────────────────────────────────

export interface EvidenceItem {
  id:           string;
  label:        string;
  finding:      string;
  weight:       number;    // 0–100; higher = more decisive
  direction:    "supporting" | "challenging" | "neutral";
  source:       "D1" | "D9" | "D10" | "D2" | "D4" | "D12" | "D24" | "Dasha" | "Transit" | "Yoga" | "Inference" | "Profile";
  temporalRole: "background" | "medium_term" | "short_term";
  factIds:      string[];  // Root fact IDs e.g. ["D1:houseLord:10:Jupiter", "D1:placement:Jupiter:5"]
}

export interface ScoreBreakdownItem {
  id:           string;
  factor:       string;
  category:
    | "D1_Foundation"
    | "Dasha_Background"
    | "Transit_Trigger"
    | "D10_Confirmation"
    | "Yoga_Promise";
  direction:    "supporting" | "challenging" | "neutral";
  points:       number;    // Signed delta e.g. +12, -7
  rationale:    string;
  evidenceIds:  string[];
  temporalRole: "background" | "medium_term" | "short_term";
  provenance: {
    source:  "D1" | "Dasha" | "Transit" | "D10" | "Yoga";
    factIds: string[];
  };
}

export interface ScoreExplanation {
  baseline:           number;  // Always 50
  netEvidenceDelta:   number;  // Sum of breakdown points
  rawSignalScore:     number;  // baseline + netEvidenceDelta
  signalStrength:     number;  // Clamped 0-100
  rawD10Delta:        number;  // Unbounded D10 sum
  boundedD10Delta:    number;  // Capped at net ±15 max
  breakdown:          ScoreBreakdownItem[];
}

export interface ReasoningStep {
  step:   number;
  claim:  string;
}

export interface InvestigationReport {
  domain:           string;
  chartsExamined:   string[];
  evidence:         EvidenceItem[];
  reasoning:        ReasoningStep[];
  conclusion: {
    overallScore:   number;   // 0–100 Signal Strength
    timeline:       string | null;
    keyPlanet:      PlanetName | null;
    confidence:     "high" | "medium" | "low"; // Calculation Confidence
  };
  scoreExplanation?: ScoreExplanation;
  transitAudit?:     TransitInterpretationAudit;
}

// ── Planet → Domain role descriptions ────────────────────────────────────────

const PLANET_DOMAIN_ROLE: Record<string, Partial<Record<PlanetName, string>>> = {
  career:       { Sun: "authority and recognition", Saturn: "persistence and career structure", Jupiter: "wisdom and growth", Mercury: "intellect and communication" },
  health:       { Moon: "cold sensitivity and emotional health", Sun: "vitality and immunity", Saturn: "chronic issues and bones", Mars: "heat and inflammation" },
  finance:      { Jupiter: "wealth and fortune", Venus: "material gains", Mercury: "trade and business", Moon: "cash flow and liquidity" },
  relationship: { Venus: "love and partnership", Moon: "emotional bonding", Jupiter: "commitment and wisdom", Mars: "passion and conflict risk" },
  education:    { Mercury: "intellect and retention", Jupiter: "higher learning and wisdom", Venus: "creativity and arts" },
  spirituality: { Jupiter: "dharma and divine grace", Ketu: "detachment and liberation", Saturn: "discipline and austerity" },
};

// ── Transit domain name map (TransitEvidence.domain is capitalized) ───────────

const TRANSIT_DOMAIN_KEY: Record<string, string> = {
  health: "Health", career: "Career", finance: "Wealth",
  relationship: "Marriage", education: "Education", spirituality: "Spirituality", general: "General",
};

// ── Dasha favorability by domain ──────────────────────────────────────────────

const DASHA_BENEFIC: Record<string, PlanetName[]> = {
  career:       ["Sun", "Mars", "Jupiter", "Saturn", "Mercury"],
  health:       ["Moon", "Sun", "Jupiter", "Venus"],
  finance:      ["Jupiter", "Venus", "Mercury", "Moon"],
  relationship: ["Venus", "Moon", "Jupiter"],
  education:    ["Mercury", "Jupiter", "Venus"],
  spirituality: ["Jupiter", "Ketu", "Saturn"],
  general:      ["Jupiter", "Venus", "Mercury"],
};

const DASHA_MALEFIC: Record<string, PlanetName[]> = {
  career:       ["Ketu", "Rahu"],
  health:       ["Saturn", "Rahu", "Ketu", "Mars"],
  finance:      ["Saturn", "Rahu", "Ketu"],
  relationship: ["Saturn", "Rahu", "Ketu", "Mars"],
  spirituality: [],
};

// ── Evidence collectors ───────────────────────────────────────────────────────

function collectD1Evidence(
  ctx:    AstrologyContext,
  houses: number[],
  planets: PlanetName[],
  domain: string,
): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const d1 = ctx.chartSuite.D1;

  // 1. Key planets found in key houses
  for (const house of houses.slice(0, 3)) {
    const h = d1.houses.find(h => h.number === house);
    if (!h || h.planets.length === 0) continue;

    for (const planet of h.planets) {
      if (!planets.includes(planet as PlanetName)) continue;

      const pStr = ctx.planetStrengths.find(s => s.planet === planet);
      const strength = pStr?.overallStrength ?? 50;
      const sthanaBala = pStr?.components.sthanaBala ?? 50;

      const isExalted     = sthanaBala >= 95;
      const isOwnSign     = sthanaBala >= 80 && sthanaBala < 95;
      const isDebilitated = sthanaBala < 20;

      const dignityLabel = isExalted ? "exalted" : isOwnSign ? "in own sign" : isDebilitated ? "debilitated" : "";
      const direction: EvidenceItem["direction"] = isExalted || isOwnSign || strength >= 65 ? "supporting"
        : isDebilitated || strength < 35 ? "challenging" : "neutral";

      const role = PLANET_DOMAIN_ROLE[domain]?.[planet as PlanetName] ?? "domain influence";
      const dignityPart = dignityLabel ? ` (${dignityLabel})` : "";
      const finding = direction === "supporting"
        ? `${planet}${dignityPart} in ${house}th house — ${role} is elevated`
        : direction === "challenging"
        ? `${planet}${dignityPart} in ${house}th house — ${role} under pressure`
        : `${planet} in ${house}th house — ${role} is moderate`;

      items.push({
        id:           `ev_D1_h${house}_${planet}`,
        label:        `D1 House ${house}`,
        finding,
        weight:       Math.abs(strength - 50) + 20,
        direction,
        source:       "D1",
        temporalRole: "background",
        factIds:      [`D1:placement:${planet}:${house}`, `D1:planetDignity:${planet}`],
      });
    }
  }

  // 2. Lords of top key houses — good or bad placement
  for (const houseNum of houses.slice(0, 3)) {
    const lordRec = d1.lords.find(l => l.house === houseNum);
    if (!lordRec) continue;

    const placed = lordRec.lordPlacedInHouse;
    const lordName = lordRec.lord;

    if (houseNum === 6) {
      // 6th lord is a contextual signal (service, competition, workload, problem-solving, overcoming opposition)
      const isExalted = lordRec.isExalted;
      const isDebilitated = lordRec.isDebilitated;
      const isOwnSign = lordRec.isInOwnHouse;

      let direction: EvidenceItem["direction"] = "neutral";
      let weight = 30;

      if (isExalted || isOwnSign) {
        direction = "supporting";
        weight = 45;
      } else if (isDebilitated || [8, 12].includes(placed)) {
        direction = "challenging";
        weight = 45;
      }

      items.push({
        id:           `ev_D1_lord_6_${lordName}`,
        label:        `D1 6th lord (${lordName})`,
        finding:      `6th lord ${lordName} is in house ${placed} — connects employment/service, competition, responsibilities and problem-solving with house ${placed} matters; its career effect depends on ${lordName}'s overall condition`,
        weight,
        direction,
        source:       "D1",
        temporalRole: "background",
        factIds:      [`D1:houseLord:6:${lordName}`, `D1:lordPlacement:${lordName}:${placed}`],
      });
      continue;
    }

    const goodHouses = [1, 2, 4, 5, 7, 9, 10, 11];
    const badHouses  = [6, 8, 12];
    const isGood     = lordRec.isExalted || lordRec.isInOwnHouse || goodHouses.includes(placed);
    const isBad      = lordRec.isDebilitated || badHouses.includes(placed);

    if (!isGood && !isBad) continue;

    const dignityNote = lordRec.isExalted ? "exalted" : lordRec.isInOwnHouse ? "in own sign" : lordRec.isDebilitated ? "debilitated" : `in house ${placed}`;
    const direction: EvidenceItem["direction"] = isGood && !lordRec.isDebilitated ? "supporting" : "challenging";
    const weight = lordRec.isExalted || lordRec.isDebilitated ? 70 : 45;

    items.push({
      id:           `ev_D1_lord_${houseNum}_${lordName}`,
      label:        `D1 ${houseNum}th lord (${lordName})`,
      finding:      `D1 ${houseNum}th lord (${lordName}) is ${dignityNote} — ${direction === "supporting" ? "supports" : "creates friction in"} ${domain} outcomes`,
      weight,
      direction,
      source:       "D1",
      temporalRole: "background",
      factIds:      [`D1:houseLord:${houseNum}:${lordName}`, `D1:lordPlacement:${lordName}:${placed}`],
    });
  }

  return items;
}

function collectDivisionalEvidence(
  ctx:      AstrologyContext,
  chart:    "D9" | "D10" | "D2" | "D4" | "D12" | "D24",
  domain:   string,
  planets:  PlanetName[],
): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const dc: DivisionalChart | undefined = ctx.chartSuite[chart];
  if (!dc || dc.metadata.source === "Placeholder") return items;

  // Primary house for each divisional chart's domain focus
  const PRIMARY_HOUSE: Record<string, number> = { D10: 10, D9: 7, D2: 2, D4: 4, D12: 4, D24: 4 };
  const primaryHouse = PRIMARY_HOUSE[chart] ?? 1;

  const h = dc.houses.find(h => h.number === primaryHouse);
  if (h) {
    for (const planet of h.planets) {
      const pStr = ctx.planetStrengths.find(s => s.planet === planet);
      const strength = pStr?.overallStrength ?? 50;
      const direction: EvidenceItem["direction"] = strength >= 60 ? "supporting" : strength < 40 ? "challenging" : "neutral";

      items.push({
        id:           `ev_${chart}_${primaryHouse}_${planet}`,
        label:        `${chart} ${primaryHouse}th house`,
        finding:      `${planet} in ${primaryHouse}th house of ${chart} — ${strength >= 65 ? "strong" : strength >= 45 ? "moderate" : "weak"} position in ${domain} divisional chart`,
        weight:       Math.abs(strength - 50) + 30,
        direction,
        source:       chart,
        temporalRole: "background",
        factIds:      [`${chart}:placement:${planet}:${primaryHouse}`],
      });
    }
  }

  // Lord of primary house in divisional chart
  const lordRec = dc.lords.find(l => l.house === primaryHouse);
  if (lordRec) {
    const placed   = lordRec.lordPlacedInHouse;
    const isGood   = lordRec.isExalted || lordRec.isInOwnHouse || [1, 2, 4, 5, 7, 9, 10, 11].includes(placed);
    const isBad    = lordRec.isDebilitated || [6, 8, 12].includes(placed);
    if (isGood || isBad) {
      const dignityNote = lordRec.isExalted ? "exalted" : lordRec.isInOwnHouse ? "in own sign" : lordRec.isDebilitated ? "debilitated" : `in house ${placed}`;
      const direction: EvidenceItem["direction"] = isGood && !lordRec.isDebilitated ? "supporting" : "challenging";
      items.push({
        id:           `ev_${chart}_lord_${primaryHouse}_${lordRec.lord}`,
        label:        `${chart} ${primaryHouse}th lord (${lordRec.lord})`,
        finding:      `${chart} ${primaryHouse}th lord ${lordRec.lord} is ${dignityNote} in ${chart} — ${direction === "supporting" ? "supports" : "creates friction in"} ${domain} outcomes`,
        weight:       lordRec.isExalted || lordRec.isDebilitated ? 70 : 50,
        direction,
        source:       chart,
        temporalRole: "background",
        factIds:      [`${chart}:houseLord:${primaryHouse}:${lordRec.lord}`],
      });
    }
  }

  return items;
}

function collectPlanetStrengthEvidence(
  ctx:     AstrologyContext,
  planets: PlanetName[],
  domain:  string,
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const planet of planets.slice(0, 3)) {
    const pStr = ctx.planetStrengths.find(s => s.planet === planet);
    if (!pStr) continue;

    const s = pStr.overallStrength;
    if (s >= 68 || s < 35) {
      const role = PLANET_DOMAIN_ROLE[domain]?.[planet] ?? `${planet}'s natural strength`;
      const finding = s >= 68
        ? `${planet} is strong (${Math.round(s)}/100) — ${role} is elevated`
        : `${planet} is weakened (${Math.round(s)}/100) — ${role} may be compromised`;
      items.push({
        id:           `ev_D1_strength_${planet}`,
        label:        `${planet} strength`,
        finding,
        weight:       Math.abs(s - 50) + 10,
        direction:    s >= 65 ? "supporting" : "challenging",
        source:       "D1",
        temporalRole: "background",
        factIds:      [`D1:planetStrength:${planet}`],
      });
    }
  }

  return items;
}

function collectDashaEvidence(
  dasha:  DashaInfo | undefined,
  domain: string,
): EvidenceItem[] {
  if (!dasha) return [];

  const benefics = DASHA_BENEFIC[domain] ?? [];
  const malefics = DASHA_MALEFIC[domain] ?? [];

  const items: EvidenceItem[] = [];

  const mahaGood = benefics.includes(dasha.mahadasha);
  const mahaBad  = malefics.includes(dasha.mahadasha);
  if (mahaGood || mahaBad) {
    items.push({
      id:           `ev_Dasha_Maha_${dasha.mahadasha}`,
      label:        `Mahadasha (${dasha.mahadasha})`,
      finding:      mahaGood
        ? `${dasha.mahadasha} mahadasha is favorable for ${domain} — the major period supports this area`
        : `${dasha.mahadasha} mahadasha creates friction for ${domain} — the major period is challenging`,
      weight:       70,
      direction:    mahaGood ? "supporting" : "challenging",
      source:       "Dasha",
      temporalRole: "background",
      factIds:      [`Dasha:mahadasha:${dasha.mahadasha}`],
    });
  }

  const antarGood = benefics.includes(dasha.antardasha);
  const antarBad  = malefics.includes(dasha.antardasha);
  if (antarGood || antarBad) {
    items.push({
      id:           `ev_Dasha_Antar_${dasha.antardasha}`,
      label:        `Antardasha (${dasha.antardasha})`,
      finding:      antarGood
        ? `${dasha.antardasha} antardasha supports ${domain} — sub-period timing is favorable`
        : `${dasha.antardasha} antardasha adds friction for ${domain} — sub-period creates resistance`,
      weight:       55,
      direction:    antarGood ? "supporting" : "challenging",
      source:       "Dasha",
      temporalRole: "medium_term",
      factIds:      [`Dasha:antardasha:${dasha.antardasha}`],
    });
  }

  return items;
}

function collectTransitEvidence(
  ctx:    AstrologyContext,
  domain: string,
): EvidenceItem[] {
  const domainKey = TRANSIT_DOMAIN_KEY[domain] ?? "General";
  const relevant  = (ctx.transit ?? []).filter(t => t.domain === domainKey || t.domain === "General");

  return relevant
    .sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta))
    .slice(0, 3)
    .filter(t => Math.abs(t.scoreDelta) >= 8)
    .map(t => ({
      id:           `ev_Transit_${t.planet}`,
      label:        `Transit ${t.planet}`,
      finding:      `${t.planet} transit ${t.scoreDelta > 0 ? "supporting" : "challenging"} ${domain} area (${t.scoreDelta > 0 ? "+" : ""}${t.scoreDelta} shift in ${domain} sensitivity)`,
      weight:       Math.min(60, Math.abs(t.scoreDelta) * 2),
      direction:    t.scoreDelta > 10 ? "supporting" : t.scoreDelta < -10 ? "challenging" : ("neutral" as const),
      source:       "Transit" as const,
      temporalRole: ["Moon", "Mercury", "Venus", "Sun", "Mars"].includes(t.planet) ? ("short_term" as const) : ("medium_term" as const),
      factIds:      [`Transit:house:${t.planet}:${t.natalHouse}`, `Transit:planet:${t.planet}`],
    }));
}

function collectYogaEvidence(
  ctx:    AstrologyContext,
  domain: string,
): EvidenceItem[] {
  const domainKey = TRANSIT_DOMAIN_KEY[domain] ?? domain;

  return ctx.yogaAnalysis.birthPromises
    .filter(y => y.affectedDomains.includes(domainKey) && y.birthStrength >= 50)
    .slice(0, 2)
    .map(yoga => {
      const activation     = ctx.yogaAnalysis.activations.find(a => a.yogaId === yoga.id);
      const activationScore = activation?.activationScore ?? yoga.birthStrength;
      const isActive       = activation?.status === "Active" || activation?.status === "Peak";

      return {
        id:           `ev_Yoga_${yoga.id}`,
        label:        yoga.name,
        finding:      isActive
          ? `${yoga.name} yoga is active (${Math.round(activationScore)}% activation) — ${yoga.description}`
          : `${yoga.name} yoga is present in natal chart (${Math.round(yoga.birthStrength)}% strength, dormant this period)`,
        weight:       isActive ? 65 : 30,
        direction:    isActive ? ("supporting" as const) : ("neutral" as const),
        source:       "Yoga" as const,
        temporalRole: "background" as const,
        factIds:      [`Yoga:natal:${yoga.id}`],
      };
    });
}

function collectInferenceEvidence(
  ctx:    AstrologyContext,
  domain: string,
): EvidenceItem[] {
  const domainKey = TRANSIT_DOMAIN_KEY[domain] ?? domain;

  return ctx.inferences
    .filter(inf => inf.domain === domainKey && inf.confidence > 62)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((inf, idx) => ({
      id:           `ev_Inference_${idx}`,
      label:        "Chart rule",
      finding:      `${inf.statement} (${Math.round(inf.confidence)}% confidence)`,
      weight:       Math.round(inf.confidence * 0.65),
      direction:    inf.direction === "Positive" ? ("supporting" as const) : inf.direction === "Negative" ? ("challenging" as const) : ("neutral" as const),
      source:       "Inference" as const,
      temporalRole: "background" as const,
      factIds:      [`Inference:${domain}:${idx}`],
    }));
}

function collectHealthProfileEvidence(chartData: ChartData): EvidenceItem[] {
  if (!chartData.healthFindings) return [];

  const hf    = chartData.healthFindings;
  const items: EvidenceItem[] = [];

  if (hf.primaryFocus) {
    const score = hf.primaryFocus.score;
    items.push({
      id:           `ev_Profile_Primary_${hf.primaryFocus.displayName}`,
      label:        `Primary sensitivity (${hf.primaryFocus.displayName})`,
      finding:      score >= 65
        ? `${hf.primaryFocus.displayName} is under significant stress (${score}/100) — primary area to watch`
        : score >= 52
        ? `${hf.primaryFocus.displayName} is mildly sensitive (${score}/100) — worth monitoring`
        : `${hf.primaryFocus.displayName} is stable (${score}/100) — no concern`,
      weight:       score >= 65 ? 75 : score >= 52 ? 50 : 20,
      direction:    score >= 65 ? "challenging" : score >= 52 ? "neutral" : "supporting",
      source:       "Profile",
      temporalRole: "background",
      factIds:      [`Profile:health:${hf.primaryFocus.displayName}`],
    });
  }

  if (hf.secondaryFocus) {
    items.push({
      id:           `ev_Profile_Secondary_${hf.secondaryFocus.displayName}`,
      label:        `Secondary sensitivity (${hf.secondaryFocus.displayName})`,
      finding:      `${hf.secondaryFocus.displayName} is also active (${hf.secondaryFocus.score}/100) — secondary area`,
      weight:       45,
      direction:    "challenging",
      source:       "Profile",
      temporalRole: "background",
      factIds:      [`Profile:health:${hf.secondaryFocus.displayName}`],
    });
  }

  return items;
}

// ── Reasoning synthesis ───────────────────────────────────────────────────────

function buildReasoning(
  domain:   string,
  evidence: EvidenceItem[],
  score:    number,
  dasha:    DashaInfo | undefined,
): ReasoningStep[] {
  const steps: ReasoningStep[] = [];
  let n = 1;

  const supporting  = evidence.filter(e => e.direction === "supporting");
  const challenging = evidence.filter(e => e.direction === "challenging");

  // Lead with strongest supporting evidence
  if (supporting[0]) {
    steps.push({ step: n++, claim: supporting[0].finding });
  }
  if (supporting[1]) {
    steps.push({ step: n++, claim: supporting[1].finding });
  }

  // Primary friction
  if (challenging[0]) {
    steps.push({ step: n++, claim: `Friction: ${challenging[0].finding}` });
  }

  // Domain-specific synthesis conclusion
  const SYNTH: Record<string, (s: number, d: DashaInfo | undefined) => string> = {
    career: (s, d) => s >= 68
      ? `Timing looks favorable — ${d ? d.mahadasha + " mahadasha supports career momentum" : "chart supports career momentum now"}`
      : s >= 52
      ? "Career is stable but not a breakthrough moment — consistent effort over pushing hard"
      : "This is a consolidation phase — avoid forcing outcomes; build, don't push",
    health: (s) => s >= 68
      ? "Body is under real stress — rest and care matter more than pushing through"
      : s >= 52
      ? "Mild sensitivity — precautions help; nothing serious unless neglected"
      : "Health looks clear — no significant astrological sensitivity today",
    finance: (s) => s >= 68
      ? "Financial picture is favorable for planned decisions you've been considering"
      : s >= 50
      ? "Steady phase — small and safe moves; not the moment for large bets"
      : "Protective phase — focus on what you have, not what you might gain",
    relationship: (s) => s >= 65
      ? "Relationship energy is warm — good time for meaningful connection"
      : s >= 45
      ? "Communication needs patience — don't escalate small friction"
      : "Tension is present — give the other person space before important conversations",
  };

  const synth = SYNTH[domain]?.(score, dasha)
    ?? `${domain} is in ${score >= 65 ? "a favorable" : score >= 50 ? "a moderate" : "a challenging"} phase`;
  steps.push({ step: n, claim: synth });

  return steps;
}

// ── Main function ─────────────────────────────────────────────────────────────

export function runInvestigation(
  domain:    string,
  ctx:       AstrologyContext,
  dashaInfo: DashaInfo | undefined,
  chartData: ChartData,
  question?: string,
): InvestigationReport {
  const req = CHART_INTELLIGENCE_MATRIX[domain] ?? CHART_INTELLIGENCE_MATRIX.general;

  // Collect evidence from all sources
  const raw: EvidenceItem[] = [
    ...collectD1Evidence(ctx, req.houses, req.planets, domain),
    ...(req.charts.includes("D10") ? collectDivisionalEvidence(ctx, "D10", domain, req.planets) : []),
    ...(req.charts.includes("D9")  ? collectDivisionalEvidence(ctx, "D9",  domain, req.planets) : []),
    ...(req.charts.includes("D2")  ? collectDivisionalEvidence(ctx, "D2",  domain, req.planets) : []),
    ...(req.charts.includes("D4")  ? collectDivisionalEvidence(ctx, "D4",  domain, req.planets) : []),
    ...(req.charts.includes("D12") ? collectDivisionalEvidence(ctx, "D12", domain, req.planets) : []),
    ...(req.charts.includes("D24") ? collectDivisionalEvidence(ctx, "D24", domain, req.planets) : []),
    ...collectPlanetStrengthEvidence(ctx, req.planets, domain),
    ...collectDashaEvidence(dashaInfo, domain),
    ...collectTransitEvidence(ctx, domain),
    ...collectYogaEvidence(ctx, domain),
    ...collectInferenceEvidence(ctx, domain),
    ...(domain === "health" ? collectHealthProfileEvidence(chartData) : []),
  ];

  // Provenance-based Deduplication (group by primary factId to prevent double-counting)
  const seenFacts = new Map<string, EvidenceItem>();
  for (const item of raw) {
    const primaryFactId = item.factIds[0] ?? item.finding.slice(0, 60);
    const existing = seenFacts.get(primaryFactId);
    if (!existing || item.weight > existing.weight) {
      seenFacts.set(primaryFactId, item);
    }
  }

  // Sort deduplicated evidence by weight and take top 8
  const evidence = [...seenFacts.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  // Formulate auditable ScoreBreakdownItems
  const rawBreakdown: ScoreBreakdownItem[] = [];
  let rawD10Delta = 0;

  for (const item of evidence) {
    const category: ScoreBreakdownItem["category"] =
      item.source === "D1" || item.source === "Inference" || item.source === "Profile" ? "D1_Foundation"
      : item.source === "Dasha" ? "Dasha_Background"
      : item.source === "Transit" ? "Transit_Trigger"
      : item.source === "Yoga" ? "Yoga_Promise"
      : "D10_Confirmation";

    let rawPoints = item.direction === "supporting" ? Math.round((item.weight / 100) * 16)
      : item.direction === "challenging" ? -Math.round((item.weight / 100) * 16)
      : 0;

    if (category === "D10_Confirmation") {
      rawD10Delta += rawPoints;
    }

    rawBreakdown.push({
      id: `sb_${item.id}`,
      factor: item.label,
      category,
      direction: item.direction,
      points: rawPoints,
      rationale: item.finding,
      evidenceIds: [item.id],
      temporalRole: item.temporalRole,
      provenance: {
        source: item.source === "D9" || item.source === "D10" || item.source === "D2" ? (item.source as any) : (item.source as any),
        factIds: item.factIds,
      },
    });
  }

  // Net D10 Aggregate Capping: ABS(total D10 contribution) <= 15
  const boundedD10Delta = Math.max(-15, Math.min(15, rawD10Delta));
  const d10Ratio = rawD10Delta !== 0 ? boundedD10Delta / rawD10Delta : 1;

  const breakdown: ScoreBreakdownItem[] = rawBreakdown.map(item => {
    if (item.category === "D10_Confirmation") {
      return { ...item, points: Math.round(item.points * d10Ratio) };
    }
    return item;
  });

  const netEvidenceDelta = breakdown.reduce((sum, item) => sum + item.points, 0);
  const baseline = 50;
  const rawSignalScore = baseline + netEvidenceDelta;
  const signalStrength = Math.max(0, Math.min(100, Math.round(rawSignalScore)));
  const overallScore = signalStrength;

  const scoreExplanation: ScoreExplanation = {
    baseline,
    netEvidenceDelta,
    rawSignalScore,
    signalStrength,
    rawD10Delta,
    boundedD10Delta,
    breakdown,
  };

  // Timeline — only when there's active transit or favorable dasha
  const hasActiveTransit = evidence.some(e => e.source === "Transit" && e.direction === "supporting");
  const hasDashaSupport  = evidence.some(e => e.source === "Dasha"   && e.direction === "supporting");

  const timeline: string | null =
    domain === "health"  ? null :   // health uses its own timeline in DIAGNOSIS
    overallScore >= 68 && hasActiveTransit ? "next 2–4 weeks" :
    overallScore >= 60 && hasDashaSupport  ? "next 1–2 months" :
    overallScore >= 50                     ? "next 3–6 months" : null;

  // Key planet — prefer dasha planet if favorable, else top supporting chart planet
  const dashaSupport = evidence.find(e => e.source === "Dasha" && e.direction === "supporting");
  const keyPlanet: PlanetName | null = dashaInfo?.mahadasha
    ?? dashaSupport?.label?.match(/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/)?.[1] as PlanetName | null
    ?? null;

  const confidence: "high" | "medium" | "low" =
    evidence.length >= 5 ? "high" : evidence.length >= 3 ? "medium" : "low";

  // Charts actually used
  const chartKeysUsed = new Set<string>(["D1", "Dasha", "Transit"]);
  if (req.charts.includes("D10") && ctx.chartSuite.D10.metadata.source !== "Placeholder") chartKeysUsed.add("D10");
  if (req.charts.includes("D9")  && ctx.chartSuite.D9.metadata.source  !== "Placeholder") chartKeysUsed.add("D9");
  if (req.charts.includes("D2")  && ctx.chartSuite.D2.metadata.source  !== "Placeholder") chartKeysUsed.add("D2");
  if (req.charts.includes("D4")  && ctx.chartSuite.D4.metadata.source  !== "Placeholder") chartKeysUsed.add("D4");
  if (req.charts.includes("D12") && ctx.chartSuite.D12.metadata.source !== "Placeholder") chartKeysUsed.add("D12");
  if (req.charts.includes("D24") && ctx.chartSuite.D24.metadata.source !== "Placeholder") chartKeysUsed.add("D24");

  const reasoning = buildReasoning(domain, evidence, overallScore, dashaInfo);

  // Generate deterministic chart transit audit
  let transitAudit: TransitInterpretationAudit | undefined;
  const ascendantSign = ctx.chartSuite?.D1?.ascendant?.sign;
  if (ascendantSign) {
    const topTransitEv = (ctx.transit ?? [])[0];
    const planetMatch = question?.match(/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/i);
    
    // Domain-aware default house lord based on natal chart
    const DOMAIN_HOUSE_MAP: Record<string, number> = {
      career: 10,
      finance: 2,
      relationship: 7,
      health: 1,
      spirituality: 9,
    };
    const targetHouse = DOMAIN_HOUSE_MAP[domain] ?? 10;
    const domainHouseLord = getHouseLord(ascendantSign, targetHouse);

    let targetPlanet: PlanetName = (planetMatch
      ? (planetMatch[1].charAt(0).toUpperCase() + planetMatch[1].slice(1).toLowerCase()) as PlanetName
      : (topTransitEv?.planet as PlanetName) ?? domainHouseLord);

    const signMatch = question?.match(/\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/i);
    const SIGN_NAME_MAP: Record<string, Sign> = {
      aries: 1, taurus: 2, gemini: 3, cancer: 4, leo: 5, virgo: 6,
      libra: 7, scorpio: 8, sagittarius: 9, capricorn: 10, aquarius: 11, pisces: 12
    };
    let transitSign: Sign = (targetPlanet === "Venus" ? 7 : targetPlanet === "Jupiter" ? 3 : targetPlanet === "Saturn" ? 11 : 7) as Sign;
    if (signMatch) {
      transitSign = SIGN_NAME_MAP[signMatch[1].toLowerCase()] ?? transitSign;
    }

    transitAudit = interpretChartTransit(ascendantSign, targetPlanet, transitSign, {
      dashaInfo: dashaInfo ? { mahadasha: dashaInfo.mahadasha, antardasha: dashaInfo.antardasha } : undefined,
    });
  }

  return {
    domain,
    chartsExamined: [...chartKeysUsed],
    evidence,
    reasoning,
    conclusion: { overallScore, timeline, keyPlanet, confidence },
    scoreExplanation,
    transitAudit,
  };
}

// ── System prompt renderer ────────────────────────────────────────────────────
// Formats the InvestigationReport as the INVESTIGATION TRAIL block that precedes
// the DIAGNOSIS block in the system prompt.

export function renderInvestigationReport(report: InvestigationReport, question: string): string {
  const lines: string[] = [
    `━━━ INVESTIGATION TRAIL (Chart Investigation Engine) ━━━`,
    `QUESTION: "${question}"`,
    `DOMAIN: ${report.domain.toUpperCase()}`,
    `CHARTS EXAMINED: ${report.chartsExamined.join(" · ")}`,
    ``,
    `EVIDENCE ASSEMBLED (do not invent findings beyond this list):`,
  ];

  for (const item of report.evidence) {
    const icon = item.direction === "supporting" ? "✓" : item.direction === "challenging" ? "✗" : "○";
    const tag  = item.direction === "supporting" ? "SUPPORTS" : item.direction === "challenging" ? "FRICTION" : "NOTE";
    lines.push(`  ${icon} [${tag}] ${item.finding} (Fact provenance: ${item.factIds.join(", ")})`);
  }

  if (report.reasoning.length > 0) {
    lines.push(``, `ENGINE REASONING:`);
    report.reasoning.forEach(r => lines.push(`  ${r.step}. ${r.claim}`));
  }

  if (report.scoreExplanation) {
    const exp = report.scoreExplanation;
    lines.push(
      ``,
      `━━━ AUDITABLE SCORE BREAKDOWN (0-100 SIGNAL STRENGTH) ━━━`,
      `NEUTRAL BASELINE: ${exp.baseline}`,
      `NET EVIDENCE DELTA: ${exp.netEvidenceDelta > 0 ? "+" : ""}${exp.netEvidenceDelta} (Sum of validated evidence items)`,
      `RAW D10 DELTA: ${exp.rawD10Delta > 0 ? "+" : ""}${exp.rawD10Delta} | BOUNDED D10 DELTA: ${exp.boundedD10Delta > 0 ? "+" : ""}${exp.boundedD10Delta} (Capped at ±15 max)`
    );
    exp.breakdown.forEach(b => {
      const pStr = b.points > 0 ? `+${b.points}` : `${b.points}`;
      lines.push(`  • [${b.category}] ${b.factor}: ${pStr} pts — ${b.rationale}`);
    });
  }

  if (report.transitAudit) {
    const audit = report.transitAudit;
    const asc = audit.chart.ascendant;
    const lord10 = getHouseLord(asc, 10);
    const lord5 = getHouseLord(asc, 5);
    const lord12 = getHouseLord(asc, 12);

    lines.push(
      ``,
      `━━━ AUTHORITATIVE NATAL HOUSE LORDS (D1) ━━━`,
      `ASCENDANT: ${audit.chart.ascendantName} (1st Lord: ${audit.chart.lagnaLord})`,
      `10TH HOUSE LORD: ${lord10}`,
      `5TH HOUSE LORD: ${lord5}`,
      `12TH HOUSE LORD: ${lord12}`,
      `(CRITICAL MANDATE: Never assign Venus to the 10th house. For ${audit.chart.ascendantName} Ascendant, ${lord10} is the 10th house lord.)`,
      ``,
      `━━━ CHART-SPECIFIC TRANSIT AUDIT (AUTHORITATIVE - DO NOT OVERRIDE) ━━━`,
      `ASCENDANT: ${audit.chart.ascendantName} (Lagna Lord: ${audit.chart.lagnaLord})`,
      `TRANSITING PLANET: ${audit.transit.planet} in ${audit.transit.signName} (House ${audit.transit.house})`,
      `PLANETARY DIGNITY: ${audit.planetRole.signDignity.toUpperCase()} (${audit.planetRole.stateDescription})`,
      `HOUSES RULED: House(s) ${audit.planetRole.housesRuled.join(", ")}`,
      `OVERALL VERDICT: ${audit.overallVerdict} (Confidence: ${audit.confidence.toUpperCase()})`,
      ``,
      `THEME HIERARCHY:`,
      `[PRIMARY THEMES - MUST LEAD READING]:`
    );
    audit.themes.primary.forEach(t => lines.push(`  • ${t.topic}: ${t.description} (Source: ${t.source})`));

    lines.push(`[SECONDARY THEMES - NATURAL PLANETARY MEANING]:`);
    audit.themes.secondary.forEach(t => lines.push(`  • ${t.topic}: ${t.description}`));

    if (audit.themes.conditional.length > 0) {
      lines.push(`[CONDITIONAL THEMES - INCLUDED WITH CAUSAL SUPPORT]:`);
      audit.themes.conditional.forEach(t => lines.push(`  • ${t.topic}: ${t.description} (Source: ${t.source})`));
    } else {
      lines.push(`[CONDITIONAL THEMES]: None supported by chart — DO NOT invent communication or relationship conflicts.`);
    }

    if (audit.themes.advisory.length > 0) {
      lines.push(`[PRACTICAL ADVISORY GUIDANCE - SEPARATED FROM PREDICTIONS]:`);
      audit.themes.advisory.forEach(t => lines.push(`  • ${t.topic}: ${t.description}`));
    }
  }

  const { overallScore, timeline, confidence } = report.conclusion;
  lines.push(
    ``,
    `SIGNAL STRENGTH: ${overallScore}/100  |  CALCULATION CONFIDENCE: ${confidence.toUpperCase()}`,
  );
  if (timeline) {
    lines.push(`TIMING WINDOW: ${timeline}`);
  }

  return lines.join("\n");
}

// ── User-facing trail renderer ────────────────────────────────────────────────
// Clean, readable version for the "Why did Pundit say this?" panel.
// No LLM instruction language — just what was examined and why.

export function renderInvestigationTrailForUser(report: InvestigationReport): string {
  const chartLabel: Record<string, string> = {
    D1: "Birth chart (D1)", D9: "Navamsa chart (D9)",
    D10: "Career chart (D10)", D2: "Wealth chart (D2)", D4: "Property chart (D4)", D12: "Parents chart (D12)", D24: "Education chart (D24)",
  };
  const chartNames = report.chartsExamined
    .map(c => chartLabel[c] ?? c)
    .join(", ");

  const supporting = report.evidence.filter(e => e.direction === "supporting").slice(0, 4);
  const challenging = report.evidence.filter(e => e.direction === "challenging").slice(0, 3);
  const notes = report.evidence.filter(e => e.direction === "neutral").slice(0, 2);

  const lines: string[] = [
    `Charts examined: ${chartNames}`,
    ``,
  ];

  if (supporting.length > 0) {
    lines.push(`What supports the reading:`);
    supporting.forEach(e => lines.push(`  ✓ ${e.finding}`));
    lines.push(``);
  }
  if (challenging.length > 0) {
    lines.push(`Tensions considered:`);
    challenging.forEach(e => lines.push(`  ✗ ${e.finding}`));
    lines.push(``);
  }
  if (notes.length > 0) {
    lines.push(`Also noted:`);
    notes.forEach(e => lines.push(`  · ${e.finding}`));
    lines.push(``);
  }

  const { overallScore, confidence, timeline } = report.conclusion;
  const exp = report.scoreExplanation;
  const netDeltaStr = exp ? ` (Base: 50 · Net Evidence: ${exp.netEvidenceDelta > 0 ? "+" : ""}${exp.netEvidenceDelta})` : "";
  const confidenceLabel = confidence === "high" ? "Calculation confidence: High"
    : confidence === "medium" ? "Calculation confidence: Medium"
    : "Calculation confidence: Low — limited chart data";
  lines.push(`Signal: ${overallScore}/100${netDeltaStr} · ${confidenceLabel}${timeline ? ` · Timing: ${timeline}` : ""}`);

  return lines.join("\n");
}
