import { AstrologyContext } from "../../core/types";

// BodySystemReport is the key missing layer between the symbolic engine and the narrator.
//
// Instead of: "Your health potential is moderate (68/100)"
// The narrator receives: "Respiratory — higher chance of sore throat if exposed to cold/damp (2–3 days)"
//
// This is astrological domain knowledge — not algorithm, not ML.
// Each mapping was written by an astrologer, not derived statistically.

export type BodySystem =
  | "Respiratory"
  | "Digestive"
  | "Inflammatory"
  | "Sleep"
  | "Mental"
  | "Musculoskeletal"
  | "Immunity"
  | "General Vitality";

export interface BodySystemReport {
  system:        BodySystem;
  isVulnerable:  boolean;    // true = must be mentioned by the narrator
  vulnerability: number;     // 0–100; ≥60 = mention prominently, 40–59 = gentle note
  tendencies:    string[];   // specific manifestations: ["sore throat", "nasal congestion"]
  avoidance:     string;     // what to do / avoid: "Drink warm water, avoid cold air"
  duration:      string;     // "today only (~2 days)", "next few weeks", "ongoing"
  source:        "transit" | "natal" | "dasha";
}

// ── Body System Evaluator ─────────────────────────────────────────────────────
//
// Evaluates which body systems are vulnerable TODAY based on:
//   1. Transit rules that fired (short-lived, specific to today/this week)
//   2. Natal inference rules that fired (long-term constitutional tendencies)
//   3. Current dasha planet (medium-term background influence)
//
// This produces the SPECIFIC health observations the narrator needs to answer
// "How's my health today?" in a way that feels chart-specific, not generic.

