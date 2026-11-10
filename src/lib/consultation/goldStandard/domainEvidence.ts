/**
 * ChatPundit Gold Standard v1.0 — chart evidence for the non-health domains
 * (Multi-Domain spec, Phase B). Health keeps its own renderer
 * (healthEvidence.ts) so its prompt stays byte-identical.
 *
 * Each domain contributes a spec: its houses, karakas and divisional chart.
 * The block is built only from computed chart facts, the divisional chart and
 * the CIE investigation — never invented. The divisional chart corroborates
 * the birth chart; it never overrides it.
 */

import type { ChartFacts } from "@/lib/core/astrology/chartFacts";
import type { ChartSuite, DivisionalChart, PlanetName, Sign } from "@/lib/core/types";
import type { InvestigationReport } from "@/lib/consultation/brain/CIE_investigationEngine";
import { getDignityInfo } from "../../core/astrology/dignityEngine";
import { PLANETS, ordinal } from "../timing/relations";
import { aspectsOnHouse, describePlanet, healthEvidenceStrength, occupantsOf } from "./healthEvidence";

export interface DomainSpec {
  /** Chat domain this spec serves. */
  domain: string;
  /** Upper-case name used in block headers ("CAREER"). */
  title: string;
  /** The question's primary house first; its lord is followed into the divisional chart. */
  houses: Array<{ house: number; meaning: string }>;
  karakas: Array<{ planet: PlanetName; meaning: string }>;
  // D24 (education) is not in the chart suite yet; add it there before education migrates.
  // mode "hora": the D2 puts every planet in Leo (Sun's hora) or Cancer (Moon's
  // hora), so it is read by which hora a planet falls in, not by houses.
  varga: { key: keyof ChartSuite; name: string; primaryHouse: number; mode?: "houses" | "hora" };
}

export const CAREER_SPEC: DomainSpec = {
  domain: "career",
  title: "CAREER",
  houses: [
    { house: 10, meaning: "career, status, authority and public standing" },
    { house: 6,  meaning: "service, the daily job, employers and competition" },
    { house: 2,  meaning: "earned income and salary" },
    { house: 11, meaning: "gains, promotions, networks and fulfilled ambitions" },
    { house: 7,  meaning: "business, partnerships and clients" },
    { house: 9,  meaning: "fortune, mentors and senior support" },
  ],
  karakas: [
    { planet: "Sun",     meaning: "authority, government and leadership" },
    { planet: "Saturn",  meaning: "work, service, discipline and long effort" },
    { planet: "Mercury", meaning: "business, trade, communication and skills" },
    { planet: "Jupiter", meaning: "guidance, promotion and wisdom" },
  ],
  varga: { key: "D10", name: "Dashamsha (career chart)", primaryHouse: 10 },
};

export const FINANCE_SPEC: DomainSpec = {
  domain: "finance",
  title: "FINANCE",
  houses: [
    { house: 2,  meaning: "accumulated wealth, savings and family money" },
    { house: 11, meaning: "income, gains and returns" },
    { house: 5,  meaning: "investments and speculation" },
    { house: 9,  meaning: "fortune and windfalls" },
    { house: 10, meaning: "earnings from work and status" },
    { house: 12, meaning: "expenses, losses and outflows" },
  ],
  karakas: [
    { planet: "Jupiter", meaning: "wealth, expansion and wise investment" },
    { planet: "Venus",   meaning: "comforts, luxuries and money flow" },
    { planet: "Mercury", meaning: "trade, commerce and calculation" },
    { planet: "Moon",    meaning: "liquidity, cash flow and the mind's relationship with money" },
  ],
  varga: { key: "D2", name: "Hora (wealth chart)", primaryHouse: 2, mode: "hora" },
};

export const PROPERTY_SPEC: DomainSpec = {
  domain: "property",
  title: "PROPERTY",
  houses: [
    { house: 4,  meaning: "home, land, buildings and vehicles" },
    { house: 2,  meaning: "savings available for a purchase" },
    { house: 11, meaning: "gains and fulfilment of the desire to own" },
    { house: 8,  meaning: "loans, inheritance and sudden property matters" },
    { house: 12, meaning: "large outlays, investment abroad and loss" },
    { house: 10, meaning: "status and the means earned through work" },
  ],
  karakas: [
    { planet: "Mars",   meaning: "land, plots and construction" },
    { planet: "Venus",  meaning: "the house itself, comforts and vehicles" },
    { planet: "Moon",   meaning: "home, peace at home and mother" },
    { planet: "Saturn", meaning: "old property, delays and long-term holdings" },
  ],
  varga: { key: "D4", name: "Chaturthamsha (property chart)", primaryHouse: 4 },
};

