import { TransitPosition } from "../astrology/transit";

export interface Signal {
  type: string;
  planet: string;
  natalPlanet: string;
  strength: number;
  decay: number;
  startTime: number;
  peakTime: number;
  endTime: number;
  domain: string;
}

const MAX_ORB = 5.0; // 5 degrees for decision-grade triggers

/**
 * Detects conjunction triggers between current transits and natal positions.
 * Implements proximity scoring, dasha multipliers, and time-window peak detection.
 */
export function detectTriggers(
  natalPlanets: any[], 
  transits: TransitPosition[], 
  currentDasha: { mahadasha: string; antardasha: string }
): Signal[] {
  const signals: Signal[] = [];
  const now = Date.now();

  for (const tr of transits) {
    for (const natal of natalPlanets) {
      const diff = Math.abs(tr.longitude - natal.longitude);
      const shortestDiff = Math.min(diff, 360 - diff);

      if (shortestDiff <= MAX_ORB) {
        // 1. Proximity Scoring (Institutional Focus)
        // Parabolic curve: strength drops faster as it leaves the exact degree
        const proximityScore = Math.pow(1 - (shortestDiff / MAX_ORB), 2);

        // 2. Dasha Alignment Multiplier
        // Triggers involving Dasha lords are prioritized as 'Dominant Signals'
        let dashaMult = 1.0;
        if (currentDasha.mahadasha === tr.name) dashaMult *= 2.0;
        if (currentDasha.antardasha === tr.name) dashaMult *= 1.5;

        // 3. Strength Calculation (Base)
        const baseStrength = proximityScore * tr.weight * dashaMult;

        // 4. Time Window Engine
        // Dynamic window scaling: Heavy planets (low speed) have larger windows
        // Speed is in degrees per day. we convert to ms per degree.
        const absSpeed = Math.abs(tr.speed) || 0.01; // Avoid divide by zero
        const msPerDegree = (24 * 60 * 60 * 1000) / absSpeed;
        
        // Dynamic window: 2 degree orb for 'Active Tradability'
        const windowSizeMs = msPerDegree * 2.0; 
        
        // Simplified peak detection: 
        // we estimate if we are pre or post peak based on speed (though direction matters)
        // For v1, we treat 'now' as tracking real-time intensity
        const peakTime = now; 

        // 5. Exponential Decay Curve (e^-t)
        // Tau (decay constant) scaled by planet weight (Influence duration)
        const tau = windowSizeMs / 2;
        const timeFromPeak = 0; // In real-time tracking, we are at the measured point
        const decay = Math.exp(-timeFromPeak / tau);

        signals.push({
          type: "NATAL_CONJUNCTION",
          planet: tr.name,
          natalPlanet: natal.name,
          strength: baseStrength,
          decay: decay,
          startTime: now - windowSizeMs / 2,
          peakTime: peakTime,
          endTime: now + windowSizeMs / 2,
          domain: mapPlanetToDomain(tr.name)
        });
      }
    }
  }

  return signals;
}

/**
 * Maps institutional planetary triggers to actionable decision domains.
 */
function mapPlanetToDomain(planet: string): string {
  const mapping: Record<string, string> = {
    Sun: "career",
    Moon: "health",
    Mars: "finance",
    Mercury: "career",
    Jupiter: "finance",
    Venus: "relationships",
    Saturn: "career",
    Rahu: "finance",
    Ketu: "health"
  };
  return mapping[planet] || "self";
}
