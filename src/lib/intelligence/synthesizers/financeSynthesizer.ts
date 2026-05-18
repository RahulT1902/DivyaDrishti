import { NatalChart, DashaContext } from "../types";
import { TransitIntelligence } from "../transit/types";
import { DomainIntelligence, DomainSignal } from "../domain/types";
import { resolveTensions } from "../resolvers/tensionResolver";
import { getLordOfDomain } from "../../astrology/houseLords";
import { calculateNormalizedScore, calculatePressureLevel, calculateOpportunityLevel } from "../../scoring/signalWeights";
import { AgentSignal } from "../agents/types";

export function synthesizeFinance(
  natal: NatalChart,
  dasha: DashaContext,
  transits: TransitIntelligence[]
): DomainIntelligence {
  const agentSignals: AgentSignal[] = [];

  // Guard: natal lagna required for house lord logic
  if (!natal?.lagna?.sign) {
    return buildFinanceFallback(dasha);
  }

  // 1. Natal Foundation
  const financeLords = getLordOfDomain("finance", natal.lagna.sign);
  financeLords.forEach(lordName => {
    const pData = natal.planets.find(p => p.name === lordName);
    if (pData) {
      agentSignals.push({
        agentName: "NatalAgent",
        factor: `Wealth Lord (${lordName})`,
        source: "natal",
        impact: pData.strengthLevel === "Dominant" ? "supportive" : (pData.strengthLevel === "Weak" ? "restrictive" : "mixed"),
        weight: 7,
        confidence: 0.9,
        reason: `Your 2nd/11th lord is ${pData.strengthLevel}, indicating your natural capacity for asset accumulation.`
      });
    }
  });

  const jupiter = natal.planets.find(p => p.name === "Jupiter");
  if (jupiter) {
    agentSignals.push({
      agentName: "NatalAgent",
      factor: "Expansion (Jupiter)",
      source: "natal",
      impact: jupiter.strengthLevel === "Dominant" ? "supportive" : "mixed",
      weight: 6,
      confidence: 0.9,
      reason: `Foundational wealth and expansion score: ${jupiter.strengthLevel}`
    });
  }

  // 2. Timing (Dasha)
  const isSupportiveDasha = ["Venus", "Jupiter", "Mercury"].includes(dasha.mahadasha);
  agentSignals.push({
    agentName: "DashaAgent",
    factor: `Dasha: ${dasha.mahadasha}`,
    source: "dasha",
    impact: isSupportiveDasha ? "supportive" : "mixed",
    weight: 10,
    confidence: 0.95,
    reason: `Dominant life chapter influencing asset liquidity and long-term worth.`
  });

  // 3. Environmental Triggers (Transits)
  const financeTransits = transits.filter(t => t.affectedDomains.finance > 5);
  for (const t of financeTransits) {
    const isVolatile = t.intensity.volatility > 7;
    agentSignals.push({
      agentName: "TransitAgent",
      factor: `Transit ${t.planet}`,
      source: "transit",
      impact: isVolatile ? "mixed" : (t.intensity.opportunity > 6 ? "supportive" : "restrictive"),
      weight: t.tier === 1 ? 8 : 4,
      confidence: 0.82,
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

  // Liquidity vs Growth Distinction
  const liquidityScore = (financeLords.includes("Venus") || financeLords.includes("Mercury") ? 7 : 4) + (dasha.mahadasha === "Venus" ? 3 : 0);
  const growthScore = (financeLords.includes("Jupiter") || financeLords.includes("Saturn") ? 7 : 4) + (dasha.mahadasha === "Jupiter" ? 3 : 0);

  // Manifestations
  const extManifestations = new Set<string>();
  const intManifestations = new Set<string>();
  financeTransits.forEach(t => {
    t.manifestations.external.forEach(m => extManifestations.add(m));
    t.manifestations.internal.forEach(m => intManifestations.add(m));
  });

  return {
    domain: "finance",
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
      accelerating: dasha.mahadasha === "Mercury" || dasha.mahadasha === "Jupiter",
      unstable: pressure > 7 || (financeTransits.some(t => t.intensity.volatility > 8))
    },
    recommendations: [
      liquidityScore > growthScore ? "Prioritize short-term liquidity and cash flow." : "Focus on long-term wealth accumulation and asset growth.",
      pressure > 6 ? "Avoid speculative risks; focus on debt reduction and conservation." : "A favorable period for strategic investments."
    ],
    confidence: 0.82
  };
}

function buildFinanceFallback(dasha: DashaContext): DomainIntelligence {
  return {
    domain: "finance",
    dominantTheme: "Stable Consolidation",
    supportingFactors: [`Dasha: ${dasha?.mahadasha || "Saturn"}`],
    restrictiveFactors: [],
    synthesis: "Financial conditions are in a consolidation phase. Building long-term stability tends to outperform speculative plays in this environment.",
    pressureLevel: 3,
    opportunityLevel: 5,
    stabilityLevel: 7,
    manifestations: {
      external: ["Steady cash flow", "Reduced financial volatility"],
      internal: ["Conservative mindset", "Long-term asset focus"]
    },
    timelineState: { improving: false, accelerating: false, unstable: false },
    recommendations: [
      "Focus on liquidity management and debt reduction.",
      "Avoid speculative investments during consolidation phases."
    ],
    confidence: 0.5
  };
}