export const RELATIONSHIP_SPEC: DomainSpec = {
  domain: "relationship",
  title: "RELATIONSHIP",
  houses: [
    { house: 7,  meaning: "spouse, marriage and committed partnership" },
    { house: 2,  meaning: "family life after marriage and harmony at home" },
    { house: 5,  meaning: "romance and love affairs" },
    { house: 8,  meaning: "the marital bond, intimacy and in-laws" },
    { house: 11, meaning: "fulfilment of desires and friendship within the bond" },
    { house: 12, meaning: "bed pleasures, distance and separation" },
  ],
  karakas: [
    { planet: "Venus",   meaning: "love, attraction and the partner" },
    { planet: "Jupiter", meaning: "blessing of marriage, wisdom and (for women) the husband" },
    { planet: "Moon",    meaning: "emotional bond and mutual understanding" },
    { planet: "Mars",    meaning: "passion, desire and friction" },
  ],
  varga: { key: "D9", name: "Navamsa (marriage chart)", primaryHouse: 7 },
};

export const FAMILY_SPEC: DomainSpec = {
  domain: "family",
  title: "FAMILY",
  houses: [
    { house: 4,  meaning: "mother, home and peace in the household" },
    { house: 9,  meaning: "father, elders and family blessings" },
    { house: 3,  meaning: "siblings and cousins" },
    { house: 2,  meaning: "the family unit, shared values and speech at home" },
    { house: 5,  meaning: "children" },
    { house: 12, meaning: "distance from family and expenses on family" },
  ],
  karakas: [
    { planet: "Moon",    meaning: "mother and emotional comfort at home" },
    { planet: "Sun",     meaning: "father and authority in the family" },
    { planet: "Mars",    meaning: "siblings, especially younger ones" },
    { planet: "Jupiter", meaning: "children, elders and family wisdom" },
  ],
  varga: { key: "D12", name: "Dwadashamsha (parents chart)", primaryHouse: 4 },
};

export const DOMAIN_SPECS: Record<string, DomainSpec> = {
  career: CAREER_SPEC,
  finance: FINANCE_SPEC,
  property: PROPERTY_SPEC,
  relationship: RELATIONSHIP_SPEC,
  family: FAMILY_SPEC,
};

/** A planet's house, sign and dignity in a divisional chart. */
function inVarga(dc: DivisionalChart, p: PlanetName): string {
  const pl = dc.planets.find(x => x.planet === p);
  if (!pl) return `${p}: not available`;
  const dig = getDignityInfo(p, pl.sign as Sign).condition.signDignity;
  const notable = ["exalted", "own", "moolatrikona", "debilitated"].includes(dig) ? `, ${dig}` : "";
  return `${p} in its ${ordinal(pl.house)} house (${pl.signName}${notable})`;
}

function renderVarga(spec: DomainSpec, facts: ChartFacts, dc: DivisionalChart | undefined, dashaLords: string[]): string[] {
  const { name, primaryHouse } = spec.varga;
  if (!dc || dc.metadata.source === "Placeholder") {
    return [`${name.toUpperCase()}: not available — say the ${name} cannot be assessed; rely on the birth chart.`];
  }
  const L: string[] = [`${name.toUpperCase()} — corroborates the birth chart, never overrides it:`];
  if (spec.varga.mode === "hora") {
    // Each planet sits in the Sun's hora (Leo) or the Moon's hora (Cancer).
    const key = [...new Set([
      ...spec.houses.slice(0, 2).map(h => facts.houseLords[h.house]),
      ...spec.karakas.map(k => k.planet),
      ...dashaLords.filter(p => PLANETS.includes(p as PlanetName)) as PlanetName[],
    ])];
    const inHora = (sign: number) => key.filter(p => dc.planets.find(x => x.planet === p)?.sign === sign);
    const sun = inHora(5), moon = inHora(4);
    L.push(`  Sun's hora (Leo) — wealth through one's own effort, authority and enterprise: ${sun.length ? sun.join(", ") : "none of the key planets"}.`);
    L.push(`  Moon's hora (Cancer) — wealth through stability, family, saving and steady accumulation: ${moon.length ? moon.join(", ") : "none of the key planets"}.`);
    L.push(`  (Key planets: the 2nd and 11th lords, the karakas and the dasha lords. The hora shows HOW wealth tends to come, not how much.)`);
    return L;
  }
  const occ = dc.planets.filter(x => x.house === primaryHouse).map(x => x.planet);
  const lord = dc.lords.find(l => l.house === primaryHouse);
  L.push(`  Its Ascendant: ${dc.ascendant.signName}. Its ${ordinal(primaryHouse)} house: ` +
    `${dc.houses.find(h => h.number === primaryHouse) ? `occupants ${occ.length ? occ.join(", ") : "none"}` : "not available"}` +
    `${lord ? `; lord ${inVarga(dc, lord.lord)}` : ""}.`);
  const birthLord = facts.houseLords[spec.houses[0].house];
  L.push(`  Birth-chart ${ordinal(spec.houses[0].house)} lord: ${inVarga(dc, birthLord)}.`);
  L.push(`  Karakas: ${spec.karakas.map(k => inVarga(dc, k.planet)).join("; ")}.`);
  const lords = dashaLords.filter(p => PLANETS.includes(p as PlanetName) && p !== birthLord && !spec.karakas.some(k => k.planet === p));
  if (lords.length) L.push(`  Dasha lords: ${lords.map(p => inVarga(dc, p as PlanetName)).join("; ")}.`);
  L.push(`  Kendras (1, 4, 7, 10) and trines (5, 9) here strengthen a promise; the 6th, 8th and 12th weaken it.`);
  return L;
}

