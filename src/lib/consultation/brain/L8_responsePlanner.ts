// Pundit Brain — Layer 8: Response Planner + Answer Plan
//
// Two outputs:
//
// 1. ResponsePlan  — controls depth, sections, length
// 2. AnswerPlan    — pure conclusions for the LLM (no chart data)
//
// The AnswerPlan is the contract between the reasoning engine and the LLM.
// It contains only what an astrologer would SAY — not what they calculated.
//
//   directAnswer:          "Health is stable today."
//   confidence:            High (88%)
//   probabilities:         [{ label: "Serious concern", value: 5 }, ...]
//   timeline:              "Next 5–7 days"
//   mainObservation:       "Recovery phase — energy consolidating"
//   unexpectedObservation: "Mental fatigue is more significant than any physical risk"
//   recommendation:        "Maintain your routine. Don't overexert."
//
// Notice: no planets. No houses. No Sun at 65%.
// Those are supporting evidence — they stay inside the engine.

import type {
  IntentAnalysis, AstrologicalDiagnosis, UserState,
  ObservationSet, PunditPersonality, DomainStoryArc,
  ResponsePlan, ResponseDepth, SummaryCard,
  AnswerPlan, ProbabilityItem, ReasoningChain, ConsultationBrief,
} from "./types";
import type { StoredDomainMemory } from "../sessionMemory";

// ── Depth decision ────────────────────────────────────────────────────────────

function selectDepth(intent: IntentAnalysis, userState: UserState): ResponseDepth {
  // Follow-ups still get a real explanation (150–180 words), not a 2-line reply.
  if (intent.isFollowUp || intent.type === "FollowUp") return "daily";

  // Year-level questions → full annual reading
  const tf = intent.timeframe ?? "";
  if (/^202[5-9]$|^203\d$/.test(tf) || /next year|coming year/i.test(tf)) return "year_outlook";

  // Planet / Dasha / Transit / Weekly / monthly / complex questions → full consultation
  if (["PlanetQuestion", "DashaQuestion", "TransitQuestion"].includes(intent.type)) return "consultation";
  if (tf === "this week" || tf === "this month" || tf === "next month") return "consultation";
  if (intent.type === "Decision" || intent.type === "Probability" || intent.type === "Timing") return "consultation";
  if (intent.emotionalTone === "low" || intent.emotionalTone === "worried") return "consultation";
  if (intent.type === "Forecast" && tf === "") return "consultation";

  // Today / tomorrow → focused daily reading
  if (tf === "today" || tf === "tomorrow") return "daily";

  // Open questions ("How's my health?") deserve the full consultation.
  return "consultation";
}

function depthToLength(depth: ResponseDepth, goldStandard = false): string {
  // Gold Standard v1.0 health answers need room for the A–J structure.
  if (goldStandard) {
    switch (depth) {
      case "year_outlook": return "9–11 paragraphs, 550–700 words, following A–J at year scope (dasha and slow transits).";
      case "consultation": return "7–9 paragraphs, 450–600 words, following A–J.";
      default:             return "5–7 paragraphs, 300–400 words, following A–J condensed. Even for today, ground it in at least three natal health factors (Ascendant lord, 6th/8th/12th lords, Moon) before the transits; today's timing comes from the Moon and short-term transits.";
    }
  }
  switch (depth) {
    case "quick":        return "2–3 short paragraphs, ~80–120 words. Answer only the specific sub-question they asked.";
    case "daily":        return "3–4 paragraphs, ~150–180 words. Direct answer + key observation + recommendation + mini summary stats.";
    case "consultation": return "4–6 paragraphs, 300–400 words. Full consultation with Overall Summary at the end.";
    case "year_outlook": return "7–9 paragraphs, 450–550 words. Full annual reading with Domain Summary for [Year] at the end.";
  }
}

// ── Direct answer (the ONE sentence that opens the response) ──────────────────

