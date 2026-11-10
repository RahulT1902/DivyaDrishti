/**
 * ChatPundit Gold Standard v1.0 — response rubric.
 * Spec: docs/CHATPUNDIT_GOLD_STANDARD_v1.md
 *
 * Deterministic checks of one Pundit answer against the standard's five
 * acceptance questions and its hard rules. Pass it the LLM narrative only
 * (no summary card, no server-written basis paragraph), otherwise the
 * templated parts satisfy the dasha/lordship checks on the model's behalf.
 *
 * These are text-level heuristics: they show whether the required reasoning
 * is present and whether forbidden patterns appear, not whether the
 * astrology is wise. Read the answers alongside the score.
 */

import {
  validateInterpretationFacts,
  validateInterpretationSynthesis,
  type ChartFacts,
} from "@/lib/core/astrology/chartFacts";
import { withoutVargaSentences } from "../timing/claimValidator";

export const GOLD_STANDARD_VERSION = "1.0";

/** §10: wording that tells the reader astrology does not replace medical care. */
export const MEDICAL_SAFETY_RE = /\b(?:doctors?|physicians?|medical (?:advice|care|professionals?|attention|diagnosis|treatment)|not a (?:medical )?diagnosis|health ?care (?:providers?|professionals?)|consult a)\b/i;

/** Finance: wording that says this is not financial or investment advice. */
export const FINANCIAL_SAFETY_RE = /\b(?:(?:financial|investment) advice|(?:qualified|certified|professional|financial|investment)\s+(?:professional\s+|financial\s+)?(?:advis[eo]rs?|planners?)|consult (?:a|an) (?:qualified |certified )?(?:financial|investment))\b/i;

/** Property: not financial/legal advice, or a direction to check documents and title. */
export const PROPERTY_SAFETY_RE = /\b(?:(?:financial|legal|investment)(?: or (?:financial|legal|investment))? advice|(?:qualified|certified|professional|financial|legal)\s+(?:advis[eo]rs?|experts?|professionals?)|lawyers?|advocates?|(?:check|verify|review)(?:ing)? (?:the |all )?(?:documents|papers|paperwork|title))\b/i;

export interface RubricCheck {
  id: string;
  /** Which acceptance question (Q1–Q5) or hard rule (R1–R3) this belongs to. */
  criterion: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface RubricResult {
  version: string;
  domain: string;
  score: number;      // passed / total, 0–1
  passed: number;
  total: number;
  checks: RubricCheck[];
}

// Chart factors the standard requires for each domain (§2). Each domain gets
// its own factor set when it migrates (health, career, finance, property, relationship, family, education).
const DOMAIN_FACTORS: Record<string, Array<{ id: string; pattern: RegExp }>> = {
  health: [
    { id: "ascendant", pattern: /\b(?:ascendant|lagna)\b/i },
    { id: "6th house", pattern: /\b(?:6th|sixth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:6th|sixth)\b/i },
    { id: "8th house", pattern: /\b(?:8th|eighth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:8th|eighth)\b/i },
    { id: "12th house", pattern: /\b(?:12th|twelfth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:12th|twelfth)\b/i },
    { id: "Moon", pattern: /\bMoon\b/ },
  ],
  career: [
    { id: "10th house", pattern: /\b(?:10th|tenth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:10th|tenth)\b/i },
    { id: "6th house", pattern: /\b(?:6th|sixth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:6th|sixth)\b/i },
    { id: "2nd/11th house", pattern: /\b(?:2nd|second|11th|eleventh)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:2nd|second|11th|eleventh)\b/i },
    { id: "7th house", pattern: /\b(?:7th|seventh)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:7th|seventh)\b/i },
    { id: "Dashamsha", pattern: /\b(?:Dashamsha|Dasamsa|Dashamsa|career chart)\b/i },
  ],
  finance: [
    { id: "2nd house", pattern: /\b(?:2nd|second)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:2nd|second)\b/i },
    { id: "11th house", pattern: /\b(?:11th|eleventh)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:11th|eleventh)\b/i },
    { id: "5th/9th house", pattern: /\b(?:5th|fifth|9th|ninth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:5th|fifth|9th|ninth)\b/i },
    { id: "12th house", pattern: /\b(?:12th|twelfth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:12th|twelfth)\b/i },
    { id: "Hora", pattern: /\b(?:Hora|wealth chart)\b/i },
  ],
  property: [
    { id: "4th house", pattern: /\b(?:4th|fourth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:4th|fourth)\b/i },
    { id: "2nd/11th house", pattern: /\b(?:2nd|second|11th|eleventh)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:2nd|second|11th|eleventh)\b/i },
    { id: "8th/12th house", pattern: /\b(?:8th|eighth|12th|twelfth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:8th|eighth|12th|twelfth)\b/i },
    { id: "Mars/Venus", pattern: /\b(?:Mars|Venus)\b/ },
    { id: "Chaturthamsha", pattern: /\b(?:Chaturthamsha|Chaturthamsa|property chart)\b/i },
  ],
  relationship: [
    { id: "7th house", pattern: /\b(?:7th|seventh)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:7th|seventh)\b/i },
    { id: "2nd/5th house", pattern: /\b(?:2nd|second|5th|fifth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:2nd|second|5th|fifth)\b/i },
    { id: "8th/12th house", pattern: /\b(?:8th|eighth|12th|twelfth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:8th|eighth|12th|twelfth)\b/i },
    { id: "Venus", pattern: /\bVenus\b/ },
    { id: "Navamsa", pattern: /\b(?:Navamsa|Navamsha|marriage chart)\b/i },
  ],
  family: [
    { id: "4th house", pattern: /\b(?:4th|fourth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:4th|fourth)\b/i },
    { id: "9th/3rd house", pattern: /\b(?:9th|ninth|3rd|third)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:9th|ninth|3rd|third)\b/i },
    { id: "2nd/5th house", pattern: /\b(?:2nd|second|5th|fifth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:2nd|second|5th|fifth)\b/i },
    { id: "Moon/Sun", pattern: /\b(?:Moon|Sun)\b/ },
    { id: "Dwadashamsha", pattern: /\b(?:Dwadashamsha|Dwadasamsa|parents chart)\b/i },
  ],
  education: [
    { id: "4th/5th house", pattern: /\b(?:4th|fourth|5th|fifth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:4th|fourth|5th|fifth)\b/i },
    { id: "9th house", pattern: /\b(?:9th|ninth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:9th|ninth)\b/i },
    { id: "2nd/11th/6th house", pattern: /\b(?:2nd|second|11th|eleventh|6th|sixth)(?:[- ]house|\s+lord)\b|\blord of (?:the |your )?(?:2nd|second|11th|eleventh|6th|sixth)\b/i },
    { id: "Mercury/Jupiter", pattern: /\b(?:Mercury|Jupiter)\b/ },
    { id: "Siddhamsha", pattern: /\b(?:Siddhamsh?a|education chart)\b/i },
  ],
};

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const PLANET_RE = new RegExp(`\\b(?:${PLANETS.join("|")})\\b`);
const sentencesOf = (t: string) => t.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());