export function renderDomainEvidence(opts: {
  spec: DomainSpec;
  facts: ChartFacts;
  varga?: DivisionalChart;
  dasha?: { mahadasha: string; antardasha: string; periodEnd?: string };
  pratyantar?: string | null;
  report?: InvestigationReport;
  /** Rendered TIMING EVIDENCE block. */
  timing?: string;
}): string {
  const { spec, facts, varga, dasha, pratyantar, report, timing } = opts;
  const lines: string[] = [];
  lines.push(`━━━ ${spec.title} CHART EVIDENCE (authoritative — computed from this chart; use ONLY these facts) ━━━`);

  lines.push(`NATAL FRAMEWORK (${facts.ascendantSignName} Ascendant):`);
  for (const { house, meaning } of spec.houses) {
    const occupants = occupantsOf(facts, house);
    const aspects = aspectsOnHouse(facts, house);
    lines.push(
      `  ${ordinal(house)} house — ${meaning}: ${facts.houseSignNames[house]}. ` +
      `Lord: ${describePlanet(facts, facts.houseLords[house])}. ` +
      `Occupants: ${occupants.length ? occupants.join(", ") : "none"}. ` +
      `Aspected by: ${aspects.length ? aspects.join(", ") : "none"}.`
    );
  }
  lines.push(`KARAKAS (natural significators):`);
  for (const k of spec.karakas) lines.push(`  ${k.planet} (${k.meaning}): ${describePlanet(facts, k.planet)}.`);

  const dashaLords = [dasha?.mahadasha, dasha?.antardasha, pratyantar].filter((x): x is string => !!x);
  if (dasha) {
    lines.push(`DASHA ACTIVATION: ${dasha.mahadasha} Mahadasha / ${dasha.antardasha} Antardasha${pratyantar ? ` / ${pratyantar} Pratyantar` : ""}.`);
    for (const p of dashaLords) {
      if (!PLANETS.includes(p as PlanetName)) continue;
      const pl = p as PlanetName;
      const pos = facts.natalPlanetPositions[pl];
      const domainHouses = spec.houses.map(h => h.house);
      const rules = (facts.planetLordships[pl] ?? []).filter(h => domainHouses.includes(h));
      const sits = pos && domainHouses.includes(pos.house) ? pos.house : null;
      const link = [
        rules.length ? `rules your ${rules.map(ordinal).join(" and ")}` : null,
        sits ? `sits in your ${ordinal(sits)}` : null,
      ].filter(Boolean).join(", ");
      lines.push(`  ${describePlanet(facts, pl)}. ${link ? `For this question it ${link}.` : `It neither rules nor occupies the ${spec.domain} houses — its effect here is indirect.`}`);
    }
  } else {
    lines.push(`DASHA ACTIVATION: not available — say the dasha cannot be assessed; do not guess one.`);
  }

  lines.push(...renderVarga(spec, facts, varga, dashaLords));

  // CIE findings, engine scores stripped (no percentages in the answer), and
  // "D1 2th lord" read as "birth-chart 2nd lord".
  const plain = (s: string) => s
    .replace(/\s*\(\d+(?:\/100|%)[^)]*\)/g, "")
    .replace(/\s*\([+-]?\d+ shift[^)]*\)/g, "")
    .replace(/\s*with strength \d+\/100/g, "")
    .replace(/\bD1\b/g, "birth-chart")
    .replace(/\bD10\b/g, "Dashamsha").replace(/\bD9\b/g, "Navamsa").replace(/\bD2\b/g, "Hora").replace(/\bD4\b/g, "Chaturthamsha").replace(/\bD12\b/g, "Dwadashamsha")
    .replace(/\b(\d+)th\b/g, (_, n) => ordinal(Number(n)))
    .trim();
  const ev = vargaFiltered(spec, report)?.evidence ?? [];
  const sup = ev.filter(e => e.direction === "supporting").slice(0, 5);
  const ch = ev.filter(e => e.direction === "challenging").slice(0, 5);
  lines.push(`SUPPORTING FACTORS:`);
  lines.push(...(sup.length ? sup.map(e => `  ✓ ${plain(e.finding)}`) : [`  (none found)`]));
  lines.push(`CHALLENGING FACTORS:`);
  lines.push(...(ch.length ? ch.map(e => `  ✗ ${plain(e.finding)}`) : [`  (none found)`]));

  lines.push(`EVIDENCE STRENGTH: ${healthEvidenceStrength(vargaFiltered(spec, report))}  ← state this in words; never as a percentage.`);
  if (timing) lines.push(timing);
  return lines.join("\n");
}

/**
 * The CIE reads every divisional chart by houses ("Hora 2nd lord in house 12").
 * A hora chart has only two signs, so those findings are left out — of the
 * evidence list and of the strength computed from it.
 */
export function vargaFiltered(spec: DomainSpec, report?: InvestigationReport): InvestigationReport | undefined {
  if (!report || spec.varga.mode !== "hora") return report;
  return { ...report, evidence: report.evidence.filter(e => e.source !== spec.varga.key) };
}
