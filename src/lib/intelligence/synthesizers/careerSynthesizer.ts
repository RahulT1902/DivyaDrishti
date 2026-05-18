import { NatalChart, DashaContext } from "../types";
import { TransitIntelligence } from "../transit/types";
import { DomainIntelligence, DomainSignal } from "../domain/types";
import { resolveTensions } from "../resolvers/tensionResolver";
import { getLordOfDomain } from "../../astrology/houseLords";
import { calculateNormalizedScore, calculatePressureLevel, calculateOpportunityLevel } from "../../scoring/signalWeights";
import { AgentSignal } from "../agents/types";

export function synthesizeCareer(
  natal: NatalChart,
  dasha: DashaContext,
  transits: TransitIntelligence[]
): DomainIntelligence {
  const agentSignals: AgentSignal[] = [];

  // Guard: natal lagna required for house lord logic
  if (!natal?.lagna?.sign) {
    return buildCareerFallback(dasha);
  }

  // 1. Natal Foundation (The "Promise")
  const careerLords = getLordOfDomain("career", natal.lagna.sign);
  careerLords.forEach(lordName => {
    const pData = natal.planets.find(p => p.name === lordName);
    if (pData) {
      agentSignals.push({
        agentName: "NatalAgent",
        factor: `Career Lord (${lordName})`,
        source: "natal",
        impact: pData.strengthLevel === "Dominant" ? "supportive" : (pData.strengthLevel === "Weak" ? "restrictive" : "mixed"),
        weight: 6,
        confidence: 0.9,
        reason: `Your 10th/11th lord is ${pData.strengthLevel}, setting the baseline for professional capacity.`
      });
    }
  });

  const sun = natal.planets.find(p => p.name === "Sun");
  if (sun) {
    agentSignals.push({
      agentName: "NatalAgent",
      factor: "Visibility (Sun)",
      source: "natal",
      impact: sun.strengthLevel === "Dominant" ? "supportive" : "mixed",
      weight: 5,
      confidence: 0.9,
      reason: `Foundational visibility and authority score: ${sun.strengthLevel}`
    });
  }

  // 2. Timing (Dasha)
  const isSupportiveDasha = ["Sun", "Mars", "Jupiter"].includes(dasha.mahadasha);
  agentSignals.push({
    agentName: "DashaAgent",
    factor: `Dasha: ${dasha.mahadasha}`,
    source: "dasha",
    impact: isSupportiveDasha ? "supportive" : "mixed",
    weight: 10,
    confidence: 0.95,
    reason: `Dominant life chapter favoring ${dasha.mahadasha} energy for career growth.`
  });

  // 3. Environmental Triggers (Transits)
  const careerTransits = transits.filter(t => t.affectedDomains.career > 5);
  for (const t of careerTransits) {
    agentSignals.push({
      agentName: "TransitAgent",
      factor: `Transit ${t.planet}`,
      source: "transit",
      impact: t.intensity.pressure > 7 ? "restrictive" : "supportive",
      weight: t.tier === 1 ? 8 : 4,
      confidence: 0.85,
      reason: t.nature
    });
  }

  // Synthesis Logic
  const score = calculateNormalizedScore(agentSignals);
  const pressure = calculatePressureLevel(agentSignals);
  const opportunity = calculateOpportunityLevel(agentSignals);
  
  const supportive = agentSignals.filter(s => s.impact === "supportive");
  const restrictive = agentSignals.filter(s => s.impact === "restrictive");
  
  const resolution = resolveTensions(supportive, restrictive);

  // Visibility vs Income Distinction
  const visibilityScore = (sun?.strengthLevel === "Dominant" ? 7 : 4) + (dasha.mahadasha === "Sun" ? 3 : 0);
  const incomeScore = (careerLords.includes("Jupiter") || careerLords.includes("Venus") ? 7 : 4) + (dasha.mahadasha === "Jupiter" ? 3 : 0);

  // Manifestations
  const extManifestations = new Set<string>();
  const intManifestations = new Set<string>();
  careerTransits.forEach(t => {
    t.manifestations.external.forEach(m => extManifestations.add(m));
    t.manifestations.internal.forEach(m => intManifestations.add(m));
  });

  return {
    domain: "career",
    dominantTheme: resolution.netState,
    supportingFactors: supportive.map(s => s.factor),
    restrictiveFactors: restrictive.map(s => s.factor),
    synthesis: resolution.synthesis,
    pressureLevel: pressure,
    opportunityLevel: opportunity,
    stabilityLevel: Math.max(1, 10 - Math.abs(opportunity - pressure)),
    manifestations: {
      external: Array.from(extManifestations).slice(0, 4),
      internal: Array.from(intManifestations).slice(0, 4)
    },
    timelineState: {
      improving: opportunity > pressure,
      accelerating: dasha.mahadasha === "Mars" || dasha.mahadasha === "Rahu",
      unstable: pressure > 7 && opportunity < 4
    },
    recommendations: [
      visibilityScore > incomeScore ? "Focus on personal branding and visibility." : "Focus on optimizing revenue streams and asset protection.",
      pressure > 7 ? "Adopt a defensive stance; prioritize stability over expansion." : "Favorable window for calculated professional pivots."
    ],
    confidence: 0.85
  };
}

function buildCareerFallback(dasha: DashaContext): DomainIntelligence {
  return {
    domain: "career",
    dominantTheme: "Structured Progress",
    supportingFactors: [`Dasha: ${dasha?.mahadasha || "Saturn"}`],
    restrictiveFactors: [],
    synthesis: "Career conditions appear moderately stable. Disciplined, structured execution tends to outperform reactive pivots in this phase.",
    pressureLevel: 4,
    opportunityLevel: 6,
    stabilityLevel: 7,
    manifestations: {
      external: ["Gradual career progress", "Increased structural responsibilities"],
      internal: ["Growing need for focus", "Long-term orientation"]
    },
    timelineState: { improving: true, accelerating: false, unstable: false },
    recommendations: [
      "Prioritize systematic execution over rapid expansion.",
      "Build long-term professional foundations."
    ],
    confidence: 0.5
  };
}
