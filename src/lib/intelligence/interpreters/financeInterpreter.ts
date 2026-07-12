const FINANCE_SUPPORT_POOL = [
  "Income flow is showing signs of steadiness — a period where disciplined accumulation carries more weight than chasing quick gains.",
  "The period favors measured financial decisions. Money that arrives now tends to be more durable if handled carefully.",
  "A quiet but productive window for building reserves. Consistency in saving will outperform any speculative move right now.",
  "Cash inflow appears stable, and the timing favors locking in what you have rather than reaching for more.",
];

const FINANCE_FRICTION_POOL = [
  "Money may require considerably more effort than expected — not because opportunity is absent, but because the timing demands patience before payoff.",
  "Liquidity could feel tighter than usual. This is less about earning capacity and more about timing: expenses may outpace income temporarily.",
  "Financial commitments made impulsively in this window carry higher risk. The chart favors reviewing obligations over taking on new ones.",
  "Income may feel unpredictable or inconsistent. Protecting existing resources becomes more important than pursuing new ones.",
];

export function getFinanceTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const pool = restrictive ? FINANCE_FRICTION_POOL : FINANCE_SUPPORT_POOL;
  const idx = Math.floor(Date.now() / (1000 * 3600)) % pool.length; // rotate hourly
  return pool[idx];
}

export const financeVocabulary = {
  support: ["stable inflow", "accumulation window", "liquidity improving", "reserves building"],
  friction: ["cash flow pressure", "delayed returns", "income inconsistency", "over-commitment risk"],
  synthesis: "Patience in commitment yields more than speed in acquisition during this cycle.",
};
