// Pundit Brain — Shared Types
// All 10 layers read/write from the PunditBrainContext.
// The brain orchestrator assembles it layer by layer, then converts
// the fully-populated context into the LLM system prompt.

// ── Layer 1: Intent ───────────────────────────────────────────────────────────

export type EmotionalTone =
  | "worried" | "anxious" | "low" | "frustrated"
  | "curious" | "neutral" | "hopeful" | "excited";

export type Urgency = "low" | "medium" | "high";

export interface IntentAnalysis {
  stated:      string;          // verbatim question
  subIntents:  string[];        // 3–5 inferred real questions
  emotionalTone: EmotionalTone;
  urgency:     Urgency;
  domain:      string;          // primary domain detected
  type:        string;          // Forecast | Timing | Decision | Advice | Probability | Explanation | FollowUp
  timeframe:   string | null;   // "today" | "this week" | "this month" | null
  entities:    string[];        // "management" | "promotion" | "investment"
  isFollowUp:  boolean;
}

// ── Layer 2: User State ───────────────────────────────────────────────────────

export type ConversationDepth = "new" | "ongoing" | "deep";

export interface LifePhases {
  career:       string;   // "Building Phase" | "Recognition Pending" | "Transition" | "Peak"
  health:       string;   // "Healthy" | "Recovery" | "Concern" | "Improving"
  finance:      string;   // "Stable" | "Accumulating" | "Pressure" | "Growth"
  relationship: string;   // "Stable" | "Distance" | "Healing" | "Commitment"
}

export interface UserState {
  dashaPhase:         string;            // "Saturn/Jupiter — building, slow, structuring"
  dashaAlignment:     "supportive" | "neutral" | "challenging";
  lifePhases:         LifePhases;
  mentalState:        string;            // "Anxious about timing" | "Cautiously optimistic"
  currentConcerns:    string[];          // extracted from history
  recentTopics:       string[];          // domains/topics touched in last 20 messages
  conversationDepth:  ConversationDepth;
}

// ── Layer 3: Life Story ───────────────────────────────────────────────────────

export interface StoryEvent {
  event:            string;   // "Promotion discussion started"
  approximate_date: string;   // "last week" | "yesterday" | "3 months ago" | "recently"
}

export interface DomainStoryArc {
  domain:       string;
  currentStage: string;         // "Recognition Pending"
  events:       StoryEvent[];   // chronological events
  storyLine:    string;         // "Discussion started → Manager supportive → Decision pending"
  nextChapter:  string | null;  // predicted next stage
}

// ── Layer 4: Astrological Diagnosis ──────────────────────────────────────────

export type DiagnosisState =
  | "Highly Favorable" | "Favorable" | "Moderate" | "Challenging" | "Difficult";

export interface AstrologicalDiagnosis {
  domain:             string;
  supportingFactors:  string[];   // "Saturn activating 10th house", "Jupiter benefic for lagna"
  challengingFactors: string[];   // "Mars weakening 1st", "Rahu causing confusion"
  dashaAlignment:     "supportive" | "neutral" | "challenging";
  transitAlignment:   "favorable" | "neutral" | "unfavorable";
  overallState:       DiagnosisState;
  overallScore:       number;     // 0–100 from symbolic engine
  probability:        number;     // 0–100 outcome probability for main concern
  timeline:           string | null;  // "within 3 weeks" | "next 2 months" | null
  confidence:         "high" | "medium" | "low";
  keyPlanet:          string | null;
  internalSummary:    string;     // one-line pre-English synthesis
}

// ── Layer 5: Observations ─────────────────────────────────────────────────────

export interface ObservationSet {
  primaryObservation:   string;         // what stands out most
  isOffTopic:           boolean;        // primary observation about a different domain
  crossDomainInsight:   string | null;  // "What actually stands out is your career"
  proactiveNotes:       string[];       // unsolicited but useful insights
}

// ── Layer 6: Reasoning Chain ──────────────────────────────────────────────────

