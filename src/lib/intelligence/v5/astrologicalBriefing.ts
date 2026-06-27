/**
 * Chat Pundit V5 — Astrological Briefing Engine
 *
 * Converts raw astrological data (narrative, dasha, transits, chart) into a
 * structured plain-English brief that the narrative LLM narrates FROM instead
 * of having to interpret raw JSON.
 *
 * This is the core architectural shift: the LLM narrates a pre-digested story,
 * not a data dump.
 */

import type { DeepInsight } from "../types";

interface TransitPos {
  name: string;
  longitude: number;
  sign: number;
  speed: number;
  weight: number;
}

export interface DashaStack {
  mahadasha: string;
  antardasha: string;
  pratyantar?: string | null;
}

interface NatalPlanet {
  name: string;
  sign: number;
  strengthLevel?: string;
  isRetrograde?: boolean;
  isCombust?: boolean;
}

export interface AstrologicalBrief {
  domainStrength: "strong" | "moderate" | "weak" | "building";
  primaryStory: string;
  strengthFactors: string[];
  challengeFactors: string[];
  phaseType: "building" | "peak" | "consolidation" | "challenge" | "transition";
  momentumDirection: "accelerating" | "stable" | "slowing" | "turning";
  keyObservations: string[];
  contradictionNote: string | null;
  dashaTheme: string;
  transitHighlight: string;
  upcomingShift: string | null;
  hasBothForces: boolean; // True when both supporting and challenging factors exist
}

// ─── House calculations ───────────────────────────────────────────────────────

function getHouse(sign: number, lagnaSign: number): number {
  return ((sign - lagnaSign + 12) % 12) + 1;
}

// ─── Domain-relevant houses ───────────────────────────────────────────────────

const DOMAIN_HOUSES: Record<string, number[]> = {
  career:       [10, 1, 6],
  finance:      [2, 11, 5],
  relationship: [7, 2, 5],
  family:       [4, 2, 5],
  health:       [1, 6, 8],
  education:    [5, 4, 9],
  business:     [10, 7, 3, 11],
  spirituality: [12, 9, 5],
};

const BENEFICS = new Set(["Jupiter", "Venus"]);
const MALEFICS = new Set(["Saturn", "Rahu", "Ketu", "Mars"]);

// Transit observation: which planets are in domain-relevant houses and what they mean
function buildTransitHighlight(
  domain: string,
  transits: TransitPos[],
  lagnaSign: number
): string {
  const keyHouses = DOMAIN_HOUSES[domain] ?? [1, 10];

  const relevant = transits
    .filter(t => keyHouses.includes(getHouse(t.sign, lagnaSign)))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2);

  if (relevant.length === 0) {
    return "Current transits show a neutral environment for this domain — no major planetary pressure or boost in the relevant houses.";
  }

  const parts = relevant.map(t => {
    const house = getHouse(t.sign, lagnaSign);
    const retro = t.speed < 0 ? " (retrograde)" : "";
    if (BENEFICS.has(t.name)) {
      return `${t.name}${retro} is currently strengthening House ${house} — a supportive influence for this area`;
    } else if (MALEFICS.has(t.name)) {
      return `${t.name}${retro} is currently in House ${house} — adding pressure, structure, or delay in this area`;
    }
    return `${t.name}${retro} is currently activating House ${house}`;
  });

  return parts.join(". ") + ".";
}

// ─── Phase and momentum detection ────────────────────────────────────────────

function detectPhase(narrative: DeepInsight): "building" | "peak" | "consolidation" | "challenge" | "transition" {
  const text = ((narrative.theme ?? "") + " " + (narrative.heroInsight ?? "") + " " + (narrative.verdict ?? "")).toLowerCase();
  if (/peak|height|maximum|strongest|culminat/i.test(text)) return "peak";
  if (/challeng|difficult|delay|slow|stuck|pressure|obstacle|resist/i.test(text)) return "challenge";
  if (/transit|shift|change|moving from|entering|closing|next phase/i.test(text)) return "transition";
  if (/consolidat|stabiliz|settle|establish|ground|secure/i.test(text)) return "consolidation";
  return "building";
}

function assessMomentum(narrative: DeepInsight): "accelerating" | "stable" | "slowing" | "turning" {
  const text = ((narrative.heroInsight ?? "") + " " + (narrative.verdict ?? "")).toLowerCase();
  if (/accelerat|quicken|pick.*up|gaining speed|momentum/i.test(text)) return "accelerating";
  if (/slow|delay|gradual|patience|wait|takes time/i.test(text)) return "slowing";
  if (/turn|shift|pivot|changing|turning point/i.test(text)) return "turning";
  return "stable";
}

