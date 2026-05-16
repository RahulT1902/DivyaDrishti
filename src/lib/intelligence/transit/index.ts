import { TransitPosition } from "@/lib/astrology/transit";
import { CompleteTransitReport, TransitIntelligence } from "./types";
import { getTier, calculateHouse, findNatalActivations } from "./transitMapper";
import { classifyTransitNature } from "./transitClassifier";
import { generateManifestations } from "./manifestationEngine";
import { calculateIntensityMatrix, calculateDomainWeighting, synthesizeCosmicClimate } from "./transitSynthesizer";

export function generateTransitIntelligence(
  currentTransits: TransitPosition[],
  natalPlanets: any[],
  lagnaSign: number
): CompleteTransitReport {
  const moon = natalPlanets.find(p => p.name === "Moon");
  const moonSign = moon ? moon.sign : lagnaSign;

  const transitIntelligences: TransitIntelligence[] = currentTransits.map(transit => {
    const transitSign = Math.floor(transit.longitude / 30) + 1;
    const houseFromLagna = calculateHouse(transitSign, lagnaSign);
    const houseFromMoon = calculateHouse(transitSign, moonSign);

    const tier = getTier(transit.name);
    const nature = classifyTransitNature(transit.name, houseFromMoon, houseFromLagna);
    const intensity = calculateIntensityMatrix(transit.name, houseFromMoon, transit.weight);
    const manifestations = generateManifestations(transit.name, houseFromLagna, nature);
    const activatedNatalPoints = findNatalActivations(transit, natalPlanets);
    const affectedDomains = calculateDomainWeighting(transit.name, houseFromLagna);

    const whyItMatters: string[] = [
      `Transiting your ${houseFromLagna}th house from Ascendant.`,
      `Transiting your ${houseFromMoon}th house from Moon.`
    ];
    
    if (activatedNatalPoints.length > 0) {
      whyItMatters.push(`Activating natal ${activatedNatalPoints.map(a => a.planet).join(", ")}.`);
    }

    return {
      planet: transit.name,
      sign: getSignName(transitSign),
      degree: Math.floor(transit.longitude % 30),
      retrograde: transit.speed < 0 && transit.name !== "Sun" && transit.name !== "Moon" && transit.name !== "Rahu" && transit.name !== "Ketu",
      tier,
      houseFromLagna,
      houseFromMoon,
      nature,
      intensity,
      themes: ["Focus", "Adaptation"], // Simple fallback themes
      manifestations,
      affectedDomains,
      activatedNatalPoints,
      whyItMatters
    };
  });

  const climate = synthesizeCosmicClimate(transitIntelligences);

  return {
    climate,
    transits: transitIntelligences
  };
}

function getSignName(sign: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}