export interface ReasoningChain {
  steps:           string[];  // ordered reasoning steps
  conclusion:      string;    // final conclusion
  keyFactor:       string;    // single most important factor
  uncertainties:   string[];  // what we don't know / risks
  silentQuestions: string[];  // 6 invisible questions, each with an internal answer
}

// ── Layer 7: Personality (Pundit DNA) ────────────────────────────────────────

export type PunditTone =
  | "reassuring" | "cautious" | "warning" | "celebratory" | "empathetic" | "direct";

export interface PunditPersonality {
  tone:            PunditTone;
  openingLine:     string;        // context-appropriate opener
  voiceGuidelines: string[];      // "Hmm..." / "If I were sitting across from you"
  avoidPatterns:   string[];      // things the Pundit never says
}

// ── Layer 8: Response Plan ────────────────────────────────────────────────────

export type ResponseDepth = "quick" | "detailed" | "very_detailed";

export interface SummaryCard {
  title:     string;    // "Health Today" | "Career" | "Finance This Week"
  ratingOf5: number;    // 1–5 (derived from overallScore)
  phase:     string;    // "Recovery Phase" | "Promotion Window" | "Favorable"
  stats:     Array<{ label: string; value: string }>;
}

export interface ResponsePlan {
  depth:         ResponseDepth;
  targetLength:  string;
  directAnswer:  string;        // ONE sentence — the answer to what they asked
  summaryCard:   SummaryCard;   // visual snapshot, always present
  includeSections: {
    timeline:             boolean;
    probability:          boolean;
    practicalAdvice:      boolean;
    planetaryExplanation: boolean;
    spiritualRemedy:      boolean;
    questionBackToUser:   boolean;
    watchingList:         boolean;   // "What I'm watching" bullets
  };
  referenceHistory:    string | null;
  openWithObservation: boolean;
}

// ── Layer 0: Reality Assimilation ────────────────────────────────────────────

export type PredictionStatus =
  | "Validated" | "Delayed" | "Partially Occurred" | "Failed" | "Pending";

export interface LifeEvent {
  domain:       string;
  eventType:    string;    // "Promotion Confirmed" | "Illness Started" | etc.
  description:  string;    // triggering phrase from user message
  timeRef:      "today" | "recently" | "past";
  impliedStage: string | null;
  isOutcome:    boolean;   // true if this resolves a prior prediction
}

export interface PredictionAssessment {
  prediction: string;
  status:     PredictionStatus;
  evidence:   string;   // user message excerpt explaining the status
}

export interface NotebookEntry {
  date:        string;   // ISO date "2026-07-18"
  domain:      string;
  observation: string;   // "Mentioned appraisal delay; seems frustrated"
}

export interface Correction {
  field:      string;   // "prediction" | "timeline" | "outcome"
  oldBelief:  string;   // what the Pundit believed
  newFact:    string;   // what the user corrected it to
}

export interface StoryStageUpdate {
  domain:    string;
  fromStage: string;
  toStage:   string;
}

export interface ClarificationNeeded {
  question: string;   // pre-written question to ask (not LLM-generated)
  reason:   string;   // internal reason, not shown to user
  domain:   string;
}

export interface RealityContext {
  newEvents:             LifeEvent[];
  correction:            Correction | null;
  validatedPredictions:  PredictionAssessment[];
  pendingPredictions:    PredictionAssessment[];
  storyUpdate:           StoryStageUpdate | null;
  notebookEntry:         NotebookEntry | null;
  clarification:         ClarificationNeeded | null;
  realitySummary:        string;
}

// ── Answer Plan (L8 — kept for response-depth decisions, not used in prompt) ──

export interface ProbabilityItem {
  label: string;
  value: number;
}

export interface AnswerPlan {
  directAnswer:          string;
  confidence:            "High" | "Medium" | "Low";
  confidencePercent:     number;
  probabilities:         ProbabilityItem[];
  timeline:              string | null;
  severity:              "Minor" | "Moderate" | "Significant" | "Life-changing" | null;
  affectedArea:          string | null;
  mainObservation:       string;
  unexpectedObservation: string | null;
  recommendation:        string;
}

