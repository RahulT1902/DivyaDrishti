import {
  AstrologyContext, KnowledgeCompletenessScore,
  CompletenessComponent, CompletenessStatus,
} from "../types";
import { MODEL_CONFIDENCE } from "../strength-engine/strengthWeights";

// KnowledgeCompletenessEngine answers:
//   "How much of the intended reasoning model has been applied to this chart?"
//
// This is DISTINCT from confidence.
//   Confidence: "How strongly do we believe this conclusion?"
//   Completeness: "How many reasoning capabilities contributed to it?"
//
// A conclusion can be high-confidence AND low-completeness — e.g., a strong
// yoga is correctly detected (confidence: 85), but Ashtakavarga, Argala,
// transit, and Kala Bala are all absent (completeness: 43). The conclusion is
// reliable as far as it goes, but significant depth has not been applied.
//
// Scoring formula:
//   overall = Σ (component.weight × multiplier × 100)
//   where multiplier: Full=1.0, Partial=0.5, Missing=0.0

export class KnowledgeCompletenessEngine {
  static compute(ctx: Omit<AstrologyContext, "completeness" | "explainability">): KnowledgeCompletenessScore {
    const components = buildComponents(ctx);

    const overall = Math.round(
      components.reduce((sum, c) => {
        const m = c.status === "Full" ? 1.0 : c.status === "Partial" ? 0.5 : 0.0;
        return sum + c.weight * m * 100;
      }, 0),
    );

    const implementedWeight = components
      .filter(c => c.status === "Full")
      .reduce((sum, c) => sum + c.weight, 0);

    const missingComponents  = components.filter(c => c.status === "Missing").map(c => c.name);
    const partialComponents  = components.filter(c => c.status === "Partial").map(c => c.name);

    return { overall, components, missingComponents, partialComponents, implementedWeight };
  }
}

// ── Component definitions ──────────────────────────────────────────────────────
// Weights must sum to 1.0.
//
// D1 (0.20)  — always Full — the foundation; all core rules fire on it
// D10 (0.12) — Full if D10-specific rules fired; Partial if only chart present
// D9  (0.06) — Partial — chart computed; no dedicated Navamsa rules yet (Phase 5)
// Dasha (0.15) — Full if ctx.dasha provided; Missing otherwise
// Transit (0.10) — Full if ctx.transit provided; Missing otherwise
// Shadbala (0.15) — Partial at MODEL_CONFIDENCE until 100%
// Ashtakavarga (0.08) — Missing (Phase 7)
// Argala (0.05) — Missing (Phase 7)
// Advanced Divisionals (0.09) — Missing (D6/D20/D24/D30/D60 not in ChartSuite)

function buildComponents(ctx: Omit<AstrologyContext, "completeness" | "explainability">): CompletenessComponent[] {
  // D10 is:
  //   Full    — D10-specific rules fired (real D10 data provided + rules activated)
  //   Partial — D10 chart present but no D10 rules activated
  //   Missing — D10 is a Placeholder shell (test harness / no divisional data provided)
  const d10IsPlaceholder = ctx.chartSuite.D10?.metadata.source === "Placeholder";
  const d10RulesFired    = !d10IsPlaceholder && ctx.inferences.some(i => i.reasonCodes.some(rc => rc.startsWith("D10_")));
  const d10Status: CompletenessStatus = d10IsPlaceholder ? "Missing" : (d10RulesFired ? "Full" : "Partial");
  const d10Note = d10IsPlaceholder
    ? "D10 not provided — D10 rules skipped; completeness reduced"
    : d10RulesFired
      ? "D10 chart computed; D10-specific career inference rules fired"
      : "D10 chart computed; no D10 inference rules activated for this chart";

  const dashaStatus: CompletenessStatus = ctx.dasha ? "Full" : "Missing";
  const dashaNote = ctx.dasha
    ? `Maha/antardasha active — 5-component activation model applied`
    : "Not provided — dasha contribution is 0; activation scores use natal-only weights";

  const hasTransit = Array.isArray(ctx.transit) && ctx.transit.length > 0;
  const transitStatus: CompletenessStatus = hasTransit ? "Full" : "Missing";
  const transitNote = hasTransit
    ? `Transit evidence active — ${ctx.transit!.length} rule(s) fired`
    : "Not provided — transit component defaulted to neutral (50) in activation scores";

  const shabdalaStatus: CompletenessStatus = MODEL_CONFIDENCE >= 100 ? "Full" : "Partial";
  const missingBalaNames = MODEL_CONFIDENCE >= 100
    ? "All 10 components implemented"
    : "Kala Bala (4%), Cheshta Bala (2%), Drik Bala (1%), Avastha (1%)";

  return [
    {
      name:   "D1 Birth Chart",
      status: "Full",
      weight: 0.20,
      note:   "Full natal chart analysis — all core inference rules applied",
    },
    {
      name:   "D10 Dashamsa (Career Chart)",
      status: d10Status,
      weight: 0.12,
      note:   d10Note,
    },
    {
      name:   "D9 Navamsa (Soul Chart)",
      status: "Partial",
      weight: 0.06,
      note:   "Chart computed; D9 rules active in Marriage domain (v1.2) — full dedicated D9 ruleset planned Phase 5",
    },
    {
      name:   "Dasha Timing",
      status: dashaStatus,
      weight: 0.15,
      note:   dashaNote,
    },
    {
      name:   "Transit Timing",
      status: transitStatus,
      weight: 0.10,
      note:   transitNote,
    },
    {
      name:   "Shadbala (Planetary Strength)",
      status: shabdalaStatus,
      weight: 0.15,
      note:   MODEL_CONFIDENCE >= 100
        ? "All 10 Shadbala components implemented (v1.1)"
        : `${MODEL_CONFIDENCE}% implemented — missing: ${missingBalaNames}`,
    },
    {
      name:   "Ashtakavarga",
      status: "Partial",
      weight: 0.08,
      note:   "Binna + Sarva computation implemented in SymbolRegistry (v1.2); 6 bindhu-based rules active — full transit overlay planned Phase 7",
    },
    {
      name:   "Argala (Planetary Intervention)",
      status: "Missing",
      weight: 0.05,
      note:   "Argala analysis not yet implemented — planned Phase 7",
    },
    {
      name:   "Advanced Divisionals (D6/D20/D24/D30/D60)",
      status: "Missing",
      weight: 0.09,
      note:   "Not in ChartSuite yet — D6 Health, D20 Spirituality, D24 Education, D30 Suffering, D60 Karma (Phase 5)",
    },
  ];
}
