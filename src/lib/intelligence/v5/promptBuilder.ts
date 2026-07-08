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
import type { HealthFindings } from "../health/healthFindingsEngine";
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
  healthFindings?: HealthFindings;
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

// Human-readable labels for health system keys — each label includes example symptoms
// so the AI can naturally describe what the user may experience, not just name the system.
const BODY_LABELS: Record<string, string> = {
  // Structural
  head:                    "head and neurological (headache, dizziness, brain fog, head pressure)",
  throat:                  "ENT — ear, nose, throat (sore throat, congestion, voice issues, nasal sensitivity)",
  back:                    "back and spine (back pain, stiffness, posture fatigue, lumbar pressure)",
  joints:                  "joints and musculoskeletal (joint pain, stiffness, aches, inflexibility)",
  // Internal Organs
  heart:                   "heart and circulation (palpitations, chest tightness, circulatory vitality)",
  stomach:                 "stomach (nausea, acidity, appetite disruption, bloating)",
  liver:                   "liver and metabolism (sluggishness, bile sensitivity, slow detox)",
  kidneys:                 "kidneys and fluid balance (fluid retention, urinary sensitivity, lower-back pressure)",
  // Functional Systems
  respiratorySystem:       "respiratory system (cough, congestion, breathing difficulty, sinus pressure)",
  immuneSystem:            "immune system (infection susceptibility, slower healing, fatigue from minor illness)",
  digestiveSystem:         "digestive system (bloating, indigestion, irregular bowel, gut sensitivity)",
  nervousSystem:           "nervous system (anxiety, nerve sensitivity, brain fog, overthinking)",
  // Symptom Domains
  inflammation:            "inflammation and fever (body aches, heat sensation, fever tendency, joint swelling)",
  coldViralSusceptibility: "cold and viral susceptibility (cold, flu, sore throat, runny nose, mild fever)",
  allergySensitivity:      "allergy sensitivity (skin rash, nasal allergy, seasonal reactions, itching)",
  skinHealth:              "skin health (dryness, eruptions, rashes, dull complexion)",
  // Functional States
  energyStamina:           "energy and stamina (fatigue, reduced endurance, low motivation, exhaustion)",
  mentalWellness:          "mental wellness (stress, anxiety, emotional fatigue, mood dips)",
  sleep:                   "sleep quality (insomnia, restless sleep, difficulty winding down, early waking)",
  recovery:                "physical recovery (slow healing, prolonged soreness, body taking longer to bounce back)",
};

function computeHealthStatus(profile: Record<string, number> | undefined): {
  overall: string; energy: string; recovery: string; stress: string; sleep: string;
  rawAvg: number; rawStress: number; rawRecovery: number; rawEnergy: number;
} {
  if (!profile) return { overall: "stable", energy: "moderate", recovery: "moderate", stress: "moderate", sleep: "neutral", rawAvg: 50, rawStress: 50, rawRecovery: 50, rawEnergy: 50 };

  const all = Object.values(profile);
  const avg = all.reduce((a, b) => a + b, 0) / (all.length || 1);
  // V2 field names: mentalWellness replaces stress; energyStamina is direct risk score
  const mentalScore  = profile["mentalWellness"]          ?? profile["stress"]   ?? avg;
  const recovScore   = profile["recovery"]                ?? avg;
  const sleepScore   = profile["sleep"]                   ?? avg;
  const energyRisk   = profile["energyStamina"]           ?? (avg);
  // Convert energyStamina risk score to a positive "energy score" (higher = more energy)
  const energyScore  = 100 - energyRisk;

  return {
    overall:  avg < 40 ? "excellent" : avg < 52 ? "good" : avg < 65 ? "average — some areas need attention" : "somewhat stressed — care is warranted",
    energy:   energyScore > 65 ? "good" : energyScore > 48 ? "moderate" : "lower than usual — rest helps",
    recovery: recovScore < 45 ? "good" : recovScore < 62 ? "moderate — recovery is slower than ideal" : "poor — the body needs more rest than it is getting",
    stress:   mentalScore < 40 ? "low" : mentalScore < 58 ? "moderate" : "elevated — the nervous system is under load",
    sleep:    sleepScore  < 45 ? "restful" : sleepScore  < 62 ? "neutral — quality could improve" : "disrupted — prioritize rest tonight",
    rawAvg:      Math.round(avg),
    rawStress:   Math.round(mentalScore),
    rawRecovery: Math.round(recovScore),
    rawEnergy:   Math.round(energyScore),
  };
}

