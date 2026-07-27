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

import type { AstrologyContext, DashaInfo, PlanetName, ChartType, DivisionalChart } from "../../core/types";
import type { ChartData } from "./DIE_domainInterpreter";

// ── Chart Intelligence Matrix ─────────────────────────────────────────────────
// Maps domain → which charts, which houses, and which planets to examine.
// Lives in CODE. Never shown to the LLM.

export interface InvestigationRequirements {
  charts:  Array<"D1" | "D9" | "D10" | "D2">;
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
  relationship: {
    charts:  ["D1", "D9"],
    houses:  [7, 4, 2, 11],     // partner, happiness/home, family, fulfillment
    planets: ["Venus", "Moon", "Jupiter", "Mars"],
  },
  education: {
    charts:  ["D1"],
    houses:  [4, 5, 9],         // learning, creativity, higher education
    planets: ["Mercury", "Jupiter", "Venus"],
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
  label:     string;
  finding:   string;
  weight:    number;    // 0–100; higher = more decisive
  direction: "supporting" | "challenging" | "neutral";
  source:    "D1" | "D9" | "D10" | "D2" | "Dasha" | "Transit" | "Yoga" | "Inference" | "Profile";
}

export interface ReasoningStep {
  step:   number;
  claim:  string;
}

export interface InvestigationReport {
  domain:         string;
  chartsExamined: string[];
  evidence:       EvidenceItem[];
  reasoning:      ReasoningStep[];
  conclusion: {
    overallScore: number;   // 0–100
    probability:  number;   // 0–100
    timeline:     string | null;
    keyPlanet:    PlanetName | null;
    confidence:   "high" | "medium" | "low";
  };
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

      items.push({ label: `D1 House ${house}`, finding, weight: Math.abs(strength - 50) + 20, direction, source: "D1" });
    }
  }

  // 2. Lords of top 2 key houses — good or bad placement
  for (const houseNum of houses.slice(0, 2)) {
    const lordRec = d1.lords.find(l => l.house === houseNum);
    if (!lordRec) continue;

    const placed = lordRec.lordPlacedInHouse;
    const goodHouses = [1, 2, 4, 5, 7, 9, 10, 11];
    const badHouses  = [6, 8, 12];
    const isGood     = lordRec.isExalted || lordRec.isInOwnHouse || goodHouses.includes(placed);
    const isBad      = lordRec.isDebilitated || badHouses.includes(placed);

    if (!isGood && !isBad) continue;

    const dignityNote = lordRec.isExalted ? "exalted" : lordRec.isInOwnHouse ? "in own sign" : lordRec.isDebilitated ? "debilitated" : `in house ${placed}`;
    const direction: EvidenceItem["direction"] = isGood && !lordRec.isDebilitated ? "supporting" : "challenging";
    const weight = lordRec.isExalted || lordRec.isDebilitated ? 70 : 45;

    items.push({
      label: `${houseNum}th lord (${lordRec.lord})`,
      finding: `Lord of ${domain} house ${houseNum} (${lordRec.lord}) is ${dignityNote} — ${direction === "supporting" ? "strengthens" : "creates friction in"} ${domain} outcomes`,
      weight,
      direction,
      source: "D1",
    });
  }

  return items;
}