export function scoreConsultation(opts: {
  narrative: string;
  domain: string;
  chartFacts: ChartFacts;
  dasha: { mahadasha: string; antardasha: string };
  /** Integrity-gate synthesis score, as used by the chat route. */
  overallScore?: number;
}): RubricResult {
  const { narrative, domain, chartFacts, dasha } = opts;
  const factors = DOMAIN_FACTORS[domain];
  if (!factors) {
    throw new Error(`Gold Standard rubric has no factor set for domain "${domain}" yet (domains migrate one at a time).`);
  }

  const text = narrative.split(/\n\s*Overall Summary/i)[0];
  const sentences = sentencesOf(text);
  const words = text.split(/\s+/).filter(Boolean).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
  const checks: RubricCheck[] = [];
  const add = (c: RubricCheck) => checks.push(c);

  // Q1 — what is the indication? A full consultation needs room for A–J.
  add({
    id: "structure", criterion: "Q1", label: "Full consultation (≥4 paragraphs, ≥250 words)",
    passed: paragraphs >= 4 && words >= 250,
    detail: `${paragraphs} paragraphs, ${words} words`,
  });

  // Q2 — which planetary combinations support it? Dasha, natal, transits.
  // Each phrasing ties the planet directly to the period: "Rahu Mahadasha",
  // "Rahu's major period", "the major Rahu period", "the Mahadasha of Rahu",
  // "the main planetary period under Rahu".
  const md = dasha.mahadasha;
  const mdNamed = [
    `\\b${md}(?:'s)? (?:maha)?dasha\\b`,
    `\\b${md}(?:'s)? (?:major|main) period\\b`,
    `\\b(?:major|main|planetary) ${md} period\\b`,
    `\\b(?:maha)?dasha (?:of|under|ruled by) ${md}\\b`,
    `\\b(?:major|main|planetary) period (?:of|under|ruled by) ${md}\\b`,
  ].some(p => new RegExp(p, "i").test(text));
  const adNamed = new RegExp(`\\b${dasha.antardasha}\\b`, "i").test(text) && /\b(?:antar|sub-?period|bhukti)/i.test(text);
  add({
    id: "dasha", criterion: "Q2", label: "Names the active Mahadasha and Antardasha",
    passed: mdNamed && adNamed,
    detail: `Mahadasha ${dasha.mahadasha}: ${mdNamed ? "yes" : "no"}; Antardasha ${dasha.antardasha}: ${adNamed ? "yes" : "no"}`,
  });

  const found = factors.filter(f => f.pattern.test(text)).map(f => f.id);
  add({
    id: "multi-factor", criterion: "Q2", label: "Uses ≥3 of the domain's natal factors",
    passed: found.length >= 3,
    detail: `found ${found.length}/${factors.length}: ${found.join(", ") || "none"}`,
  });

  const transitSentence = sentences.find(s => /\btransit/i.test(s) && PLANET_RE.test(s));
  add({
    id: "transit", criterion: "Q2", label: "Explains a current transit by planet",
    passed: !!transitSentence,
    detail: transitSentence ? `"${transitSentence.trim().slice(0, 90)}"` : "no sentence names a transiting planet",
  });

  // Q3 — what contradicts or mitigates it? A balancing factor tied to the chart.
  const MITIGATION = /\b(?:however|but|on the other hand|offsets?|mitigat\w*|protect\w*|balanc\w*|soften\w*|counter\w*|eases?|cushion\w*)\b/i;
  const mitigation = sentences.find(s => MITIGATION.test(s) && (PLANET_RE.test(s) || /\bhouse\b/i.test(s)));
  add({
    id: "mitigation", criterion: "Q3", label: "Names a contradicting or protective chart factor",
    passed: !!mitigation,
    detail: mitigation ? `"${mitigation.trim().slice(0, 90)}"` : "no balancing factor tied to a planet or house",
  });

  // Q4 — when is it relevant? No arbitrary durations (§8).
  const DURATION = /\b\d+\s*(?:–|-|to)\s*\d+\s*(?:days?|weeks?|months?)\b|\b(?:in|within|for) (?:a few|\d+) (?:days?|weeks?)\b/i;
  const GROUNDED = /\b(?:dasha|antardasha|transit\w*|until|while|as long as)\b/i;
  const arbitrary = sentences.filter(s => DURATION.test(s) && !GROUNDED.test(s));
  add({
    id: "timing", criterion: "Q4", label: "Timing tied to dasha/transits, no arbitrary durations",
    passed: arbitrary.length === 0,
    detail: arbitrary.length ? `ungrounded: "${arbitrary[0].trim().slice(0, 90)}"` : "no ungrounded durations",
  });

  // Q5 — how confident? Qualitative evidence strength (§7).
  const confidence = /\b(?:evidence|indications?|signals?|support)\b[^.]{0,40}\b(?:strong|moderate|weak|insufficient|mixed|limited)\b|\b(?:strong|moderate|weak|insufficient|mixed|limited)\b[^.]{0,20}\b(?:evidence|indications?|confidence|support)\b|\bconfiden(?:t|ce)\b/i;
  const confidenceSentence = sentences.find(s => confidence.test(s));
  add({
    id: "confidence", criterion: "Q5", label: "States qualitative evidence strength",
    passed: !!confidenceSentence,
    detail: confidenceSentence ? `"${confidenceSentence.trim().slice(0, 90)}"` : "no strength/confidence statement",
  });

  // R1 — no manufactured numeric probabilities (§7).
  const pct = text.match(/\b\d{1,3}\s?%/);
  add({
    id: "no-percent", criterion: "R1", label: "No numeric probabilities",
    passed: !pct, detail: pct ? `found "${pct[0]}"` : "none",
  });

  // R2 — medical safety (§10).
  if (domain === "health") {
    const safety = MEDICAL_SAFETY_RE.test(text);
    add({
      id: "medical-safety", criterion: "R2", label: "Says astrology doesn't replace medical care",
      passed: safety, detail: safety ? "present" : "missing",
    });
  }
  if (domain === "finance") {
    const safety = FINANCIAL_SAFETY_RE.test(text);
    add({
      id: "financial-safety", criterion: "R2", label: "Says this is not financial or investment advice",
      passed: safety, detail: safety ? "present" : "missing",
    });
  }
  if (domain === "property") {
    const safety = PROPERTY_SAFETY_RE.test(text);
    add({
      id: "property-safety", criterion: "R2", label: "Says it is not financial/legal advice or to check documents",
      passed: safety, detail: safety ? "present" : "missing",
    });
  }

  // R3 — chart facts correct (the chat route's integrity gate).
  const gate = [
    // Divisional-chart sentences ("the property chart's 4th lord Jupiter") have their own lords; the live gate checks them separately.
    ...validateInterpretationFacts(chartFacts, withoutVargaSentences(text)).errors,
    ...validateInterpretationSynthesis({ conclusion: { overallScore: opts.overallScore ?? 50 } }, text).errors,
  ];
  add({
    id: "integrity", criterion: "R3", label: "No wrong lordships/placements or certainty claims",
    passed: gate.length === 0, detail: gate.length ? gate[0].slice(0, 110) : "clean",
  });

  const passed = checks.filter(c => c.passed).length;
  return { version: GOLD_STANDARD_VERSION, domain, score: passed / checks.length, passed, total: checks.length, checks };
}
