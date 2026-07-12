export type Sign = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type PlanetName =
  | "Sun" | "Moon" | "Mars" | "Mercury"
  | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";

export type ChartType =
  | "D1" | "D2" | "D3" | "D4" | "D6" | "D7"
  | "D9" | "D10" | "D12" | "D16" | "D20" | "D24"
  | "D27" | "D30" | "D40" | "D45" | "D60";

// ── Input types (from SwissEph engine) ──────────────────────────────────────

export interface PlanetInput {
  name: PlanetName;
  longitude: number;      // absolute sidereal longitude (0–360)
  speed: number;          // degrees per day
  isRetrograde: boolean;
  isCombust: boolean;
  isVargottama: boolean;  // D1 sign === D9 sign
}

export interface LagnaInput {
  longitude: number;      // absolute sidereal longitude of ascendant (0–360)
}

// ── Chart building blocks ────────────────────────────────────────────────────

export interface PlanetPlacement {
  planet: PlanetName;
  sign: Sign;
  signName: string;
  house: number;          // 1–12, relative to this chart's ascendant (whole-sign)
  degreeInSign: number;   // precise only for D1; 0 for derived charts
  isRetrograde: boolean;
  isCombust: boolean;
  isVargottama: boolean;
}

export interface House {
  number: number;         // 1–12
  sign: Sign;
  signName: string;
  lord: PlanetName;
  planets: PlanetName[];
}

export interface HouseLord {
  house: number;
  lord: PlanetName;
  lordPlacedInHouse: number;
  lordPlacedInSign: Sign;
  isInOwnHouse: boolean;
  isExalted: boolean;
  isDebilitated: boolean;
}

export interface Aspect {
  fromPlanet: PlanetName;
  toSign: Sign;
  toHouse: number;
  toPlanets: PlanetName[];   // planets occupying the aspected sign
  aspectType: "3rd" | "4th" | "5th" | "7th" | "8th" | "9th" | "10th";
  isSpecial: boolean;        // true for non-universal special aspects
}

export interface Conjunction {
  planets: PlanetName[];
  sign: Sign;
  house: number;
}

// ── Planet Strength — canonical strength model ───────────────────────────────

export interface PlanetStrengthComponents {
  sthanaBala:     number;   // 0–100  dignity (exalted/own/friend/enemy/debilitated)
  digBala:        number;   // 0–100  directional strength
  naisargikaBala: number;   // 0–100  natural/inherent strength
  combustion:     number;   // 0–100  100=healthy, 0=fully combust
  retrograde:     number;   // 0–100  70=retrograde bonus, 50=direct
  vargottama:     number;   // 0–100  85=vargottama, 50=normal
  // Phase 3B stubs — plug in when computed, weights auto-adjust
  kalaBala:       number;   // 0–100  temporal strength (stub → 50)
  cheshtaBala:    number;   // 0–100  motional strength (stub → 50)
  drikBala:       number;   // 0–100  aspectual strength (stub → 50)
  avastha:        number;   // 0–100  planetary state (stub → 50)
}

export interface PlanetStrength {
  planet: PlanetName;
  overallStrength: number;  // 0–100 weighted composite of all components
  confidence: number;       // 0–100 how complete the model is (grows as stubs fill in)
  components: PlanetStrengthComponents;
  evidence: AstrologicalEvidence[];
}

// ── Yoga Engine types ────────────────────────────────────────────────────────

export type YogaStatus   = "Dormant" | "Emerging" | "Active" | "Peak";
export type YogaCategory = "Raj" | "Dhana" | "PanchaMahapurusha" | "Chandra" | "Vipareeta" | "Spiritual" | "Misc";
export type HouseGroup   = "Kendra" | "Trikona" | "Dusthana" | "Upachaya" | "Maraka";

// ── Declarative Rule DSL — each node is a composable boolean condition ───────

