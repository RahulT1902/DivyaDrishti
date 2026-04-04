import { AstroSignal, Intent, Timeframe } from "./types";

/**
 * Layer 1: Astro Truth Engine
 * Extracts active signals from the birth chart, dashas, and transits.
 */

const EXALTATION: Record<string, number> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7
};

const DEBILITATION: Record<string, number> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1
};

export function extractAstroSignals(
  natalChart: any,
  currentTransits: any,
  dasha: any,
  intent: Intent
): AstroSignal[] {
  const signals: AstroSignal[] = [];

  // 1. Analyze Dasha Lords (Highest Priority)
  if (dasha && dasha.md) {
    const mdPlanet = dasha.md.planet;
    const { strength, score } = getPlanetStrength(mdPlanet, natalChart);
    signals.push({
      planet: mdPlanet,
      strength,
      strengthScore: score,
      nature: strength === "weak" ? "challenging" : "supportive",
      area: ["general", "long-term"],
      reason: `Primary Mahadasha lord governing this major life chapter.`
    });
  }

  if (dasha && dasha.ad) {
    const adPlanet = dasha.ad.planet;
    const { strength, score } = getPlanetStrength(adPlanet, natalChart);
    signals.push({
      planet: adPlanet,
      strength,
      strengthScore: score,
      nature: strength === "weak" ? "challenging" : "supportive",
      area: ["focus", "current-phase"],
      reason: `Antardasha lord triggering immediate events and mental focus.`
    });
  }

  // 2. Analyze Transit Triggers
  const lagnaSign = natalChart.lagna.sign;
  
  currentTransits.forEach((tp: any) => {
    const house = (tp.sign - lagnaSign + 12) % 12 + 1;
    const isStrongTrigger = tp.name === "Saturn" || tp.name === "Mars" || tp.name === "Rahu";
    
    // Saturn (Restriction/Hard Work)
    if (tp.name === "Saturn") {
       signals.push({
         planet: "Saturn",
         strength: "strong",
         strengthScore: 80,
         nature: "challenging",
         area: getAreaForHouse(house),
         isStrongTransit: true,
         reason: `Saturn transiting your ${house} house calls for discipline and review.`
       });
    }

    // Jupiter (Expansion/Blessing)
    if (tp.name === "Jupiter") {
      signals.push({
        planet: "Jupiter",
        strength: "strong",
        strengthScore: 90,
        nature: "supportive",
        area: getAreaForHouse(house),
        isStrongTransit: false,
        reason: `Jupiter transiting your ${house} house brings growth and perspective.`
      });
    }

    // Mars (Energy/Conflict)
    if (tp.name === "Mars") {
      signals.push({
        planet: "Mars",
        strength: "neutral",
        strengthScore: 60,
        nature: "mixed",
        area: getAreaForHouse(house),
        isStrongTransit: true,
        reason: `Mars in your ${house} house brings a surge of energy and potential friction.`
      });
    }
  });

  return signals;
}

function getPlanetStrength(planet: string, chart: any): { strength: "strong" | "neutral" | "weak"; score: number } {
  const pData = chart.planets.find((p: any) => p.name === planet);
  if (!pData) return { strength: "neutral", score: 50 };

  if (EXALTATION[planet] === pData.sign) return { strength: "strong", score: 100 };
  if (DEBILITATION[planet] === pData.sign) return { strength: "weak", score: 20 };
  
  const ownSigns: Record<string, number[]> = {
    Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11]
  };

  if (ownSigns[planet]?.includes(pData.sign)) return { strength: "strong", score: 85 };

  return { strength: "neutral", score: 50 };
}

function getAreaForHouse(house: number): string[] {
  const map: Record<number, string[]> = {
    1: ["self", "identity", "health"],
    2: ["finance", "family", "speech"],
    3: ["communication", "courage", "siblings"],
    4: ["home", "mother", "comfort"],
    5: ["education", "children", "creativity", "love"],
    6: ["work", "health", "obstacles"],
    7: ["relationships", "partnership", "public"],
    8: ["sudden-events", "transformation", "longevity"],
    9: ["luck", "wisdom", "travel"],
    10: ["career", "status", "reputation"],
    11: ["gains", "friendships", "network"],
    12: ["spiritual", "losses", "solitude"]
  };
  return map[house] || ["general"];
}
