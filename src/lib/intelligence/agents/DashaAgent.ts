import { getDashaContext, Period } from "../../astrology/dasha";
import { AgentResult, DashaAgentOutput, AgentSignal } from "./types";
import { TimePhase } from "../types";

const ARCHETYPES: Record<string, string> = {
  Sun: "The Authority",
  Moon: "The Nurturer",
  Mars: "The Warrior",
  Mercury: "The Strategist",
  Jupiter: "The Sage",
  Venus: "The Harmonizer",
  Saturn: "The Architect",
  Rahu: "The Innovator",
  Ketu: "The Mystic"
};

const THEMES: Record<string, string[]> = {
  Sun: ["Leadership", "Visibility", "Self-Expression", "Father/Authority"],
  Moon: ["Emotional Security", "Comfort", "Public Image", "Fluctuation"],
  Mars: ["Energy", "Conflict", "Ambition", "Technical Skill"],
  Mercury: ["Communication", "Commerce", "Learning", "Networking"],
  Jupiter: ["Wisdom", "Expansion", "Prosperity", "Ethics"],
  Venus: ["Luxury", "Relationships", "Creativity", "Asset Liquidity"],
  Saturn: ["Structure", "Discipline", "Long-term Planning", "Delay"],
  Rahu: ["Unconventionality", "Ambitious Expansion", "Sudden Change", "Technology"],
  Ketu: ["Detachment", "Introspection", "Spiritual Growth", "Research"]
};

export class DashaAgent {
  name = "DashaAgent";

  async process(timeline: Period[], now: Date): Promise<AgentResult<DashaAgentOutput>> {
    const context = getDashaContext(timeline, now);

    // ── Graceful Fallback ──────────────────────────────────────────────────────
    // When timeline is empty (e.g. MVP mock, missing birth data), return a
    // stable deterministic fallback rather than crashing the entire pipeline.
    if (!context) {
      return this.buildFallback();
    }

    const md = context.stack.mahadasha;
    const ad = context.stack.antardasha;

    const signals: AgentSignal[] = [
      {
        agentName: this.name,
        factor: `Mahadasha: ${md}`,
        source: "dasha",
        impact: "mixed",
        weight: 10,
        confidence: 0.95,
        reason: `Major life chapter governed by ${md} (${ARCHETYPES[md]})`
      },
      {
        agentName: this.name,
        factor: `Antardasha: ${ad}`,
        source: "dasha",
        impact: "mixed",
        weight: 7,
        confidence: 0.9,
        reason: `Current focus phase governed by ${ad} (${ARCHETYPES[ad]})`
      }
    ];

    const data: DashaAgentOutput = {
      currentNarrative: `You are currently in a major chapter of ${md} (${ARCHETYPES[md]}), with a specific focus on ${ad} (${ARCHETYPES[ad]}) energies.`,
      primaryArchetype: ARCHETYPES[ad],
      longTermThemes: [...THEMES[md], ...THEMES[ad]],
      timingAnchors: [
        {
          startDate: context.timing.startsAt.toISOString(),
          endDate: context.timing.endsAt.toISOString(),
          title: `Focus: ${ad} Phase`,
          astroTriggers: [md, ad],
          externalManifestation: `Structural shifts in ${THEMES[ad][0].toLowerCase()}.`,
          internalState: `A growing need for ${THEMES[ad][1].toLowerCase()}.`,
          opportunities: THEMES[ad].slice(0, 2),
          cautions: ["Emotional boundary setting", "Rushing the process"],
          confidence: 0.9
        }
      ]
    };

    return {
      data,
      signals,
      confidence: 0.92,
      reasoning: [
        `Dasha stack: ${md} -> ${ad}`,
        `Time pressure: ${context.timing.pressure}`,
        `Remaining: ${context.timing.remaining}`
      ]
    };
  }  // end process()

  private buildFallback(): AgentResult<DashaAgentOutput> {
    const md = "Saturn";
    const ad = "Mercury";
    const now = new Date();

    const data: DashaAgentOutput = {
      currentNarrative: `Operating in a structured, disciplined phase. Long-term planning and systematic execution tend to yield the best outcomes now.`,
      primaryArchetype: ARCHETYPES[md],  // "The Architect"
      longTermThemes: [...THEMES[md], ...THEMES[ad]],
      timingAnchors: [
        {
          startDate: now.toISOString(),
          endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          title: `${md} Phase — Structured Foundation`,
          astroTriggers: [md, ad],
          externalManifestation: "Gradual, measurable progress in structured domains.",
          internalState: "A heightened need for discipline and long-term thinking.",
          opportunities: THEMES[md].slice(0, 2),
          cautions: ["Excessive rigidity", "Neglecting emotional needs"],
          confidence: 0.5
        }
      ]
    };

    return {
      data,
      signals: [],
      confidence: 0.5,   // Low confidence signals this is fallback, not computed
      reasoning: ["Timeline unavailable — using Saturn archetype fallback."]
    };
  }
}
