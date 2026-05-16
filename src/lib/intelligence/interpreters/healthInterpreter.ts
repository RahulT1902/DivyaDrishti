export function getHealthTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  if (restrictive) {
    return "Physical stamina requires careful management. Focus on structural recovery.";
  }
  return "Vitality is stable, favorable for building physical resilience.";
}

export const healthVocabulary = {
  support: ["stable vitality", "physical resilience", "structural recovery"],
  friction: ["stamina management", "systemic fatigue", "energy depletion"],
  synthesis: "Resilience builds through structured recovery."
};