export type RuleNode =
  | { type: "PlanetInSign";            planet: PlanetName; sign: Sign }
  | { type: "PlanetInHouse";           planet: PlanetName; house: number }
  | { type: "PlanetInGroup";           planet: PlanetName; group: HouseGroup }
  | { type: "PlanetStrength";          planet: PlanetName; op: ">" | ">=" | "<" | "<="; value: number }
  | { type: "PlanetFunctionalNature";  planet: PlanetName; nature: FunctionalNature }
  | { type: "PlanetIsYogakaraka";      planet: PlanetName }
  | { type: "PlanetsConjunct";         planet1: PlanetName; planet2: PlanetName }
  | { type: "PlanetAspectsHouse";      planet: PlanetName; house: number }
  | { type: "PlanetAspectsPlanet";     from: PlanetName;   to: PlanetName }
  | { type: "LordOfHouseInHouse";      lordOf: number;     inHouse: number }
  | { type: "LordOfHouseInGroup";      lordOf: number;     group: HouseGroup }
  | { type: "HouseLordsConjunct";      house1: number;     house2: number }
  | { type: "HouseLordAspectsHouseLord"; fromHouse: number; toHouse: number }
  | { type: "PlanetIsExalted";         planet: PlanetName }
  | { type: "PlanetIsDebilitated";     planet: PlanetName }
  | { type: "PlanetInOwnSign";         planet: PlanetName }
  | { type: "PlanetIsRetrograde";      planet: PlanetName }
  | { type: "PlanetIsCombust";         planet: PlanetName }
  | { type: "PlanetIsVargottama";      planet: PlanetName }
  | { type: "PlanetInKendraFromPlanet"; planet: PlanetName; reference: PlanetName }
  | { type: "HouseHasMinPlanets";      house: number; minCount: number }
  | { type: "AND";  rules: RuleNode[] }
  | { type: "OR";   rules: RuleNode[] }
  | { type: "NOT";  rule: RuleNode };

// Shared result type for DSL evaluation and custom yoga functions
export interface ConditionResult {
  matches: boolean;
  supportingPlanets: PlanetName[];
  descriptions: string[];
}

// Input to every rule evaluation
export interface EvaluationContext {
  chart: DivisionalChart;
  roles: PlanetRole[];
  strengths: PlanetStrength[];
}

// Modifier: adjusts a detected yoga's strength up or down
export interface YogaModifier {
  condition: RuleNode;
  strengthDelta: number;   // positive = strengthen, negative = weaken
  description: string;
}

// Declarative yoga definition — the engine evaluates these, not hardcoded if-chains
export interface YogaDefinition {
  id: string;
  name: string;
  sanskritName?: string;
  category: YogaCategory;
  domains: string[];
  severity: number;        // 0–100 — impact weight used by domain engines
  priority: number;        // evaluation order (lower = checked first)
  conditions: RuleNode;    // DSL-evaluated detection rule
  // Optional override: evaluated instead of `conditions` when set (for complex combinatorial yogas)
  evaluateFn?: (ctx: EvaluationContext) => ConditionResult;
  // Optional override: computes yoga strength from detected planets (default: average of planet strengths)
  strengthFormula?: (ctx: EvaluationContext, supportingPlanets: PlanetName[]) => number;
  modifiers: YogaModifier[];
  description: string;
  classicalReference?: string;
}

// Yoga checked but conditions not met — captured for "near miss" reporting
export interface YogaCandidate {
  yogaId: string;
  yogaName: string;
  failedConditions: string[];
  nearMiss: boolean;       // true when only one sub-condition failed
}

// Two yogas that conflict (e.g., Gajakesari + combust Jupiter)
export interface YogaConflict {
  yoga1Id: string;
  yoga2Id: string;
  description: string;
  netStrengthDelta: number;
}

// ── Immutable birth promise (what the natal chart contains) ──────────────────
// Computed once, never changes.  Status is NOT here — that belongs to activation.

export interface YogaBirthPromise {
  id: string;
  name: string;
  sanskritName?: string;
  category: YogaCategory;
  birthStrength: number;      // 0–100 — how strongly formed in the natal chart
  severity: number;           // 0–100 — impact weight used by domain engines
  supportingPlanets: PlanetName[];
  affectedDomains: string[];
  evidence: AstrologicalEvidence[];
  description: string;
}

