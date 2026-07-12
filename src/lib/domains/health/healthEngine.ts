import { AstrologyContext, UncertaintyProfile, PredictionHorizon, DashaInfo } from "../../core/types";
import { DomainEngine, DomainSignalEngine, RecommendationEngine, PromptContext, DomainSignal } from "../../core/domain";
import { DecisionGraphBuilder } from "../../core/decision-graph";
import { CORE_RULESET } from "../../core/inference-engine";
import { HEALTH_KNOWLEDGE_PACK } from "./knowledgePack";
import { HealthAssessment } from "./healthTypes";
import { evaluateBodySystems, formatBodySystemsForNarrator } from "./diagnostics";
import type { HealthFindings } from "../../intelligence/health/healthFindingsEngine";

// HealthEngine is the Health domain implementation of DomainEngine<T>.
// It follows the CareerEngine reference pattern exactly:
//
//   1. Compute domain signals   — DomainSignalEngine + HEALTH_KNOWLEDGE_PACK
//   2. Build decision graph     — DecisionGraphBuilder.buildForDomain("Health")
//   3. Generate recommendations — RecommendationEngine + HEALTH_KNOWLEDGE_PACK
//   4. Assemble HealthAssessment (no planets, no houses, no yogas — structure only)
//   5. Build narrator prompt    — buildPrompt() → tight PromptContext for LLM
//
// IMPORTANT DATA LIMITATION:
//   D6 (Shashtamsha — the health divisional chart) is NOT yet in ChartSuite.
//   This engine is therefore D1-based only.  All signals are derived from the
//   birth chart's lagna, 6th, 8th house lords, and planetary strengths.
//   Phase A will integrate D6 and improve health timing specificity significantly.

export class HealthEngine implements DomainEngine<HealthAssessment> {
  readonly domain = "Health" as const;

  private readonly signalEngine         = new DomainSignalEngine();
  private readonly recommendationEngine = new RecommendationEngine();
  private readonly decisionGraphBuilder = new DecisionGraphBuilder();

  evaluate(ctx: AstrologyContext): HealthAssessment {
    // ── Step 1: Domain signals ─────────────────────────────────────────────
    const signals = this.signalEngine.compute(ctx, HEALTH_KNOWLEDGE_PACK);

    // ── Step 2: Decision graph ─────────────────────────────────────────────
    const decisionGraph = this.decisionGraphBuilder.buildForDomain(ctx, "Health");

    // ── Step 3: Recommendations ────────────────────────────────────────────
    const recommendations = this.recommendationEngine.generate(
      signals, decisionGraph, HEALTH_KNOWLEDGE_PACK,
    );

    // ── Step 4: Convenience accessors ─────────────────────────────────────
    const sig = (id: string) => signals.find(s => s.id === id)?.score ?? 50;

    const risks = decisionGraph.blockingFactors.map(f => f.label);

    // ── Step 5: Uncertainty profile ────────────────────────────────────────
    const uncertainty = computeUncertainty(ctx, signals);

    // ── Step 6: Prediction horizon ─────────────────────────────────────────
    const horizon = computeHorizon(decisionGraph.confidence, ctx);

    return {
      domain:               "Health",
      currentState:         decisionGraph.currentState,
      confidence:           decisionGraph.confidence,
      signals,
      constitutionStrength: sig("constitution"),
      immunityResilience:   sig("immunity"),
      mentalHealthScore:    sig("mental-health"),
      longevityIndicator:   sig("longevity"),
      recoveryCapacity:     sig("recovery-capacity"),
      bestTiming:           decisionGraph.timing,
      supportingFactors:    decisionGraph.supportingFactors,
      blockingFactors:      decisionGraph.blockingFactors,
      risks,
      recommendations,
      decisionGraph,
      uncertainty,
      horizon,
      completeness:         ctx.completeness,
      explainability:       ctx.explainability,
      ruleSetVersion:       CORE_RULESET.version,
      temporalStability:    ctx.temporalStability,
      transit:              ctx.transit,
      bodySystemReports:    evaluateBodySystems(ctx),
    };
  }