function buildDirectAnswer(intent: IntentAnalysis, diagnosis: AstrologicalDiagnosis): string {
  const { overallState, probability, timeline, domain } = diagnosis;
  const question = intent.stated.toLowerCase();

  const isProbabilityQ = intent.type === "Probability"
    || /chances?|probability|likelihood|odds|how likely|will (i|it)/i.test(question);
  if (isProbabilityQ) {
    const level = probability >= 70 ? "High" : probability >= 50 ? "Moderate" : "Low";
    return `${level} — I'd put the probability around ${probability}%.`;
  }

  if ((intent.type === "Timing" || /when|by when|how long|timeline/i.test(question)) && timeline) {
    return `The window I'm seeing is ${timeline}.`;
  }

  if (intent.type === "Decision" || /should i|can i|is it (a )?good|right time/i.test(question)) {
    if (overallState === "Highly Favorable" || overallState === "Favorable") return `Yes — the current period supports moving forward on this.`;
    if (overallState === "Difficult")    return `I'd hold off — the timing isn't in your favour right now.`;
    if (overallState === "Challenging")  return `Proceed carefully — there's friction, but not a hard stop.`;
    return `It's a reasonable time to move, but with measured steps.`;
  }

  const map: Record<string, (d: string) => string> = {
    "Highly Favorable": (d) => `Your ${d} looks very strong right now — this is a genuinely good period.`,
    "Favorable":        (d) => `Your ${d} looks positive at the moment.`,
    "Moderate":         (d) => `Your ${d} is in a stable, moderate phase right now.`,
    "Challenging":      (d) => `There's some genuine friction in your ${d} right now.`,
    "Difficult":        (d) => `The ${d} picture is under real pressure right now.`,
  };
  return (map[overallState] ?? map["Moderate"])(domain);
}

// ── Domain-specific probabilities ─────────────────────────────────────────────

function buildDomainProbabilities(domain: string, diagnosis: AstrologicalDiagnosis): ProbabilityItem[] {
  const { overallScore, probability } = diagnosis;

  switch (domain) {
    case "health":
      return [
        { label: "Serious concern",   value: Math.max(5,  Math.min(55, 100 - overallScore)) },
        { label: "Minor sensitivity", value: overallScore < 60 ? 35 : 15 },
        { label: "Recovery pace",     value: Math.min(95, overallScore) },
      ];
    case "career":
      return [
        { label: "Positive outcome",  value: probability },
        { label: "Delay or friction", value: Math.max(10, Math.min(60, 100 - probability - 15)) },
      ];
    case "finance":
      return [
        { label: "Financial gain",   value: overallScore >= 65 ? probability : Math.min(40, probability) },
        { label: "Loss risk",        value: overallScore < 50 ? 30 : 10 },
      ];
    case "relationship":
      return [
        { label: "Harmony improving", value: overallScore >= 50 ? probability : Math.max(20, probability - 20) },
        { label: "Tension easing",    value: overallScore >= 65 ? 75 : 40 },
      ];
    default:
      return [{ label: "Positive direction", value: probability }];
  }
}

// ── Main observation (plain-English summary of life arc + state) ──────────────

function buildMainObservation(
  lifeStory: DomainStoryArc | null,
  diagnosis: AstrologicalDiagnosis,
  domain:    string,
): string {
  if (lifeStory?.currentStage && lifeStory.events.length > 0) {
    const lastEvent = lifeStory.events[lifeStory.events.length - 1];
    return `${lastEvent.event} — now in ${lifeStory.currentStage} phase`;
  }
  if (lifeStory?.currentStage) {
    return `Currently in ${lifeStory.currentStage} phase for ${domain}`;
  }
  const plain: Record<string, string> = {
    "Highly Favorable": `Strong positive period for ${domain}`,
    "Favorable":        `Good period for ${domain}`,
    "Moderate":         `Stable, moderate phase for ${domain}`,
    "Challenging":      `Friction and resistance in ${domain} right now`,
    "Difficult":        `Significant pressure in ${domain}`,
  };
  return plain[diagnosis.overallState] ?? `${domain}: ${diagnosis.overallState}`;
}

// ── Recommendation (what to actually do) ─────────────────────────────────────

