import { TransitPosition } from "@/lib/astrology/transit";
import { IntensityMatrix, TransitDomainWeighting, CosmicClimate, TransitIntelligence } from "./types";

export function calculateIntensityMatrix(planet: string, houseFromMoon: number, weight: number): IntensityMatrix {
  let pressure = 0;
  let opportunity = 0;
  let volatility = 0;

  if (planet === "Saturn") {
    pressure = weight * 1.5;
    opportunity = [3, 6, 11].includes(houseFromMoon) ? weight : weight * 0.3;
    volatility = weight * 0.2;
  } else if (planet === "Jupiter") {
    pressure = weight * 0.2;
    opportunity = [2, 5, 7, 9, 11].includes(houseFromMoon) ? weight * 1.5 : weight * 0.8;
    volatility = weight * 0.1;
  } else if (planet === "Rahu") {
    pressure = weight * 0.8;
    opportunity = weight * 0.7;
    volatility = weight * 1.8;
  } else if (planet === "Ketu") {
    pressure = weight * 0.5;
    opportunity = weight * 0.2;
    volatility = weight * 1.5;
  } else if (planet === "Mars") {
    pressure = weight * 1.2;
    opportunity = weight * 0.8;
    volatility = weight * 1.2;
  } else {
    pressure = weight * 0.5;
    opportunity = weight * 0.5;
    volatility = weight * 0.5;
  }

  // Normalize to 1-10 scale
  return {
    pressure: Math.min(10, Math.max(1, Math.round(pressure))),
    opportunity: Math.min(10, Math.max(1, Math.round(opportunity))),
    volatility: Math.min(10, Math.max(1, Math.round(volatility)))
  };
}

export function calculateDomainWeighting(planet: string, houseFromLagna: number): TransitDomainWeighting {
  const domains: TransitDomainWeighting = { career: 0, finance: 0, relationships: 0, health: 0, mind: 0 };
  
  if ([1, 5, 9].includes(houseFromLagna)) domains.mind += 5;
  if ([2, 11].includes(houseFromLagna)) domains.finance += 5;
  if ([6, 8, 12].includes(houseFromLagna)) { domains.health += 5; domains.mind += 3; }
  if ([7].includes(houseFromLagna)) domains.relationships += 5;
  if ([10].includes(houseFromLagna)) domains.career += 5;

  if (planet === "Saturn") { domains.career += 3; domains.mind += 2; }
  if (planet === "Jupiter") { domains.finance += 3; domains.mind += 2; }
  if (planet === "Venus") { domains.relationships += 3; domains.finance += 2; }
  
  // Normalize
  for (const k of Object.keys(domains) as Array<keyof TransitDomainWeighting>) {
    domains[k] = Math.min(10, domains[k]);
  }
  
  return domains;
}

export function synthesizeCosmicClimate(transits: TransitIntelligence[]): CosmicClimate {
  let netPressure = 0;
  let netOpportunity = 0;
  let netVolatility = 0;
  let count = 0;

  for (const t of transits) {
    if (t.tier === 1) { // Only Macro drivers heavily affect climate
      netPressure += t.intensity.pressure;
      netOpportunity += t.intensity.opportunity;
      netVolatility += t.intensity.volatility;
      count++;
    }
  }

  netPressure = Math.round(netPressure / count);
  netOpportunity = Math.round(netOpportunity / count);
  netVolatility = Math.round(netVolatility / count);

  let headline = "A period of balanced growth and structural maintenance.";
  if (netPressure > 7 && netVolatility > 6) {
    headline = "A period of intense structural pressure and uncertainty is dominating long-term planning.";
  } else if (netOpportunity > 7) {
    headline = "A highly expansive period favoring calculated risk and broad growth.";
  } else if (netVolatility > 7) {
    headline = "A highly volatile cosmic environment requiring extreme adaptability.";
  } else if (netPressure > 7) {
    headline = "A heavy period demanding discipline, patience, and restructuring.";
  }

  return {
    headline,
    dominantThemes: netPressure > netOpportunity ? ["Restructuring", "Discipline"] : ["Expansion", "Exploration"],
    netPressure,
    netOpportunity,
    netVolatility
  };
}
