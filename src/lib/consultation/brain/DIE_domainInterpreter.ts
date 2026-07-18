// Domain Interpretation Engine (DIE)
//
// The principle: The engine thinks; the LLM speaks.
//
// This layer converts chart-specific computed data into a structured
// ConsultationBrief — domain-specific conclusions with body parts, symptoms,
// career aspects, financial areas, or relationship dynamics — before the LLM
// is invoked. The LLM receives a diagnosis, not raw calculations.
//
// Flow: BodyRiskProfile + NatalPromise + Manifestations
//         → ConsultationBrief (HealthBrief | CareerBrief | FinanceBrief | RelationshipBrief)
//         → renderConsultationBrief() → system prompt block
//         → LLM narrates

import type {
  AstrologicalDiagnosis, IntentAnalysis,
  ConsultationBrief, HealthBrief, CareerBrief, CareerAspect, FinanceBrief, FinanceArea, RelationshipBrief,
} from "./types";
import type { BodyRiskProfile } from "../../intelligence/health/bodyRiskProfile";
import type { HealthFindings } from "../../intelligence/health/healthFindingsEngine";
import type { PromiseResult, DomainActivation } from "../../intelligence/lifeInsights/services";

// ── Chart-specific data bundle (passed from route.ts into the brain) ──────────

export interface ChartData {
  bodyRiskProfile?:  BodyRiskProfile | null;
  healthFindings?:   HealthFindings | null;
  natalPromise?:     PromiseResult | null;
  domainActivation?: DomainActivation | null;
  manifestations?:   Array<{ title: string; probability: number }> | null;
}

// ── Body parts per health system ──────────────────────────────────────────────
// Maps internal system keys to the human-readable parts the LLM will mention.

const BODY_PARTS: Record<string, string[]> = {
  respiratorySystem:       ["throat", "nasal passages", "upper airways"],
  throat:                  ["throat", "vocal cords", "ear canals", "nasal cavity"],
  coldViralSusceptibility: ["throat", "sinuses", "nasal passages"],
  head:                    ["head", "temples", "forehead"],
  joints:                  ["knees", "hips", "shoulders", "fingers"],
  back:                    ["lower back", "spine", "lumbar region"],
  heart:                   ["chest", "heart area"],
  stomach:                 ["stomach", "upper abdomen"],
  digestiveSystem:         ["intestines", "gut", "lower abdomen"],
  nervousSystem:           ["brain activity", "nerve pathways"],
  skinHealth:              ["skin surface", "face", "scalp"],
  kidneys:                 ["kidney region", "lower back"],
  liver:                   ["liver", "right abdomen"],
  allergySensitivity:      ["nasal passages", "skin", "eyes"],
  inflammation:            ["muscles", "joints", "affected tissues"],
  // Functional systems — affects stamina/immunity/mental state, not specific organs
  energyStamina:           ["overall stamina", "physical endurance", "adrenal response"],
  immuneSystem:            ["immune response", "lymphatic system", "resistance to illness"],
  mentalWellness:          ["mental clarity", "emotional regulation", "stress response"],
  sleep:                   ["sleep cycle", "rest quality", "overnight recovery"],
  recovery:                ["physical recovery", "cellular repair", "post-exertion bounce-back"],
};

// ── Remedy lookup tables ──────────────────────────────────────────────────────
// Pre-computed remedies keyed by system / domain state.
// 2 remedies per key: [practical, astrological]. Pick both or just [1].

