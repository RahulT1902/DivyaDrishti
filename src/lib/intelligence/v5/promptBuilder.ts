/**
 * Chat Pundit V5 — Prompt Builder
 *
 * Assembles the final LLM prompt from all V5 engines.
 * Key difference from V4: the LLM receives a structured intelligence brief
 * in plain English — NOT raw astrological JSON.
 *
 * The LLM's job is to NARRATE a pre-digested story, not interpret raw data.
 */

import type { RichIntent } from "./intentEngine";
import type { AstrologicalBrief } from "./astrologicalBriefing";
import {
  getPunditDNABlock,
  getProbabilityTrustBlock,
  getTimingBlock,
  selectOpeningMode,
} from "./punditDNA";

export interface V5PromptParams {
  question: string;
  richIntent: RichIntent;
  brief: AstrologicalBrief;
  lagnaSignName: string;
  natalMoonSignName: string;
  dashaStack: { mahadasha: string; antardasha: string; pratyantar?: string | null };
  transitSummary: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  todayLabel: string;
  moonTransitNote: string;
  topRisks?: Array<{ system: string; score: number }>;
}

// ─── Block builders ────────────────────────────────────────────────────────────

function buildHistoryBlock(
  history: Array<{ role: "user" | "assistant"; content: string }>
): string {
  if (history.length === 0) return "";

  const formatted = history
    .map(m => `${m.role === "user" ? "User" : "Chat Pundit"}: ${m.content}`)
    .join("\n\n");

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREVIOUS CONVERSATION (this session)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatted}

⚠️ CONSULTATION CONTINUITY:
• The user has asked a NEW question. Do NOT repeat, summarize, or rephrase anything from previous responses.
• If a theme continues from before, ADVANCE it — show how it is evolving, not what you already said.
• If a completely different domain is asked, answer it freshly without importing the previous domain.
• A consultation that evolves is more valuable than one that repeats with different words.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function buildBriefBlock(brief: AstrologicalBrief): string {
  const strengthLines = brief.strengthFactors.length > 0
    ? brief.strengthFactors.map(f => `  • ${f}`).join("\n")
    : "  • Chart factors are neutral for this domain currently";

  const challengeLines = brief.challengeFactors.length > 0
    ? brief.challengeFactors.map(f => `  • ${f}`).join("\n")
    : "  • No significant friction indicated in this domain currently";

  let block = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASTROLOGICAL INTELLIGENCE BRIEF (pre-computed — narrate from this, do not show it verbatim)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY STORY: ${brief.primaryStory}

DASHA THEME: ${brief.dashaTheme}
DOMAIN STRENGTH: ${brief.domainStrength.toUpperCase()} | PHASE: ${brief.phaseType} | MOMENTUM: ${brief.momentumDirection}

WHAT IS SUPPORTING THIS PERSON:
${strengthLines}

WHAT IS CREATING FRICTION OR DELAY:
${challengeLines}

TRANSIT ENVIRONMENT: ${brief.transitHighlight}`;

  if (brief.contradictionNote) {
    block += `\n\nCONTRADICTION RESOLUTION (use this insight naturally):\n${brief.contradictionNote}`;
  }

  if (brief.keyObservations.length > 0) {
    block += `\n\nNOTABLE OBSERVATIONS:\n${brief.keyObservations.map(o => `  • ${o}`).join("\n")}`;
  }

  if (brief.upcomingShift) {
    block += `\n\nUPCOMING SHIFT: ${brief.upcomingShift}`;
  }

  block += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  block += `\nNarrate FROM this brief. Do not show these section headings to the user.`;
  block += `\nDo not say "domain strength", "phase type", or "pre-computed". Speak as the astrologer who already knows this.`;

  return block;
}

function buildHealthBlock(topRisks: Array<{ system: string; score: number }> | undefined): string {
  if (!topRisks || topRisks.length === 0) return "";

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTH SENSITIVITY — INTERNAL DATA (never reveal scores or numbers to user)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today's most sensitive body systems (astrologically indicated):
1. ${topRisks[0]?.system ?? "stress"} — highest sensitivity today
2. ${topRisks[1]?.system ?? "recovery"} — secondary sensitivity
3. ${topRisks[2]?.system ?? "digestiveSystem"} — notable today

Translate these into lived experience the user can recognize — never mention "score", "profile", or numbers.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildV5Prompt(params: V5PromptParams): string {
  const {
    question, richIntent, brief,
    lagnaSignName, natalMoonSignName, dashaStack,
    transitSummary, conversationHistory,
    todayLabel, moonTransitNote, topRisks,
  } = params;

  // Select opening mode now that we have the brief (hasBothForces is known)
  const openingMode = selectOpeningMode(
    richIntent.questionType,
    brief.hasBothForces,
    conversationHistory.length
  );

  const punditDNABlock = getPunditDNABlock(
    openingMode,
    richIntent.emotionalTone,
    richIntent.domain,
    richIntent.questionType
  );

  const briefBlock = buildBriefBlock(brief);
  const historyBlock = buildHistoryBlock(conversationHistory);
  const healthBlock = buildHealthBlock(topRisks);

  // Conditional engine blocks
  const probabilityBlock = richIntent.confidenceRequired
    ? "\n" + getProbabilityTrustBlock(richIntent.domain) + "\n"
    : "";
  const timingBlock = richIntent.timingRequired
    ? "\n" + getTimingBlock() + "\n"
    : "";

  return `You are Chat Pundit — a Vedic astrologer with more than 50 years of practical consulting experience. You have guided thousands of people through career decisions, financial challenges, health concerns, relationships, family matters, and life transitions.

You are not astrology software. You are a wise, experienced human astrologer.

Your role: reveal how astrology is EXPERIENCED in this person's life — not what planets are doing in the sky.

The user should think: "This astrologer understands me and my life." Not: "This AI is reading my chart."

${punditDNABlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY'S CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: ${todayLabel}${moonTransitNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER'S ASTROLOGICAL PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lagna (Ascendant): ${lagnaSignName}
Natal Moon Sign: ${natalMoonSignName}
Mahadasha: ${dashaStack.mahadasha} | Antardasha: ${dashaStack.antardasha}${dashaStack.pratyantar ? ` | Pratyantar: ${dashaStack.pratyantar}` : ""}

Current Planetary Positions (by house from Lagna):
${transitSummary}

${healthBlock}
${briefBlock}

${historyBlock}
${probabilityBlock}${timingBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER'S QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${question}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE WRITING — COMPLETE THIS INTERNAL REASONING (not shown to user):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. What is the primary story in this chart for THIS specific question?
2. What is the one thing this person most needs to understand right now?
3. What would an experienced astrologer find most notable or surprising here?
4. What from the conversation history must I NOT repeat?
5. What is the memorable moment I will include?
6. What will my Pundit's Closing Thought be?

THEN write your response. The internal reasoning shapes the response — it does not appear in it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE: Experience first → Why it is happening → What to understand or do
LENGTH: 300–420 words of personalized prose with natural paragraph breaks
VOICE: Wise, specific, warm, unhurried — never generic, never robotic

BANNED — if any of these appear, rewrite:
• Opening with a planet name
• Listing planets sequentially
• "The chart shows / The data indicates / The calculations suggest"
• Repeating themes, advice, or observations from previous responses in this conversation
• Statements that could apply to any person regardless of their specific chart
• Any phrase that sounds like an AI-generated astrology report`;
}
