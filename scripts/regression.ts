// Regression script — run with: npx tsx scripts/regression.ts
//
// Usage:
//   npm run regression              — run all fixture cases
//   npm run regression -- --tag career   — filter by tag (future)
//
// To add a test case, create a fixture file in:
//   src/lib/testing/regression/fixtures/
// and import it in the fixtures array below.
//
// The symbolic pipeline is deterministic — same input always produces
// the same output. No LLM calls are made; this runs offline.

import { RegressionHarness } from "../src/lib/testing/regression";
import type { RegressionCase } from "../src/lib/testing/regression";

// ── Fixture import point ───────────────────────────────────────────────────
// Import real chart fixtures here as they are created.
// Example:
//   import { SAMPLE_CASES } from "../src/lib/testing/regression/fixtures/sample";

const CASES: RegressionCase[] = [
  // Add fixture cases here.
  // Each case needs: { id, label, input: { chartSuite, dasha? }, expected: {...} }
  //
  // Example fixture (fill in real ChartSuite values from SwissEph):
  //
  // {
  //   id: "aries-lagna-saturn-strong",
  //   label: "Aries lagna, strong Saturn, Sasa yoga active",
  //   tags: ["career", "sasa", "discipline"],
  //   input: {
  //     chartSuite: buildChartSuite({ ... }),
  //     dasha: { mahadasha: "Saturn", antardasha: "Mercury" },
  //   },
  //   expected: {
  //     hypotheses: { hasIds: ["discipline-perseverance"], minCount: 2 },
  //     career: {
  //       confidence:      { min: 60, max: 90 },
  //       jobStability:    { min: 65, max: 95 },
  //       minRecommendations: 1,
  //     },
  //   },
  // },
];

// ── Run ────────────────────────────────────────────────────────────────────

const harness = new RegressionHarness();
const summary = harness.run(CASES);
process.stdout.write(harness.report(summary));

// Exit with non-zero code if any cases fail (for CI)
if (summary.failed > 0) process.exit(1);