function buildRecommendation(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  reasoning: ReasoningChain,
): string {
  const silentAdvice = reasoning.silentQuestions[5];
  if (silentAdvice && silentAdvice.length > 15 && !silentAdvice.startsWith("Stay consistent")) {
    return silentAdvice;
  }

  const map: Record<string, Record<string, string>> = {
    health: {
      "Highly Favorable": "Continue your current routine. Your body is working well — don't interrupt it.",
      "Favorable":        "Maintain your routine and rest adequately.",
      "Moderate":         "Don't overexert. Consistency matters more than new remedies right now.",
      "Challenging":      "Slow down and prioritise recovery. This is not a period to push through fatigue.",
      "Difficult":        "Seek medical attention if symptoms persist. Rest is non-negotiable.",
    },
    career: {
      "Highly Favorable": "Move forward confidently. The timing is genuinely in your favour.",
      "Favorable":        "Keep the momentum. Consistent effort pays off more than big moves.",
      "Moderate":         "Focus on quality over speed. Avoid impulsive decisions.",
      "Challenging":      "Hold your position. The friction is temporary — don't let it push you into reactive choices.",
      "Difficult":        "Don't force outcomes. Use this period to prepare, not execute.",
    },
    finance: {
      "Highly Favorable": "This is a good window for financial decisions you've been considering.",
      "Favorable":        "Proceed with planned decisions, but maintain discipline.",
      "Moderate":         "Smaller, safer moves over large commitments right now.",
      "Challenging":      "Avoid major financial moves. Protect what you have.",
      "Difficult":        "No new commitments. Focus on stability.",
    },
    relationship: {
      "Highly Favorable": "This is a good time for important conversations you've been postponing.",
      "Favorable":        "Small, consistent gestures matter more than grand ones right now.",
      "Moderate":         "Stay patient. Minor misunderstandings are temporary.",
      "Challenging":      "Don't escalate. Give things space and let time work.",
      "Difficult":        "Avoid high-stakes conversations this week. Let things settle first.",
    },
  };

  return map[domain]?.[diagnosis.overallState] ?? "Stay consistent with your current energy.";
}

// ── Severity (how bad is the concern — only for negative states) ──────────────

function buildSeverity(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
): "Minor" | "Moderate" | "Significant" | "Life-changing" | null {
  if (diagnosis.overallState === "Highly Favorable" || diagnosis.overallState === "Favorable") return null;

  if (domain === "health") {
    if (diagnosis.overallState === "Moderate")    return "Minor";
    if (diagnosis.overallState === "Challenging") return "Moderate";
    if (diagnosis.overallState === "Difficult")   return "Significant";
  }
  if (domain === "career" || domain === "finance") {
    if (diagnosis.overallState === "Challenging") return "Minor";
    if (diagnosis.overallState === "Difficult")   return "Moderate";
  }
  if (domain === "relationship") {
    if (diagnosis.overallState === "Challenging") return "Moderate";
    if (diagnosis.overallState === "Difficult")   return "Significant";
  }
  return null;
}

// ── Affected area (specific sub-domain, not just the domain name) ─────────────

function buildAffectedArea(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  intent:    IntentAnalysis,
): string | null {
  const q = intent.stated.toLowerCase();

  if (domain === "health") {
    if (/sleep|rest|tired|fatigue|insomnia/.test(q))     return "Sleep & Energy";
    if (/digest|stomach|gut|acid|bloat/.test(q))          return "Digestive System";
    if (/breath|lung|respirat|cold|cough|flu/.test(q))   return "Respiratory System";
    if (/eye|vision|sight/.test(q))                       return "Eyes";
    if (/skin|rash|allerg/.test(q))                       return "Skin";
    if (/muscle|pain|joint|back/.test(q))                 return "Muscles & Joints";
    if (/immune|immunit/.test(q))                         return "Immunity";
    return diagnosis.overallScore >= 65 ? "Energy & Immunity" : "Energy Levels";
  }
  if (domain === "career") {
    if (/promot|apprais/.test(q))                         return "Promotion";
    if (/salary|increment|raise|pay|hike/.test(q))        return "Salary";
    if (/job.chang|switch|resign|new.job/.test(q))        return "Job Change";
    if (/recogni|appreciat/.test(q))                      return "Recognition";
    if (/leadership|manag|team|direct/.test(q))           return "Leadership";
    if (/learn|train|skill/.test(q))                      return "Learning & Growth";
    return diagnosis.overallScore >= 65 ? "Recognition & Growth" : "Career Momentum";
  }
  if (domain === "finance") {
    if (/invest|market|stock|mutual/.test(q))             return "Investments";
    if (/property|house|real.estate|flat/.test(q))        return "Property";
    if (/save|saving/.test(q))                            return "Savings";
    if (/debt|loan|borrow|emi/.test(q))                   return "Debt Management";
    if (/income|salary|earn/.test(q))                     return "Income";
    return diagnosis.overallScore >= 65 ? "Income & Stability" : "Cash Flow";
  }
  if (domain === "relationship") {
    if (/communicat|talk|discuss|argument/.test(q))       return "Communication";
    if (/trust|honest|lie|cheat/.test(q))                 return "Trust";
    if (/marr|wed|engag/.test(q))                         return "Marriage";
    if (/family|parent|sibling|mother|father/.test(q))    return "Family Dynamics";
    if (/distance|apart|long.dist/.test(q))               return "Distance";
    return diagnosis.overallScore >= 65 ? "Emotional Harmony" : "Communication & Connection";
  }
  return null;
}

