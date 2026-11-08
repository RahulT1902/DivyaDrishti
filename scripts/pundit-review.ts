// ChatPundit Gold Standard — real-chart review. Run with:
//   npx tsx --env-file=.env scripts/pundit-review.ts [label]
//
// Computes each chart in tests/pundit-benchmark/review-charts.json with the
// real ephemeris (prepareChartContext — the same code path as the chat route),
// asks the health questions through the real Pundit path, scores each answer
// with the Gold Standard rubric, and writes:
//   tests/pundit-benchmark/results/<date>-<label>.json   (scores + answers)
//   tests/pundit-benchmark/results/<date>-<label>.md     (for human review)
//
// The sky and dasha are fixed at REVIEW_DATE so reruns are comparable.
// Calls the AI provider: costs API usage and results vary between runs.

import * as fs from "fs";
import * as path from "path";
import { useBenchmarkGeminiKey } from "./lib/benchmarkKey";

import { prepareChartContext } from "../src/lib/consultation/prepareChartContext";
import { assemblePunditBrain } from "../src/lib/consultation/brain";
import type { ChartData } from "../src/lib/consultation/brain";
import { generatePunditAnswer } from "../src/lib/consultation/punditAnswer";
import { scoreConsultation, GOLD_STANDARD_VERSION } from "../src/lib/consultation/goldStandard/rubric";
import { buildChartFacts } from "../src/lib/core/astrology/chartFacts";
import { computeBodyRiskProfile } from "../src/lib/intelligence/health/bodyRiskProfile";
import { buildHealthFindings } from "../src/lib/intelligence/health/healthFindingsEngine";
import { NatalPromiseAnalyzer, LifeDomainActivationEngine } from "../src/lib/intelligence/lifeInsights/services";
import type { PlanetName, Sign } from "../src/lib/core/types";

const DOMAIN = "health";
const QUESTIONS = ["How's my health?", "How's my health today?"];
const REVIEW_DATE = new Date("2026-11-05T06:00:00Z");
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

interface ReviewChart {
  id: string; date: string; time: string; place: string;
  latitude: number; longitude: number; timezone: string;
  expected: { ascendant: string; mahadasha: string; antardasha: string };
}

