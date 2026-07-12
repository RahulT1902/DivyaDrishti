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

  return reports;
}

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
