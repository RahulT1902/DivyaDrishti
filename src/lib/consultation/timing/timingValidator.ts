/**
 * Integrity gate for dated claims (Step A conditions 1 and 4).
 *
 * The narrator may only use dates that appear in TIMING EVIDENCE, and a dated
 * claim about a planet ("Mercury turns direct on 13 Nov", "Mars enters Leo on
 * 12 Nov") must match a computed event. Errors are fed back to the model for
 * one rewrite; sentences that still fail are dropped (see punditAnswer.ts).
 */

import type { TimingEvidence, TransitEvent } from "./timingEngine";
import { SIGN_NAMES } from "./relations";

const DAY = 24 * 60 * 60 * 1000;
const MONTH_RE = "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*";
const PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

const dayKey = (d: Date, tz: string) => {
  const [day, mon] = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: tz }).toLowerCase().split(" ");
  return `${Number(day)} ${mon.slice(0, 3)}`;
};

/** "16 Nov", "16th November", "16th of November", "November 16", and the start of "5 to 16 Dec" / "5–16 Dec" → ["16 nov"]. */
export function datesIn(text: string): string[] {
  const out: string[] = [];
  for (const x of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:to|until|till|through|and|[-–—])\\s*\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\b`, "gi"))) out.push(`${Number(x[1])} ${x[2].toLowerCase()}`);
  for (const x of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\b`, "gi"))) out.push(`${Number(x[1])} ${x[2].toLowerCase()}`);
  for (const x of text.matchAll(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "gi"))) out.push(`${Number(x[2])} ${x[1].toLowerCase()}`);
  return [...new Set(out)];
}

/** Every day the evidence names, with a day either side for timezone rounding. */
export function allowedDates(ev: TimingEvidence): Set<string> {
  const ds: Date[] = [ev.window.from, ev.window.to, ...ev.events.map(e => e.date), ...ev.dashaChanges.map(c => c.date)];
  if (ev.dashaStart) {
    const { md, ad, pd } = ev.dashaStart;
    ds.push(md.start, md.end, ad.start, ad.end, pd.start, pd.end);
  }
  for (const s of ev.segments) ds.push(s.from, s.to, ...s.inner.map(i => i.t));
  const set = new Set<string>();
  for (const d of ds) for (const off of [-1, 0, 1]) set.add(dayKey(new Date(d.getTime() + off * DAY), ev.timezone));
  return set;
}

type Claim = TransitEvent["kind"];

const CLAIM_RES: Array<[Claim, RegExp]> = [
  ["retrograde", /\b(?:turns?|turning|goes|going|becomes?|stations?|stationing)\s+retrograde\b|\bretrograde\s+(?:starts?|starting|begins?|beginning)\b/gi],
  ["direct", /\b(?:turns?|turning|goes|going|stations?|stationing)\s+direct\b|\bretrograde\s+(?:ends?|ending)\b|\bends?\s+(?:its|his|her)\s+retrograde\b/gi],
  // An ingress names where the planet goes ("enters Leo", "moves into your 3rd house"),
  // so "the sub-period moves into Ketu" is not read as Ketu changing sign.
  ["ingress", new RegExp(`\\b(?:enters?|entering|entry\\s+into|moves?\\s+(?:back\\s+)?into|moving\\s+(?:back\\s+)?into|shifts?\\s+into|ingress(?:\\s+into)?)\\s+` +
    `(?:the\\s+|your\\s+|its\\s+)?(?:\\d{1,2}(?:st|nd|rd|th)|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|${SIGN_NAMES.join("|")})\\b`, "gi")],
];
const PLANET_RE = new RegExp(`\\b(${PLANET_NAMES.join("|")})\\b`, "g");

/**
 * Every dated event claim in a sentence, each tied to the planet named
 * nearest before it, so "the Sun enters Sagittarius and Mercury enters
 * Scorpio" yields two claims. A planet after "from" is a reference point, not
 * the subject, and is skipped.
 */
function claimsIn(sentence: string): Array<{ planet: string; claim: Claim }> {
  const mentions = [...sentence.matchAll(PLANET_RE)]
    .filter(m => !/\bfrom\s+(?:the\s+|your\s+|natal\s+)*$/i.test(sentence.slice(Math.max(0, m.index! - 20), m.index!)));
  const out: Array<{ planet: string; claim: Claim }> = [];
  for (const [claim, re] of CLAIM_RES) {
    for (const m of sentence.matchAll(re)) {
      const p = [...mentions].reverse().find(x => x.index! < m.index!);
      if (p) out.push({ planet: p[1], claim });
    }
  }
  return out;
}

