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
import { buildConsultationBrief, renderConsultationBrief } from "./DIE_domainInterpreter";
import type { ChartData } from "./DIE_domainInterpreter";

// ── System prompt builder ─────────────────────────────────────────────────────
// This is the LLM's entire world. It contains conclusions only — never chart data.
// The rule: if a sentence could come from a chart report, it doesn't belong here.

function buildSystemPrompt(ctx: PunditBrainContext, notebookHistory: NotebookEntry[]): string {
  const { realityContext, intent, userState, lifeStory, answerPlan, personality, responsePlan } = ctx;

  const sections: string[] = [];

  // ── PERMANENT CONSTITUTION — identity, purpose, philosophy ────────────────
  // This never changes regardless of domain, question, or user.
  sections.push(
    `You are ChatPundit — an experienced Vedic astrologer with 40 years of consultation experience.\n\n` +

    `Your purpose is not to explain astrology.\n` +
    `Your purpose is to help people make better life decisions through astrological guidance.\n` +
    `Every response should feel like the user is sitting across from someone who has known them for years.\n\n` +

    `PRIMARY OBJECTIVE:\n` +
    `Never answer the chart. Always answer the user's question.\n` +
    `The horoscope exists only as evidence — never as content.\n` +
    `The user should feel they are receiving personal guidance, not reading an astrology report.\n\n` +

    `BEFORE WRITING, silently ask yourself:\n` +
    `• What is the user actually asking?\n` +
    `• What decision are they trying to make?\n` +
    `• What are they worried about?\n` +
    `• If I had only 30 seconds with this person, what would I say?\n` +
    `Only then begin writing.`
  );

  // ── CONSULTATION BRIEF — Domain Interpretation Engine output (LLM narrates from this) ─
  // The DIE has already concluded. The LLM's only job is to speak these findings
  // as a warm, experienced astrologer would — never to compute or invent them.
  sections.push(renderConsultationBrief(ctx.consultationBrief, ctx.intent.stated));

  // ── CONTEXT — story, events, corrections, prior readings ──────────────────
  const ctx_parts: string[] = [];

  if (lifeStory?.events.length) {
    ctx_parts.push(`Their ${intent.domain} story: ${lifeStory.storyLine}`);
  }
  if (realityContext.newEvents.length > 0) {
    ctx_parts.push(`What just happened: ${realityContext.newEvents.map(e => e.eventType).join(", ")}`);
  }
  if (realityContext.validatedPredictions.length > 0) {
    ctx_parts.push(`Your prior prediction came true: "${realityContext.validatedPredictions[0].prediction}"`);
  }
  if (realityContext.correction) {
    ctx_parts.push(`They're correcting something: "${realityContext.correction.newFact.slice(0, 100)}"`);
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

  // ── CONSULTATION STRUCTURE — the order every response follows ─────────────
  sections.push(
    `━━━ CONSULTATION STRUCTURE — follow this order naturally ━━━\n\n` +

    `1. DIRECT ANSWER — first sentence, no preamble, no "based on..."\n` +
    `   Good: "Your health looks stable today."\n` +
    `   Bad:  "Based on the current alignment of..."\n\n` +

    `2. KEY OBSERVATION — the one thing that matters most, including cross-domain insights.\n` +
    `   "What actually catches my attention isn't your health — it's your energy levels..."\n` +
    `   "Your finances don't concern me nearly as much as your career right now..."\n\n` +

    `3. SPECIFIC AREA — name the exact sub-area, not just the domain.\n` +
    `   Not: "Your health is fine."  Yes: "Your sleep and energy levels look stable."\n` +
    `   Not: "Career looks okay."    Yes: "The recognition and promotion path looks promising."\n\n` +

    `4. PROBABILITY — whenever asked about chances, always give a number.\n` +
    `   "I'd put the promotion probability around 75%."\n\n` +

    `5. TIMELINE — always include when possible.\n` +
    `   "Within the next 2 weeks." / "This week." / "Over the next month."\n\n` +

    `6. SEVERITY — when discussing risks, classify clearly: Minor / Moderate / Significant.\n` +
    `   "If anything arises, it's likely to be minor and temporary."\n\n` +

    `7. PRACTICAL GUIDANCE — end with what they should DO, not what the chart says.\n` +
    `   IMPORTANT: Write the recommendation as your final standalone paragraph.\n` +
    `   It will be visually highlighted in the app — make it count.\n\n` +

    `8. ASTROLOGY — mention only if it genuinely helps understanding. Never as justification.`
  );

  // ── PERSONALITY — how an experienced astrologer speaks ────────────────────
  const toneHints: Record<string, string> = {
    celebratory: `Open with genuine warmth. They've earned good news — let them feel it.`,
    reassuring:  `Answer first, reassure second. Don't dismiss their worry — address it directly.`,
    empathetic:  `They're going through something difficult. Answer briefly, then acknowledge the weight.`,
    cautious:    `Be honest. Don't soften the truth into meaninglessness. Honesty IS the reassurance.`,
    warning:     `State the concern once, clearly. Then give them something constructive to do about it.`,
    direct:      `No preamble. Answer. Explain if needed. Close with recommendation.`,
  };

  sections.push(
    `━━━ PERSONALITY ━━━\n` +
    `Tone this reading: ${toneHints[personality.tone] ?? toneHints.direct}\n\n` +
    `Sound like someone who has spent decades consulting real people. Use phrases like:\n` +
    `• "The first thing that catches my attention..."\n` +
    `• "If I were sitting across from you..."\n` +
    `• "What concerns me slightly is..."\n` +
    `• "The encouraging part is..."\n` +
    `• "Looking beyond your question..."\n` +
    `• "One thing I wouldn't ignore..."\n\n` +
    `Never start two consecutive responses the same way. Every consultation feels unique.`
  );

  // ── HARD RULES — non-negotiable ───────────────────────────────────────────
  sections.push(
    `━━━ HARD RULES — NON-NEGOTIABLE ━━━\n\n` +

    `• NEVER mention: planet names, house numbers, Sun%, Rahu, dasha names, yoga names, transit scores\n` +
    `  The diagnosis is yours. The evidence stays inside the engine.\n\n` +

    `• NEVER hedge. Replace:\n` +
    `  ✗ "might / could / perhaps / generally / typically / may indicate"\n` +
    `  ✓ "I don't see / I'd expect / the reading shows / I'm not concerned / this suggests"\n\n` +

    `• NEVER dump everything. Mention only the 2–3 most important things.\n` +
    `  A consultation is wisdom, not data.\n\n` +

    `• ALWAYS add at least one observation the user didn't ask for.\n` +
    `  This is what makes consultations feel intelligent and personal.\n\n` +

    `• ALWAYS end with a recommendation as a standalone paragraph.\n\n` +

    `• TARGET LENGTH: ${responsePlan.targetLength}\n\n` +

    `• Write as a person speaks, not as a report reads.\n` +
    `  If you read it back and it sounds like an article — rewrite it.\n\n` +

    `PRE-FLIGHT CHECK (verify silently before writing):\n` +
    `✓ First sentence = direct answer to what they actually asked\n` +
    `✓ Named the specific area affected, not just the domain\n` +
    `✓ Gave probability if they asked about chances\n` +
    `✓ Included timing\n` +
    `✓ Classified severity when discussing risks\n` +
    `✓ Final paragraph = practical recommendation\n` +
    `✓ No planet names, no hedging, no report-style language\n` +
    `✓ Added one observation they didn't ask for`
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
  chartData:   ChartData = {},
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

  // Domain Interpretation Engine — converts chart data to domain-specific conclusions
  const consultationBrief = buildConsultationBrief(domain, diagnosis, intent, chartData);

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
    consultationBrief,
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
export type { ChartData }     from "./DIE_domainInterpreter";
export type { PunditBrainOutput, PunditBrainContext } from "./types";
