/**
 * Conflict Resolver Layer.
 * Deterministic logic for resolving planetary tensions and identifying dominance.
 */

export interface PlanetTrait {
  nature: string;
  focus: string;
  pace: string;
  outcome: string;
}

export const PLANET_TRAITS: Record<string, PlanetTrait> = {
  Sun: { nature: "Authority", focus: "Self-expression", pace: "Consistent", outcome: "Clarity & Status" },
  Moon: { nature: "Emotional", focus: "Internal peace", pace: "Fluctuating", outcome: "Growth & Comfort" },
  Mars: { nature: "Energy", focus: "Action", pace: "Fast/Aggressive", outcome: "Victory or Conflict" },
  Mercury: { nature: "Intelligence", focus: "Communication", pace: "Flexible/Fast", outcome: "Choices & Movement" },
  Jupiter: { nature: "Wisdom", focus: "Direction", pace: "Steady/Expanding", outcome: "Clarity & Growth" },
  Venus: { nature: "Harmony", focus: "Relationships", pace: "Pleasant", outcome: "Comfort & Art" },
  Saturn: { nature: "Structure", focus: "Discipline", pace: "Slow/Delayed", outcome: "Reality Check & Stability" },
  Rahu: { nature: "Desire", focus: "Expansion", pace: "Intense/Chaotic", outcome: "Redirection or Obsession" },
  Ketu: { nature: "Detachment", focus: "Spirituality", pace: "Sudden", outcome: "Internal Shift or Internal Loss" },
};

export function getDominantPlanet(signals: any[], previousDominant?: string) {
  if (!signals || signals.length === 0) return { planet: "None", score: 0 };

  // 1. Calculate Scores: (dasha * 0.5) + (house * 0.2) + (aspect * 0.2) + (transit * 0.1)
  const scores = signals.map(s => {
    const areas = Array.isArray(s.area) ? s.area : [];
    const dashaWeight = areas.includes("major") ? 100 : areas.includes("current-phase") ? 80 : 40;
    const houseWeight = s.strengthScore || 50;
    const aspectWeight = s.isAspectingBenefit ? 80 : s.isAspectingMalefic ? 40 : 50;
    const transitWeight = s.isStrongTransit ? 90 : 30;

    const total = (dashaWeight * 0.5) + (houseWeight * 0.2) + (aspectWeight * 0.2) + (transitWeight * 0.1);
    return { planet: s.planet, score: total };
  });

  // 2. Resolve Winner
  let winner = scores.sort((a, b) => b.score - a.score)[0];

  // 3. Hysteresis Logic: Stability buffer to prevent narrative flicker
  if (previousDominant && previousDominant !== winner.planet) {
    const prevScore = scores.find(s => s.planet === previousDominant)?.score || 0;
    if (Math.abs(winner.score - prevScore) < 10) { // 10 point buffer
      winner = { planet: previousDominant, score: prevScore };
    }
  }

  return winner;
}

/**
 * Resolve contrasts between two planetary states (Transition Insight)
 */
export function getTransitionContrast(prev: string, next: string) {
  const p1 = PLANET_TRAITS[prev] || PLANET_TRAITS.Sun;
  const p2 = PLANET_TRAITS[next] || PLANET_TRAITS.Sun;

  const reductions = [];
  const improvements = [];

  if (p1.nature !== p2.nature) reductions.push(p1.nature.toLowerCase());
  if (p1.pace !== p2.pace) improvements.push(p2.pace.toLowerCase());

  return {
    reduces: reductions.length > 0 ? reductions.join(" and ") : "resistance",
    increases: improvements.length > 0 ? improvements.join(" and ") : "clarity"
  };
}

/**
 * Identify Active Tensions (Pull & Push)
 */
export function resolveTensions(signals: any[]) {
  const malefic = signals.filter(s => ["Saturn", "Rahu", "Mars"].includes(s.planet));
  const benefic = signals.filter(s => ["Jupiter", "Venus", "Moon"].includes(s.planet));

  if (malefic.length > 0 && benefic.length > 0) {
    const m = malefic[0].planet;
    const b = benefic[0].planet;
    return `The tension between ${m}'s intensity and ${b}'s guidance creates a period of disciplined transformation.`;
  }

  return null;
}
