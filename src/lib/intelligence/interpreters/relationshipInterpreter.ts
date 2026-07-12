const RELATIONSHIP_SUPPORT_POOL = [
  "Emotional connection feels more accessible right now. This is a period where honest conversations tend to land softly, and shared experiences carry extra meaning.",
  "The chart favors deepening rather than starting — existing bonds benefit most from this period. Vulnerability and openness will be met with more understanding than usual.",
  "Partnership energy is flowing. A mutual decision made now carries real weight and is more likely to stick than one made under pressure or uncertainty.",
  "The emotional climate is warmer than it has been. Reconciliation or repair of a strained relationship is more accessible during this window.",
];

const RELATIONSHIP_FRICTION_POOL = [
  "There is an emotional undercurrent that may make communication feel harder than it should. Words might land differently than intended — patience with both self and others matters here.",
  "One person in the dynamic may be carrying more emotionally than the other, creating a subtle imbalance. This is less about fault and more about timing — needs and availability are slightly misaligned.",
  "A pattern that has been present for some time may surface more visibly now. While uncomfortable, it is also an opportunity for honest acknowledgment.",
  "Reactivity may be higher than usual. Conversations about sensitive topics are best approached with care rather than urgency — timing matters as much as the words themselves.",
];

export function getRelationshipTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const pool = restrictive ? RELATIONSHIP_FRICTION_POOL : RELATIONSHIP_SUPPORT_POOL;
  const idx = Math.floor(Date.now() / (1000 * 3600)) % pool.length;
  return pool[idx];
}

export const relationshipVocabulary = {
  support: ["emotional accessibility", "deepening bond", "communication opening", "mutual warmth"],
  friction: ["communication mismatch", "emotional imbalance", "surface tension", "reactive period"],
  synthesis: "Depth in connection comes through patience and honest, well-timed expression.",
};