function assessDomainStrength(narrative: DeepInsight): "strong" | "moderate" | "weak" | "building" {
  const confidence = narrative.confidence?.manifestation ?? 0.5;
  const evidence = narrative.evidence ?? [];
  const supportive = evidence.filter(e => e.impact === "supportive").length;
  const restrictive = evidence.filter(e => e.impact === "restrictive").length;

  if (confidence >= 0.72 && supportive > restrictive) return "strong";
  if (confidence <= 0.35 || restrictive > supportive + 1) return "weak";
  if (supportive > 0 && restrictive > 0 && supportive >= restrictive) return "building";
  return "moderate";
}

// ─── Contradiction Engine ─────────────────────────────────────────────────────
// When opposing planetary forces are both strong, explain them as complementary
// rather than contradictory. Real astrologers do this naturally.

function buildContradictionNote(
  narrative: DeepInsight,
  strengthFactors: string[],
  challengeFactors: string[]
): string | null {
  const tensions = narrative.tensions ?? [];

  // Use narrative tensions if available
  if (tensions.length > 0 && strengthFactors.length > 0 && challengeFactors.length > 0) {
    const t = tensions[0];
    return `At first glance, there appears to be a tension here — ${t.support} pulls in one direction while ${t.friction} pulls in another. Looking more carefully: ${t.synthesis} These forces are not canceling each other out — they are speaking about different parts of the journey.`;
  }

  // Fallback: generate from factors
  if (strengthFactors.length >= 1 && challengeFactors.length >= 1) {
    return `The chart is showing what may appear to be contradictory signals — there are genuine areas of support alongside genuine friction. In my experience, this combination almost always means the opportunity is real, but the timing and approach matter. The challenge is not blocking the outcome — it is refining which version of it arrives.`;
  }

  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildAstrologicalBrief(
  narrative: DeepInsight,
  dashaStack: DashaStack,
  transitPositions: TransitPos[],
  chart: { planets: NatalPlanet[]; lagna: { sign: number } },
  domain: string
): AstrologicalBrief {
  const lagnaSign = chart.lagna.sign;
  const evidence = narrative.evidence ?? [];

  // Extract factors from narrative evidence — already in plain English
  const strengthFactors = evidence
    .filter(e => e.impact === "supportive")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(e => e.explanation)
    .filter(Boolean);

  const challengeFactors = evidence
    .filter(e => e.impact === "restrictive")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(e => e.explanation)
    .filter(Boolean);

  // Fallback if evidence is sparse
  if (strengthFactors.length === 0 && narrative.realityTranslation) {
    strengthFactors.push(narrative.realityTranslation);
  }

  // Contradiction note — only when both forces are present
  const contradictionNote = buildContradictionNote(narrative, strengthFactors, challengeFactors);

  // Upcoming shift from narrative phases
  const now = new Date();
  const phases = narrative.phases ?? [];
  const upcomingPhase = phases.find(p => {
    try { return p.startDate && new Date(p.startDate) > now; } catch { return false; }
  });
  const upcomingShift = upcomingPhase
    ? `${upcomingPhase.title} (around ${upcomingPhase.startDate}): ${upcomingPhase.externalManifestation}`
    : null;

  // Key observations — the "interesting things" the Pundit would notice
  const keyObservations: string[] = [];
  if (narrative.bigPicture) keyObservations.push(narrative.bigPicture);
  if (narrative.domainAnchor) keyObservations.push(narrative.domainAnchor);
  const verdictMatrix = narrative.verdictMatrix;
  if (verdictMatrix?.favor && verdictMatrix.favor.length > 0) {
    keyObservations.push(`Favoring: ${verdictMatrix.favor[0]}`);
  }

  return {
    domainStrength: assessDomainStrength(narrative),
    primaryStory: narrative.heroInsight || narrative.theme || "This is an active astrological period.",
    strengthFactors,
    challengeFactors,
    phaseType: detectPhase(narrative),
    momentumDirection: assessMomentum(narrative),
    keyObservations: keyObservations.slice(0, 3),
    contradictionNote,
    dashaTheme: `${dashaStack.mahadasha} Mahadasha / ${dashaStack.antardasha} Antardasha${dashaStack.pratyantar ? ` / ${dashaStack.pratyantar} Pratyantar` : ""} — ${narrative.theme || "active period"}`,
    transitHighlight: buildTransitHighlight(domain, transitPositions, lagnaSign),
    upcomingShift,
    hasBothForces: strengthFactors.length > 0 && challengeFactors.length > 0,
  };
}