// ── Dasha activation weights — the 5-component model ─────────────────────────
// These govern how activation score is computed from available data.
// Weights sum to 1.0.  When a component has no data, its weight is
// redistributed proportionally across available components.

export interface DashaWeights {
  natalPromise:   number;  // 0.40 default — yoga birth strength
  mahadasha:      number;  // 0.30 default — mahadasha lord activation
  antardasha:     number;  // 0.15 default — antardasha lord activation
  transit:        number;  // 0.10 default — current transit support
  planetStrength: number;  // 0.05 default — supporting planet strength
}

export const DEFAULT_DASHA_WEIGHTS: DashaWeights = {
  natalPromise:   0.40,
  mahadasha:      0.30,
  antardasha:     0.15,
  transit:        0.10,
  planetStrength: 0.05,
};

// ── 5-component provenance for a yoga activation score ────────────────────────

export interface DashaProvenance {
  natalPromise:   number;  // 0–100, raw contribution from birth strength
  mahadasha:      number;  // 0–100, raw contribution from maha lord timing
  antardasha:     number;  // 0–100, raw contribution from antar lord timing
  transit:        number;  // 0–100, raw contribution from transit (stub)
  planetStrength: number;  // 0–100, raw contribution from supporting planet strength
  appliedWeights: DashaWeights;  // which weights were actually used (after redistribution)
}

// ── Mutable activation state (whether/when the promise manifests) ─────────────
// Recomputed whenever timing data changes.
// dashaProvenance exposes the 5-component breakdown for transparency and tuning.

export interface YogaActivation {
  yogaId: string;
  status: YogaStatus;           // Dormant | Emerging | Active | Peak
  activationScore: number;      // 0–100 composite
  strengthContribution: number; // kept for backward compatibility
  dashaContribution: number;    // mahadasha + antardasha combined contribution
  transitContribution: number;  // transit contribution (stub: 0 until TransitEngine)
  isDashaActive: boolean;
  isTransitActive: boolean;
  dashaProvenance: DashaProvenance;   // explicit 5-component breakdown
  evidence: AstrologicalEvidence[];
}

// ── Dasha period info — typed here so ActivationEngine can accept it ──────────
export interface DashaInfo {
  mahadasha: PlanetName;
  antardasha: PlanetName;
  periodStart: string;         // ISO date
  periodEnd: string;           // ISO date
}

// ── YogaDetectionResult — raw output from the Yoga Engine ────────────────────
// Activation Engine then adds YogaActivation[] to form the full YogaAnalysis.

export interface YogaDetectionResult {
  birthPromises:       YogaBirthPromise[];
  missed:              YogaCandidate[];
  conflictingYogas:    YogaConflict[];
  dominantPromises:    YogaBirthPromise[];   // top by birthStrength × severity
  overallBirthStrength: number;              // 0–100 weighted natal composite
  evidence:            AstrologicalEvidence[];
}

// ── Full YogaAnalysis — assembled by AstrologyContextBuilder ──────────────────

export interface YogaAnalysis {
  // Detection phase (from YogaEngine) — immutable
  birthPromises:        YogaBirthPromise[];
  dominantPromises:     YogaBirthPromise[];
  conflictingYogas:     YogaConflict[];
  missed:               YogaCandidate[];
  overallBirthStrength: number;

  // Activation phase (from ActivationEngine) — mutable
  activations:          YogaActivation[];
  overallActivationScore: number;

  evidence: AstrologicalEvidence[];
}

// ── Rule versioning — every prediction records which engine version produced it ─

export interface RuleSetMeta {
  id: string;
  version: string;         // semantic version e.g., "1.0.0"
  effectiveDate: string;   // ISO date
  author: string;
}

// ── Confidence provenance — where does the number come from? ─────────────────
// Stores the raw contribution from each engine tier so the LLM can explain
// *why* a confidence is at a given level, not just what it is.

