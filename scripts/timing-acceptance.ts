// Step A (Multi-Domain Phase A) acceptance tests for the shared timing engine.
//
//   npx tsx --env-file=.env scripts/timing-acceptance.ts [--user <user-id prefix>] [--chart <review chart id>]
//
// Deterministic — no AI calls. Every date the engine emits is re-checked
// against an independent computation: dasha changes against getCurrentDasha()
// on either side of the date, sign changes and stations against Swiss
// Ephemeris positions an hour before and after.

import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/prisma";
import { prepareChartContext, type BirthInput } from "../src/lib/consultation/prepareChartContext";
import { buildChartFacts } from "../src/lib/core/astrology/chartFacts";
import { getCurrentDasha, buildAntardasha, type Period } from "../src/lib/astrology/dasha";
import { calculateCurrentTransits } from "../src/lib/astrology/transit";
import {
  buildTimingEvidence, dashaTransitions, resolveWindow, transitEvents, type PredictionWindow, type TimingEvidence,
} from "../src/lib/consultation/timing/timingEngine";
import type { PlanetName, Sign } from "../src/lib/core/types";

const HOUR = 3600_000, DAY = 24 * HOUR;
let pass = 0, fail = 0;
function check(ok: boolean, msg: string) {
  if (ok) { pass++; console.log(`  ✓ ${msg}`); } else { fail++; console.log(`  ✗ ${msg}`); }
}

async function loadBirth(): Promise<{ label: string; birth: BirthInput }> {
  const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
  const user = arg("--user");
  if (user) {
    const u = await prisma.user.findFirst({ where: { id: { startsWith: user } }, include: { birthDetails: true } });
    if (!u?.birthDetails) throw new Error(`No user with birth details matching ${user}`);
    return { label: `user ${user}`, birth: u.birthDetails };
  }
  const charts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "pundit-benchmark", "review-charts.json"), "utf8"));
  const rc = (charts.charts ?? charts).find((c: any) => c.id === (arg("--chart") ?? (charts.charts ?? charts)[0].id));
  return {
    label: `review chart ${rc.id}`,
    birth: { dateOfBirth: new Date(rc.date), timeOfBirth: rc.time, latitude: rc.latitude, longitude: rc.longitude, timezone: rc.timezone },
  };
}

/** Independent check of every transit event and dasha change in an evidence object. */
async function verifyDates(ev: TimingEvidence, timeline: Period[]) {
  for (const e of ev.events) {
    const [before, after] = await Promise.all([
      calculateCurrentTransits(new Date(e.date.getTime() - HOUR)), calculateCurrentTransits(new Date(e.date.getTime() + HOUR)),
    ]);
    const b = before.positions.find(p => p.name === e.planet)!, a = after.positions.find(p => p.name === e.planet)!;
    if (e.kind === "ingress") check(b.sign !== a.sign && a.sign === e.sign, `${e.planet} enters sign ${e.sign} on ${e.date.toISOString().slice(0, 16)} (ephemeris: ${b.sign} → ${a.sign})`);
    else check(Math.sign(b.speed) !== Math.sign(a.speed) && (e.kind === "retrograde") === (a.speed < 0), `${e.planet} turns ${e.kind} on ${e.date.toISOString().slice(0, 16)} (speed ${b.speed.toFixed(3)} → ${a.speed.toFixed(3)})`);
  }
  for (const c of ev.dashaChanges) {
    const b = getCurrentDasha(timeline, new Date(c.date.getTime() - HOUR)), a = getCurrentDasha(timeline, new Date(c.date.getTime() + HOUR));
    const lv = (d: typeof a) => c.level === "Mahadasha" ? d?.md.planet : c.level === "Antardasha" ? d?.ad?.planet : d?.pd?.planet;
    check(lv(b) === c.from && lv(a) === c.to, `${c.level} ${c.from} → ${c.to} on ${c.date.toISOString().slice(0, 10)} (dasha engine: ${lv(b)} → ${lv(a)})`);
  }
  // Windows tile the period with no gaps, and each opens at an event, a dasha change, or the period start.
  const edges = new Set([ev.window.from.getTime(), ...ev.events.map(e => e.date.getTime()), ...ev.dashaChanges.map(c => c.date.getTime())]);
  const s = ev.segments;
  check(s[0].from.getTime() === ev.window.from.getTime() && s[s.length - 1].to.getTime() === ev.window.to.getTime(), "windows cover the whole period");
  check(s.every((x, i) => i === 0 || x.from.getTime() === s[i - 1].to.getTime()), "windows are contiguous");
  check(s.every(x => edges.has(x.from.getTime()) || [...edges].some(t => Math.abs(t - x.from.getTime()) < HOUR)), "every window opens at a computed event or the period start");
  // Every event is visible in the rendered text, either as a window opener or folded in with its date.
  const shown = s.flatMap(x => [x.opens ?? "", ...x.inner.map(i => i.label)]).join(" | ");
  check(ev.events.every(e => shown.includes(e.planet)), "every transit event is named in a window");
}

