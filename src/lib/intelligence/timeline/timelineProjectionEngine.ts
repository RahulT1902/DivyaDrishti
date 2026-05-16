import { TimelineProjection, TimelineWindow } from "../contracts/timelineState";
import { SignalAggregator, TimePointSignal } from "./signalAggregator";
import { WindowClassifier } from "./windowClassifier";
import { TemporalSmoother } from "./temporalSmoother";
import { DashaAgentOutput, TransitAgentOutput } from "../agents/types";
import { v4 as uuidv4 } from "uuid";

/**
 * TimelineProjectionEngine: The "Chapter Narrator".
 * Responsibility: Converts abstract cycles into a visual, horizontal roadmap.
 */
export class TimelineProjectionEngine {
  private aggregator = new SignalAggregator();
  private classifier = new WindowClassifier();
  private smoother = new TemporalSmoother();

  async project(
    timeframe: "30D" | "90D" | "365D",
    dasha: DashaAgentOutput,
    transit: TransitAgentOutput
  ): Promise<TimelineProjection> {
    const days = timeframe === "30D" ? 30 : timeframe === "90D" ? 90 : 365;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    // 1. Aggregate Signals
    const rawSignals = this.aggregator.aggregate(startDate, endDate, dasha, transit);

    // 2. Segment and Classify Windows
    const windows: TimelineWindow[] = [];
    const windowSize = 10; // 10-day segments
    for (let i = 0; i < rawSignals.length; i += (windowSize / 3)) {
      const segment = rawSignals.slice(i, i + (windowSize / 3));
      if (segment.length === 0) continue;

      const classification = this.classifier.classify(segment);
      windows.push({
        id: uuidv4(),
        startDate: segment[0].date.toISOString(),
        endDate: segment[segment.length - 1].date.toISOString(),
        category: classification.category!,
        intensity: classification.intensity!,
        strategicValue: classification.strategicValue!,
        emotionalLoad: classification.emotionalLoad!,
        title: classification.title!,
        themes: dasha.longTermThemes.slice(0, 2),
        recommendedActions: ["Maintain consistency", "Review progress"],
        cautionaryActions: ["Avoid impulsive pivots"],
        executionMode: classification.executionMode!,
        relatedGoals: []
      });
    }

    // 3. Smooth Transitions
    const smoothedWindows = this.smoother.smooth(windows);

    // 4. Extract Trajectory
    const overallTrajectory: TimelineProjection["overallTrajectory"] = {
      direction: transit.intensity > 7 ? "VOLATILE" : "STABLE",
      momentumScore: 10 - transit.intensity,
      volatilityScore: transit.intensity,
      clarityScore: dasha.confidence * 10
    };

    return {
      timeframe,
      generatedAt: new Date().toISOString(),
      overallTrajectory,
      windows: smoothedWindows,
      keyTransitions: [], // To be implemented by TransitionDetector
      strategicHighlights: [],
      dominantThemes: dasha.longTermThemes,
      confidenceScore: (dasha.confidence + transit.confidence) / 2
    };
  }
}