export interface ConfidenceProvenance {
  natal:      number;   // 0–100 — contribution from natal chart quality (yoga/dignity)
  activation: number;   // 0–100 — contribution from activation engine (dasha/transit)
  strength:   number;   // 0–100 — contribution from planetary strength engine
}

// ── Inference Engine types ────────────────────────────────────────────────────
// Domain engines query these conclusions rather than re-implementing astrological logic.

// ── Uncertainty profile — what data gaps reduce reliability ────────────────────
// Exposed alongside confidence so the LLM narrator can be transparent about
// what the engine knows, suspects, and is uncertain about.

export interface UncertaintyProfile {
  missingData:         string[];   // data that would improve this assessment
  weakEvidence:        string[];   // where evidence is thin or inconclusive
  conflictingEvidence: string[];   // chart factors that contradict each other
  overallUncertainty:  "Low" | "Medium" | "High";
}

// ── Prediction Horizon — how long a conclusion is expected to remain valid ─────

export type PredictionScope =
  | "Immediate"     // 1–3 months — transit/sub-period driven
  | "CurrentDasha"  // current maha/antardasha period
  | "MediumTerm"    // 6–18 months
  | "LongTerm"      // 2–7 years
  | "Natal";        // lifelong tendency from birth chart

export interface PredictionHorizon {
  scope:       PredictionScope;
  label:       string;            // "1–3 months" | "Current Dasha Period" | "Natal Promise" etc.
  description: string;            // one sentence on what drives this horizon
}

// ── Inference Engine types ────────────────────────────────────────────────────
// Domain engines query these conclusions rather than re-implementing astrological logic.

// Rule authors return DraftConclusion — InferenceEngine stamps the four
// bookkeeping fields (provenance, ruleId, ruleSetVersion, horizon) before storing.
export type DraftConclusion = Omit<InferenceConclusion, "provenance" | "ruleId" | "ruleSetVersion" | "horizon">;

export interface InferenceConclusion {
  id: string;
  domain: string;                           // "Career" | "Wealth" | "Marriage" | "Health" | "General"
  statement: string;                        // precise machine-readable description
  confidence: number;                       // 0–100
  probability: number;                      // 0–100 — likelihood of manifestation
  direction: "Positive" | "Negative" | "Mixed";
  timing: "Natal" | "Current";             // Natal = always true; Current = needs dasha/transit
  supportingEvidence: string[];
  conflictingEvidence: string[];
  reasonCodes: string[];                    // machine codes for domain-engine filtering
  planets: PlanetName[];                    // key planets involved
  provenance: ConfidenceProvenance;         // breakdown of confidence sources
  ruleId: string;                           // which rule produced this
  ruleSetVersion: string;                   // which engine version (for regression tracking)
  horizon: PredictionHorizon;              // how long this conclusion is expected to hold
  uncertainty?: UncertaintyProfile;        // only set when the rule detects explicit uncertainty
}

// ── Hypothesis Layer — abstract concepts between inference and domains ────────
// A hypothesis (e.g. "Leadership Potential") can feed multiple domains.
// The same Saturn → Discipline hypothesis contributes to Career, Education, Spirituality.
// Hypotheses are derived from InferenceConclusions — they cluster related conclusions
// into a named, reusable symbolic concept.

export interface Hypothesis {
  id: string;
  label: string;                            // e.g., "Leadership Potential"
  confidence: number;                       // 0–100
  domains: Record<string, number>;          // domain → relevance weight (0–1)
  supportingPlanets: PlanetName[];
  triggerReasonCodes: string[];             // which InferenceConclusion reasonCodes activated this
  sourceInferenceIds: string[];             // which InferenceConclusion ids fed this
  provenance: ConfidenceProvenance;
  evidence: AstrologicalEvidence[];
}

// ── Inference Graph — bidirectional reasoning for "Why?" explanations ─────────
// Every node records its parents (what it was derived from) and children
// (what it contributes to).  Traversing backward from a domain conclusion
// reveals the full explanation chain: Domain ← Hypothesis ← Inference ← Fact.

