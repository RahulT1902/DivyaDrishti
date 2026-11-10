/**
 * Shared dasha + transit timing engine (Multi-Domain spec, Phase A).
 *
 * Calculate → establish evidence → interpret: every date this module emits
 * comes from the Vimshottari engine (src/lib/astrology/dasha.ts) or from Swiss
 * Ephemeris positions (calculateCurrentTransits). The LLM only narrates the
 * rendered block; it never computes or invents a date.
 *
 * Domain-neutral: a domain contributes only the houses it cares about
 * (DOMAIN_HOUSES). Domain-specific interpretation rules belong to Phase B.
 */

import { buildAntardasha, buildPratyantardasha, type Period } from "../../astrology/dasha";
import { calculateCurrentTransits, type TransitPosition } from "../../astrology/transit";
import type { ChartFacts } from "../../core/astrology/chartFacts";
import type { PlanetName } from "../../core/types";
import {
  PLANETS, SIGN_LORD, SIGN_NAMES, aspectsFrom, houseRelation, naturalView, nthFrom, ordinal,
} from "./relations";

const DAY = 24 * 60 * 60 * 1000;

// ── Domain houses (from the Multi-Domain spec) ──────────────────────────────

export const DOMAIN_HOUSES: Record<string, { houses: number[]; label: string }> = {
  health:        { houses: [1, 6, 8, 12],           label: "health" },
  finance:       { houses: [2, 5, 9, 10, 11, 12],   label: "finance" },
  career:        { houses: [2, 6, 7, 9, 10, 11],    label: "career" },
  job:           { houses: [2, 6, 8, 10, 11, 12],   label: "job" },
  relationship:  { houses: [2, 5, 7, 8, 11, 12],    label: "relationship" },  // the chat domain name
  relationships: { houses: [2, 5, 7, 8, 11, 12],    label: "relationship" },
  marriage:      { houses: [2, 5, 7, 8, 11, 12],    label: "marriage" },
  property:      { houses: [2, 4, 8, 10, 11, 12],   label: "property" },
  family:        { houses: [2, 3, 4, 5, 9, 12],     label: "family" },
  education:     { houses: [2, 4, 5, 9, 11],        label: "education" },
};

// ── Prediction window ───────────────────────────────────────────────────────

export type Horizon = "day" | "week" | "month" | "year";

