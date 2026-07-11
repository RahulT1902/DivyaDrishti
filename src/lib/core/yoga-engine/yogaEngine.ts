import {
  DivisionalChart, PlanetRole, PlanetStrength,
  YogaDefinition, YogaResult, YogaCandidate, YogaStatus, YogaAnalysis,
  AstrologicalEvidence, PlanetName, AstrologyEngine, EvaluationContext,
} from "../types";
import { evaluateRule } from "./dsl/ruleEvaluator";
import { ALL_YOGA_DEFINITIONS } from "./definitions";
import { detectConflicts } from "./yogaConflicts";

// Input bundle for the Yoga Engine
export interface YogaEngineInput {
  chart:    DivisionalChart;
  roles:    PlanetRole[];
  strengths: PlanetStrength[];
}

export class YogaEngine implements AstrologyEngine<YogaEngineInput, YogaAnalysis> {
  evaluate(input: YogaEngineInput): YogaAnalysis {
    const ctx: EvaluationContext = {
      chart:    input.chart,
      roles:    input.roles,
      strengths: input.strengths,
    };

    const detected:  YogaResult[]    = [];
    const missed:    YogaCandidate[] = [];

    for (const def of ALL_YOGA_DEFINITIONS) {
      const result = this.evaluateDefinition(def, ctx);
      if (result !== null) {
        detected.push(result);
      } else {
        missed.push(this.buildCandidate(def, ctx));
      }
    }

    const conflictingYogas = detectConflicts(detected);

    const dominantYogas = [...detected]
      .sort((a, b) => (b.strength * b.severity) - (a.strength * a.severity))
      .slice(0, 5);

    const overallYogaStrength = computeOverallStrength(detected);
    const evidence = buildSummaryEvidence(detected, dominantYogas);

    return { detected, missed, dominantYogas, conflictingYogas, overallYogaStrength, evidence };
  }

  // ── Per-definition evaluation ───────────────────────────────────────────────

  private evaluateDefinition(
    def: YogaDefinition,
    ctx: EvaluationContext,
  ): YogaResult | null {
    // Use custom evaluateFn when provided; otherwise evaluate the DSL rule
    const condResult = def.evaluateFn
      ? def.evaluateFn(ctx)
      : evaluateRule(def.conditions, ctx);

    if (!condResult.matches) return null;

    // Base strength from supporting planets
    const baseStrength = def.strengthFormula
      ? def.strengthFormula(ctx, condResult.supportingPlanets)
      : averageStrength(ctx, condResult.supportingPlanets);

    // Apply modifiers
    let totalDelta = 0;
    const modifierDescriptions: string[] = [];
    for (const mod of def.modifiers) {
      const modResult = evaluateRule(mod.condition, ctx);
      if (modResult.matches) {
        totalDelta += mod.strengthDelta;
        modifierDescriptions.push(mod.description);
      }
    }

    const strength = Math.max(0, Math.min(100, baseStrength + totalDelta));
    const status   = yogaStatus(strength);

    const evidence = buildEvidence(def, condResult.descriptions, modifierDescriptions, strength);

    return {
      id:               def.id,
      name:             def.name,
      sanskritName:     def.sanskritName,
      category:         def.category,
      status,
      strength,
      severity:         def.severity,
      supportingPlanets: condResult.supportingPlanets,
      affectedDomains:  def.domains,
      evidence,
      description:      def.description,
    };
  }

  // ── Near-miss candidate ─────────────────────────────────────────────────────

  private buildCandidate(def: YogaDefinition, ctx: EvaluationContext): YogaCandidate {
    // For DSL nodes, collect which sub-conditions failed
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
      yogaId:           def.id,
      yogaName:         def.name,
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

function yogaStatus(strength: number): YogaStatus {
  if (strength >= 85) return "Peak";
  if (strength >= 60) return "Active";
  if (strength >= 40) return "Emerging";
  return "Dormant";
}

function computeOverallStrength(detected: YogaResult[]): number {
  if (detected.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const y of detected) {
    const w = y.severity / 100;
    weightedSum += y.strength * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

function buildEvidence(
  def: YogaDefinition,
  conditionDescs: string[],
  modifierDescs: string[],
  strength: number,
): AstrologicalEvidence[] {
  const evidence: AstrologicalEvidence[] = [
    {
      id:          `${def.id}-detection`,
      category:    "Yoga",
      description: `${def.name} detected (severity ${def.severity}/100)`,
      strength,
      weight:      def.severity / 100,
      sourceChart: "D1",
    },
    ...conditionDescs.map((desc, i): AstrologicalEvidence => ({
      id:          `${def.id}-cond-${i}`,
      category:    "Yoga",
      description: desc,
      strength,
      weight:      0.5,
      sourceChart: "D1",
    })),
    ...modifierDescs.map((desc, i): AstrologicalEvidence => ({
      id:          `${def.id}-mod-${i}`,
      category:    "Yoga",
      description: desc,
      strength,
      weight:      0.3,
      sourceChart: "D1",
    })),
  ];
  return evidence;
}

function buildSummaryEvidence(
  detected: YogaResult[],
  dominant: YogaResult[],
): AstrologicalEvidence[] {
  return [
    {
      id:          "yoga-summary",
      category:    "Yoga",
      description: `${detected.length} yoga(s) detected; dominant: ${dominant.map(y => y.name).join(", ") || "none"}`,
      strength:    detected.length > 0 ? dominant[0]?.strength ?? 50 : 0,
      weight:      1.0,
      sourceChart: "D1",
    },
  ];
}