export type InferenceNodeType = "Fact" | "Inference" | "Hypothesis" | "Decision";

export interface InferenceNode {
  id: string;
  type: InferenceNodeType;
  label: string;
  confidence: number;
  parents:  string[];   // node IDs this was derived from
  children: string[];   // node IDs this contributes to
  evidence: AstrologicalEvidence[];
}

// ── Decision Graph — structured output for domain engines and LLM narrator ───
// Instead of a flat "Career: 87%" score, the DecisionGraph exposes the full
// reasoning: what supports, what blocks, when to act, and why.

export interface DecisionFactor {
  label: string;
  confidence: number;
  direction: "Supporting" | "Blocking";
  sourceHypothesisIds: string[];
  reasonCodes: string[];
}

export interface TimingWindow {
  label: string;             // e.g., "Growth Phase", "Consolidation", "Transformation"
  startDate?: string;        // ISO date — populated when dasha data is present
  endDate?: string;
  isDashaSupported: boolean;
  description: string;
}

export interface DecisionGraph {
  domain: string;
  currentState: string;           // e.g., "Growth Phase", "Stagnation", "Dormant Promise"
  overallScore: number;           // 0–100 composite
  supportingFactors: DecisionFactor[];
  blockingFactors:   DecisionFactor[];
  timing: TimingWindow;
  recommendedAction: string;
  confidence: number;
  provenance: ConfidenceProvenance;
  hypothesisIds: string[];        // which hypotheses drove this graph
  ruleSetVersion: string;
}

// ── Shared evidence model — every engine emits this format ──────────────────

export interface AstrologicalEvidence {
  id: string;
  category:
    | "FunctionalNature" | "NaturalNature" | "Ownership"
    | "Placement" | "Yoga" | "Transit" | "Dasha" | "Strength";
  description: string;
  strength: number;        // 0–100, how strong this evidence is
  weight: number;          // importance multiplier for confidence scoring
  sourceChart: ChartType;
  planet?: PlanetName;
  house?: number;
  sign?: Sign;
}

// ── Planet Intelligence output ───────────────────────────────────────────────

export type NaturalNature = "GreatBenefic" | "Benefic" | "Neutral" | "MildMalefic" | "Malefic" | "Shadow";
export type FunctionalNature = "Yogakaraka" | "FunctionalBenefic" | "Neutral" | "FunctionalMalefic" | "Maraka" | "Badhaka" | "Mixed";

export interface PlanetRole {
  planet: PlanetName;
  naturalNature: NaturalNature;
  functionalNature: FunctionalNature;
  ownsHouses: number[];
  ownsSigns: Sign[];
  isYogakaraka: boolean;
  isMaraka: boolean;
  isBadhaka: boolean;
  isKendradhipati: boolean;
  isTrikonadhipati: boolean;
  isDusthanadhipati: boolean;
  isFunctionalBenefic: boolean;
  isFunctionalMalefic: boolean;
  priorityScore: number;     // 0–100 composite importance
  reasoning: AstrologicalEvidence[];
}

// ── Universal engine contract ────────────────────────────────────────────────

export interface AstrologyEngine<I, O> {
  evaluate(input: I): O;
}

// ── Chart metadata ───────────────────────────────────────────────────────────

export interface ChartMetadata {
  varga: number;             // divisional number (1 for D1, 10 for D10, etc.)
  purpose: string;           // human-readable domain focus
  accuracyWeight: number;    // 0–1, relative weight in multi-chart confidence scoring
  source: "Computed" | "Placeholder";   // Placeholder = empty shell; rules must skip
}

// ── The universal chart object ───────────────────────────────────────────────

export interface DivisionalChart {
  chartType: ChartType;
  ascendant: {
    sign: Sign;
    signName: string;
    degreeInSign: number;
  };
  planets: PlanetPlacement[];
  houses: House[];
  lords: HouseLord[];
  aspects: Aspect[];
  conjunctions: Conjunction[];
  yogas: YogaBirthPromise[];   // populated by YogaEngine
  strengths: PlanetStrength[]; // populated by StrengthEngine (Step 3)
  metadata: ChartMetadata;
}

