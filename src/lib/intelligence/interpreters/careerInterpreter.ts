const CAREER_SUPPORT_POOL = [
  "Professional momentum is picking up. Recognition may arrive through existing channels rather than new ones — consolidating current strengths will serve better than seeking fresh opportunities.",
  "The period supports advancement through demonstrated reliability. Quiet, focused output tends to be noticed more than loud positioning right now.",
  "Authority and influence are building, even if formal acknowledgment takes a little longer to arrive. The work being done now is setting the stage for what comes next.",
  "A favorable window for professional relationships and collaborative work. Others are more receptive to the user's ideas and leadership style.",
];

const CAREER_FRICTION_POOL = [
  "Responsibility is expanding faster than recognition catches up. This temporary imbalance between effort and reward is a phase, not a permanent state.",
  "Professional movement may feel slower than expected — decisions that normally take weeks can stretch. The chart asks for patience rather than a dramatic change of direction.",
  "There may be increased pressure from authority figures or structures above. Navigating this well requires careful communication rather than confrontation.",
  "The effort being invested now is real, but the returns are on a slight delay. Building skills or systems during this window pays dividends once the cycle shifts.",
];

export function getCareerTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const pool = restrictive ? CAREER_FRICTION_POOL : CAREER_SUPPORT_POOL;
  const idx = Math.floor(Date.now() / (1000 * 3600)) % pool.length;
  return pool[idx];
}

export const careerVocabulary = {
  support: ["growing authority", "recognition building", "professional alignment", "favorable visibility"],
  friction: ["effort-reward lag", "delayed acknowledgment", "authority friction", "workload compression"],
  synthesis: "Recognition improves once the current cycle of increased responsibility stabilizes.",
};
