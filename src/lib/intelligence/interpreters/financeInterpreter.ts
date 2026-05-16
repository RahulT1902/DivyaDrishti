export function getFinanceTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  if (restrictive) {
    return "Liquidity pressure necessitates an accumulation cycle. Avoid speculative temptation.";
  }
  return "Stable inflow phase, favorable for structured growth.";
}

export const financeVocabulary = {
  support: ["stable inflow", "accumulation cycle", "long-term growth"],
  friction: ["liquidity pressure", "unstable inflow", "speculative temptation"],
  synthesis: "Security builds through cautious accumulation."
};
