/**
 * Health Risk Profile Engine — V2
 *
 * Computes Vedic-astrology-derived health sensitivity scores (0–100) across
 * 20 health intelligence categories, organised into five groups:
 *
 *   Structural      — head, throat, back, joints
 *   Internal Organs — heart, stomach, liver, kidneys
 *   Functional      — respiratory, immune, digestive, nervous
 *   Symptom Domains — inflammation, coldViral, allergy, skin
 *   Functional States — energy, mentalWellness, sleep, recovery
 *
 * Higher score = more astrological sensitivity / predisposition today.
 * These are predisposition indicators, NOT diagnoses.
 *
 * Weighting: Mahadasha 40% | Antardasha 25% | Pratyantar 15% | Transits 15% | Nakshatra 5%
 */

// ── Interface ──────────────────────────────────────────────────────────────────

export interface BodyRiskProfile {
  // Structural
  head: number;               // headache, dizziness, head pressure, brain fog
  throat: number;             // sore throat, ENT (ear, nose, throat), voice
  back: number;               // back pain, spine, posture, lumbar
  joints: number;             // joint pain, stiffness, musculoskeletal

  // Internal Organs
  heart: number;              // cardiac vitality, palpitations, circulation
  stomach: number;            // nausea, acidity, appetite disruption
  liver: number;              // metabolism, detox capacity, sluggishness
  kidneys: number;            // fluid balance, urinary sensitivity

  // Functional Systems
  respiratorySystem: number;  // cold, cough, congestion, breathing difficulty
  immuneSystem: number;       // infection resistance, healing speed, susceptibility
  digestiveSystem: number;    // bloating, indigestion, gut disturbance
  nervousSystem: number;      // anxiety, brain fog, nerve sensitivity

  // Symptom Domains
  inflammation: number;       // fever, body ache, heat, inflammatory response
  coldViralSusceptibility: number; // cold/flu/viral/bacterial risk
  allergySensitivity: number; // skin rash, nasal allergy, seasonal reactions
  skinHealth: number;         // skin dryness, eruptions, complexion issues

  // Functional States
  energyStamina: number;      // fatigue risk, reduced endurance, exhaustion
  mentalWellness: number;     // stress, anxiety, emotional fatigue, mood
  sleep: number;              // sleep quality, insomnia, restlessness
  recovery: number;           // physical recovery speed, healing time
}

// ── Planetary base stress ──────────────────────────────────────────────────────

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

// ── Planet → health system mapping ────────────────────────────────────────────
// Based on classical Vedic Karakatva (natural significations).

const PLANET_BODY_MAP: Record<string, (keyof BodyRiskProfile)[]> = {
  // Sun: pitta/heat; governs head, heart, vitality, immune strength
  Sun:     ["head", "heart", "energyStamina", "inflammation"],

  // Moon: kapha/fluids; governs gut, immunity (body fluids), emotional mind, sleep
  Moon:    ["stomach", "digestiveSystem", "immuneSystem", "sleep", "mentalWellness"],

  // Mars: fire/blood; governs inflammation, fever, muscles, joints, energy drive
  Mars:    ["inflammation", "joints", "energyStamina", "head"],

  // Mercury: nervous system, skin, speech; governs ENT, skin, cognition, allergies
  Mercury: ["nervousSystem", "throat", "skinHealth", "allergySensitivity"],

  // Jupiter: expansion, liver, fat metabolism, overall immunity
  Jupiter: ["liver", "immuneSystem", "digestiveSystem", "recovery"],

  // Venus: water/kidneys, skin, reproductive; governs fluid balance, skin, allergy
  Venus:   ["kidneys", "skinHealth", "allergySensitivity"],

  // Saturn: cold/dry/chronic; governs joints, back, slow recovery, viral vulnerability
  Saturn:  ["joints", "back", "recovery", "coldViralSusceptibility", "energyStamina"],

  // Rahu: foreign substances, viral/bacterial agents, unusual illness, anxiety
  Rahu:    ["coldViralSusceptibility", "mentalWellness", "allergySensitivity", "sleep", "respiratorySystem"],

  // Ketu: mysterious/chronic illness, immune dysregulation, nervous sensitivity
  Ketu:    ["immuneSystem", "nervousSystem", "recovery", "inflammation"],
};

