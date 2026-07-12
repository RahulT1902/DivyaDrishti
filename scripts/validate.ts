/**
 * Gold Chart Regression Suite
 *
 * Usage:  npm run validate
 * Output: per-domain pass/fail summary + assertion breakdown
 *
 * Each test case lives under tests/gold-charts/<domain>/<chartId>/
 *   chart.json    — GoldChartSpec  (planet positions, ascendant, optional dasha)
 *   expected.json — GoldChartAssertions (what must / must not fire)
 *
 * The harness builds a real ChartSuite and runs the full 8-layer pipeline.
 * No mocking — the engine sees exactly what it would see in production.
 */

import * as fs   from "fs";
import * as path from "path";
import { ARCHITECTURE_VERSION, KNOWLEDGE_VERSION, GOLD_SUITE_VERSION } from "../src/lib/core/version";
import { runGoldChart } from "../src/lib/testing/goldChartHarness";
import { CareerEngine }   from "../src/lib/domains/career";
import { MarriageEngine } from "../src/lib/domains/marriage";
import { HealthEngine }   from "../src/lib/domains/health";
import { FinanceEngine }  from "../src/lib/domains/finance";
import type {
  GoldChartSpec, GoldChartAssertions, GoldChartDomain,
  AssertionResult, ChartValidationResult,
} from "../src/lib/testing/goldChartTypes";
import type { AstrologyContext } from "../src/lib/core/types";

// ── Domain engine map ─────────────────────────────────────────────────────────

const DOMAIN_ENGINES: Record<GoldChartDomain, { evaluate(ctx: AstrologyContext): { confidence: number; currentState?: string } }> = {
  Career:   new CareerEngine(),
  Marriage: new MarriageEngine(),
  Health:   new HealthEngine(),
  Finance:  new FinanceEngine(),
};

// ── Assertion checker ─────────────────────────────────────────────────────────

function checkAssertions(
  ctx:        AstrologyContext,
  assertions: GoldChartAssertions,
  domain:     GoldChartDomain,
): AssertionResult[] {
  const results: AssertionResult[] = [];
  const firedRuleIds = new Set(ctx.inferences.map(i => i.ruleId));
  const firedYogaIds = new Set(ctx.yogaAnalysis.birthPromises.map(y => y.id));

  for (const id of assertions.requiredInferences ?? []) {
    results.push({
      assertion: `inference "${id}" fired`,
      passed:    firedRuleIds.has(id),
      actual:    firedRuleIds.has(id) ? "fired" : "not fired",
      expected:  "fired",
    });
  }

  for (const id of assertions.forbiddenInferences ?? []) {
    results.push({
      assertion: `inference "${id}" must NOT fire`,
      passed:    !firedRuleIds.has(id),
      actual:    firedRuleIds.has(id) ? "fired (UNEXPECTED)" : "not fired",
      expected:  "not fired",
    });
  }

  for (const id of assertions.requiredYogas ?? []) {
    results.push({
      assertion: `yoga "${id}" detected`,
      passed:    firedYogaIds.has(id),
      actual:    firedYogaIds.has(id) ? "detected" : "not detected",
      expected:  "detected",
    });
  }

  for (const id of assertions.forbiddenYogas ?? []) {
    results.push({
      assertion: `yoga "${id}" must NOT be detected`,
      passed:    !firedYogaIds.has(id),
      actual:    firedYogaIds.has(id) ? "detected (UNEXPECTED)" : "not detected",
      expected:  "not detected",
    });
  }

  if (assertions.minCompleteness !== undefined) {
    const actual = ctx.completeness.overall;
    results.push({
      assertion: `completeness >= ${assertions.minCompleteness}`,
      passed:    actual >= assertions.minCompleteness,
      actual:    `${actual}`,
      expected:  `>= ${assertions.minCompleteness}`,
    });
  }

  if (assertions.expectedRuleCount !== undefined) {
    const { min, max } = assertions.expectedRuleCount;
    const actual = ctx.inferences.length;
    results.push({
      assertion: `inference count ${min}–${max}`,
      passed:    actual >= min && actual <= max,
      actual:    `${actual}`,
      expected:  `${min}–${max}`,
    });
  }

  if (assertions.maxOpaqueInferences !== undefined) {
    const actual = ctx.explainability.opaque;
    results.push({
      assertion: `opaque inferences ≤ ${assertions.maxOpaqueInferences}`,
      passed:    actual <= assertions.maxOpaqueInferences,
      actual:    `${actual} opaque`,
      expected:  `≤ ${assertions.maxOpaqueInferences}`,
    });
  }

  // Graph integrity: disconnected node check — only asserts when maxDisconnectedNodes is set.
  // Islands (nodes with no parents AND no children) are reported informally even when not asserted.
  const islands = ctx.inferenceGraph.filter(n => n.parents.length === 0 && n.children.length === 0);
  if (assertions.maxDisconnectedNodes !== undefined) {
    results.push({
      assertion: `disconnected nodes ≤ ${assertions.maxDisconnectedNodes}`,
      passed:    islands.length <= assertions.maxDisconnectedNodes,
      actual:    `${islands.length} disconnected`,
      expected:  `≤ ${assertions.maxDisconnectedNodes}`,
    });
  }

  // Transit assertions — only meaningful when chart.json includes transitEvidence
  const transitEvidence = ctx.transit ?? [];

  for (const ruleId of assertions.requiredTransitRules ?? []) {
    const fired = transitEvidence.some(e => e.ruleId === ruleId);
    results.push({
      assertion: `transit rule fired: ${ruleId}`,
      passed:    fired,
      actual:    fired ? "fired" : "not fired",
      expected:  "fired",
    });
  }

  if (assertions.minActivationScore !== undefined) {
    const { normalizeTransitEvidence } = require("../src/lib/core/transit-engine/evaluateRules");
    const score = normalizeTransitEvidence(transitEvidence);
    results.push({
      assertion: `transit activation score >= ${assertions.minActivationScore}`,
      passed:    score >= assertions.minActivationScore,
      actual:    `${score}`,
      expected:  `>= ${assertions.minActivationScore}`,
    });
  }

  if (assertions.maxActivationScore !== undefined) {
    const { normalizeTransitEvidence } = require("../src/lib/core/transit-engine/evaluateRules");
    const score = normalizeTransitEvidence(transitEvidence);
    results.push({
      assertion: `transit activation score <= ${assertions.maxActivationScore}`,
      passed:    score <= assertions.maxActivationScore,
      actual:    `${score}`,
      expected:  `<= ${assertions.maxActivationScore}`,
    });
  }

  const domainAssertion = assertions.domains?.[domain];
  if (domainAssertion) {
    try {
      const engine     = DOMAIN_ENGINES[domain];
      const assessment = engine.evaluate(ctx);

      if (domainAssertion.minConfidence !== undefined) {
        const conf = assessment.confidence;
        results.push({
          assertion: `${domain}.confidence >= ${domainAssertion.minConfidence}`,
          passed:    conf >= domainAssertion.minConfidence,
          actual:    `${conf.toFixed(1)}`,
          expected:  `>= ${domainAssertion.minConfidence}`,
        });
      }

      if (domainAssertion.maxConfidence !== undefined) {
        const conf = assessment.confidence;
        results.push({
          assertion: `${domain}.confidence <= ${domainAssertion.maxConfidence}`,
          passed:    conf <= domainAssertion.maxConfidence,
          actual:    `${conf.toFixed(1)}`,
          expected:  `<= ${domainAssertion.maxConfidence}`,
        });
      }

      if (domainAssertion.currentState !== undefined) {
        const state = assessment.currentState ?? "";
        results.push({
          assertion: `${domain}.currentState === "${domainAssertion.currentState}"`,
          passed:    state === domainAssertion.currentState,
          actual:    `"${state}"`,
          expected:  `"${domainAssertion.currentState}"`,
        });
      }
    } catch (err) {
      results.push({
        assertion: `${domain} engine ran without error`,
        passed:    false,
        actual:    String(err),
        expected:  "no error",
      });
    }
  }

  return results;
}

