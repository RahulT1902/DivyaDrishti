/**
 * Integrity gate for chart claims inside a sentence, including sentences that
 * name several planets (Gemini review safeguard A):
 *
 *   - dignity      "Rahu … exalted", "Mars in its own sign"
 *   - placement    "Venus in your 12th house", "the Sun moves into the 6th and then the 7th"
 *   - relation     "Jupiter is 10th from Mercury", "Sun 12th from your Moon"
 *   - friendship   "Jupiter sees Mercury as an enemy"
 *   - dasha lord   "Jupiter Mahadasha", "Rahu as the Mahadasha lord"
 *
 * Each claim is attributed to the nearest planet named before it (a planet
 * that is the object of "from" is skipped). A claim passes if it matches the
 * natal chart OR any transit position in TIMING EVIDENCE, because a narrator
 * sentence rarely says which one it means. Claims the parser cannot
 * attribute are skipped: a false alarm drops a correct sentence.
 */

import type { ChartFacts } from "../../core/astrology/chartFacts";
import { getDignityInfo, type SignDignity } from "../../core/astrology/dignityEngine";
import type { DivisionalChart, PlanetName } from "../../core/types";
import type { TimingEvidence } from "./timingEngine";
import { PLANETS, SIGN_NAMES, aspectsFrom, naturalView, nthFrom, ordinal } from "./relations";

const WORD_ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const ORD = `(?:1[0-2]|[1-9])(?:st|nd|rd|th)|${WORD_ORD.join("|")}`;
const ordValue = (s: string) => {
  const w = WORD_ORD.indexOf(s.toLowerCase());
  return w >= 0 ? w + 1 : parseInt(s, 10);
};
const PLANET_RE = new RegExp(`\\b(${PLANETS.join("|")})\\b`, "g");

interface Mention { planet: PlanetName; at: number }

/** Planets named in the sentence, minus those that are the object of "from". */
function subjects(sentence: string): Mention[] {
  const out: Mention[] = [];
  for (const m of sentence.matchAll(PLANET_RE)) {
    const before = sentence.slice(Math.max(0, m.index! - 20), m.index!);
    if (/\bfrom\s+(?:the\s+|your\s+|natal\s+)*$/i.test(before)) continue;
    out.push({ planet: m[1] as PlanetName, at: m.index! });
  }
  return out;
}

const nearestBefore = (ms: Mention[], at: number) => [...ms].reverse().find(m => m.at < at)?.planet ?? null;

/** The planet named immediately before `at` ("Jupiter in your 5th"), whatever precedes it. */
function adjacentPlanet(sentence: string, at: number): PlanetName | null {
  const m = sentence.slice(Math.max(0, at - 12), at).match(new RegExp(`\\b(${PLANETS.join("|")})(?:['’]s)?\\s*$`));
  return m ? (m[1] as PlanetName) : null;
}

/**
 * Every sign the planet occupies in the period asked (natal excluded). Today's
 * position counts only without TIMING EVIDENCE: a December question must not
 * pass on where a planet sits in November.
 */
function transitSigns(ev: TimingEvidence | null, facts: ChartFacts, p: PlanetName): number[] {
  const signs = new Set<number>();
  const now = facts.transitPlanetPositions[p];
  if (now && !ev) signs.add(now.sign);
  if (ev) {
    for (const f of ev.backdrop) if (f.planet === p) signs.add(f.sign);
    for (const s of ev.segments) {
      for (const f of [...s.factors, ...s.endFactors, ...s.changes.map(c => c.f)]) if (f.planet === p) signs.add(f.sign);
    }
    for (const e of ev.events) if (e.planet === p) signs.add(e.sign);
  }
  return [...signs];
}

const TRANSIT_WORD = /\btransit(?:s|ing)?\b/i;
const NATAL_WORD = /\bnatal\b|\bbirth\b|\bat birth\b/i;

const DIGNITY_WORDS: Array<[RegExp, SignDignity[]]> = [
  [/\bexalted\b/i, ["exalted"]],
  [/\bdebilitated\b/i, ["debilitated"]],
  [/\bmoolatrikona\b/i, ["moolatrikona"]],
  [/\b(?:in\s+(?:its|his|her)\s+own\s+(?:sign|house)|own[- ]sign)\b/i, ["own", "moolatrikona"]],
];

