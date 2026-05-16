export function getRelationshipTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  if (restrictive) {
    return "Emotional distance requires karmic re-evaluation. Communication strain is possible.";
  }
  return "Favorable phase for connection and harmonious alignment.";
}

export const relationshipVocabulary = {
  support: ["harmonious alignment", "emotional resonance", "stable connection"],
  friction: ["emotional distance", "karmic re-evaluation", "communication strain"],
  synthesis: "Depth is achieved through patient re-evaluation."
};
