// Pundit Brain — Orchestrator
//
// Runs all layers in sequence and produces the LLM brief.
//
// The key architectural shift:
//   Before → LLM receives raw chart data and "narrates from it"
//   After  → LLM receives pre-computed conclusions and "says them as a human would"
//
// The MRI is not the diagnosis. The LLM never sees the MRI.
// It only sees: what the astrologer concluded, and what to say next.

import type { AstrologyContext, DashaInfo } from "../../core/types";
import type { StoredDomainMemory } from "../sessionMemory";
import type { PunditBrainContext, PunditBrainOutput, NotebookEntry } from "./types";

import { assimilateReality, loadNotebook } from "./L0_realityAssimilation";
import { analyzeIntent }                   from "./L1_intentEngine";
import { buildUserState }                  from "./L2_userStateEngine";
import { buildLifeStory }                  from "./L3_lifeStoryEngine";
import { runDiagnosticEngine }             from "./L4_diagnosticEngine";
import { buildObservations }               from "./L5_observationEngine";
import { buildReasoningChain }             from "./L6_reasoningEngine";
import { buildPersonality }                from "./L7_personalityEngine";
import { planResponse, buildAnswerPlan, renderSummaryCard } from "./L8_responsePlanner";

// ── System prompt builder ─────────────────────────────────────────────────────
// This is the LLM's entire world. It contains conclusions only — never chart data.
// The rule: if a sentence could come from a chart report, it doesn't belong here.

