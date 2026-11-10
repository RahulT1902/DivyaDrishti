import { callAI } from "@/lib/ai/provider";
import {
  validateInterpretationFacts,
  validateInterpretationSynthesis,
  type ChartFacts,
} from "@/lib/core/astrology/chartFacts";
import { buildAstrologicalBasis, insertAstrologicalBasis } from "@/lib/consultation/astrologicalBasis";
import { FINANCIAL_SAFETY_RE, MEDICAL_SAFETY_RE, PROPERTY_SAFETY_RE } from "@/lib/consultation/goldStandard/rubric";
import { datesIn, timingCoverageErrors, validateTimingClaims } from "@/lib/consultation/timing/timingValidator";
import { validateChartClaims, withoutVargaSentences } from "@/lib/consultation/timing/claimValidator";
import { renderKeyDates } from "@/lib/consultation/timing/timingEngine";
import type { assemblePunditBrain } from "@/lib/consultation/brain";

type PunditBrain = Awaited<ReturnType<typeof assemblePunditBrain>>;

export interface PunditAnswer {
  /** What the user sees: summary card + validated narrative (+ basis paragraph). */
  text: string;
  /** The LLM-written narrative only, after the gate — no card, no basis paragraph. */
  narrative: string;
  /** Integrity-gate errors on the first draft (empty when it passed). */
  draftErrors: string[];
  /** Errors still present after the rewrite; their sentences were dropped. */
  remainingErrors: string[];
  /** True when the model left out the safety line (medical for health, financial for finance) and the server added it. */
  safetyAdded: boolean;
  /** Sentences removed by the gate, with the reasons — kept so lost predictions are visible. */
  droppedSentences: Array<{ sentence: string; errors: string[] }>;
  /** True when dated content was lost and the computed key-dates paragraph was added instead. */
  keyDatesAdded: boolean;
  /** Provider of the draft, then of the rewrite if there was one (e.g. ["gemini", "groq"]). */
  providers: string[];
}

// Token budget — match the brain's depth decision to the expected word count.
const DEPTH_TOKENS: Record<string, number> = {
  quick:        400,   // 80–120 words
  daily:        900,   // 150–180 words (300–400 for Gold Standard health)
  consultation: 1500,  // 300–400 words (450–600 for Gold Standard health)
  year_outlook: 1800,  // 450–550 words
};

