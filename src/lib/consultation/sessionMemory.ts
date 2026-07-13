// Consultation Intelligence — Session Memory
//
// Persists the last known domain assessment per user in the DB so the
// Pundit remembers context across sessions. When the user comes back
// the next day, the Pundit already knows: "Your career is in a
// Promotion Window" without them having to re-establish context.
//
// Freshness: a memory is valid as long as the dasha hasn't changed and
// it's less than 30 days old. A new dasha period means a different
// life phase — the reading should restart.

import { prisma } from "@/lib/prisma";

export interface StoredDomainMemory {
  domain:       string;
  state:        string | null;
  overallLine:  string | null;
  whySentence:  string | null;
  situation:    string | null;
  mahadasha:    string | null;
  antardasha:   string | null;
  dashaEndDate: string | null;
  topics:       string[];
  updatedAt:    Date;
}

// ─── Freshness check ──────────────────────────────────────────────────────────
// A memory goes stale when:
// 1. The dasha period it was recorded in has ended (new life phase)
// 2. It's older than 30 days (domain landscapes shift meaningfully)

export function isMemoryFresh(memory: StoredDomainMemory): boolean {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (memory.updatedAt < thirtyDaysAgo) return false;

  if (memory.dashaEndDate) {
    const endDate = new Date(memory.dashaEndDate);
    if (endDate < new Date()) return false;
  }

  return true;
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadUserMemories(userId: string): Promise<StoredDomainMemory[]> {
  try {
    const rows = await prisma.consultationMemory.findMany({
      where: { userId },
    });

    return rows
      .map(r => ({
        domain:       r.domain,
        state:        r.state,
        overallLine:  r.overallLine,
        whySentence:  r.whySentence,
        situation:    r.situation,
        mahadasha:    r.mahadasha,
        antardasha:   r.antardasha,
        dashaEndDate: r.dashaEndDate,
        topics:       Array.isArray(r.topics) ? (r.topics as string[]) : [],
        updatedAt:    r.updatedAt,
      }))
      .filter(isMemoryFresh);
  } catch {
    // Memory is enrichment — never block the chat on a DB error
    return [];
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveConsultationMemory(
  userId: string,
  data:   Partial<StoredDomainMemory> & { domain: string },
): Promise<void> {
  try {
    await prisma.consultationMemory.upsert({
      where:  { userId_domain: { userId, domain: data.domain } },
      update: {
        state:        data.state        ?? null,
        overallLine:  data.overallLine  ?? null,
        whySentence:  data.whySentence  ?? null,
        situation:    data.situation    ?? null,
        mahadasha:    data.mahadasha    ?? null,
        antardasha:   data.antardasha   ?? null,
        dashaEndDate: data.dashaEndDate ?? null,
        topics:       data.topics ?? [],
      },
      create: {
        userId,
        domain:       data.domain,
        state:        data.state        ?? null,
        overallLine:  data.overallLine  ?? null,
        whySentence:  data.whySentence  ?? null,
        situation:    data.situation    ?? null,
        mahadasha:    data.mahadasha    ?? null,
        antardasha:   data.antardasha   ?? null,
        dashaEndDate: data.dashaEndDate ?? null,
        topics:       data.topics ?? [],
      },
    });
  } catch {
    // Fire-and-forget: never block the response on a save failure
  }
}

// ─── Extract memory from a completed domain response ─────────────────────────
// Parse the LLM's structured output to populate the memory object.
// Uses the same section markers as conversationState.ts.

const DOMAIN_EMOJI_MAP: Record<string, string> = {
  "🌿": "health",
  "💼": "career",
  "💰": "finance",
  "💝": "relationship",
};

export function extractMemoryFromResponse(
  domain:      string,
  responseText: string,
  dashaInfo?:  { mahadasha: string; antardasha: string; periodEnd: string },
  topics?:     string[],
): Partial<StoredDomainMemory> & { domain: string } | null {
  // Only extract from structured domain responses (emoji header present)
  const hasDomainHeader = Object.keys(DOMAIN_EMOJI_MAP).some(e =>
    responseText.trimStart().startsWith(e),
  );
  if (!hasDomainHeader) return null;

  // "Overall: ..." line
  const overallMatch  = responseText.match(/Overall:\s*(.+)/);
  const overallLine   = overallMatch?.[1]?.trim() ?? null;
  if (!overallLine) return null;

  // Infer state from overall line
  let state: string | null = null;
  if (/^Strong\b/i.test(overallLine))      state = "Highly Favorable";
  else if (/^Good\b/i.test(overallLine))   state = "Favorable";
  else if (/^Steady\b/i.test(overallLine)) state = "Moderate";
  else if (/^A more\b/i.test(overallLine) || /^A testing\b/i.test(overallLine)) state = "Challenging";
  else if (/^A complex\b/i.test(overallLine)) state = "Highly Challenging";

  // "Why" sentence
  const whyMatch    = responseText.match(/Why (?:today|tomorrow|this period)\?\s*\n([^\n]+)/);
  const whySentence = whyMatch?.[1]?.trim() ?? null;

  // Career situation — look for named situation in the response
  let situation: string | null = null;
  if (domain === "career") {
    const situations = [
      "Promotion Window", "Recognition Moment", "Leadership Opportunity",
      "Expansion Period", "Stability Phase", "Building Phase",
      "High Effort Period", "Strategic Patience", "Career Transition Signal",
      "Technical Excellence",
    ];
    for (const s of situations) {
      if (responseText.includes(s)) { situation = s; break; }
    }
  }

  return {
    domain,
    state,
    overallLine,
    whySentence,
    situation,
    mahadasha:    dashaInfo?.mahadasha    ?? null,
    antardasha:   dashaInfo?.antardasha   ?? null,
    dashaEndDate: dashaInfo?.periodEnd    ?? null,
    topics:       topics ?? [],
  };
}
