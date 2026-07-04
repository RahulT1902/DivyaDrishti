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
  bodyRiskProfile?: Record<string, number>;
  kundaliContext?: string; // chart-specific Vedic reading unique to this user
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

// Human-readable labels for body system keys
const BODY_LABELS: Record<string, string> = {
  head: "head and temples", eyes: "eyes and visual focus", sinuses: "sinuses and nasal passages",
  throat: "throat and voice", neck: "neck and cervical region", shoulders: "shoulders and upper traps",
  upperBack: "upper back", lowerBack: "lower back and lumbar region", spine: "spine and posture",
  heart: "heart and circulation", lungs: "lungs and breathing", stomach: "stomach and appetite",
  digestiveSystem: "digestion and gut", liver: "liver and metabolism", kidneys: "kidneys and fluid balance",
  nervousSystem: "nervous system and mental clarity", muscles: "muscles and physical stamina",
  joints: "joints and flexibility", knees: "knees", legs: "legs and lower limbs", feet: "feet",
  sleep: "sleep quality and depth", recovery: "physical recovery and restoration",
  stress: "stress response and mental load",
};

function computeHealthStatus(profile: Record<string, number> | undefined): {
  overall: string; energy: string; recovery: string; stress: string; sleep: string;
} {
  if (!profile) return { overall: "stable", energy: "moderate", recovery: "moderate", stress: "moderate", sleep: "neutral" };

  const all = Object.values(profile);
  const avg = all.reduce((a, b) => a + b, 0) / (all.length || 1);
  const stressScore  = profile["stress"]   ?? avg;
  const recovScore   = profile["recovery"] ?? avg;
  const sleepScore   = profile["sleep"]    ?? avg;
  const energyScore  = 100 - (stressScore * 0.4 + recovScore * 0.4 + avg * 0.2);

  return {
    overall:  avg < 40 ? "excellent" : avg < 52 ? "good" : avg < 65 ? "average — some areas need attention" : "somewhat stressed — care is warranted",
    energy:   energyScore > 62 ? "good" : energyScore > 44 ? "moderate" : "lower than usual — rest helps",
    recovery: recovScore < 45 ? "good" : recovScore < 62 ? "moderate — recovery is slower than ideal" : "poor — the body needs more rest than it is getting",
    stress:   stressScore < 40 ? "low" : stressScore < 58 ? "moderate" : "elevated — the nervous system is under load",
    sleep:    sleepScore  < 45 ? "restful" : sleepScore  < 62 ? "neutral — quality could improve" : "disrupted — prioritize rest tonight",
  };
}

