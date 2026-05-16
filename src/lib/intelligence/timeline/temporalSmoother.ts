import { TimelineWindow } from "../contracts/timelineState";

/**
 * TemporalSmoother: The "Noise Filter".
 * Responsibility: Prevents chaotic switching between windows by merging similar adjacent phases.
 */
export class TemporalSmoother {
  smooth(windows: TimelineWindow[]): TimelineWindow[] {
    if (windows.length <= 1) return windows;

    const smoothed: TimelineWindow[] = [];
    let current = windows[0];

    for (let i = 1; i < windows.length; i++) {
      const next = windows[i];
      
      // If categories are the same, or transition is too brief, merge
      const durationDays = (new Date(next.startDate).getTime() - new Date(current.endDate).getTime()) / (1000 * 60 * 60 * 24);

      if (current.category === next.category || durationDays < 7) {
        current.endDate = next.endDate;
        current.intensity = Math.round((current.intensity + next.intensity) / 2);
      } else {
        smoothed.push(current);
        current = next;
      }
    }
    smoothed.push(current);

    return smoothed;
  }
}
