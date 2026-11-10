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

GOLD_PHRASES.relationship = {
  evidenceName: "RELATIONSHIP CHART EVIDENCE",
  meansFor: "for their relationship",
  lifeArea: "relationship and married life",
  reasoningExample:
    `"Venus rules your 7th and sits in the 5th,\n` +
    `  so affection and shared joy keep the bond warm".`,
  vargaRule: `Call the D9 "your marriage chart (Navamsa)"; never write D1/D9.`,
  limitsCheck: "says astrology shows tendencies and that the relationship is shaped by both people's choices",
  summaryFormat:
    `  RELATIONSHIP format (Gold Standard):\n` +
    `    Overall Relationship: ★★★★☆ (Harmonious / Steady / Needs Care / Strained)\n` +
    `    Main Dynamic: [1 phrase]\n` +
    `    Supporting Factor: [1 phrase naming the chart factor]\n` +
    `    Needs Attention: [1 phrase naming the chart factor]\n` +
    `    Best Window: [a FAVOURABLE or MIXED date range from TIMING EVIDENCE; if every window is CAUTION, "None this period"]\n` +
    `    Evidence Strength: [Strong / Moderate / Weak / Insufficient]\n` +
    `    Best Approach: [1 specific practical phrase]\n`,
};

PARTS.relationship = {
  title: "RELATIONSHIP",
  natalFramework:
    `the 7th house (spouse, marriage) and its lord, then the houses that\n` +
    `     fit THIS question: 2nd (family life), 5th (romance), 8th (the bond, in-laws), 11th\n` +
    `     (fulfilment), 12th (intimacy, distance); and the karakas Venus, Jupiter, Moon and Mars.`,
  varga: `Marriage chart (Navamsa) — confirms or qualifies the birth-chart promise; never overrides it.`,
  evidenceName: "RELATIONSHIP CHART EVIDENCE",
  answerTopics: `(timing of marriage,\n     harmony, a proposal, a rough patch, compatibility)`,
  natalPromise:
    `the 7th lord and the houses that matter for this question, and the\n` +
    `     karakas; explain what each means for the relationship. Don't list every placement.`,
  vargaStep: `Marriage chart (Navamsa) — say whether it confirms or qualifies the birth-chart promise.`,
  transitHouses: "the 7th house and the other relationship houses",
  favourable: "what supports warmth, harmony and commitment (always include this)",
  challenging: "what strains or delays it",
  exampleEvent: `"from 22 Nov, when Venus\n     enters your 5th house…"`,
  guidance: "specific: how to communicate, what to avoid, when to take a step — kind and practical",
  limits:
    `tendencies and favourable windows, not fixed fate, and that a relationship is shaped\n` +
    `     by both people's choices; for serious conflict, counselling or trusted support helps`,
  rules: [
    `• Never predict divorce, separation, a partner's illness or death, or infidelity.`,
    `• No fear-based dosha talk (e.g. Manglik); if a factor is challenging, say how to work with it.`,
    `• Never tell them to stay in or leave a relationship; offer perspective, not verdicts.`,
  ],
};

GOLD_PHRASES.family = {
  evidenceName: "FAMILY CHART EVIDENCE",
  meansFor: "for their family",
  lifeArea: "family and home life",
  reasoningExample:
    `"the Moon rules your 2nd and sits in the 7th,\n` +
    `  so family warmth grows through the people you bring into it".`,
  vargaRule: `Call the D12 "your parents chart (Dwadashamsha)"; never write D1/D12.`,
  limitsCheck: "says astrology shows tendencies and that family life is shaped by everyone's choices",
  summaryFormat:
    `  FAMILY format (Gold Standard):\n` +
    `    Overall Family Life: ★★★★☆ (Supportive / Steady / Needs Care / Strained)\n` +
    `    Focus: [parents / mother / father / siblings / children / harmony at home]\n` +
    `    Supporting Factor: [1 phrase naming the chart factor]\n` +
    `    Needs Attention: [1 phrase naming the chart factor]\n` +
    `    Best Window: [a FAVOURABLE or MIXED date range from TIMING EVIDENCE; if every window is CAUTION, "None this period"]\n` +
    `    Evidence Strength: [Strong / Moderate / Weak / Insufficient]\n` +
    `    Best Approach: [1 specific practical phrase]\n`,
};

PARTS.family = {
  title: "FAMILY",
  natalFramework:
    `the 4th house (mother, home) and its lord, then the houses that fit\n` +
    `     THIS question: 9th (father, elders), 3rd (siblings), 2nd (the family unit), 5th (children),\n` +
    `     12th (distance from family); and the karakas Moon, Sun, Mars and Jupiter.`,
  varga: `Parents chart (Dwadashamsha) — confirms or qualifies the birth-chart promise; never overrides it.`,
  evidenceName: "FAMILY CHART EVIDENCE",
  answerTopics: `(parents, siblings,\n     children, harmony at home, a family decision)`,
  natalPromise:
    `the lord of the house that fits the question (4th for mother and home, 9th for\n` +
    `     father, 3rd for siblings, 5th for children) and the karakas; explain what each means for the family.`,
  vargaStep: `Parents chart (Dwadashamsha) — say whether it confirms or qualifies the birth-chart picture.`,
  transitHouses: "the 4th house and the other family houses",
  favourable: "what supports warmth and understanding at home (always include this)",
  challenging: "what strains family ties",
  exampleEvent: `"from 16 Dec, when the Sun\n     enters your 4th house…"`,
  guidance: "specific: how to approach the people involved, what to avoid, when to talk — kind and practical",
  limits:
    `tendencies and favourable windows, not fixed fate, and that family life is shaped by\n` +
    `     everyone's choices; health or legal family matters need the right professional`,
  rules: [
    `• Never predict a parent's, sibling's or child's illness, accident or death.`,
    `• Never blame a family member or take sides; offer perspective, not verdicts.`,
    `• No fear-based dosha talk; if a factor is challenging, say how to work with it.`,
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
