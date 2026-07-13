// Consultation Intelligence — Layer 3: Question Planner
//
// Decides how to respond based on intent + conversation state.
// This is what makes Chat Pundit feel like a continuous consultation
// instead of a series of independent assessments.
//
// Three response modes:
//   full  — Run domain engine, full structured output (new topic / first question)
//   delta — Follow-up: answer only the new question, reuse prior reasoning
//   direct— Short direct answer: planet ranking, dasha date, pure explanation
//
// In delta and direct modes, the domain engine is NOT rerun. The LLM
// receives a tight prompt that answers only what was asked.

import type { ResolvedConsultationIntent } from "./intentResolver";
import type { ConversationState } from "./conversationState";
import type { AstrologyContext, PlanetStrength } from "../core/types";
import type { DashaInfo } from "../core/types";

export type ResponseMode = "full" | "delta" | "direct";

export interface ConsultationPlan {
  responseMode:          ResponseMode;
  requiresNewEvaluation: boolean;
  directPrompt?: {
    system: string;
    user:   string;
  };
}

// ─── Planet qualities for natural language ────────────────────────────────────

const PLANET_QUALITIES: Record<string, { positive: string; context: string; challenging: string }> = {
  Sun:     { positive: "confidence, authority, and career visibility",      context: "Leadership and recognition come more naturally.",        challenging: "ego conflicts or difficulty with authority figures" },
  Moon:    { positive: "emotional sensitivity, intuition, and adaptability", context: "Relationships and wellbeing are front and center.",       challenging: "mood swings or emotional restlessness" },
  Mars:    { positive: "energy, drive, and decisive action",                 context: "Courage, technical work, and physical effort are favored.", challenging: "impulsiveness or friction with others" },
  Mercury: { positive: "communication, analysis, and quick thinking",        context: "Planning, writing, and negotiation flow well.",            challenging: "overthinking or scattered focus" },
  Jupiter: { positive: "wisdom, growth, and expanding opportunity",          context: "Judgment, finances, and learning are naturally supported.", challenging: "overconfidence or missed details" },
  Venus:   { positive: "creativity, relationships, and comfort",             context: "Social life, partnerships, and aesthetics feel easier.",   challenging: "indulgence or over-dependence on others" },
  Saturn:  { positive: "discipline, structure, and long-term building",      context: "Steady effort now creates lasting results.",               challenging: "delays, restrictions, or heavy responsibility" },
  Rahu:    { positive: "ambition, change, and unconventional paths",         context: "Foreign opportunities, technology, and bold moves are favored.", challenging: "confusion, overreach, or breaking rules" },
  Ketu:    { positive: "spiritual clarity and detachment from outcomes",     context: "Introspection and letting go serve you best now.",         challenging: "disengagement or feeling directionless" },
};

// ─── Build planet ranking from AstrologyContext ───────────────────────────────

