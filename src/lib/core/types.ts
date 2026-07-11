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

// ── Mutable activation state (whether/when the promise manifests) ─────────────
// Recomputed whenever timing data changes.  Currently strength-based only;
// dashaContribution and transitContribution become non-zero in Phase 5.

export interface YogaActivation {
  yogaId: string;
  status: YogaStatus;          // Dormant | Emerging | Active | Peak
  activationScore: number;     // 0–100 composite
  strengthContribution: number; // from natal birth strength
  dashaContribution: number;   // from active dasha (stub: 0 until DashaEngine)
  transitContribution: number; // from current transit (stub: 0 until TransitEngine)
  isDashaActive: boolean;
  isTransitActive: boolean;
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

// ── Inference Engine types ────────────────────────────────────────────────────
// Domain engines query these conclusions rather than re-implementing astrological logic.

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
  source: "Computed";        // future: "Corrected" | "UserOverride"
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

// ── AstrologyContext — single enriched object that flows through all engines ─

export interface AstrologyContext {
  chartSuite:      ChartSuite;
  planetRoles:     PlanetRole[];
  planetStrengths: PlanetStrength[];
  yogaAnalysis:    YogaAnalysis;
  inferences:      InferenceConclusion[];   // pre-derived conclusions for domain engines
  dasha?:          DashaInfo;               // typed — populated when DashaEngine integrates
  transit?:        unknown;                 // typed when TransitEngine integrates
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