// ── Test loader ───────────────────────────────────────────────────────────────

function loadTestCases(domainDir: string): Array<{ spec: GoldChartSpec; assertions: GoldChartAssertions; chartDir: string }> {
  if (!fs.existsSync(domainDir)) return [];

  return fs.readdirSync(domainDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(entry => {
      const chartDir   = path.join(domainDir, entry.name);
      const chartFile  = path.join(chartDir, "chart.json");
      const expectFile = path.join(chartDir, "expected.json");

      if (!fs.existsSync(chartFile) || !fs.existsSync(expectFile)) return [];

      try {
        const spec       = JSON.parse(fs.readFileSync(chartFile,  "utf8")) as GoldChartSpec;
        const assertions = JSON.parse(fs.readFileSync(expectFile, "utf8")) as GoldChartAssertions;
        return [{ spec, assertions, chartDir }];
      } catch (err) {
        console.error(`  ⚠  Failed to parse ${chartDir}: ${err}`);
        return [];
      }
    });
}

// ── Colour / formatting helpers ───────────────────────────────────────────────

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

function tick(passed: boolean) { return passed ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`; }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const rootDir   = path.join(process.cwd(), "tests", "gold-charts");
  const domains   = ["Career", "Marriage", "Health", "Finance"] as GoldChartDomain[];

  console.log(`\n${BOLD}📊 DivyaDrishti Gold Chart Regression Suite${RESET}`);
  console.log(`   arch ${ARCHITECTURE_VERSION}  ·  knowledge ${KNOWLEDGE_VERSION}  ·  gold suite ${GOLD_SUITE_VERSION}`);
  console.log(`${"═".repeat(55)}\n`);

  const allResults: ChartValidationResult[] = [];

  for (const domain of domains) {
    const domainDir   = path.join(rootDir, domain.toLowerCase());
    const testCases   = loadTestCases(domainDir);

    if (testCases.length === 0) {
      console.log(`${YELLOW}${domain}${RESET}  (no charts — add test cases to tests/gold-charts/${domain.toLowerCase()}/)\n`);
      continue;
    }

    console.log(`${BOLD}${domain}${RESET}`);

    for (const { spec, assertions, chartDir } of testCases) {
      const chartId = spec.id ?? path.basename(chartDir);
      let ctx: AstrologyContext;

      try {
        ctx = runGoldChart(spec);
      } catch (err) {
        console.log(`  ${RED}✗ ${chartId}${RESET} — harness error: ${err}`);
        allResults.push({
          chartId, description: spec.description, domain,
          passed: false, assertions: [], totalAssertions: 1, passedAssertions: 0,
        });
        continue;
      }

      const results      = checkAssertions(ctx, assertions, domain);
      const totalA       = results.length;
      const passedA      = results.filter(r => r.passed).length;
      const allPassed    = passedA === totalA;

      const status = allPassed
        ? `${GREEN}✅ ${passedA}/${totalA} assertions passed${RESET}`
        : `${RED}❌ ${passedA}/${totalA} assertions passed${RESET}`;

      console.log(`  ${tick(allPassed)} ${chartId} — ${spec.description}`);
      console.log(`     ${status}`);

      if (!allPassed) {
        for (const r of results.filter(a => !a.passed)) {
          console.log(`     ${RED}FAIL${RESET}  ${r.assertion}`);
          console.log(`           expected: ${r.expected}`);
          console.log(`           actual:   ${r.actual}`);
        }
      }

      // Always show fired inferences so you can discover unexpected rule IDs
      const fired = ctx.inferences.map(i => i.ruleId).join(", ");
      console.log(`     fired: [${fired || "none"}]`);

      // Graph stats — informational, not pass/fail unless asserted
      const graphIslands = ctx.inferenceGraph.filter(n => n.parents.length === 0 && n.children.length === 0);
      const opaque       = ctx.explainability.opaque;
      const coverage     = ctx.explainability.coverageScore.toFixed(0);
      const graphNodes   = ctx.inferenceGraph.length;
      console.log(`     graph: ${graphNodes} nodes | coverage ${coverage}% | ${opaque} opaque | ${graphIslands.length} disconnected`);

      // Transit stats — show only when transit evidence is present
      if (ctx.transit?.length) {
        const { normalizeTransitEvidence } = require("../src/lib/core/transit-engine/evaluateRules");
        const tScore = normalizeTransitEvidence(ctx.transit);
        const tLabels = ctx.transit.map((e: { ruleId: string; scoreDelta: number }) => `${e.ruleId}(${e.scoreDelta > 0 ? "+" : ""}${e.scoreDelta})`).join(", ");
        console.log(`     transit: score ${tScore}/100 | rules: [${tLabels}]`);
      }
      console.log();

      allResults.push({
        chartId, description: spec.description, domain,
        passed: allPassed, assertions: results,
        totalAssertions: totalA, passedAssertions: passedA,
      });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`${"═".repeat(55)}`);
  console.log(`${BOLD}Results${RESET}`);

  let totalCharts   = 0;
  let passedCharts  = 0;
  let totalAsserts  = 0;
  let passedAsserts = 0;

  for (const domain of domains) {
    const domainResults = allResults.filter(r => r.domain === domain);
    if (domainResults.length === 0) {
      console.log(`  ${domain.padEnd(12)} — no charts`);
      continue;
    }

    const dc  = domainResults.length;
    const dcp = domainResults.filter(r => r.passed).length;
    const da  = domainResults.reduce((s, r) => s + r.totalAssertions,  0);
    const dap = domainResults.reduce((s, r) => s + r.passedAssertions, 0);
    const pct = dc > 0 ? (dcp / dc * 100).toFixed(0) : "—";
    const aPct = da > 0 ? (dap / da * 100).toFixed(0) : "—";

    const label = `${dcp}/${dc} charts, ${dap}/${da} assertions (${pct}% / ${aPct}%)`;
    console.log(`  ${domain.padEnd(12)} ${tick(dcp === dc)}  ${label}`);

    totalCharts   += dc;
    passedCharts  += dcp;
    totalAsserts  += da;
    passedAsserts += dap;
  }

  const overallChartPct  = totalCharts  > 0 ? (passedCharts  / totalCharts  * 100).toFixed(0) : "—";
  const overallAssertPct = totalAsserts > 0 ? (passedAsserts / totalAsserts * 100).toFixed(0) : "—";

  console.log();
  console.log(`  ${BOLD}Overall${RESET}       ${tick(passedCharts === totalCharts)}  ${passedCharts}/${totalCharts} charts (${overallChartPct}%) | ${passedAsserts}/${totalAsserts} assertions (${overallAssertPct}%)`);
  console.log();

  process.exit(passedCharts === totalCharts && passedAsserts === totalAsserts ? 0 : 1);
}

main().catch(err => {
  console.error("Validate script crashed:", err);
  process.exit(1);
});
