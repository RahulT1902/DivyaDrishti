import { TimePointSignal } from "./signalAggregator";
import { TimelineWindow } from "../contracts/timelineState";

/**
 * WindowClassifier: The "Psychological Interpreter".
 * Responsibility: Categorizes time segments into meaningful chapters.
 */
export class WindowClassifier {
  classify(signals: TimePointSignal[]): Partial<TimelineWindow> {
    const avgIntensity = signals.reduce((acc, s) => acc + s.intensity, 0) / signals.length;
    const supportiveCount = signals.filter(s => s.sentiment === "supportive").length;
    const challengingCount = signals.filter(s => s.sentiment === "challenging").length;

    let category: TimelineWindow["category"] = "DISCIPLINE";
    let title = "Restructuring Phase";
    let executionMode: TimelineWindow["executionMode"] = "ARCHITECT";

    if (supportiveCount > challengingCount + 2) {
      category = "EXPANSION";
      title = "Expansion Window";
      executionMode = "WARRIOR";
    } else if (challengingCount > supportiveCount + 2) {
      category = "VOLATILITY";
      title = "Pressure Window";
      executionMode = "OBSERVER";
    } else if (avgIntensity < 4) {
      category = "RECOVERY";
      title = "Integration Phase";
      executionMode = "HEALER";
    }

    return {
      category,
      title,
      intensity: Math.round(avgIntensity),
      executionMode,
      strategicValue: supportiveCount > challengingCount ? 8 : 4,
      emotionalLoad: challengingCount > supportiveCount ? 7 : 3
    };
  }
}