const HEALTH_REMEDIES: Record<string, [string, string]> = {
  respiratorySystem:       ["Drink warm turmeric milk tonight and avoid cold water", "Chant Mahamrityunjaya mantra 11 times — it specifically supports immunity and respiratory health"],
  coldViralSusceptibility: ["Gargle with warm salt water morning and evening, drink ginger-tulsi tea", "Chant Om Chandraya Namah 11 times tonight — the Moon governs cold and viral sensitivity"],
  throat:                  ["Gargle with warm salt water, avoid cold drinks completely today", "Chant Om Saraswatyai Namah 11 times — Saraswati governs the throat and speech"],
  head:                    ["Apply warm sesame oil to the scalp before sleeping tonight", "Offer water to the Sun at sunrise tomorrow morning (Surya Arghya) — it strengthens the head and vitality"],
  joints:                  ["Apply warm sesame oil to the affected joints before sleeping", "Donate sesame seeds on Saturday — Saturn governs the joints and bones"],
  back:                    ["Apply warm sesame oil to the lower back, avoid lifting anything heavy today", "Chant Om Namah Shivaya 108 times — Shiva's energy supports spinal strength"],
  heart:                   ["Eat light today — no heavy, oily, or fried food. Avoid emotional stress", "Chant Om Hreem Suryaya Namah at sunrise — the Sun governs the heart"],
  digestiveSystem:         ["Eat warm, light meals only. Avoid raw, cold, or processed food today", "Chant Om Gam Ganapataye Namah before meals — Ganesha governs the digestive system"],
  stomach:                 ["Eat small, warm meals. Drink warm water with a pinch of rock salt", "Chant Om Namah Shivaya after meals — it calms the digestive fire"],
  energyStamina:           ["Avoid heavy, oily meals today — prefer khichdi or sattvic food", "Offer water to the Sun at sunrise (Surya Arghya) — the Sun directly governs stamina and vitality"],
  immuneSystem:            ["Take amla or a vitamin C source today. Avoid overexertion — rest supports immunity", "Chant Mahamrityunjaya mantra 11 times — it is specifically linked to immune protection in Vedic tradition"],
  mentalWellness:          ["Sit in moonlight or a calm outdoor space for 10 minutes this evening", "Chant Om Chandraya Namah 11 times before bed — the Moon governs the mind and emotional body"],
  nervousSystem:           ["Avoid screens 1 hour before sleeping. Apply warm oil to the soles of your feet", "Chant Om Shanti three times before sleeping — it directly calms the nervous system"],
  sleep:                   ["Apply warm ghee or sesame oil to the feet before sleeping. No screens after 9 pm", "Chant Om Shanti three times before lying down — it settles the nervous system for rest"],
  recovery:                ["Rest — don't push through fatigue today. Drink warm water with raw honey", "Light a sesame oil lamp in the evening — it invites Saturn's energy of patience and recovery"],
  skinHealth:              ["Apply coconut or neem oil to the skin. Avoid synthetic products and harsh chemicals today", "Chant Om Shukraya Namah on Friday — Venus governs skin, beauty, and sensitivity"],
  kidneys:                 ["Drink at least 8 glasses of water today. Avoid excessive salt", "Chant Om Namah Shivaya 11 times — Shiva governs the water element and kidney function"],
  liver:                   ["Avoid alcohol, heavy food, and fried items completely today. Drink warm lemon water", "Chant Om Gurave Namah on Thursday — Jupiter governs the liver"],
  allergySensitivity:      ["Avoid known allergens — dust, pollen, strong perfumes. Wear cotton today", "Chant Om Chandraya Namah — the Moon governs sensitivities, allergies, and fluid-related reactions"],
  inflammation:            ["Apply warm sesame oil to inflamed areas. Avoid sour, spicy, and fermented food", "Drink turmeric milk (golden milk) tonight — turmeric is directly referenced in Ayurveda for reducing Mars-related inflammation"],
};

const CAREER_REMEDIES: Record<string, [string, string]> = {
  "Building favorably": ["Prepare well and be visible in key meetings this week", "Offer green grass to a cow on Wednesday — Mercury governs career recognition and communication"],
  "Stable":             ["Stay consistent with your work — this is a period for laying groundwork", "Chant Om Gam Ganapataye Namah before important meetings — Ganesha removes career obstacles"],
  "Under pressure":     ["Focus on completing existing commitments, not starting new ones", "Light a sesame oil lamp on Saturday evening and chant Om Shanaischaraya Namah — Saturn governs career stability"],
};

