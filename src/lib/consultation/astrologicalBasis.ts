import type { ChartFacts } from "@/lib/core/astrology/chartFacts";
import type { PlanetName } from "@/lib/core/types";

/**
 * "The astrological basis" paragraph appended to full Pundit answers.
 *
 * Built server-side from computed chart facts rather than written by the LLM,
 * so every dasha, lordship, placement and transit named in it is exactly what
 * the engine calculated. The narrated answer above it stays in plain language.
 */

const DOMAIN_HOUSES: Record<string, Array<{ house: number; meaning: string }>> = {
  health:       [{ house: 6, meaning: "health and illness" }, { house: 1, meaning: "body and vitality" }],
  career:       [{ house: 10, meaning: "career and status" }],
  finance:      [{ house: 2, meaning: "wealth" }, { house: 11, meaning: "gains" }],
  relationship: [{ house: 7, meaning: "partnership and marriage" }],
  family:       [{ house: 4, meaning: "home and family" }],
  business:     [{ house: 7, meaning: "business partnerships" }, { house: 10, meaning: "work and status" }],
  education:    [{ house: 5, meaning: "learning and intellect" }],
  spirituality: [{ house: 9, meaning: "dharma and spiritual growth" }],
  general:      [{ house: 1, meaning: "self and overall direction" }],
};

const ordinal = (n: number) =>
  `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

export function buildAstrologicalBasis(
  facts: ChartFacts,
  domain: string,
  dasha?: { mahadasha: string; antardasha: string; periodEnd?: string },
): string {
  const sentences: string[] = [];

  if (dasha) {
    const until = dasha.periodEnd
      ? `, running until ${new Date(dasha.periodEnd).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
      : "";
    sentences.push(`You are in ${dasha.mahadasha} Mahadasha with ${dasha.antardasha} Antardasha${until}.`);
  }

  const houses = DOMAIN_HOUSES[domain] ?? DOMAIN_HOUSES.general;
  const lordships = houses.map(({ house, meaning }) => {
    const lord = facts.houseLords[house];
    const placement = facts.natalPlanetPositions[lord as PlanetName];
    const where = placement ? `, placed in your ${ordinal(placement.house)} house in ${placement.signName}` : "";
    return `the ${ordinal(house)} house of ${meaning} is ruled by ${lord}${where}`;
  });
  if (lordships.length > 0) {
    sentences.push(`In your ${facts.ascendantSignName} Ascendant chart, ${lordships.join("; ")}.`);
  }

  const transits = (["Saturn", "Jupiter"] as PlanetName[])
    .map(p => facts.transitPlanetPositions[p])
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map(t => `${t.planet} in your ${ordinal(t.house)} house (${t.signName})`);
  if (transits.length > 0) {
    sentences.push(`Currently transiting: ${transits.join(" and ")}.`);
  }

  const moon = facts.transitPlanetPositions.Moon;
  if (moon) sentences.push(`Today's Moon is in ${moon.signName}, your ${ordinal(moon.house)} house.`);

  return sentences.length > 0 ? `The astrological basis: ${sentences.join(" ")}` : "";
}

/** Insert the basis before the "Overall Summary" block when present, else append it. */
export function insertAstrologicalBasis(answer: string, basis: string): string {
  if (!basis) return answer;
  const match = answer.match(/\n+(?=\s*(?:Overall Summary|\w+ Summary for \d{4}))/);
  if (match?.index !== undefined) {
    return `${answer.slice(0, match.index)}\n\n${basis}\n\n${answer.slice(match.index).trimStart()}`;
  }
  return `${answer}\n\n${basis}`;
}