function buildSystemPrompt(ctx: PunditBrainContext, notebookHistory: NotebookEntry[]): string {
  const { realityContext, intent, userState, lifeStory, answerPlan, personality, responsePlan } = ctx;

  const sections: string[] = [];

  // ── Identity ──────────────────────────────────────────────────────────────
  sections.push(
    `You are the Pundit — a Vedic astrologer who has known this person for months.\n` +
    `You speak with the quiet confidence of someone who has done this for decades.\n` +
    `You remember their story. You don't repeat yourself. You answer questions, not charts.`
  );

  // ── Pre-computed conclusions (the only astrological content the LLM sees) ──
  const probLines = answerPlan.probabilities.length
    ? answerPlan.probabilities.map(p => `  ${p.label}: ${p.value}%`).join("\n")
    : "";

  sections.push(
    `━━━ YOUR CONCLUSIONS — speak from these, not from chart data ━━━\n` +
    `THE ANSWER:       ${answerPlan.directAnswer}\n` +
    `CONFIDENCE:       ${answerPlan.confidence} (${answerPlan.confidencePercent}%)\n` +
    (probLines ? `PROBABILITIES:\n${probLines}\n` : "") +
    (answerPlan.timeline ? `TIMELINE:         ${answerPlan.timeline}\n` : "") +
    `OBSERVATION:      ${answerPlan.mainObservation}\n` +
    (answerPlan.unexpectedObservation
      ? `WHAT STANDS OUT:  ${answerPlan.unexpectedObservation}\n`
      : "") +
    `RECOMMENDATION:   ${answerPlan.recommendation}`
  );

  // ── Conversation context (minimal — only what changes this reading) ────────
  const ctx_parts: string[] = [];

  if (lifeStory?.events.length) {
    ctx_parts.push(`Their story so far (${intent.domain}): ${lifeStory.storyLine}`);
  }
  if (realityContext.newEvents.length > 0) {
    ctx_parts.push(`Just happened: ${realityContext.newEvents.map(e => e.eventType).join(", ")}`);
  }
  if (realityContext.validatedPredictions.length > 0) {
    ctx_parts.push(`Your prior prediction was confirmed: "${realityContext.validatedPredictions[0].prediction}"`);
  }
  if (realityContext.correction) {
    ctx_parts.push(`They're correcting something you said: "${realityContext.correction.newFact.slice(0, 100)}"`);
  }
  if (userState.currentConcerns.length > 0) {
    ctx_parts.push(`What they're worried about: ${userState.currentConcerns.join(", ")}`);
  }
  if (responsePlan.referenceHistory) {
    ctx_parts.push(`Reference naturally: "${responsePlan.referenceHistory}"`);
  }
  if (notebookHistory.length > 0) {
    const recent = notebookHistory.slice(-3).map(e => `  ${e.date}: ${e.observation}`).join("\n");
    ctx_parts.push(`Consultation log:\n${recent}`);
  }

  if (ctx_parts.length) {
    sections.push(`━━━ CONTEXT ━━━\n${ctx_parts.join("\n")}`);
  }

  // ── Tone ──────────────────────────────────────────────────────────────────
  const toneHints: Record<string, string> = {
    celebratory: `Open with genuine warmth. They've earned some good news — let them feel it.`,
    reassuring:  `They may be anxious. Answer first, reassure second. Don't dismiss their worry.`,
    empathetic:  `They're going through something hard. Answer briefly, then acknowledge the weight of it.`,
    cautious:    `Be honest. Don't soften the truth into meaninglessness. Honesty IS the reassurance.`,
    warning:     `State the concern once, clearly. Then give them something constructive to do about it.`,
    direct:      `No preamble. Answer. Explain. Done.`,
  };
  sections.push(`━━━ TONE ━━━\n${toneHints[personality.tone] ?? toneHints.direct}`);

  // ── Rules (the contract — every line is enforced) ─────────────────────────
  sections.push(
    `━━━ RULES — EVERY ONE IS NON-NEGOTIABLE ━━━\n\n` +

    `1. FIRST SENTENCE = THE ANSWER. Start with it. No preamble.\n` +
    `   "Your health looks stable today." — not "Based on the current alignment..."\n\n` +

    `2. NEVER MENTION: planet names, house numbers, Sun%, Rahu, dasha names, yoga names, transit scores.\n` +
    `   The MRI is not the diagnosis. State the diagnosis. Leave the MRI inside the machine.\n` +
    `   ✓ "Your vitality looks strong."  ✗ "The Sun is at 65% strength."\n` +
    `   ✓ "I don't see a trigger for illness."  ✗ "Saturn's transit to the 6th house..."\n\n` +

    `3. NO HEDGING. Replace every hedging word:\n` +
    `   ✗ "might", "could", "perhaps", "generally", "typically", "may indicate"\n` +
    `   ✓ "I don't see", "I'd expect", "the reading shows", "I'm not concerned", "this suggests"\n\n` +

    `4. VARY YOUR OPENING. Don't start every answer the same way.\n` +
    `   Sometimes: "Good news —"  Sometimes: "Let me answer that directly."\n` +
    `   Sometimes: "One thing does stand out..."  Sometimes: "Honestly, I wouldn't worry."\n` +
    `   Sometimes: "The first thing I noticed when I looked at this..."\n\n` +

    `5. INCLUDE WHAT STANDS OUT naturally — as if you just noticed it, not as a separate section.\n` +
    `   Weave it in: "What actually catches my attention isn't your health — it's..."\n\n` +

    `6. END WITH THE RECOMMENDATION. One or two sentences. Direct and practical.\n` +
    `   Tell them what to DO, not what the chart says.\n\n` +

    `7. TARGET LENGTH: ${responsePlan.targetLength}\n` +
    `   Over-explaining is a failure mode. A senior astrologer often answers in one paragraph.\n\n` +

    `8. Write as a person speaks, not as a report reads.\n` +
    `   If you read it back and it sounds like an article — rewrite it.`
  );

  return sections.join("\n\n");
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function assemblePunditBrain(
  question:    string,
  history:     Array<{ role: string; content: string }>,
  userId:      string,
  memories:    StoredDomainMemory[],
  symbolicCtx: AstrologyContext,
  dashaInfo:   DashaInfo | undefined,
  domain:      string,
): Promise<PunditBrainOutput> {

  // Layer 0: Reality Assimilation — must run first
  const [realityContext, notebookHistory] = await Promise.all([
    assimilateReality(question, history, userId, memories, domain),
    loadNotebook(userId, domain),
  ]);

  // Early exit: clarification question
  if (realityContext.clarification) {
    return {
      systemPrompt:        "",
      userPrompt:          "",
      temperature:         0.70,
      lifeStory:           null,
      clarification:       realityContext.clarification,
      renderedSummaryCard: "",
      metadata: { domain, tone: "direct", depth: "quick", subIntents: [] },
    };
  }

  // Layer 1: Intent
  const intent = analyzeIntent(question, history);

  // Layer 2: User State
  const userState = buildUserState(history, memories, dashaInfo, intent.emotionalTone);

  // Layer 3: Life Story
  const domainMemory = memories.find(m => m.domain === domain);
  const lifeStory    = await buildLifeStory(userId, domain, history, domainMemory);

  // Layer 4: Diagnosis
  const diagnosis = runDiagnosticEngine(symbolicCtx, dashaInfo, domain);

  // Layer 5: Observations
  const observations = buildObservations(domain, diagnosis, memories, symbolicCtx);

  // Layer 6: Reasoning
  const reasoning = buildReasoningChain(intent, userState, diagnosis, lifeStory, memories);

  // Layer 7: Personality
  const personality = buildPersonality(intent, diagnosis, userState);

  // Layer 8a: Response Plan
  const responsePlan = planResponse(intent, diagnosis, userState, observations, personality, lifeStory, memories);

  // Layer 8b: Answer Plan — pure conclusions, no chart data (what the LLM gets)
  const answerPlan = buildAnswerPlan(intent, diagnosis, lifeStory, observations, reasoning);

  // Assemble context
  const brainContext: PunditBrainContext = {
    realityContext,
    intent,
    userState,
    lifeStory,
    diagnosis,
    observations,
    reasoning,
    personality,
    responsePlan,
    answerPlan,
  };

  // Layer 9: Build LLM brief (conclusions only)
  const systemPrompt = buildSystemPrompt(brainContext, notebookHistory);

  // Pre-render the summary card server-side — LLM never touches it
  const renderedSummaryCard = renderSummaryCard(responsePlan.summaryCard);

  const temperatureMap: Record<string, number> = {
    celebratory: 0.82,
    reassuring:  0.75,
    empathetic:  0.78,
    cautious:    0.65,
    warning:     0.60,
    direct:      0.62,
  };
  const temperature = temperatureMap[personality.tone] ?? 0.70;

  return {
    systemPrompt,
    userPrompt:          question,
    temperature,
    lifeStory,
    clarification:       null,
    renderedSummaryCard,
    metadata: {
      domain,
      tone:       personality.tone,
      depth:      responsePlan.depth,
      subIntents: intent.subIntents,
    },
  };
}

export { saveStoryArc }       from "./L3_lifeStoryEngine";
export type { PunditBrainOutput, PunditBrainContext } from "./types";