const FINANCE_REMEDIES: Record<string, [string, string]> = {
  "Growing":          ["This is a reasonable time for planned financial decisions you've been considering", "Keep a copper coin in your wallet and offer yellow flowers to Lakshmi on Friday evening"],
  "Stable":           ["Prefer smaller, safer moves over large financial commitments for now", "Light a ghee lamp on Friday evening — Lakshmi Puja on Fridays strengthens financial stability"],
  "Under Pressure":   ["Avoid new financial commitments this week. Focus on protecting existing assets", "Chant Om Shreem Mahalakshmyai Namah 108 times on Friday — this invites financial relief"],
  "Volatile":         ["Avoid speculation, loans, or risky investments until the period stabilises", "Feed crows or dogs on Saturday morning — this appeases Saturn, who governs financial pressure"],
};

const RELATIONSHIP_REMEDIES: Record<string, [string, string]> = {
  "Low":              ["Small, consistent gestures matter more than grand ones right now", "Offer white flowers to your home deity on Friday — Venus governs relationship harmony"],
  "Mild":             ["Plan a gentle, unhurried conversation — not during rushed moments", "Light a rose or jasmine incense stick at home each evening — it invites Venus's calming energy"],
  "Moderate":         ["Avoid escalating conversations this week. Give space, then reconnect", "Chant Om Shukraya Namah 11 times on Friday — Venus directly governs relationships and emotional harmony"],
  "High":             ["Avoid confrontational conversations on no-moon days. Give this time to settle", "Chant Om Shukraya Namah 108 times on Friday and offer white sweets to a cow — it calms Venus-Mars tension"],
};

function computeRemedies(domain: string, brief: ConsultationBrief["domainBrief"]): string[] {
  if (brief.type === "health") {
    const entry = HEALTH_REMEDIES[brief.primarySystemKey];
    return entry ?? ["Drink warm water throughout the day", "Chant Mahamrityunjaya mantra 11 times for overall health protection"];
  }
  if (brief.type === "career") {
    const key = Object.keys(CAREER_REMEDIES).find(k =>
      brief.overallProbability >= 65 ? k === "Building favorably"
      : brief.overallProbability >= 45 ? k === "Stable"
      : k === "Under pressure"
    ) ?? "Stable";
    return CAREER_REMEDIES[key] ?? CAREER_REMEDIES["Stable"];
  }
  if (brief.type === "finance") {
    const entry = FINANCE_REMEDIES[brief.primaryFlow];
    return entry ?? FINANCE_REMEDIES["Stable"];
  }
  if (brief.type === "relationship") {
    const entry = RELATIONSHIP_REMEDIES[brief.conflictRisk];
    return entry ?? RELATIONSHIP_REMEDIES["Mild"];
  }
  return ["Chant Om Namah Shivaya 11 times this evening for overall protection"];
}

// Display names for the "stable today" column
const STRONG_DISPLAY: Record<string, string> = {
  digestiveSystem:  "Digestion",
  heart:            "Cardiovascular",
  immuneSystem:     "Immunity",
  energyStamina:    "Energy levels",
  sleep:            "Sleep quality",
  recovery:         "Physical recovery",
  back:             "Back & Spine",
  joints:           "Joints",
  nervousSystem:    "Mental clarity",
  kidneys:          "Fluid balance",
};

// ── Health interpreter ────────────────────────────────────────────────────────