function buildHealthBlock(
  topRisks: Array<{ system: string; score: number }> | undefined,
  profile: Record<string, number> | undefined,
  moonTransitNote: string,
  findings?: HealthFindings,
  isFollowUp?: boolean
): string {
  if (!topRisks || topRisks.length === 0) return "";

  const status = computeHealthStatus(profile);

  // If HealthFindings are available, use them as the authoritative source
  if (findings) {
    const activeList = findings.activeSystems
      .map(s => BODY_LABELS[s]?.split(" (")[0] ?? s)
      .join(", ") || "none above threshold";
    const symptomList = findings.symptoms.map(s => `  • ${s}`).join("\n");
    const secondaryLine = findings.secondaryFocus
      ? `SECONDARY FOCUS  : ${findings.secondaryFocus.displayName} (score ${findings.secondaryFocus.score}/100)`
      : "SECONDARY FOCUS  : None above sensitivity threshold";
    const tertiaryLine = findings.tertiaryFocus
      ? `TERTIARY FOCUS   : ${findings.tertiaryFocus.displayName} (score ${findings.tertiaryFocus.score}/100)`
      : "";

    const findingsBlock = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-COMPUTED HEALTH FINDINGS (authoritative — chart-derived, fixed before this question was asked)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY FOCUS    : ${findings.primaryFocus.displayName} (score ${findings.primaryFocus.score}/100)
${secondaryLine}
${tertiaryLine}
ACTIVE SYSTEMS   : ${activeList}
CONFIRMED SYMPTOMS (these only — do not invent others):
${symptomList}
ENERGY TODAY     : ${findings.energyArc}
DIGESTION        : ${findings.digestiveNote}
RECOVERY         : ${findings.recoveryNote}
CONFIDENCE       : ${findings.confidence}
TODAY'S MOON     : ${moonTransitNote.replace(/\n/g, " ")}
OVERALL INDEX    : ${status.overall} (${status.rawAvg}/100)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-QUERY-ANCHORING RULE (critical — read before writing a single word)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The findings above are determined by the chart — they are FIXED.
They do NOT change based on what the user mentions in their question.

If the user asks about a system that IS in ACTIVE SYSTEMS:
  → Confirm it: "Yes, actually that area is showing sensitivity today..."
  → Use the pre-computed symptoms above. Do not add new ones.

If the user asks about a system that is NOT in ACTIVE SYSTEMS:
  → Say clearly: "Your chart doesn't show heightened sensitivity there today."
  → Do NOT confirm a health concern just because the user mentioned it.
  → Do NOT pivot to that system as a new focus.

This consistency is what makes the Pandit trustworthy.
A real astrologer's reading doesn't change based on what the patient suggests.`;

    // Follow-up mode: user already received the full briefing — answer only the specific question
    if (isFollowUp) {
      return `${findingsBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTH FOLLOW-UP MODE — DO NOT REGENERATE THE FULL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You already gave the complete Daily Health Briefing earlier in this consultation.
The user is asking a specific follow-up question. Answer it directly — like a pandit answering mid-consultation.

RULES:
• Answer ONLY what was asked. Do NOT reintroduce the consultation.
• Do NOT use section headers (🌿🎯⚠💪🍽✅🌙). No emoji section titles.
• Do NOT repeat or regenerate: Overall Health, Energy, Digestion, Advice, Areas to Watch.
• Begin with a direct answer to the question. Reference today's findings naturally.
• Keep it 2–4 short paragraphs. Conversational, warm, specific.
• End with ONE sentence of Pundit's Closing Thought — specific to this follow-up question only.

EXAMPLE — fever question:
"Based on today's chart, the chances of developing a fever are low. The primary sensitivity today is around the respiratory system, so if anything, symptoms are more likely to stay at the level of throat irritation or nasal congestion. A significant fever would suggest the immune system is under heavy load, and the chart doesn't show that strongly today. Keep warm, stay hydrated, and rest well tonight."

EXAMPLE — workout question:
"A gentle walk should be fine, especially in the morning when energy holds up better. Your chart is showing respiratory sensitivity today, so avoid exercising in cold air or dusty environments. Keep it light — a full intense workout may leave you more fatigued than usual given today's recovery picture."

EXAMPLE — digestion question:
"Digestion isn't the main concern today — the chart points more toward respiratory sensitivity. That said, ${findings.digestiveNote.toLowerCase()} Avoid anything too heavy or oily to keep things comfortable."

FORBIDDEN for follow-up responses:
❌ Starting with "🌿 Health Outlook for Today"
❌ Regenerating the full 7-section briefing
❌ Repeating Overall Health, Energy, or Advice sections
❌ Opening with greetings, reintroductions, or context-setting

LENGTH: 80–180 words. Direct. Conversational. Warm.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN PRIORITY (absolute): Every sentence about body, energy, sleep, or digestion only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    // Initial consultation: full 7-section briefing
    return `${findingsBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — DAILY HEALTH BRIEFING (use exact section headers)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Philosophy: Health content 85%, astrological explanation 15%.
Be BRIEF. Each section is 1–3 lines. Total response: 200–260 words MAX.
No long paragraphs. Users read for 15 seconds — every word must earn its place.
Do NOT write "Pundit's Closing Thought" — health responses end with the "Why" section.

🌿 Health Outlook for Today
[ONE sentence. Overall status + the single most important theme.]

🎯 Today's Health Focus
[System name — bold or plain]
[2 sentences: predisposition + what triggers it. Use "may", "could", "might".]

⚠ Areas to Watch
[Use ONLY the confirmed symptoms from the findings above — 4–5 bullets max]
• [symptom]
• [symptom]

⚠ Secondary Focus (include only if secondaryFocus exists)
[System name + 1–2 bullets of its symptoms]

💪 Energy
[1–2 sentences. Use the energyArc from findings. Morning vs afternoon.]

🍽 Digestion
[1 sentence. Use digestiveNote from findings verbatim or slightly rephrased.]

✅ Today's Advice
[4 short checkmarks — specific to today's active systems]
✔ [action]
✔ [action]
✔ [action]
✔ [action]

🌙 Why This Is Happening
[2 sentences MAX. No degree numbers. No house numbers. Plain language.]
Confidence: ${findings.confidence}

If you're already experiencing symptoms:
[1 short paragraph — if they have a related existing symptom, how does today affect recovery?]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN PRIORITY (absolute): Every sentence about body, energy, sleep, or digestion only.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  // Fallback (no findings object) — legacy format
  const primary   = BODY_LABELS[topRisks[0]?.system ?? "energyStamina"]?.split(" (")[0] ?? "energy";
  const secondary = BODY_LABELS[topRisks[1]?.system ?? "recovery"]?.split(" (")[0]      ?? "recovery";
  const tertiary  = BODY_LABELS[topRisks[2]?.system ?? "coldViralSusceptibility"]?.split(" (")[0] ?? "immune";
  const systemsList = [primary, secondary, tertiary].map((s, i) => `  ${i + 1}. ${s}`).join("\n");

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEALTH INTELLIGENCE BRIEF (INTERNAL — never quote these labels or scores verbatim)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY'S COMPUTED HEALTH SIGNALS:
  Overall status   : ${status.overall} (index ${status.rawAvg}/100)
  Energy           : ${status.energy} (score ${status.rawEnergy}/100)
  Recovery speed   : ${status.recovery} (load ${status.rawRecovery}/100)
  Mental load      : ${status.stress} (score ${status.rawStress}/100)
  Sleep tendency   : ${status.sleep}
  Today's Moon     : ${moonTransitNote.replace(/\n/g, " ")}

TODAY'S MOST SENSITIVE HEALTH SYSTEMS:
${systemsList}

DAILY VARIATION NOTE: The Moon's nakshatra changes every 1–1.5 days.
Today's primary system and symptoms must be anchored to the Moon's current nakshatra above.
Tomorrow the Moon will be elsewhere — today's answer must be observably different.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — DAILY HEALTH BRIEFING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT PHILOSOPHY:
• Health content = 85% of response. Astrological explanation = 15%.
• Write like a Daily Health Briefing (think: Apple Health meets a trusted doctor).
• Be scannable. Use the exact section headers and emoji below — no other format.
• No long narrative paragraphs. No astrology jargon. No degree numbers. No house numbers.
• Do NOT write "Pundit's Closing Thought" for health responses — it is replaced by the "Why" section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOR "HOW IS MY HEALTH TODAY" AND ALL GENERAL HEALTH STATUS QUESTIONS:
Use this exact 7-section structure, in this exact order:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌿 Health Outlook for Today
[ONE sentence — overall status + the single most important thing to know today. No fluff.]

🎯 Today's Health Focus
[Name the PRIMARY sensitive system in bold or plain text — e.g. "Respiratory System"]
[2–3 sentences: what predisposition exists, what symptoms may appear, under what conditions.
Use "may", "could", "you might notice" — never "you will" or "you have".]

⚠ Areas to Watch
[4–6 bullet points of specific possible symptoms — concrete, not abstract]
• [e.g. Mild throat dryness or irritation]
• [e.g. Nasal congestion if exposed to dust or cold air]
• [e.g. Slight fatigue by mid-afternoon]
• [e.g. Reduced stamina during physical activity]

💪 Energy
[2 sentences: describe the energy arc through the day — when is it good, when does it dip.
Be specific: "Morning should feel relatively clear. After 3pm, you may feel sluggish."]

🍽 Digestion
[1–2 sentences. Always include even if digestion is not the primary focus.
e.g. "Digestion is generally stable today. Avoid heavy or oily food to keep it that way."]

✅ What Will Help Today
[4 specific, actionable suggestions — formatted as checkmarks]
✔ [Suggestion 1 — relevant to today's sensitive system]
✔ [Suggestion 2]
✔ [Suggestion 3]
✔ [Suggestion 4 — include sleep/rest if recovery is stressed]

🌙 Why This Is Happening
[2–3 sentences MAXIMUM. Plain language. No degrees. No house numbers.
Name the relevant planet(s) and what they're creating in everyday terms.
e.g. "The Moon's current position is activating respiratory sensitivity, while Saturn is slowing recovery slightly. Fortunately, Jupiter's influence keeps this temporary."]
Confidence: [Low / Medium / High — based on how strongly the signals align]

If you're already experiencing symptoms:
[ONE paragraph — if the user already has a cold, cough, fatigue, acidity, etc., how does today's energy affect recovery? Will symptoms ease, persist, or intensify? Always end with a practical note.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOR "WHICH BODY PARTS / SYSTEMS WILL BE AFFECTED" QUESTIONS:
  → First sentence names the top 2–3 health systems directly.
  → For each: 2–3 specific symptoms the user may notice.
  → Last: one sentence of astrological reason in plain language.
  → No Pundit's Closing Thought. Total: 150–200 words.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOMAIN PRIORITY RULE (absolute):
Every sentence must be about the body, energy, sleep, digestion, or physical wellbeing.
Career, ambition, relationships, life purpose — FORBIDDEN in health responses.
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

// ─── AI Decision Intelligence Framework ──────────────────────────────────────
// Every domain answers the same 5 questions: What's happening? / Why? /
// What to do? / When does it change? / How confident?
// Question-type routing shifts DEPTH within this framework, not the structure.

const DOMAIN_LABELS: Record<string, { headline: string; emoji: string; focus: string }> = {
  career:       { headline: "Career & Professional",  emoji: "📊", focus: "career momentum, recognition, and opportunities" },
  promotion:    { headline: "Career & Promotion",     emoji: "📊", focus: "promotion prospects, recognition, and career advancement" },
  finance:      { headline: "Financial",              emoji: "💰", focus: "cash flow, savings, investments, and financial pressure" },
  relationship: { headline: "Relationships",          emoji: "💫", focus: "communication, emotional connection, and harmony" },
  marriage:     { headline: "Marriage & Partnership", emoji: "💍", focus: "partnership dynamics and long-term alignment" },
  family:       { headline: "Family",                 emoji: "🏠", focus: "family dynamics, support, and home environment" },
  business:     { headline: "Business",               emoji: "🏢", focus: "growth, decisions, partnerships, and business climate" },
  education:    { headline: "Education & Learning",   emoji: "📚", focus: "learning pace, focus, exam performance, and skill growth" },
  spirituality: { headline: "Spiritual",              emoji: "🕉️", focus: "inner clarity, purpose, and spiritual direction" },
  travel:       { headline: "Travel",                 emoji: "✈️", focus: "travel suitability, timing, and precautions" },
  general:      { headline: "Life",                   emoji: "🔮", focus: "overall life direction and key themes at play" },
};

// Which section to deepen based on what the user actually asked
const DEPTH_EMPHASIS: Record<string, string> = {
  probability:
`DEPTH EMPHASIS — PROBABILITY QUESTION:
• Section 1 (Outlook) must open with the probability estimate. First sentence. No preamble.
  Example: "Looking at your chart, I would estimate roughly 60–70% likelihood..."
• Section 5 (Confidence) must explain specifically what creates that confidence — not just a label.`,

  timing:
`DEPTH EMPHASIS — TIMING QUESTION:
• Section 4 (When) must cover THREE windows: immediate (2–4 weeks), near-term (1–3 months), and the peak.
• Name the specific astrological trigger for the peak window in plain language — what shifts, and when.`,

  prediction:
`DEPTH EMPHASIS — PREDICTION QUESTION:
• Section 1 (Outlook) must open with a direct likelihood assessment: "likely", "unlikely", or "conditional on..."
• Section 4 (When) must name the conditions that would confirm or shift the prediction.`,

  decision:
`DEPTH EMPHASIS — DECISION QUESTION:
• Section 1 (Outlook) must state which direction the chart leans — first sentence.
• Section 3 (What to do) is the most important section — name specific steps for the chart-supported path AND what to avoid.`,

  explanation:
`DEPTH EMPHASIS — EXPLANATION QUESTION:
• Section 2 (Why) is the most important section — name the root cause in plain terms, its duration, and what would change it.
• Section 1 (Outlook) can be brief (1–2 sentences) since the "why" is the point.`,

  planet_inquiry:
`DEPTH EMPHASIS — PLANET INQUIRY:
• Section 2 (Why) must name the relevant planet(s) and translate their current position into lived experience.
• Section 4 (When) must note how long this planetary influence lasts and what shifts it.`,

  body_parts:
`DEPTH EMPHASIS — SPECIFIC AREA QUESTION:
• Section 1 (Outlook) must name specific areas directly — first sentence, no preamble.
• Section 3 (What to do) must include body-specific care suggestions tied to those areas.`,

  general_status:
`DEPTH EMPHASIS — GENERAL STATUS:
• Balanced across all 5 sections.
• Section 3 (What to do) must have the most specific, actionable items — not generic advice.`,
};

function buildUniversalDomainFormat(domain: string, questionType: string): string {
  const label = DOMAIN_LABELS[domain] ?? DOMAIN_LABELS["general"];
  const depth = DEPTH_EMPHASIS[questionType] ?? DEPTH_EMPHASIS["general_status"];

  return `MANDATORY RESPONSE FORMAT — AI DECISION INTELLIGENCE FRAMEWORK
Write each section header exactly as shown. They are visible to the user — make the response scannable.

${label.emoji} ${label.headline} Outlook
[What is happening right now in this domain? 2–3 sentences. Direct. No preamble.]
[Cover: ${label.focus}]

🔍 Why This Is Happening
[Translate dasha + transits into lived experience. 2–3 sentences. Plain language.]
[No degree numbers. No house numbers. Name planets only when essential.]

⚡ What You Should Do
[3–4 specific, actionable items — tied to today's astrological phase, not generic advice]
✔ [Action 1]
✔ [Action 2]
✔ [Action 3]
✔ [Action 4 — optional but preferred]

⏳ When This Is Likely to Change
Near-term (2–4 weeks): [one sentence on what to expect soon]
Shift window (1–3 months): [one sentence on the medium-term movement or peak opportunity]

🎯 Confidence: [High / Medium / Low]
[One sentence: what makes this read strong, or what limits certainty.]

[Pundit's Closing Thought — 1 sentence. No label. Specific to this person's situation right now.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${depth}
TOTAL LENGTH: 220–300 words. Every word earns its place. Do not pad.`;
}

function buildOrchestratorBlock(richIntent: RichIntent): string {
  const domain  = richIntent.domain;
  const qType   = richIntent.questionType;
  const neighbors = DOMAIN_NEIGHBORS[domain] ?? [];
  const activeDomains = [domain, ...neighbors];

  const forbidden = ALL_DOMAINS.filter(d => !activeDomains.includes(d));
  const forbiddenStr = forbidden.slice(0, 5).join(", ");

  // Health format is handled entirely by buildHealthBlock — do not specify structure here.
  // All other domains use the universal 5-question decision framework.
  const structure = domain === "health" ? "" : buildUniversalDomainFormat(domain, qType);

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
    todayLabel, moonTransitNote, topRisks, bodyRiskProfile, healthFindings, kundaliContext,
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

  // Detect if this is a follow-up within an existing health consultation.
  // If the conversation history already contains a full Health Briefing (🌿 header),
  // switch to follow-up mode so Claude answers the specific question without
  // regenerating the entire report.
  const isHealthFollowUp = richIntent.domain === "health"
    && conversationHistory.some(m =>
        m.role === "assistant" && (
          m.content.includes("🌿") ||
          m.content.includes("Health Outlook") ||
          m.content.includes("Health Focus")
        )
      );

  const briefBlock    = buildBriefBlock(brief);
  const historyBlock  = buildHistoryBlock(conversationHistory);
  // Health block only injected for health domain — never for career, finance, etc.
  const healthBlock   = richIntent.domain === "health"
    ? buildHealthBlock(topRisks, bodyRiskProfile, moonTransitNote, healthFindings, isHealthFollowUp)
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
TODAY'S CONTEXT (these values are specific to this date — they change every day)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: ${todayLabel}${contextMoonNote}
Note: Moon's nakshatra and Tithi above are TODAY's values. They were different yesterday and will be different tomorrow. Any response about today must anchor to these specific values — not to generic dasha themes that apply every day.

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

${richIntent.domain === "health"
  ? isHealthFollowUp
    ? `HEALTH FOLLOW-UP: End with ONE sentence of Pundit's Closing Thought — specific to this follow-up question only. Do NOT write "Pundit's Closing Thought" as a heading — just write the sentence naturally.`
    : `HEALTH DOMAIN — DO NOT write "Pundit's Closing Thought". The 7-section briefing format in the HEALTH INTELLIGENCE BRIEF above replaces it entirely. End with "If you're already experiencing symptoms:" paragraph, then Confidence level.`
  : `The 5-question framework above ends with an unlabeled Pundit's Closing Thought — write it naturally, without a heading. Make it specific to this person's situation, not a philosophical quote.`}

LENGTH: Answer the question and stop. Do not pad.
${richIntent.domain === "health"
  ? isHealthFollowUp
    ? `Health follow-up: 80–180 words. Direct answer only. No section headers. No emoji titles.`
    : `Health briefing: follow the 7-section format. Each section is short. Total 200–260 words.`
  : `5-question framework: 220–300 words. All 5 sections required. Depth emphasis follows the MANDATORY FORMAT block above.`}
A short clear answer is better than a long vague one.

On a new line after your response, write exactly this format (required):
EXPLORE: [one specific follow-up question about a DIFFERENT aspect of this domain — something the user hasn't asked yet and that would naturally come next in this conversation. Must not repeat or summarise what you just answered.]`;
}
