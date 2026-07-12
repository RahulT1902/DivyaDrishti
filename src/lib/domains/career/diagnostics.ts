import { AstrologyContext, PlanetName } from "../../core/types";

// Career Diagnostic Layer — maps symbolic patterns to specific career situations.
//
// Analogous to health/diagnostics.ts but for the career domain.
// Instead of "career score: 72", the narrator receives:
//   "This is a Recognition Moment — Jupiter is supporting career visibility.
//    Now is a good time to put your work forward and take on more responsibility."
//
// Situations come from three sources (highest priority first):
//   1. Active yoga activations (most reliable — natal + dasha + strength combined)
//   2. Dasha/antardasha planet character (medium-term background)
//   3. Natal inference rules (long-term constitutional tendencies)

export type CareerSituation =
  | "Recognition Moment"       // Jupiter/Sun influence — visibility, reward
  | "Promotion Window"         // Raj yoga active, leadership indicators
  | "Leadership Opportunity"   // Authority indicators active
  | "Expansion Period"         // Growth, new responsibilities, wider scope
  | "Stability Phase"          // Steady, consistent, no big waves
  | "Building Phase"           // Saturn discipline — slow, methodical, long-term
  | "High Effort Period"       // Extra work, less recognition, discipline needed
  | "Strategic Patience"       // Challenging, best to consolidate and wait
  | "Career Transition Signal" // Indicators of change, new direction
  | "Technical Excellence"     // Mercury/Mars analytical roles shining;

export interface CareerSituationReport {
  situation:       CareerSituation;
  headline:        string;   // "This is a good time to push for recognition"
  detail:          string;   // 1-2 sentences explaining in pundit terms
  actions:         string[]; // 2-3 specific career actions
  timing:          string;   // "runs until [date]", "this month", "next year"
  priority:        "Primary" | "Secondary";
}

// ── Career Situation Evaluator ────────────────────────────────────────────────