function interpretHealth(
  diagnosis: AstrologicalDiagnosis,
  profile:   BodyRiskProfile | null,
  findings:  HealthFindings | null,
): HealthBrief {
  if (!findings || !profile) {
    const s = diagnosis.overallState;
    return {
      type: "health",
      overallStatus:
        s === "Difficult"   ? "Significant Concern"
        : s === "Challenging" ? "Moderate Concern"
        : s === "Moderate"    ? "Mild Sensitivity"
        : "Healthy",
      primarySystem:      "General vitality",
      primarySystemKey:   "immuneSystem",
      bodyParts:          [],
      symptoms:           [],
      strongAreas:        [],
      illnessProbability: Math.max(5, Math.min(45, 100 - diagnosis.overallScore)),
      severity:
        s === "Difficult"   ? "Significant"
        : s === "Challenging" ? "Moderate"
        : s === "Moderate"    ? "Minor"
        : null,
      seriousRisk: diagnosis.overallScore >= 65 ? "Very unlikely" : "Unlikely",
      timeline:    diagnosis.timeline,
      energyNote:  "Energy looks moderate for the day.",
      mentalNote:  null,
    };
  }

  const primaryScore = findings.primaryFocus.score;

  const overallStatus: HealthBrief["overallStatus"] =
    primaryScore < 52 ? "Healthy"
    : primaryScore < 65 ? "Mild Sensitivity"
    : primaryScore < 78 ? "Moderate Concern"
    : "Significant Concern";

  // Body parts: primary + secondary systems
  const primaryParts   = BODY_PARTS[findings.primaryFocus.system]   ?? [];
  const secondaryParts = findings.secondaryFocus
    ? BODY_PARTS[findings.secondaryFocus.system] ?? []
    : [];
  const bodyParts = [...new Set([...primaryParts, ...secondaryParts])].slice(0, 5);

  // Illness probability — functional states (energy, sleep, mental) have lower illness risk
  const isFunctional = ["energyStamina", "mentalWellness", "sleep", "recovery"].includes(findings.primaryFocus.system);
  let illnessProbability: number;
  if (isFunctional) {
    illnessProbability = Math.max(5, Math.round((primaryScore - 25) * 0.35));
  } else {
    if (primaryScore < 52) illnessProbability = 10;
    else if (primaryScore < 65) illnessProbability = 10 + Math.round((primaryScore - 52) * 2);
    else if (primaryScore < 78) illnessProbability = 36 + Math.round((primaryScore - 65) * 2.5);
    else illnessProbability = Math.min(75, 68 + Math.round((primaryScore - 78) * 0.8));
  }

  const severity: HealthBrief["severity"] =
    primaryScore < 52 ? null
    : primaryScore < 65 ? "Minor"
    : primaryScore < 78 ? "Moderate"
    : "Significant";

  const seriousRisk: HealthBrief["seriousRisk"] =
    primaryScore >= 78 ? "Possible"
    : primaryScore >= 65 ? "Unlikely"
    : "Very unlikely";

  const timeline: string | null =
    primaryScore < 52 ? null
    : primaryScore < 65 ? "3–5 days if anything develops"
    : primaryScore < 78 ? "5–7 days, possibly longer"
    : "this week";

  // Strong areas: low-score systems not currently activated
  const activeSet  = new Set(findings.activeSystems);
  const strongAreas = Object.entries(STRONG_DISPLAY)
    .filter(([sys]) => !activeSet.has(sys) && (profile[sys as keyof BodyRiskProfile] ?? 0) < 45)
    .slice(0, 3)
    .map(([, name]) => name);

  // Mental note — when stress/energy is as activated as physical systems
  const mentalScore = Math.max(profile.mentalWellness, profile.energyStamina);
  const mentalNote  = (mentalScore >= primaryScore - 5 || isFunctional)
    ? "Mental fatigue and stress are a greater risk today than physical illness."
    : null;

  return {
    type: "health",
    overallStatus,
    primarySystem:    findings.primaryFocus.displayName,
    primarySystemKey: findings.primaryFocus.system,
    bodyParts,
    symptoms:         findings.symptoms,
    strongAreas,
    illnessProbability,
    severity,
    seriousRisk,
    timeline,
    energyNote: findings.energyArc,
    mentalNote,
  };
}

// ── Career interpreter ────────────────────────────────────────────────────────

const MANIFEST_TO_ASPECT: Record<string, string> = {
  "Professional Promotion":   "Promotion",
  "New Job / Role Pivot":     "Job Change",
  "Leadership Opportunities": "Leadership",
  "Public Recognition":       "Recognition",
  "Career Re-stabilization":  "Stability",
  "Salary Increase":          "Salary",
  "Professional Visibility":  "Visibility",
};