// ── Answer Plan (the LLM contract) ────────────────────────────────────────────

export function buildAnswerPlan(
  intent:       IntentAnalysis,
  diagnosis:    AstrologicalDiagnosis,
  lifeStory:    DomainStoryArc | null,
  observations: ObservationSet,
  reasoning:    ReasoningChain,
): AnswerPlan {
  const confidenceMap: Record<string, number> = { high: 88, medium: 65, low: 45 };

  return {
    directAnswer:          buildDirectAnswer(intent, diagnosis),
    confidence:            diagnosis.confidence === "high" ? "High" : diagnosis.confidence === "medium" ? "Medium" : "Low",
    confidencePercent:     confidenceMap[diagnosis.confidence] ?? 65,
    probabilities:         buildDomainProbabilities(intent.domain, diagnosis),
    timeline:              diagnosis.timeline,
    severity:              buildSeverity(intent.domain, diagnosis),
    affectedArea:          buildAffectedArea(intent.domain, diagnosis, intent),
    mainObservation:       buildMainObservation(lifeStory, diagnosis, intent.domain),
    unexpectedObservation: observations.crossDomainInsight ?? observations.proactiveNotes[0] ?? null,
    recommendation:        buildRecommendation(intent.domain, diagnosis, reasoning),
  };
}

// ── Summary card (pre-rendered server-side — LLM never touches this) ──────────
// Plain text only — the mobile app renders this in a special card widget that
// does not parse markdown. The first \n\n-separated paragraph (the header)
// gets a left amber border; the stats paragraph renders as plain middle text.

export function renderSummaryCard(card: SummaryCard): string {
  const filled = "★".repeat(card.ratingOf5);
  const empty  = "☆".repeat(5 - card.ratingOf5);

  const header = `${card.title}  ${filled}${empty}\n${card.phase}`;
  const stats  = card.stats.length
    ? card.stats.map(s => `${s.label}: ${s.value}`).join("\n")
    : "";

  return stats ? `${header}\n\n${stats}` : header;
}

// ── Summary card builder ──────────────────────────────────────────────────────

