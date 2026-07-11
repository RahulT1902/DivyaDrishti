import { AstrologyContext } from "../types";

// ── Domain taxonomy ────────────────────────────────────────────────────────────

export type Domain =
  | "Career" | "Finance" | "Marriage"
  | "Health" | "Education" | "Spirituality";

// ── DomainSignal — synthesized score per career/finance/health sub-dimension ─
// The Signal Engine maps Hypotheses + InferenceConclusions → a single 0–100 score.
// Domain Engines reason over signals, not over raw planets or yoga lists.

export interface DomainSignal {
  id:                    string;
  label:                 string;
  score:                 number;       // 0–100, synthesized from hypotheses + inferences
  confidence:            number;       // 0–100, reliability of score
  sourceHypothesisIds:   string[];
  sourceReasonCodes:     string[];
}

// ── Recommendation — star-rated suggested action ───────────────────────────────
// Four priorities map to five star levels for display:
//   Critical → 5 ★   High → 4 ★   Medium → 3 ★   Low → 2 ★

export type Priority = "Critical" | "High" | "Medium" | "Low";

export interface Recommendation {
  action:          string;
  priority:        Priority;
  stars:           1 | 2 | 3 | 4 | 5;
  rationale:       string;
  timing?:         string;
  sourceSignalIds: string[];
}

// ── Prompt context — what the narrator receives ───────────────────────────────

export interface PromptContext {
  domain:            Domain;
  systemInstruction: string;
  userMessage:       string;
}

// ── DomainEngine contract — implemented once per domain ───────────────────────
// Every domain (Career, Finance, Marriage …) implements exactly this interface.
// The LLM narrator calls buildPrompt() after evaluate() — it never touches the
// underlying symbolic engines directly.

export interface DomainEngine<TAssessment> {
  readonly domain: Domain;
  evaluate(context: AstrologyContext): TAssessment;
  buildPrompt(assessment: TAssessment, userQuery?: string): PromptContext;
}

// ── Domain Knowledge Pack — declarative signal configuration ──────────────────
// All mappings from symbolic concepts → domain signals live here, not in code.
// Adding a new domain = add a KnowledgePack, implement DomainEngine<T>.

export interface SignalMapping {
  id:               string;
  label:            string;
  description:      string;
  hypothesisIds:    string[];   // Hypotheses that feed this signal
  reasonCodes:      string[];   // InferenceConclusion.reasonCodes that feed this signal
  hypothesisWeight: number;     // 0–1, how much hypothesis confidence contributes
  inferenceWeight:  number;     // 0–1, how much inference confidence contributes
}

// Condition that triggers a recommendation template
export type RecommendationCondition =
  | "high"           // signal score >= 65
  | "very-high"      // signal score >= 80
  | "low"            // signal score < 40
  | "active-timing"  // timing window is active + dasha-supported
  | "blocked";       // blocking factors outweigh supporting

export interface RecommendationTemplate {
  id:               string;
  action:           string;
  triggerSignalId:  string;
  condition:        RecommendationCondition;
  priority:         Priority;
  rationale:        string;
}

export interface DomainKnowledgePack {
  domain:          Domain;
  signals:         SignalMapping[];
  recommendations: RecommendationTemplate[];
}