function rankPlanets(ctx: AstrologyContext): { planet: string; strength: number; positive: string; context: string }[] {
  return [...ctx.planetStrengths]
    .sort((a, b) => b.overallStrength - a.overallStrength)
    .slice(0, 4)
    .map(ps => ({
      planet:   ps.planet,
      strength: Math.round(ps.overallStrength),
      positive: PLANET_QUALITIES[ps.planet]?.positive  ?? "notable chart influence",
      context:  PLANET_QUALITIES[ps.planet]?.context   ?? "",
    }));
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildDeltaPrompt(
  intent:    ResolvedConsultationIntent,
  state:     ConversationState,
): { system: string; user: string } {
  const prior = state.priorAssessment!;

  const priorBlock = [
    `Prior reading: ${prior.overallLine}`,
    prior.whySentence ? `Established reason: ${prior.whySentence}` : null,
    state.activeTimeframe ? `Active timeframe: ${state.activeTimeframe}` : null,
    state.entities.employer ? `Context entity: ${state.entities.employer}` : null,
  ].filter(Boolean).join("\n");

  const intentHint = {
    Decision:    "Give clear advice: yes/no/qualified, then 1 sentence of reasoning.",
    Advice:      "Give a specific action recommendation in plain language.",
    Timing:      "Give a specific timing answer — which period, how long, or what to watch for.",
    Probability: "Give a direct probability / likelihood assessment in plain language.",
    Comparison:  "Compare directly to what was established — better, same, or worse, and why.",
    FollowUp:    "Continue the consultation naturally. Answer only what they asked.",
  }[intent.type] ?? "Answer only what they asked.";

  const system =
`You are a Vedic astrologer in a continuous consultation with this person.
They have already received a full reading. They are following up.

RULES (mandatory):
1. Answer ONLY what they asked — 1 to 4 sentences maximum.
2. Do NOT repeat the previous reading or generate new section headers.
3. Do NOT use emojis or structured formats — respond conversationally.
4. Reference the established context naturally, don't re-explain it.
5. Be direct and warm. Speak like an experienced Pundit, not a report generator.
6. ${intentHint}`;

  const user =
`${priorBlock}

User: ${intent.rawQuestion}`;

  return { system, user };
}

function buildPlanetPrompt(
  intent:  ResolvedConsultationIntent,
  state:   ConversationState,
  ctx:     AstrologyContext,
  dasha:   DashaInfo | undefined,
): { system: string; user: string } {
  const ranked = rankPlanets(ctx);
  const top    = ranked[0];
  const second = ranked[1];

  const planetBlock = ranked
    .map(p => `${p.planet} (strength ${p.strength}/100): ${p.positive}`)
    .join("\n");

  const dashaLine = dasha
    ? `Current dasha: ${dasha.mahadasha}/${dasha.antardasha} (runs until ${formatDate(dasha.periodEnd)})`
    : "";

  const domainContext = state.activeDomain ? `Domain of question: ${state.activeDomain}` : "";

  const system =
`You are a Vedic astrologer answering a specific question about planetary influences.

RULES:
1. Name 1-2 specific planets. Explain their quality in plain language.
2. Tie the answer to the domain or context if evident.
3. Maximum 3 sentences. No section headers. No bullet points.
4. Do NOT say "overallStrength" or "strength score" — translate to plain language.
   Use: "is your strongest influence", "is actively supporting", "is the most engaged".`;

  const user =
`PLANET STRENGTHS (pre-computed from natal + current activation):
${planetBlock}

${dashaLine}
${domainContext}

Question: ${intent.rawQuestion}`;

  return { system, user };
}

function buildExplanationPrompt(
  intent: ResolvedConsultationIntent,
  state:  ConversationState,
): { system: string; user: string } {
  const prior = state.priorAssessment!;

  const system =
`You are a Vedic astrologer. The person is asking why something is happening —
specifically asking about the reason behind their prior reading.

RULES:
1. Use the "Established reason" as the core of your answer.
2. Expand it into 2-3 natural sentences. Do not introduce unrelated reasons.
3. Speak plainly — no planet names, no technical terms, no section headers.
4. Be honest about what the chart shows and what it doesn't show.`;

  const user =
`Prior reading: ${prior.overallLine}
Established reason: ${prior.whySentence ?? "A short-lived pattern in the chart is creating this sensitivity."}

User: ${intent.rawQuestion}`;

  return { system, user };
}

function buildDashaPrompt(
  intent: ResolvedConsultationIntent,
  dasha:  DashaInfo | undefined,
): { system: string; user: string } | null {
  if (!dasha) return null;

  const system =
`You are a Vedic astrologer answering a specific question about the current dasha period.
Answer in 2-3 plain sentences. Include the end date. Briefly describe what this period means in life terms.
No section headers. No bullet points.`;

  const user =
`Current dasha: ${dasha.mahadasha} / ${dasha.antardasha}
Period ends: ${formatDate(dasha.periodEnd)}

Question: ${intent.rawQuestion}`;

  return { system, user };
}

function buildTransitPrompt(
  intent: ResolvedConsultationIntent,
  ctx:    AstrologyContext,
): { system: string; user: string } | null {
  if (!ctx.transit) return null;

  const transitLines = ctx.transit
    .filter(e => e.planet)
    .slice(0, 5)
    .map(e => `${e.planet}: ${e.label ?? e.description}`)
    .join("\n");

  const system =
`You are a Vedic astrologer answering a specific question about current planetary transits.
Answer in 2-3 plain sentences. Name the planet and what it is doing in life terms.
No technical house/sign jargon. No section headers.`;

  const user =
`Current transit observations:
${transitLines || "Transit data is being computed."}

Question: ${intent.rawQuestion}`;

  return { system, user };
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function planConsultation(
  intent:   ResolvedConsultationIntent,
  state:    ConversationState,
  ctx:      AstrologyContext,
  dashaInfo: DashaInfo | undefined,
): ConsultationPlan {

  const hasPrior = !!state.priorAssessment;
  const sameDomain = state.activeDomain === intent.domain || intent.inheritedDomain;

  // ── Direct: pure explanation ("Why?") ──────────────────────────────────────
  if (intent.type === "Explanation" && hasPrior && state.priorAssessment?.whySentence) {
    return {
      responseMode:          "direct",
      requiresNewEvaluation: false,
      directPrompt:          buildExplanationPrompt(intent, state),
    };
  }

  // ── Direct: planet question ────────────────────────────────────────────────
  if (intent.type === "PlanetQuestion") {
    return {
      responseMode:          "direct",
      requiresNewEvaluation: false,
      directPrompt:          buildPlanetPrompt(intent, state, ctx, dashaInfo),
    };
  }

  // ── Direct: dasha question ─────────────────────────────────────────────────
  if (intent.type === "DashaQuestion") {
    const prompt = buildDashaPrompt(intent, dashaInfo);
    if (prompt) {
      return { responseMode: "direct", requiresNewEvaluation: false, directPrompt: prompt };
    }
  }

  // ── Direct: transit question ───────────────────────────────────────────────
  if (intent.type === "TransitQuestion") {
    const prompt = buildTransitPrompt(intent, ctx);
    if (prompt) {
      return { responseMode: "direct", requiresNewEvaluation: false, directPrompt: prompt };
    }
  }

  // ── Delta: follow-up on same domain ───────────────────────────────────────
  if (hasPrior && sameDomain && (
    intent.isFollowUp ||
    intent.type === "FollowUp" ||
    intent.type === "Decision" ||
    intent.type === "Advice" ||
    intent.type === "Timing" ||
    intent.type === "Probability" ||
    intent.type === "Comparison" ||
    (intent.type === "Explanation" && !state.priorAssessment?.whySentence)
  )) {
    return {
      responseMode:          "delta",
      requiresNewEvaluation: false,
      directPrompt:          buildDeltaPrompt(intent, state),
    };
  }

  // ── Full: new domain, first question, or no prior context ─────────────────
  return {
    responseMode:          "full",
    requiresNewEvaluation: true,
  };
}