export interface PredictionWindow {
  from: Date;
  to: Date;
  horizon: Horizon;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * The period a question asks about, from the intent engine's timeframe string
 * ("today", "this week", "next month", "2027", "16 nov", …). Open questions
 * get the next 30 days.
 */
export function resolveWindow(timeframe: string | null | undefined, now: Date): PredictionWindow {
  const tf = (timeframe ?? "").toLowerCase().trim();
  const plus = (d: number) => new Date(now.getTime() + d * DAY);
  const y = now.getUTCFullYear();

  if (tf === "today") return { from: now, to: plus(1), horizon: "day" };
  if (tf === "tomorrow") return { from: plus(1), to: plus(2), horizon: "day" };
  if (tf === "this week") return { from: now, to: plus(7), horizon: "week" };
  if (tf === "next month") {
    const m = now.getUTCMonth() + 1;
    return { from: new Date(Date.UTC(y, m, 1)), to: new Date(Date.UTC(y, m + 1, 1)), horizon: "month" };
  }
  if (tf === "this year") return { from: now, to: new Date(Date.UTC(y + 1, 0, 1)), horizon: "year" };
  if (tf === "next year") return { from: new Date(Date.UTC(y + 1, 0, 1)), to: new Date(Date.UTC(y + 2, 0, 1)), horizon: "year" };
  if (/^\d{4}$/.test(tf)) {
    const yr = Number(tf);
    const start = new Date(Date.UTC(yr, 0, 1));
    return { from: start < now && yr === y ? now : start, to: new Date(Date.UTC(yr + 1, 0, 1)), horizon: "year" };
  }
  const mIdx = MONTHS.findIndex(m => tf.includes(m));
  if (mIdx >= 0) {
    const dayMatch = tf.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    const yearMatch = tf.match(/\b(20\d\d)\b/);
    let yr = yearMatch ? Number(yearMatch[1]) : y;
    if (!yearMatch && mIdx < now.getUTCMonth()) yr += 1; // a month already past means next year
    if (dayMatch) {
      const d = new Date(Date.UTC(yr, mIdx, Number(dayMatch[1])));
      return { from: d, to: new Date(d.getTime() + DAY), horizon: "day" };
    }
    const start = new Date(Date.UTC(yr, mIdx, 1));
    return { from: start < now ? now : start, to: new Date(Date.UTC(yr, mIdx + 1, 1)), horizon: "month" };
  }
  return { from: now, to: plus(30), horizon: "month" };
}

// ── Dasha ───────────────────────────────────────────────────────────────────

export interface DatedDasha { md: Period; ad: Period; pd: Period }

export function dashaAt(timeline: Period[], at: Date): DatedDasha | null {
  const md = timeline.find(p => at >= p.start && at < p.end);
  if (!md) return null;
  const ad = buildAntardasha(md).find(p => at >= p.start && at < p.end);
  if (!ad) return null;
  const pd = buildPratyantardasha(ad).find(p => at >= p.start && at < p.end);
  return pd ? { md, ad, pd } : null;
}

export interface DashaTransition {
  date: Date;
  level: "Mahadasha" | "Antardasha" | "Pratyantar";
  from: string;
  to: string;
}

/** Every dasha change (at any of the three levels) strictly inside the window. */
export function dashaTransitions(timeline: Period[], from: Date, to: Date): DashaTransition[] {
  const out: DashaTransition[] = [];
  for (const md of timeline) {
    if (md.end <= from || md.start >= to) continue;
    for (const ad of buildAntardasha(md)) {
      if (ad.end <= from || ad.start >= to) continue;
      for (const pd of buildPratyantardasha(ad)) {
        if (pd.start <= from || pd.start >= to) continue;
        const before = dashaAt(timeline, new Date(pd.start.getTime() - 1));
        if (!before) continue;
        const level = before.md.planet !== md.planet ? "Mahadasha" : before.ad.planet !== ad.planet ? "Antardasha" : "Pratyantar";
        const prev = level === "Mahadasha" ? before.md.planet : level === "Antardasha" ? before.ad.planet : before.pd.planet;
        const next = level === "Mahadasha" ? md.planet : level === "Antardasha" ? ad.planet : pd.planet;
        out.push({ date: pd.start, level, from: prev, to: next });
      }
    }
  }
  return out;
}

// ── Transits ───────────────────────────────────────────────────────────────

export interface TransitEvent {
  date: Date;
  planet: PlanetName;
  kind: "ingress" | "retrograde" | "direct";
  sign: number;          // sign occupied after the event
  retrograde: boolean;   // motion after the event
}

const STATION_PLANETS: PlanetName[] = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
const positionsAt = (d: Date) => calculateCurrentTransits(d).then(r => r.positions as TransitPosition[]);
const find = (ps: TransitPosition[], p: string) => ps.find(x => x.name === p)!;

/** Narrow [a, b] to the moment `changed(t)` flips, to about a quarter hour. */
async function refine(a: Date, b: Date, changed: (ps: TransitPosition[]) => boolean): Promise<Date> {
  let lo = a.getTime(), hi = b.getTime();
  while (hi - lo > 15 * 60 * 1000) {
    const mid = (lo + hi) / 2;
    if (changed(await positionsAt(new Date(mid)))) hi = mid; else lo = mid;
  }
  return new Date(hi);
}

/**
 * Sign changes and retrograde/direct stations inside the window, found by
 * stepping through Swiss Ephemeris positions and refining each change.
 */
export async function transitEvents(
  from: Date, to: Date, planets: PlanetName[],
): Promise<TransitEvent[]> {
  const step = planets.includes("Moon") ? DAY / 4 : DAY;
  const events: TransitEvent[] = [];
  let prevT = from;
  let prev = await positionsAt(from);
  for (let t = from.getTime() + step; ; t += step) {
    const cur = new Date(Math.min(t, to.getTime()));
    const ps = await positionsAt(cur);
    for (const p of planets) {
      const a = find(prev, p), b = find(ps, p);
      if (a.sign !== b.sign) {
        const date = await refine(prevT, cur, xs => find(xs, p).sign !== a.sign);
        events.push({ date, planet: p, kind: "ingress", sign: b.sign, retrograde: b.speed < 0 && p !== "Rahu" && p !== "Ketu" });
      }
      if (STATION_PLANETS.includes(p) && Math.sign(a.speed) !== Math.sign(b.speed)) {
        const date = await refine(prevT, cur, xs => Math.sign(find(xs, p).speed) !== Math.sign(a.speed));
        events.push({ date, planet: p, kind: b.speed < 0 ? "retrograde" : "direct", sign: b.sign, retrograde: b.speed < 0 });
      }
    }
    prev = ps;
    prevT = cur;
    if (cur.getTime() >= to.getTime()) break;
  }
  return events.sort((x, y) => x.date.getTime() - y.date.getTime());
}

// ── Transit factors ─────────────────────────────────────────────────────────

// Gochara from the natal Moon — the houses in which each planet's transit is
// classically favourable (Phaladeepika ch. 26). Vedha is not applied.
const GOCHARA_GOOD: Record<PlanetName, number[]> = {
  Sun: [3, 6, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [3, 6, 11], Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12], Saturn: [3, 6, 11],
  Rahu: [3, 6, 11], Ketu: [3, 6, 11],
} as Record<PlanetName, number[]>;

const WEIGHT: Record<string, number> = {
  Saturn: 3, Jupiter: 3, Rahu: 2, Ketu: 2, Mars: 2, Sun: 1, Venus: 1, Mercury: 1, Moon: 1,
};

export const SLOW: PlanetName[] = ["Saturn", "Jupiter", "Rahu", "Ketu"];

export interface TransitFactor {
  planet: PlanetName;
  sign: number;
  houseFromAsc: number;
  houseFromMoon: number;
  retrograde: boolean;
  favourable: boolean;       // gochara from Moon
  dashaLord: boolean;        // the planet runs one of the three active dasha levels
  domainHouses: number[];    // domain houses it occupies, aspects or rules
  score: number;             // signed weight
}

function factorFor(
  facts: ChartFacts, pos: TransitPosition, dasha: DatedDasha | null, domainHouses: number[],
): TransitFactor {
  const p = pos.name as PlanetName;
  const moonSign = facts.natalPlanetPositions.Moon?.sign ?? facts.ascendantSign;
  const houseFromAsc = nthFrom(facts.ascendantSign, pos.sign);
  const houseFromMoon = nthFrom(moonSign, pos.sign);
  const favourable = (GOCHARA_GOOD[p] ?? []).includes(houseFromMoon);
  const dashaLord = !!dasha && [dasha.md.planet, dasha.ad.planet, dasha.pd.planet].includes(p);
  const aspected = aspectsFrom(p, pos.sign).map(s => nthFrom(facts.ascendantSign, s));
  const touched = new Set<number>([houseFromAsc, ...aspected, ...(facts.planetLordships[p] ?? [])]);
  const dHouses = domainHouses.filter(h => touched.has(h));
  let score = (favourable ? 1 : -1) * (WEIGHT[p] ?? 1);
  if (dashaLord) score *= 1.5;
  if (dHouses.length) score *= 1.5;
  return {
    planet: p, sign: pos.sign, houseFromAsc, houseFromMoon, retrograde: pos.speed < 0 && p !== "Rahu" && p !== "Ketu",
    favourable, dashaLord, domainHouses: dHouses, score,
  };
}

// ── Dated windows ───────────────────────────────────────────────────────────

export type Direction = "favourable" | "caution" | "mixed";
export type Confidence = "firm" | "moderate" | "tentative";

export interface WindowEvent { t: Date; label: string }

export interface TimingSegment {
  from: Date;
  to: Date;
  opens: string | null;         // the event that opens this window (at `from`)
  inner: WindowEvent[];         // later events folded into this window, with their dates
  direction: Direction;
  confidence: Confidence;
  factors: TransitFactor[];     // positions as the window opens (moving + shifting slow planets)
  changes: Array<{ t: Date; f: TransitFactor }>; // positions that change at an inner event
  endFactors: TransitFactor[];  // positions as the window closes (used when folding)
  dasha: DatedDasha | null;
}

function judge(factors: TransitFactor[]): { direction: Direction; confidence: Confidence } {
  const relevant = factors.filter(f => f.domainHouses.length || f.dashaLord);
  const use = relevant.length ? relevant : factors;
  const total = use.reduce((s, f) => s + f.score, 0);
  const pos = use.filter(f => f.score > 0).length, neg = use.filter(f => f.score < 0).length;
  const agreement = Math.max(pos, neg) / Math.max(1, pos + neg);
  const direction: Direction = total >= 2 ? "favourable" : total <= -2 ? "caution" : "mixed";
  const confidence: Confidence =
    direction !== "mixed" && Math.abs(total) >= 5 && agreement >= 0.75 && use.length >= 3 ? "firm"
    : direction !== "mixed" && agreement >= 0.6 ? "moderate"
    : "tentative";
  return { direction, confidence };
}

export interface TimingEvidence {
  window: PredictionWindow;
  domain: string;
  dashaStart: DatedDasha | null;
  dashaChanges: DashaTransition[];
  events: TransitEvent[];
  backdrop: TransitFactor[];
  segments: TimingSegment[];
  pratyantarLink: string[];
  timezone: string;            // dates in the text are rendered in this zone
  text: string;
}

const MOVING_BY_HORIZON: Record<Horizon, PlanetName[]> = {
  day:   ["Moon", "Sun", "Mars", "Mercury", "Venus"],
  week:  ["Moon", "Sun", "Mars", "Mercury", "Venus"],
  month: ["Sun", "Mars", "Mercury", "Venus"],
  year:  ["Mars"],
};

// Windows are split at every event so "before" and "after" a date stay
// distinct. Windows shorter than MIN_WINDOW, and the shortest ones beyond
// MAX_SEGMENTS, are folded into a neighbour; the folded event keeps its date
// and the positions it changes are listed inline, so nothing is hidden.
const MAX_SEGMENTS: Record<Horizon, number> = { day: 5, week: 6, month: 6, year: 8 };
const HOUR = 60 * 60 * 1000;
const MIN_WINDOW: Record<Horizon, number> = { day: 3 * HOUR, week: 12 * HOUR, month: 2 * DAY, year: 7 * DAY };

export async function buildTimingEvidence(opts: {
  facts: ChartFacts;
  timeline: Period[];
  window: PredictionWindow;
  domain: string;
  timezone?: string;
}): Promise<TimingEvidence> {
  const { facts, timeline, window, domain } = opts;
  const tz = opts.timezone || "Asia/Kolkata";
  const domainHouses = DOMAIN_HOUSES[domain]?.houses ?? [];
  const moving = MOVING_BY_HORIZON[window.horizon];
  const tracked = [...moving, ...SLOW];

  const [events, dashaChanges] = await Promise.all([
    transitEvents(window.from, window.to, tracked as PlanetName[]),
    Promise.resolve(dashaTransitions(timeline, window.from, window.to)),
  ]);
  // Moon ingresses only matter for day/week questions; keep them out of the list otherwise.
  const shownEvents = events.filter(e => e.planet !== "Moon" || window.horizon !== "month");
  const shiftingSlow = new Set<PlanetName>(shownEvents.filter(e => SLOW.includes(e.planet)).map(e => e.planet));

  // Window boundaries: every transit event and dasha change.
  const cuts = [
    ...shownEvents.map(e => ({ t: e.date, label: shortEvent(e) })),
    ...dashaChanges.map(c => ({ t: c.date, label: `${c.level} changes ${c.from} → ${c.to}` })),
  ].sort((a, b) => a.t.getTime() - b.t.getTime());

  const bounds: Array<{ t: Date; label: string | null }> = [{ t: window.from, label: null }, ...cuts];
  let segments: TimingSegment[] = [];
  for (let i = 0; i < bounds.length; i++) {
    const from = bounds[i].t, to = bounds[i + 1]?.t ?? window.to;
    if (to.getTime() - from.getTime() < HOUR && i + 1 < bounds.length) {
      // Two events within the hour (e.g. Rahu and Ketu): one window opens with both.
      bounds[i + 1].label = [bounds[i].label, bounds[i + 1].label].filter(Boolean).join("; ");
      bounds[i + 1].t = from;
      continue;
    }
    const mid = new Date((from.getTime() + to.getTime()) / 2);
    const [ps, dasha] = [await positionsAt(mid), dashaAt(timeline, mid)];
    const all = ps.map(pos => factorFor(facts, pos, dasha, domainHouses));
    // Slow planets that change sign or station inside the period are listed in every
    // window too, so their before/after positions are visible.
    const factors = all.filter(f => (moving.includes(f.planet) || shiftingSlow.has(f.planet)) && (f.planet !== "Moon" || window.horizon !== "month"));
    // Every planet steers the verdict; the slow ones are listed once, as the backdrop.
    const verdict = judge(all.filter(f => f.planet !== "Moon" || window.horizon !== "month"));
    segments.push({ from, to, opens: bounds[i].label, inner: [], ...verdict, factors, changes: [], endFactors: factors, dasha });
  }
  segments = foldSegments(segments, MIN_WINDOW[window.horizon], MAX_SEGMENTS[window.horizon]);

  const startPs = await positionsAt(window.from);
  const dashaStart = dashaAt(timeline, window.from);
  const backdrop = startPs
    .filter(pos => SLOW.includes(pos.name as PlanetName))
    .map(pos => factorFor(facts, pos, dashaStart, domainHouses));

  const pratyantarLink = dashaStart ? describePratyantar(facts, dashaStart, domainHouses, tz) : [];

  const evidence: Omit<TimingEvidence, "text"> = {
    window, domain, dashaStart, dashaChanges, events: shownEvents, backdrop, segments, pratyantarLink, timezone: tz,
  };
  return { ...evidence, text: renderTiming(evidence, facts, tz) };
}

const sameFactor = (x: TransitFactor, y: TransitFactor) =>
  x.houseFromAsc === y.houseFromAsc && x.retrograde === y.retrograde && x.favourable === y.favourable && x.dashaLord === y.dashaLord;

const CONF_RANK: Record<Confidence, number> = { tentative: 0, moderate: 1, firm: 2 };

/** Join two adjacent windows; `b`'s opening event and changed positions stay visible with their date. */
function joinSegments(a: TimingSegment, b: TimingSegment): TimingSegment {
  const changed = b.factors.filter(f => {
    const prev = a.endFactors.find(x => x.planet === f.planet);
    return !prev || !sameFactor(prev, f);
  }).map(f => ({ t: b.from, f }));
  const sameDir = a.direction === b.direction;
  return {
    ...a,
    to: b.to,
    inner: [...a.inner, ...(b.opens ? [{ t: b.from, label: b.opens }] : []), ...b.inner],
    changes: [...a.changes, ...changed, ...b.changes],
    endFactors: b.endFactors,
    direction: sameDir ? a.direction : "mixed",
    confidence: sameDir && CONF_RANK[b.confidence] < CONF_RANK[a.confidence] ? b.confidence : sameDir ? a.confidence : "tentative",
  };
}

/** Fold windows shorter than `minLen`, then the shortest, into their shorter neighbour until `max` remain. */
function foldSegments(segs: TimingSegment[], minLen: number, max: number): TimingSegment[] {
  const out = [...segs];
  const len = (s: TimingSegment) => s.to.getTime() - s.from.getTime();
  const shortest = () => out.reduce((k, s, i) => (len(s) < len(out[k]) ? i : k), 0);
  while (out.length > 1) {
    const k = shortest();
    if (len(out[k]) >= minLen && out.length <= max) break;
    const j = k === 0 ? 1 : k === out.length - 1 ? k - 1 : len(out[k - 1]) <= len(out[k + 1]) ? k - 1 : k + 1;
    const lo = Math.min(j, k);
    out.splice(lo, 2, joinSegments(out[lo], out[lo + 1]));
  }
  return out;
}

// ── Pratyantar ──────────────────────────────────────────────────────────────

function placement(facts: ChartFacts, p: PlanetName): string {
  const pos = facts.natalPlanetPositions[p];
  if (!pos) return `${p}: placement not available`;
  const cond = facts.planetaryConditions[p];
  const flags = [cond?.signDignity, cond?.retrograde ? "retrograde" : null, cond?.combust ? "combust" : null].filter(Boolean).join(", ");
  const rules = (facts.planetLordships[p] ?? []).map(ordinal);
  return `${p} in your ${ordinal(pos.house)} house (${pos.signName})${flags ? `, ${flags}` : ""}${rules.length ? `, rules your ${rules.join(" & ")}` : ""}`;
}

/** Natural relationship, using the dispositor for a node. */
function natural(a: PlanetName, b: PlanetName, facts: ChartFacts): string {
  const actor = (p: PlanetName) => (p === "Rahu" || p === "Ketu")
    ? SIGN_LORD[facts.natalPlanetPositions[p]?.sign ?? 1]
    : p;
  const A = actor(a), B = actor(b);
  const note = [a !== A ? `${a} acts through its sign lord ${A}` : null, b !== B ? `${b} acts through its sign lord ${B}` : null]
    .filter(Boolean).join("; ");
  if (A === B) return `${note ? `${note}, so it channels ${A}` : "same planet"}`;
  return `${note ? `${note}; ` : ""}${A} sees ${B} as ${naturalView(A, B)}, ${B} sees ${A} as ${naturalView(B, A)}`;
}

function describePratyantar(facts: ChartFacts, d: DatedDasha, domainHouses: number[], tz: string): string[] {
  const pd = d.pd.planet as PlanetName;
  const lines = [`${placement(facts, pd)}.`];
  for (const [lord, role] of [[d.md.planet, "Mahadasha"], [d.ad.planet, "Antardasha"]] as const) {
    if (lord === pd) { lines.push(`It is also the ${role} lord — its themes are doubled.`); continue; }
    const a = facts.natalPlanetPositions[pd], b = facts.natalPlanetPositions[lord as PlanetName];
    if (!a || !b) continue;
    const rel = houseRelation(nthFrom(a.sign, b.sign));
    const asp = [
      aspectsFrom(pd, a.sign).includes(b.sign) ? `${pd} aspects ${lord}` : null,
      aspectsFrom(lord as PlanetName, b.sign).includes(a.sign) ? `${lord} aspects ${pd}` : null,
    ].filter(Boolean).join(", ");
    lines.push(`With ${lord} (${role}): ${lord} is ${ordinal(nthFrom(a.sign, b.sign))} from ${pd} — ${rel}${asp ? `; ${asp}` : ""}; ${natural(pd, lord as PlanetName, facts)}.`);
  }
  if (domainHouses.length) {
    const pos = facts.natalPlanetPositions[pd];
    const ruled = (facts.planetLordships[pd] ?? []).filter(h => domainHouses.includes(h));
    const occ = pos && domainHouses.includes(pos.house) ? [pos.house] : [];
    const hit = [...new Set([...ruled, ...occ])].sort((x, y) => x - y);
    lines.push(hit.length
      ? `It brings your ${hit.map(ordinal).join(" & ")} house${hit.length > 1 ? "s" : ""} into focus for this question.`
      : `It neither rules nor occupies the houses for this question — its effect here is indirect.`);
  }
  lines.push(`Runs ${fmtRange(d.pd.start, d.pd.end, tz, true)}.`);
  return lines;
}

// ── Rendering (compact — Groq free tier counts every token) ─────────────────

function fmt(d: Date, tz: string, withYear = false): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: tz });
}
function fmtMonth(d: Date, tz: string): string {
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: tz });
}
/** Dasha boundaries are only good to a day or two across software, so they are marked "~". */
function fmtRange(a: Date, b: Date, tz: string, approx = false): string {
  const t = approx ? "~" : "";
  return `${t}${fmt(a, tz, true)} – ${t}${fmt(b, tz, true)}`;
}


