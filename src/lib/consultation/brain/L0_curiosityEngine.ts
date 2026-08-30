// Pundit Brain — Layer 0c: Curiosity Engine
//
// A real astrologer asks before answering when context is stale or incomplete.
//
// Example:
//   "Before I answer — has the appraisal discussion happened yet? I want to
//    make sure I'm reading the current picture, not last month's."
//
// Rules:
//   • Never ask if the user already told us something new (events detected)
//   • Never ask if the user's message is already detailed (>15 words)
//   • Never ask twice in a row (last AI response was already a clarification)
//   • Max 1 clarification per 4 user turns
//   • Only ask when the answer will genuinely change the reading

import type { ClarificationNeeded, LifeEvent } from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

export function shouldAskClarification(
  question:  string,
  history:   Array<{ role: string; content: string }>,
  memories:  StoredDomainMemory[],
  domain:    string,
  newEvents: LifeEvent[],
): ClarificationNeeded | null {
  // User already told us something new — no need to ask
  if (newEvents.length > 0) return null;

  // Long message = user gave context; just answer
  if (question.trim().split(/\s+/).length > 15) return null;

  // Don't ask in the very first 2 turns
  const userTurns = history.filter(m => m.role === "user").length;
  if (userTurns < 2) return null;

  // Don't double-ask: if last AI response was already a clarification, skip
  const lastAI = history.filter(m => m.role === "assistant").slice(-1)[0];
  if (lastAI && /before I (go|answer)|just to (confirm|check)|has.*happened\?|did.*happen\?/i.test(lastAI.content)) {
    return null;
  }

  // Max 1 clarification in the last 4 AI turns
  const recentAITurns = history.filter(m => m.role === "assistant").slice(-4);
  const recentClarifications = recentAITurns.filter(m =>
    /before I (go|answer)|just to (confirm|check)/i.test(m.content)
  ).length;
  if (recentClarifications > 0) return null;

  const memory = memories.find(m => m.domain === domain);

  // ── Situation 1: Pending career event ───────────────────────────────────────
  if (domain === "career" && memory?.situation) {
    const isPending = /promot|appraisal|interview|offer|decision|review|pending|waiting/i.test(memory.situation);
    const isGeneralCheck = /how|what|when|update|status|any.*news|still/i.test(question);

    if (isPending && isGeneralCheck) {
      return {
        question: `Before I go further — has there been any movement on the ${memory.situation.toLowerCase()} since we last spoke? I want to make sure I'm reading the current position, not last time's.`,
        reason:   `Pending career event "${memory.situation}" in stored memory`,
        domain,
      };
    }
  }

  // ── Situation 2: Active health concern ──────────────────────────────────────
  if (domain === "health" && memory) {
    const isActive = /challenging|difficult|active|concern|recovering|ill/i.test(memory.state ?? "");
    const isGeneralCheck = /how|feel|better|update|same|still/i.test(question);

    if (isActive && isGeneralCheck) {
      return {
        question: `Quick check before I answer — are you still in the same health phase from our last conversation, or has something shifted?`,
        reason:   "Active health concern in stored memory",
        domain,
      };
    }
  }

  // ── Situation 3: Recent short-window prediction may have elapsed ─────────────
  const recentPrediction = history
    .filter(m => m.role === "assistant")
    .slice(-4)
    .find(m => /within.*2[\-–]4 weeks|within.*next.*2|coming.*weeks|next.*few.*weeks/i.test(m.content));

  if (recentPrediction && (domain === "career" || domain === "finance")) {
    const isVague = question.trim().split(/\s+/).length < 8;
    if (isVague) {
      return {
        question: `I mentioned a window forming in the next few weeks last time — has anything moved on that front, or should I read the current position fresh?`,
        reason:   "Recent short-window prediction may have elapsed with no update",
        domain,
      };
    }
  }

  return null;
}