export function evaluateCareerSituations(ctx: AstrologyContext): CareerSituationReport[] {
  const reports: CareerSituationReport[] = [];

  const firedInference = new Set(ctx.inferences.map(i => i.id));
  const activeYogas    = ctx.yogaAnalysis.activations.filter(a => a.status !== "Dormant");
  const md             = ctx.dasha?.mahadasha as PlanetName | undefined;
  const ad             = ctx.dasha?.antardasha as PlanetName | undefined;
  const periodEnd      = ctx.dasha?.periodEnd;
  const timingLabel    = periodEnd ? formatDashaEndDate(periodEnd) : "this period";

  // ── Raj Yoga Active → Promotion / Leadership Window ──────────────────────
  const rajYogaActive = activeYogas.some(a =>
    ctx.yogaAnalysis.birthPromises.find(bp => bp.id === a.yogaId)?.category === "Raj",
  );
  if (rajYogaActive) {
    const isStrong = firedInference.has("career-raj-yoga-active");
    reports.push({
      situation: "Promotion Window",
      headline:  "Your chart is signaling a real window for career advancement.",
      detail:    "A powerful combination in your chart that supports authority and recognition is currently active. This is not a permanent state — acting on it during this window increases the chances of it translating into actual growth.",
      actions:   [
        "Put your best work forward — visibility matters right now",
        "Take on additional responsibility if offered, even if it stretches you",
        "Have that conversation about promotion or role expansion — the chart supports it",
      ],
      timing:    `This window runs ${timingLabel}`,
      priority:  isStrong ? "Primary" : "Secondary",
    });
  }

  // ── Sun/10th Lord Strength → Recognition and Authority ───────────────────
  if (firedInference.has("career-sun-10th-authority") || firedInference.has("career-sun-leadership")) {
    reports.push({
      situation: "Recognition Moment",
      headline:  "This is a strong time for career visibility and authority.",
      detail:    "Your chart shows the authority and leadership indicators are well-activated right now. People in positions of influence are more likely to notice your work. This is a good time to be seen and to speak up.",
      actions:   [
        "Take the lead on a project — your natural authority will show",
        "Make your contributions visible, don't let them stay quiet",
        "Good time for presentations, interviews, or leadership conversations",
      ],
      timing:    `Active ${timingLabel}`,
      priority:  "Primary",
    });
  }

  // ── Jupiter in 10th (if yoga carries it) → Expansion ─────────────────────
  if (firedInference.has("career-5th-lord-kendra") || firedInference.has("career-hamsa-yoga")) {
    reports.push({
      situation: "Expansion Period",
      headline:  "There is genuine scope for growth in your career right now.",
      detail:    "The current pattern supports broadening your role, learning new skills, or stepping into a bigger arena. Growth is available — you have to choose it.",
      actions:   [
        "Say yes to new challenges or responsibilities",
        "Good time for learning, certification, or expanding your expertise",
        "Explore options you've been hesitating on — the timing is supportive",
      ],
      timing:    `This period runs ${timingLabel}`,
      priority:  "Secondary",
    });
  }

  // ── Weak 10th Lord → Career Headwinds ────────────────────────────────────
  if (firedInference.has("career-10th-lord-weak")) {
    const isRajYogaCountering = rajYogaActive;
    if (!isRajYogaCountering) {
      reports.push({
        situation: "High Effort Period",
        headline:  "Career progress is possible, but it will require more effort than usual.",
        detail:    "The chart shows that career momentum is not automatic right now. Recognition may come later than expected. This is a period to do excellent work consistently rather than wait for things to happen on their own.",
        actions:   [
          "Focus on quality of work — consistency will matter more than boldness now",
          "Avoid changing jobs impulsively — stability is more valuable than excitement right now",
          "Build skills and relationships that will pay off in the next career cycle",
        ],
        timing:    `This phase continues ${timingLabel}`,
        priority:  "Primary",
      });
    }
  }

  // ── Saturn Dasha/Antardasha → Building Phase ─────────────────────────────
  if (md === "Saturn" || ad === "Saturn") {
    reports.push({
      situation: "Building Phase",
      headline:  `This is a Saturn ${md === "Saturn" ? "main period" : "sub-period"} — slow, disciplined, and long-term oriented.`,
      detail:    "Saturn rewards consistency and penalizes shortcuts. Promotions and recognition may come more slowly than you'd like, but what you build now is durable. Think of this as foundation-laying, not peak performance.",
      actions:   [
        "Prioritize long-term skill building over short-term gains",
        "Reputation for reliability and hard work matters more than flashy results",
        "Stay patient with timelines — results will come, but usually later than expected",
      ],
      timing:    `Saturn period runs ${timingLabel}`,
      priority:  "Primary",
    });
  }

  // ── Jupiter Dasha → Wisdom and Growth ────────────────────────────────────
  if ((md === "Jupiter" || ad === "Jupiter") && !rajYogaActive) {
    reports.push({
      situation: "Expansion Period",
      headline:  `This is a Jupiter ${md === "Jupiter" ? "main period" : "sub-period"} — growth, learning, and wisdom are favored.`,
      detail:    "Jupiter's influence tends to expand whatever it touches. Career growth through knowledge, teaching, advisory roles, or higher education is particularly well-supported now.",
      actions:   [
        "Good time to pursue education, certification, or mentorship opportunities",
        "Roles involving teaching, advising, strategy, or training are especially favorable",
        "Think bigger than usual — Jupiter supports ambition in this period",
      ],
      timing:    `Jupiter period runs ${timingLabel}`,
      priority:  "Secondary",
    });
  }

  // ── Sun Dasha → Authority Period ──────────────────────────────────────────
  if (md === "Sun" || ad === "Sun") {
    if (!reports.some(r => r.situation === "Recognition Moment")) {
      reports.push({
        situation: "Recognition Moment",
        headline:  `Sun ${md === "Sun" ? "main period" : "sub-period"} — authority, visibility, and government connections are active.`,
        detail:    "This is a period when personal brand, reputation, and public presence matter. Work that makes you visibly contribute tends to get noticed now.",
        actions:   [
          "Put yourself forward — don't wait to be discovered",
          "Good period for government-related work, public roles, or leadership positions",
          "Your personal reputation is an asset right now — protect and invest in it",
        ],
        timing:    `Sun period runs ${timingLabel}`,
        priority:  "Secondary",
      });
    }
  }

  // ── Mars Dasha → High Energy, Competition ────────────────────────────────
  if (md === "Mars" || ad === "Mars") {
    reports.push({
      situation: "High Effort Period",
      headline:  `Mars ${md === "Mars" ? "main period" : "sub-period"} — high energy and drive, but watch for friction.`,
      detail:    "Mars periods bring energy, ambition, and competitive drive. They also bring conflict risk with colleagues or authority figures. Channel the energy into output, not arguments.",
      actions:   [
        "Great time for physical, technical, or entrepreneurial work",
        "Be careful of ego conflicts at work — pick your battles wisely",
        "Use the high energy for output, not for fighting the system",
      ],
      timing:    `Mars period runs ${timingLabel}`,
      priority:  "Secondary",
    });
  }

  // ── Rahu Dasha → Unusual Ambition / Foreign Opportunity ──────────────────
  if (md === "Rahu" || ad === "Rahu") {
    reports.push({
      situation: "Career Transition Signal",
      headline:  `Rahu ${md === "Rahu" ? "main period" : "sub-period"} — ambition is high, unusual opportunities may appear.`,
      detail:    "Rahu periods often bring foreign connections, technology-related opportunities, or career moves that break with tradition. There is restlessness and desire for more. It's a good time to experiment, but avoid overextending.",
      actions:   [
        "Be open to unconventional or foreign career opportunities",
        "Technology, media, or cross-border work is especially favored",
        "Ambition is high — make sure it's directed at the right targets",
      ],
      timing:    `Rahu period runs ${timingLabel}`,
      priority:  "Secondary",
    });
  }

  // ── Technical Excellence (Mercury/Mars analytical) ────────────────────────
  if (firedInference.has("career-mars-technical") || firedInference.has("career-mercury-communication")) {
    if (reports.length === 0) {
      reports.push({
        situation: "Technical Excellence",
        headline:  "Your chart shows strong technical and analytical career abilities.",
        detail:    "The chart supports precision, technical skill, and analytical roles. This is a period where careful, expert work will be recognized more than broad gestures.",
        actions:   [
          "Invest in deepening technical expertise in your field",
          "Roles involving analysis, research, writing, or precision are favored",
          "Let your work quality speak — this is not a time for politics, but for excellence",
        ],
        timing:    `This pattern holds ${timingLabel}`,
        priority:  "Secondary",
      });
    }
  }

  // ── Default if nothing specific fires ────────────────────────────────────
  if (reports.length === 0) {
    reports.push({
      situation: "Stability Phase",
      headline:  "Career is in a stable, consistent phase — no major disruptions or breakthroughs indicated.",
      detail:    "This is a good time to consolidate your position, maintain relationships, and prepare for the next active career cycle.",
      actions:   [
        "Keep doing quality work and stay reliable",
        "Build relationships and stay visible without overreaching",
        "Use this stable phase to plan for the next growth cycle",
      ],
      timing:    `This phase continues ${timingLabel}`,
      priority:  "Primary",
    });
  }

  // Return primary first, then secondary
  return [
    ...reports.filter(r => r.priority === "Primary"),
    ...reports.filter(r => r.priority === "Secondary"),
  ].slice(0, 3); // max 3 situations in the narrator prompt
}

