import { callAI } from "@/lib/ai/provider";
import {
  validateInterpretationFacts,
  validateInterpretationSynthesis,
  type ChartFacts,
} from "@/lib/core/astrology/chartFacts";
import { buildAstrologicalBasis, insertAstrologicalBasis } from "@/lib/consultation/astrologicalBasis";
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
}

// Token budget — match the brain's depth decision to the expected word count.
const DEPTH_TOKENS: Record<string, number> = {
  quick:        400,   // 80–120 words
  daily:        600,   // 150–180 words
  consultation: 1200,  // 300–400 words
  year_outlook: 1800,  // 450–550 words
};

// Strip emoji and collapse stray blank lines
const clean = (t: string) => t
  .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
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

  const { text } = await callAI(
    chatMessages
      ? { system: brain.systemPrompt, messages: chatMessages, temperature: brain.temperature, maxTokens }
      : { system: brain.systemPrompt, prompt: brain.userPrompt, temperature: brain.temperature, maxTokens }
  );
  const cleanText = clean(text);

  // Calculation & Synthesis Integrity Validation Gate (Hard Gate)
  const synthReport = {
    conclusion: { overallScore: brain.investigationReport?.conclusion.overallScore ?? 50 },
    evidence: brain.investigationReport?.evidence,
  };
  const gateErrors = (t: string) => [
    ...validateInterpretationFacts(chartFacts, t).errors,
    ...validateInterpretationSynthesis(synthReport, t).errors,
  ];

  // A failed draft is never replaced wholesale (that used to swap a
  // whole health answer for a one-line career sentence). Instead:
  // 1) one rewrite with the exact errors, 2) if that still fails, drop
  // only the offending sentences.
  let validatedText = cleanText;
  const draftErrors = gateErrors(cleanText);
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
            "\nUse only the chart facts you were given and never phrase a prediction as certain or guaranteed.",
        },
      ];
      const { text: retryText } = await callAI({
        system: brain.systemPrompt, messages: retryMessages, temperature: brain.temperature, maxTokens,
      });
      validatedText = clean(retryText);
      errors = gateErrors(validatedText);
    } catch (retryErr) {
      console.error("Hard Gate rewrite failed:", retryErr);
    }
  }
  if (errors.length > 0) {
    console.error("Calculation/Synthesis Integrity Hard Gate Triggered (after rewrite):", errors);
    validatedText = validatedText
      .split("\n")
      .map(line => line
        .split(/(?<=[.!?])\s+/)
        .filter(sentence => gateErrors(sentence).length === 0)
        .join(" "))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  // Never send a card with no answer under it, whatever path got here.
  if (!validatedText.trim()) {
    validatedText = "I couldn't put together a reliable written reading for this question just now. The summary above is drawn from your chart; please ask again in a moment.";
  }

  const narrative = validatedText;

  // Deterministic "why" paragraph from computed chart facts (first
  // answer in a thread only, so follow-ups don't repeat it).
  if (!isFollowUp) {
    validatedText = insertAstrologicalBasis(validatedText, buildAstrologicalBasis(chartFacts, domain, dasha));
  }

  // Prepend the pre-rendered summary card above the LLM narrative
  const fullText = brain.renderedSummaryCard
    ? `${brain.renderedSummaryCard}\n\n${validatedText}`
    : validatedText;

  return { text: fullText, narrative, draftErrors, remainingErrors: errors };
}