function interpretCareer(
  diagnosis:    AstrologicalDiagnosis,
  intent:       IntentAnalysis,
  promise:      PromiseResult | null,
  activation:   DomainActivation | null,
  manifestations: Array<{ title: string; probability: number }> | null,
): CareerBrief {
  const q               = intent.stated.toLowerCase();
  const activationScore = activation?.score ?? diagnosis.overallScore;
  const promiseScore    = promise?.potential ?? diagnosis.overallScore;
  const overallProbability = Math.min(95, Math.round(activationScore * 0.55 + promiseScore * 0.45));

  // Build aspects from manifestations (already probability-ranked by the engine)
  const aspects: CareerAspect[] = (manifestations ?? []).slice(0, 6).map(m => {
    const name = MANIFEST_TO_ASPECT[m.title]
      ?? m.title.replace(/^(Professional |Career |New )/, "");
    const direction: CareerAspect["direction"] =
      m.probability >= 75 ? "Strong"
      : m.probability >= 60 ? "Building"
      : m.probability >= 45 ? "Stable"
      : m.probability >= 30 ? "Weak"
      : "Blocked";
    return { name, direction, probability: m.probability };
  });

  // Fallback aspects when no manifestations provided
  if (aspects.length === 0) {
    const b = overallProbability;
    aspects.push(
      { name: "Recognition", direction: b >= 70 ? "Building" : "Stable", probability: Math.round(b * 0.95) },
      { name: "Promotion",   direction: b >= 75 ? "Building" : "Stable", probability: Math.round(b * 0.90) },
      { name: "Leadership",  direction: b >= 80 ? "Strong"   : "Stable", probability: Math.round(b * 0.80) },
      { name: "Salary",      direction: "Stable",                         probability: Math.round(b * 0.65) },
      { name: "Job Change",  direction: "Stable",                         probability: Math.round(b * 0.35) },
    );
  }

  // Primary aspect from question context
  let primaryAspect = aspects[0]?.name ?? "Career Growth";
  if (/promot|apprais/.test(q))                        primaryAspect = "Promotion";
  else if (/salary|increment|raise|pay|hike/.test(q))  primaryAspect = "Salary";
  else if (/job.chang|switch|resign/.test(q))          primaryAspect = "Job Change";
  else if (/leadership|manag|team|director/.test(q))   primaryAspect = "Leadership";
  else if (/recogni|appreciat/.test(q))                primaryAspect = "Recognition";

  const opportunityNote = promise?.interpretation
    ?? (activationScore >= 70
      ? "Recognition is building — position strengthens before salary catches up"
      : "Professional phase is stable — consolidation more likely than rapid growth");

  const frictionNote = promise?.weakening[0]
    ? "Approval or organizational processes may introduce slight delay"
    : null;

  const timing = diagnosis.timeline ?? (activationScore >= 70 ? "next 2–4 weeks" : null);

  return {
    type: "career",
    primaryAspect,
    aspects,
    opportunityNote,
    frictionNote,
    timing,
    overallProbability,
  };
}

// ── Finance interpreter ───────────────────────────────────────────────────────

function interpretFinance(
  diagnosis:  AstrologicalDiagnosis,
  activation: DomainActivation | null,
): FinanceBrief {
  const s     = diagnosis.overallState;
  const score = activation?.score ?? diagnosis.overallScore;

  const areas: FinanceArea[] = [
    {
      name:   "Income",
      status: score >= 70 ? "Strong" : score >= 55 ? "Stable" : score >= 40 ? "Cautious" : "Risky",
    },
    {
      name:   "Savings",
      status: s === "Difficult" ? "Risky" : s === "Challenging" ? "Cautious" : "Stable",
    },
    {
      name:   "Cash Flow",
      status: (s === "Highly Favorable" || s === "Favorable") ? "Strong"
        : s === "Moderate" ? "Stable" : "Cautious",
    },
    {
      name:   "Investments",
      status: score >= 75 ? "Stable" : score >= 55 ? "Cautious" : "Risky",
    },
    {
      name:   "Unexpected Expenses",
      status: diagnosis.challengingFactors.length > 1 ? "Cautious" : "Stable",
    },
  ];

  const primaryFlow: FinanceBrief["primaryFlow"] =
    (s === "Highly Favorable" || s === "Favorable") ? "Growing"
    : s === "Moderate" ? "Stable"
    : s === "Challenging" ? "Under Pressure"
    : "Volatile";

  const opportunity =
    (s === "Highly Favorable" || s === "Favorable")
      ? "Financial stability improving — reasonable window for planned decisions"
      : s === "Moderate"
      ? "Gradual strengthening through income rather than windfall"
      : null;

  const risk =
    s === "Difficult"   ? "Risk of unexpected outflows — avoid major commitments"
    : s === "Challenging" ? "Conservative approach recommended — hold major investments"
    : null;

  return {
    type: "finance",
    areas,
    primaryFlow,
    primarySource: "Career income and professional stability",
    opportunity,
    risk,
  };
}