// ── Domain Interpretation Engine (DIE) output types ──────────────────────────
// These are domain-specific structured diagnoses produced BEFORE the LLM runs.
// The engine concludes; the LLM only speaks.

export interface HealthBrief {
  type:               "health";
  overallStatus:      "Healthy" | "Mild Sensitivity" | "Moderate Concern" | "Significant Concern";
  primarySystem:      string;    // "Respiratory System" | "ENT — Ear, Nose & Throat"
  primarySystemKey:   string;    // internal key for remedy lookup
  bodyParts:          string[];  // ["Throat", "Nasal passages", "Upper airways"]
  symptoms:           string[];  // ["Throat irritation", "Mild cough", "Nasal congestion"]
  strongAreas:        string[];  // ["Digestion", "Cardiovascular", "Immunity"]
  illnessProbability: number;    // 5–75
  severity:           "Minor" | "Moderate" | "Significant" | null;
  seriousRisk:        "Very unlikely" | "Unlikely" | "Possible";
  timeline:           string | null;  // "3–5 days" | "This week"
  energyNote:         string;
  mentalNote:         string | null;  // "Stress is a greater risk than illness today"
}

export interface CareerAspect {
  name:        string;
  direction:   "Strong" | "Building" | "Stable" | "Weak" | "Blocked";
  probability: number;
}

export interface CareerBrief {
  type:               "career";
  primaryAspect:      string;         // "Promotion" | "Recognition" | "Job Change"
  aspects:            CareerAspect[];
  opportunityNote:    string;
  frictionNote:       string | null;
  timing:             string | null;
  overallProbability: number;
}

export interface FinanceArea {
  name:   string;
  status: "Strong" | "Stable" | "Cautious" | "Risky";
}

export interface FinanceBrief {
  type:          "finance";
  areas:         FinanceArea[];
  primaryFlow:   "Growing" | "Stable" | "Under Pressure" | "Volatile";
  primarySource: string;
  opportunity:   string | null;
  risk:          string | null;
}

export interface RelationshipBrief {
  type:           "relationship";
  strongAreas:    string[];
  attentionAreas: string[];
  conflictRisk:   "Low" | "Mild" | "Moderate" | "High";
  primaryDynamic: string;
}

export type DomainBrief = HealthBrief | CareerBrief | FinanceBrief | RelationshipBrief;

export interface ConsultationBrief {
  domain:                string;
  overallVerdict:        string;
  mainConclusion:        string;    // THE direct answer in one sentence
  unexpectedObservation: string | null;
  recommendation:        string;
  remedies:              string[];  // 1–2 specific astrological remedies, pre-computed by DIE
  domainBrief:           DomainBrief;
}

// ── Full Brain Context ────────────────────────────────────────────────────────

export interface PunditBrainContext {
  realityContext:    RealityContext;    // Layer 0 — must run first
  intent:            IntentAnalysis;
  userState:         UserState;
  lifeStory:         DomainStoryArc | null;
  diagnosis:         AstrologicalDiagnosis;
  observations:      ObservationSet;
  reasoning:         ReasoningChain;
  personality:       PunditPersonality;
  responsePlan:      ResponsePlan;
  answerPlan:        AnswerPlan;        // L8 depth/section decisions
  consultationBrief: ConsultationBrief; // DIE — what the LLM actually narrates
}

// ── Brain Output ──────────────────────────────────────────────────────────────

export interface PunditBrainOutput {
  systemPrompt:        string;
  userPrompt:          string;
  temperature:         number;
  lifeStory:           DomainStoryArc | null;
  clarification:       ClarificationNeeded | null;
  renderedSummaryCard: string;   // pre-rendered markdown — prepended in route.ts
  metadata: {
    domain:     string;
    tone:       PunditTone;
    depth:      ResponseDepth;
    subIntents: string[];
  };
}
