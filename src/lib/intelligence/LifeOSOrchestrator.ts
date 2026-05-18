import { TransitAgent } from "./agents/TransitAgent";
import { DashaAgent } from "./agents/DashaAgent";
import { GoalPlannerAgent } from "./agents/GoalPlannerAgent";
import { HabitAgent } from "./agents/HabitAgent";
import { TimelineSynthesisAgent } from "./agents/TimelineSynthesisAgent";
import { RealityValidatorAgent } from "./resolvers/realityValidator";
import { synthesizeCareer } from "./synthesizers/careerSynthesizer";
import { synthesizeFinance } from "./synthesizers/financeSynthesizer";
import { NatalChart, DashaContext } from "./types";
import { TransitIntelligence } from "./transit/types";
import { Period } from "../astrology/dasha";

export class LifeOSOrchestrator {
  private transitAgent = new TransitAgent();
  private dashaAgent = new DashaAgent();
  private realityValidator = new RealityValidatorAgent();
  private timelineAgent = new TimelineSynthesisAgent();
  private goalAgent = new GoalPlannerAgent();
  private habitAgent = new HabitAgent();

  async generateDashboard(
    natal: NatalChart,
    dashaCtx: DashaContext,
    timeline: Period[],
    transits: TransitIntelligence[],
    now: Date = new Date()
  ) {
    // 1. Run Core Timing Agents
    const transitResult = await this.transitAgent.process(transits);
    const dashaResult = await this.dashaAgent.process(timeline, now);

    // 2. Synthesize Life Domains
    const career = synthesizeCareer(natal, dashaCtx, transits);
    const finance = synthesizeFinance(natal, dashaCtx, transits);

    // 3. Generate Timeline
    const timelineResult = await this.timelineAgent.synthesize(dashaResult.data, transitResult.data);

    // 4. Reality Validation
    const validatedCareer = await this.realityValidator.validate(career.synthesis, career.supportingFactors);
    career.synthesis = validatedCareer.filteredInsight;

    const validatedFinance = await this.realityValidator.validate(finance.synthesis, finance.supportingFactors);
    finance.synthesis = validatedFinance.filteredInsight;

    // 5. Aggregate Life OS State
    return {
      dashboard: {
        career: {
          score: Math.round((career.opportunityLevel / 10) * 100),
          status: career.dominantTheme,
          insight: career.synthesis,
          recommendations: career.recommendations
        },
        finance: {
          score: Math.round((finance.opportunityLevel / 10) * 100),
          status: finance.dominantTheme,
          insight: finance.synthesis,
          recommendations: finance.recommendations
        },
        emotional: {
          score: 100 - (transitResult.data.intensity * 10),
          status: transitResult.reasoning[0]
        }
      },
      timeline: timelineResult.data,
      agents: {
        dasha: dashaResult.data,
        transit: transitResult.data
      }
    };
  }
}
