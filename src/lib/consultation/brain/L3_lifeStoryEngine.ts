// Pundit Brain — Layer 3: Life Story Engine
//
// The biggest missing feature. Instead of answering each question in isolation,
// the Pundit maintains a running narrative arc for each life domain:
//
//   Career: "Promotion discussion started → Manager supportive → Decision pending"
//   Health: "Healthy → Cold started → Recovery phase → Energy returning"
//
// Each consultation advances the story. The Pundit always answers from the
// current chapter, not from zero.

import { prisma } from "../../prisma";
import type { DomainStoryArc, StoryEvent } from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

// ── Stage taxonomies ──────────────────────────────────────────────────────────

const CAREER_STAGES = [
  "Early Career", "Building Phase", "Gaining Visibility", "Recognition Phase",
  "Promotion Window", "Peak", "Plateau", "Transition", "New Beginning",
];

const HEALTH_STAGES = [
  "Healthy", "Minor Stress", "Active Concern", "Recovery", "Improving", "Restored",
];

const FINANCE_STAGES = [
  "Foundation Building", "Accumulating", "Stable", "Growth Phase",
  "Opportunity Window", "Financial Pressure", "Resolution",
];

const RELATIONSHIP_STAGES = [
  "Stable", "Distance", "Friction", "Communication Opening", "Healing", "Commitment",
];

const STAGE_TAXONOMIES: Record<string, string[]> = {
  career:       CAREER_STAGES,
  health:       HEALTH_STAGES,
  finance:      FINANCE_STAGES,
  relationship: RELATIONSHIP_STAGES,
};

// ── Next chapter prediction ───────────────────────────────────────────────────

function predictNextChapter(
  domain:       string,
  currentStage: string,
  memory:       StoredDomainMemory | undefined,
): string | null {
  const stages = STAGE_TAXONOMIES[domain];
  if (!stages) return null;
  const idx = stages.indexOf(currentStage);
  if (idx < 0 || idx >= stages.length - 1) return null;
  return stages[idx + 1];
}

// ── Infer current stage from memory ──────────────────────────────────────────

function inferCurrentStage(domain: string, memory: StoredDomainMemory | undefined): string {
  if (!memory) return STAGE_TAXONOMIES[domain]?.[0] ?? "Unknown";

  // Career: use the situation field if present
  if (domain === "career" && memory.situation) return memory.situation;

  // All domains: derive from state
  const state = memory.state?.toLowerCase() ?? "";
  const stages = STAGE_TAXONOMIES[domain];
  if (!stages) return "Unknown";

  if (domain === "health") {
    if (state.includes("challenging") || state.includes("difficult")) return "Active Concern";
    if (state.includes("moderate"))                                    return "Recovery";
    if (state.includes("favorable"))                                   return "Healthy";
  }
  if (domain === "career") {
    if (state.includes("highly favorable")) return "Recognition Phase";
    if (state.includes("favorable"))        return "Building Phase";
    if (state.includes("challenging"))      return "Plateau";
    return "Building Phase";
  }
  if (domain === "finance") {
    if (state.includes("highly favorable")) return "Growth Phase";
    if (state.includes("favorable"))        return "Accumulating";
    if (state.includes("challenging"))      return "Financial Pressure";
    return "Stable";
  }
  if (domain === "relationship") {
    if (state.includes("challenging")) return "Distance";
    if (state.includes("favorable"))   return "Harmonious";
    return "Stable";
  }

  return stages[1] ?? "Unknown";
}

// ── Extract story events from conversation history ────────────────────────────

const CAREER_EVENT_SIGNALS: [string, RegExp][] = [
  ["Promotion discussion started",   /discuss.*promot|promot.*discuss|talk.*promot/i],
  ["Manager showed support",         /manager.*support|boss.*support|support.*manager/i],
  ["Interview scheduled",            /interview.*schedul|schedul.*interview/i],
  ["Offer received",                 /receiv.*offer|got.*offer|offer.*received/i],
  ["Appraisal season opened",        /appraisal|performance review|annual review/i],
  ["Job change explored",            /switch.*job|resign|quit|new company/i],
  ["Recognition received",           /recogni|award|praised|appreciated/i],
];

const HEALTH_EVENT_SIGNALS: [string, RegExp][] = [
  ["Health concern appeared",        /sick|fell ill|not well|feeling unwell|pain started/i],
  ["Doctor consulted",               /doctor|physician|hospital|clinic/i],
  ["Recovery underway",              /recovering|getting better|improving/i],
  ["Energy returning",               /energy.*back|feeling better|much better/i],
  ["Back to normal",                 /normal|restored|healthy again|all good now/i],
];

