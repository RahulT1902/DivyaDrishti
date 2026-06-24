/**
 * Body Risk Profile Engine
 *
 * Computes Vedic-astrology-derived health risk scores (0–100) for 24 body
 * systems by combining natal chart strength, active Dasha lords, and current
 * planetary transits.
 *
 * Weighting: Mahadasha 40% | Antardasha 25% | Pratyantar 15% | Transits 15% | Baseline 5%
 */

export interface BodyRiskProfile {
  head: number;
  eyes: number;
  sinuses: number;
  throat: number;
  neck: number;
  shoulders: number;
  upperBack: number;
  lowerBack: number;
  spine: number;
  heart: number;
  lungs: number;
  stomach: number;
  digestiveSystem: number;
  liver: number;
  kidneys: number;
  nervousSystem: number;
  muscles: number;
  joints: number;
  knees: number;
  legs: number;
  feet: number;
  sleep: number;
  recovery: number;
  stress: number;
}

// Natural base stress each planet contributes when activated in a dasha/transit.
// Higher = more health pressure when that planet is dominant.
const PLANET_BASE_STRESS: Record<string, number> = {
  Sun:     52,
  Moon:    42,
  Mars:    68,
  Mercury: 38,
  Jupiter: 22,
  Venus:   28,
  Saturn:  72,
  Rahu:    75,
  Ketu:    60,
};

// Which body systems each planet governs (primary rulership)
const PLANET_BODY_MAP: Record<string, (keyof BodyRiskProfile)[]> = {
  Sun:     ["head", "heart"],
  Moon:    ["stomach", "digestiveSystem", "sleep"],
  Mars:    ["muscles", "head"],
  Mercury: ["nervousSystem", "eyes"],
  Jupiter: ["liver", "recovery"],
  Venus:   ["kidneys"],
  Saturn:  ["joints", "knees", "lowerBack", "spine", "recovery"],
  Rahu:    ["stress", "sleep", "eyes"],
  Ketu:    ["nervousSystem", "recovery"],
};

const BASELINE = 25;
const DUSTHANA_HOUSES = new Set([6, 8, 12]);
const KENDRA_HOUSES   = new Set([1, 4, 7, 10]);

// Moon's Nakshatra (~1 per day) governs different body systems — this is the
// primary source of daily variation in health sensitivity.
const NAKSHATRA_BODY_MAP: (keyof BodyRiskProfile)[][] = [
  ["head", "nervousSystem"],              // 0  Ashwini
  ["throat", "neck"],                     // 1  Bharani
  ["eyes", "head", "sinuses"],            // 2  Krittika
  ["throat", "neck", "shoulders"],        // 3  Rohini
  ["shoulders", "neck", "upperBack"],     // 4  Mrigashira
  ["head", "lungs", "sinuses"],           // 5  Ardra
  ["stomach", "liver", "digestiveSystem"],// 6  Punarvasu
  ["stomach", "digestiveSystem", "heart"],// 7  Pushya
  ["stomach", "digestiveSystem"],         // 8  Ashlesha
  ["heart", "spine", "lowerBack"],        // 9  Magha
  ["heart", "spine", "upperBack"],        // 10 Purva Phalguni
  ["heart", "digestiveSystem", "spine"],  // 11 Uttara Phalguni
  ["digestiveSystem", "stomach", "nervousSystem"], // 12 Hasta
  ["stomach", "digestiveSystem"],         // 13 Chitra
  ["lungs", "stress", "throat"],          // 14 Swati
  ["kidneys", "stress", "lowerBack"],     // 15 Vishakha
  ["stomach", "heart", "kidneys"],        // 16 Anuradha
  ["spine", "nervousSystem", "stress"],   // 17 Jyeshtha
  ["lowerBack", "spine", "feet"],         // 18 Moola
  ["joints", "lowerBack", "muscles"],     // 19 Purva Ashadha
  ["knees", "spine", "joints"],           // 20 Uttara Ashadha
  ["legs", "kidneys", "lowerBack"],       // 21 Shravana
  ["legs", "nervousSystem", "stress"],    // 22 Dhanishtha
  ["legs", "sleep", "stress"],            // 23 Shatabhisha
  ["feet", "sleep", "recovery"],          // 24 Purva Bhadrapada
  ["feet", "recovery", "sleep"],          // 25 Uttara Bhadrapada
  ["feet", "recovery", "digestiveSystem"],// 26 Revati
];

interface NatalPlanet {
  name: string;
  sign: number;
  strengthLevel?: string;
  isRetrograde?: boolean;
  isCombust?: boolean;
}

interface TransitPlanet {
  name: string;
  longitude: number;
  speed: number;
  weight: number;
}

/**
 * How much health stress a planet generates based on its natal placement.
 */
function computeNatalActivation(
  planetName: string,
  planets: NatalPlanet[],
  lagnaSign: number
): number {
  let score = PLANET_BASE_STRESS[planetName] ?? 45;

  const p = planets.find((pl) => pl.name === planetName);
  if (p) {
    if (p.strengthLevel === "strong") score -= 15;
    if (p.strengthLevel === "weak")   score += 20;
    if (p.isRetrograde)               score += 12;
    if (p.isCombust)                  score += 15;

    const house = ((p.sign - lagnaSign + 12) % 12) + 1;
    if (DUSTHANA_HOUSES.has(house)) score += 18;
    if (KENDRA_HOUSES.has(house))   score -= 8;
  }

  return Math.min(95, Math.max(10, Math.round(score)));
}

