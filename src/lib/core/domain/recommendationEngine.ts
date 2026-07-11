import {
  DomainKnowledgePack, DomainSignal, Recommendation,
  Priority, RecommendationCondition,
} from "./contract";
import { DecisionGraph } from "../types";

// RecommendationEngine converts domain signals + decision graph into star-rated
// recommended actions. Recommendations shift DivyaDrishti from prediction to
// decision support — not just "leadership is strong" but "apply for a senior role".
//
// Stars map to priority:
//   Critical → ★★★★★   High → ★★★★   Medium → ★★★   Low → ★★

export class RecommendationEngine {
  generate(
    signals:       DomainSignal[],
    decisionGraph: DecisionGraph,
    pack:          DomainKnowledgePack,
  ): Recommendation[] {
    const scoreMap = new Map(signals.map(s => [s.id, s]));
    const results:  Recommendation[] = [];

    for (const template of pack.recommendations) {
      const signal = scoreMap.get(template.triggerSignalId);
      if (!signal) continue;

      if (!this.conditionMet(template.condition, signal, decisionGraph)) continue;

      results.push({
        action:          template.action,
        priority:        template.priority,
        stars:           priorityToStars(template.priority),
        rationale:       template.rationale,
        timing:          timingHint(template.condition, decisionGraph),
        sourceSignalIds: [template.triggerSignalId],
      });
    }

    // Sort: Critical first, then High, Medium, Low
    return results.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
  }

  private conditionMet(
    condition:     RecommendationCondition,
    signal:        DomainSignal,
    decisionGraph: DecisionGraph,
  ): boolean {
    switch (condition) {
      case "very-high":     return signal.score >= 80;
      case "high":          return signal.score >= 65;
      case "low":           return signal.score < 40;
      case "active-timing": return decisionGraph.timing.isDashaSupported;
      case "blocked":
        return decisionGraph.blockingFactors.length > decisionGraph.supportingFactors.length ||
               decisionGraph.confidence < 40;
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityToStars(priority: Priority): 1 | 2 | 3 | 4 | 5 {
  switch (priority) {
    case "Critical": return 5;
    case "High":     return 4;
    case "Medium":   return 3;
    case "Low":      return 2;
  }
}

function priorityOrder(priority: Priority): number {
  switch (priority) {
    case "Critical": return 0;
    case "High":     return 1;
    case "Medium":   return 2;
    case "Low":      return 3;
  }
}

function timingHint(
  condition:     RecommendationCondition,
  decisionGraph: DecisionGraph,
): string | undefined {
  if (condition === "active-timing" || decisionGraph.timing.isDashaSupported) {
    return decisionGraph.timing.label;
  }
  if (condition === "low" || condition === "blocked") {
    return "Wait for stronger dasha activation before acting";
  }
  return undefined;
}