const FINANCE_EVENT_SIGNALS: [string, RegExp][] = [
  ["Investment decision pending",    /invest|put.*money|allocat/i],
  ["Income question raised",         /salary|income|earnings/i],
  ["Expense pressure mentioned",     /expense|spend|debt|loan|emi/i],
  ["Financial opportunity appeared", /opportunit|bonus|gain|returns/i],
];

const RELATIONSHIP_EVENT_SIGNALS: [string, RegExp][] = [
  ["Distance noticed",               /distant|growing apart|communication.*less/i],
  ["Conflict mentioned",             /fight|argue|conflict|disagreement/i],
  ["Communication improving",        /talk.*better|communica.*improv/i],
  ["Healing progressing",            /healing|better.*understand|getting closer/i],
];

const EVENT_SIGNALS: Record<string, [string, RegExp][]> = {
  career:       CAREER_EVENT_SIGNALS,
  health:       HEALTH_EVENT_SIGNALS,
  finance:      FINANCE_EVENT_SIGNALS,
  relationship: RELATIONSHIP_EVENT_SIGNALS,
};

function extractNewEvents(
  domain:  string,
  history: Array<{ role: string; content: string }>,
): StoryEvent[] {
  const signals = EVENT_SIGNALS[domain] ?? [];
  const events: StoryEvent[] = [];
  const turns = history.filter(m => m.role === "user");
  const total = turns.length;

  turns.forEach((msg, i) => {
    for (const [eventName, pattern] of signals) {
      if (pattern.test(msg.content)) {
        const daysAgo = total - 1 - i;
        const approxDate =
          daysAgo === 0         ? "today" :
          daysAgo === 1         ? "yesterday" :
          daysAgo <= 3          ? "a few days ago" :
          daysAgo <= 7          ? "last week" :
          daysAgo <= 30         ? "recently" :
                                  "some time ago";
        events.push({ event: eventName, approximate_date: approxDate });
        break;
      }
    }
  });

  return events;
}

// ── Build story line string ───────────────────────────────────────────────────

function buildStoryLine(events: StoryEvent[], currentStage: string): string {
  const recent = events.slice(-4).map(e => e.event);
  if (recent.length === 0) return `Currently at: ${currentStage}`;
  return recent.join(" → ") + ` → ${currentStage}`;
}

// ── Load from DB ──────────────────────────────────────────────────────────────

async function loadStoryFromDB(userId: string, domain: string): Promise<DomainStoryArc | null> {
  try {
    const record = await prisma.consultationStory.findUnique({
      where: { userId_domain: { userId, domain } },
    });
    if (!record) return null;
    return {
      domain,
      currentStage: record.currentStage ?? "Unknown",
      events:       (record.events as StoryEvent[] | null) ?? [],
      storyLine:    record.storyLine ?? "",
      nextChapter:  record.nextChapter ?? null,
    };
  } catch {
    return null;
  }
}

// ── Save to DB (fire-and-forget) ──────────────────────────────────────────────

export async function saveStoryArc(userId: string, arc: DomainStoryArc): Promise<void> {
  try {
    const eventsJson = arc.events as unknown as import("@prisma/client").Prisma.InputJsonValue;
    await prisma.consultationStory.upsert({
      where: { userId_domain: { userId, domain: arc.domain } },
      create: {
        userId,
        domain:       arc.domain,
        currentStage: arc.currentStage,
        storyLine:    arc.storyLine,
        events:       eventsJson,
        nextChapter:  arc.nextChapter ?? null,
      },
      update: {
        currentStage: arc.currentStage,
        storyLine:    arc.storyLine,
        events:       eventsJson,
        nextChapter:  arc.nextChapter ?? null,
      },
    });
  } catch {
    // fire-and-forget — never block the chat response
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function buildLifeStory(
  userId:  string,
  domain:  string,
  history: Array<{ role: string; content: string }>,
  memory:  StoredDomainMemory | undefined,
): Promise<DomainStoryArc> {
  // Load existing arc from DB
  const existing = await loadStoryFromDB(userId, domain);

  // Determine current stage
  const currentStage = inferCurrentStage(domain, memory);

  // Extract new events from this session's history
  const newEvents    = extractNewEvents(domain, history);

  // Merge with existing events (deduplicate by event name)
  const existingEvents = existing?.events ?? [];
  const existingNames  = new Set(existingEvents.map(e => e.event));
  const merged = [
    ...existingEvents,
    ...newEvents.filter(e => !existingNames.has(e.event)),
  ].slice(-8); // keep last 8 events

  const storyLine   = buildStoryLine(merged, currentStage);
  const nextChapter = predictNextChapter(domain, currentStage, memory);

  return {
    domain,
    currentStage,
    events:     merged,
    storyLine,
    nextChapter,
  };
}
