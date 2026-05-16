export type TransitTier = 1 | 2 | 3;

export interface IntensityMatrix {
  pressure: number;
  opportunity: number;
  volatility: number;
}

export interface Manifestations {
  external: string[];
  internal: string[];
}

export interface NatalActivation {
  planet: string;
  type: "conjunction" | "aspect" | "houseActivation";
  intensity: number;
}

export interface TransitDomainWeighting {
  career: number;
  finance: number;
  relationships: number;
  health: number;
  mind: number;
}

export interface TransitIntelligence {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  
  tier: TransitTier;
  
  // Mappings
  houseFromLagna: number;
  houseFromMoon: number;
  
  // Classifications
  nature: string; // Contextual e.g., "structural pressure", "emotional friction"
  intensity: IntensityMatrix;
  
  // Narrative points
  themes: string[];
  manifestations: Manifestations;
  
  // Future proofing & reasoning
  affectedDomains: TransitDomainWeighting;
  activatedNatalPoints: NatalActivation[];
  
  // UI Display helpers
  whyItMatters: string[];
}

export interface CosmicClimate {
  headline: string;
  dominantThemes: string[];
  netPressure: number;
  netOpportunity: number;
  netVolatility: number;
}

export interface CompleteTransitReport {
  climate: CosmicClimate;
  transits: TransitIntelligence[];
}
