import { AstrologyContextBuilder } from "../../core/context-builder/astroContextBuilder";
import { CareerEngine } from "../../domains/career";
import { CORE_RULESET } from "../../core/inference-engine";
import {
  RegressionCase, RegressionResult, RegressionSummary,
  FieldFailure, NumericRange, SignalExpectation,
} from "./types";
import { CareerAssessment } from "../../domains/career";

// RegressionHarness runs a deterministic test suite against the full symbolic pipeline.
//
// Usage:
//   const harness = new RegressionHarness();
//   const summary = harness.run(cases);
//   console.log(harness.report(summary));
//
// Designed to be called from:
//   - Jest tests (see __tests__/regression.test.ts pattern)
//   - CLI script (see scripts/regression.ts)
//   - Pre-commit hooks (npm run regression)
//
// The harness is deterministic: given the same ChartSuite + DashaInfo, the
// symbolic layers always produce the same output. This makes regression testing
// practical without LLM calls.

export class RegressionHarness {
  private readonly contextBuilder = new AstrologyContextBuilder();
  private readonly careerEngine   = new CareerEngine();

  run(cases: RegressionCase[]): RegressionSummary {
    const start   = Date.now();
    const results = cases.map(c => this.runCase(c));

    const passed   = results.filter(r => r.pass).length;
    const totalMs  = Date.now() - start;

    return {
      totalCases:     cases.length,
      passed,
      failed:         cases.length - passed,
      passRate:       cases.length === 0 ? 1 : passed / cases.length,
      totalMs,
      results,
      ruleSetVersion: CORE_RULESET.version,
      ranAt:          new Date().toISOString(),
    };
  }

