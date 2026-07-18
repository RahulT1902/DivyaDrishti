// Pundit Brain — Orchestrator
//
// Runs all 10 layers in sequence and produces the structured LLM brief.
// Layer 10 (the LLM call itself) happens in route.ts.
//
// The key architectural shift:
//   Before → LLM receives raw chart data + question
//   After  → LLM receives a fully processed brief and simply narrates
//
// The output systemPrompt is everything the Pundit needs to know.
// The userPrompt is just the question — all context is in the system.

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
import { planResponse }                    from "./L8_responsePlanner";

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: PunditBrainContext, notebookHistory: NotebookEntry[]): string {
  const { realityContext, intent, userState, lifeStory, diagnosis, observations, reasoning, personality, responsePlan } = ctx;

  const sections: string[] = [];

  // Identity
  sections.push(
    `You are the Pundit — a Vedic astrologer who has been consulting with this person for months. ` +
    `You know their chart intimately. You remember everything from previous conversations. ` +
    `You never repeat predictions. You always continue their life story. ` +
    `You speak with the confidence and warmth of a seasoned astrologer — not a chatbot.`
  );

  // ── Layer 0: Reality Update ───────────────────────────────────────────────
  const hasRealityUpdate =
    realityContext.newEvents.length > 0 ||
    realityContext.storyUpdate !== null ||
    realityContext.validatedPredictions.length > 0 ||
    realityContext.correction !== null;

  if (hasRealityUpdate) {
    const parts: string[] = [`═══ REALITY UPDATE — WHAT HAS CHANGED SINCE LAST TIME ═══`];

    if (realityContext.newEvents.length > 0) {
      parts.push(
        `New facts from this message:\n` +
        realityContext.newEvents.map(e => `  • ${e.eventType} (${e.timeRef})`).join("\n")
      );
    }
    if (realityContext.storyUpdate) {
      const { fromStage, toStage, domain } = realityContext.storyUpdate;
      parts.push(`Story arc advanced: ${fromStage} → ${toStage} (${domain})`);
    }
    if (realityContext.validatedPredictions.length > 0) {
      parts.push(
        `Predictions confirmed by user:\n` +
        realityContext.validatedPredictions.map(p => `  ✓ "${p.prediction}" — ${p.status}`).join("\n")
      );
    }
    if (realityContext.correction) {
      parts.push(
        `User is correcting a prior assessment:\n` +
        `  New fact: "${realityContext.correction.newFact.slice(0, 150)}"`
      );
    }

    sections.push(parts.join("\n"));
  }

  // ── Pundit's Notebook (longitudinal consultation log) ─────────────────────
  if (notebookHistory.length > 0) {
    const recent = notebookHistory.slice(-5);
    sections.push(
      `═══ PUNDIT'S NOTEBOOK (consultation log — your longitudinal memory) ═══\n` +
      recent.map(e => `${e.date} • ${e.observation}`).join("\n")
    );
  }

  // ── Layer 1: What they actually want to know ──────────────────────────────
  sections.push(
    `═══ WHAT THEY ACTUALLY WANT TO KNOW ═══\n` +
    `They asked: "${intent.stated}"\n` +
    `Emotional state: ${intent.emotionalTone} | Urgency: ${intent.urgency}\n` +
    `But what they really want to know:\n` +
    intent.subIntents.map(s => `  • ${s}`).join("\n")
  );

  // ── Layer 2: Where this person is right now ───────────────────────────────
  sections.push(
    `═══ WHERE THIS PERSON IS RIGHT NOW ═══\n` +
    `Dasha: ${userState.dashaPhase}\n` +
    `Dasha alignment for ${intent.domain}: ${userState.dashaAlignment}\n` +
    `Life phases:\n` +
    `  Career: ${userState.lifePhases.career}\n` +
    `  Health: ${userState.lifePhases.health}\n` +
    `  Finance: ${userState.lifePhases.finance}\n` +
    `  Relationship: ${userState.lifePhases.relationship}\n` +
    `Mental state: ${userState.mentalState}\n` +
    (userState.currentConcerns.length ? `Current concerns: ${userState.currentConcerns.join(", ")}` : "")
  );

  // ── Layer 3: Life story (continue from here) ──────────────────────────────
  if (lifeStory) {
    sections.push(
      `═══ THEIR STORY — CONTINUE FROM HERE ═══\n` +
      `${intent.domain.charAt(0).toUpperCase() + intent.domain.slice(1)} arc: ${lifeStory.storyLine}\n` +
      `Current chapter: ${lifeStory.currentStage}\n` +
      (lifeStory.nextChapter ? `The chapter that follows: ${lifeStory.nextChapter}` : "")
    );
  }

  // ── Layer 4: Internal astrological diagnosis ──────────────────────────────
  sections.push(
    `═══ INTERNAL DIAGNOSIS (your pre-computed reading — do not expose raw notes) ═══\n` +
    `Domain: ${diagnosis.domain}\n` +
    `State: ${diagnosis.overallState} (${diagnosis.probability}% probability for main concern)\n` +
    `Confidence: ${diagnosis.confidence}\n` +
    (diagnosis.supportingFactors.length
      ? `What supports: ${diagnosis.supportingFactors.join("; ")}`
      : "") +
    (diagnosis.challengingFactors.length
      ? `\nWhat creates friction: ${diagnosis.challengingFactors.join("; ")}`
      : "") +
    `\nDasha: ${diagnosis.dashaAlignment} | Transits: ${diagnosis.transitAlignment}` +
    (diagnosis.timeline ? `\nTiming window: ${diagnosis.timeline}` : "") +
    (diagnosis.keyPlanet ? `\nKey planet: ${diagnosis.keyPlanet}` : "")
  );

  // ── Layer 5: What stands out (observations) ───────────────────────────────
  sections.push(
    `═══ WHAT STANDS OUT ═══\n` +
    observations.primaryObservation +
    (observations.crossDomainInsight ? `\nCross-domain: ${observations.crossDomainInsight}` : "") +
    (observations.proactiveNotes.length
      ? `\nAlso worth noting:\n${observations.proactiveNotes.map(n => `  • ${n}`).join("\n")}`
      : "")
  );

  // ── Layer 6: Reasoning (do not expose steps directly) ────────────────────
  sections.push(
    `═══ YOUR REASONING (internal — weave conclusions into answer, don't list steps) ═══\n` +
    reasoning.steps.join("\n") + "\n" +
    `Conclusion: ${reasoning.conclusion}\n` +
    `Key factor: ${reasoning.keyFactor}` +
    (reasoning.uncertainties.length
      ? `\nUncertainties: ${reasoning.uncertainties.join("; ")}`
      : "")
  );

  // ── 6 Silent questions ────────────────────────────────────────────────────
  const [sq1, sq2, sq3, sq4, sq5, sq6] = reasoning.silentQuestions;
  sections.push(
    `═══ 6 QUESTIONS YOU'VE ANSWERED INTERNALLY ═══\n` +
    `1. What are they actually worried about? → ${sq1 ?? "Seeking clarity"}\n` +
    `2. What happened since last conversation? → ${sq2 ?? "No prior history"}\n` +
    `3. What prediction has manifested? → ${sq3 ?? "Nothing confirmed yet"}\n` +
    `4. What is changing now? → ${sq4 ?? "Conditions are stable"}\n` +
    `5. What should they know next? → ${sq5 ?? "Patience is the theme"}\n` +
    `6. What advice would you naturally give? → ${sq6 ?? "Stay consistent with current energy"}`
  );

  // ── Layer 7: Response plan ────────────────────────────────────────────────
  const plan = responsePlan;
  const includeList = Object.entries(plan.includeSections)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase().trim())
    .join(", ");

  sections.push(
    `═══ RESPONSE PLAN ═══\n` +
    `Length: ${plan.targetLength}\n` +
    (includeList ? `Include: ${includeList}` : "Include: core reading only") +
    (plan.referenceHistory ? `\nOpen by referencing: "${plan.referenceHistory}"` : "") +
    (plan.openWithObservation ? "\nOpen with the cross-domain observation first" : "")
  );

  // ── Layer 8: Pundit DNA ───────────────────────────────────────────────────
  sections.push(
    `═══ YOUR VOICE (Pundit DNA) ═══\n` +
    `Opening: "${personality.openingLine}"\n` +
    `Tone: ${personality.tone}\n` +
    `Guidelines:\n${personality.voiceGuidelines.slice(0, 5).map(g => `  • ${g}`).join("\n")}\n` +
    `Avoid:\n${personality.avoidPatterns.map(a => `  ✗ ${a}`).join("\n")}`
  );

  // ── Final instruction ─────────────────────────────────────────────────────
  sections.push(
    `Now write your response. Start with the opening line above (or adapt it naturally). ` +
    `Weave the astrological diagnosis into the conversation — never list it. ` +
    `Continue their life story. Answer what they actually asked, not just what they literally said. ` +
    `Do not use bullet points or section headers. Write as one fluid consultation.`
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

  // ── Layer 0: Reality Assimilation — must run first ────────────────────────
  // Also load the notebook in parallel since both are independent DB reads.
  const [realityContext, notebookHistory] = await Promise.all([
    assimilateReality(question, history, userId, memories, domain),
    loadNotebook(userId, domain),
  ]);

  // Early exit: if Layer 0 determined a clarifying question is more valuable
  // than a full reading, return immediately without running L1–L8.
  if (realityContext.clarification) {
    return {
      systemPrompt:  "",
      userPrompt:    "",
      temperature:   0.70,
      lifeStory:     null,
      clarification: realityContext.clarification,
      metadata: {
        domain,
        tone:       "direct",
        depth:      "quick",
        subIntents: [],
      },
    };
  }

  // ── Layer 1: Intent ───────────────────────────────────────────────────────
  const intent = analyzeIntent(question, history);

  // ── Layer 2: User State ───────────────────────────────────────────────────
  const userState = buildUserState(history, memories, dashaInfo, intent.emotionalTone);

  // ── Layer 3: Life Story (async — loads from DB) ───────────────────────────
  const domainMemory = memories.find(m => m.domain === domain);
  const lifeStory    = await buildLifeStory(userId, domain, history, domainMemory);

  // ── Layer 4: Astrological Diagnosis ──────────────────────────────────────
  const diagnosis = runDiagnosticEngine(symbolicCtx, dashaInfo, domain);

  // ── Layer 5: Observations ─────────────────────────────────────────────────
  const observations = buildObservations(domain, diagnosis, memories, symbolicCtx);

  // ── Layer 6: Reasoning Chain ──────────────────────────────────────────────
  const reasoning = buildReasoningChain(intent, userState, diagnosis, lifeStory, memories);

  // ── Layer 7: Personality ──────────────────────────────────────────────────
  const personality = buildPersonality(intent, diagnosis, userState);

  // ── Layer 8: Response Plan ────────────────────────────────────────────────
  const responsePlan = planResponse(
    intent, diagnosis, userState, observations, personality, lifeStory, memories
  );

  // Assemble full context
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
  };

  // ── Layer 9: Build LLM brief (Layer 10 is the callAI in route.ts) ─────────
  const systemPrompt = buildSystemPrompt(brainContext, notebookHistory);

  const temperatureMap: Record<string, number> = {
    celebratory: 0.80,
    reassuring:  0.72,
    empathetic:  0.75,
    cautious:    0.65,
    warning:     0.60,
    direct:      0.60,
  };
  const temperature = temperatureMap[personality.tone] ?? 0.70;

  return {
    systemPrompt,
    userPrompt:    question,
    temperature,
    lifeStory,
    clarification: null,
    metadata: {
      domain,
      tone:       personality.tone,
      depth:      responsePlan.depth,
      subIntents: intent.subIntents,
    },
  };
}

// Re-export saveStoryArc so route.ts can call it after the response
export { saveStoryArc } from "./L3_lifeStoryEngine";
export type { PunditBrainOutput, PunditBrainContext } from "./types";