function buildSummaryCard(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  lifeStory: DomainStoryArc | null,
  intent:    IntentAnalysis,
  consultationBrief?: ConsultationBrief,
): SummaryCard {
  const { overallScore, probability, timeline, challengingFactors } = diagnosis;
  const stars = overallScore >= 80 ? 5 : overallScore >= 65 ? 4 : overallScore >= 50 ? 3 : overallScore >= 35 ? 2 : 1;

  const timeLabel = intent.timeframe === "today" ? " Today"
    : intent.timeframe === "tomorrow" ? " Tomorrow"
    : /week/i.test(intent.timeframe ?? "") ? " This Week"
    : /month/i.test(intent.timeframe ?? "") ? " This Month"
    : intent.timeframe ? ` (${intent.timeframe})` : "";
  const DOMAIN_TITLE: Record<string, string> = {
    spirituality: "Planetary Support",
    education:    "Education",
    business:     "Business",
    family:       "Family",
  };

  let titleBase: string;
  if (intent.type === "TransitQuestion") {
    titleBase = domain === "general" ? "Transit Outlook" : `${domain.charAt(0).toUpperCase() + domain.slice(1)} Transit`;
  } else if (intent.type === "PlanetQuestion") {
    titleBase = domain === "general" ? "Planetary Reading" : `${domain.charAt(0).toUpperCase() + domain.slice(1)} Alignment`;
  } else if (intent.type === "DashaQuestion") {
    titleBase = domain === "general" ? "Dasha Insights" : `${domain.charAt(0).toUpperCase() + domain.slice(1)} Dasha`;
  } else if (domain === "general") {
    titleBase = intent.timeframe === "today" ? "Today's Reading"
       : intent.timeframe === "tomorrow" ? "Tomorrow's Reading"
       : "Daily Reading";
  } else {
    titleBase = DOMAIN_TITLE[domain] ?? (domain.charAt(0).toUpperCase() + domain.slice(1));
  }
  const title = `${titleBase}${timeLabel}`;

  // ── Health: use rich HealthBrief data for meaningful card content ─────────
  if (domain === "health" && consultationBrief?.domainBrief.type === "health") {
    const h         = consultationBrief.domainBrief;
    const primary   = h.rankedSystems?.[0];
    const secondary = h.rankedSystems?.[1];
    // A secondary watch area is shown only if its own likelihood is at least
    // "Low — stay mindful" (>= 40%); otherwise the card would list it as a
    // watch area and call it "Looking clear" on the next line.
    const isSecondaryClose = !!(
      primary && secondary &&
      secondary.score >= primary.score - 12 &&
      secondary.illnessProbability >= 40
    );

    const HEALTH_PHASE: Record<string, string> = {
      "Healthy":             "Stable",
      "Mild Sensitivity":    "Mild Sensitivity",
      "Moderate Concern":    "Needs Attention",
      "Significant Concern": "Significant Concern",
    };
    const phase = HEALTH_PHASE[h.overallStatus] ?? h.overallStatus;

    const stats: SummaryCard["stats"] = [];

    stats.push({
      label: "Good News",
      value: h.goodNews.length > 0 ? h.goodNews[0] : "Overall constitution looks steady",
    });

    // Primary Watch Area: show body parts (specific and human) not the system name
    const primaryBodyLabel = h.bodyParts.length > 0
      ? h.bodyParts.slice(0, 3).join(", ")
      : h.primarySystem;
    stats.push({ label: "Primary Watch Area", value: primaryBodyLabel });

    if (isSecondaryClose && secondary)
      stats.push({ label: "Secondary Watch Area", value: secondary.name });

    // Likelihood → human feeling language, not raw %
    const likelihoodText = (pct: number): string => {
      if (pct >= 70) return "Take it easy — real chance of feeling off";
      if (pct >= 55) return "Possible if not careful";
      if (pct >= 40) return "Low — stay mindful";
      return "Looking clear";
    };
    const shortName = (name: string) => name.split(/[\s&]/)[0].trim();
    // The secondary line uses the secondary system's own probability. It used
    // to be primary × 0.7, which could call a listed watch area "Looking clear".
    const likelihoodVal = isSecondaryClose && secondary
      ? `${shortName(h.primarySystem)}: ${likelihoodText(h.illnessProbability)}  ·  ${shortName(secondary.name)}: ${likelihoodText(secondary.illnessProbability)}`
      : likelihoodText(h.illnessProbability);
    // Gold Standard v1.0 (§7, §8): qualitative evidence strength instead of a
    // likelihood derived from an invented probability, and timing from the
    // dasha period instead of a fixed day count.
    if (h.goldStandard) {
      stats.push({ label: "Evidence Strength", value: h.evidenceStrength ?? "Insufficient" });
    } else {
      stats.push({ label: "Likelihood", value: likelihoodVal });
    }

    if (h.severity) {
      const sevMap: Record<string, string> = {
        Significant: "Worth taking seriously",
        Moderate:    "Mild — be careful",
        Minor:       "Very mild",
      };
      stats.push({ label: "Sensitivity", value: sevMap[h.severity] ?? h.severity });
    }
    if (h.goldStandard) {
      if (h.timing) stats.push({ label: "Timing", value: h.timing });
    } else if (h.timeline) {
      stats.push({ label: "Timeline", value: h.timeline });
    }

    return { title, ratingOf5: stars, phase, stats };
  }

  // ── Career: use rich CareerBrief data when available ─────────────────────
  if (domain === "career" && consultationBrief?.domainBrief.type === "career") {
    const c = consultationBrief.domainBrief;
    const careerPhase = diagnosis.overallState === "Highly Favorable" || diagnosis.overallState === "Favorable"
      ? "Positive Momentum"
      : diagnosis.overallState === "Moderate"
      ? "Steady Phase"
      : "Consolidation Phase";

    const stats: SummaryCard["stats"] = [];
    stats.push({ label: "Primary Focus", value: c.primaryAspect });
    // Direction-based label, not raw %
    const mainAspect = c.aspects.find(a => a.name === c.primaryAspect);
    if (mainAspect) {
      const dirText = mainAspect.direction === "Strong" ? "Well supported"
        : mainAspect.direction === "Building" ? "Building"
        : mainAspect.direction === "Stable" ? "Holding steady"
        : mainAspect.direction === "Weak" ? "Under pressure"
        : "Facing friction";
      stats.push({ label: "Direction", value: dirText });
    }
    // Gold Standard v1.0: qualitative evidence strength, and timing from the dated dasha.
    if (c.goldStandard) {
      stats.push({ label: "Evidence Strength", value: c.evidenceStrength ?? "Insufficient" });
      if (c.goldTiming) stats.push({ label: "Timing", value: c.goldTiming });
    } else if (c.timing) {
      stats.push({ label: "Timing", value: c.timing });
    }
    stats.push({ label: "Risk", value: c.frictionNote ? "Present" : "Low" });
    return { title, ratingOf5: stars, phase: careerPhase, stats };
  }

  // ── Finance (Gold Standard): money flow, source, evidence strength, dated timing ──
  if (domain === "finance" && consultationBrief?.domainBrief.type === "finance" && consultationBrief.domainBrief.goldStandard) {
    const f = consultationBrief.domainBrief;
    const stats: SummaryCard["stats"] = [
      { label: "Money Flow", value: f.primaryFlow },
      { label: "Main Source", value: f.primarySource },
      { label: "Evidence Strength", value: f.evidenceStrength ?? "Insufficient" },
      ...(f.goldTiming ? [{ label: "Timing", value: f.goldTiming }] : []),
      { label: "Risk", value: f.risk ? "Present" : "Low" },
    ];
    return { title, ratingOf5: stars, phase: f.primaryFlow, stats };
  }

  // ── Other domains ─────────────────────────────────────────────────────────
  const rawPhase = lifeStory?.currentStage ?? diagnosis.overallState;
  const FRIENDLY_PHASE: Record<string, string> = {
    "Unknown":      diagnosis.overallState,
    "spirituality": "Planetary Guidance",
    "general":      "Weekly Outlook",
  };
  const phase = FRIENDLY_PHASE[rawPhase] ?? rawPhase;

  const statsMap: Record<string, Array<{ label: string; value: string }>> = {
    health: [
      // Fallback when consultationBrief is unavailable
      { label: "Risk",     value: overallScore >= 65 ? "Low" : overallScore >= 50 ? "Moderate" : "Elevated" },
      { label: "Energy",   value: overallScore >= 70 ? "Good" : overallScore >= 50 ? "Moderate" : "Low" },
      { label: "Sensitivity", value: overallScore >= 65 ? "None" : overallScore >= 50 ? "Mild" : "Worth monitoring" },
      ...(timeline ? [{ label: "Timeline", value: timeline }] : []),
    ],
    career: [
      // Fallback when consultationBrief is unavailable
      { label: "Momentum",  value: overallScore >= 65 ? "Building" : overallScore >= 50 ? "Stable" : "Slow" },
      { label: "Timeline",  value: timeline ?? "Unclear" },
      { label: "Risk",      value: challengingFactors.length > 1 ? "Present" : "Low" },
    ],
    finance: [
      { label: "Direction",   value: diagnosis.overallState === "Challenging" || diagnosis.overallState === "Difficult" ? "Caution" : "Positive" },
      { label: "Risk",        value: overallScore >= 65 ? "Low" : overallScore >= 50 ? "Moderate" : "Elevated" },
      { label: "Opportunity", value: overallScore >= 70 ? "Yes" : overallScore >= 50 ? "Moderate" : "Limited" },
      { label: "Timeline",    value: timeline ?? "Not specific" },
    ],
    relationship: [
      { label: "Harmony",   value: overallScore >= 65 ? "Good" : overallScore >= 50 ? "Mixed" : "Strained" },
      { label: "Tension",   value: challengingFactors.length > 1 ? "Present" : "Low" },
      { label: "Direction", value: lifeStory?.nextChapter ?? "Stable" },
      { label: "Focus",     value: overallScore >= 65 ? "Growth" : "Resolution" },
    ],
  };

  return { title, ratingOf5: stars, phase, stats: statsMap[domain] ?? [] };
}

