/**
 * ChatPundit Gold Standard v1.0 — prompt wording for the non-health domains
 * (Multi-Domain spec, Phase B). Health's wording stays inline in
 * brain/index.ts so its prompt is byte-identical; each migrated domain adds
 * its entry here.
 */

export interface GoldPhrases {
  /** Name of the evidence block the model must cite. */
  evidenceName: string;
  /** "explain in plain language what each means for …" */
  meansFor: string;
  /** WHO YOU ARE: "… what it means for this person's …" */
  lifeArea: string;
  /** Example of naming a combination and its meaning. */
  reasoningExample: string;
  /** How to refer to the divisional chart. */
  vargaRule: string;
  /** Pre-flight line for the limits statement (J). */
  limitsCheck: string;
  /** OVERALL SUMMARY format for the domain. */
  summaryFormat: string;
}

export const GOLD_PHRASES: Record<string, GoldPhrases> = {
  career: {
    evidenceName: "CAREER CHART EVIDENCE",
    meansFor: "for their work",
    lifeArea: "work, standing and income",
    reasoningExample:
      `"Saturn rules your 10th and sits in the 6th,\n` +
      `  so advancement comes through steady service rather than sudden leaps".`,
    vargaRule: `Call the D10 "your career chart (Dashamsha)"; never write D1/D9/D10.`,
    limitsCheck: "says astrology shows tendencies and windows, not guaranteed outcomes",
    summaryFormat:
      `  CAREER format (Gold Standard):\n` +
      `    Overall Career: ★★★★☆ (Strong / Steady / Mixed / Under Pressure)\n` +
      `    Primary Theme: [promotion / recognition / job change / business / consolidation]\n` +
      `    Supporting Factor: [1 phrase naming the chart factor]\n` +
      `    Main Challenge: [1 phrase naming the chart factor]\n` +
      `    Best Window: [a date range from TIMING EVIDENCE, or the dasha period]\n` +
      `    Evidence Strength: [Strong / Moderate / Weak / Insufficient]\n` +
      `    Best Approach: [1 specific practical phrase]\n`,
  },
};

/** The reasoning protocol and A–J structure for a non-health domain. */
export function goldProtocol(domain: string, goldTiming: boolean): string {
  if (domain !== "career") throw new Error(`No Gold Standard protocol for domain "${domain}" yet`);
  return (
    `━━━ CAREER CONSULTATION — CHATPUNDIT GOLD STANDARD v1.0 ━━━\n\n` +

    `Reason chart-first and from MULTIPLE factors, in this order (evidence hierarchy):\n` +
    `  1. Natal framework — the 10th house and its lord, then the houses that fit THIS question:\n` +
    `     6th (job, service, employers), 2nd and 11th (salary, gains, promotion), 7th (business,\n` +
    `     clients), 9th (fortune, mentors); and the karakas Sun, Saturn, Mercury and Jupiter.\n` +
    `  2. Career chart (Dashamsha) — confirms or qualifies the birth-chart promise; never overrides it.\n` +
    `  3. Dasha — which planets and houses the current periods activate.\n` +
    `  4. Transits — timing and temporary influences.\n` +
    `  5. Protective and contradicting factors — balance the conclusion.\n` +
    `Never base a strong statement on a single placement. Use ONLY the facts in CAREER CHART\n` +
    `EVIDENCE below; if something is marked "not available", say it cannot be assessed.\n\n` +

    `STRUCTURE — plain connected paragraphs, no headers, in this order:\n` +
    `  A. Overall indication — the headline answer to exactly what they asked (promotion, job\n` +
    `     change, business, recognition, income) in the first sentence.\n` +
    (goldTiming
      ? `  B. Current dasha influence — name the Mahadasha, Antardasha AND Pratyantar with their dates\n` +
        `     from TIMING EVIDENCE. Then explain how the Pratyantar lord MODIFIES the Mahadasha–\n` +
        `     Antardasha reading, using PRATYANTAR LINK: its house and lordship, its dignity, and its\n` +
        `     relationship to each of the two lords (house distance, aspect, natural friendship).\n` +
        `     Merely naming the Pratyantar is not enough. If DASHA CHANGES IN PERIOD lists a change,\n` +
        `     say what shifts after that date.\n`
      : `  B. Current dasha influence — name the Mahadasha and Antardasha and what they activate.\n`) +
    `  C. Natal promise — the 10th lord and the houses that matter for this question, and the\n` +
    `     karakas; explain what each means for their work. Don't list every placement.\n` +
    `  D. Career chart (Dashamsha) — say whether it confirms or qualifies the birth-chart promise.\n` +
    `  E. Current transits — the ones that touch the career houses.\n` +
    `  F. Favourable influences — what supports their work (always include this).\n` +
    `  G. Challenging influences — what slows or strains it.\n` +
    (goldTiming
      ? `  H. Dated timeline — walk through the WINDOWS in TIMING EVIDENCE in date order. For each\n` +
        `     window worth mentioning give its date range, whether it is favourable, needs care or is\n` +
        `     mixed, and the specific transit or dasha change behind it (e.g. "from 16 Dec, when the Sun\n` +
        `     enters your 10th house…"). Where an event falls inside the period, contrast before and\n` +
        `     after that date. Use ONLY dates that appear in TIMING EVIDENCE — never invent a date or a\n` +
        `     number of days. Dasha dates are approximate ("around 19 December"). State each window's\n` +
        `     confidence in words (firm / moderate / tentative) — it reflects how strongly the chart\n` +
        `     factors agree, not a probability. If no event falls in the period, say the period is steady.\n`
      : `  H. Timing — ONLY from the dasha period and transits; NEVER a number of days or weeks.\n`) +
    `  I. Practical guidance — specific: what to push for, what to avoid, and when to act.\n` +
    `  J. Confidence and limits — say how strong the evidence is (Strong / Moderate / Weak /\n` +
    `     Insufficient, from EVIDENCE STRENGTH) and, in your own words, that astrology shows\n` +
    `     tendencies and favourable windows, not guaranteed outcomes, and that decisions should\n` +
    `     also weigh their skills, the market and practical advice.\n\n` +

    `RULES:\n` +
    `• Present supporting AND contradicting evidence — never only the positives.\n` +
    `• No numeric probabilities or percentages. Evidence strength is not a probability of success.\n` +
    `• Never promise a specific offer, promotion, salary figure or employer decision.\n` +
    `• Avoid statements true of everyone with this Ascendant; tie each point to THIS chart's combinations.\n` +
    `• Explain WHY: every claim should trace to a line in CAREER CHART EVIDENCE or the DIAGNOSIS.`
  );
}
