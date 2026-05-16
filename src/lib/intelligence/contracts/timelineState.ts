export interface TimelineWindow {
  id: string;
  startDate: string;
  endDate: string;

  category:
    | "EXPANSION"
    | "DISCIPLINE"
    | "VOLATILITY"
    | "RECOVERY"
    | "TRANSFORMATION"
    | "VISIBILITY"
    | "EMOTIONAL_PROCESSING";

  intensity: number;       // 1-10
  strategicValue: number;  // ROI for action
  emotionalLoad: number;   // Stress/Pressure

  title: string;
  themes: string[];

  recommendedActions: string[];
  cautionaryActions: string[];

  executionMode:
    | "WARRIOR"
    | "ARCHITECT"
    | "OBSERVER"
    | "DIPLOMAT"
    | "HEALER";

  relatedGoals: string[];  // IDs of goals impacted
}

export interface TransitionPoint {
  date: string;
  type: "PHASE_SHIFT" | "ENERGY_RESET" | "GOAL_PIVOT";
  description: string;
  intensity: number;
}

export interface StrategicHighlight {
  title: string;
  date: string;
  description: string;
  importance: number;
}

export interface TimelineProjection {
  timeframe: "30D" | "90D" | "365D";
  generatedAt: string;

  overallTrajectory: {
    direction: "ASCENDING" | "STABLE" | "VOLATILE" | "RESTRUCTURING";
    momentumScore: number;
    volatilityScore: number;
    clarityScore: number;
  };

  windows: TimelineWindow[];
  keyTransitions: TransitionPoint[];
  strategicHighlights: StrategicHighlight[];
  dominantThemes: string[];
  
  confidenceScore: number;
}
