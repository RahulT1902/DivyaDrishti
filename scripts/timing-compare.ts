// Step A comparison on one real chart, scored on the Step A conditions plus
// the Gold Standard rubric.
//
// Groq, before/after (the deployed behaviour vs the timing engine):
//   GEMINI_API_KEY= npx tsx --env-file=.env scripts/timing-compare.ts --user <id prefix> --out <file.md>
// Gemini, the four Step A benchmark questions (timing engine only), on
// BENCHMARK_GEMINI_API_KEY so the live chat's quota is untouched:
//   npx tsx --env-file=.env scripts/timing-compare.ts --gemini [--domain career] --user <id prefix> --out <file.md>
//
// Groq calls are spaced out for its 8,000 tokens/minute free tier.
// The output holds a personal reading — write it outside the repo.

import * as fs from "fs";
import { useBenchmarkGeminiKey } from "./lib/benchmarkKey";
import { prisma } from "../src/lib/prisma";
import { prepareChartContext } from "../src/lib/consultation/prepareChartContext";
import { assemblePunditBrain } from "../src/lib/consultation/brain";
import type { ChartData } from "../src/lib/consultation/brain";
import { generatePunditAnswer } from "../src/lib/consultation/punditAnswer";
import { scoreConsultation } from "../src/lib/consultation/goldStandard/rubric";
import { buildChartFacts } from "../src/lib/core/astrology/chartFacts";
import { computeBodyRiskProfile } from "../src/lib/intelligence/health/bodyRiskProfile";
import { buildHealthFindings } from "../src/lib/intelligence/health/healthFindingsEngine";
import { NatalPromiseAnalyzer, LifeDomainActivationEngine, ManifestationRankingEngine } from "../src/lib/intelligence/lifeInsights/services";
import type { TimingEvidence } from "../src/lib/consultation/timing/timingEngine";
import { allowedDates, datesIn } from "../src/lib/consultation/timing/timingValidator";
import type { PlanetName, Sign } from "../src/lib/core/types";

const GEMINI = process.argv.includes("--gemini");
const DRY = process.argv.includes("--dry"); // build the prompts, call no AI
if (GEMINI && !DRY) useBenchmarkGeminiKey();
const DOMAIN = (() => { const i = process.argv.indexOf("--domain"); return i > 0 ? process.argv[i + 1] : "health"; })();

const GROQ_QUESTIONS = ["How will my health be this month?", "How will my health be in December?"];
// Benchmark questions per domain (Gemini). Health = Step A: dated events +
// Pratyantar; the ~19 Dec Pratyantar change; Mercury turning direct on
// 13 Nov; the ~29 Apr 2028 Antardasha change. Career = Step B: an open
// question, a dated month, a job-change decision and the AD change.
const GEMINI_QUESTIONS: Record<string, string[]> = {
  health: [
    "How will my health be in November 2026?",
    "How will my health be in December 2026?",
    "How will my health be around 13 November?",
    "How will my health be in April 2028?",
  ],
  career: [
    "How is my career looking?",
    "How will my career be in December 2026?",
    "Should I switch my job in 2027?",
    "What happens to my career in April 2028?",
  ],
  finance: [
    "How are my finances looking?",
    "How will my money situation be in December 2026?",
    "Is 2027 a good year to invest?",
    "What happens to my finances in April 2028?",
  ],
  property: [
    "When is a good time for me to buy a house?",
    "How will property matters go in December 2026?",
    "Should I buy a flat in 2027?",
    "What happens with property in April 2028?",
  ],
  relationship: [
    "How is my married life looking?",
    "How will my relationship be in December 2026?",
    "Is 2027 a good year for my marriage?",
    "What happens in my relationship in April 2028?",
  ],
};
// Chat-route domain → the life-insights engine's domain key (as in the chat route).
const VEDIC_KEY: Record<string, string> = { health: "Health", career: "Career", finance: "Wealth", property: "Property", relationship: "Marriage" };
const PAUSE_MS = GEMINI ? 20_000 : 90_000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };

function stepA(answer: string, ev: TimingEvidence | null, pd: string, md: string, ad: string) {
  const dates = datesIn(answer);
  const allowed = ev ? allowedDates(ev) : new Set<string>();
  const unsupported = ev ? dates.filter(d => !allowed.has(d)) : dates;
  const pdNamed = new RegExp(`${pd}[^.]{0,80}(pratyantar|sub-?period)|(pratyantar|sub-?period)[^.]{0,80}${pd}`, "i").test(answer);
  // "Modifies": a sentence that names the Pratyantar lord together with the Mahadasha or Antardasha lord.
  const pdModifies = answer.split(/(?<=[.!?])\s+/).some(s => s.includes(pd) && (s.includes(md) || s.includes(ad)) && /pratyantar|sub-?period/i.test(s));
  const beforeAfter = new RegExp(`\\b(before|after|until|from|once)\\s+(the\\s+)?(\\d{1,2}(st|nd|rd|th)?\\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)`, "i").test(answer);
  return { dates, unsupported, pdNamed, pdModifies, beforeAfter };
}