(async () => {
  const { label, birth } = await loadBirth();
  const now = new Date();
  const { chart, timeline, currentTransits } = await prepareChartContext(birth, { dashaDate: now });
  const asc = chart.lagna.sign as Sign;
  const facts = buildChartFacts(asc, chart.planets.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign })),
    currentTransits.positions.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign })));
  const build = (window: PredictionWindow) => buildTimingEvidence({ facts, timeline, window, domain: "health", timezone: birth.timezone });
  console.log(`\nStep A timing acceptance — ${label}\n`);

  // 0. The dasha clock starts at the birth moment, not midnight of the birth date.
  console.log("Dasha clock");
  check(Math.abs(timeline[0].start.getTime() - chart.birthUtc.getTime()) < 1000, `timeline starts at the birth moment (${chart.birthUtc.toISOString()})`);

  // 1. Current period: three dated levels, matching the existing dasha engine.
  console.log("\n1. Current dasha period");
  const cur = await build(resolveWindow("this month", now));
  const ref = getCurrentDasha(timeline, now)!;
  const d = cur.dashaStart!;
  check(!!d && d.md.planet === ref.md.planet && d.ad.planet === ref.ad?.planet && d.pd.planet === ref.pd?.planet,
    `${d?.md.planet}–${d?.ad.planet}–${d?.pd.planet} (engine: ${ref.md.planet}–${ref.ad?.planet}–${ref.pd?.planet})`);
  check(!!d && d.pd.start <= now && now < d.pd.end, `Pratyantar dated ${d.pd.start.toISOString().slice(0, 10)} → ${d.pd.end.toISOString().slice(0, 10)}`);
  check(cur.pratyantarLink.some(l => l.includes(`With ${d.md.planet}`) || l.includes("also the Mahadasha")) &&
        cur.pratyantarLink.some(l => l.includes(`With ${d.ad.planet}`) || l.includes("also the Antardasha")),
    "Pratyantar link relates it to both the Mahadasha and Antardasha lords");
  check(/PRATYANTAR LINK/.test(cur.text) && cur.text.includes(d.pd.planet), "rendered block carries the Pratyantar link");
  await verifyDates(cur, timeline);

  // 2. The current Pratyantar's end, inside a window that spans it.
  console.log(`\n2. Window crossing the Pratyantar change (~${d.pd.end.toISOString().slice(0, 10)})`);
  const pdWin = await build({ from: new Date(d.pd.end.getTime() - 15 * DAY), to: new Date(d.pd.end.getTime() + 15 * DAY), horizon: "month" });
  const pdChange = pdWin.dashaChanges.find(c => c.level === "Pratyantar" && c.from === d.pd.planet);
  check(!!pdChange && Math.abs(pdChange.date.getTime() - d.pd.end.getTime()) < 1000, `Pratyantar change ${pdChange?.from} → ${pdChange?.to} found`);
  check(pdWin.segments.some(s => s.opens?.includes("Pratyantar changes") || s.inner.some(i => i.label.includes("Pratyantar changes"))),
    "a window opens at (or names) the Pratyantar change, so before/after is distinguishable");
  await verifyDates(pdWin, timeline);

  // 3. A month with several sign changes.
  console.log("\n3. Month with multiple sign changes");
  let multi: TimingEvidence | null = null;
  for (let m = 0; m < 12 && !multi; m++) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
    const w = { from, to: new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1)), horizon: "month" as const };
    const ev = await build(w);
    if (ev.events.filter(e => e.kind === "ingress").length >= 3) multi = ev;
  }
  check(!!multi, `found ${multi?.window.from.toISOString().slice(0, 7)} with ${multi?.events.filter(e => e.kind === "ingress").length} sign changes`);
  if (multi) await verifyDates(multi, timeline);

  // 4. A month with a retrograde/direct station.
  console.log("\n4. Month with a retrograde/direct station");
  let station: TimingEvidence | null = null;
  for (let m = 0; m < 12 && !station; m++) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
    const ev = await build({ from, to: new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1)), horizon: "month" });
    if (ev.events.some(e => e.kind !== "ingress")) station = ev;
  }
  const st = station?.events.find(e => e.kind !== "ingress");
  check(!!st, `found ${station?.window.from.toISOString().slice(0, 7)}: ${st?.planet} turns ${st?.kind}`);
  if (station) await verifyDates(station, timeline);

  // 5. A period crossing an Antardasha boundary.
  console.log("\n5. Period crossing an Antardasha boundary");
  const nextAd = buildAntardasha(ref.md).find(a => a.start > now) ?? null;
  if (nextAd) {
    const adWin = await build({ from: new Date(nextAd.start.getTime() - 20 * DAY), to: new Date(nextAd.start.getTime() + 20 * DAY), horizon: "month" });
    const adChange = adWin.dashaChanges.find(c => c.level === "Antardasha" || c.level === "Mahadasha");
    check(!!adChange && adChange.to === nextAd.planet, `${adChange?.level} ${adChange?.from} → ${adChange?.to} on ~${adChange?.date.toISOString().slice(0, 10)}`);
    check(adWin.dashaChanges.filter(c => c.date.getTime() === nextAd.start.getTime()).length === 1, "an Antardasha change is reported once, not again as a Pratyantar change");
    await verifyDates(adWin, timeline);
  } else {
    check(false, "no later Antardasha in the current Mahadasha to test against");
  }

  // 6. Token budget for the rendered block (Groq free tier: 8,000 tokens/minute).
  console.log("\n6. Compactness");
  for (const tf of ["today", "this week", "this month", "this year"]) {
    const ev = await build(resolveWindow(tf, now));
    const approx = Math.round(ev.text.length / 4);
    check(approx <= 750, `${tf}: ~${approx} tokens, ${ev.segments.length} windows`);
  }

  // 7. dashaTransitions agrees with a brute-force scan of the dasha engine.
  console.log("\n7. Dasha changes vs brute-force scan (next 2 years, 6-hour steps)");
  const from = now, to = new Date(now.getTime() + 730 * DAY);
  const found = dashaTransitions(timeline, from, to).map(c => c.date.getTime());
  let scanned = 0, prevPd = getCurrentDasha(timeline, from)?.pd?.planet;
  for (let t = from.getTime() + 6 * HOUR; t < to.getTime(); t += 6 * HOUR) {
    const pd = getCurrentDasha(timeline, new Date(t))?.pd?.planet;
    if (pd !== prevPd) { scanned++; check(found.some(f => f <= t && f > t - 6 * HOUR), `scan change at ${new Date(t).toISOString().slice(0, 13)} is listed`); }
    prevPd = pd;
  }
  check(scanned === found.length, `${found.length} changes listed, ${scanned} found by scan`);

  console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
