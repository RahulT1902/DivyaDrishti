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

// ── Placeholder types — populated by Step 3 (StrengthEngine) ────────────────

export interface PlanetStrength {
  planet: PlanetName;
  finalStrength: number;   // 0–100 composite
  components: {
    digBala: number;
    sthanaBala: number;
    cheshtaBala: number;
    naisargikaBala: number;
    drikBala: number;
    kalaBala: number;
    retrogradeBonus: number;
    combustPenalty: number;
    vargottamaBonus: number;
  };
}

// ── Placeholder types — populated by Step 4 (YogaEngine) ────────────────────

export interface YogaResult {
  id: string;
  name: string;
  isActive: boolean;
  strength: number;          // 0–100
  affectedDomains: string[];
  description: string;
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
  yogas: YogaResult[];         // populated by YogaEngine (Step 4)
  strengths: PlanetStrength[]; // populated by StrengthEngine (Step 3)
  metadata: ChartMetadata;
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
