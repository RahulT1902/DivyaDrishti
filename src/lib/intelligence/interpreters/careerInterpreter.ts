export function getCareerTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  if (restrictive) {
    return "More responsibility before recognition. Slower movement in formal titles, but structural importance is increasing.";
  }
  return "Visibility is expanding and structural momentum supports advancement.";
}

export const careerVocabulary = {
  support: ["visibility expansion", "authority support", "structural advancement"],
  friction: ["workload compression", "delayed recognition", "authority pressure"],
  synthesis: "recognition improves after workload stabilization"
};
