import { PlanetName, Sign, AstrologicalEvidence } from "../types";

// ── Layer 1: Pure astronomy (no interpretation) ───────────────────────────────

export interface TransitPlanetPosition {
  planet:       PlanetName;
  longitude:    number;       // 0–360 sidereal
  sign:         Sign;         // 1–12
  signName:     string;
  degreeInSign: number;       // 0–30
  speed:        number;       // degrees/day (negative = retrograde)
  isRetrograde: boolean;
  isCombust:    boolean;
}

export interface TransitSnapshot {
  date:      string;                    // ISO date "YYYY-MM-DD"
  julDay:    number;                    // Julian Day — for exact reproducibility in tests
  positions: TransitPlanetPosition[];
}

// ── Layer 2: Symbolic facts (position relative to natal chart) ────────────────

export interface TransitFact {
  planet:       PlanetName;
  transitSign:  Sign;
  natalHouse:   number;     // which house in the natal chart this transit sign corresponds to (1–12)
  isRetrograde: boolean;
  isCombust:    boolean;
  // Conjunction with a natal planet (transiting planet within 6° of a natal planet)
  conjunctsNatalPlanet?: PlanetName;
  degreesFromNatalPlanet?: number;
}

// ── Layer 3: Domain-specific scored evidence ──────────────────────────────────

export type TransitDurationCategory = "Momentary" | "Short" | "Medium" | "Long" | "Extended";

export interface TransitDuration {
  planet:   PlanetName;
  typical:  string;              // human-readable: "~2.5 days", "~1 month", "~2.5 years"
  category: TransitDurationCategory;
}

export const TRANSIT_DURATIONS: Record<PlanetName, TransitDuration> = {
  Moon:    { planet: "Moon",    typical: "~2.5 days per sign",   category: "Momentary" },
  Sun:     { planet: "Sun",     typical: "~1 month per sign",    category: "Short"     },
  Mercury: { planet: "Mercury", typical: "2–3 weeks per sign",   category: "Short"     },
  Venus:   { planet: "Venus",   typical: "~1 month per sign",    category: "Short"     },
  Mars:    { planet: "Mars",    typical: "~6 weeks per sign",    category: "Medium"    },
  Jupiter: { planet: "Jupiter", typical: "~1 year per sign",     category: "Long"      },
  Saturn:  { planet: "Saturn",  typical: "~2.5 years per sign",  category: "Extended"  },
  Rahu:    { planet: "Rahu",    typical: "~18 months per sign",  category: "Extended"  },
  Ketu:    { planet: "Ketu",    typical: "~18 months per sign",  category: "Extended"  },
};

export interface TransitEvidence {
  ruleId:      string;          // e.g., "transit-moon-6th-health"
  domain:      string;          // "Health", "Career", "General"
  label:       string;          // "Moon in 6th: Digestive Sensitivity"
  description: string;
  planet:      PlanetName;
  natalHouse:  number;
  // scoreDelta: how much this transit shifts the domain activation.
  //   Positive = supportive (e.g., Jupiter transiting lagna: +20)
  //   Negative = challenging (e.g., Moon in 6th: -12)
  //   Range: -30 to +30
  scoreDelta:  number;
  direction:   "Supportive" | "Neutral" | "Challenging";
  duration:    TransitDuration;
  evidence:    AstrologicalEvidence[];
}

// ── Temporal horizon weighting ────────────────────────────────────────────────
//
// The same TransitEvidence[] means different things depending on the question:
//   "How's my health today?" → Moon dominates  (changes every 2.5 days)
//   "How's my health this year?" → Jupiter/Saturn dominate  (~1–2.5 year cycles)
//
// TEMPORAL_WEIGHTS multiplies each planet's scoreDelta before summing.
// A weight of 1.0 = full effect.  A weight of 0.05 = nearly ignored.
//
// Design:  weights are chosen so that a planet's influence peaks at the horizon
// that matches its transit duration category:
//   Momentary (Moon)   → peaks at "daily"
//   Short (Sun/Merc/Venus) → peaks at "weekly"/"monthly"
//   Medium (Mars)      → peaks at "monthly"
//   Long (Jupiter)     → peaks at "yearly"
//   Extended (Saturn/Rahu/Ketu) → peaks at "yearly"

export type TemporalHorizon = "daily" | "weekly" | "monthly" | "yearly";

export const TEMPORAL_WEIGHTS: Record<TemporalHorizon, Record<PlanetName, number>> = {
  daily: {
    Moon: 1.00, Sun: 0.50, Mercury: 0.45, Venus: 0.45,
    Mars: 0.25, Jupiter: 0.08, Saturn: 0.05, Rahu: 0.05, Ketu: 0.05,
  },
  weekly: {
    Moon: 0.60, Sun: 0.80, Mercury: 0.75, Venus: 0.75,
    Mars: 0.50, Jupiter: 0.20, Saturn: 0.10, Rahu: 0.10, Ketu: 0.10,
  },
  monthly: {
    Moon: 0.15, Sun: 1.00, Mercury: 0.85, Venus: 0.85,
    Mars: 0.90, Jupiter: 0.55, Saturn: 0.30, Rahu: 0.30, Ketu: 0.30,
  },
  yearly: {
    Moon: 0.05, Sun: 0.20, Mercury: 0.15, Venus: 0.15,
    Mars: 0.45, Jupiter: 1.00, Saturn: 1.00, Rahu: 0.85, Ketu: 0.85,
  },
};

// ── Temporal Stability ────────────────────────────────────────────────────────
//
// Answers: "Is this chart's outlook consistent across time, or is there a
// short-lived transit creating a temporary departure from the longer trend?"
//
// Computed by running normalizeTransitEvidence at all four horizons.
// The same TransitEvidence[] produces four numbers — the spread between them
// is the stability metric.
//
// Example A — stable chart:
//   daily=70, weekly=69, monthly=71, yearly=70  →  range=2  →  Stable
//
// Example B — short-term dip:
//   daily=41, weekly=46, monthly=72, yearly=78  →  range=37 →  Volatile
//   insight: "Long-term promise is strong; a short-lived transit is creating
//             temporary sensitivity."
//
// The LLM narrator uses `insight` to say "today" vs "this year" meaningfully.

export interface TemporalStabilityScore {
  scores:  Record<TemporalHorizon, number>;
  range:   number;                             // max − min across four horizons
  label:   "Stable" | "Moderate" | "Variable" | "Volatile";
  insight: string;                             // narrator-ready plain-language summary
}

// ── Transit inference rule contract ──────────────────────────────────────────

export interface TransitRule {
  id:       string;
  domain:   string;
  priority: number;   // lower = checked first
  test:     (fact: TransitFact) => boolean;
  conclude: (fact: TransitFact) => Omit<TransitEvidence, "evidence">;
}