export function evaluateBodySystems(ctx: AstrologyContext): BodySystemReport[] {
  const reports: BodySystemReport[] = [];

  const firedTransit    = new Set((ctx.transit ?? []).map(t => t.ruleId));
  const firedInference  = new Set(ctx.inferences.map(i => i.id));
  const dashaPlanet     = ctx.dasha?.mahadasha;

  // ── Respiratory (Moon + Saturn combination = cold/sore throat/dry cough) ──
  // Classical: Moon represents fluids/cold; Saturn represents dryness/cold wind.
  // When Moon is in a stressed position AND Saturn exerts influence, the respiratory
  // tract (throat, sinuses, bronchi) becomes the most likely site of vulnerability.
  const moonStressed = firedTransit.has("transit-moon-6th-health")  ||
                       firedTransit.has("transit-moon-8th-health")   ||
                       firedTransit.has("transit-moon-12th-health");
  const saturnCast   = firedTransit.has("transit-saturn-lagna-health") ||
                       firedTransit.has("transit-saturn-6th-health")   ||
                       firedTransit.has("transit-saturn-8th-health")   ||
                       dashaPlanet === "Saturn" || dashaPlanet === "Rahu";

  if (moonStressed && saturnCast) {
    reports.push({
      system:        "Respiratory",
      isVulnerable:  true,
      vulnerability: 72,
      tendencies:    ["sore throat", "nasal congestion", "mild cold if exposed to cold or damp air", "dry cough"],
      avoidance:     "Drink warm water throughout the day. Avoid cold drinks, cold air, and rain. Consider steam inhalation if throat feels dry.",
      duration:      "next 2–3 days",
      source:        "transit",
    });
  }

  // ── Digestive (Moon in 6th) ───────────────────────────────────────────────
  // Moon's transit through the 6th brings emotional sensitivity to the gut.
  // 6th house rules digestion, assimilation, and routine body functions.
  // Tendency: the mind-body connection creates acidity when emotional state is unsettled.
  if (firedTransit.has("transit-moon-6th-health")) {
    reports.push({
      system:        "Digestive",
      isVulnerable:  true,
      vulnerability: 63,
      tendencies:    ["acidity", "mild bloating", "slight indigestion — especially after heavy or oily food"],
      avoidance:     "Eat light, on time, and avoid oily or very spicy food today. Warm water after meals helps.",
      duration:      "today and tomorrow (~2 days)",
      source:        "transit",
    });
  }

  // ── Sleep (Moon in 12th) ──────────────────────────────────────────────────
  // 12th house rules sleep, isolation, and hidden activity. Moon here creates
  // restlessness or unusual sleep patterns — either too light or too heavy.
  if (firedTransit.has("transit-moon-12th-health")) {
    reports.push({
      system:        "Sleep",
      isVulnerable:  true,
      vulnerability: 58,
      tendencies:    ["disrupted sleep or restlessness", "vivid or unusual dreams", "feeling tired despite rest"],
      avoidance:     "Wind down early tonight. Avoid screens and heavy meals after 8 PM. Keep sleep timing consistent.",
      duration:      "tonight (~1–2 days)",
      source:        "transit",
    });
  }

  // ── Mental / Emotional (Moon in 8th) ────────────────────────────────────
  // 8th house is the house of hidden things, crisis, and transformation.
  // Moon here creates emotional undercurrents, suppressed fatigue, and low mood.
  if (firedTransit.has("transit-moon-8th-health")) {
    reports.push({
      system:        "Mental",
      isVulnerable:  true,
      vulnerability: 64,
      tendencies:    ["hidden fatigue", "emotional heaviness or low mood", "lower than usual motivation and drive"],
      avoidance:     "Rest more than usual. Avoid emotionally draining conversations. Gentle activity like walking helps lift energy.",
      duration:      "today (~2 days)",
      source:        "transit",
    });
  }

  // ── Inflammatory (Mars transiting 6th) ───────────────────────────────────
  // Mars in the 6th house intensifies the house of disease and enemies.
  // Classical tendency: fever, minor infections, skin issues, acne, cuts.
  // When natal 6th also has malefics, the tendency amplifies.
  if (firedTransit.has("transit-mars-6th-health")) {
    const natalInflammatory = firedInference.has("health-6th-malefic-strong");
    reports.push({
      system:        "Inflammatory",
      isVulnerable:  true,
      vulnerability: natalInflammatory ? 75 : 62,
      tendencies:    ["minor skin irritation or acne", "elevated body heat", "higher susceptibility to minor infections", "fever-prone if immunity dips"],
      avoidance:     "Stay cool. Avoid overexertion and excess heat. Eat cooling foods. Watch for early signs of fever or infection.",
      duration:      "next 4–6 weeks",
      source:        "transit",
    });
  }

  // ── Musculoskeletal (Saturn transiting lagna or 8th) ─────────────────────
  // Saturn represents structure, bones, joints, and slowness.
  // When transiting the lagna, it puts pressure on the body's overall frame.
  // When in 8th, it brings chronic or slow-moving concerns to the surface.
  const saturnStructural = firedTransit.has("transit-saturn-lagna-health") ||
                           firedTransit.has("transit-saturn-8th-health");
  if (saturnStructural) {
    const inSaturnDasha = dashaPlanet === "Saturn";
    reports.push({
      system:        "Musculoskeletal",
      isVulnerable:  true,
      vulnerability: inSaturnDasha ? 72 : 53,
      tendencies:    ["stiffness", "mild back or joint discomfort", "general heaviness and fatigue", "slower recovery from exertion"],
      avoidance:     "Light daily stretching helps more than heavy workouts. Avoid prolonged sitting. Keep joints warm in cold weather.",
      duration:      "ongoing (this transit lasts months)",
      source:        "transit",
    });
  }

  // ── Saturn discipline period (dasha-only, no acute transit) ──────────────
  // Saturn mahadasha/antardasha without an active transit still creates a background
  // tendency toward cold, damp, and structural issues — but more as a long-term pattern
  // than an acute today-specific risk.
  if (dashaPlanet === "Saturn" && !saturnStructural && !moonStressed) {
    reports.push({
      system:        "Musculoskeletal",
      isVulnerable:  false,
      vulnerability: 42,
      tendencies:    ["background stiffness tendency", "joints and bones need consistent attention"],
      avoidance:     "Regular light exercise, warm diet, and adequate calcium/vitamin D support.",
      duration:      "long-term dasha pattern",
      source:        "dasha",
    });
  }

  // ── Mars dasha inflammatory background ───────────────────────────────────
  if (dashaPlanet === "Mars" && !firedTransit.has("transit-mars-6th-health")) {
    reports.push({
      system:        "Inflammatory",
      isVulnerable:  false,
      vulnerability: 40,
      tendencies:    ["general tendency toward heat and inflammation", "slightly higher infection susceptibility"],
      avoidance:     "Cooling diet, adequate hydration, and managing stress prevents flare-ups.",
      duration:      "ongoing dasha period",
      source:        "dasha",
    });
  }

  // ── Natal inflammatory tendency (strong malefic in natal 6th) ────────────
  // Long-term tendency — not acute today unless a transit amplifies it.
  if (firedInference.has("health-6th-malefic-strong") && !firedTransit.has("transit-mars-6th-health")) {
    reports.push({
      system:        "Inflammatory",
      isVulnerable:  false,
      vulnerability: 38,
      tendencies:    ["constitutional tendency toward infection and inflammation", "responds well to strong immune habits"],
      avoidance:     "Consistent sleep, clean diet, and regular exercise are your best protection.",
      duration:      "lifelong natal tendency — manageable with lifestyle",
      source:        "natal",
    });
  }

  // ── Chronic concern (Saturn in natal 8th) ────────────────────────────────
  if (firedInference.has("health-saturn-8th") && !saturnStructural) {
    reports.push({
      system:        "General Vitality",
      isVulnerable:  false,
      vulnerability: 35,
      tendencies:    ["recovery from illness is slower than average", "chronic or recurring issues deserve consistent medical attention"],
      avoidance:     "Don't ignore persistent or recurring symptoms. Preventive check-ups are important for you.",
      duration:      "lifelong natal tendency",
      source:        "natal",
    });
  }

  // ── Immunity boost (Jupiter in lagna or 6th) — note, not vulnerability ───
  // Don't add a report for positive transits; the narrator will mention general
  // vitality is good in the absence of vulnerable systems.

  // ── Moon Nakshatra — primary DAILY differentiator ────────────────────────
  // Moon changes nakshatra every ~24–27 hours. This is the most day-specific
  // health signal available. Even on days when no house-based transit rules fire,
  // the Moon's nakshatra creates a mild daily-specific body tendency.
  //
  // Only add if no stronger transit rules already fired for the same system.
  const activeSystems = new Set(reports.map(r => r.system));
  const nakshatraIndex = ctx.moonNakshatraIndex;

  if (nakshatraIndex !== undefined) {
    const entry = NAKSHATRA_BODY_SYSTEM_MAP[nakshatraIndex];
    if (entry && !activeSystems.has(entry.system)) {
      reports.push({
        system:       entry.system,
        isVulnerable: true,
        vulnerability: entry.isSignificant ? 65 : 55,
        tendencies:   entry.tendencies,
        avoidance:    entry.avoidance,
        duration:     "today (~1 day, passes as Moon moves on)",
        source:       "transit",
      });
    }
  }

  return reports;
}