// Strip emoji and collapse stray blank lines. ★/☆ (U+2605/U+2606) sit inside
// the symbol range but are the summary's rating, so they are kept.
const clean = (t: string) => t
  .replace(/(?![★☆])[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

/**
 * LLM narration + integrity gate + basis paragraph + summary card, shared by
 * the chat route and the Gold Standard benchmark so both see the same output.
 */
export async function generatePunditAnswer(opts: {
  brain: PunditBrain;
  history: Array<{ role: string; content: string }>;
  chartFacts: ChartFacts;
  domain: string;
  dasha?: { mahadasha: string; antardasha: string; periodEnd?: string };
  isFollowUp: boolean;
}): Promise<PunditAnswer> {
  const { brain, history, chartFacts, domain, dasha, isFollowUp } = opts;

  // Pass conversation history as messages so follow-up questions have context.
  // When messages is set, the AI SDK uses it over prompt.
  const chatMessages = history.length > 0
    ? [
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: brain.userPrompt },
      ]
    : undefined;

  const maxTokens = DEPTH_TOKENS[brain.metadata.depth] ?? 1200;

  const { text, provider: draftProvider } = await callAI(
    chatMessages
      ? { system: brain.systemPrompt, messages: chatMessages, temperature: brain.temperature, maxTokens }
      : { system: brain.systemPrompt, prompt: brain.userPrompt, temperature: brain.temperature, maxTokens }
  );
  const cleanText = clean(text);
  const providers: string[] = [draftProvider];

  // Calculation & Synthesis Integrity Validation Gate (Hard Gate)
  const synthReport = {
    conclusion: { overallScore: brain.investigationReport?.conclusion.overallScore ?? 50 },
    evidence: brain.investigationReport?.evidence,
  };
  // With the timing engine, every date and dated event claim must match TIMING EVIDENCE.
  const timing = brain.timingEvidence ?? null;
  // Divisional-chart sentences ("the Dashamsha's 10th lord Venus…") are checked
  // against that chart in validateChartClaims; the birth-chart lordship check skips them.
  const varga = brain.goldVarga;
  const gateErrors = (t: string) => [
    ...validateInterpretationFacts(chartFacts, varga ? withoutVargaSentences(t, varga, chartFacts) : t).errors,
    ...validateInterpretationSynthesis(synthReport, t).errors,
    ...(timing ? validateTimingClaims(timing, t).errors : []),
    ...(timing ? validateChartClaims(timing, chartFacts, t, varga).errors : []),
  ];

  // A failed draft is never replaced wholesale (that used to swap a
  // whole health answer for a one-line career sentence). Instead:
  // 1) one rewrite with the exact errors, 2) if that still fails, drop
  // only the offending sentences.
  // Coverage (dasha change mentioned, Pratyantar explained) is judged on the
  // whole answer, so it can trigger the rewrite but not sentence dropping.
  const coverage = (t: string) => (timing ? timingCoverageErrors(timing, t) : []);

  let validatedText = cleanText;
  const draftErrors = [...gateErrors(cleanText), ...coverage(cleanText)];
  let errors = draftErrors;
  if (errors.length > 0) {
    console.error("Calculation/Synthesis Integrity Hard Gate Triggered (draft 1):", errors);
    try {
      const retryMessages = [
        ...(chatMessages ?? [{ role: "user" as const, content: brain.userPrompt }]),
        { role: "assistant" as const, content: cleanText },
        {
          role: "user" as const,
          content:
            "Rewrite your full answer, keeping its length and detail, but fix these problems:\n" +
            errors.map(e => `- ${e}`).join("\n") +
            "\nUse only the chart facts you were given and never phrase a prediction as certain or guaranteed." +
            (timing ? " Every date and dated event must match TIMING EVIDENCE exactly." : ""),
        },
      ];
      const { text: retryText, provider: retryProvider, truncated } = await callAI({
        system: brain.systemPrompt, messages: retryMessages, temperature: brain.temperature, maxTokens,
      });
      providers.push(retryProvider);
      // A cut-off rewrite loses most of the answer; the draft with its bad
      // sentences dropped is better.
      if (truncated) console.warn("Hard Gate rewrite was cut off; keeping the draft");
      else validatedText = clean(retryText);
      errors = [...gateErrors(validatedText), ...coverage(validatedText)];
    } catch (retryErr) {
      console.error("Hard Gate rewrite failed:", retryErr);
    }
  }
  // Coverage gaps that survive the rewrite are logged; sentences are dropped only for false claims.
  const uncovered = coverage(validatedText);
  if (uncovered.length > 0) console.warn("Timing coverage still incomplete after rewrite:", uncovered);
  errors = gateErrors(validatedText);
  const droppedSentences: PunditAnswer["droppedSentences"] = [];
  if (errors.length > 0) {
    console.error("Calculation/Synthesis Integrity Hard Gate Triggered (after rewrite):", errors);
    validatedText = validatedText
      .split("\n")
      .map(line => line
        .split(/(?<=[.!?])\s+/)
        .filter(sentence => {
          const e = gateErrors(sentence);
          if (e.length) droppedSentences.push({ sentence, errors: e });
          return e.length === 0;
        })
        .join(" "))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    console.warn("[Gate] Dropped sentences:", JSON.stringify(droppedSentences));
  }

  // Never silently lose the timing: if a dated sentence was dropped, or the
  // answer still skips a dasha change, add the computed key dates.
  const lostDates = droppedSentences.some(d => datesIn(d.sentence).length > 0);
  const keyDatesAdded = !!timing && timing.segments.length > 0 &&
    (lostDates || timingCoverageErrors(timing, validatedText).some(e => /change around/.test(e)));
  if (keyDatesAdded) validatedText = `${validatedText}\n\n${renderKeyDates(timing!)}`;
  // Never send a card with no answer under it, whatever path got here.
  if (!validatedText.trim()) {
    validatedText = "I couldn't put together a reliable written reading for this question just now. The summary above is drawn from your chart; please ask again in a moment.";
  }

  // Gold Standard §10: a health answer always says astrology is not a medical
  // diagnosis. The prompt asks for it in the model's own words; this is the
  // guarantee when the model leaves it out.
  // Finance and property answers likewise always say they are not financial (or legal) advice.
  const safety: Record<string, { re: RegExp; line: string }> = {
    health: {
      re: MEDICAL_SAFETY_RE,
      line: "Astrology can point to tendencies, but it is not a medical diagnosis. Please see a doctor for any symptom that persists or worries you.",
    },
    finance: {
      re: FINANCIAL_SAFETY_RE,
      line: "Astrology can point to tendencies and timing, but this is not financial or investment advice. Please speak to a qualified financial adviser before any major money decision.",
    },
    property: {
      re: PROPERTY_SAFETY_RE,
      line: "Astrology can point to tendencies and timing, but this is not financial or legal advice. Please check the documents, title and finances with professionals before buying or selling property.",
    },
  };
  const safetyAdded = !!safety[domain] && !safety[domain].re.test(validatedText);
  if (safetyAdded) validatedText = insertAstrologicalBasis(validatedText, safety[domain].line);

  const narrative = validatedText;

  // Deterministic "why" paragraph from computed chart facts (first
  // answer in a thread only, so follow-ups don't repeat it).
  // Skipped for Gold Standard answers: they already explain the dasha, lords
  // and transits in the narrative, so the paragraph would only repeat them.
  if (!isFollowUp && !brain.metadata.goldStandard) {
    validatedText = insertAstrologicalBasis(validatedText, buildAstrologicalBasis(chartFacts, domain, dasha));
  }

  // Prepend the pre-rendered summary card above the LLM narrative
  const fullText = brain.renderedSummaryCard
    ? `${brain.renderedSummaryCard}\n\n${validatedText}`
    : validatedText;

  return { text: fullText, narrative, draftErrors, remainingErrors: errors, safetyAdded, droppedSentences, keyDatesAdded, providers };
}