// ── Moon Nakshatra → health system mapping ─────────────────────────────────────
// Moon transits one Nakshatra (~13.33°) every ~24–27 hours — primary daily differentiator.
// Index 0–26 corresponds to Ashwini → Revati.

const NAKSHATRA_BODY_MAP: (keyof BodyRiskProfile)[][] = [
  ["head", "nervousSystem", "energyStamina"],                    // 0  Ashwini (horse-healers, speed)
  ["throat", "respiratorySystem"],                               // 1  Bharani (throat, neck, restraint)
  ["head", "inflammation", "immuneSystem"],                      // 2  Krittika (fire/knife = fever, heat)
  ["throat", "stomach", "digestiveSystem"],                      // 3  Rohini (nourishment, vocal)
  ["joints", "back", "respiratorySystem"],                       // 4  Mrigashira (searching, dryness)
  ["head", "respiratorySystem", "coldViralSusceptibility"],      // 5  Ardra (storm = illness onset, congestion)
  ["stomach", "liver", "immuneSystem"],                          // 6  Punarvasu (restoration, renewal)
  ["stomach", "digestiveSystem", "heart"],                       // 7  Pushya (nourishment, expansion)
  ["stomach", "coldViralSusceptibility", "digestiveSystem"],     // 8  Ashlesha (clinging = mucus, cold)
  ["heart", "back", "energyStamina"],                           // 9  Magha (throne = core vitality)
  ["heart", "skinHealth", "energyStamina"],                      // 10 Purva Phalguni (creative fire)
  ["heart", "digestiveSystem", "back"],                          // 11 Uttara Phalguni (sustenance)
  ["digestiveSystem", "nervousSystem", "skinHealth"],            // 12 Hasta (hands = skin, nervous)
  ["digestiveSystem", "skinHealth", "allergySensitivity"],       // 13 Chitra (brightness, skin)
  ["respiratorySystem", "throat", "mentalWellness"],             // 14 Swati (wind = breathing, air)
  ["kidneys", "mentalWellness", "digestiveSystem"],              // 15 Vishakha (branching, over-reach)
  ["heart", "immuneSystem", "stomach"],                          // 16 Anuradha (devotion, heart)
  ["back", "nervousSystem", "mentalWellness"],                   // 17 Jyeshtha (elder, spine, stress)
  ["back", "joints", "digestiveSystem"],                         // 18 Moola (roots, elimination)
  ["joints", "back", "respiratorySystem"],                       // 19 Purva Ashadha (water = cold, joints)
  ["joints", "back", "heart"],                                   // 20 Uttara Ashadha (sustained effort)
  ["nervousSystem", "immuneSystem", "throat"],                   // 21 Shravana (listening, ENT)
  ["joints", "heart", "energyStamina"],                          // 22 Dhanishtha (abundance, bones)
  ["immuneSystem", "coldViralSusceptibility", "sleep"],          // 23 Shatabhisha (100 physicians, healing)
  ["immuneSystem", "mentalWellness", "sleep"],                   // 24 Purva Bhadrapada (intense/purging)
  ["immuneSystem", "recovery", "energyStamina"],                 // 25 Uttara Bhadrapada (depth, renewal)
  ["digestiveSystem", "immuneSystem", "recovery"],               // 26 Revati (nourishment, completion)
];

const BASELINE = 25;
const DUSTHANA_HOUSES = new Set([6, 8, 12]);
const KENDRA_HOUSES   = new Set([1, 4, 7, 10]);

// ── Helper functions ───────────────────────────────────────────────────────────

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