async function main() {
  const [label = "review", only] = useBenchmarkGeminiKey(); // only: optional single chart id
  const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "pundit-benchmark", "review-charts.json"), "utf8"));
  const charts: ReviewChart[] = fixture.charts.filter((c: ReviewChart) => !only || c.id === only);

  const results: any[] = [];
  const md: string[] = [
    `# ChatPundit Gold Standard v${GOLD_STANDARD_VERSION} — health review (${label})`,
    ``,
    `Synthetic births (not real people) covering all 12 Ascendants; sky and dasha fixed at ${REVIEW_DATE.toISOString().slice(0, 10)}.`,
    `Each answer is exactly what the chat would show: summary card + narrative.`,
    ``,
  ];
  let total = 0, count = 0;

  console.log(`\nGold Standard real-chart review — ${charts.length} charts × ${QUESTIONS.length} questions — label: ${label}\n`);

  for (const rc of charts) {
    const { chart, timeline, temporal, currentTransits, dashaInfo, symbolicCtx } = await prepareChartContext(
      { dateOfBirth: new Date(rc.date), timeOfBirth: rc.time, latitude: rc.latitude, longitude: rc.longitude, timezone: rc.timezone },
      { transitDate: REVIEW_DATE, dashaDate: REVIEW_DATE },
    );
    const asc = SIGNS[chart.lagna.sign - 1];
    const drift = asc !== rc.expected.ascendant || dashaInfo?.mahadasha !== rc.expected.mahadasha
      ? ` (fixture said ${rc.expected.ascendant} ${rc.expected.mahadasha})` : "";

    // Health chart data, built as the chat route builds it.
    const ascSign = chart.lagna.sign as Sign;
    const chartFacts = buildChartFacts(
      ascSign,
      chart.planets.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign, house: (((p.sign - ascSign + 12) % 12) + 1) })),
      currentTransits.positions.map(p => ({ planet: p.name as PlanetName, sign: p.sign as Sign })),
    );
    const md_ = temporal?.stack?.mahadasha || "Saturn";
    const ad_ = temporal?.stack?.antardasha || "Jupiter";
    const bodyRiskProfile = temporal?.stack ? computeBodyRiskProfile(chart, temporal.stack, currentTransits.positions) : null;
    const promises = NatalPromiseAnalyzer.evaluate(chart as any);
    const promiseMap = promises.reduce((acc, p) => { acc[p.domain] = p.score; return acc; }, {} as Record<string, number>);
    const activations = LifeDomainActivationEngine.evaluate(md_, ad_, chart as any, promiseMap);
    const chartData: ChartData = {
      bodyRiskProfile,
      healthFindings: bodyRiskProfile ? buildHealthFindings(bodyRiskProfile) : null,
      natalPromise: promises.find(p => p.domain === "Health") ?? null,
      domainActivation: activations.find(a => a.domain === "Health") ?? null,
      manifestations: null,
      chartFacts,
      pratyantar: temporal?.stack?.pratyantar ?? null,
      timing: { timeline, referenceDate: REVIEW_DATE, timezone: rc.timezone },
    };

    md.push(`## ${rc.id} — ${asc} Ascendant, ${dashaInfo?.mahadasha}/${dashaInfo?.antardasha}${chartData.pratyantar ? `/${chartData.pratyantar}` : ""}${drift}`, ``,
      `Born ${rc.date} ${rc.time}, ${rc.place} (synthetic).`, ``);

    for (const question of QUESTIONS) {
      const t0 = Date.now();
      try {
        const brain = await assemblePunditBrain(question, [], "review", [], symbolicCtx, dashaInfo, DOMAIN, chartData);
        const answer = await generatePunditAnswer({ brain, history: [], chartFacts, domain: DOMAIN, dasha: dashaInfo, isFollowUp: false });
        const score = scoreConsultation({
          narrative: answer.narrative, domain: DOMAIN, chartFacts,
          dasha: { mahadasha: dashaInfo?.mahadasha ?? "", antardasha: dashaInfo?.antardasha ?? "" },
          overallScore: brain.investigationReport?.conclusion.overallScore,
        });
        total += score.score; count++;
        const secs = (Date.now() - t0) / 1000;
        const failed = score.checks.filter(c => !c.passed);
        console.log(`  ${rc.id} ${asc.padEnd(11)} ${question.padEnd(24)} ${score.passed}/${score.total}  ${secs.toFixed(0)}s  ${failed.map(c => c.id).join(", ") || "—"}`);
        results.push({ id: rc.id, ascendant: asc, dasha: dashaInfo, question, seconds: secs, gold: brain.metadata.goldStandard,
          score, draftErrors: answer.draftErrors, safetyAddedByServer: answer.safetyAdded, answer: answer.text });
        md.push(`### "${question}" — ${score.passed}/${score.total}, ${secs.toFixed(0)} s`, ``);
        if (failed.length) md.push(...failed.map(c => `- ✗ **${c.id}** (${c.criterion}): ${c.detail}`), ``);
        md.push("```text", answer.text, "```", ``);
      } catch (e: any) {
        console.log(`  ${rc.id} ${question} ERROR ${String(e?.message ?? e).slice(0, 120)}`);
        results.push({ id: rc.id, question, error: String(e?.message ?? e) });
        md.push(`### "${question}" — ERROR`, ``, String(e?.message ?? e), ``);
      }
    }
  }

  const avg = count ? total / count : 0;
  const perCheck: Record<string, number> = {};
  for (const r of results) for (const c of r.score?.checks ?? []) perCheck[c.id] = (perCheck[c.id] ?? 0) + (c.passed ? 1 : 0);
  const summary = Object.entries(perCheck).map(([k, v]) => `${k} ${v}/${count}`).join(" · ");
  console.log(`\n  Average: ${(avg * 100).toFixed(0)}% over ${count} answers\n  Per check: ${summary}\n`);
  md.splice(5, 0, `**Average: ${(avg * 100).toFixed(0)}%** over ${count} answers. Per check: ${summary}.`, ``);

  const outDir = path.join(process.cwd(), "tests", "pundit-benchmark", "results");
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `${REVIEW_DATE.toISOString().slice(0, 10)}-${label}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify({ version: GOLD_STANDARD_VERSION, domain: DOMAIN, label, average: avg, perCheck, results }, null, 2));
  fs.writeFileSync(`${base}.md`, md.join("\n"));
  console.log(`  Results: ${path.relative(process.cwd(), base)}.json / .md\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
