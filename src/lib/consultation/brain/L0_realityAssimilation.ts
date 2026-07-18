// Pundit Brain — Layer 0: Reality Assimilation Engine
//
// Sits before all other layers. A real astrologer updates their mental model
// of a client's life before reasoning from the chart.
//
// On every message, this layer:
//   1. Detects what's new (life events)
//   2. Checks if the user is correcting a prior belief
//   3. Validates or updates open predictions
//   4. Decides if the story arc stage needs to advance
//   5. Writes to the Pundit's Notebook (longitudinal consultation log)
//   6. Decides if a clarifying question is more valuable than a full reading
//
// Output: RealityContext — consumed by all L1–L8 layers.

import type { Prisma } from "@prisma/client";
import { prisma }      from "../../prisma";

import type {
  RealityContext, LifeEvent, NotebookEntry, StoryStageUpdate,
  PredictionAssessment, Correction,
} from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

import { extractEvents, detectCorrection }  from "./L0_eventExtractor";
import { assessPredictions }                from "./L0_predictionValidator";
import { shouldAskClarification }           from "./L0_curiosityEngine";

// ── Notebook persistence ──────────────────────────────────────────────────────

export async function saveNotebookEntry(userId: string, entry: NotebookEntry): Promise<void> {
  try {
    const existing = await prisma.punditNotebook.findUnique({
      where: { userId_domain: { userId, domain: entry.domain } },
    });
    const prev    = (existing?.entries as NotebookEntry[] | null) ?? [];
    const updated = [...prev, entry].slice(-20); // keep last 20 entries
    const payload = updated as unknown as Prisma.InputJsonValue;

    await prisma.punditNotebook.upsert({
      where:  { userId_domain: { userId, domain: entry.domain } },
      create: { userId, domain: entry.domain, entries: payload },
      update: { entries: payload },
    });
  } catch {
    // fire-and-forget — never block the chat response
  }
}

export async function loadNotebook(userId: string, domain: string): Promise<NotebookEntry[]> {
  try {
    const record = await prisma.punditNotebook.findUnique({
      where: { userId_domain: { userId, domain } },
    });
    return (record?.entries as NotebookEntry[] | null) ?? [];
  } catch {
    return [];
  }
}

// ── Story stage update ────────────────────────────────────────────────────────

function inferStoryUpdate(
  newEvents: LifeEvent[],
  domain:    string,
  memories:  StoredDomainMemory[],
): StoryStageUpdate | null {
  const stageEvent = newEvents.find(e => e.impliedStage);
  if (!stageEvent?.impliedStage) return null;

  const memory       = memories.find(m => m.domain === domain);
  const currentStage = memory?.situation ?? "Unknown";

  if (currentStage === stageEvent.impliedStage) return null;

  return {
    domain,
    fromStage: currentStage,
    toStage:   stageEvent.impliedStage,
  };
}

// ── Notebook entry builder ────────────────────────────────────────────────────

function buildNotebookEntry(
  question:   string,
  newEvents:  LifeEvent[],
  correction: Correction | null,
  domain:     string,
): NotebookEntry {
  const date = new Date().toISOString().split("T")[0];

  let observation: string;
  if (newEvents.length > 0) {
    observation = newEvents.map(e => e.eventType).join(", ");
    if (newEvents.some(e => e.isOutcome)) observation += " — prediction confirmed";
  } else if (correction) {
    observation = `Corrected prior view: ${correction.newFact.slice(0, 80)}`;
  } else {
    observation = question.slice(0, 100).replace(/\n/g, " ");
  }

  return { date, domain, observation };
}

// ── Reality summary ───────────────────────────────────────────────────────────

function buildRealitySummary(
  newEvents:            LifeEvent[],
  correction:           Correction | null,
  validatedPredictions: PredictionAssessment[],
  storyUpdate:          StoryStageUpdate | null,
): string {
  const parts: string[] = [];

  if (newEvents.length > 0)            parts.push(`New: ${newEvents.map(e => e.eventType).join(", ")}`);
  if (storyUpdate)                     parts.push(`Stage: ${storyUpdate.fromStage} → ${storyUpdate.toStage}`);
  if (validatedPredictions.length > 0) parts.push(`Predictions: ${validatedPredictions.length} validated`);
  if (correction)                      parts.push("User corrected prior assessment");

  return parts.length ? parts.join(" | ") : "No significant change detected";
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function assimilateReality(
  question:  string,
  history:   Array<{ role: string; content: string }>,
  userId:    string,
  memories:  StoredDomainMemory[],
  domain:    string,
): Promise<RealityContext> {
  // 1. Extract life events from current message
  const newEvents = extractEvents(question, domain);

  // 2. Detect if user is correcting something we said
  const correction = detectCorrection(question, history);

  // 3. Assess predictions from prior assistant messages
  const allPredictions = assessPredictions(history, question);
  const validatedPredictions = allPredictions.filter(p => p.status === "Validated" || p.status === "Partially Occurred");
  const pendingPredictions   = allPredictions.filter(p => p.status !== "Validated" && p.status !== "Failed");

  // 4. Infer if the story arc stage should advance
  const storyUpdate = inferStoryUpdate(newEvents, domain, memories);

  // 5. Build notebook entry for this consultation
  const notebookEntry = buildNotebookEntry(question, newEvents, correction, domain);

  // 6. Decide if asking a clarifying question is more useful than answering
  const clarification = shouldAskClarification(question, history, memories, domain, newEvents);

  // 7. Reality summary (used in system prompt)
  const realitySummary = buildRealitySummary(newEvents, correction, validatedPredictions, storyUpdate);

  // Save notebook entry (fire-and-forget — must not block the response)
  void saveNotebookEntry(userId, notebookEntry);

  return {
    newEvents,
    correction,
    validatedPredictions,
    pendingPredictions,
    storyUpdate,
    notebookEntry,
    clarification,
    realitySummary,
  };
}
