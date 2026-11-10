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
      `    Best Window: [a FAVOURABLE or MIXED date range from TIMING EVIDENCE; if every window is CAUTION, "None this period"]\n` +
      `    Evidence Strength: [Strong / Moderate / Weak / Insufficient]\n` +
      `    Best Approach: [1 specific practical phrase]\n`,
  },
  finance: {
    evidenceName: "FINANCE CHART EVIDENCE",
    meansFor: "for their money",
    lifeArea: "income, savings and spending",
    reasoningExample:
      `"Venus rules your 11th and sits in the 2nd,\n` +
      `  so gains tend to settle into savings rather than slip away".`,
    vargaRule: `Call the D2 "your wealth chart (Hora)"; never write D1/D2.`,
    limitsCheck: "says this is not financial or investment advice",
    summaryFormat:
      `  FINANCE format (Gold Standard):\n` +
      `    Overall Finances: ★★★★☆ (Growing / Stable / Under Pressure / Volatile)\n` +
      `    Main Source: [salary / business / investments / family — from the chart]\n` +
      `    Supporting Factor: [1 phrase naming the chart factor]\n` +
      `    Main Risk: [1 phrase naming the chart factor]\n` +
      `    Best Window: [a FAVOURABLE or MIXED date range from TIMING EVIDENCE; if every window is CAUTION, "None this period"]\n` +
      `    Evidence Strength: [Strong / Moderate / Weak / Insufficient]\n` +
      `    Best Approach: [1 specific practical phrase]\n`,
  },
};

GOLD_PHRASES.property = {
  evidenceName: "PROPERTY CHART EVIDENCE",
  meansFor: "for their home and property plans",
  lifeArea: "home, land and property plans",
  reasoningExample:
    `"Mars rules your 4th and sits in the 11th,\n` +
    `  so land or a home tends to come as the reward of sustained effort".`,
  vargaRule: `Call the D4 "your property chart (Chaturthamsha)"; never write D1/D4.`,
  limitsCheck: "says this is not financial or legal advice and to check documents",
  summaryFormat:
    `  PROPERTY format (Gold Standard):\n` +
    `    Overall Property Outlook: ★★★★☆ (Favourable / Steady / Delayed / Unfavourable)\n` +
    `    Focus: [purchase / sale / construction / home loan / moving / land]\n` +
    `    Supporting Factor: [1 phrase naming the chart factor]\n` +
    `    Main Risk: [1 phrase naming the chart factor]\n` +
    `    Best Window: [a FAVOURABLE or MIXED date range from TIMING EVIDENCE; if every window is CAUTION, "None this period"]\n` +
    `    Evidence Strength: [Strong / Moderate / Weak / Insufficient]\n` +
    `    Best Approach: [1 specific practical phrase]\n`,
};

/** The parts of the reasoning protocol that differ between domains. */
interface ProtocolParts {
  title: string;
  natalFramework: string;   // hierarchy step 1, after "Natal framework — "
  varga: string;            // hierarchy step 2, after "1. … 2. "
  evidenceName: string;
  answerTopics: string;     // A: "(promotion, job change, …)"
  natalPromise: string;     // C
  vargaStep: string;        // D
  transitHouses: string;    // E: "the career houses"
  favourable: string;       // F
  challenging: string;      // G
  exampleEvent: string;     // H example
  guidance: string;         // I
  limits: string;           // J, after "astrology shows "
  rules: string[];          // domain-specific rules (after the shared ones)
}

