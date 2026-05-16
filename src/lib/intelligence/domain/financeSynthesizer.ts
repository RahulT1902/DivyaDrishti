import { NatalChart, DashaContext } from "../types";
import { TransitIntelligence } from "../transit/types";
import { DomainIntelligence, DomainSignal } from "./types";
import { resolveTensions } from "./tensionResolver";

export function synthesizeFinance(
  natal: NatalChart,
  dasha: DashaContext,
  transits: TransitIntelligence[]
): DomainIntelligence {
  const signals: DomainSignal[] = [];

  // 1. Natal Signals
  const jupiter = natal.planets.find(p => p.name === "Jupiter");
  const venus = natal.planets.find(p => p.name === "Venus");
  
  if (jupiter) {
    signals.push({
      factor: "Natal Jupiter",
      source: "natal",
      impact: jupiter.strengthLevel === "Dominant" ? "supportive" : "mixed",
      weight: 6,
      reason: `Foundational wealth and expansion score: ${jupiter.strengthLevel}`
    });
  }
  
  if (venus) {
    signals.push({
      factor: "Natal Venus",
      source: "natal",
      impact: venus.strengthLevel === "Weak" ? "restrictive" : "supportive",
      weight: 5,
      reason: `Flow of assets and luxury capacity: ${venus.strengthLevel}`
    });
  }

  // 2. Dasha Signals
  signals.push({
    factor: `Dasha: ${dasha.mahadasha}`,
    source: "dasha",
    impact: ["Venus", "Jupiter", "Mercury"].includes(dasha.mahadasha) ? "supportive" : "mixed",
    weight: 8,
    reason: `Dominant life chapter influencing asset liquidity.`
  });

  // 3. Transit Signals
  const financeTransits = transits.filter(t => t.affectedDomains.finance > 5);
  for (const t of financeTransits) {
    signals.push({
      factor: `Transit ${t.planet}`,
      source: "transit",
      impact: t.intensity.volatility > 7 ? "mixed" : (t.intensity.opportunity > 6 ? "supportive" : "restrictive"),
      weight: t.tier === 1 ? 7 : 4,
      reason: t.nature
    });
  }

  // Synthesis
  const supportive = signals.filter(s => s.impact === "supportive");
  const restrictive = signals.filter(s => s.impact === "restrictive");
  
  const resolution = resolveTensions(supportive, restrictive);

  // Extract manifestations
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
    pressureLevel: resolution.pressure,
    opportunityLevel: resolution.opportunity,
    stabilityLevel: resolution.stability,
    manifestations: {
      external: Array.from(extManifestations).slice(0, 4),
      internal: Array.from(intManifestations).slice(0, 4)
    },
    timelineState: {
      improving: resolution.opportunity > resolution.pressure,
      accelerating: dasha.mahadasha === "Mercury" || dasha.mahadasha === "Jupiter",
      unstable: resolution.stability < 4
    },
    recommendations: [
      resolution.stability < 5 ? "Avoid speculative risks during this cycle." : "Good time for long-term investments.",
      "Review asset allocation against current volatility."
    ],
    confidence: 0.82
  };
}
