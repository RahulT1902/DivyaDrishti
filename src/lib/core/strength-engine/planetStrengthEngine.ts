import {
  DivisionalChart, PlanetName, PlanetStrength, PlanetStrengthComponents, AstrologyEngine,
} from "../types";
import { computeSthanaBala } from "./sthanaBala";
import { computeDigBala } from "./digBala";
import { computeNaisargikaBala } from "./naisargikaBala";
import { computeCombustion, computeRetrograde, computeVargottama } from "./modifiers";
import { STRENGTH_WEIGHTS, MODEL_CONFIDENCE } from "./strengthWeights";

const ALL_PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

const STUB_SCORE = 50; // neutral placeholder for unimplemented components

export class PlanetStrengthEngine implements AstrologyEngine<DivisionalChart, PlanetStrength[]> {
  evaluate(d1Chart: DivisionalChart): PlanetStrength[] {
    return ALL_PLANETS.map(planet => this.computeStrength(planet, d1Chart));
  }

  private computeStrength(planet: PlanetName, d1Chart: DivisionalChart): PlanetStrength {
    const placement = d1Chart.planets.find(p => p.planet === planet);

    // If planet not found (edge case), return neutral
    if (!placement) {
      return neutralStrength(planet);
    }

    // ── Compute each component ──────────────────────────────────────────────

    const sthana       = computeSthanaBala(planet, placement.sign);
    const dig          = computeDigBala(planet, placement.house);
    const naisargika   = computeNaisargikaBala(planet);
    const combustion   = computeCombustion(planet, placement.isCombust);
    const retrograde   = computeRetrograde(planet, placement.isRetrograde);
    const vargottama   = computeVargottama(planet, placement.isVargottama);

    const components: PlanetStrengthComponents = {
      sthanaBala:     sthana.score,
      digBala:        dig.score,
      naisargikaBala: naisargika.score,
      combustion:     combustion.score,
      retrograde:     retrograde.score,
      vargottama:     vargottama.score,
      // Stubs — return neutral until implemented in Phase 3B
      kalaBala:       STUB_SCORE,
      cheshtaBala:    STUB_SCORE,
      drikBala:       STUB_SCORE,
      avastha:        STUB_SCORE,
    };

    // ── Weighted overall strength ───────────────────────────────────────────

    const W = STRENGTH_WEIGHTS;
    let weightedSum = 0;
    let implementedWeight = 0;

    const componentScores = components as unknown as Record<string, number>;
    for (const [key, cfg] of Object.entries(W)) {
      if (cfg.implemented) {
        weightedSum += componentScores[key] * cfg.weight;
        implementedWeight += cfg.weight;
      }
    }

    const overallStrength = implementedWeight > 0
      ? Math.round(weightedSum / implementedWeight)
      : 50;

    // ── Collect all evidence ────────────────────────────────────────────────

    const evidence = [
      sthana.evidence,
      dig.evidence,
      naisargika.evidence,
      combustion.evidence,
      retrograde.evidence,
      vargottama.evidence,
    ];

    return {
      planet,
      overallStrength,
      confidence: MODEL_CONFIDENCE,
      components,
      evidence,
    };
  }
}

function neutralStrength(planet: PlanetName): PlanetStrength {
  const stub = STUB_SCORE;
  return {
    planet,
    overallStrength: stub,
    confidence:      MODEL_CONFIDENCE,
    components: {
      sthanaBala: stub, digBala: stub, naisargikaBala: stub,
      combustion: stub, retrograde: stub, vargottama: stub,
      kalaBala: stub, cheshtaBala: stub, drikBala: stub, avastha: stub,
    },
    evidence: [],
  };
}