// ── Knowledge Completeness Score ──────────────────────────────────────────────
// Answers: "How much of the intended reasoning model has been applied?"
//
// Separate from confidence (which answers "How strongly do we believe this?").
// A conclusion can be high-confidence AND low-completeness (e.g., strong natal
// yoga detected, but Ashtakavarga, transit, and Kala Bala are all missing —
// the conclusion is reliable as far as it goes, but limited in scope).
//
// Components use three statuses, each contributing a fraction of their weight:
//   Full    → 1.0 × weight
//   Partial → 0.5 × weight
//   Missing → 0.0 × weight

export type CompletenessStatus = "Full" | "Partial" | "Missing";

export interface CompletenessComponent {
  name:    string;
  status:  CompletenessStatus;
  weight:  number;     // target contribution to overall score (0–1, all sum to 1)
  note?:   string;     // what's missing, partial, or implemented
}

export interface KnowledgeCompletenessScore {
  overall:            number;                   // 0–100 weighted completeness
  components:         CompletenessComponent[];  // full per-capability breakdown
  missingComponents:  string[];                 // names of Missing components
  partialComponents:  string[];                 // names of Partial components
  implementedWeight:  number;                   // sum of Full component weights (0–1)
}

// ── Explainability Coverage ───────────────────────────────────────────────────
// Measures what fraction of inference conclusions can be fully traced through
// the Fact → Inference → Hypothesis → Decision chain in the inference graph.
//
// A prediction is "fully explainable" only when all four chain links exist:
//   Fact (observed planetary position/yoga) →
//   Inference (rule conclusion) →
//   Hypothesis (abstract concept: leadership, discipline, etc.) →
//   Decision (domain-level assessment)
//
// "Partially explainable" = exists in graph but chain is incomplete.
// "Opaque" = inference conclusion has no matching node in the graph.

export interface ExplainabilityCoverage {
  total:                number;  // total InferenceConclusion[] in this context
  fullyExplainable:     number;  // complete Fact→Inference→Hypothesis→Decision chain
  partiallyExplainable: number;  // some chain present but incomplete
  opaque:               number;  // not in inference graph at all
  coverageScore:        number;  // 0–100  (fullyExplainable / total × 100)
}

// ── AstrologyContext — single enriched object that flows through all engines ─

export interface AstrologyContext {
  chartSuite:      ChartSuite;
  planetRoles:     PlanetRole[];
  planetStrengths: PlanetStrength[];
  yogaAnalysis:    YogaAnalysis;
  inferences:      InferenceConclusion[];   // fine-grained rule conclusions
  hypotheses:      Hypothesis[];            // abstract concepts (leadership, discipline, etc.)
  inferenceGraph:  InferenceNode[];         // bidirectional graph — enables "Why?" traversal
  completeness:    KnowledgeCompletenessScore;   // how much of the model has been applied
  explainability:  ExplainabilityCoverage;       // what fraction of conclusions are graph-traceable
  dasha?:              DashaInfo;
  transit?:            import("./transit-engine/types").TransitEvidence[];
  // How consistent is the transit picture across daily/weekly/monthly/yearly horizons?
  // Present only when transit evidence is available; absent = can't measure stability.
  temporalStability?:  import("./transit-engine/types").TemporalStabilityScore;
  // Today's Moon nakshatra index (0–26, Ashwini→Revati) — primary daily health differentiator.
  // Moon shifts nakshatra every ~24 hours; this is what makes health readings day-specific
  // even when no major transit house rules fire.
  moonNakshatraIndex?: number;
}

// ── Chart suite — all divisional charts for one birth ───────────────────────

export interface ChartSuite {
  D1: DivisionalChart;
  D2: DivisionalChart;
  D3: DivisionalChart;
  D4: DivisionalChart;
  D7: DivisionalChart;
  D9: DivisionalChart;
  D10: DivisionalChart;
  D12: DivisionalChart;
  // Phase 5 additions (D6, D20, D24, D30, D60) added as engine matures
}