  buildPrompt(assessment: HealthAssessment, userQuery?: string): PromptContext {
    const systemInstruction =
`You are an experienced Vedic astrologer — a trusted Pundit speaking directly with a person.

ABSOLUTE RULES (any violation is a failure):
1. NEVER use these words in your response: confidence, uncertainty, completeness, explainability,
   activation, temporal stability, hypothesis, inference, decision graph, signal, score, dormant,
   "Medium uncertainty", "/100", "Favorable state", "the engine", "the model".
2. Do NOT describe how the reasoning system works — describe the person's situation.
3. Do NOT name planets or houses. "Moon in 6th" → "digestion may be sensitive". "Strong lagna lord" → "your constitution is resilient".
4. Answer the person's ACTUAL question. If they ask about today, focus on today — not lifelong patterns.
5. Do NOT write generic sentences that could apply to anyone.
6. Use simple Indian English — warm, caring, direct. Like a trusted family Pandit talking to a person.
   Examples: "Today looks good for your health." "Be a little careful about your digestion today." "There is nothing to worry about right now."
7. Length: 150–220 words. Natural, conversational — a Pundit speaking, not writing a report.

STRUCTURE — follow this EXACT order:
1. ONE sentence: Overall health picture for today.
2. BODY SYSTEMS — this is the MOST IMPORTANT part. Look at BODY SYSTEM ASSESSMENT below.
   Read both "AREAS NEEDING SPECIFIC ATTENTION TODAY" and "MILDLY SENSITIVE" sections:
   - "AREAS NEEDING SPECIFIC ATTENTION": NAME it clearly and say what's likely.
     Example: "Your respiratory system is a little sensitive today — slightly higher chance
     of sore throat or nasal congestion, especially if you go out in the cold."
   - "MILDLY SENSITIVE": NAME it and mention gently.
     Example: "Your digestion is slightly more sensitive today — light food will help."
     Example: "Your throat may feel a little dry — warm water through the day is helpful."
   - If neither section has anything: "No specific health concern stands out today."
   - NEVER list systems not mentioned in the assessment. Never say "X is fine."
3. ONE sentence on duration — only if a system is flagged.
4. ONE or TWO sentences: Practical advice tied to what was flagged.
   Respiratory → "Drink warm water. Avoid cold drinks and cold air."
   Digestive → "Eat light and on time. Avoid oily or heavy food today."
   Joints/Back → "Light stretching helps. Avoid sitting in one position too long."
   Sleep/Mental → "Wind down early tonight. Avoid screens before bed."
   Nothing flagged → one simple general tip only.

Length: 130–200 words. Never mention engine terms.`;

    // ── Body system reports are the core of the health answer ─────────────────
    const bodySystemSection = formatBodySystemsForNarrator(assessment.bodySystemReports);
    const overallPicture    = describeHealthState(assessment.currentState);
    const stabilityNote     = buildStabilityNote(assessment.temporalStability);
    const actions = assessment.recommendations
      .filter(r => r.stars >= 4)
      .slice(0, 2)
      .map(r => `• ${r.action}`)
      .join("\n") || "• Stay hydrated and eat on time";

    const userMessage =
`PUNDIT NOTES — translate into natural conversation. Never quote labels, numbers, or engine terms.

OVERALL PICTURE: ${overallPicture}

BODY SYSTEM ASSESSMENT (this drives the specifics of your answer):
${bodySystemSection}
${stabilityNote ? `\nPATTERN NOTE: ${stabilityNote}` : ""}

FALLBACK ACTIONS if no specific system is vulnerable:
${actions}

---
${userQuery ?? "How is my health today?"}`;

    return { domain: "Health", systemInstruction, userMessage };
  }

  // ── Decision Intelligence Format (Phase 2) ───────────────────────────────────
  // Uses healthFindings (body risk profile — always produces output) as the primary
  // data source for "What is happening?" and "What to do?", and the symbolic
  // assessment for "Why?" and "When will it change?".
  //
  // This ensures a specific health observation EVERY day, not just when transit
  // house rules fire. bodyRiskProfile always ranks every system.