// ── Section inclusion ─────────────────────────────────────────────────────────

function decideSections(
  intent:    IntentAnalysis,
  diagnosis: AstrologicalDiagnosis,
  depth:     ResponseDepth,
): ResponsePlan["includeSections"] {
  const isQuick        = depth === "quick";
  const highConfidence = diagnosis.confidence !== "low";

  return {
    timeline:             !isQuick && diagnosis.timeline !== null && highConfidence
                          && (intent.type === "Timing" || intent.type === "Forecast" || diagnosis.probability >= 65),
    probability:          intent.type === "Probability" || intent.type === "Decision",
    practicalAdvice:      ["Advice", "Decision", "Timing"].includes(intent.type)
                          || intent.subIntents.some(s => /should|do|action|step/i.test(s)),
    planetaryExplanation: intent.type === "PlanetQuestion",
    spiritualRemedy:      (depth === "consultation" || depth === "year_outlook")
                          && (intent.domain === "health" || intent.domain === "relationship")
                          && diagnosis.overallState !== "Highly Favorable",
    questionBackToUser:   intent.isFollowUp && intent.domain === "general",
    watchingList:         !isQuick && diagnosis.challengingFactors.length > 0,
  };
}

// ── History reference ─────────────────────────────────────────────────────────

function buildHistoryReference(
  lifeStory: DomainStoryArc | null,
  memories:  StoredDomainMemory[],
  domain:    string,
  depth:     ResponseDepth,
): string | null {
  if (depth === "quick") return null;

  if (lifeStory?.events.length) {
    const last = lifeStory.events[lifeStory.events.length - 1];
    return `${last.approximate_date} you mentioned that ${last.event.toLowerCase()}`;
  }

  const mem = memories.find(m => m.domain === domain);
  if (mem?.whySentence) return `Last reading: ${mem.whySentence}`;
  if (mem?.overallLine)  return `From our last session: ${mem.overallLine}`;

  return null;
}

// ── Main exports ──────────────────────────────────────────────────────────────

export function planResponse(
  intent:       IntentAnalysis,
  diagnosis:    AstrologicalDiagnosis,
  userState:    UserState,
  observations: ObservationSet,
  personality:  PunditPersonality,
  lifeStory:    DomainStoryArc | null,
  memories:     StoredDomainMemory[],
  consultationBrief?: ConsultationBrief,
): ResponsePlan {
  const depth            = selectDepth(intent, userState);
  const summaryCard      = buildSummaryCard(intent.domain, diagnosis, lifeStory, intent, consultationBrief);
  const includeSections  = decideSections(intent, diagnosis, depth);
  const referenceHistory = buildHistoryReference(lifeStory, memories, intent.domain, depth);
  const openWithObservation = observations.isOffTopic && depth !== "quick";

  return {
    depth,
    targetLength:     depthToLength(
      depth,
      consultationBrief?.domainBrief.type === "health" && !!consultationBrief.domainBrief.goldStandard,
    ),
    directAnswer:     buildDirectAnswer(intent, diagnosis),
    summaryCard,
    includeSections,
    referenceHistory,
    openWithObservation,
  };
}