// ── Moon Nakshatra → Body System Map ─────────────────────────────────────────
// Based on classical Vedic karakatva of each nakshatra.
// Index 0–26 = Ashwini → Revati.
// isSignificant = true for nakshatras classically associated with illness onset.

interface NakshatraBodyEntry {
  system:        BodySystem;
  tendencies:    string[];
  avoidance:     string;
  isSignificant: boolean;
}

const NAKSHATRA_BODY_SYSTEM_MAP: Record<number, NakshatraBodyEntry> = {
  0:  { system: "Mental",          isSignificant: false, tendencies: ["mild head heaviness", "slight mental restlessness"],               avoidance: "Take short breaks. Avoid prolonged screen time." },
  1:  { system: "Respiratory",     isSignificant: true,  tendencies: ["throat sensitivity", "mild ENT — ear, nose, throat"],              avoidance: "Drink warm water through the day. Avoid dusty environments." },
  2:  { system: "Inflammatory",    isSignificant: false, tendencies: ["slightly elevated heat sensitivity", "mild fever tendency if ill"], avoidance: "Stay cool. Avoid overexertion in hot conditions." },
  3:  { system: "Digestive",       isSignificant: false, tendencies: ["throat and stomach mildly sensitive", "slight indigestion"],        avoidance: "Eat light and on time. Avoid heavy or oily food today." },
  4:  { system: "Musculoskeletal", isSignificant: false, tendencies: ["back and joint stiffness tendency", "mild respiratory sensitivity"], avoidance: "Light stretching helps. Avoid staying seated too long." },
  5:  { system: "Respiratory",     isSignificant: true,  tendencies: ["congestion and cold-onset tendency", "breathing slightly more sensitive"], avoidance: "Avoid cold and damp environments. Warm water and steam help." },
  6:  { system: "Digestive",       isSignificant: false, tendencies: ["stomach mildly sensitive", "digestion slightly slower today"],      avoidance: "Eat light meals. Avoid skipping meals or eating in a rush." },
  7:  { system: "Digestive",       isSignificant: false, tendencies: ["stomach and gut sensitivity", "mild acidity possible"],             avoidance: "Prefer light, nourishing meals. Avoid very spicy food." },
  8:  { system: "Digestive",       isSignificant: true,  tendencies: ["cold and mucus-prone tendency", "digestion more sensitive today"],  avoidance: "Avoid cold food and drinks. Warm food preferred." },
  9:  { system: "General Vitality",isSignificant: false, tendencies: ["energy may fluctuate through the day", "mild back fatigue"],        avoidance: "Take rest when tired. Don't push through low-energy moments." },
  10: { system: "General Vitality",isSignificant: false, tendencies: ["energy needs a little extra attention", "mild skin sensitivity"],   avoidance: "Rest adequately. Avoid prolonged sun exposure today." },
  11: { system: "Digestive",       isSignificant: false, tendencies: ["mild digestive and lower back sensitivity"],                        avoidance: "Light meals and gentle back movement through the day." },
  12: { system: "Mental",          isSignificant: false, tendencies: ["nervous system more reactive today", "mild overthinking tendency"],  avoidance: "Reduce screen overload. Avoid stress-inducing conversations." },
  13: { system: "Inflammatory",    isSignificant: false, tendencies: ["mild skin sensitivity", "slight digestive and allergy reactivity"], avoidance: "Avoid harsh skin products. Eat clean, avoid junk today." },
  14: { system: "Respiratory",     isSignificant: true,  tendencies: ["respiratory and throat more sensitive today", "mild mental restlessness"], avoidance: "Avoid cold, pollution, and dusty areas. Warm water helps." },
  15: { system: "Mental",          isSignificant: false, tendencies: ["emotional tension possible", "mild kidney and digestive sensitivity"], avoidance: "Avoid emotionally draining situations. Eat on time." },
  16: { system: "Immunity",        isSignificant: false, tendencies: ["heart and immune system slightly more sensitive", "stomach may feel uneasy"], avoidance: "Avoid overexertion. Nourishing food matters more today." },
  17: { system: "Mental",          isSignificant: false, tendencies: ["back and nervous system sensitivity", "mental load feels heavier"],  avoidance: "Take breaks from work. Light back stretches help." },
  18: { system: "Musculoskeletal", isSignificant: false, tendencies: ["back and joint stiffness", "digestion slightly more sluggish"],     avoidance: "Stay active with light movement. Avoid very heavy meals." },
  19: { system: "Musculoskeletal", isSignificant: true,  tendencies: ["joints and back more sensitive today", "mild respiratory tendency"], avoidance: "Keep joints warm. Avoid cold and damp environments." },
  20: { system: "Musculoskeletal", isSignificant: false, tendencies: ["joint and back stiffness tendency", "heart may feel extra load"],   avoidance: "Avoid heavy physical strain. Rest adequately." },
  21: { system: "Respiratory",     isSignificant: false, tendencies: ["ENT — throat and ear sensitivity", "nervous system mildly reactive"], avoidance: "Warm water and steam help. Avoid loud and polluted environments." },
  22: { system: "Musculoskeletal", isSignificant: false, tendencies: ["joint stiffness", "energy may fluctuate"],                          avoidance: "Light stretching. Pace your physical energy through the day." },
  23: { system: "Immunity",        isSignificant: true,  tendencies: ["immune system mildly sensitive", "cold and viral susceptibility slightly higher", "sleep quality may be affected"], avoidance: "Sleep early and well. Avoid skipping meals. Dress warmly." },
  24: { system: "Mental",          isSignificant: false, tendencies: ["mental restlessness possible", "immune sensitivity mildly elevated"], avoidance: "Wind down early. Avoid overthinking and screen use at night." },
  25: { system: "General Vitality",isSignificant: false, tendencies: ["recovery may be a little slower today", "energy needs extra support"], avoidance: "Rest more than usual. Don't push through fatigue." },
  26: { system: "Digestive",       isSignificant: false, tendencies: ["digestion mildly sensitive", "immunity slightly reduced today"],    avoidance: "Eat light and nourishing food. Rest well tonight." },
};