/** Short label used inside a window line (houses appear in the factors). */
function shortEvent(e: TransitEvent): string {
  return e.kind === "ingress"
    ? `${e.planet} ${e.retrograde ? "moves back into" : "enters"} ${SIGN_NAMES[e.sign - 1]}`
    : e.kind === "direct" ? `${e.planet} turns direct (its retrograde ends)` : `${e.planet} turns retrograde (starts moving backward)`;
}

// Compact notation, explained once in the legend: "Sun 6H/12M− *@6,12" =
// Sun in the 6th house from the Ascendant and 12th from the Moon, unfavourable
// by gochara, an active dasha lord, touching houses 6 and 12.
function factorText(f: TransitFactor): string {
  return `${f.planet}${f.retrograde ? "(R)" : ""} ${f.houseFromAsc}H/${f.houseFromMoon}M${f.favourable ? "+" : "−"}` +
    `${f.dashaLord ? "*" : ""}${f.domainHouses.length ? `@${f.domainHouses.join(",")}` : ""}`;
}

/**
 * Plain-language key dates straight from the computed windows. The answer gate
 * adds this when it had to drop dated sentences, so a reading never silently
 * loses its timing (Gemini review safeguard B).
 */
export function renderKeyDates(ev: TimingEvidence): string {
  const tz = ev.timezone;
  const plain = (label: string) => label
    .replace(/(Mahadasha|Antardasha|Pratyantar) changes (\w+) → (\w+)/g, "the $1 changes from $2 to $3")
    .replace(/ \((?:its retrograde ends|starts moving backward)\)/g, "");
  // Neighbouring windows with the same verdict read as one stretch here.
  const runs: Array<{ from: Date; to: Date; direction: Direction; events: string[] }> = [];
  for (const s of ev.segments) {
    const events = [
      ...(s.opens ? [`${plain(s.opens)} on ${fmt(s.from, tz)}`] : []),
      ...s.inner.map(e => `${plain(e.label)} on ${fmt(e.t, tz)}`),
    ];
    const last = runs[runs.length - 1];
    if (last && last.direction === s.direction) { last.to = s.to; last.events.push(...events); }
    else runs.push({ from: s.from, to: s.to, direction: s.direction, events });
  }
  const parts = runs.map(r => {
    const a = fmt(r.from, tz), b = fmt(r.to, tz);
    return `${a === b ? a : `${a} to ${b}`}: ${r.direction}${r.events.length ? ` (${r.events.join("; ")})` : ""}.`;
  });
  return `Key dates, computed from your chart: ${parts.join(" ")}`;
}