export function validateTimingClaims(ev: TimingEvidence, text: string): { errors: string[] } {
  const errors: string[] = [];
  const allowed = allowedDates(ev);
  const tz = ev.timezone;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: tz });

  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    const dates = datesIn(sentence);
    for (const d of dates) {
      if (!allowed.has(d)) errors.push(`"${d}" is not a date in TIMING EVIDENCE — use only the dates given there.`);
    }
    if (dates.length === 0) continue;
    const near = (e: TransitEvent) => dates.some(d => [-1, 0, 1].some(off => dayKey(new Date(e.date.getTime() + off * DAY), tz) === d));
    for (const { planet: p, claim } of claimsIn(sentence)) {
      const mine = ev.events.filter(e => e.planet === p);
      if (mine.some(e => e.kind === claim && near(e))) continue;
      const sameDay = mine.find(near);
      const sameKind = mine.find(e => e.kind === claim);
      const said = claim === "ingress" ? "a sign change" : `turning ${claim}`;
      if (sameDay) {
        const actual = sameDay.kind === "ingress" ? `enters ${SIGN_NAMES[sameDay.sign - 1]}` : `turns ${sameDay.kind}`;
        errors.push(`The answer has ${p} ${said} around ${dates.join("/")}, but TIMING EVIDENCE says ${p} ${actual} on ${fmt(sameDay.date)}.`);
      } else if (sameKind) {
        const actual = sameKind.kind === "ingress" ? `enters ${SIGN_NAMES[sameKind.sign - 1]}` : `turns ${sameKind.kind}`;
        errors.push(`The answer dates ${p} ${said} to ${dates.join("/")}, but TIMING EVIDENCE says ${p} ${actual} on ${fmt(sameKind.date)}.`);
      } else {
        errors.push(`The answer has ${p} ${said} around ${dates.join("/")}, but TIMING EVIDENCE lists no such event for ${p} in this period.`);
      }
    }
  }
  errors.push(...directionErrors(ev, text));
  return { errors: [...new Set(errors)] };
}

const CAUTION_RE = /\b(caution|careful|care|watch|challenging|strain|difficult|tougher|harder|irritat)/i;
const FAVOUR_RE = /\b(favourable|favorable|supportive|support|relief|easier|easing|better|good window|recover|positive)/i;

/**
 * A sentence that labels a dated window as caution or favourable must agree
 * with the computed window verdict (condition 2). Mixed windows accept either.
 */
function directionErrors(ev: TimingEvidence, text: string): string[] {
  const errors: string[] = [];
  const tz = ev.timezone;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: tz });
  for (const sentence of text.split(/(?<=[.!?])\s+|\n+/)) {
    const dates = datesIn(sentence);
    if (!dates.length) continue;
    const saysCaution = CAUTION_RE.test(sentence), saysFavour = FAVOUR_RE.test(sentence);
    if (saysCaution === saysFavour) continue; // neither, or both (a contrast) — nothing to check
    // The window the sentence's first date falls in.
    const seg = ev.segments.find(s => {
      for (let t = s.from.getTime(); t < s.to.getTime(); t += DAY) if (dayKey(new Date(t), tz) === dates[0]) return true;
      return false;
    });
    if (!seg || seg.direction === "mixed") continue;
    if (saysCaution && seg.direction === "favourable") {
      errors.push(`The answer treats ${fmt(seg.from)}–${fmt(seg.to)} as a caution period, but TIMING EVIDENCE marks it FAVOURABLE.`);
    } else if (saysFavour && seg.direction === "caution") {
      errors.push(`The answer treats ${fmt(seg.from)}–${fmt(seg.to)} as favourable, but TIMING EVIDENCE marks it CAUTION.`);
    }
  }
  return errors;
}

/**
 * Whole-answer coverage (conditions 3 and 4): a dasha change inside the period
 * must be mentioned, and the Pratyantar must be related to the Mahadasha or
 * Antardasha lord, not just named. Dropping sentences cannot fix these, so
 * they only drive the rewrite.
 */
export function timingCoverageErrors(ev: TimingEvidence, text: string): string[] {
  const errors: string[] = [];
  const tz = ev.timezone;
  const mentioned = new Set(datesIn(text));
  for (const c of ev.dashaChanges) {
    const near = [-1, 0, 1].some(off => mentioned.has(dayKey(new Date(c.date.getTime() + off * DAY), tz)));
    if (!near) {
      const d = c.date.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: tz });
      errors.push(`TIMING EVIDENCE has a ${c.level} change around ${d} (${c.from} → ${c.to}); say what changes before and after it.`);
    }
  }
  const d = ev.dashaStart;
  if (d && d.pd.planet !== d.md.planet && d.pd.planet !== d.ad.planet) {
    const linked = text.split(/(?<=[.!?])\s+/).some(s =>
      s.includes(d.pd.planet) && (s.includes(d.md.planet) || s.includes(d.ad.planet)) && /pratyantar|sub-?period/i.test(s));
    if (!linked) {
      errors.push(`Explain how the ${d.pd.planet} Pratyantar modifies the ${d.md.planet}–${d.ad.planet} period, using PRATYANTAR LINK ` +
        `(its houses, dignity and its relationship to ${d.md.planet} and ${d.ad.planet}) — naming it is not enough.`);
    }
  }
  return errors;
}
