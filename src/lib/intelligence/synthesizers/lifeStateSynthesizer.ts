import { LifeState, DomainState } from "../contracts/lifeState";
import { TransitAgent } from "../agents/TransitAgent";
import { DashaAgent } from "../agents/DashaAgent";
import { GoalPlannerAgent } from "../agents/GoalPlannerAgent";
import { HabitAgent } from "../agents/HabitAgent";
import { RealityValidatorAgent } from "../resolvers/realityValidator";
import { synthesizeCareer } from "./careerSynthesizer";
import { synthesizeFinance } from "./financeSynthesizer";
import { NatalChart, DashaContext } from "../types";
import { TransitIntelligence } from "../transit/types";
import { Period } from "../../astrology/dasha";

/**
 * LifeStateSynthesizer: The "Governor" of DivyaDrishti.
 * Responsibility: Orchestrates all specialized agents and produces the canonical LifeState.
 */
export class LifeStateSynthesizer {
  private transitAgent = new TransitAgent();
  private dashaAgent = new DashaAgent();
  private goalAgent = new GoalPlannerAgent();
  private habitAgent = new HabitAgent();
  private validator = new RealityValidatorAgent();

  async synthesize(
    natal: NatalChart,
    dashaCtx: DashaContext,
    timeline: Period[],
    transits: TransitIntelligence[],
    userGoals: any[] = [],
    userHabits: any[] = []
  ): Promise<LifeState> {
    
    // 1. Execute Specialized Agents (Symbolic & Narrative Layers)
    const transitResult = await this.transitAgent.process(transits);
    const dashaResult = await this.dashaAgent.process(timeline, new Date());

    // 2. Execute Domain Synthesizers (Human Experience Translation)
    const career = synthesizeCareer(natal, dashaCtx, transits);
    const finance = synthesizeFinance(natal, dashaCtx, transits);

    // 3. Goal & Habit Context Mapping
    const goalAlignments = await Promise.all(userGoals.map(async goal => {
      const analysis = await this.goalAgent.analyzeGoal(goal, dashaResult.data, transitResult.data);
      return {
        goalId: goal.id,
        title: goal.title,
        alignmentScore: analysis.data.alignmentScore,
        narrative: analysis.data.roadmap[0],
        phase: analysis.data.alignmentScore > 0.7 ? "initiate" : "sustain"
      };
    }));

    // 4. Reality Validation & Tone Regulation
    const validatedCareer = await this.validator.validate(career.synthesis, career.supportingFactors);
    const validatedFinance = await this.validator.validate(finance.synthesis, finance.supportingFactors);

    // 5. Unified State Assembly
    const lifeState: LifeState = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),

      overallState: {
        title: `${dashaResult.data.primaryArchetype} Phase: ${career.opportunityLevel > 7 ? 'Expansion' : 'Restructuring'}`,
        summary: `You are moving through a ${dashaResult.data.primaryArchetype.toLowerCase()} cycle which favors ${career.opportunityLevel > finance.pressureLevel ? 'professional growth' : 'structural discipline'}.`,
        stabilityScore: 10 - transitResult.data.intensity,
        momentumScore: career.opportunityLevel,
        volatilityScore: transitResult.data.intensity,
        clarityScore: dashaResult.confidence * 10
      },

      primaryThemes: dashaResult.data.longTermThemes.slice(0, 3),

      activeDomains: {
        career: career as unknown as DomainState,
        finance: finance as unknown as DomainState,
        relationships: {
          score: 50,
          momentum: 0,
          status: "Stable",
          summary: "Normal flow of social interactions.",
          primaryFocus: "Maintenance",
          manifestations: { external: [], internal: [] },
          recommendations: []
        },
        health: {
          score: 60,
          momentum: -1,
          status: "Caution",
          summary: "Moderate physical energy levels.",
          primaryFocus: "Restoration",
          manifestations: { external: [], internal: [] },
          recommendations: ["Prioritize sleep consistency"]
        },
        spirituality: {
          score: 80,
          momentum: 2,
          status: "Deepening",
          summary: "Internal awareness is naturally high.",
          primaryFocus: "Introspection",
          manifestations: { external: [], internal: [] },
          recommendations: []
        }
      },

      currentPressurePoints: transitResult.data.activeTriggers
        .filter(t => t.nature === "challenging")
        .map(t => ({
          factor: t.planet,
          intensity: t.strengthScore ? t.strengthScore / 10 : 5,
          nature: "timing",
          description: t.reason,
          remedy: "Practice patience and structured review."
        })),

      opportunityWindows: [
        {
          title: "Strategic Growth Window",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          intensity: career.opportunityLevel,
          domain: "career",
          actionStep: "Pitch new ideas to stakeholders."
        }
      ],

      cautionAreas: transitResult.data.activeTriggers
        .filter(t => t.nature === "challenging")
        .map(t => ({
          title: `Transit ${t.planet} Pressure`,
          severity: "medium",
          domain: t.area[0] || "general",
          trigger: t.planet,
          avoid: "Impulsive commitments"
        })),

      recommendedFocus: career.recommendations,

      behavioralGuidance: {
        recommendedBehaviors: ["Structured planning", "Active listening"],
        avoidBehaviors: ["Reactionary emails", "Unplanned spending"]
      },

      emotionalState: {
        dominantTone: validatedCareer.suggestedTone,
        emotionalLoad: transitResult.data.intensity,
        resilienceScore: 10 - transitResult.data.intensity
      },

      activeGoals: goalAlignments as any[],
      habitAlignment: [],

      confidenceScore: (transitResult.confidence + dashaResult.confidence) / 2,

      metadata: {
        dominantPlanetaryDrivers: [dashaResult.data.primaryArchetype, ...transitResult.data.activeTriggers.map(t => t.planet)],
        dominantTimeframe: "Quarterly",
        engineVersion: "2.1.0"
      }
    };

    return lifeState;
  }
}