function renderTiming(ev: Omit<TimingEvidence, "text">, facts: ChartFacts, tz: string): string {
  const { window, dashaStart: d, dashaChanges, backdrop, segments, pratyantarLink, domain } = ev;
  const L: string[] = [];
  L.push(`━━━ TIMING EVIDENCE (computed: Swiss Ephemeris + Vimshottari — use ONLY these dates) ━━━`);
  L.push(`PERIOD ASKED: ${fmt(window.from, tz, true)} – ${fmt(window.to, tz, true)}.`);
  if (d) {
    L.push(`DASHA: ${d.md.planet} Mahadasha (${fmtMonth(d.md.start, tz)} – ${fmtMonth(d.md.end, tz)}) › ` +
      `${d.ad.planet} Antardasha (${fmtRange(d.ad.start, d.ad.end, tz, true)}) › ` +
      `${d.pd.planet} Pratyantar (${fmtRange(d.pd.start, d.pd.end, tz, true)}).`);
  }
  L.push(`DASHA CHANGES IN PERIOD: ${dashaChanges.length
    ? dashaChanges.map(c => `~${fmt(c.date, tz, true)} ${c.level} ${c.from} → ${c.to}`).join("; ")
    : "none — the same dasha runs through the whole period"}.`);
  if (pratyantarLink.length) {
    L.push(`PRATYANTAR LINK (${d!.pd.planet} under ${d!.md.planet}–${d!.ad.planet}):`);
    L.push(...pratyantarLink.map(s => `  ${s}`));
  }
  const dh = DOMAIN_HOUSES[domain];
  L.push(`KEY: "Sun 6H/12M−*@6,12" = Sun in your 6th house and 12th from your Moon; + favourable / − unfavourable ` +
    `by classical gochara from the Moon; * = an active dasha lord${dh ? `; @ = touches these ${dh.label} houses (${dh.houses.join(",")}) by placement, aspect or lordship` : ""}.`);
  L.push(`BACKDROP (slow planets, whole period): ${backdrop.map(factorText).join("; ")}.`);
  L.push(`WINDOWS (split at every sign change, station and dasha change; verdict weighs all planets):`);
  for (const s of segments) {
    const a = fmt(s.from, tz), b = fmt(s.to, tz);
    L.push(`  ${a === b ? a : `${a}–${b}`} · ${s.direction.toUpperCase()} (${s.confidence})` +
      `${s.opens ? ` · opens: ${s.opens}` : ""}` +
      `${s.factors.length ? ` · ${s.factors.map(factorText).join("; ")}` : ""}` +
      `${s.inner.length ? ` · then ${s.inner.map(e => `${fmt(e.t, tz)} ${e.label}`).join(", ")}` : ""}` +
      `${s.changes.length ? ` → ${s.changes.map(c => `${factorText(c.f)} from ${fmt(c.t, tz)}`).join("; ")}` : ""}`);
  }
  if (segments.length === 1 && !segments[0].opens && !segments[0].inner.length) {
    L.push(`  (No sign change, station or dasha change in this period — the sky is steady throughout.)`);
  }
  return L.join("\n");
}