function collectDivisionalEvidence(
  ctx:      AstrologyContext,
  chart:    "D9" | "D10" | "D2",
  domain:   string,
  planets:  PlanetName[],
): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const dc: DivisionalChart | undefined = ctx.chartSuite[chart];
  if (!dc || dc.metadata.source === "Placeholder") return items;

  // Primary house for each divisional chart's domain focus
  const PRIMARY_HOUSE: Record<string, number> = { D10: 10, D9: 7, D2: 2 };
  const primaryHouse = PRIMARY_HOUSE[chart] ?? 1;

  const h = dc.houses.find(h => h.number === primaryHouse);
  if (h) {
    for (const planet of h.planets) {
      const pStr = ctx.planetStrengths.find(s => s.planet === planet);
      const strength = pStr?.overallStrength ?? 50;
      const direction: EvidenceItem["direction"] = strength >= 60 ? "supporting" : strength < 40 ? "challenging" : "neutral";

      items.push({
        label: `${chart} ${primaryHouse}th house`,
        finding: `${planet} in ${primaryHouse}th house of ${chart} — ${strength >= 65 ? "strong" : strength >= 45 ? "moderate" : "weak"} position in ${domain} divisional chart`,
        weight: Math.abs(strength - 50) + 30,
        direction,
        source: chart,
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
        label: `${chart} ${primaryHouse}th lord (${lordRec.lord})`,
        finding: `${chart} ${primaryHouse}th lord ${lordRec.lord} is ${dignityNote} — ${direction === "supporting" ? "solid foundation" : "friction"} in ${domain}`,
        weight: lordRec.isExalted || lordRec.isDebilitated ? 70 : 50,
        direction,
        source: chart,
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
        label: `${planet} strength`,
        finding,
        weight: Math.abs(s - 50) + 10,
        direction: s >= 65 ? "supporting" : "challenging",
        source: "D1",
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
      label: `Mahadasha (${dasha.mahadasha})`,
      finding: mahaGood
        ? `${dasha.mahadasha} mahadasha is favorable for ${domain} — the major period supports this area`
        : `${dasha.mahadasha} mahadasha creates friction for ${domain} — the major period is challenging`,
      weight: 70,
      direction: mahaGood ? "supporting" : "challenging",
      source: "Dasha",
    });
  }

  const antarGood = benefics.includes(dasha.antardasha);
  const antarBad  = malefics.includes(dasha.antardasha);
  if (antarGood || antarBad) {
    items.push({
      label: `Antardasha (${dasha.antardasha})`,
      finding: antarGood
        ? `${dasha.antardasha} antardasha supports ${domain} — sub-period timing is favorable`
        : `${dasha.antardasha} antardasha adds friction for ${domain} — sub-period creates resistance`,
      weight: 55,
      direction: antarGood ? "supporting" : "challenging",
      source: "Dasha",
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
      label:     `Transit ${t.planet}`,
      finding:   `${t.planet} transit ${t.scoreDelta > 0 ? "supporting" : "challenging"} ${domain} area (${t.scoreDelta > 0 ? "+" : ""}${t.scoreDelta} shift in ${domain} sensitivity)`,
      weight:    Math.min(60, Math.abs(t.scoreDelta) * 2),
      direction: t.scoreDelta > 10 ? "supporting" : t.scoreDelta < -10 ? "challenging" : "neutral" as const,
      source:    "Transit" as const,
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
        label:     yoga.name,
        finding:   isActive
          ? `${yoga.name} yoga is active (${Math.round(activationScore)}% activation) — ${yoga.description}`
          : `${yoga.name} yoga is present in natal chart (${Math.round(yoga.birthStrength)}% strength, dormant this period)`,
        weight:    isActive ? 65 : 30,
        direction: isActive ? "supporting" as const : "neutral" as const,
        source:    "Yoga" as const,
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
    .map(inf => ({
      label:     "Chart rule",
      finding:   `${inf.statement} (${Math.round(inf.confidence)}% confidence)`,
      weight:    Math.round(inf.confidence * 0.65),
      direction: inf.direction === "Positive" ? "supporting" as const : inf.direction === "Negative" ? "challenging" as const : "neutral" as const,
      source:    "Inference" as const,
    }));
}

function collectHealthProfileEvidence(chartData: ChartData): EvidenceItem[] {
  if (!chartData.healthFindings) return [];

  const hf    = chartData.healthFindings;
  const items: EvidenceItem[] = [];

  if (hf.primaryFocus) {
    const score = hf.primaryFocus.score;
    items.push({
      label:     `Primary sensitivity (${hf.primaryFocus.displayName})`,
      finding:   score >= 65
        ? `${hf.primaryFocus.displayName} is under significant stress (${score}/100) — primary area to watch`
        : score >= 52
        ? `${hf.primaryFocus.displayName} is mildly sensitive (${score}/100) — worth monitoring`
        : `${hf.primaryFocus.displayName} is stable (${score}/100) — no concern`,
      weight:    score >= 65 ? 75 : score >= 52 ? 50 : 20,
      direction: score >= 65 ? "challenging" : score >= 52 ? "neutral" : "supporting",
      source:    "Profile",
    });
  }

  if (hf.secondaryFocus) {
    items.push({
      label:     `Secondary sensitivity (${hf.secondaryFocus.displayName})`,
      finding:   `${hf.secondaryFocus.displayName} is also active (${hf.secondaryFocus.score}/100) — secondary area`,
      weight:    45,
      direction: "challenging",
      source:    "Profile",
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
): InvestigationReport {
  const req = CHART_INTELLIGENCE_MATRIX[domain] ?? CHART_INTELLIGENCE_MATRIX.general;

  // Collect evidence from all sources
  const raw: EvidenceItem[] = [
    ...collectD1Evidence(ctx, req.houses, req.planets, domain),
    ...(req.charts.includes("D10") ? collectDivisionalEvidence(ctx, "D10", domain, req.planets) : []),
    ...(req.charts.includes("D9")  ? collectDivisionalEvidence(ctx, "D9",  domain, req.planets) : []),
    ...(req.charts.includes("D2")  ? collectDivisionalEvidence(ctx, "D2",  domain, req.planets) : []),
    ...collectPlanetStrengthEvidence(ctx, req.planets, domain),
    ...collectDashaEvidence(dashaInfo, domain),
    ...collectTransitEvidence(ctx, domain),
    ...collectYogaEvidence(ctx, domain),
    ...collectInferenceEvidence(ctx, domain),
    ...(domain === "health" ? collectHealthProfileEvidence(chartData) : []),
  ];

  // De-duplicate by finding (keep highest weight)
  const seen = new Map<string, EvidenceItem>();
  for (const item of raw) {
    const key = item.finding.slice(0, 60);
    const existing = seen.get(key);
    if (!existing || item.weight > existing.weight) {
      seen.set(key, item);
    }
  }

  // Sort by weight and take top 8
  const evidence = [...seen.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  // Score synthesis
  const supportingWeight  = evidence.filter(e => e.direction === "supporting").reduce((s, e) => s + e.weight, 0);
  const challengingWeight = evidence.filter(e => e.direction === "challenging").reduce((s, e) => s + e.weight, 0);
  const totalWeight       = evidence.reduce((s, e) => s + e.weight, 0) || 1;

  const rawScore    = 50 + ((supportingWeight - challengingWeight) / totalWeight) * 42;
  const overallScore = Math.round(Math.max(10, Math.min(95, rawScore)));

  // Probability gets a dasha bonus when timing aligns
  const dashaBonus = evidence.some(e => e.source === "Dasha" && e.direction === "supporting") ? 8 : 0;
  const probability = Math.round(Math.min(95, Math.max(15, overallScore + dashaBonus)));

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

  const reasoning = buildReasoning(domain, evidence, overallScore, dashaInfo);

  return {
    domain,
    chartsExamined: [...chartKeysUsed],
    evidence,
    reasoning,
    conclusion: { overallScore, probability, timeline, keyPlanet, confidence },
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
    lines.push(`  ${icon} [${tag}] ${item.finding}`);
  }

  if (report.reasoning.length > 0) {
    lines.push(``, `ENGINE REASONING:`);
    report.reasoning.forEach(r => lines.push(`  ${r.step}. ${r.claim}`));
  }

  const { overallScore, probability, timeline, confidence } = report.conclusion;
  lines.push(
    ``,
    `INVESTIGATION SCORE: ${overallScore}/100  |  CONFIDENCE: ${confidence.toUpperCase()}  |  PROBABILITY: ${probability}%`,
  );
  if (timeline) {
    lines.push(`TIMING WINDOW: ${timeline}`);
  }

  return lines.join("\n");
}
