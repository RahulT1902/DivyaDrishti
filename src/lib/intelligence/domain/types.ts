export type DomainType = "career" | "finance" | "relationship" | "health" | "mental-state";

export interface DomainIntelligence {
  domain: DomainType;
  dominantTheme: string;
  supportingFactors: string[];
  restrictiveFactors: string[];
  synthesis: string;
  pressureLevel: number; // 1-10
  opportunityLevel: number; // 1-10
  stabilityLevel: number; // 1-10
  manifestations: {
    external: string[];
    internal: string[];
  };
  timelineState: {
    improving: boolean;
    accelerating: boolean;
    unstable: boolean;
  };
  recommendations: string[];
  confidence: number; // 0-1
}

export interface DomainSignal {
  factor: string;
  source: "natal" | "dasha" | "transit";
  impact: "supportive" | "restrictive" | "mixed";
  weight: number;
  reason: string;
}