function computeNatalActivation(
  planetName: string,
  planets: NatalPlanet[],
  lagnaSign: number
): number {
  let score = PLANET_BASE_STRESS[planetName] ?? 45;
  const p = planets.find(pl => pl.name === planetName);
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

function computeTransitActivation(planetName: string, speed: number, longitude: number): number {
  let score = PLANET_BASE_STRESS[planetName] ?? 45;
  if (speed < 0) score += 12; // retrograde amplifies

  // Sandhi (first/last 3° of sign) — heightened sensitivity
  const degreeInSign = longitude % 30;
  if (degreeInSign < 3 || degreeInSign > 27) score += 10;

  // Moon: peak sensitization mid-sign (10°–20°)
  if (planetName === "Moon" && degreeInSign >= 10 && degreeInSign <= 20) score += 5;

  return Math.min(90, Math.max(10, Math.round(score)));
}

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

// ── Main exports ───────────────────────────────────────────────────────────────

export interface DashaStack {
  mahadasha: string;
  antardasha: string;
  pratyantar?: string | null;
}

export function computeBodyRiskProfile(
  chart: { planets: NatalPlanet[]; lagna: { sign: number } },
  dashaStack: DashaStack,
  transitPositions: TransitPlanet[]
): BodyRiskProfile {
  const profile: BodyRiskProfile = {
    head: BASELINE,                  throat: BASELINE,
    back: BASELINE,                  joints: BASELINE,
    heart: BASELINE,                 stomach: BASELINE,
    liver: BASELINE,                 kidneys: BASELINE,
    respiratorySystem: BASELINE,     immuneSystem: BASELINE,
    digestiveSystem: BASELINE,       nervousSystem: BASELINE,
    inflammation: BASELINE,          coldViralSusceptibility: BASELINE,
    allergySensitivity: BASELINE,    skinHealth: BASELINE,
    energyStamina: BASELINE,         mentalWellness: BASELINE,
    sleep: BASELINE,                 recovery: BASELINE,
  };

  const { planets, lagna } = chart;
  const lagnaSign = lagna.sign;

  // 1. Mahadasha (40%)
  const mdScore = computeNatalActivation(dashaStack.mahadasha, planets, lagnaSign);
  applyPlanetContribution(profile, dashaStack.mahadasha, mdScore, 0.40);

  // 2. Antardasha (25%)
  const adScore = computeNatalActivation(dashaStack.antardasha, planets, lagnaSign);
  applyPlanetContribution(profile, dashaStack.antardasha, adScore, 0.25);

  // 3. Pratyantar (15%)
  if (dashaStack.pratyantar) {
    const pdScore = computeNatalActivation(dashaStack.pratyantar, planets, lagnaSign);
    applyPlanetContribution(profile, dashaStack.pratyantar, pdScore, 0.15);
  }

  // 4. Current Transits (15%) — weight proportional to astrological impact
  const totalTransitWeight = transitPositions.reduce((s, t) => s + (t.weight || 1), 0);
  for (const transit of transitPositions) {
    const tScore  = computeTransitActivation(transit.name, transit.speed, transit.longitude);
    const tWeight = ((transit.weight || 1) / totalTransitWeight) * 0.15;
    applyPlanetContribution(profile, transit.name, tScore, tWeight);
  }

  // 5. Moon Nakshatra daily effect (+20 pts to governed systems)
  // Moon shifts nakshatra every ~24–27 hours — primary source of daily variation.
  const moonPos = transitPositions.find(p => p.name === "Moon");
  if (moonPos) {
    const nakshatraIndex = Math.min(26, Math.floor((moonPos.longitude % 360) / (360 / 27)));
    for (const sys of (NAKSHATRA_BODY_MAP[nakshatraIndex] ?? [])) {
      profile[sys] += 20;
    }
  }

  // 6. Compound: coldViralSusceptibility rises when both respiratory + immune are stressed
  profile.coldViralSusceptibility = Math.min(98,
    profile.coldViralSusceptibility * 0.6 +
    profile.respiratorySystem     * 0.2 +
    profile.immuneSystem          * 0.2
  );

  // Clamp all to 10–98
  for (const key of Object.keys(profile) as (keyof BodyRiskProfile)[]) {
    profile[key] = Math.min(98, Math.max(10, Math.round(profile[key])));
  }

  return profile;
}

export function getTopRisks(
  profile: BodyRiskProfile,
  n = 5
): Array<{ system: string; score: number }> {
  return (Object.entries(profile) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([system, score]) => ({ system, score }));
}
