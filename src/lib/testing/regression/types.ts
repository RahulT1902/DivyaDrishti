import { ChartSuite, DashaInfo, InferenceConclusion, Hypothesis } from "../../core/types";
import { CareerAssessment } from "../../domains/career";

// ── RegressionCase — a single test input + expected output ────────────────────
//
// "Expected" fields use ranges for numeric values (±tolerance) and exact strings
// for qualitative fields. This handles the fact that minor chart changes may
// shift scores by a few points while the qualitative conclusion stays the same.
//
// Pattern for new domains: add a key to RegressionExpected and a corresponding
// key to RegressionActual. The harness checks whichever keys are present.

export interface NumericRange {
  min: number;
  max: number;
}

export interface SignalExpectation {
  id: string;
  score: NumericRange;
}

export interface RegressionExpected {
  // Inference layer
  inferences?: {
    minCount?:       number;
    domains?:        string[];           // all of these domains must be represented
    hasReasonCodes?: string[];           // at least one conclusion with each code
  };

  // Hypothesis layer
  hypotheses?: {
    minCount?: number;
    hasIds?:   string[];                 // all of these hypothesis IDs must be present
    allAbove?: NumericRange;             // every matched hypothesis confidence in range
  };

  // Career domain
  career?: {
    currentState?:            string;           // exact match
    confidence?:              NumericRange;
    leadershipPotential?:     NumericRange;
    entrepreneurshipPotential?: NumericRange;
    jobStability?:            NumericRange;
    promotionPotential?:      NumericRange;
    growthPotential?:         NumericRange;
    signals?:                 SignalExpectation[];
    hasRecommendationActions?: string[];         // action strings that must appear (substring match)
    minRecommendations?:      number;
  };
}

export interface RegressionCase {
  id:       string;
  label:    string;
  tags?:    string[];    // e.g. ["career", "raj-yoga", "saturn-dominant"]
  input: {
    chartSuite: ChartSuite;
    dasha?:     DashaInfo;
  };
  expected: RegressionExpected;
}

// ── RegressionResult — output of running a single case ───────────────────────

export interface FieldFailure {
  field:    string;
  expected: string;
  actual:   string;
}

export interface RegressionResult {
  caseId:     string;
  label:      string;
  pass:       boolean;
  failures:   FieldFailure[];
  durationMs: number;
  actual: {
    inferenceCount?: number;
    hypothesisCount?: number;
    hypothesisIds?:   string[];
    reasonCodes?:     string[];
    career?:          CareerAssessment;
  };
}

// ── RegressionSummary ─────────────────────────────────────────────────────────

export interface RegressionSummary {
  totalCases:   number;
  passed:       number;
  failed:       number;
  passRate:     number;          // 0–1
  totalMs:      number;
  results:      RegressionResult[];
  ruleSetVersion: string;
  ranAt:        string;          // ISO datetime
}
