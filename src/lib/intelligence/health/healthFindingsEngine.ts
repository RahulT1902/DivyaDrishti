/**
 * Health Findings Engine — Deterministic Layer
 *
 * Converts a BodyRiskProfile into a fixed set of Health Findings BEFORE
 * Claude writes anything. Claude narrates these findings; it cannot discover
 * new systems because the user mentioned them (query anchoring prevention).
 *
 * Architecture:
 *   Chart → BodyRiskProfile → HealthFindings → Claude (narrates only)
 */

import type { BodyRiskProfile } from "./bodyRiskProfile";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HealthFinding {
  system: string;       // internal key e.g. "respiratorySystem"
  displayName: string;  // human label e.g. "Respiratory System"
  score: number;        // 0–100 sensitivity score
}

export interface HealthFindings {
  primaryFocus:   HealthFinding;
  secondaryFocus: HealthFinding | null;
  tertiaryFocus:  HealthFinding | null;
  activeSystems:  string[];   // all systems with score >= ACTIVE_THRESHOLD
  symptoms:       string[];   // 4–6 specific symptoms across primary + secondary
  energyArc:      string;     // plain-language energy pattern through the day
  digestiveNote:  string;     // 1 sentence on digestion
  recoveryNote:   string;     // 1 sentence on recovery speed
  confidence:     "low" | "medium" | "high";
}

// ── Display names ──────────────────────────────────────────────────────────────

const DISPLAY_NAMES: Record<string, string> = {
  head:                    "Neurological / Head",
  throat:                  "ENT — Ear, Nose & Throat",
  back:                    "Back & Spine",
  joints:                  "Joints & Musculoskeletal",
  heart:                   "Heart & Circulation",
  stomach:                 "Stomach",
  liver:                   "Liver & Metabolism",
  kidneys:                 "Kidneys & Fluid Balance",
  respiratorySystem:       "Respiratory System",
  immuneSystem:            "Immune System",
  digestiveSystem:         "Digestive System",
  nervousSystem:           "Nervous System",
  inflammation:            "Inflammation",
  coldViralSusceptibility: "Cold & Viral Susceptibility",
  allergySensitivity:      "Allergy Sensitivity",
  skinHealth:              "Skin Health",
  energyStamina:           "Energy & Stamina",
  mentalWellness:          "Mental Wellness",
  sleep:                   "Sleep Quality",
  recovery:                "Physical Recovery",
};

// ── Symptom vocabulary per system ─────────────────────────────────────────────

const SYSTEM_SYMPTOMS: Record<string, string[]> = {
  respiratorySystem:       ["throat irritation", "nasal congestion", "mild cough", "sinus pressure", "slight breathlessness on exertion"],
  immuneSystem:            ["feeling run-down", "slower recovery after effort", "susceptibility to minor infections", "general low-grade fatigue"],
  coldViralSusceptibility: ["runny or stuffy nose", "sore throat", "mild body ache", "congestion", "mild fever tendency if exposed"],
  inflammation:            ["body soreness or aches", "warmth or stiffness in joints", "mild fever tendency", "skin warmth or sensitivity"],
  head:                    ["mild headache", "head heaviness or pressure", "dizziness on standing", "mental fog or slow thinking"],
  throat:                  ["sore or scratchy throat", "voice strain", "ear sensitivity", "nasal dryness"],
  digestiveSystem:         ["bloating after meals", "mild acidity or heartburn", "irregular bowel tendency", "appetite fluctuation"],
  stomach:                 ["acidity or heartburn", "nausea tendency", "appetite disruption", "heaviness after meals"],
  nervousSystem:           ["mental restlessness", "overthinking or racing thoughts", "mild anxiety", "heightened nerve sensitivity"],
  mentalWellness:          ["stress accumulation", "mood dips", "emotional fatigue", "difficulty relaxing or switching off"],
  energyStamina:           ["fatigue by early afternoon", "reduced physical endurance", "motivation dip after lunch", "need for extra rest"],
  sleep:                   ["difficulty winding down at night", "restless or light sleep", "early waking", "unrefreshing sleep"],
  recovery:                ["slower bounce-back after physical effort", "prolonged muscle soreness", "body taking longer to feel rested"],
  joints:                  ["joint stiffness in the morning", "aching in knees or hips", "reduced flexibility", "soreness after activity"],
  back:                    ["lower back tension or dull ache", "spine stiffness after sitting", "postural fatigue"],
  allergySensitivity:      ["skin sensitivity to fabrics or products", "nasal sensitivity to dust or pollen", "mild itching", "seasonal allergy flare"],
  skinHealth:              ["skin dryness or tightness", "mild breakout tendency", "dull complexion", "sensitivity to sun or products"],
  heart:                   ["mild palpitations", "slight chest tightness tendency", "circulation sluggishness"],
  liver:                   ["sluggish metabolism", "heaviness after rich meals", "slow detox feeling"],
  kidneys:                 ["mild fluid retention", "lower-back pressure near the kidney area", "urinary sensitivity"],
};