const PARTS: Record<string, ProtocolParts> = {
  career: {
    title: "CAREER",
    natalFramework:
      `the 10th house and its lord, then the houses that fit THIS question:\n` +
      `     6th (job, service, employers), 2nd and 11th (salary, gains, promotion), 7th (business,\n` +
      `     clients), 9th (fortune, mentors); and the karakas Sun, Saturn, Mercury and Jupiter.`,
    varga: `Career chart (Dashamsha) — confirms or qualifies the birth-chart promise; never overrides it.`,
    evidenceName: "CAREER CHART EVIDENCE",
    answerTopics: `(promotion, job\n     change, business, recognition, income)`,
    natalPromise:
      `the 10th lord and the houses that matter for this question, and the\n` +
      `     karakas; explain what each means for their work. Don't list every placement.`,
    vargaStep: `Career chart (Dashamsha) — say whether it confirms or qualifies the birth-chart promise.`,
    transitHouses: "the career houses",
    favourable: "what supports their work (always include this)",
    challenging: "what slows or strains it",
    exampleEvent: `"from 16 Dec, when the Sun\n     enters your 10th house…"`,
    guidance: "specific: what to push for, what to avoid, and when to act",
    limits:
      `tendencies and favourable windows, not guaranteed outcomes, and that decisions should\n` +
      `     also weigh their skills, the market and practical advice`,
    rules: [`• Never promise a specific offer, promotion, salary figure or employer decision.`],
  },
  finance: {
    title: "FINANCE",
    natalFramework:
      `the 2nd (savings) and 11th (income, gains) houses and their lords, then\n` +
      `     the houses that fit THIS question: 5th (investments, speculation), 9th (fortune), 10th\n` +
      `     (earnings from work), 12th (expenses, losses); and the karakas Jupiter, Venus, Mercury and Moon.`,
    varga: `Wealth chart (Hora) — shows HOW wealth tends to come (own effort vs steady accumulation); never overrides the birth chart.`,
    evidenceName: "FINANCE CHART EVIDENCE",
    answerTopics: `(income, savings,\n     investment, debt, a purchase, expenses)`,
    natalPromise:
      `the 2nd and 11th lords and the houses that matter for this question,\n` +
      `     and the karakas; explain what each means for their money. Don't list every placement.`,
    vargaStep: `Wealth chart (Hora) — say what it adds about how money tends to come to them.`,
    transitHouses: "the money houses",
    favourable: "what supports income and savings (always include this)",
    challenging: "what drains money or raises risk",
    exampleEvent: `"from 22 Nov, when Venus\n     enters your 11th house…"`,
    guidance: "specific: what to save, what to avoid, when to act — never name a stock, fund or amount",
    limits:
      `tendencies and favourable windows, not guaranteed returns, and that this is not\n` +
      `     financial or investment advice — big money decisions need a qualified adviser`,
    rules: [
      `• Never recommend a specific stock, fund, asset, amount or return, and never promise gains.`,
      `• Never predict a market move; speak only about this person's chart and timing.`,
    ],
  },
};

PARTS.property = {
  title: "PROPERTY",
  natalFramework:
    `the 4th house (home, land, vehicles) and its lord, then the houses\n` +
    `     that fit THIS question: 2nd (savings for a purchase), 11th (gains), 8th (loans, inheritance),\n` +
    `     12th (large outlays), 10th (means from work); and the karakas Mars, Venus, Moon and Saturn.`,
  varga: `Property chart (Chaturthamsha) — confirms or qualifies the birth-chart promise; never overrides it.`,
  evidenceName: "PROPERTY CHART EVIDENCE",
  answerTopics: `(buying, selling,\n     building, a home loan, moving, land)`,
  natalPromise:
    `the 4th lord and the houses that matter for this question, and the\n` +
    `     karakas; explain what each means for their property plans. Don't list every placement.`,
  vargaStep: `Property chart (Chaturthamsha) — say whether it confirms or qualifies the birth-chart promise.`,
  transitHouses: "the 4th house and the other property houses",
  favourable: "what supports owning, buying or building (always include this)",
  challenging: "what delays or complicates it",
  exampleEvent: `"from 5 Dec, when Rahu\n     enters your 8th house…"`,
  guidance: "specific: what to prepare, what to check, when to act — never a price or an amount",
  limits:
    `tendencies and favourable windows, not guaranteed outcomes, and that this is not\n` +
    `     financial or legal advice — documents, title and finances should be checked with professionals`,
  rules: [
    `• Never name a price, an amount, a location to buy in, or a promised return.`,
    `• Never predict the property market; speak only about this person's chart and timing.`,
  ],
};