/** A sentence about a divisional chart rather than the birth chart. */
// Spelling varies in transliteration (Dwadashamsha / Dvadasamsa …), so each name allows the common variants.
export const VARGA_RE = /\b(?:Dashamsh?a|Dasamsh?a|career chart|Navamsh?a|Hora|wealth chart|Chaturthamsh?a|property chart|marriage chart|D[wv]adash?amsh?a|parents['’]? chart|parental chart|divisional)\b/i;

const splitSentences = (text: string) => text.split(/(?<=[.!?])\s+|\n+/);

/**
 * A sentence about the divisional chart: it names it, or names its Ascendant
 * where that differs from the birth chart's ("With Leo rising, the Sun is
 * exalted in its 9th").
 */
function isVargaSentence(sentence: string, varga: DivisionalChart | undefined, facts: ChartFacts | undefined): boolean {
  if (VARGA_RE.test(sentence)) return true;
  return !!varga && !!facts && varga.ascendant.sign !== facts.ascendantSign &&
    new RegExp(`\\b${varga.ascendant.signName}\\s+(?:rising|Ascendant|lagna)\\b`, "i").test(sentence);
}

/** The text without its divisional-chart sentences, for checks that know only the birth chart. */
export function withoutVargaSentences(text: string, varga?: DivisionalChart, facts?: ChartFacts): string {
  return splitSentences(text).filter(s => !isVargaSentence(s, varga, facts)).join(" ");
}

/** The planet a dignity word describes: "exalted Sun" (right after it), else the nearest one before it. */
function dignitySubject(ms: Mention[], at: number, len: number): PlanetName | null {
  return ms.find(x => x.at >= at + len && x.at - (at + len) <= 2)?.planet
    ?? nearestBefore(ms, at)
    ?? ms.find(x => x.at > at && x.at - at < 20)?.planet
    ?? null;
}

/**
 * Claims in a divisional-chart sentence ("in your Dashamsha the Sun is exalted
 * in the 9th; its 10th lord Venus is debilitated in the 2nd"). Such sentences
 * often mix both charts ("10th lord Jupiter in the 5th, and an exalted Sun in
 * the Dashamsha"), so a claim fails only if it is false in the divisional
 * chart AND in the birth chart (and transits).
 */
function vargaErrors(
  sentence: string, ms: Mention[], dc: DivisionalChart, facts: ChartFacts, ev: TimingEvidence | null,
): string[] {
  const errors: string[] = [];
  const pos = (p: PlanetName) => dc.planets.find(x => x.planet === p);
  const birthSigns = (p: PlanetName) =>
    [facts.natalPlanetPositions[p]?.sign, ...transitSigns(ev, facts, p)].filter((s): s is number => !!s);
  for (const [re, kinds] of DIGNITY_WORDS) {
    const m = sentence.match(re);
    if (!m) continue;
    if (/\b(not|n't|never|neither|nor|no longer)\s+(?:\w+\s+){0,2}$/i.test(sentence.slice(0, m.index!))) continue;
    const p = dignitySubject(ms, m.index!, m[0].length);
    const pl = p && pos(p);
    if (!p || !pl) continue;
    const dig = getDignityInfo(p, pl.sign as any).condition.signDignity;
    const inBirth = birthSigns(p).some(s => kinds.includes(getDignityInfo(p, s as any).condition.signDignity));
    if (!kinds.includes(dig) && !inBirth) errors.push(`The answer calls ${p} ${kinds[0]}, but it is ${dig} in the divisional chart (${pl.signName}) and not ${kinds[0]} in the birth chart either.`);
  }
  const placeRe = new RegExp(`\\b(?:in|into|occupies|occupying)\\s+(?:the\\s+|its\\s+|your\\s+)*(${ORD})\\b(?![- ]?(?:house\\s+)?(?:lord|ruler|from))`, "gi");
  for (const m of sentence.matchAll(placeRe)) {
    const p = nearestBefore(ms, m.index!);
    const pl = p && pos(p);
    if (!p || !pl) continue;
    const n = ordValue(m[1]);
    const inBirth = [facts.natalPlanetPositions[p]?.house, ...birthSigns(p).map(s => nthFrom(facts.ascendantSign, s))].includes(n);
    if (n !== pl.house && !inBirth) errors.push(`The answer puts ${p} in the ${ordinal(n)} house, but it is in the ${ordinal(pl.house)} of the divisional chart and not the ${ordinal(n)} of the birth chart either.`);
  }
  const lordRe = new RegExp(`\\b(${ORD})[- ](?:house\\s+)?lord(?:\\s+is)?\\s+(${PLANETS.join("|")})\\b|\\b(${PLANETS.join("|")})\\s+(?:is|as|acts as)\\s+(?:the\\s+|its\\s+)?(${ORD})[- ](?:house\\s+)?lord\\b`, "gi");
  for (const m of sentence.matchAll(lordRe)) {
    const n = ordValue(m[1] ?? m[4]);
    const p = (m[2] ?? m[3]) as PlanetName;
    const lord = dc.lords.find(l => l.house === n)?.lord;
    if (lord && lord !== p && facts.houseLords[n] !== p) {
      errors.push(`The answer makes ${p} the ${ordinal(n)} lord, but that is ${lord} in the divisional chart and ${facts.houseLords[n]} in the birth chart.`);
    }
  }
  return errors;
}

export function validateChartClaims(
  ev: TimingEvidence | null, facts: ChartFacts, text: string, varga?: DivisionalChart,
): { errors: string[] } {
  const errors: string[] = [];
  const asc = facts.ascendantSign;
  const moon = facts.natalPlanetPositions.Moon?.sign;
  const natal = (p: PlanetName) => facts.natalPlanetPositions[p];

  for (const sentence of splitSentences(text)) {
    const ms = subjects(sentence);
    if (!ms.length) continue;
    if (isVargaSentence(sentence, varga, facts)) {
      if (varga) errors.push(...vargaErrors(sentence, ms, varga, facts, ev));
      continue;
    }
    const claimed = new Set<number>(); // ordinal positions already checked as relations

    // ── Relation: "Nth (house) from X" ─────────────────────────────────────
    const relRe = new RegExp(`\\b(${ORD})(?:\\s+house)?\\s+from\\s+(?:the\\s+|your\\s+|natal\\s+)*(${PLANETS.join("|")}|Ascendant|Lagna)\\b`, "gi");
    for (const m of sentence.matchAll(relRe)) {
      claimed.add(m.index!);
      const n = ordValue(m[1]);
      const ref = m[2][0].toUpperCase() + m[2].slice(1).toLowerCase();
      const p = nearestBefore(ms, m.index!);
      if (!p || p === ref) continue;
      const refSign = ref === "Ascendant" || ref === "Lagna" ? asc : natal(ref as PlanetName)?.sign;
      if (!refSign) continue;
      const signs = [natal(p)?.sign, ...transitSigns(ev, facts, p)].filter((s): s is number => !!s);
      const allowed = new Set(signs.map(s => nthFrom(refSign, s)));
      if (!allowed.has(n)) {
        const nat = natal(p);
        errors.push(`The answer places ${p} ${ordinal(n)} from ${ref}, but ${p} is ${[...allowed].map(ordinal).join(" or ")} from ${ref}` +
          `${nat ? ` (natal ${ordinal(nthFrom(refSign, nat.sign))})` : ""}.`);
      }
    }

    // ── Placement: "in / into / through (the|your) Nth (house)" ────────────
    const placeRe = new RegExp(`\\b(?:in|into|through|occupies|occupying|transits?|transiting)\\s+(?:the\\s+|your\\s+|its\\s+|his\\s+|her\\s+|natal\\s+)*(${ORD})\\b(?![- ]?(?:house\\s+)?(?:lord|ruler|from))`, "gi");
    // A sentence that says "transit" means the moving planet, not the birth chart.
    const transitOnly = ev && TRANSIT_WORD.test(sentence) && !NATAL_WORD.test(sentence);
    const checkHouse = (p: PlanetName, n: number) => {
      const transitHouses = transitSigns(ev, facts, p).map(s => nthFrom(asc, s));
      const houses = new Set([...(transitOnly ? [] : [natal(p)?.house]), ...transitHouses].filter(Boolean));
      if (!houses.has(n)) {
        errors.push(`The answer puts ${p} in the ${ordinal(n)} house, but ${p} is in your ${[...houses].map(h => ordinal(h as number)).join(" or ")} house ` +
          `(${transitOnly ? "by transit in this period" : "natal or during this period"}).`);
      }
    };
    for (const m of sentence.matchAll(placeRe)) {
      const ordAt = m.index! + m[0].length - m[1].length;
      if (claimed.has(ordAt)) continue;
      // "…a connection from Jupiter in your 5th house": a planet right before the
      // placement owns it, even when it follows "from".
      const p = adjacentPlanet(sentence, m.index!) ?? nearestBefore(ms, m.index!);
      if (!p) continue;
      const n = ordValue(m[1]);
      // Paired lists read in order: "Rahu and Ketu transiting the 8th and 2nd houses",
      // "the Rahu–Ketu axis in the 8th/2nd houses" → Rahu 8th, Ketu 2nd.
      const second = sentence.slice(m.index! + m[0].length).match(new RegExp(`^\\s*(?:and|/|&)\\s*(?:the\\s+|your\\s+)?(${ORD})\\b`, "i"));
      const before = ms.filter(x => x.at < m.index!);
      const [a, b] = before.slice(-2);
      if (second && a && b && /^\s*(?:and|-|–|—|\/|&)\s*$/.test(sentence.slice(a.at + a.planet.length, b.at))) {
        checkHouse(a.planet, n);
        checkHouse(b.planet, ordValue(second[1]));
        continue;
      }
      checkHouse(p, n);
    }

    // ── Aspects: "Saturn … aspecting your 5th, 9th and 12th houses" ────────
    // Each house must be one the planet aspects from its natal or a transit sign
    // (graha drishti: the 7th, plus Mars 4/8, Jupiter 5/9, Saturn 3/10).
    const aspRe = new RegExp(`\\baspect(?:s|ing)?\\s+(?:your\\s+|the\\s+)?((?:${ORD})(?:\\s*(?:,|and|&)\\s*(?:your\\s+|the\\s+)?(?:${ORD}))*)\\b(?![- ]?(?:house\\s+)?(?:lord|from))`, "gi");
    for (const m of sentence.matchAll(aspRe)) {
      const p = nearestBefore(ms, m.index!);
      if (!p) continue;
      const signs = [...(transitOnly ? [] : [natal(p)?.sign]), ...transitSigns(ev, facts, p)].filter((s): s is number => !!s);
      const reach = new Set(signs.flatMap(s => aspectsFrom(p, s).map(x => nthFrom(asc, x))));
      for (const o of m[1].match(new RegExp(ORD, "gi")) ?? []) {
        const n = ordValue(o);
        if (!reach.has(n)) errors.push(`The answer has ${p} aspecting your ${ordinal(n)} house, but from its positions it aspects only your ${[...reach].sort((x, y) => x - y).map(ordinal).join(", ")}.`);
      }
    }

    // ── Ingress targets: "moves into the 6th and then the 7th" ─────────────
    // Each house or sign named after an ingress verb must be one the planet enters in the period.
    if (ev) {
      const target = `(?:the\\s+|your\\s+)?(?:${ORD}|${SIGN_NAMES.join("|")})(?:\\s+house)?`;
      const ingRe = new RegExp(`\\b(?:enters?|entering|entry\\s+into|moves?\\s+(?:back\\s+)?into|moving\\s+(?:back\\s+)?into|shifts?\\s+(?:in)?to|shifting\\s+(?:in)?to)\\s+(${target}(?:\\s*(?:,|and|then|and then|&)\\s*${target})*)`, "gi");
      for (const m of sentence.matchAll(ingRe)) {
        const p = nearestBefore(ms, m.index!);
        if (!p) continue;
        const entered = ev.events.filter(e => e.planet === p && e.kind === "ingress");
        const enteredHouses = new Set(entered.map(e => nthFrom(asc, e.sign)));
        const enteredSigns = new Set(entered.map(e => e.sign));
        const parts = m[1].match(new RegExp(`${ORD}|${SIGN_NAMES.join("|")}`, "gi")) ?? [];
        for (const part of parts) {
          const sign = SIGN_NAMES.findIndex(s => s.toLowerCase() === part.toLowerCase()) + 1;
          const ok = sign ? enteredSigns.has(sign) : enteredHouses.has(ordValue(part));
          if (ok) continue;
          const what = sign ? SIGN_NAMES[sign - 1] : `your ${ordinal(ordValue(part))} house`;
          const actual = entered.length
            ? `it only enters ${entered.map(e => `${SIGN_NAMES[e.sign - 1]} (your ${ordinal(nthFrom(asc, e.sign))} house)`).join(" and ")}`
            : `it changes sign nowhere in this period`;
          errors.push(`The answer has ${p} entering ${what}, but in TIMING EVIDENCE ${actual}. Keep separate events in separate sentences.`);
        }
      }
    }

    // ── Dignity ─────────────────────────────────────────────────────────────
    for (const [re, kinds] of DIGNITY_WORDS) {
      const m = sentence.match(re);
      if (!m) continue;
      const before = sentence.slice(0, m.index!);
      if (/\b(not|n't|never|neither|nor|no longer)\s+(?:\w+\s+){0,2}$/i.test(before)) continue;
      const p = dignitySubject(ms, m.index!, m[0].length); // "an exalted Rahu" or "Rahu … exalted"
      if (!p) continue;
      const signs = [natal(p)?.sign, ...transitSigns(ev, facts, p)].filter((s): s is number => !!s);
      const dignities = new Set(signs.map(s => getDignityInfo(p!, s as any).condition.signDignity));
      if (!kinds.some(k => dignities.has(k))) {
        errors.push(`The answer calls ${p} ${kinds[0]}, but ${p} is ${[...dignities].join(" or ")} (natal or during this period).`);
      }
    }

    // ── Natural friendship ──────────────────────────────────────────────────
    const P = PLANETS.join("|");
    const viewRes = [
      new RegExp(`\\b(${P})\\s+(?:sees|treats|regards|views)\\s+(${P})\\s+as\\s+(?:a\\s+|an\\s+)?(friend|enemy|neutral)`, "gi"),
      new RegExp(`\\b(${P})\\b[^.,;]{0,20}?\\b(?:is|as)\\s+(?:a\\s+|an\\s+)?(friend|enemy|neutral)\\s+(?:of|to)\\s+(${P})\\b`, "gi"),
    ];
    for (const [i, re] of viewRes.entries()) {
      for (const m of sentence.matchAll(re)) {
        const [a, b, said] = i === 0 ? [m[1], m[2], m[3]] : [m[1], m[3], m[2]];
        const A = a as PlanetName, B = b as PlanetName;
        if (A === "Rahu" || A === "Ketu" || B === "Rahu" || B === "Ketu") continue; // nodes act through their sign lord
        const actual = naturalView(A, B);
        if (actual !== said.toLowerCase()) errors.push(`The answer says ${A} sees ${B} as ${said.toLowerCase()}, but naturally ${A} sees ${B} as ${actual}.`);
      }
    }

    // ── Dasha lordship ──────────────────────────────────────────────────────
    if (ev?.dashaStart) {
      const lords = {
        md: new Set([ev.dashaStart.md.planet]), ad: new Set([ev.dashaStart.ad.planet]), pd: new Set([ev.dashaStart.pd.planet]),
      };
      for (const c of ev.dashaChanges) {
        const k = c.level === "Mahadasha" ? "md" : c.level === "Antardasha" ? "ad" : "pd";
        lords[k].add(c.to);
        // A higher-level change restarts every level below it with the new lord.
        if (k === "md") { lords.ad.add(c.to); lords.pd.add(c.to); }
        if (k === "ad") lords.pd.add(c.to);
      }
      const level = (w: string): Array<keyof typeof lords> =>
        /^maha/i.test(w) ? ["md"] : /^antar|^bhukti/i.test(w) ? ["ad"] : /^pratyantar/i.test(w) ? ["pd"] : ["ad", "pd"];
      const LV = `maha\\s*dasha|antar\\s*dasha|bhukti|pratyantar(?:\\s*dasha)?|sub-?period`;
      const dashaRes = [
        new RegExp(`\\b(${P})(?:['’]s)?\\s+(${LV})\\b`, "gi"),
        new RegExp(`\\b(${P})\\b[^.,;]{0,25}?\\bas\\s+(?:the\\s+|your\\s+)?(${LV})\\s+lord\\b`, "gi"),
        new RegExp(`\\b(${LV})\\s+(?:lord\\s+(?:is\\s+)?|of\\s+)(${P})\\b`, "gi"),
      ];
      for (const [i, re] of dashaRes.entries()) {
        for (const m of sentence.matchAll(re)) {
          const [p, w] = i === 2 ? [m[2], m[1]] : [m[1], m[2]];
          const levels = level(w);
          if (levels.some(k => lords[k].has(p))) continue;
          const names = { md: "Mahadasha", ad: "Antardasha", pd: "Pratyantar" };
          errors.push(`The answer calls ${p} the ${levels.map(k => names[k]).join(" or ")} lord, but in this period that is ` +
            `${levels.map(k => [...lords[k]].join(" then ")).join(" / ")}.`);
        }
      }
    }
  }
  return { errors: [...new Set(errors)] };
}