(async () => {
  const user = arg("--user"), outFile = arg("--out");
  if (!user || !outFile) throw new Error("usage: [--gemini] --user <id prefix> --out <file.md>");
  const u = await prisma.user.findFirst({ where: { id: { startsWith: user } }, include: { birthDetails: true } });
  const b = u!.birthDetails!;
  const now = new Date();
  const { chart, timeline, temporal, currentTransits, dashaInfo, symbolicCtx } = await prepareChartContext(b, { dashaDate: now });
  const asc = chart.lagna.sign as Sign;
  const chartFacts = buildChartFacts(asc,
    chart.planets.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign, house: (((p.sign - asc + 12) % 12) + 1) })),
    currentTransits.positions.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign })));
  const md = temporal!.stack.mahadasha, ad = temporal!.stack.antardasha, pd = temporal!.stack.pratyantar!;
  const brp = computeBodyRiskProfile(chart, temporal!.stack, currentTransits.positions);
  const promises = NatalPromiseAnalyzer.evaluate(chart as any);
  const pm = promises.reduce((acc, p) => { acc[p.domain] = p.score; return acc; }, {} as Record<string, number>);
  const acts = LifeDomainActivationEngine.evaluate(md, ad, chart as any, pm);
  const vk = VEDIC_KEY[DOMAIN];
  const promise = promises.find(p => p.domain === vk);
  const health = DOMAIN === "health";
  const base: ChartData = {
    bodyRiskProfile: health ? brp : null, healthFindings: health ? buildHealthFindings(brp) : null,
    natalPromise: promise ?? null,
    domainActivation: acts.find(a => a.domain === vk) ?? null,
    manifestations: health ? null : ManifestationRankingEngine.getRanked(vk, md, ad, chart as any, promise?.potential ?? 60),
    chartFacts, pratyantar: pd,
  };
  const withTiming: ChartData = { ...base, timing: { timeline, referenceDate: now, timezone: b.timezone } };
  // --only 3,4 runs just those questions (1-based), e.g. to finish a run the database stalled.
  const only = arg("--only")?.split(",").map(Number);
  const runs = (GEMINI
    ? GEMINI_QUESTIONS[DOMAIN].map(q => ({ q, variant: "after" as const }))
    : GROQ_QUESTIONS.flatMap(q => (["before", "after"] as const).map(variant => ({ q, variant }))))
    .filter((_, i) => !only || only.includes(i + 1));
  const out: string[] = [`# ${DOMAIN} comparison (${GEMINI ? "Gemini, benchmark key" : "Groq"}) — ${now.toISOString().slice(0, 10)}`, ``, `Dasha: ${md}–${ad}–${pd}`, ``];
  const table: string[] = [];
  // Written after every answer, so a stall loses nothing already finished.
  const save = () => fs.writeFileSync(outFile, [...out.slice(0, 4),
    `| Question | Variant | Model | Prompt tokens | Words | Dates | Unsupported dates | Pratyantar named | Pratyantar modifies MD/AD | Before/after a date | Draft gate errors | Dropped | Key dates added | Rubric |`,
    `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`, ...table, ``, ...out.slice(4)].join("\n"));
  for (const [i, { q, variant }] of runs.entries()) {
    const brain = await assemblePunditBrain(q, [], "timing-compare", [], symbolicCtx, dashaInfo, DOMAIN, variant === "after" ? withTiming : base);
    if (DRY) {
      // Prompt only, no AI call: check the evidence and size before spending quota.
      console.log(`\n##### ${q} — gold: ${brain.metadata.goldStandard}, prompt ~${Math.round(brain.systemPrompt.length / 4)} tokens`);
      out.push(`## ${q}`, ``, "```", brain.systemPrompt, "```", ``);
      continue;
    }
    if (i > 0) await sleep(PAUSE_MS);
    const t0 = Date.now();
    const answer = await generatePunditAnswer({ brain, history: [], chartFacts, domain: DOMAIN, dasha: dashaInfo, isFollowUp: false });
    const ev = brain.timingEvidence ?? null;
    const s = stepA(answer.narrative, ev, pd, md, ad);
    const rub = scoreConsultation({ narrative: answer.narrative, domain: DOMAIN, chartFacts, dasha: dashaInfo!, overallScore: brain.investigationReport?.conclusion.overallScore });
    const promptTok = Math.round(brain.systemPrompt.length / 4);
    const row = `| ${q} | ${variant} | ${answer.providers.join("→")} | ~${promptTok} | ${answer.narrative.split(/\s+/).length} | ${s.dates.length} | ` +
      `${s.unsupported.length}${s.unsupported.length ? ` (${s.unsupported.join(", ")})` : ""} | ${s.pdNamed ? "yes" : "no"} | ${s.pdModifies ? "yes" : "no"} | ` +
      `${s.beforeAfter ? "yes" : "no"} | ${answer.draftErrors.length} | ${answer.droppedSentences.length} | ${answer.keyDatesAdded ? "yes" : "no"} | ${rub.passed}/${rub.total} |`;
    table.push(row);
    console.log(row, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
    out.push(`## ${q} — ${variant}`, ``,
      `Written by: ${answer.providers.join(" → ")}. Prompt ~${promptTok} tokens. Rubric failed: ${rub.checks.filter(c => !c.passed).map(c => c.id).join(", ") || "—"}.`, ``);
    if (answer.draftErrors.length) out.push(`Gate, first draft:`, ...answer.draftErrors.map(e => `- ${e}`), ``);
    if (answer.droppedSentences.length) out.push(`Dropped after the rewrite:`, ...answer.droppedSentences.map(d => `- "${d.sentence}" — ${d.errors.join(" ")}`), ``);
    out.push(answer.text, ``);
    if (ev) out.push(`<details><summary>Timing evidence given to the model</summary>`, ``, "```", ev.text, "```", `</details>`, ``);
    save();
  }
  save();
  console.log(`\nWritten to ${outFile}`);
  process.exit(0);
})();
