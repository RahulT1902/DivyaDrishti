// ChatPundit Gold Standard benchmark — run with: npm run benchmark:pundit -- [label]
// (= tsx --env-file=.env scripts/pundit-benchmark.ts; the AI keys must be loaded
// before the provider module is imported, so they come from the command line.)
//
// Runs the real Pundit path (brain → LLM → integrity gate → basis paragraph,
// via generatePunditAnswer, the same function the chat route uses) on the
// gold charts in tests/gold-charts/health/, then scores each LLM narrative
// with the Gold Standard v1.0 rubric (docs/CHATPUNDIT_GOLD_STANDARD_v1.md).
//
// Unlike `npm run validate`, this calls the AI provider: results vary run to
// run and it costs API usage. Compare averages across runs, not single scores.
// Results are written to tests/pundit-benchmark/results/<date>-<label>.json.

import * as fs from "fs";
import * as path from "path";
import { useBenchmarkGeminiKey } from "./lib/benchmarkKey";

import { runGoldChart } from "../src/lib/testing/goldChartHarness";
import type { GoldChartSpec } from "../src/lib/testing/goldChartTypes";
import { assemblePunditBrain } from "../src/lib/consultation/brain";
import type { ChartData } from "../src/lib/consultation/brain";
import { generatePunditAnswer } from "../src/lib/consultation/punditAnswer";
import { scoreConsultation, GOLD_STANDARD_VERSION } from "../src/lib/consultation/goldStandard/rubric";
import { buildChartFacts } from "../src/lib/core/astrology/chartFacts";
import { computeBodyRiskProfile } from "../src/lib/intelligence/health/bodyRiskProfile";
import { buildHealthFindings } from "../src/lib/intelligence/health/healthFindingsEngine";
import { NatalPromiseAnalyzer, LifeDomainActivationEngine } from "../src/lib/intelligence/lifeInsights/services";
import { IMPACT_WEIGHTS } from "../src/lib/astrology/transit";
import type { DashaInfo, PlanetName, Sign } from "../src/lib/core/types";

const DOMAIN = "health";
const QUESTIONS = ["How's my health?", "How's my health today?"];

// Fixed benchmark sky so runs are comparable (sign 1 = Aries … 12 = Pisces).
const BENCHMARK_TRANSITS: Array<{ name: PlanetName; sign: Sign; degree: number; speed: number }> = [
  { name: "Saturn",  sign: 12, degree: 5,  speed: 0.03 },
  { name: "Jupiter", sign: 5,  degree: 2,  speed: 0.1 },
  { name: "Rahu",    sign: 11, degree: 20, speed: -0.05 },
  { name: "Ketu",    sign: 5,  degree: 20, speed: -0.05 },
  { name: "Mars",    sign: 9,  degree: 14, speed: 0.6 },
  { name: "Sun",     sign: 7,  degree: 18, speed: 1 },
  { name: "Mercury", sign: 8,  degree: 3,  speed: 1.2 },
  { name: "Venus",   sign: 6,  degree: 27, speed: 1.1 },
  { name: "Moon",    sign: 5,  degree: 9,  speed: 13 },
];
const DEFAULT_DASHA: DashaInfo = {
  mahadasha: "Rahu", antardasha: "Jupiter", periodStart: "2026-01-01", periodEnd: "2028-04-01",
} as DashaInfo;

function loadSpecs(): Array<{ dir: string; spec: GoldChartSpec }> {
  const root = path.join(process.cwd(), "tests", "gold-charts", DOMAIN);
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(root, d.name, "chart.json")))
    .map(d => ({ dir: d.name, spec: JSON.parse(fs.readFileSync(path.join(root, d.name, "chart.json"), "utf8")) }));
}

/** Gold chart spec → the NatalChart shape the health and life-insight engines read. */
function toNatalChart(spec: GoldChartSpec) {
  const planets = Object.entries(spec.planets).map(([name, p]) => {
    const deg = p!.degreeInSign ?? 15;
    const longitude = (p!.sign - 1) * 30 + deg;
    return {
      name, longitude, speed: 1, sign: p!.sign, positionInSign: deg, degree: deg,
      navamsaSign: (Math.floor(longitude / (30 / 9)) % 12) + 1,
      strengthLevel: "Average", role: "", isRetrograde: false, isCombust: false, isVargottama: false,
    };
  });
  const asc = spec.ascendantSign;
  return {
    lagna: { longitude: (asc - 1) * 30 + 15, sign: asc, positionInSign: 15, degree: 15, navamsaSign: 1 },
    planets,
    houses: Array.from({ length: 12 }, (_, i) => ((asc - 1 + i) % 12) * 30),
  };
}