function buildHealthBlock(
  topRisks: Array<{ system: string; score: number }> | undefined,
  profile: Record<string, number> | undefined,
  moonTransitNote: string
): string {
  if (!topRisks || topRisks.length === 0) return "";

  const status = computeHealthStatus(profile);
  const primary   = BODY_LABELS[topRisks[0]?.system ?? "stress"]       ?? topRisks[0]?.system ?? "stress";
  const secondary = BODY_LABELS[topRisks[1]?.system ?? "recovery"]     ?? topRisks[1]?.system ?? "recovery";
  const tertiary  = BODY_LABELS[topRisks[2]?.system ?? "digestiveSystem"] ?? topRisks[2]?.system ?? "digestion";

  // Named list of top body areas for direct body-parts questions
  const bodyPartsList = [primary, secondary, tertiary]
    .map((area, i) => `  ${i + 1}. ${area}`)
    .join("\n");

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTH INTELLIGENCE BRIEF (INTERNAL — use this structure, never quote it verbatim)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-CONSULTATION HEALTH ASSESSMENT:
  Overall Health Today : ${status.overall}
  Energy Level         : ${status.energy}
  Recovery             : ${status.recovery}
  Stress Load          : ${status.stress}
  Sleep Quality        : ${status.sleep}
  Today's Moon Theme   : ${moonTransitNote.replace(/\n/g, " ")}

TODAY'S MOST SENSITIVE BODY AREAS (in order of sensitivity):
${bodyPartsList}

QUESTION-TYPE ROUTING — read the user's question carefully:

IF the user is asking "which body parts / areas / systems will be affected":
  → Your response MUST begin by directly listing the top areas by name.
  → Format: name the area, then one sentence describing what the user may notice there.
  → Do NOT open with a general health overview. List first. Explain after.
  → Example opening: "Today, the areas most worth watching are your [area 1], [area 2], and [area 3]..."
  → After the list, briefly explain why (astrological translation in plain English).
  → Close with Pundit's Closing Thought. Total: 180–250 words.

IF the user is asking "how is my health today" (general status):
  Answer in exactly this order:
  1. OVERALL HEALTH TODAY (2–3 sentences — direct answer first)
  2. ENERGY & RECOVERY (specific, not philosophical)
  3. AREA WORTH WATCHING — name the primary area in plain language
  4. WHY I SAY THIS (brief astrological translation)
  5. PRACTICAL GUIDANCE (3 specific, actionable suggestions)
  6. PUNDIT'S CLOSING THOUGHT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN PRIORITY RULE — HEALTH (non-negotiable):
Every sentence must be about the body, energy, sleep, digestion, or physical wellbeing.
Ambition, recognition, career growth, life purpose — these are NOT health topics.
The current life theme must NOT leak into a health response.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── Response Orchestrator ────────────────────────────────────────────────────
// Determines which domains are active/forbidden and what structure the response
// must follow based on question type. This is the most important isolation layer
// — it prevents career themes from leaking into health responses and vice versa.

const DOMAIN_NEIGHBORS: Record<string, string[]> = {
  career:       ["finance"],
  promotion:    ["career", "finance"],
  finance:      ["career"],
  health:       [],           // health is completely isolated
  relationship: [],
  marriage:     ["relationship"],
  family:       [],
  business:     ["career", "finance"],
  education:    [],
  spirituality: [],
  general:      [],
};

const ALL_DOMAINS = ["career", "health", "finance", "relationship", "marriage", "family", "business", "education", "spirituality", "travel", "property", "children", "peace"];

const QUESTION_STRUCTURES: Record<string, string> = {
  probability: `MANDATORY STRUCTURE — PROBABILITY QUESTION:
Your FIRST sentence must state the probability estimate. No preamble. No observation first.
Example opening: "Looking at your chart, I would estimate roughly 55–65% likelihood..."
Then follow this order:
  1. Probability estimate (first sentence — what are the chances, in plain language)
  2. Confidence level: "I say this with [high/medium/low] confidence because..."
  3. Why I believe this: 2–3 astrological factors translated to lived experience
  4. What supports this outcome
  5. What could delay or reduce it
  6. Most likely scenario (one concrete sentence)
  7. Timing window (when is the strongest window?)
  8. Pundit's Closing Thought — must be specific to this career/compensation moment, not generic life wisdom
LENGTH: 280–360 words. Do not exceed. Probability responses must be precise, not expansive.`,

  timing: `MANDATORY STRUCTURE — TIMING QUESTION:
Your FIRST sentence must state where things stand right now.
Then follow this order:
  1. Current momentum (first sentence)
  2. Immediate window: next 2–4 weeks
  3. Near-term window: 1–3 months
  4. Strongest window: the peak opportunity period with its astrological trigger
  5. Astrological translation: what is creating this timing
  6. What to do in each phase
  7. Pundit's Closing Thought — specific to timing, not generic
LENGTH: 260–340 words.`,

  prediction: `MANDATORY STRUCTURE — PREDICTION QUESTION:
Your FIRST sentence must directly assess likelihood — likely, unlikely, or conditional.
Example: "Your chart does suggest this is possible, but the timing may not be immediate..."
Then follow this order:
  1. Direct assessment (first sentence)
  2. What the chart supports
  3. What is still building or not yet ready
  4. Conditions that would change the outcome
  5. Timing window
  6. Guidance
  7. Pundit's Closing Thought`,

  decision: `MANDATORY STRUCTURE — DECISION QUESTION:
Your FIRST sentence must state which direction the chart leans.
Example: "Looking at the chart, there is a lean toward staying rather than moving right now..."
Then follow this order:
  1. The chart's leaning (first sentence)
  2. What supports that path
  3. What to watch out for
  4. Timing consideration
  5. The deeper question (what this decision is really about)
  6. Guidance
  7. Pundit's Closing Thought`,

  explanation: `MANDATORY STRUCTURE — EXPLANATION QUESTION:
Your FIRST sentence must name the primary cause in lived experience, not astrological terms.
Example: "What is creating this pattern is a combination of..."
Then follow this order:
  1. Primary cause (first sentence — experiential, not planetary)
  2. Why this is happening astrologically (translated to experience)
  3. How long this pattern lasts
  4. What would change it
  5. Guidance
  7. Pundit's Closing Thought`,

  planet_inquiry: `MANDATORY STRUCTURE — PLANET INQUIRY:
Your FIRST sentence must name the primary planetary influence and what it is creating.
Example: "The planet working most actively in your favor right now is Jupiter..."
Then follow this order:
  1. Name the planet and its current effect (first sentence)
  2. Which area of life it is strengthening
  3. How long this influence lasts
  4. What else is notable (secondary influence)
  5. How to work with this energy
  6. Pundit's Closing Thought`,

  body_parts: `MANDATORY STRUCTURE — BODY PARTS QUESTION:
Do NOT open with planetary context. Do NOT restate the question. Do NOT give a general health overview first.
Your VERY FIRST SENTENCE must name the specific body areas directly.

Example CORRECT opening: "Today, the areas most worth watching are your lower back, eyes, and digestive system."
Example WRONG opening: "What I think is more worth exploring is how planetary influences..." ← FORBIDDEN

Then follow this order:
  1. NAME the top 3 body areas directly (first sentence — no preamble)
  2. For each area: one sentence on what the person may notice or feel today
  3. Why — brief astrological reason in plain experience-based language (no house numbers, no raw planet names)
  4. One practical care suggestion
  5. Pundit's Closing Thought — specific to physical wellbeing, not life advice
LENGTH: 180–250 words. Precise and direct.`,

  general_status: `STRUCTURE: Observation first → The story unfolding → What the user may experience → Why → Guidance → Pundit's Closing Thought
LENGTH: 300–380 words.`,
};

function buildOrchestratorBlock(richIntent: RichIntent): string {
  const domain  = richIntent.domain;
  const qType   = richIntent.questionType;
  const neighbors = DOMAIN_NEIGHBORS[domain] ?? [];
  const activeDomains = [domain, ...neighbors];

  const forbidden = ALL_DOMAINS.filter(d => !activeDomains.includes(d));
  const forbiddenStr = forbidden.slice(0, 5).join(", ");

  const structure = QUESTION_STRUCTURES[qType] ?? QUESTION_STRUCTURES["general_status"];

  const hardForbids: string[] = [];
  if (domain !== "health") hardForbids.push("Do NOT discuss health, body, energy levels, sleep, physical wellbeing, or digestion — even briefly.");
  if (domain !== "relationship" && domain !== "marriage") hardForbids.push("Do NOT discuss relationships, marriage, or love life.");
  if (domain !== "spirituality") hardForbids.push("Do NOT discuss spirituality or moksha.");

  const timeframeLabel = richIntent.timeframeLabel;
  const timeframeLine = timeframeLabel
    ? `TIMEFRAME      : ${timeframeLabel.toUpperCase()}`
    : `TIMEFRAME      : CURRENT PERIOD`;

  const timeframeRule = timeframeLabel
    ? `TIMEFRAME RULE (absolute — same priority as domain isolation):
• Answer ONLY for "${timeframeLabel}". Every observation, fact, and prediction must be about this window.
• Do NOT mention other time periods (not last month, not next year, not "in the coming months").
• If the question is about "this week" — answer this week only.
• If the question is about "the next 2 months" — answer the next 2 months only.
• If the question is about "today" — answer today only.`
    : `TIMEFRAME RULE: Cover the current period naturally. Do not speculate far into the future without astrological basis.`;

  const followUpNote = richIntent.isFollowUp
    ? `\nFOLLOW-UP CONTEXT: This is a follow-up question. The domain carries over from the prior exchange. Answer the NEW angle only — do NOT repeat, summarize, or rephrase anything from the prior response.`
    : "";

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE ORCHESTRATION — READ BEFORE WRITING A SINGLE WORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY DOMAIN : ${domain.toUpperCase()}
QUESTION TYPE  : ${qType}
${timeframeLine}
ACTIVE ENGINES : ${activeDomains.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(" + ")}${richIntent.confidenceRequired ? " + Probability" : ""}${richIntent.timingRequired ? " + Timing" : ""}
FORBIDDEN      : ${forbiddenStr || "all unrelated domains"}
${followUpNote}

DOMAIN ISOLATION (absolute):
${hardForbids.map(f => `• ${f}`).join("\n")}
• If an unrelated domain is genuinely causing the primary domain's outcome, ONE sentence of context maximum. Then return immediately.
• The primary domain must account for at least 90% of the response.
• A response that drifts into a forbidden domain has failed — rewrite it.

${timeframeRule}

${structure}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildV5Prompt(params: V5PromptParams): string {
  const {
    question, richIntent, brief,
    lagnaSignName, natalMoonSignName, dashaStack,
    transitSummary, conversationHistory,
    todayLabel, moonTransitNote, topRisks, bodyRiskProfile, kundaliContext,
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

  const briefBlock    = buildBriefBlock(brief);
  const historyBlock  = buildHistoryBlock(conversationHistory);
  // Health block only injected for health domain — never for career, finance, etc.
  const healthBlock   = richIntent.domain === "health"
    ? buildHealthBlock(topRisks, bodyRiskProfile, moonTransitNote)
    : "";
  const orchestratorBlock = buildOrchestratorBlock(richIntent);

  // Conditional engine blocks
  const probabilityBlock = richIntent.confidenceRequired
    ? "\n" + getProbabilityTrustBlock(richIntent.domain) + "\n"
    : "";
  const timingBlock = richIntent.timingRequired
    ? "\n" + getTimingBlock() + "\n"
    : "";

  // Strip Moon Nakshatra from non-health prompts — Nakshatra labels trigger health
  // associations in the LLM even when domain isolation rules say otherwise.
  const contextMoonNote = richIntent.domain === "health"
    ? moonTransitNote
    : moonTransitNote.replace(/,\s*Nakshatra\s+\w+/i, "");

  return `You are Chat Pundit — a Vedic astrologer with over 30 years of experience helping ordinary Indian families understand their charts.
You speak simply and warmly, like a trusted family pandit sitting across from the person — not like a formal consultant or an academic.
Write in simple Indian English. Be conversational. Be direct. Be human.
If a small word works, use it. If you can say it in one sentence, don't say it in three.
Your job is to explain what astrology means for this person's actual life — in plain everyday language they can understand and act on.

${orchestratorBlock}

${punditDNABlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY'S CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: ${todayLabel}${contextMoonNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER'S ASTROLOGICAL PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lagna (Ascendant): ${lagnaSignName}
Natal Moon Sign: ${natalMoonSignName}
Mahadasha: ${dashaStack.mahadasha} | Antardasha: ${dashaStack.antardasha}${dashaStack.pratyantar ? ` | Pratyantar: ${dashaStack.pratyantar}` : ""}

Current Planetary Positions (by house from Lagna):
${transitSummary}

${kundaliContext ? kundaliContext + "\n\n" : ""}${healthBlock}${briefBlock}

${historyBlock}
${probabilityBlock}${timingBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER'S QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${question}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRITE YOUR RESPONSE NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Follow the ORCHESTRATION block above exactly. Stay in the PRIMARY DOMAIN.

VOICE AND LANGUAGE (most important):
Speak like an experienced Indian astrologer sitting across from the person — warm, direct, simple.
Use everyday Indian English. The way a good pandit or family astrologer talks to you.

Say this → not this:
"See, what is happening here is..." → not "The chart indicates a configuration..."
"This is a good time for you to..." → not "The current planetary positions suggest an auspicious window..."
"I have seen this many times..." → not "Analysis of the astrological factors reveals..."
"Honestly, the situation is..." → not "Upon careful examination of the dasha and transit interplay..."
"You may be feeling some pressure at work..." → not "The native may experience professional friction..."

Do NOT open with a planet name. Do NOT list planets one by one.
Do NOT use: "The chart shows / The data indicates / The calculations suggest / The native / The astrological configuration."
Do NOT repeat advice or observations from previous responses in this conversation.
End with Pundit's Closing Thought — something real and specific to this person, not a philosophical quote.

LENGTH: Answer the question and stop. Do not pad.
General/health/status: 180–260 words. Probability/timing/prediction: 200–280 words.
A short clear answer is better than a long vague one.

AFTER your Pundit's Closing Thought, on a new line, write exactly this format (required):
EXPLORE: [one specific follow-up question about a DIFFERENT aspect of this domain — something the user hasn't asked yet and that would naturally come next in this conversation. Must not repeat or summarise what you just answered.]`;
}