// ── Formatting helper ─────────────────────────────────────────────────────────

export function formatCareerSituationsForNarrator(reports: CareerSituationReport[]): string {
  if (reports.length === 0) {
    return "Career looks stable — no major developments indicated in the immediate term.";
  }

  const primary   = reports.filter(r => r.priority === "Primary");
  const secondary = reports.filter(r => r.priority === "Secondary");
  const lines: string[] = [];

  if (primary.length > 0) {
    lines.push("PRIMARY CAREER SITUATION:");
    for (const r of primary) {
      lines.push(`  [${r.situation.toUpperCase()}] ${r.headline}`);
      lines.push(`  ${r.detail}`);
      lines.push(`  Timing: ${r.timing}`);
      lines.push(`  Suggested actions: ${r.actions.slice(0, 2).join(" | ")}`);
    }
  }

  if (secondary.length > 0) {
    lines.push("ADDITIONAL CONTEXT:");
    for (const r of secondary) {
      lines.push(`  [${r.situation}] ${r.headline} (${r.timing})`);
    }
  }

  return lines.join("\n");
}

// ── Timing helper ─────────────────────────────────────────────────────────────

function formatDashaEndDate(periodEnd: string): string {
  try {
    const d = new Date(periodEnd);
    const month = d.toLocaleString("en-IN", { month: "long" });
    const year  = d.getFullYear();
    return `until ${month} ${year}`;
  } catch {
    return "until the current period ends";
  }
}
