import { NatalChart, DashaContext } from "../types";
import { TransitIntelligence } from "../transit/types";
import { DomainIntelligence, DomainSignal } from "./types";
import { resolveTensions } from "./tensionResolver";

export function synthesizeCareer(
  natal: NatalChart,
  dasha: DashaContext,
  transits: TransitIntelligence[]
): DomainIntelligence {
  const signals: DomainSignal[] = [];

  // 1. Natal Signals (Foundation)
  const sun = natal.planets.find(p => p.name === "Sun");
  const saturn = natal.planets.find(p => p.name === "Saturn");
  
  if (sun) {
    signals.push({
      factor: "Natal Sun",
      source: "natal",
      impact: sun.strengthLevel === "Dominant" ? "supportive" : "mixed",
      weight: 5,
      reason: `Foundational visibility and authority score: ${sun.strengthLevel}`
    });
  }
  
  if (saturn) {
    signals.push({
      factor: "Natal Saturn",
      source: "natal",
      impact: saturn.strengthLevel === "Weak" ? "restrictive" : "supportive",
      weight: 5,
      reason: `Long-term discipline and structure capacity: ${saturn.strengthLevel}`
    });
  }

  // 2. Dasha Signals (Timing)
  // Simple mapping for now - in a real engine this would be much deeper
  signals.push({
    factor: `Dasha: ${dasha.mahadasha}`,
    source: "dasha",
    impact: ["Sun", "Mars", "Jupiter"].includes(dasha.mahadasha) ? "supportive" : "mixed",
    weight: 8,
    reason: `Dominant life chapter favoring ${dasha.mahadasha} energy.`
  });

  // 3. Transit Signals (Environment)
  const careerTransits = transits.filter(t => t.affectedDomains.career > 5);
  for (const t of careerTransits) {
    signals.push({
      factor: `Transit ${t.planet}`,
      source: "transit",
      impact: t.intensity.pressure > 7 ? "restrictive" : "supportive",
      weight: t.tier === 1 ? 7 : 4,
      reason: t.nature
    });
  }

  // Synthesis
  const supportive = signals.filter(s => s.impact === "supportive");
  const restrictive = signals.filter(s => s.impact === "restrictive");
  
  const resolution = resolveTensions(supportive, restrictive);

  // Extract manifestations from transits
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
    pressureLevel: resolution.pressure,
    opportunityLevel: resolution.opportunity,
    stabilityLevel: resolution.stability,
    manifestations: {
      external: Array.from(extManifestations).slice(0, 4),
      internal: Array.from(intManifestations).slice(0, 4)
    },
    timelineState: {
      improving: resolution.opportunity > resolution.pressure,
      accelerating: dasha.mahadasha === "Mars" || dasha.mahadasha === "Rahu",
      unstable: resolution.stability < 4
    },
    recommendations: [
      resolution.pressure > 7 ? "Focus on meticulous documentation." : "This is a time for calculated expansion.",
      "Engage with mentors to navigate visibility shifts."
    ],
    confidence: 0.85
  };
}
