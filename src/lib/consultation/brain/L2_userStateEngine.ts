// Pundit Brain — Layer 2: User State Engine
//
// Instead of just loading a Kundali, this engine builds a living picture
// of where the person is right now across every life dimension.
// The Pundit reads this before saying a single word.

import type { UserState, LifePhases, ConversationDepth } from "./types";
import type { StoredDomainMemory } from "../sessionMemory";
import type { DashaInfo } from "../../core/types";

// ── Dasha phase summary ───────────────────────────────────────────────────────

const DASHA_THEMES: Record<string, string> = {
  Sun:     "a period of authority, identity, and public recognition",
  Moon:    "a period of emotional sensitivity, nurturing, and mental fluctuation",
  Mars:    "a period of energy, action, ambition, and potential friction",
  Mercury: "a period of communication, analysis, learning, and quick decisions",
  Jupiter: "a period of wisdom, growth, expansion, and good judgment",
  Venus:   "a period of comfort, relationships, creativity, and material pleasure",
  Saturn:  "a period of discipline, delays, hard work, and long-term building",
  Rahu:    "a period of ambition, disruption, foreign influence, and unconventional paths",
  Ketu:    "a period of spiritual clarity, detachment, and letting go of outcomes",
};

function buildDashaPhase(dasha: DashaInfo | undefined): string {
  if (!dasha) return "Dasha period not determined";
  const maTheme = DASHA_THEMES[dasha.mahadasha] ?? "a significant period";
  const anTheme = DASHA_THEMES[dasha.antardasha] ?? "a supporting sub-period";
  return `${dasha.mahadasha}/${dasha.antardasha} — ${maTheme}, coloured by ${anTheme}`;
}

// Dasha alignment: is this mahadasha/antardasha combination generally supportive
// for worldly matters (career, finance) or more internal (health, spirituality)?
function getDashaAlignment(dasha: DashaInfo | undefined): "supportive" | "neutral" | "challenging" {
  if (!dasha) return "neutral";
  const supportive = ["Jupiter", "Venus", "Mercury", "Sun"];
  const challenging = ["Saturn", "Rahu", "Ketu", "Mars"];
  const mScore = supportive.includes(dasha.mahadasha) ? 1 : challenging.includes(dasha.mahadasha) ? -1 : 0;
  const aScore = supportive.includes(dasha.antardasha) ? 1 : challenging.includes(dasha.antardasha) ? -1 : 0;
  const total = mScore + aScore;
  if (total >= 1)  return "supportive";
  if (total <= -1) return "challenging";
  return "neutral";
}

// ── Life phases from stored memories ─────────────────────────────────────────

const CAREER_STAGES = {
  favorable:    "Recognition Phase",
  moderate:     "Building Phase",
  challenging:  "Consolidation Phase",
  default:      "Stable Phase",
};
const HEALTH_STAGES = {
  favorable:    "Healthy",
  moderate:     "Stable",
  challenging:  "Requires Attention",
  default:      "Stable",
};
const FINANCE_STAGES = {
  favorable:    "Growth Phase",
  moderate:     "Accumulating",
  challenging:  "Pressure Period",
  default:      "Stable",
};
const RELATIONSHIP_STAGES = {
  favorable:    "Harmonious",
  moderate:     "Stable",
  challenging:  "Distance / Friction",
  default:      "Stable",
};

function stateToPhase(
  state: string | null | undefined,
  stages: { favorable: string; moderate: string; challenging: string; default: string },
): string {
  if (!state) return stages.default;
  const s = state.toLowerCase();
  if (s.includes("highly favorable") || s.includes("favorable")) return stages.favorable;
  if (s.includes("challenging") || s.includes("difficult"))      return stages.challenging;
  return stages.moderate;
}

