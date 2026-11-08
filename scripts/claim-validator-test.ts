// Safeguard A/B tests for the answer gate: multi-planet sentences, dignity,
// house, relation, friendship and dasha-lord claims, the key-dates fallback
// and month-with-year questions.
//
//   npx tsx --env-file=.env scripts/claim-validator-test.ts --user <user-id prefix>
//
// Deterministic — no AI calls. Expected answers are derived from the chart,
// so the tests run on any chart; sentences quoted from real model answers are
// checked only where they apply to that chart.

import { prisma } from "../src/lib/prisma";
import { prepareChartContext } from "../src/lib/consultation/prepareChartContext";
import { buildChartFacts } from "../src/lib/core/astrology/chartFacts";
import { getDignityInfo } from "../src/lib/core/astrology/dignityEngine";
import { analyzeIntent } from "../src/lib/consultation/brain/L1_intentEngine";
import { buildTimingEvidence, renderKeyDates, resolveWindow } from "../src/lib/consultation/timing/timingEngine";
import { validateTimingClaims } from "../src/lib/consultation/timing/timingValidator";
import { validateChartClaims } from "../src/lib/consultation/timing/claimValidator";
import { naturalView, nthFrom, ordinal, SIGN_NAMES } from "../src/lib/consultation/timing/relations";
import type { PlanetName, Sign } from "../src/lib/core/types";

let pass = 0, fail = 0;
function check(ok: boolean, msg: string, detail?: string[]) {
  if (ok) { pass++; console.log(`  ✓ ${msg}`); } else { fail++; console.log(`  ✗ ${msg}`); }
  if (detail?.length) for (const d of detail) console.log(`      · ${d}`);
}
const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };

(async () => {
  const user = arg("--user");
  if (!user) throw new Error("usage: --user <id prefix>");
  const u = await prisma.user.findFirst({ where: { id: { startsWith: user } }, include: { birthDetails: true } });
  const b = u!.birthDetails!;
  const ref = new Date(Date.UTC(2026, 10, 8));
  const { chart, timeline, currentTransits } = await prepareChartContext(b, { dashaDate: ref });
  const asc = chart.lagna.sign as Sign;
  const facts = buildChartFacts(asc, chart.planets.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign })),
    currentTransits.positions.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign })));
  const ev = await buildTimingEvidence({ facts, timeline, window: resolveWindow("december", ref), domain: "health", timezone: b.timezone });
  const gate = (t: string) => [...validateTimingClaims(ev, t).errors, ...validateChartClaims(ev, facts, t).errors];
  const fails = (t: string, msg: string) => { const e = gate(t); check(e.length > 0, `rejects: ${msg}`, e); };
  const passes = (t: string, msg: string) => { const e = gate(t); check(e.length === 0, `accepts: ${msg}`, e); };
  const natal = (p: PlanetName) => facts.natalPlanetPositions[p]!;
  const d = ev.dashaStart!;

  console.log(`\nAnswer-gate tests — user ${user}, December 2026 window\n`);

  console.log("Merged and misdated events");
  const ing = ev.events.filter(e => e.kind === "ingress");
  const day = (x: Date) => x.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: b.timezone });
  if (ing.length >= 2 && ing[0].planet !== ing[1].planet) {
    const [x, y] = ing;
    passes(`${x.planet} enters ${SIGN_NAMES[x.sign - 1]} on ${day(x.date)}, and ${y.planet} enters ${SIGN_NAMES[y.sign - 1]} on ${day(y.date)}.`, "two planets, two correct events in one sentence");
    fails(`${x.planet} enters ${SIGN_NAMES[x.sign - 1]} on ${day(y.date)}, and ${y.planet} enters ${SIGN_NAMES[y.sign - 1]} on ${day(y.date)}.`, "first planet given the second planet's date");
  }
  const sunIn = ing.find(e => e.planet === "Sun");
  if (sunIn) {
    const newH = nthFrom(asc, sunIn.sign), oldH = newH === 1 ? 12 : newH - 1;
    fails(`From 5 to ${day(sunIn.date)}, the Sun moves into the ${ordinal(oldH)} and then the ${ordinal(newH)}.`, "Sun 'moves into' a house it was already in (real Groq garble)");
    passes(`On ${day(sunIn.date)} the Sun moves into your ${ordinal(newH)} house.`, "Sun's real ingress with its house");
  }

  // From the Gemini benchmark: a dasha change worded like an ingress, and a contrast sentence.
  for (const c of ev.dashaChanges) passes(`Around ${day(c.date)} the sub-period moves into ${c.to}'s rhythm.`, "a dasha change is not read as a sign change");
  const fav = ev.segments.find(s => s.direction === "favourable");
  if (fav) passes(`While the movement on ${day(fav.from)} is positive, the broader ${d.pd.planet} sub-period cautions against overexertion.`, "a favourable day contrasted with the sub-period");

  console.log("\nDignity");
  for (const p of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as PlanetName[]) {
    const signs = [natal(p).sign, ...ev.segments.flatMap(s => s.factors).filter(f => f.planet === p).map(f => f.sign)];
    const dig = new Set(signs.map(s => getDignityInfo(p, s as Sign).condition.signDignity));
    for (const w of ["exalted", "debilitated"] as const) {
      if (dig.has(w)) passes(`${p} is ${w} here.`, `${p} ${w} (true for this chart)`);
      else fails(`${p} is ${w} here.`, `${p} ${w}`);
    }
  }
  console.log(`  (natal Rahu: ${natal("Rahu").signName}, engine dignity ${facts.planetaryConditions.Rahu?.signDignity})`);

  console.log("\nHouses");
  const v = natal("Venus").house;
  passes(`Venus sits in your ${ordinal(v)} house.`, "Venus in its natal house");
  const tH = new Set(ev.segments.flatMap(s => s.factors).filter(f => f.planet === "Venus").map(f => f.houseFromAsc));
  const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(h => h !== v && !tH.has(h))!;
  fails(`Venus sits in your ${ordinal(wrong)} house.`, `Venus in the ${ordinal(wrong)} (neither natal nor transit)`);
  fails(`Mercury rules your health, and Venus sits in your ${ordinal(wrong)} house.`, "wrong house in a two-planet sentence");

  const satT = new Set(ev.segments.flatMap(s => s.factors).concat(ev.backdrop).filter(f => f.planet === "Saturn").map(f => f.houseFromAsc));
  const satN = natal("Saturn").house;
  if (!satT.has(satN)) {
    fails(`Saturn transits your ${ordinal(satN)} house this month.`, "a natal house given as a transit (real Gemini slip)");
    passes(`Saturn in your ${ordinal(satN)} house at birth steadies you.`, "the same house, stated as natal");
  }

  console.log("\nRelationships");
  const pd = d.pd.planet as PlanetName, ad = d.ad.planet as PlanetName;
  const rel = nthFrom(natal(pd).sign, natal(ad).sign);
  passes(`${ad} is ${ordinal(rel)} from ${pd}, a meaningful link.`, `${ad} ${ordinal(rel)} from ${pd}`);
  fails(`${ad} is ${ordinal(rel === 6 ? 5 : 6)} from ${pd}.`, `${ad} at the wrong distance from ${pd}`);
  passes(`${ad} sees ${pd} as ${naturalView(ad, pd) === "enemy" ? "an" : "a"} ${naturalView(ad, pd)}.`, "natural friendship as tabled");
  const wrongView = naturalView(ad, pd) === "friend" ? "enemy" : "friend";
  fails(`${ad} sees ${pd} as a ${wrongView}.`, "wrong natural friendship");

  console.log("\nDasha lordship");
  passes(`The ${d.md.planet} Mahadasha and ${ad} Antardasha set the tone.`, "correct MD and AD lords");
  passes(`${d.md.planet}'s influence as the Mahadasha lord stays steady.`, "'as the Mahadasha lord' phrasing");
  fails(`The ${ad} Mahadasha sets the tone.`, "AD lord called the Mahadasha lord");
  for (const c of ev.dashaChanges) passes(`From ${day(c.date)} the ${c.to} ${c.level} begins.`, `the incoming ${c.level} lord ${c.to}`);
  const notLord = (["Sun", "Moon", "Mars", "Venus", "Saturn"] as PlanetName[]).find(p => ![d.md.planet, d.ad.planet, d.pd.planet, ...ev.dashaChanges.map(c => c.to)].includes(p))!;
  fails(`The ${notLord} Pratyantar brings relief.`, `${notLord} called the Pratyantar lord`);

  console.log("\nKey-dates fallback (safeguard B)");
  const kd = renderKeyDates(ev);
  console.log(`      ${kd}`);
  passes(kd, "the computed key-dates paragraph passes the same gate");
  check(ev.dashaChanges.every(c => kd.includes(c.to)), "it names every dasha change");

  console.log("\nMonth with year");
  const tf = analyzeIntent("How will my health be in April 2028?", []).timeframe;
  const w = resolveWindow(tf, ref);
  check(w.from.getUTCFullYear() === 2028 && w.from.getUTCMonth() === 3, `"April 2028" → ${w.from.toISOString().slice(0, 10)} – ${w.to.toISOString().slice(0, 10)} (timeframe "${tf}")`);
  const w2 = resolveWindow(analyzeIntent("How will my health be in December?", []).timeframe, ref);
  check(w2.from.getUTCFullYear() === 2026 && w2.from.getUTCMonth() === 11, `"December" still → ${w2.from.toISOString().slice(0, 10)}`);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