/**
 * How much stress a transiting planet contributes right now.
 * Uses longitude to detect sandhi (sign-boundary) positions which amplify
 * effects, giving the score daily variation as planets move.
 */
function computeTransitActivation(planetName: string, speed: number, longitude: number): number {
  let score = PLANET_BASE_STRESS[planetName] ?? 45;
  if (speed < 0) score += 12; // retrograde amplifies the effect

  // Sandhi: first/last 3° of a sign are transitional — heightened sensitivity
  const degreeInSign = longitude % 30;
  if (degreeInSign < 3 || degreeInSign > 27) score += 10;

  // Moon moves ~13°/day — use its degree within the sign for fine daily variation
  if (planetName === "Moon") {
    // Degrees 0-10 (rising), 10-20 (peak), 20-30 (waning) have different energies
    if (degreeInSign >= 10 && degreeInSign <= 20) score += 5; // peak sensitization
  }

  return Math.min(90, Math.max(10, Math.round(score)));
}

/**
 * Distribute a planet's activation score across the body systems it rules,
 * scaled by the given dasha weight.
 */
function applyPlanetContribution(
  profile: BodyRiskProfile,
  planetName: string,
  activation: number,
  weight: number
): void {
  const systems = PLANET_BODY_MAP[planetName];
  if (!systems) return;
  for (const sys of systems) {
    profile[sys] = profile[sys] + activation * weight;
  }
}

export interface DashaStack {
  mahadasha: string;
  antardasha: string;
  pratyantar?: string | null;
}

/**
 * Compute a full BodyRiskProfile from natal chart, active dasha, and transits.
 */
export function computeBodyRiskProfile(
  chart: { planets: NatalPlanet[]; lagna: { sign: number } },
  dashaStack: DashaStack,
  transitPositions: TransitPlanet[]
): BodyRiskProfile {
  const profile: BodyRiskProfile = {
    head: BASELINE, eyes: BASELINE, sinuses: BASELINE,
    throat: BASELINE, neck: BASELINE, shoulders: BASELINE,
    upperBack: BASELINE, lowerBack: BASELINE, spine: BASELINE,
    heart: BASELINE, lungs: BASELINE, stomach: BASELINE,
    digestiveSystem: BASELINE, liver: BASELINE, kidneys: BASELINE,
    nervousSystem: BASELINE, muscles: BASELINE, joints: BASELINE,
    knees: BASELINE, legs: BASELINE, feet: BASELINE,
    sleep: BASELINE, recovery: BASELINE, stress: BASELINE,
  };

  const { planets, lagna } = chart;
  const lagnaSign = lagna.sign;

  // ── 1. Mahadasha (40%) ──────────────────────────────────────────────────
  const mdScore = computeNatalActivation(dashaStack.mahadasha, planets, lagnaSign);
  applyPlanetContribution(profile, dashaStack.mahadasha, mdScore, 0.40);

  // ── 2. Antardasha (25%) ─────────────────────────────────────────────────
  const adScore = computeNatalActivation(dashaStack.antardasha, planets, lagnaSign);
  applyPlanetContribution(profile, dashaStack.antardasha, adScore, 0.25);

  // ── 3. Pratyantar (15%) ─────────────────────────────────────────────────
  if (dashaStack.pratyantar) {
    const pdScore = computeNatalActivation(dashaStack.pratyantar, planets, lagnaSign);
    applyPlanetContribution(profile, dashaStack.pratyantar, pdScore, 0.15);
  }

  // ── 4. Current Transits (15%) ───────────────────────────────────────────
  // Each transit planet's share is proportional to its astrological impact weight
  const totalTransitWeight = transitPositions.reduce((s, t) => s + (t.weight || 1), 0);
  for (const transit of transitPositions) {
    const tScore  = computeTransitActivation(transit.name, transit.speed, transit.longitude);
    const tWeight = ((transit.weight || 1) / totalTransitWeight) * 0.15;
    applyPlanetContribution(profile, transit.name, tScore, tWeight);
  }

  // ── 5. Moon Nakshatra Daily Effect (20 pts per governed system) ────────────
  // Moon transits one Nakshatra (~13.33°) every ~24-27 hours, so this shifts
  // which body systems rank highest day-to-day.
  const moonPos = transitPositions.find(p => p.name === "Moon");
  if (moonPos) {
    const nakshatraIndex = Math.min(26, Math.floor((moonPos.longitude % 360) / (360 / 27)));
    const nakshatraSystems = NAKSHATRA_BODY_MAP[nakshatraIndex] ?? [];
    for (const sys of nakshatraSystems) {
      profile[sys] += 20;
    }
  }

  // Clamp & round all values to 0–100
  for (const key of Object.keys(profile) as (keyof BodyRiskProfile)[]) {
    profile[key] = Math.min(98, Math.max(10, Math.round(profile[key])));
  }

  return profile;
}

/**
 * Returns the top-N body systems ordered by risk score (highest first).
 */
export function getTopRisks(
  profile: BodyRiskProfile,
  n = 5
): Array<{ system: string; score: number }> {
  return (Object.entries(profile) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([system, score]) => ({ system, score }));
}