// ── Relationship interpreter ──────────────────────────────────────────────────

function interpretRelationship(diagnosis: AstrologicalDiagnosis): RelationshipBrief {
  const s = diagnosis.overallState;

  const STRONG: Record<string, string[]> = {
    "Highly Favorable": ["Emotional harmony", "Mutual support", "Long-term commitment", "Family stability"],
    "Favorable":        ["Emotional support", "Long-term commitment", "Family stability"],
    "Moderate":         ["Long-term foundation", "Mutual commitment"],
    "Challenging":      ["Long-term commitment"],
    "Difficult":        [],
  };
  const ATTENTION: Record<string, string[]> = {
    "Highly Favorable": [],
    "Favorable":        ["Communication", "Quality time"],
    "Moderate":         ["Communication", "Time together", "Patience during stress"],
    "Challenging":      ["Communication", "Patience", "Avoiding escalation"],
    "Difficult":        ["Avoiding confrontation", "Giving space", "Professional support"],
  };
  const DYNAMICS: Record<string, string> = {
    "Highly Favorable": "Strong harmony — connection deepening naturally",
    "Favorable":        "Stable foundation with room to strengthen",
    "Moderate":         "Communication gaps creating small misunderstandings",
    "Challenging":      "Tension building from unspoken issues",
    "Difficult":        "Significant strain requiring intentional management",
  };
  const CONFLICT: Record<string, RelationshipBrief["conflictRisk"]> = {
    "Highly Favorable": "Low",
    "Favorable":        "Low",
    "Moderate":         "Mild",
    "Challenging":      "Moderate",
    "Difficult":        "High",
  };

  return {
    type:           "relationship",
    strongAreas:    STRONG[s]   ?? [],
    attentionAreas: ATTENTION[s] ?? [],
    conflictRisk:   CONFLICT[s] ?? "Mild",
    primaryDynamic: DYNAMICS[s] ?? "Stable relationship phase",
  };
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildConsultationBrief(
  domain:    string,
  diagnosis: AstrologicalDiagnosis,
  intent:    IntentAnalysis,
  chartData: ChartData,
): ConsultationBrief {
  let domainBrief:           ConsultationBrief["domainBrief"];
  let overallVerdict:        string;
  let mainConclusion:        string;
  let unexpectedObservation: string | null = null;
  let recommendation:        string;

  switch (domain) {
    case "health": {
      const h = interpretHealth(diagnosis, chartData.bodyRiskProfile ?? null, chartData.healthFindings ?? null);
      domainBrief    = h;
      overallVerdict = h.overallStatus;

      mainConclusion =
        h.overallStatus === "Healthy"
          ? "Your health looks stable today — I don't see any indication of serious illness developing."
          : h.overallStatus === "Mild Sensitivity"
          ? `Your health is generally good, but the ${h.primarySystem.toLowerCase()} shows some mild sensitivity worth noting.`
          : `There is ${h.overallStatus === "Moderate Concern" ? "a moderate concern" : "a significant concern"} in the ${h.primarySystem.toLowerCase()} right now.`;

      unexpectedObservation = h.mentalNote;

      recommendation =
        h.overallStatus === "Healthy"        ? "Maintain your current routine. Stay hydrated. No reason to change what's working."
        : h.severity === "Minor"             ? "Stay hydrated, avoid overexertion, and maintain your routine."
        : h.severity === "Moderate"          ? "Slow down. Prioritise rest. Don't push through fatigue."
        : "Seek medical attention if symptoms persist. Rest is non-negotiable.";
      break;
    }

    case "career": {
      const c = interpretCareer(diagnosis, intent, chartData.natalPromise ?? null, chartData.domainActivation ?? null, chartData.manifestations ?? null);
      domainBrief    = c;
      overallVerdict = diagnosis.overallState === "Highly Favorable" || diagnosis.overallState === "Favorable"
        ? "Building favorably" : diagnosis.overallState === "Moderate" ? "Stable" : "Under pressure";

      const pa = c.aspects.find(a => a.name === c.primaryAspect);
      mainConclusion = pa
        ? `${c.primaryAspect} probability is around ${pa.probability}% — the chart ${pa.direction === "Strong" ? "strongly supports" : pa.direction === "Building" ? "is building toward" : "shows steady support for"} this.`
        : `Your career direction looks ${overallVerdict.toLowerCase()}.`;

      unexpectedObservation =
        c.opportunityNote.includes("recognition") || c.opportunityNote.includes("designation")
          ? "Designation or responsibility changes often come before salary improvements in this kind of period."
          : null;

      recommendation = c.frictionNote
        ? "Demonstrate ownership. Avoid pushing management repeatedly. Let your recent work speak for itself."
        : "Keep consistent effort. The timing is building in your favour — don't force outcomes.";
      break;
    }

    case "finance": {
      const f = interpretFinance(diagnosis, chartData.domainActivation ?? null);
      domainBrief    = f;
      overallVerdict = f.primaryFlow;

      mainConclusion = f.risk
        ? `Financial caution is warranted right now — ${f.risk.toLowerCase()}.`
        : `Your financial position looks ${f.primaryFlow.toLowerCase()} this period.`;

      unexpectedObservation =
        "Improvements are more likely to come through career income and professional recognition than through speculation or unexpected gains.";

      recommendation = f.risk
        ? "Avoid major financial commitments. Focus on stability and protecting what you have."
        : f.primaryFlow === "Growing"
        ? "This is a reasonable time for planned financial decisions you've been considering."
        : "Smaller, safer moves over large commitments for now.";
      break;
    }

    case "relationship": {
      const r = interpretRelationship(diagnosis);
      domainBrief    = r;
      overallVerdict =
        r.conflictRisk === "High"     ? "Under significant strain"
        : r.conflictRisk === "Moderate" ? "Needs attention"
        : r.strongAreas.length > 0     ? "Stable with strong foundation"
        : "Stable";

      mainConclusion =
        r.conflictRisk === "Low" || r.conflictRisk === "Mild"
          ? `Your relationship looks stable overall — ${r.primaryDynamic.toLowerCase()}.`
          : `There is genuine ${r.conflictRisk.toLowerCase()} tension right now — ${r.primaryDynamic.toLowerCase()}.`;

      unexpectedObservation =
        r.attentionAreas.includes("Communication")
          ? "This isn't a relationship that needs fixing — it needs more intentional communication."
          : null;

      recommendation =
        r.conflictRisk === "High"     ? "Avoid high-stakes conversations this week. Give things space to settle."
        : r.conflictRisk === "Moderate" ? "Don't escalate. Small, patient gestures work better than big conversations right now."
        : "Small, consistent gestures matter more than grand ones during this phase.";
      break;
    }

    default: {
      const r = interpretRelationship(diagnosis);
      domainBrief            = r;
      overallVerdict         = diagnosis.overallState;
      mainConclusion         = `The ${domain} picture looks ${diagnosis.overallState.toLowerCase()} right now.`;
      unexpectedObservation  = null;
      recommendation         = "Stay consistent with your current approach.";
    }
  }

  const remedies = computeRemedies(domain, domainBrief);

  return {
    domain,
    overallVerdict,
    mainConclusion,
    unexpectedObservation,
    recommendation,
    remedies,
    domainBrief,
  };
}

// ── System prompt renderer ────────────────────────────────────────────────────
// Converts ConsultationBrief into the diagnosis block the LLM narrates from.
// Every fact here was computed by the engine — the LLM cannot invent beyond it.

export function renderConsultationBrief(brief: ConsultationBrief, question: string): string {
  const { domainBrief: db } = brief;
  const lines: string[] = [
    `━━━ DIAGNOSIS (engine-computed — DO NOT invent numbers beyond what is listed here) ━━━`,
    `QUESTION: "${question}"`,
    `OVERALL: ${brief.overallVerdict}`,
  ];

  if (db.type === "health") {
    lines.push(`PRIMARY AREA: ${db.primarySystem}`);
    if (db.bodyParts.length > 0)
      lines.push(`SPECIFIC AREA: ${db.bodyParts.join("  ·  ")}`);
    if (db.symptoms.length > 0) {
      lines.push(`IF ANYTHING DEVELOPS, EXPECT:`);
      db.symptoms.forEach(s => lines.push(`  • ${s}`));
    }
    if (db.strongAreas.length > 0)
      lines.push(`STABLE TODAY: ${db.strongAreas.join("  ·  ")}`);
    lines.push(`ILLNESS PROBABILITY: ${db.illnessProbability}%  ← USE THIS EXACT NUMBER, NO OTHERS`);
    if (db.severity)
      lines.push(`SEVERITY: ${db.severity} — temporary if anything develops`);
    lines.push(`SERIOUS ILLNESS RISK: ${db.seriousRisk}  ← DO NOT CONTRADICT THIS`);
    lines.push(`TIMELINE: ${db.timeline ?? "No illness expected — nothing to time"}  ← DO NOT INVENT A DIFFERENT TIMELINE`);
    lines.push(`ENERGY: ${db.energyNote}`);
    if (db.mentalNote) lines.push(`MENTAL NOTE: ${db.mentalNote}`);
  }

  if (db.type === "career") {
    lines.push(`PRIMARY FOCUS: ${db.primaryAspect}`);
    lines.push(`CAREER BREAKDOWN (use these exact probabilities — do not invent others):`);
    db.aspects.forEach(a => {
      const pad = " ".repeat(Math.max(1, 18 - a.name.length));
      lines.push(`  ${a.name}:${pad}${a.direction} (${a.probability}%)`);
    });
    lines.push(`OPPORTUNITY: ${db.opportunityNote}`);
    if (db.frictionNote) lines.push(`FRICTION: ${db.frictionNote}`);
    lines.push(`TIMING: ${db.timing ?? "No specific window yet"}  ← DO NOT INVENT A DIFFERENT TIMELINE`);
    lines.push(`OVERALL PROBABILITY: ${db.overallProbability}%  ← USE THIS EXACT NUMBER`);
  }

  if (db.type === "finance") {
    lines.push(`FINANCIAL AREAS (use these status labels — do not invent percentages):`);
    db.areas.forEach(a => {
      const pad = " ".repeat(Math.max(1, 22 - a.name.length));
      lines.push(`  ${a.name}:${pad}${a.status}`);
    });
    lines.push(`FLOW: ${db.primaryFlow}`);
    lines.push(`PRIMARY SOURCE: ${db.primarySource}`);
    if (db.opportunity) lines.push(`OPPORTUNITY: ${db.opportunity}`);
    if (db.risk) lines.push(`RISK: ${db.risk}`);
  }

  if (db.type === "relationship") {
    if (db.strongAreas.length > 0) {
      lines.push(`STRONG AREAS:`);
      db.strongAreas.forEach(a => lines.push(`  • ${a}`));
    }
    if (db.attentionAreas.length > 0) {
      lines.push(`NEEDS ATTENTION:`);
      db.attentionAreas.forEach(a => lines.push(`  • ${a}`));
    }
    lines.push(`CONFLICT RISK: ${db.conflictRisk}  ← DO NOT CONTRADICT THIS`);
    lines.push(`PRIMARY DYNAMIC: ${db.primaryDynamic}`);
  }

  lines.push(`YOUR OPENING SENTENCE: "${brief.mainConclusion}"  ← START WITH THIS EXACTLY`);
  if (brief.unexpectedObservation)
    lines.push(`UNEXPECTED OBSERVATION: ${brief.unexpectedObservation}`);
  lines.push(`CLOSING RECOMMENDATION: ${brief.recommendation}`);
  if (brief.remedies.length > 0) {
    lines.push(`ASTROLOGICAL REMEDIES (weave these naturally into your recommendation paragraph):`);
    brief.remedies.forEach(r => lines.push(`  • ${r}`));
  }

  return lines.join("\n");
}
