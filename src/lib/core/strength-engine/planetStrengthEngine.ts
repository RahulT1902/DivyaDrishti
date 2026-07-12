import {
  DivisionalChart, PlanetName, PlanetStrength, PlanetStrengthComponents, AstrologyEngine,
} from "../types";
import { computeSthanaBala } from "./sthanaBala";
import { computeDigBala } from "./digBala";
import { computeNaisargikaBala } from "./naisargikaBala";
import { computeCombustion, computeRetrograde, computeVargottama } from "./modifiers";
import { computeAvastha } from "./avastha";
import { computeCheshtaBala } from "./cheshtaBala";
import { computeDrikBala } from "./drikBala";
import { computeKalaBala } from "./kalaBala";
import { STRENGTH_WEIGHTS, MODEL_CONFIDENCE } from "./strengthWeights";

const ALL_PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

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
    const avastha      = computeAvastha(planet, placement.degreeInSign ?? 15);
    const cheshta      = computeCheshtaBala(planet, placement.isRetrograde, placement.isCombust);
    const drik         = computeDrikBala(planet, d1Chart);
    const kala         = computeKalaBala(planet, d1Chart);

    const components: PlanetStrengthComponents = {
      sthanaBala:     sthana.score,
      digBala:        dig.score,
      naisargikaBala: naisargika.score,
      combustion:     combustion.score,
      retrograde:     retrograde.score,
      vargottama:     vargottama.score,
      kalaBala:       kala.score,
      cheshtaBala:    cheshta.score,
      drikBala:       drik.score,
      avastha:        avastha.score,
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
      avastha.evidence,
      cheshta.evidence,
      drik.evidence,
      kala.evidence,
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
  const neutral = 50;
  return {
    planet,
    overallStrength: neutral,
    confidence:      MODEL_CONFIDENCE,
    components: {
      sthanaBala: neutral, digBala: neutral, naisargikaBala: neutral,
      combustion: neutral, retrograde: neutral, vargottama: neutral,
      kalaBala: neutral, cheshtaBala: neutral, drikBala: neutral, avastha: neutral,
    },
    evidence: [],
  };
}
