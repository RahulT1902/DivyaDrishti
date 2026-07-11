import {
  DivisionalChart, PlanetRole, PlanetStrength,
  YogaDefinition, YogaBirthPromise, YogaCandidate,
  YogaDetectionResult, AstrologicalEvidence, PlanetName,
  AstrologyEngine, EvaluationContext,
} from "../types";
import { evaluateRule } from "./dsl/ruleEvaluator";
import { ALL_YOGA_DEFINITIONS } from "./definitions";
import { detectConflicts } from "./yogaConflicts";

// Input bundle for the Yoga Engine
export interface YogaEngineInput {
  chart:     DivisionalChart;
  roles:     PlanetRole[];
  strengths: PlanetStrength[];
}

// The Yoga Engine detects natal promises only.
// It does NOT assign status — that belongs to the Activation Engine.
export class YogaEngine implements AstrologyEngine<YogaEngineInput, YogaDetectionResult> {
  evaluate(input: YogaEngineInput): YogaDetectionResult {
    const ctx: EvaluationContext = {
      chart:    input.chart,
      roles:    input.roles,
      strengths: input.strengths,
    };

    const birthPromises: YogaBirthPromise[] = [];
    const missed:        YogaCandidate[]    = [];

    for (const def of ALL_YOGA_DEFINITIONS) {
      const result = this.evaluateDefinition(def, ctx);
      if (result !== null) {
        birthPromises.push(result);
      } else {
        missed.push(this.buildCandidate(def, ctx));
      }
    }

    const conflictingYogas = detectConflicts(birthPromises);

    const dominantPromises = [...birthPromises]
      .sort((a, b) => (b.birthStrength * b.severity) - (a.birthStrength * a.severity))
      .slice(0, 5);

    const overallBirthStrength = computeOverallBirthStrength(birthPromises);
    const evidence = buildSummaryEvidence(birthPromises, dominantPromises);

    return { birthPromises, missed, conflictingYogas, dominantPromises, overallBirthStrength, evidence };
  }

  // ── Per-definition evaluation ───────────────────────────────────────────────

  private evaluateDefinition(
    def: YogaDefinition,
    ctx: EvaluationContext,
  ): YogaBirthPromise | null {
    const condResult = def.evaluateFn
      ? def.evaluateFn(ctx)
      : evaluateRule(def.conditions, ctx);

    if (!condResult.matches) return null;

    const birthStrength = def.strengthFormula
      ? def.strengthFormula(ctx, condResult.supportingPlanets)
      : averageStrength(ctx, condResult.supportingPlanets);

    // Apply modifiers to birth strength
    let totalDelta = 0;
    const modifierDescriptions: string[] = [];
    for (const mod of def.modifiers) {
      const modResult = evaluateRule(mod.condition, ctx);
      if (modResult.matches) {
        totalDelta += mod.strengthDelta;
        modifierDescriptions.push(mod.description);
      }
    }

    const finalStrength = Math.max(0, Math.min(100, birthStrength + totalDelta));
    const evidence = buildEvidence(def, condResult.descriptions, modifierDescriptions, finalStrength);

    return {
      id:               def.id,
      name:             def.name,
      sanskritName:     def.sanskritName,
      category:         def.category,
      birthStrength:    finalStrength,
      severity:         def.severity,
      supportingPlanets: condResult.supportingPlanets,
      affectedDomains:  def.domains,
      evidence,
      description:      def.description,
    };
  }

  // ── Near-miss candidate ─────────────────────────────────────────────────────

  private buildCandidate(def: YogaDefinition, ctx: EvaluationContext): YogaCandidate {
    const failedConditions: string[] = [];
    let nearMiss = false;

    if (def.conditions.type === "AND" && def.conditions.rules.length > 0) {
      let passed = 0;
      for (const rule of def.conditions.rules) {
        const r = evaluateRule(rule, ctx);
        if (!r.matches) {
          failedConditions.push(`Not satisfied: ${rule.type}`);
        } else {
          passed++;
        }
      }
      nearMiss = (def.conditions.rules.length - passed) === 1;
    }

    return {
      yogaId:          def.id,
      yogaName:        def.name,
      failedConditions,
      nearMiss,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function averageStrength(ctx: EvaluationContext, planets: PlanetName[]): number {
  if (planets.length === 0) return 50;
  const total = planets.reduce((sum, p) => {
    const s = ctx.strengths.find(x => x.planet === p)?.overallStrength ?? 50;
    return sum + s;
  }, 0);
  return Math.round(total / planets.length);
}

function computeOverallBirthStrength(promises: YogaBirthPromise[]): number {
  if (promises.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const y of promises) {
    const w = y.severity / 100;
    weightedSum += y.birthStrength * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

function buildEvidence(
  def: YogaDefinition,
  conditionDescs: string[],
  modifierDescs: string[],
  birthStrength: number,
): AstrologicalEvidence[] {
  return [
    {
      id:          `${def.id}-detection`,
      category:    "Yoga",
      description: `${def.name} detected (severity ${def.severity}/100, birthStrength ${birthStrength}/100)`,
      strength:    birthStrength,
      weight:      def.severity / 100,
      sourceChart: "D1",
    },
    ...conditionDescs.map((desc, i): AstrologicalEvidence => ({
      id:          `${def.id}-cond-${i}`,
      category:    "Yoga",
      description: desc,
      strength:    birthStrength,
      weight:      0.5,
      sourceChart: "D1",
    })),
    ...modifierDescs.map((desc, i): AstrologicalEvidence => ({
      id:          `${def.id}-mod-${i}`,
      category:    "Yoga",
      description: desc,
      strength:    birthStrength,
      weight:      0.3,
      sourceChart: "D1",
    })),
  ];
}

function buildSummaryEvidence(
  promises: YogaBirthPromise[],
  dominant: YogaBirthPromise[],
): AstrologicalEvidence[] {
  return [
    {
      id:          "yoga-summary",
      category:    "Yoga",
      description: `${promises.length} natal yoga promise(s) detected; dominant: ${dominant.map(y => y.name).join(", ") || "none"}`,
      strength:    dominant[0]?.birthStrength ?? 0,
      weight:      1.0,
      sourceChart: "D1",
    },
  ];
}
