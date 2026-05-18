import { AstroSignal, DecisionSignal, DerivedState, Intent, Timeframe } from "./types";

/**
 * Layer 2: Meaning Mapper
 * Converts ASTRO TRUTH (Signals) into HUMAN MEANING (State).
 */

export function mapAstroToMeaning(
  signals: AstroSignal[],
  intent: Intent,
  timeframe: Timeframe,
  lastDecisionSignal?: DecisionSignal
): DerivedState & { confidenceLevel: "low" | "moderate" | "high"; confidenceScore: number; evolution?: { from: DecisionSignal; to: DecisionSignal } } {
  
  // 1. Filter signals relevant to the current intent
  const relevantSignals = signals.filter(s => 
    s.area.includes(intent.domain) || s.area.includes("general") || s.area.includes("focus")
  );

  // 2. Deterministic Confidence Score (Adaptive Weighting)
  const hasStrongTransit = relevantSignals.some(s => s.isStrongTransit);
  const weights = hasStrongTransit 
    ? { alignment: 0.4, planet: 0.3, transit: 0.3 }
    : { alignment: 0.5, planet: 0.3, transit: 0.2 };

  // Calculate Alignment Score
  const supportCount = relevantSignals.filter(s => s.nature === "supportive").length;
  const challengeCount = relevantSignals.filter(s => s.nature === "challenging").length;
  const totalRelevant = relevantSignals.length;
  const alignmentScore = totalRelevant === 0 ? 50 : 
    (Math.abs(supportCount - challengeCount) / totalRelevant) * 100;

  // Calculate Average Planet Strength
  const avgPlanetStrength = relevantSignals.reduce((acc, s) => acc + (s.strengthScore || 50), 0) / (totalRelevant || 1);

  // Calculate Transit Clarity
  const transitClarity = relevantSignals.filter(s => s.isStrongTransit).length > 0 ? 90 : 40;

  const confidenceScore = (alignmentScore * weights.alignment) + 
                          (avgPlanetStrength * weights.planet) + 
                          (transitClarity * weights.transit);

  let confidenceLevel: "low" | "moderate" | "high" = "moderate";
  if (confidenceScore >= 70) confidenceLevel = "high";
  else if (confidenceScore < 40) confidenceLevel = "low";

  // 3. Determine Decision Signal
  let decisionSignal: DecisionSignal = "WAIT";
  if (supportCount > challengeCount + 1 && confidenceScore > 40) {
    decisionSignal = "ACT";
  } else if (challengeCount > supportCount && confidenceScore > 40) {
    decisionSignal = "AVOID";
  }

  // 4. Evolution Logic
  let evolution;
  if (lastDecisionSignal && lastDecisionSignal !== decisionSignal) {
    evolution = { from: lastDecisionSignal, to: decisionSignal };
  }

  return {
    emotionalTone: determineEmotionalTone(relevantSignals),
    decisionSignal,
    dominantThemes: extractThemes(relevantSignals),
    riskLevel: decisionSignal === "AVOID" ? "high" : decisionSignal === "ACT" ? "low" : "medium",
    conflictLevel: (supportCount > 0 && challengeCount > 0) ? "high" : "low",
    confidenceLevel,
    confidenceScore,
    evolution
  };
}

function determineEmotionalTone(signals: AstroSignal[]): string {
  const tones: string[] = [];
  
  if (signals.some(s => s.planet === "Saturn" && s.nature === "challenging")) tones.push("Heavy", "Disciplined");
  if (signals.some(s => s.planet === "Jupiter" && s.nature === "supportive")) tones.push("Expanding", "Hopeful");
  if (signals.some(s => s.planet === "Mars" && s.nature === "challenging")) tones.push("Restless", "Intense");
  if (signals.some(s => (s.planet === "Venus" || s.planet === "Moon") && s.nature === "supportive")) tones.push("Emotional", "Harmonious");
  if (signals.some(s => s.planet === "Mercury" && s.strength === "weak")) tones.push("Confused", "Analytical-Pressure");

  if (tones.length === 0) return "Stable / Neutral";
  return tones.slice(0, 2).join(" / ");
}

function extractThemes(signals: AstroSignal[]): string[] {
  const themes = new Set<string>();
  signals.forEach(s => {
    if (s.nature === "supportive") themes.add("Growth Opportunity");
    if (s.nature === "challenging") themes.add("Structural Review");
    if (s.planet === "Saturn") themes.add("Hard Work Required");
    if (s.planet === "Jupiter") themes.add("Abundance & Luck");
    if (s.planet === "Mars") themes.add("Vitality & Action");
    if (s.planet === "Mercury") themes.add("Logistics & Communication");
  });
  return Array.from(themes);
}
