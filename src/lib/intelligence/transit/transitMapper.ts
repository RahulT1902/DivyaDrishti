import { TransitPosition } from "@/lib/astrology/transit";
import { TransitTier, NatalActivation } from "./types";

function getSignName(sign: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}

export function getTier(planet: string): TransitTier {
  if (["Saturn", "Jupiter", "Rahu", "Ketu"].includes(planet)) return 1;
  if (["Mars", "Sun"].includes(planet)) return 2;
  return 3;
}

export function calculateHouse(transitSign: number, referenceSign: number): number {
  return ((transitSign - referenceSign + 12) % 12) + 1;
}

export function findNatalActivations(transit: TransitPosition, natalPlanets: any[]): NatalActivation[] {
  const activations: NatalActivation[] = [];
  const transitSign = Math.floor(transit.longitude / 30) + 1;
  const transitDegree = transit.longitude % 30;

  for (const natal of natalPlanets) {
    const natalSign = natal.sign;
    const natalDegree = natal.degree;
    
    // Conjunction
    if (transitSign === natalSign) {
      const orb = Math.abs(transitDegree - natalDegree);
      if (orb <= 10) {
        activations.push({
          planet: natal.name,
          type: "conjunction",
          intensity: 10 - orb // Max 10, min 0
        });
      }
    }
    
    // Special Aspects (Vedic)
    if (transit.name === "Saturn" && ([3, 7, 10].includes(calculateHouse(natalSign, transitSign)))) {
        activations.push({ planet: natal.name, type: "aspect", intensity: 6 });
    }
    if (transit.name === "Jupiter" && ([5, 7, 9].includes(calculateHouse(natalSign, transitSign)))) {
        activations.push({ planet: natal.name, type: "aspect", intensity: 7 });
    }
    if (transit.name === "Mars" && ([4, 7, 8].includes(calculateHouse(natalSign, transitSign)))) {
        activations.push({ planet: natal.name, type: "aspect", intensity: 5 });
    }
    if (["Sun", "Moon", "Mercury", "Venus"].includes(transit.name) && calculateHouse(natalSign, transitSign) === 7) {
        activations.push({ planet: natal.name, type: "aspect", intensity: 4 });
    }
  }

  return activations;
}