function buildLifePhases(memories: StoredDomainMemory[]): LifePhases {
  const byDomain = Object.fromEntries(memories.map(m => [m.domain, m]));

  const career = byDomain.career?.situation ?? stateToPhase(byDomain.career?.state, CAREER_STAGES);
  const health = stateToPhase(byDomain.health?.state, HEALTH_STAGES);
  const finance = stateToPhase(byDomain.finance?.state, FINANCE_STAGES);
  const relationship = stateToPhase(byDomain.relationship?.state, RELATIONSHIP_STAGES);

  return { career, health, finance, relationship };
}

// ── Mental state ──────────────────────────────────────────────────────────────

function buildMentalState(
  emotionalTone: string,
  dasha:         DashaInfo | undefined,
  recentTopics:  string[],
): string {
  // Tone-driven base
  const toneMap: Record<string, string> = {
    worried:    "Anxious and seeking reassurance",
    anxious:    "Anxious and seeking reassurance",
    low:        "Emotionally heavy — needs grounding",
    frustrated: "Frustrated — wants a clear path forward",
    excited:    "Energised and optimistic",
    hopeful:    "Cautiously optimistic",
    curious:    "Thoughtful and reflective",
    neutral:    "Calm and open",
  };
  const base = toneMap[emotionalTone] ?? "Calm and open";

  // Dasha colouring
  if (dasha?.mahadasha === "Saturn" || dasha?.mahadasha === "Rahu") {
    return `${base} (Dasha creating background pressure)`;
  }
  if (dasha?.mahadasha === "Jupiter" || dasha?.mahadasha === "Venus") {
    return `${base} (Dasha supporting positive outlook)`;
  }
  return base;
}

// ── Recent topics from history ────────────────────────────────────────────────

const TOPIC_PATTERNS: [string, RegExp][] = [
  ["promotion",    /promot|hike|appraisal|increment/i],
  ["management",   /management|boss|manager|director/i],
  ["job change",   /switch.*job|new job|resign|quit|interview/i],
  ["marriage",     /marriage|wedding|partner|propose/i],
  ["investment",   /invest|stock|mutual fund|crypto|property/i],
  ["health",       /health|sick|pain|recovery|energy|cold|fever/i],
  ["finances",     /money|finance|income|salary|loan|debt/i],
  ["timing",       /when|which month|right time|best time/i],
];

function extractRecentTopics(history: Array<{ role: string; content: string }>): string[] {
  const topics = new Set<string>();
  for (const m of history.filter(h => h.role === "user").slice(-20)) {
    for (const [topic, pattern] of TOPIC_PATTERNS) {
      if (pattern.test(m.content)) topics.add(topic);
    }
  }
  return [...topics];
}

function extractCurrentConcerns(history: Array<{ role: string; content: string }>): string[] {
  const concerns: string[] = [];
  const recent = history.filter(h => h.role === "user").slice(-5).map(m => m.content);

  for (const msg of recent) {
    if (/worried about|concerned about|scared of|anxious about/i.test(msg)) {
      const match = msg.match(/(?:worried|concerned|scared|anxious) (?:about|of) ([^.?!,]+)/i);
      if (match?.[1]) concerns.push(match[1].trim());
    }
  }
  return concerns.slice(0, 3);
}

function getConversationDepth(history: Array<{ role: string; content: string }>): ConversationDepth {
  const turns = history.filter(m => m.role === "user").length;
  if (turns >= 10) return "deep";
  if (turns >= 3)  return "ongoing";
  return "new";
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildUserState(
  history:      Array<{ role: string; content: string }>,
  memories:     StoredDomainMemory[],
  dashaInfo:    DashaInfo | undefined,
  emotionalTone: string,
): UserState {
  return {
    dashaPhase:        buildDashaPhase(dashaInfo),
    dashaAlignment:    getDashaAlignment(dashaInfo),
    lifePhases:        buildLifePhases(memories),
    mentalState:       buildMentalState(emotionalTone, dashaInfo, []),
    currentConcerns:   extractCurrentConcerns(history),
    recentTopics:      extractRecentTopics(history),
    conversationDepth: getConversationDepth(history),
  };
}
