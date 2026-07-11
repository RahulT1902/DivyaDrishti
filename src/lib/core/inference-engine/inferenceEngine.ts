import { AstrologyContext, InferenceConclusion } from "../types";
import { SymbolRegistry } from "./symbolRegistry";
import { InferenceRule, GENERAL_RULES } from "./rules/general";
import { CAREER_RULES } from "./rules/career";

// All registered inference rules, ordered by priority.
// Adding a new domain = add its rules file and include here.
const ALL_RULES: InferenceRule[] = [
  ...GENERAL_RULES,
  ...CAREER_RULES,
  // Phase 5+: WEALTH_RULES, MARRIAGE_RULES, HEALTH_RULES, EDUCATION_RULES
].sort((a, b) => a.priority - b.priority);

// The Inference Engine replaces per-domain astrological re-derivation.
// Domain engines query this — they don't call chart/strength/yoga engines directly.
//
// Usage:
//   const engine = new InferenceEngine();
//   const allConclusions  = engine.derive(ctx);
//   const careerConclusions = engine.derive(ctx, "Career");

export class InferenceEngine {
  derive(ctx: AstrologyContext, domain?: string): InferenceConclusion[] {
    const sym  = new SymbolRegistry(ctx);
    const rules = domain
      ? ALL_RULES.filter(r => r.domain === domain || r.domain === "General")
      : ALL_RULES;

    const conclusions: InferenceConclusion[] = [];

    for (const rule of rules) {
      try {
        if (rule.test(ctx, sym)) {
          conclusions.push(rule.conclude(ctx, sym));
        }
      } catch {
        // Rule evaluation failure must never crash the engine
      }
    }

    return conclusions.sort((a, b) => b.confidence - a.confidence);
  }

  // Convenience: derive conclusions for multiple domains in one pass
  deriveAll(ctx: AstrologyContext): Map<string, InferenceConclusion[]> {
    const sym = new SymbolRegistry(ctx);
    const byDomain = new Map<string, InferenceConclusion[]>();

    for (const rule of ALL_RULES) {
      try {
        if (rule.test(ctx, sym)) {
          const conclusion = rule.conclude(ctx, sym);
          const bucket = byDomain.get(conclusion.domain) ?? [];
          bucket.push(conclusion);
          byDomain.set(conclusion.domain, bucket);
        }
      } catch {
        // Isolated failure — continue
      }
    }

    // Sort each domain's conclusions by confidence
    for (const [domain, list] of byDomain) {
      byDomain.set(domain, list.sort((a, b) => b.confidence - a.confidence));
    }

    return byDomain;
  }
}
