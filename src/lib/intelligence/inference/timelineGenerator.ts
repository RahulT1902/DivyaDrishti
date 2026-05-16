import { AstroEvidence, TimePhase, IntentDomain } from "../types";

export function generatePhases(evidence: AstroEvidence[], domain: IntentDomain): TimePhase[] {
  // A simple generator that creates a "Current Phase" based on evidence
  
  const triggers = evidence.map(e => e.factor);
  const isRestrictive = evidence.some(e => e.impact === "restrictive");
  
  const phase: TimePhase = {
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Roughly 1 month
    title: isRestrictive ? "Phase of Consolidation" : "Phase of Expansion",
    astroTriggers: triggers,
    externalManifestation: isRestrictive 
      ? "Slower movement in external matters and increased responsibility." 
      : "New opportunities and smoother external circumstances.",
    internalState: isRestrictive
      ? "A need for patience and structural discipline."
      : "Increased optimism and forward momentum.",
    opportunities: isRestrictive 
      ? ["Building strong foundations", "Reviewing past work", "Strengthening current position"] 
      : ["Taking new initiatives", "Expanding network", "Capitalizing on momentum"],
    cautions: isRestrictive
      ? ["Avoid impulsive decisions", "Do not force outcomes"]
      : ["Avoid over-committing", "Stay grounded in reality"],
    confidence: isRestrictive ? 7 : 8
  };

  return [phase];
}
