import { getPlanetDignityScore } from "./dignity";
import { getDigBalaScore } from "./digbala";
import { getHouseTypeScore } from "./houseScore";

interface PlanetData {
  name: string;
  longitude: number;
  sign: number;
  house: number;
}

export interface ScoringResult {
  planets: Record<string, number>;
  domains: {
    career: number;
    finance: number;
    health: number;
    relationships: number;
    self: number;
  };
}

export function calculateScores(lagnaSign: number, planets: PlanetData[]): ScoringResult {
  const planetStrengths: Record<string, number> = {};

  // 1. Calculate Individual Planet Strengths (Deterministic Engine)
  planets.forEach((p) => {
    const dignity = getPlanetDignityScore(p.name, p.sign);
    const digBala = getDigBalaScore(p.name, p.house);
    const houseType = getHouseTypeScore(p.house);

    // PlanetStrength = (Dignity × 0.4) + (Directional × 0.3) + (House × 0.3)
    const rawStrength = (dignity * 0.4) + (digBala * 0.3) + (houseType * 0.3);
    planetStrengths[p.name] = Math.min(100, Math.max(0, Math.round(rawStrength)));
  });

  // 2. Domain Domain Model Calculations
  const getContribution = (planetName: string, boost: number = 0) => {
    const base = planetStrengths[planetName] || 50;
    return Math.min(100, base * (1 + boost));
  };

  const getAvgHouseScore = (houses: number[]) => {
    const scores = houses.map(getHouseTypeScore);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  // DomainScore = (HouseScore × 0.5) + (PlanetContribution × 0.5)
  // Weighted Planet Boost (Max 20%)
  
  const career = (getAvgHouseScore([10, 6]) * 0.5) + 
                 ((getContribution("Sun", 0.15) + getContribution("Saturn", 0.1) + getContribution("Mercury", 0.05)) / 3 * 0.5);

  const finance = (getAvgHouseScore([2, 11]) * 0.5) + 
                  ((getContribution("Jupiter", 0.2) + getContribution("Venus", 0.1)) / 2 * 0.5);

  const health = (getAvgHouseScore([1, 6, 8]) * 0.5) + 
                 ((getContribution("Moon", 0.1) + getContribution("Mars", 0.1)) / 2 * 0.5);

  const relationships = (getHouseTypeScore(7) * 0.5) + 
                        ((getContribution("Venus", 0.15) + getContribution("Moon", 0.05)) / 2 * 0.5);

  const self = (getHouseTypeScore(1) * 0.5) + 
               (getContribution("Sun", 0.2) * 0.5);

  return {
    planets: planetStrengths,
    domains: {
      career: Math.round(career),
      finance: Math.round(finance),
      health: Math.round(health),
      relationships: Math.round(relationships),
      self: Math.round(self),
    },
  };
}