async function main() {
  const [label = "run"] = useBenchmarkGeminiKey();
  const transitPositions = BENCHMARK_TRANSITS.map(t => ({
    name: t.name, sign: t.sign, longitude: (t.sign - 1) * 30 + t.degree, speed: t.speed, weight: IMPACT_WEIGHTS[t.name] ?? 2,
  }));
  const results: unknown[] = [];
  let total = 0, count = 0;

  console.log(`\nChatPundit Gold Standard v${GOLD_STANDARD_VERSION} benchmark — domain: ${DOMAIN}, label: ${label}\n`);

  for (const { dir, spec } of loadSpecs()) {
    const ctx = runGoldChart(spec);
    const natal = toNatalChart(spec);
    const dasha = (spec.dasha as DashaInfo | undefined) ?? DEFAULT_DASHA;
    const chartFacts = buildChartFacts(
      spec.ascendantSign,
      Object.entries(spec.planets).map(([planet, p]) => ({ planet: planet as PlanetName, sign: p!.sign as Sign })),
      BENCHMARK_TRANSITS.map(t => ({ planet: t.name, sign: t.sign })),
    );

    const bodyRiskProfile = computeBodyRiskProfile(natal, dasha, transitPositions);
    const promises = NatalPromiseAnalyzer.evaluate(natal as any);
    const promiseMap = promises.reduce((acc, p) => { acc[p.domain] = p.score; return acc; }, {} as Record<string, number>);
    const activations = LifeDomainActivationEngine.evaluate(dasha.mahadasha, dasha.antardasha, natal as any, promiseMap);
    const chartData: ChartData = {
      bodyRiskProfile,
      healthFindings: buildHealthFindings(bodyRiskProfile),
      natalPromise: promises.find(p => p.domain === "Health") ?? null,
      domainActivation: activations.find(a => a.domain === "Health") ?? null,
      manifestations: null,
      chartFacts,
      pratyantar: null,
    };

    for (const question of QUESTIONS) {
      const t0 = Date.now();
      try {
        const brain = await assemblePunditBrain(question, [], "benchmark", [], ctx, dasha, DOMAIN, chartData);
        const answer = await generatePunditAnswer({
          brain, history: [], chartFacts, domain: DOMAIN, dasha, isFollowUp: false,
        });
        const score = scoreConsultation({
          narrative: answer.narrative, domain: DOMAIN, chartFacts, dasha,
          overallScore: brain.investigationReport?.conclusion.overallScore,
        });
        total += score.score; count++;
        const failed = score.checks.filter(c => !c.passed).map(c => c.id).join(", ") || "—";
        console.log(`  ${dir.padEnd(28)} ${question.padEnd(24)} ${score.passed}/${score.total}  ${((Date.now() - t0) / 1000).toFixed(0)}s  failed: ${failed}`);
        results.push({ chart: dir, question, depth: brain.metadata.depth, score, draftErrors: answer.draftErrors, safetyAddedByServer: answer.safetyAdded, answer: answer.text });
      } catch (e: any) {
        console.log(`  ${dir.padEnd(28)} ${question.padEnd(24)} ERROR ${String(e?.message ?? e).slice(0, 120)}`);
        results.push({ chart: dir, question, error: String(e?.message ?? e) });
      }
    }
  }

  const avg = count ? total / count : 0;
  console.log(`\n  Average: ${(avg * 100).toFixed(0)}% over ${count} answers\n`);

  const outDir = path.join(process.cwd(), "tests", "pundit-benchmark", "results");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${new Date().toISOString().slice(0, 10)}-${label}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ version: GOLD_STANDARD_VERSION, domain: DOMAIN, label, average: avg, results }, null, 2));
  console.log(`  Results: ${path.relative(process.cwd(), outFile)}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