const ACTIVE_THRESHOLD = 52;

// ── Engine ─────────────────────────────────────────────────────────────────────

export function buildHealthFindings(profile: BodyRiskProfile): HealthFindings {
  // Rank all systems by score
  const ranked = (Object.entries(profile) as [string, number][])
    .sort(([, a], [, b]) => b - a);

  const top = ranked.slice(0, 3);
  const activeSystems = ranked
    .filter(([, score]) => score >= ACTIVE_THRESHOLD)
    .map(([sys]) => sys);

  const toFinding = ([sys, score]: [string, number]): HealthFinding => ({
    system: sys,
    displayName: DISPLAY_NAMES[sys] ?? sys,
    score,
  });

  const primaryFinding   = toFinding(top[0]);
  const secondaryFinding = top[1] && top[1][1] >= ACTIVE_THRESHOLD ? toFinding(top[1]) : null;
  const tertiaryFinding  = top[2] && top[2][1] >= ACTIVE_THRESHOLD ? toFinding(top[2]) : null;

  // Symptoms: pick from primary (3) + secondary (2) + deduplicate
  const primarySymptoms   = (SYSTEM_SYMPTOMS[primaryFinding.system]   ?? []).slice(0, 3);
  const secondarySymptoms = secondaryFinding
    ? (SYSTEM_SYMPTOMS[secondaryFinding.system] ?? []).slice(0, 2)
    : [];
  const symptoms = [...new Set([...primarySymptoms, ...secondarySymptoms])].slice(0, 6);

  // Energy arc
  const energyRisk = profile.energyStamina ?? 50;
  const energyArc =
    energyRisk < 38 ? "Energy looks good through the day. Both morning and afternoon should feel productive." :
    energyRisk < 52 ? "Morning energy is reasonable. A mild dip is likely in the mid-afternoon — plan demanding tasks before 2pm." :
    energyRisk < 66 ? "Energy may feel moderate. Morning is workable, but avoid overcommitting after 3pm when it tends to dip." :
                      "Energy may feel lower than usual from early on. Take regular breaks and avoid overexerting.";

  // Digestion
  const digestScore = ((profile.digestiveSystem ?? 0) + (profile.stomach ?? 0)) / 2;
  const digestiveNote =
    digestScore < 40 ? "Stable. No particular digestive sensitivity today." :
    digestScore < 58 ? "Mildly sensitive. Avoid heavy, oily, or very spicy food." :
                       "Needs attention. Prefer light, easily digestible meals and avoid skipping.";

  // Recovery
  const recovScore = profile.recovery ?? 50;
  const recoveryNote =
    recovScore < 42 ? "Recovery is good today — the body can handle normal effort." :
    recovScore < 60 ? "Recovery may be slightly slower than usual. Adequate sleep matters more today." :
                      "Recovery is slow today. The body needs more rest than usual — don't push through fatigue.";

  // Confidence
  const topScore = primaryFinding.score;
  const confidence: "low" | "medium" | "high" =
    topScore >= 70 ? "high" :
    topScore >= 55 ? "medium" : "low";

  return {
    primaryFocus:   primaryFinding,
    secondaryFocus: secondaryFinding,
    tertiaryFocus:  tertiaryFinding,
    activeSystems,
    symptoms,
    energyArc,
    digestiveNote,
    recoveryNote,
    confidence,
  };
}
