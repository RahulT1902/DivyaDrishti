/**
 * Step C — prediction accountability.
 *
 * A Gold Standard answer's firm and moderate windows become checkable
 * predictions. Each is built from the computed TIMING EVIDENCE (window dates,
 * verdict, the events behind it), never from the model's wording. Once a
 * window has passed, the user is asked whether it matched; the answers give
 * per-domain and per-confidence hit rates, so "firm" can be seen to mean
 * something, or not.
 */

import { prisma } from "@/lib/prisma";
import type { TimingEvidence, TimingSegment } from "./timing/timingEngine";

const DAY = 24 * 60 * 60 * 1000;
// A window shorter than this is too brief for anyone to judge afterwards.
const MIN_DAYS = 3;

/** How each domain is named in a check-in question. */
const AREA: Record<string, string> = {
  health: "your health and energy",
  career: "work and career matters",
  finance: "money matters",
  property: "property matters",
  relationship: "your relationship",
  family: "family life",
  education: "your studies",
};

export interface PredictionDraft {
  domain: string;
  question: string;
  windowStart: Date;
  windowEnd: Date;
  direction: "favourable" | "caution";
  confidence: "firm" | "moderate";
  reason: string;
  checkQuestion: string;
}

const day = (d: Date, tz: string) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: tz });

interface Run { from: Date; to: Date; direction: TimingSegment["direction"]; confidence: TimingSegment["confidence"]; events: string[] }

const RANK = { tentative: 0, moderate: 1, firm: 2 } as const;

/**
 * Neighbouring windows with the same verdict ("5–11 Dec caution", "11–16 Dec
 * caution") are one stretch to the person living it, so they are asked about
 * once; the stretch keeps the weaker of the two confidences.
 */
function runs(segments: TimingSegment[]): Run[] {
  const out: Run[] = [];
  for (const s of segments) {
    const events = [s.opens, ...s.inner.map(i => i.label)].filter((x): x is string => !!x);
    const last = out[out.length - 1];
    if (last && last.direction === s.direction) {
      last.to = s.to;
      last.events.push(...events);
      if (RANK[s.confidence] < RANK[last.confidence]) last.confidence = s.confidence;
    } else {
      out.push({ from: s.from, to: s.to, direction: s.direction, confidence: s.confidence, events });
    }
  }
  return out;
}

/** The checkable predictions in one answer's timing evidence (pure; no I/O). */
export function predictionsFrom(ev: TimingEvidence, domain: string, question: string): PredictionDraft[] {
  const area = AREA[domain];
  if (!area) return [];
  return runs(ev.segments)
    .filter((s): s is Run & { direction: "favourable" | "caution"; confidence: "firm" | "moderate" } =>
      s.direction !== "mixed" && s.confidence !== "tentative" && s.to.getTime() - s.from.getTime() >= MIN_DAYS * DAY)
    .map(s => {
      const events = s.events.join("; ");
      const span = `between ${day(s.from, ev.timezone)} and ${day(s.to, ev.timezone)}`;
      return {
        domain,
        question: question.slice(0, 300),
        windowStart: s.from,
        windowEnd: s.to,
        direction: s.direction,
        confidence: s.confidence,
        reason: events || "the planetary positions for that stretch",
        checkQuestion: s.direction === "favourable"
          ? `Did ${area} go noticeably smoother than usual ${span}?`
          : `Did ${area} feel harder or more strained than usual ${span}?`,
      };
    });
}

/**
 * Store an answer's predictions. The same window for the same domain is kept
 * once, however often it is asked about. Never throws: accountability must not
 * break an answer.
 */
export async function recordPredictions(userId: string, drafts: PredictionDraft[]): Promise<number> {
  if (!drafts.length) return 0;
  try {
    const r = await prisma.punditPrediction.createMany({ data: drafts.map(d => ({ ...d, userId })), skipDuplicates: true });
    return r.count;
  } catch (e) {
    console.error("[Accountability] recording failed:", e);
    return 0;
  }
}

export type Outcome = "yes" | "somewhat" | "no" | "skip";
export const OUTCOMES: Outcome[] = ["yes", "somewhat", "no", "skip"];

export interface HitRate { answered: number; score: number | null }

/**
 * Hit rate over answered predictions: "yes" counts 1, "somewhat" 0.5, "no" 0.
 * "skip" is left out. Below `min` answers the score is withheld (null): a rate
 * from two check-ins would claim more than it shows.
 */
export function hitRate(outcomes: Array<string | null>, min = 5): HitRate {
  const scored = outcomes.filter((o): o is Outcome => o === "yes" || o === "somewhat" || o === "no");
  if (scored.length < min) return { answered: scored.length, score: null };
  const pts = scored.reduce((s, o) => s + (o === "yes" ? 1 : o === "somewhat" ? 0.5 : 0), 0);
  return { answered: scored.length, score: pts / scored.length };
}
