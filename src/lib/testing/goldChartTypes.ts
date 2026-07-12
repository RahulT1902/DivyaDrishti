import { PlanetName, Sign } from "../core/types";
import { TransitEvidence } from "../core/transit-engine/types";

export type GoldChartDomain = "Career" | "Marriage" | "Health" | "Finance";

export interface PlanetSpec {
  sign:         Sign;
  house:        number;         // 1-12 relative to D1 ascendant (whole-sign)
  degreeInSign?: number;        // 0-30 — affects avastha calculation
  isRetrograde?: boolean;
  isCombust?:   boolean;
  isVargottama?: boolean;
}

export interface SubChartSpec {
  ascendantSign: Sign;
  planets:       Partial<Record<PlanetName, PlanetSpec>>;
}

// Simplified chart description — the harness converts this to a full ChartSuite
export interface GoldChartSpec {
  id:            string;
  description:   string;
  ascendantSign: Sign;                                    // D1 ascendant (1=Aries…12=Pisces)
  planets:       Partial<Record<PlanetName, PlanetSpec>>; // all planets you want to place
  d9?:           SubChartSpec;   // Navamsa — omit to use empty chart
  d10?:          SubChartSpec;   // Dashamsa — omit to use empty chart
  dasha?: {
    mahadasha:   PlanetName;
    antardasha:  PlanetName;
    periodStart: string;         // ISO date
    periodEnd:   string;
  };
  // Mocked transit evidence — used in temporal gold tests (today/tomorrow/week)
  // instead of live SwissEph calls.  Each entry is a pre-built TransitEvidence
  // as if TransitAnalyzer + HEALTH_TRANSIT_RULES had already run.
  transitEvidence?: TransitEvidence[];
}

export interface DomainAssertion {
  minConfidence?: number;        // ctx must produce >= this confidence for this domain
  maxConfidence?: number;
  currentState?:  string;        // exact string match against assessment.currentState
}

// What the validate script checks against the engine output
export interface GoldChartAssertions {
  description:          string;
  requiredInferences?:  string[];   // rule IDs that MUST appear in ctx.inferences
  forbiddenInferences?: string[];   // rule IDs that MUST NOT appear
  requiredYogas?:       string[];   // yoga IDs that must be in yogaAnalysis.birthPromises
  forbiddenYogas?:      string[];
  domains?:             Partial<Record<GoldChartDomain, DomainAssertion>>;
  minCompleteness?:     number;     // ctx.completeness.overall >= this
  // Rule count guard: catches over-permissive logic (sudden spikes) or silent regressions (drops)
  expectedRuleCount?:     { min: number; max: number };
  // Graph integrity: maximum opaque inferences (not in graph at all)
  maxOpaqueInferences?:   number;
  // Graph integrity: maximum disconnected nodes (no parents AND no children)
  maxDisconnectedNodes?:  number;
  // Transit assertions — verify temporal transit rules fired as expected
  requiredTransitRules?:  string[];   // transit ruleIds that MUST appear in transitEvidence
  minActivationScore?:    number;     // normaliseTransitEvidence(transit) >= this
  maxActivationScore?:    number;
}

// Runtime result for one assertion
export interface AssertionResult {
  assertion: string;
  passed:    boolean;
  actual?:   string;
  expected?: string;
}

export interface ChartValidationResult {
  chartId:           string;
  description:       string;
  domain:            GoldChartDomain;
  passed:            boolean;
  assertions:        AssertionResult[];
  totalAssertions:   number;
  passedAssertions:  number;
}