  buildEnrichedPrompt(
    assessment:         HealthAssessment,
    healthFindings:     HealthFindings,
    dashaInfo:          DashaInfo | undefined,
    moonNakshatraIndex: number | undefined,
    userQuery?:         string,
  ): PromptContext {
    // Pre-compute all content — LLM fills the template, it does not reason
    const primary     = healthFindings.primaryFocus;
    const secondary   = healthFindings.secondaryFocus;
    const isConcerning = primary.score >= 58;

    const primaryEmoji   = SYSTEM_EMOJIS[primary.system]   ?? "🩺";
    const secondaryEmoji = secondary ? (SYSTEM_EMOJIS[secondary.system] ?? "🩺") : null;

    const overallLine   = buildHealthOverallLine(assessment.currentState, isConcerning, primary.displayName);
    const symptoms      = healthFindings.symptoms.slice(0, 4);
    const durationLine  = buildHealthDurationLine(assessment.transit ?? [], moonNakshatraIndex);
    const whyToday      = buildWhyTodaySentence(moonNakshatraIndex, assessment.transit ?? [], primary.system, primary.displayName);
    const outlookLine   = buildHealthOutlookLine(assessment.currentState, dashaInfo, isConcerning);
    const dashaNote     = buildDashaHealthContext(dashaInfo?.mahadasha, dashaInfo?.antardasha);

    const actions = [
      SYSTEM_SPECIFIC_ACTIONS[primary.system]?.[0],
      SYSTEM_SPECIFIC_ACTIONS[primary.system]?.[1],
      secondary ? SYSTEM_SPECIFIC_ACTIONS[secondary.system]?.[0] : null,
    ].filter(Boolean) as string[];

    const systemInstruction =
`You are writing a Vedic health consultation for a premium mobile app.

RULES (mandatory — any violation is a failure):
1. Never mention: planet names, house numbers, yoga names, engine terms, scores, percentages.
2. Never invent causal chains between separate body systems. If two systems are flagged,
   present them as separate — never say one is "because of" the other.
3. The WHY TODAY sentence must be used VERBATIM from PUNDIT NOTES — do not rephrase.
4. Do not add any text outside the template sections.
5. Write warmly but concisely.

OUTPUT IN EXACTLY THIS FORMAT (with emojis, line breaks, and bullets as shown):

🌿 Today's Health

Overall: [OVERALL LINE]

Primary area to watch

[EMOJI] [SYSTEM NAME]

You may be slightly more prone than usual to:

[SYMPTOM BULLETS — one per line with •]

[DURATION LINE]

Why today?
[WHY TODAY — verbatim from notes]

[IF SECONDARY SYSTEM: add section "Also worth noting" with emoji, name, and one line]

Today's guidance
[GUIDANCE BULLETS — one per line with •, tied to the specific flagged system]

Outlook
[OUTLOOK LINE]`;

    const userMessage =
`PUNDIT NOTES — use this content to fill the template. Do not add, remove, or rephrase.

OVERALL LINE: ${overallLine}

EMOJI: ${primaryEmoji}
SYSTEM NAME: ${primary.displayName}
SYMPTOM BULLETS:
${symptoms.map(s => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`).join("\n")}

DURATION LINE: ${durationLine}

WHY TODAY (use verbatim): ${whyToday}

${secondary && secondaryEmoji ? `SECONDARY SYSTEM: Yes
SECONDARY EMOJI: ${secondaryEmoji}
SECONDARY NAME: ${secondary.displayName}
SECONDARY LINE: ${SYSTEM_SPECIFIC_ACTIONS[secondary.system]?.[0] ?? "Be mildly aware of " + secondary.displayName.toLowerCase() + " sensitivity today."}
` : `SECONDARY SYSTEM: None — omit the "Also worth noting" section entirely
`}GUIDANCE BULLETS:
${actions.map(a => `• ${a}`).join("\n")}