  runCase(c: RegressionCase): RegressionResult {
    const caseStart = Date.now();
    const failures: FieldFailure[] = [];

    // ── Build context ────────────────────────────────────────────────────────
    const ctx = this.contextBuilder.build(c.input.chartSuite, { dasha: c.input.dasha });

    // ── Run career engine ─────────────────────────────────────────────────────
    const career = this.careerEngine.evaluate(ctx);

    // ── Check inference expectations ──────────────────────────────────────────
    if (c.expected.inferences) {
      const exp = c.expected.inferences;

      if (exp.minCount !== undefined && ctx.inferences.length < exp.minCount) {
        failures.push({
          field:    "inferences.count",
          expected: `>= ${exp.minCount}`,
          actual:   String(ctx.inferences.length),
        });
      }

      if (exp.domains) {
        for (const domain of exp.domains) {
          if (!ctx.inferences.some(i => i.domain === domain)) {
            failures.push({
              field:    `inferences.domain:${domain}`,
              expected: "present",
              actual:   "absent",
            });
          }
        }
      }

      if (exp.hasReasonCodes) {
        const allCodes = new Set(ctx.inferences.flatMap(i => i.reasonCodes));
        for (const code of exp.hasReasonCodes) {
          if (!allCodes.has(code)) {
            failures.push({
              field:    `inferences.reasonCode:${code}`,
              expected: "present",
              actual:   "absent",
            });
          }
        }
      }
    }

    // ── Check hypothesis expectations ─────────────────────────────────────────
    if (c.expected.hypotheses) {
      const exp = c.expected.hypotheses;

      if (exp.minCount !== undefined && ctx.hypotheses.length < exp.minCount) {
        failures.push({
          field:    "hypotheses.count",
          expected: `>= ${exp.minCount}`,
          actual:   String(ctx.hypotheses.length),
        });
      }

      if (exp.hasIds) {
        const hypoIds = new Set(ctx.hypotheses.map(h => h.id));
        for (const id of exp.hasIds) {
          if (!hypoIds.has(id)) {
            failures.push({
              field:    `hypotheses.id:${id}`,
              expected: "present",
              actual:   "absent",
            });
          }
        }
      }
    }

    // ── Check career expectations ─────────────────────────────────────────────
    if (c.expected.career) {
      const exp = c.expected.career;

      if (exp.currentState && career.currentState !== exp.currentState) {
        failures.push({
          field:    "career.currentState",
          expected: exp.currentState,
          actual:   career.currentState,
        });
      }

      for (const [field, range] of numericCareerFields(exp)) {
        const actual = (career as unknown as Record<string, number>)[field];
        if (range && !inRange(actual, range)) {
          failures.push({
            field:    `career.${field}`,
            expected: `${range.min}–${range.max}`,
            actual:   String(actual),
          });
        }
      }

      if (exp.signals) {
        for (const sigExp of exp.signals) {
          const actual = career.signals.find(s => s.id === sigExp.id);
          if (!actual) {
            failures.push({
              field:    `career.signal:${sigExp.id}`,
              expected: "present",
              actual:   "absent",
            });
          } else if (!inRange(actual.score, sigExp.score)) {
            failures.push({
              field:    `career.signal:${sigExp.id}.score`,
              expected: `${sigExp.score.min}–${sigExp.score.max}`,
              actual:   String(actual.score),
            });
          }
        }
      }

      if (exp.minRecommendations !== undefined &&
          career.recommendations.length < exp.minRecommendations) {
        failures.push({
          field:    "career.recommendations.count",
          expected: `>= ${exp.minRecommendations}`,
          actual:   String(career.recommendations.length),
        });
      }

      if (exp.hasRecommendationActions) {
        for (const action of exp.hasRecommendationActions) {
          if (!career.recommendations.some(r => r.action.toLowerCase().includes(action.toLowerCase()))) {
            failures.push({
              field:    `career.recommendation:${action}`,
              expected: "present",
              actual:   "absent",
            });
          }
        }
      }
    }

    return {
      caseId:     c.id,
      label:      c.label,
      pass:       failures.length === 0,
      failures,
      durationMs: Date.now() - caseStart,
      actual: {
        inferenceCount:  ctx.inferences.length,
        hypothesisCount: ctx.hypotheses.length,
        hypothesisIds:   ctx.hypotheses.map(h => h.id),
        reasonCodes:     [...new Set(ctx.inferences.flatMap(i => i.reasonCodes))],
        career,
      },
    };
  }

  report(summary: RegressionSummary): string {
    const lines: string[] = [
      `\n── DivyaDrishti Regression Report ──────────────────────────────`,
      `Engine: v${summary.ruleSetVersion}  |  Ran: ${summary.ranAt}`,
      `Cases: ${summary.totalCases}  Pass: ${summary.passed}  Fail: ${summary.failed}  ` +
        `Pass rate: ${(summary.passRate * 100).toFixed(0)}%  Time: ${summary.totalMs}ms`,
      `────────────────────────────────────────────────────────────────`,
    ];

    for (const r of summary.results) {
      const icon = r.pass ? "✓" : "✗";
      lines.push(`${icon} [${r.caseId}] ${r.label}  (${r.durationMs}ms)`);
      for (const f of r.failures) {
        lines.push(`    FAIL  ${f.field}: expected "${f.expected}" got "${f.actual}"`);
      }
    }

    lines.push(`────────────────────────────────────────────────────────────────\n`);
    return lines.join("\n");
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inRange(value: number, range: NumericRange): boolean {
  return value >= range.min && value <= range.max;
}

function numericCareerFields(
  exp: NonNullable<RegressionCase["expected"]["career"]>,
): Array<[string, NumericRange | undefined]> {
  return [
    ["confidence",                  exp.confidence],
    ["leadershipPotential",         exp.leadershipPotential],
    ["entrepreneurshipPotential",   exp.entrepreneurshipPotential],
    ["jobStability",                exp.jobStability],
    ["promotionPotential",          exp.promotionPotential],
    ["growthPotential",             exp.growthPotential],
  ];
}