// ── Formatting helpers for buildPrompt() ─────────────────────────────────────

export function formatBodySystemsForNarrator(reports: BodySystemReport[]): string {
  if (reports.length === 0) {
    return "All body systems look stable today. No specific vulnerabilities identified.";
  }

  const vulnerable = reports.filter(r => r.isVulnerable && r.vulnerability >= 60);
  const gentle     = reports.filter(r => r.isVulnerable && r.vulnerability >= 40 && r.vulnerability < 60);
  const background = reports.filter(r => !r.isVulnerable);

  const lines: string[] = [];

  if (vulnerable.length > 0) {
    lines.push("AREAS NEEDING SPECIFIC ATTENTION TODAY:");
    for (const r of vulnerable) {
      lines.push(`  [${r.system.toUpperCase()}] — ${r.tendencies.join(", ")}`);
      lines.push(`  Duration: ${r.duration}`);
      lines.push(`  What helps: ${r.avoidance}`);
    }
  }

  if (gentle.length > 0) {
    lines.push("MILDLY SENSITIVE (gentle note only):");
    for (const r of gentle) {
      lines.push(`  [${r.system}] — ${r.tendencies[0]} (${r.duration}). ${r.avoidance}`);
    }
  }

  if (background.length > 0 && vulnerable.length === 0) {
    lines.push("BACKGROUND TENDENCIES (mention only if asked, not in main answer):");
    for (const r of background) {
      lines.push(`  [${r.system}] — ${r.tendencies[0]}`);
    }
  }

  if (vulnerable.length === 0 && gentle.length === 0) {
    lines.push("No specific vulnerabilities today — general health looks steady.");
  }

  return lines.join("\n");
}
