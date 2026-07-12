import { getCareerTranslation } from "./careerInterpreter";
import { getFinanceTranslation } from "./financeInterpreter";
import { getRelationshipTranslation } from "./relationshipInterpreter";
import { getHealthTranslation } from "./healthInterpreter";

export function getDomainTranslation(domain: string, evidence: any[]): string {
  switch (domain) {
    case "career":      return getCareerTranslation(evidence);
    case "finance":     return getFinanceTranslation(evidence);
    case "relationship":return getRelationshipTranslation(evidence);
    case "health":      return getHealthTranslation(evidence);
    case "family":      return getFamilyTranslation(evidence);
    case "business":    return getBusinessTranslation(evidence);
    case "education":   return getEducationTranslation(evidence);
    case "spirituality":return getSpiritualityTranslation(evidence);
    default:            return getGeneralTranslation(evidence);
  }
}

// ── Inline translators for new domains ────────────────────────────────────

function getFamilyTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const idx = Math.floor(Date.now() / (1000 * 3600)) % 3;
  return restrictive ? [
    "The domestic environment may carry some tension. Differences of opinion in the family are better addressed with patience than urgency.",
    "A family member may need more support than usual. Being available and non-reactive creates the best conditions for harmony.",
    "Home decisions made impulsively now may require revision later. Slower deliberation serves the family better.",
  ][idx] : [
    "A relatively harmonious period for family dynamics. This is a good window for conversations that have been postponed.",
    "Family relationships are more receptive right now — gestures of care and connection land with more warmth.",
    "The domestic environment supports calm decision-making. Important household or family matters are best addressed during this window.",
  ][idx];
}

function getBusinessTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const idx = Math.floor(Date.now() / (1000 * 3600)) % 3;
  return restrictive ? [
    "Business momentum may feel harder to maintain. Protecting existing client relationships is more valuable than chasing new ones right now.",
    "Revenue may be slower to materialize than planned. Cash flow discipline becomes critical during this window.",
    "Partnership decisions carry higher risk in this period. Review existing agreements carefully before entering new ones.",
  ][idx] : [
    "Business momentum is building, and outreach efforts are more likely to convert during this window.",
    "A favorable period for negotiations, deal closures, or launching a new product or service.",
    "Client relationships are particularly warm. Deepening existing partnerships will yield more than prospecting broadly.",
  ][idx];
}

function getEducationTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const idx = Math.floor(Date.now() / (1000 * 3600)) % 3;
  return restrictive ? [
    "Concentration may feel harder to maintain than usual. Shorter, focused study sessions will outperform long unbroken stretches.",
    "Results may not immediately reflect the effort being invested. This is a period of laying groundwork — the payoff arrives later.",
    "External distractions or internal restlessness may make deep focus challenging. Environment and routine matter more than usual.",
  ][idx] : [
    "Mental sharpness is accessible right now — a good period for intensive study, learning, or preparing for assessments.",
    "Retention and recall are stronger than usual. Material studied in this window tends to stick.",
    "Academic momentum supports this period. Applying consistent effort during this window can significantly improve outcomes.",
  ][idx];
}

function getSpiritualityTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const idx = Math.floor(Date.now() / (1000 * 3600)) % 3;
  return restrictive ? [
    "The mind may feel more turbulent than the heart wants. This is a period for steadiness of practice rather than peak experience.",
    "External circumstances may challenge the user's spiritual equilibrium. Maintaining daily practice — even imperfectly — builds the inner anchor needed.",
    "This phase may feel like spiritual dryness or doubt. These are often the most transformative periods, even when they feel stagnant.",
  ][idx] : [
    "Inner receptivity is heightened. Spiritual practices — meditation, prayer, or devotional acts — carry more depth and impact during this window.",
    "A period of clarity and alignment with deeper purpose. Insights that arrive now tend to be meaningful and lasting.",
    "The chart supports inward focus and contemplative practice. Retreating from excess stimulation will be rewarded with genuine inner stillness.",
  ][idx];
}

function getGeneralTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const idx = Math.floor(Date.now() / (1000 * 3600)) % 3;
  return restrictive ? [
    "The current period requires more careful navigation than usual. Slower, more deliberate choices will outperform impulsive ones.",
    "Several areas of life may feel like they are moving through resistance. The chart asks for patience and consistency rather than dramatic shifts.",
    "This is a period of internal reconfiguration — outcomes may be slower to show, but the groundwork being laid is real.",
  ][idx] : [
    "The chart supports steady progress across most areas. Consistent effort in any direction will compound positively during this window.",
    "A broadly favorable period — not one for dramatic leaps, but for meaningful, grounded forward movement.",
    "Clarity and momentum are both accessible. This is a good time to act on decisions that have been pending.",
  ][idx];
}
