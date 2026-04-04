import { getEngine } from "./engine";
import { Constants } from "@fusionstrings/swisseph-wasi";

export const IMPACT_WEIGHTS: Record<string, number> = {
  Saturn: 5,
  Rahu: 5,
  Ketu: 5,
  Jupiter: 4,
  Mars: 3,
  Sun: 2,
  Mercury: 2,
  Moon: 1,
  Venus: 2,
};

export interface TransitPosition {
  name: string;
  longitude: number;
  speed: number;
  weight: number;
}

/**
 * Calculates real-time planetary positions (UTC) with impact weights.
 * This is the foundation of the Environmental Layer.
 */
export async function calculateCurrentTransits() {
  const eph = await getEngine();
  const now = new Date();
  
  // Use UTC for all transit calculations to ensure global consistency
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const utDecimal = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);

  const julDay = eph.swe_julday(year, month, day, utDecimal, Constants.SE_GREG_CAL);
  
  // Standard Lahiri Ayanamsha for institutional accuracy
  eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);

  const planets = [
    { id: Constants.SE_SUN, name: "Sun" },
    { id: Constants.SE_MOON, name: "Moon" },
    { id: Constants.SE_MARS, name: "Mars" },
    { id: Constants.SE_MERCURY, name: "Mercury" },
    { id: Constants.SE_JUPITER, name: "Jupiter" },
    { id: Constants.SE_VENUS, name: "Venus" },
    { id: Constants.SE_SATURN, name: "Saturn" },
    { id: Constants.SE_MEAN_NODE, name: "Rahu" },
  ];

  const results: TransitPosition[] = [];
  const flags = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;

  for (const p of planets) {
    const { xx } = eph.swe_calc_ut(julDay, p.id, flags);
    results.push({
      name: p.name,
      longitude: xx[0],
      speed: xx[3],
      weight: IMPACT_WEIGHTS[p.name] || 2,
    });
  }

  // Ketu calculation (Binary opposite of Rahu)
  const rahu = results.find(r => r.name === "Rahu");
  if (rahu) {
    results.push({
      name: "Ketu",
      longitude: (rahu.longitude + 180) % 360,
      speed: rahu.speed,
      weight: IMPACT_WEIGHTS["Ketu"],
    });
  }

  return {
    julDay,
    timestamp: now.getTime(),
    positions: results,
  };
}
