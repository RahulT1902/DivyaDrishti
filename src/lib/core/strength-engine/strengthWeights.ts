// Configurable weights for each strength component.
// Weights represent the target full-model contribution (must sum to 1.0).
// Stubs remain at their target weight but are flagged so confidence is computed correctly.

export interface ComponentWeightConfig {
  weight: number;
  implemented: boolean;
}

export type StrengthWeightMap = Record<
  | "sthanaBala" | "digBala" | "naisargikaBala" | "combustion"
  | "retrograde" | "vargottama" | "kalaBala" | "cheshtaBala"
  | "drikBala" | "avastha",
  ComponentWeightConfig
>;

export const STRENGTH_WEIGHTS: StrengthWeightMap = {
  sthanaBala:     { weight: 0.25, implemented: true  },
  digBala:        { weight: 0.20, implemented: true  },
  naisargikaBala: { weight: 0.12, implemented: true  },
  combustion:     { weight: 0.15, implemented: true  },
  retrograde:     { weight: 0.10, implemented: true  },
  vargottama:     { weight: 0.10, implemented: true  },
  kalaBala:       { weight: 0.04, implemented: true  }, // Phase 3B — Paksha approximation
  cheshtaBala:    { weight: 0.02, implemented: true  }, // Phase 3B — retrograde/combust flags
  drikBala:       { weight: 0.01, implemented: true  }, // Phase 3B — aspect list scan
  avastha:        { weight: 0.01, implemented: true  }, // Phase 3B — degree-based state
};

// Sum of all target weights — used to compute confidence %
export const TOTAL_MODEL_WEIGHT = Object.values(STRENGTH_WEIGHTS)
  .reduce((sum, c) => sum + c.weight, 0);

// Sum of implemented weights only — confidence numerator
export const IMPLEMENTED_WEIGHT = Object.values(STRENGTH_WEIGHTS)
  .filter(c => c.implemented)
  .reduce((sum, c) => sum + c.weight, 0);

export const MODEL_CONFIDENCE = Math.round((IMPLEMENTED_WEIGHT / TOTAL_MODEL_WEIGHT) * 100);
