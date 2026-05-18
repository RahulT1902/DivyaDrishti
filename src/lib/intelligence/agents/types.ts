import { AstroSignal, DecisionSignal, TimePhase } from "../types";
import { DomainSignal } from "../domain/types";

export interface AgentSignal extends DomainSignal {
  agentName: string;
  confidence: number;
}

export interface AgentResult<T> {
  data: T;
  signals: AgentSignal[];
  confidence: number;
  reasoning: string[];
}

export interface TransitAgentOutput {
  activeTriggers: AstroSignal[];
  intensity: number;
  manifestations: {
    external: string[];
    internal: string[];
  };
  confidence?: number;
}

export interface DashaAgentOutput {
  currentNarrative: string;
  primaryArchetype: string;
  longTermThemes: string[];
  timingAnchors: TimePhase[];
  confidence?: number;
}

export interface RealityValidationResult {
  isGrounded: boolean;
  warnings: string[];
  filteredInsight: string;
  suggestedTone: string;
}
