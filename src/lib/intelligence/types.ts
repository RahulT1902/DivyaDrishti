export type DecisionSignal = "ACT" | "WAIT" | "AVOID" | "OBSERVE";

export type IntentDomain = "career" | "finance" | "relationship" | "health" | "general" | "mind" | "spirituality" | "family" | "education" | "business";
export type NarrativeStyle = "A" | "B" | "C" | "D" | "E";
export type IntentType = "decision" | "problem" | "timing" | "general";

export interface Intent {
  domain: IntentDomain;
  type: IntentType;
  confidence: number;
  timeframe?: string;
  narrativeStyle?: NarrativeStyle;
}

export interface ChatResponse {
  answer: string;
  followUp: string;
  confidence: "high" | "medium" | "low";
  intent: {
    domain: IntentDomain;
    type: IntentType;
  };
}

export type Timeframe = "today" | "this-week" | "this-month" | "quarter" | "year";

export type ImpactWeight = "foundation" | "active" | "challenge";

export interface TimingInsight {
  start: string;
  mid: string;
  end: string;
}

export interface Phase {
  title: string;
  period: string;
  astroReason: string;
  realityCheck: string[];
  verdict: string;
  detailBullets?: string[]; // 📅 Specific day-by-day details
}

export interface CategorizedInsight {
  label: string;
  type: "positive" | "negative" | "neutral" | "risk";
  icon?: string;
  title: string;
  points: string[];
  netEffect?: string;
}

export type AstroEvidence = {
  factor: string;
  category: "dasha" | "transit" | "natal" | "divisional";
  impact: "supportive" | "restrictive" | "mixed";
  strength: number; // 1-10
  explanation: string;
};

export type StructuralTension = {
  support: string;
  friction: string;
  synthesis: string;
};

export type TimePhase = {
  startDate: string;
  endDate: string;
  title: string;
  astroTriggers: string[];
  externalManifestation: string;
  internalState: string;
  opportunities: string[];
  cautions: string[];
  confidence: number;
  verdict?: string;
};

export type ConfidenceLayer = {
  timing: number;
  manifestation: number;
  volatility: number;
};

export type DashaContext = {
  mahadasha: string;
  antardasha: string;
  pratyantar: string;
  transitAnchors: string[];
};

export interface DeepInsight {
  heroInsight: string;
  dashaContext: DashaContext;
  theme: string;
  realityTranslation: string;
  evidence: AstroEvidence[];
  tensions: StructuralTension[];
  phases: TimePhase[];
  specifics: any; // Can be typed further if needed
  confidence: ConfidenceLayer;
  verdict: string;
  bigPicture?: string;
  verdictMatrix?: {
    favor: string[];
    avoid: string[];
    caution: string[];
  };
  physicalSignals?: string[];
  reassurance?: string;
  domainAnchor?: string;
}

export interface ReportSection {
  insight: string;
  meaning: string;
  guidance: string[];
  weight?: ImpactWeight;
  why?: string; 
  deepIntelligence?: DeepInsight; // High-fidelity reports
}

export interface CompositeStrength {
  positional: "strong" | "neutral" | "weak";
  functional: "strong" | "neutral" | "weak";
  activation: "high" | "medium" | "low";
}

export interface AstroSignal {
  planet: string;
  strength: "strong" | "neutral" | "weak" | CompositeStrength;
  strengthScore?: number;
  nature: "supportive" | "challenging" | "mixed";
  area: string[];
  reason: string;
  isStrongTransit?: boolean;
}

export interface KundaliReport {
  hero: {
    decisionState: DecisionSignal;
    insight: string;
    timeAnchor: string;
    why: string;
  };
  blueprint: {
    lagna: string;
    rashi: string;
    nakshatra: string;
    dashaAtBirth: string;
  };
  nature: {
    core: ReportSection;
    inner: ReportSection;
  };
  lifeAreas: {
    career: ReportSection;
    finance: ReportSection;
    relationships: ReportSection;
    health: ReportSection;
    mind: ReportSection;
  };
  observations: ReportSection[];
  transits: ReportSection;
  yogas: ReportSection[];
  yearOverview: {
    theme: string;
    phases: string[];
    caution: string[];
  };
}

export interface HumanGuidance {
  oneLineTruth: string;
  emotionalTone: string;
  decisionSignal: DecisionSignal;
  conflictLevel: string;
  confidenceLevel: string;
  confidenceScore: number;
  evolution: string;
  currentSituation: string;
  whatThisMeans: string;
  whatToDo: string[];
  whatToAvoid: string[];
  timingInsight: string;
  timingBreakdown: {
    start: string;
    mid: string;
    end: string;
  };
  timeframe?: Timeframe; 
}

export interface DerivedState {
  emotionalTone: string;
  decisionSignal: DecisionSignal;
  dominantThemes: string[];
  riskLevel: "low" | "medium" | "high";
  conflictLevel: "low" | "medium" | "high";
}

export interface Planet {
  name: string;
  longitude: number;
  speed: number;
  sign: number;
  positionInSign: number;
  degree: number;
  navamsaSign: number;
  strengthLevel: string;
  role: string;
  isRetrograde: boolean;
  isCombust: boolean;
  isVargottama: boolean;
}

export interface NatalChart {
  lagna: {
    longitude: number;
    sign: number;
    positionInSign: number;
    degree: number;
    navamsaSign: number;
  };
  planets: Planet[];
  houses: number[];
}