/** The reasoning protocol and A–J structure for a non-health domain. */
export function goldProtocol(domain: string, goldTiming: boolean): string {
  const p = PARTS[domain];
  if (!p) throw new Error(`No Gold Standard protocol for domain "${domain}" yet`);
  return (
    `━━━ ${p.title} CONSULTATION — CHATPUNDIT GOLD STANDARD v1.0 ━━━\n\n` +

    `Reason chart-first and from MULTIPLE factors, in this order (evidence hierarchy):\n` +
    `  1. Natal framework — ${p.natalFramework}\n` +
    `  2. ${p.varga}\n` +
    `  3. Dasha — which planets and houses the current periods activate.\n` +
    `  4. Transits — timing and temporary influences.\n` +
    `  5. Protective and contradicting factors — balance the conclusion.\n` +
    `Never base a strong statement on a single placement. Use ONLY the facts in ${p.title} CHART\n` +
    `EVIDENCE below; if something is marked "not available", say it cannot be assessed.\n\n` +

    `STRUCTURE — plain connected paragraphs, no headers, in this order:\n` +
    `  A. Overall indication — the headline answer to exactly what they asked ${p.answerTopics} in the first sentence.\n` +
    (goldTiming
      ? `  B. Current dasha influence — name the Mahadasha, Antardasha AND Pratyantar with their dates\n` +
        `     from TIMING EVIDENCE. Then explain how the Pratyantar lord MODIFIES the Mahadasha–\n` +
        `     Antardasha reading, using PRATYANTAR LINK: its house and lordship, its dignity, and its\n` +
        `     relationship to each of the two lords (house distance, aspect, natural friendship).\n` +
        `     Merely naming the Pratyantar is not enough. If DASHA CHANGES IN PERIOD lists a change,\n` +
        `     say what shifts after that date.\n`
      : `  B. Current dasha influence — name the Mahadasha and Antardasha and what they activate.\n`) +
    `  C. Natal promise — ${p.natalPromise}\n` +
    `  D. ${p.vargaStep}\n` +
    `  E. Current transits — the ones that touch ${p.transitHouses}.\n` +
    `  F. Favourable influences — ${p.favourable}.\n` +
    `  G. Challenging influences — ${p.challenging}.\n` +
    (goldTiming
      ? `  H. Dated timeline — walk through the WINDOWS in TIMING EVIDENCE in date order. For each\n` +
        `     window worth mentioning give its date range, whether it is favourable, needs care or is\n` +
        `     mixed, and the specific transit or dasha change behind it (e.g. ${p.exampleEvent}). Where an event falls inside the period, contrast before and\n` +
        `     after that date. Use ONLY dates that appear in TIMING EVIDENCE — never invent a date or a\n` +
        `     number of days. Dasha dates are approximate ("around 19 December"). State each window's\n` +
        `     confidence in words (firm / moderate / tentative) — it reflects how strongly the chart\n` +
        `     factors agree, not a probability. If no event falls in the period, say the period is steady.\n` +
        `     A "best window" must be a favourable or mixed window, never one marked CAUTION.\n`
      : `  H. Timing — ONLY from the dasha period and transits; NEVER a number of days or weeks.\n`) +
    `  I. Practical guidance — ${p.guidance}.\n` +
    `  J. Confidence and limits — say how strong the evidence is (Strong / Moderate / Weak /\n` +
    `     Insufficient, from EVIDENCE STRENGTH) and, in your own words, that astrology shows\n` +
    `     ${p.limits}.\n\n` +

    `RULES:\n` +
    `• Present supporting AND contradicting evidence — never only the positives.\n` +
    `• No numeric probabilities or percentages. Evidence strength is not a probability of success.\n` +
    p.rules.map(r => `${r}\n`).join("") +
    `• Avoid statements true of everyone with this Ascendant; tie each point to THIS chart's combinations.\n` +
    `• Explain WHY: every claim should trace to a line in ${p.evidenceName} or the DIAGNOSIS.`
  );
}