OUTLOOK LINE: ${outlookLine}
${dashaNote ? `\nBACKGROUND NOTE (include only in Outlook if relevant, one line max): ${dashaNote}` : ""}

---
${userQuery ?? "How is my health today?"}`;

    return { domain: "Health", systemInstruction, userMessage };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeUncertainty(ctx: AstrologyContext, signals: DomainSignal[]): UncertaintyProfile {
  const missing: string[]     = [];
  const weak: string[]        = [];
  const conflicting: string[] = [];

  // D6 (Shashtamsha) is the primary health divisional chart — its absence is
  // a significant data gap that limits health timing specificity.
  missing.push(
    "D6 (Shashtamsha) not in ChartSuite — health timing and divisional chart analysis is unavailable; " +
    "all signals are D1-based only (Phase A will address this)",
  );

  // Standard timing data
  if (!ctx.dasha) {
    missing.push("Dasha periods not provided — maha/antardasha contribution is 0");
  }
  if (!ctx.transit) {
    missing.push("Current transit positions not provided — transit component is 0");
  }

  // Weak evidence
  const healthInferences = ctx.inferences.filter(i => i.domain === "Health");
  if (healthInferences.length < 3) {
    weak.push(
      `Only ${healthInferences.length} health inference rule(s) fired — limited signal diversity. ` +
      "Ensure HEALTH_RULES are registered in the InferenceEngine (see inferenceEngine.ts Phase 5+ comment).",
    );
  }
  const lowConfidenceSignals = signals.filter(s => s.confidence < 55);
  if (lowConfidenceSignals.length > 2) {
    weak.push(`Low evidence confidence on: ${lowConfidenceSignals.map(s => s.label).join(", ")}`);
  }

  // Conflicting evidence
  const constitution    = signals.find(s => s.id === "constitution")?.score   ?? 50;
  const immunity        = signals.find(s => s.id === "immunity")?.score        ?? 50;
  const mentalHealth    = signals.find(s => s.id === "mental-health")?.score   ?? 50;
  const chronicRisk     = signals.find(s => s.id === "chronic-risk")?.score    ?? 50;

  if (constitution >= 70 && chronicRisk >= 65) {
    conflicting.push(
      "Strong constitution + elevated chronic risk: robust natal vitality but structural vulnerabilities co-exist — preventive focus is warranted",
    );
  }
  if (immunity >= 70 && mentalHealth < 40) {
    conflicting.push(
      "High physical immunity + low mental health: body is resilient but psychological well-being requires separate, deliberate support",
    );
  }

  // Check if negative health inference contradicts positive
  const hasNegativeHealth = ctx.inferences.some(
    i => i.domain === "Health" && i.direction === "Negative" && i.confidence >= 65,
  );
  const hasPositiveHealth = ctx.inferences.some(
    i => i.domain === "Health" && i.direction === "Positive" && i.confidence >= 70,
  );
  if (hasNegativeHealth && hasPositiveHealth) {
    conflicting.push(
      "Strong positive health indicators co-exist with notable negative ones — the chart shows mixed constitutional signals; a nuanced, area-specific approach is recommended",
    );
  }

  const overallUncertainty: "Low" | "Medium" | "High" =
    // D6 missing is always significant — minimum Medium
    conflicting.length > 0 || missing.length >= 3 ? "High" :
    missing.length >= 1 || weak.length > 0 ? "Medium" : "Low";

  return { missingData: missing, weakEvidence: weak, conflictingEvidence: conflicting, overallUncertainty };
}

function computeHorizon(confidence: number, ctx: AstrologyContext): PredictionHorizon {
  if (ctx.dasha) {
    return {
      scope:       "CurrentDasha",
      label:       "Current Dasha Period",
      description: `Assessment is anchored to the current dasha cycle (ending ${ctx.dasha.periodEnd}). Re-evaluate when dasha changes.`,
    };
  }
  return {
    scope:       "LongTerm",
    label:       "Long-Term Natal Tendency",
    description: "Assessment reflects natal chart patterns — valid as a long-term tendency. Provide dasha periods for timing-specific guidance.",
  };
}

// ── Narrator translation helpers ──────────────────────────────────────────────
// These convert engine state (Layer 1) → pundit observations (Layer 2).
// The LLM narrator only sees Layer 2 and produces the human conversation (Layer 3).

function describeHealthState(state: string): string {
  const map: Record<string, string> = {
    "Highly Favorable": "Today is very supportive for health — energy and vitality are well-supported.",
    "Favorable":        "Today looks good for health overall — no significant concerns are indicated.",
    "Moderate":         "Today is reasonably balanced for health, with a few things worth being mindful of.",
    "Challenging":      "Today calls for some extra care — pace yourself and pay attention to your body.",
    "Highly Challenging": "Today is a more demanding day for health — rest, hydration, and self-care are especially important.",
  };
  return map[state] ?? "Today is reasonably balanced for health.";
}

// Hardcoded observations per transit rule — this is astrological knowledge, not algorithm.
const HEALTH_TRANSIT_OBSERVATIONS: Record<string, string> = {
  "transit-moon-1st-health":      "Energy and vitality get a small natural lift today (short-lived, ~2–3 days).",
  "transit-moon-6th-health":      "Digestion may be a little more sensitive than usual today (short-lived, ~2–3 days).",
  "transit-moon-8th-health":      "There may be a sense of hidden fatigue or emotional heaviness today (short-lived, ~2–3 days).",
  "transit-moon-12th-health":     "Sleep and rest may be unusually light or deep today — wind down early (short-lived, ~2–3 days).",
  "transit-moon-4th-health":      "Emotional comfort supports recovery today — staying in familiar surroundings helps (short-lived, ~2–3 days).",
  "transit-moon-5th-health":      "Mood and energy are slightly elevated today — a good day to stay gently active (short-lived, ~2–3 days).",
  "transit-moon-9th-health":      "Mental clarity and positive outlook are good today (short-lived, ~2–3 days).",
  "transit-jupiter-lagna-health": "A longer beneficial cycle is currently supporting overall constitution and vitality (ongoing).",
  "transit-jupiter-6th-health":   "Immune resilience and recovery are strengthened by a positive cycle right now (ongoing).",
  "transit-saturn-lagna-health":  "A slower, more demanding cycle is creating some background pressure on vitality — pace yourself (ongoing, months to years).",
  "transit-saturn-6th-health":    "Health responds best to consistent routine and discipline right now — structure is the key (ongoing, months to years).",
  "transit-saturn-8th-health":    "An ongoing cycle is drawing attention to chronic or underlying health matters — steady care matters (ongoing, months to years).",
  "transit-mars-6th-health":      "The immune system is in a more reactive state right now — avoid overexertion and support recovery (weeks to months).",
  "transit-mars-lagna-health":    "Physical drive and energy are elevated — good for activity, but avoid reckless effort (weeks to months).",
};

function buildHealthTransitNote(transit: import("../../core/transit-engine/types").TransitEvidence[]): string | null {
  if (!transit.length) return null;
  const lines = transit
    .filter(t => t.direction !== "Neutral")
    .map(t => HEALTH_TRANSIT_OBSERVATIONS[t.ruleId] ?? `${t.label} — ${t.direction.toLowerCase()} influence.`);
  return lines.length ? lines.join(" ") : null;
}

function buildStabilityNote(stability: import("../../core/transit-engine/types").TemporalStabilityScore | undefined): string | null {
  if (!stability) return null;
  if (stability.label === "Volatile")  return "Note: today's reading is shaped by a temporary short-lived influence. The longer-term health picture looks different from today.";
  if (stability.label === "Variable")  return "Note: today's picture differs somewhat from the longer-term pattern — this is partly driven by a passing influence.";
  return null; // Stable / Moderate: no need to qualify
}

// ── Phase 2 Decision Intelligence helpers ──────────────────────────────────────
// Used by buildEnrichedPrompt() — provides the "why" and "what to do" content.

// Nakshatra-specific "why" statements — simple human language, no technical terms.
// Index 0–26 = Ashwini → Revati.
const NAKSHATRA_WHY_MAP: Record<number, string> = {
  0:  "Today's chart position creates a slight tendency toward nervous energy and mild head heaviness.",
  1:  "Today the chart makes the throat and ear-nose-throat area slightly more reactive than usual.",
  2:  "Today's chart position creates a mild tendency toward heat and inflammation.",
  3:  "Today's position connects emotional state with throat and stomach sensitivity.",
  4:  "Today's chart position creates a tendency toward stiffness in joints and back.",
  5:  "Today's Moon position is one that classically brings cold-onset and congestion sensitivity.",
  6:  "Today's position mildly affects the digestive fire, making the stomach more reactive.",
  7:  "Today's chart makes the stomach and gut slightly more sensitive to irregular eating.",
  8:  "Today's Moon placement increases mucus-related sensitivity and cold-food reactivity.",
  9:  "Today's position creates some variability in energy levels through the day.",
  10: "Today's placement mildly affects energy and skin sensitivity.",
  11: "Today's position creates a link between digestion and lower back sensitivity.",
  12: "Today's Moon heightens the nervous system slightly — the mind-body connection is stronger today.",
  13: "Today's chart makes the skin and digestive system more reactive than usual.",
  14: "Today's Moon is in a position that classically brings sensitivity to breathing and throat.",
  15: "Today's position creates emotional-digestive sensitivity — the gut is more reactive to stress.",
  16: "Today's chart position mildly affects heart and immune sensitivity.",
  17: "Today's Moon creates a link between mental stress and physical symptoms — particularly in the back.",
  18: "Today's position creates a tendency toward back and joint stiffness.",
  19: "Today's Moon placement is classically associated with joint and respiratory sensitivity.",
  20: "Today's chart position creates mild joint and cardiovascular load.",
  21: "Today's Moon creates ENT — throat and ear — sensitivity.",
  22: "Today's position creates mild joint stiffness and energy fluctuation.",
  23: "Today's Moon is in a position that affects the immune system and creates mild viral susceptibility.",
  24: "Today's placement creates mental restlessness and some immune sensitivity.",
  25: "Today's chart position makes recovery and energy management more important than usual.",
  26: "Today's Moon position mildly affects digestion and immunity.",
};

// System-specific practical actions — tied to the body system, not generic.
const SYSTEM_SPECIFIC_ACTIONS: Record<string, string[]> = {
  respiratorySystem:       [
    "Drink warm water through the day — avoid cold or iced drinks completely today",
    "Stay away from cold air, dust, and rain as much as possible",
    "If the throat feels dry, a steam inhalation in the evening will help",
  ],
  coldViralSusceptibility: [
    "Drink warm water or ginger tea through the day",
    "Avoid cold food, ice, and cold environments — your body is slightly more vulnerable today",
    "Wash hands more often and avoid being around people who are unwell",
  ],
  throat:                  [
    "Gargle with warm salt water morning and evening",
    "Avoid cold drinks and dry, dusty environments",
    "Rest your voice if you have to speak a lot today",
  ],
  digestiveSystem:         [
    "Eat light today — avoid oily, very spicy, or heavy food",
    "Don't skip meals, but keep portions moderate and eat slowly",
    "Warm water after meals helps the digestive fire",
  ],
  stomach:                 [
    "Eat on time and avoid eating very late at night",
    "Prefer warm, easily digestible food — avoid raw salads and cold meals",
    "Ginger in your food or tea today helps settle the stomach",
  ],
  head:                    [
    "Take a break from screens every hour — your eyes and head will thank you",
    "Keep yourself well-hydrated — mild headaches often respond to water",
    "Avoid loud, chaotic environments if possible",
  ],
  energyStamina:           [
    "Don't overcommit today — moderate pace is better than pushing hard",
    "A short rest after lunch will help sustain energy through the evening",
    "Light food and adequate water will help more than caffeine today",
  ],
  sleep:                   [
    "Wind down by 9:30 PM tonight — no screens after 9 PM",
    "A warm drink before bed (warm milk or herbal tea) helps settle the mind",
    "Keep your sleeping space cool and quiet tonight",
  ],
  mentalWellness:          [
    "Avoid emotionally draining conversations or difficult decisions today if possible",
    "20 minutes of quiet — a short walk, meditation, or simply sitting without screens — will help significantly",
    "Good sleep tonight will reset things — prioritize it",
  ],
  joints:                  [
    "Light stretching in the morning helps joint stiffness significantly",
    "Avoid sitting or standing in one position for too long today",
    "Keep joints warm — avoid cold water on the knees or joints",
  ],
  back:                    [
    "Take a 5-minute walk every hour if you are sitting at work",
    "Gentle back stretches before sleeping will ease tension",
    "Avoid heavy lifting and stooping today",
  ],
  inflammation:            [
    "Stay cool — avoid overexertion and very hot, humid environments",
    "Eat clean and light today — fried and very spicy food aggravates the inflammatory tendency",
    "Coconut water or cooling foods help if body heat feels high",
  ],
  immuneSystem:            [
    "Sleep well tonight — immune recovery happens primarily during deep sleep",
    "Eat nourishing food — avoid junk food and excess sugar today",
    "A warm drink with ginger or turmeric supports immune function",
  ],
  nervousSystem:           [
    "Reduce screen time after 7 PM today",
    "Short, quiet breaks between tasks will help the nervous system settle",
    "Avoid caffeine in the afternoon — it can amplify nervous system reactivity",
  ],
  allergySensitivity:      [
    "Avoid known allergens — dust, pollen, strong perfumes — more than usual today",
    "Keep your living space clean and ventilated",
    "An antihistamine on hand is wise if you're allergy-prone",
  ],
  skinHealth:              [
    "Avoid harsh skin products and excessive sun exposure today",
    "Stay well-hydrated — skin sensitivity responds strongly to water intake",
    "A light, non-irritating moisturizer helps if skin feels dry",
  ],
  "General Vitality":      [
    "Take it a little easier today — don't push through fatigue",
    "Eat nourishing food and rest well tonight",
    "Stay hydrated — energy dips are more likely when you're under-hydrated",
  ],
};

// Dasha-planet → background health context (long-term pattern).
function buildDashaHealthContext(mahadasha?: string, antardasha?: string): string | null {
  const planet = antardasha ?? mahadasha;
  if (!planet) return null;
  const map: Record<string, string> = {
    Saturn:  "The current period in your chart brings a background tendency toward dryness, joint stiffness, and slower recovery — consistency matters more than intensity.",
    Rahu:    "The current period adds some background viral and allergy sensitivity — unusual or hard-to-diagnose symptoms can occur. Trust your body.",
    Ketu:    "The current period can bring mysterious or fluctuating health patterns — spiritual and mental well-being strongly affect physical health now.",
    Mars:    "The current period has a background tendency toward heat and inflammation — cooling diet and avoiding overexertion help.",
    Moon:    "The current period makes emotions more directly connected to physical health — mental peace directly supports physical well-being.",
    Jupiter: "The current period supports good immunity and recovery — the body handles stress better than usual.",
    Mercury: "The current period connects nervous system sensitivity with health — overthinking and anxiety can manifest physically.",
    Venus:   "The current period supports kidney and skin health — adequate hydration matters more now.",
    Sun:     "The current period supports overall vitality and immunity — a good time to build health habits.",
  };
  return map[planet] ?? null;
}

function formatPeriodEnd(periodEnd: string): string {
  try {
    const d = new Date(periodEnd);
    return `until ${d.toLocaleString("en-IN", { month: "long" })} ${d.getFullYear()}`;
  } catch {
    return "through this period";
  }
}

// ── Template format helpers (used by buildEnrichedPrompt) ─────────────────────

const SYSTEM_EMOJIS: Record<string, string> = {
  respiratorySystem:       "🫁",
  coldViralSusceptibility: "🤧",
  throat:                  "🗣️",
  digestiveSystem:         "🫃",
  stomach:                 "🥗",
  head:                    "🧠",
  energyStamina:           "⚡",
  sleep:                   "😴",
  mentalWellness:          "💭",
  joints:                  "🦴",
  back:                    "🦴",
  inflammation:            "🌡️",
  immuneSystem:            "🛡️",
  nervousSystem:           "🧬",
  allergySensitivity:      "🌿",
  skinHealth:              "✨",
  "General Vitality":      "💪",
};

function buildHealthOverallLine(state: string, isConcerning: boolean, systemName: string): string {
  if (state === "Highly Favorable") return "Excellent. Strong health support across all areas today.";
  if (state === "Favorable" && !isConcerning) return "Good. Your health looks stable today with no significant concern.";
  if (state === "Favorable")   return `Good, with a temporary sensitivity around the ${systemName.toLowerCase()}.`;
  if (state === "Moderate")    return `Moderate. Worth being aware of some sensitivity around the ${systemName.toLowerCase()} today.`;
  if (state === "Challenging") return `A day that calls for some extra care, particularly around the ${systemName.toLowerCase()}.`;
  return `Stable overall, with a mild ${systemName.toLowerCase()} sensitivity worth noting today.`;
}

function buildHealthDurationLine(
  transit: import("../../core/transit-engine/types").TransitEvidence[],
  _nakshatraIndex: number | undefined,
): string {
  const hasSaturn = transit.some(t => t.planet === "Saturn" && t.direction === "Challenging");
  if (hasSaturn) return "Note: this is a longer-term influence lasting months, not just today.";
  const hasMars   = transit.some(t => t.planet === "Mars"   && t.direction === "Challenging");
  if (hasMars)   return "This influence is likely to last a few weeks.";
  return "This influence appears temporary and is likely to ease within 1–2 days.";
}

function buildWhyTodaySentence(
  nakshatraIndex: number | undefined,
  transit: import("../../core/transit-engine/types").TransitEvidence[],
  _primarySystem: string,
  displayName: string,
): string {
  // Priority 1: specific fired transit rule
  const TRANSIT_WHY: Record<string, string> = {
    "transit-moon-6th-health":     "A short-lived planetary influence is creating some digestive sensitivity today — this passes in about 2 days as the chart shifts.",
    "transit-moon-8th-health":     "A brief planetary influence is drawing energy inward today, which can create a sense of hidden fatigue — this passes in about 2 days.",
    "transit-moon-12th-health":    "A short-lived influence is making sleep and rest more variable today — this passes in about 2 days.",
    "transit-saturn-lagna-health": "A longer-term planetary influence is creating some background pressure on overall vitality — this one lasts months, not days.",
    "transit-saturn-8th-health":   "A longer-term influence is drawing attention to underlying health matters — this is a background pattern, not an acute event.",
    "transit-mars-6th-health":     "A planetary influence over the coming weeks is making the immune system more reactive than usual.",
  };
  const challengingTransit = transit.find(t => t.direction === "Challenging" && TRANSIT_WHY[t.ruleId]);
  if (challengingTransit) return TRANSIT_WHY[challengingTransit.ruleId];

  // Priority 2: Moon nakshatra
  if (nakshatraIndex !== undefined && NAKSHATRA_WHY_MAP[nakshatraIndex]) {
    return NAKSHATRA_WHY_MAP[nakshatraIndex];
  }
  return `A short-lived influence in today's chart is creating some sensitivity in the ${displayName.toLowerCase()} area. This should ease in a day or two.`;
}

function buildHealthOutlookLine(state: string, dashaInfo: DashaInfo | undefined, isConcerning: boolean): string {
  if (!isConcerning) return "There are no signs of a significant health disturbance today. Health looks stable.";
  if (state === "Challenging") {
    return "This appears to be a temporary pattern rather than a long-term health issue. If symptoms persist beyond 2–3 days, it is worth paying closer attention.";
  }
  if (dashaInfo) {
    return "This looks like a short-term transit effect, not a long-term health issue. No reason for lasting concern.";
  }
  return "This is a temporary influence — no indication of a lasting health concern.";
}
