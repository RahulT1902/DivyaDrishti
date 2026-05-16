export interface DomainState {
  score: number;        // 0-100
  momentum: number;     // -10 to +10
  status: string;       // e.g., "Steady Growth", "High Pressure"
  summary: string;      // Human-centric summary
  primaryFocus: string; // The "One Thing" to focus on
  manifestations: {
    external: string[]; // What's happening "out there"
    internal: string[]; // What's happening "in here"
  };
  recommendations: string[];
}

export interface PressurePoint {
  factor: string;
  intensity: number;    // 1-10
  nature: "structural" | "emotional" | "timing";
  description: string;
  remedy: string;
}

export interface OpportunityWindow {
  title: string;
  startDate: string;
  endDate: string;
  intensity: number;
  domain: string;
  actionStep: string;
}

export interface CautionArea {
  title: string;
  severity: "low" | "medium" | "high";
  domain: string;
  trigger: string;
  avoid: string;
}

export interface GoalAlignment {
  goalId: string;
  title: string;
  alignmentScore: number; // 0-1
  narrative: string;
  phase: "initiate" | "sustain" | "complete" | "wait";
}

export interface HabitAlignment {
  habitId: string;
  title: string;
  isFavored: boolean;
  adaptation: string;
}

export interface LifeState {
  version: "1.0.0";
  generatedAt: string;

  overallState: {
    title: string;
    summary: string;
    
    // Core OS Metrics
    stabilityScore: number;  // Resilience
    momentumScore: number;   // Speed of progress
    volatilityScore: number; // Uncertainty/Change
    clarityScore: number;    // Decision-making ease
  };

  primaryThemes: string[];

  activeDomains: {
    career: DomainState;
    finance: DomainState;
    relationships: DomainState;
    health: DomainState;
    spirituality: DomainState;
  };

  currentPressurePoints: PressurePoint[];
  opportunityWindows: OpportunityWindow[];
  cautionAreas: CautionArea[];

  recommendedFocus: string[];

  behavioralGuidance: {
    recommendedBehaviors: string[];
    avoidBehaviors: string[];
  };

  emotionalState: {
    dominantTone: string;
    emotionalLoad: number;   // 1-10
    resilienceScore: number; // 1-10
  };

  activeGoals: GoalAlignment[];
  habitAlignment: HabitAlignment[];

  confidenceScore: number;

  metadata: {
    dominantPlanetaryDrivers: string[];
    dominantTimeframe: string;
    engineVersion: string;
  };
}
