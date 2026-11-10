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
  ConsultationBrief, HealthBrief, HealthSystemScore, CareerBrief, CareerAspect, FinanceBrief, FinanceArea, PropertyBrief, RelationshipBrief, SpiritualityBrief,
} from "./types";
import type { BodyRiskProfile } from "../../intelligence/health/bodyRiskProfile";
import type { HealthFindings } from "../../intelligence/health/healthFindingsEngine";
import type { PromiseResult, DomainActivation } from "../../intelligence/lifeInsights/services";
import type { InvestigationReport } from "./CIE_investigationEngine";
import type { ChartFacts } from "../../core/astrology/chartFacts";
import type { Period } from "../../astrology/dasha";
import { renderInvestigationReport } from "./CIE_investigationEngine";

// ── Chart-specific data bundle (passed from route.ts into the brain) ──────────

export interface DomainPrimaryTargets {
  primaryHouses: number[];
  primaryLordHouse: number;
}

export const DOMAIN_PRIMARY_TARGETS: Record<string, DomainPrimaryTargets> = {
  career: { primaryHouses: [10, 6, 2, 11], primaryLordHouse: 10 },
  health: { primaryHouses: [1, 6, 8, 12], primaryLordHouse: 1 },
  finance: { primaryHouses: [2, 11, 5, 9], primaryLordHouse: 2 },
  relationship: { primaryHouses: [7, 4, 2, 11], primaryLordHouse: 7 },
  education: { primaryHouses: [4, 5, 9], primaryLordHouse: 4 },
  spirituality: { primaryHouses: [9, 12, 5], primaryLordHouse: 9 },
  general: { primaryHouses: [1, 10], primaryLordHouse: 10 },
};

export interface ChartData {
  bodyRiskProfile?:   BodyRiskProfile | null;
  healthFindings?:    HealthFindings | null;
  natalPromise?:      PromiseResult | null;
  domainActivation?:  DomainActivation | null;
  manifestations?:    Array<{ title: string; probability: number }> | null;
  investigationReport?: InvestigationReport;
  // Gold Standard v1.0 inputs — when present, health answers use the Gold Standard prompt.
  chartFacts?:        ChartFacts;
  pratyantar?:        string | null;
  // Shared timing engine inputs (src/lib/consultation/timing): the Mahadasha
  // timeline, the date "now" means for this question, and the user's timezone.
  timing?:            { timeline: Period[]; referenceDate: Date; timezone: string };
}

// ── Body parts per health system ──────────────────────────────────────────────
// Maps internal system keys to the human-readable parts the LLM will mention.

const BODY_PARTS: Record<string, string[]> = {
  respiratorySystem:       ["throat", "nose", "sinuses", "upper airways"],
  throat:                  ["throat", "vocal cords", "ear canals", "nasal cavity"],
  coldViralSusceptibility: ["throat", "nose", "sinuses"],
  head:                    ["head", "temples", "forehead"],
  joints:                  ["knees", "hips", "shoulders", "fingers"],
  back:                    ["lower back", "spine", "lumbar region"],
  heart:                   ["chest", "heart area"],
  stomach:                 ["stomach", "upper abdomen", "food pipe"],
  digestiveSystem:         ["intestines", "gut", "stomach", "lower abdomen"],
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

// ── Planet worship data ───────────────────────────────────────────────────────
// Each entry contains everything needed for a complete spirituality consultation.

interface PlanetWorship {
  day:              string;
  mantra:           string;
  charity:          string;
  behaviour:        string;
  avoid:            string;
  governs:          string[];
  expectedBenefit:  string;
}

const PLANET_WORSHIP: Record<string, PlanetWorship> = {
  Sun: {
    day:             "Sunday",
    mantra:          "Om Hreem Suryaya Namah — chant 11 times at sunrise, facing east",
    charity:         "Donate wheat, jaggery, or copper items to someone in need on Sunday morning",
    behaviour:       "Wake before sunrise and observe the rising sun for 2 minutes. Begin important tasks on Sunday.",
    avoid:           "Avoid ego conflicts, arguments with authority figures, and disrespecting elders this week",
    governs:         ["career recognition", "authority", "vitality", "confidence", "government matters", "father"],
    expectedBenefit: "Increased confidence, better relationship with authority figures, clarity on career direction",
  },
  Moon: {
    day:             "Monday",
    mantra:          "Om Chandraya Namah — chant 11 times on Monday evening, ideally near water",
    charity:         "Offer white rice, milk, or silver items to a temple or someone elderly on Monday",
    behaviour:       "Drink water from a silver glass this week. Spend time near a water body if possible.",
    avoid:           "Avoid emotional decisions late at night, excessive worry, and skipping sleep",
    governs:         ["mind", "emotions", "relationships", "cold sensitivity", "sleep quality", "mother"],
    expectedBenefit: "Improved emotional stability, better sleep, calmer relationships, relief from mental fatigue",
  },
  Mars: {
    day:             "Tuesday",
    mantra:          "Om Angarakaya Namah — chant 11 times on Tuesday morning",
    charity:         "Donate red lentils, red cloth, or blood (donate blood) on Tuesday",
    behaviour:       "Begin important initiatives on Tuesday morning. Physical exercise helps channel Mars energy productively.",
    avoid:           "Avoid impulsive decisions, arguments with siblings, and excessive spicy food this week",
    governs:         ["courage", "physical energy", "property", "siblings", "legal matters", "initiative"],
    expectedBenefit: "Increased drive and confidence, faster resolution of property or legal matters, physical vitality",
  },
  Mercury: {
    day:             "Wednesday",
    mantra:          "Om Budhaya Namah — chant 11 times on Wednesday morning",
    charity:         "Feed green grass to a cow, or donate green vegetables on Wednesday",
    behaviour:       "Write down your key communications and plans clearly this week. Mercury rewards precision.",
    avoid:           "Avoid signing important documents hastily, miscommunication, and scattered attention",
    governs:         ["communication", "intellect", "business", "career negotiations", "skill development"],
    expectedBenefit: "Sharper communication, better negotiation outcomes, clearer thinking, improved business decisions",
  },
  Jupiter: {
    day:             "Thursday",
    mantra:          "Om Gurave Namah — chant 21 times on Thursday morning",
    charity:         "Donate yellow items — turmeric, gram dal, yellow cloth — to a temple on Thursday",
    behaviour:       "Wear yellow or touch a banana leaf on Thursday. Seek the guidance of a mentor or elder.",
    avoid:           "Avoid arrogance, overpromising, and excessive indulgence this week",
    governs:         ["wisdom", "wealth growth", "children", "teaching", "long-term blessings", "expansion"],
    expectedBenefit: "Long-term financial improvement, blessings in family and relationships, wisdom in decisions",
  },
  Venus: {
    day:             "Friday",
    mantra:          "Om Shukraya Namah — chant 11 times on Friday evening",
    charity:         "Offer white flowers or white sweets at a Lakshmi or Durga temple on Friday",
    behaviour:       "Light a ghee lamp Friday evening near a Lakshmi image. Dress well and bring beauty into your environment.",
    avoid:           "Avoid crude speech, conflicts in relationships, and neglecting your appearance this week",
    governs:         ["relationships", "communication", "emotional harmony", "creativity", "partnerships", "luxury"],
    expectedBenefit: "Improved relationships, better reception from others, creative breakthroughs, emotional balance",
  },
  Saturn: {
    day:             "Saturday",
    mantra:          "Om Shanaischaraya Namah — chant 11 times on Saturday evening",
    charity:         "Feed crows, dogs, or homeless individuals on Saturday morning. Donate black sesame seeds.",
    behaviour:       "Donate mustard oil to a Shani temple or give it to a worker. Consistency and service this week.",
    avoid:           "Avoid shortcuts, laziness, dishonesty, and disrespecting workers or labourers",
    governs:         ["discipline", "career stability", "patience", "long-term karma", "structure", "responsibility"],
    expectedBenefit: "Karma resolution, stronger career foundation, improved discipline, relief from long-standing delays",
  },
  Rahu: {
    day:             "Saturday",
    mantra:          "Om Rahave Namah — chant 18 times on Saturday",
    charity:         "Donate a dark blanket, coconut, or coal to someone in need on Saturday",
    behaviour:       "Simplify your choices this week. Rahu amplifies what you focus on — choose carefully.",
    avoid:           "Avoid illusions, speculation, substances, and people who mislead or flatter excessively",
    governs:         ["ambition", "sudden changes", "foreign connections", "technology", "unconventional paths"],
    expectedBenefit: "Clarity on ambitions, protection from deception, better navigation of unexpected changes",
  },
  Ketu: {
    day:             "Tuesday",
    mantra:          "Om Ketave Namah — chant 7 times in the morning, ideally during meditation",
    charity:         "Donate sesame seeds, a blanket, or support a spiritual institution on Tuesday",
    behaviour:       "Spend time in quiet meditation or visit a temple. Ketu responds to inner stillness.",
    avoid:           "Avoid attachment to outcomes, excessive worldly planning, and arguments about beliefs",
    governs:         ["spiritual growth", "detachment", "research", "past-life karma", "liberation"],
    expectedBenefit: "Deeper spiritual insight, detachment from draining situations, clarity on purpose",
  },
};

function computeRemedies(domain: string, brief: ConsultationBrief["domainBrief"]): string[] {
  if (brief.type === "spirituality") {
    return [brief.mantra, brief.charity];
  }
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

// Illness probability from a system's sensitivity score — functional states
// (energy, sleep, mental) carry lower illness risk. Applied per system so the
// summary card's secondary line reflects that system's own score.
const FUNCTIONAL_SYSTEMS = ["energyStamina", "mentalWellness", "sleep", "recovery"];

function illnessProbabilityFor(system: string, score: number): number {
  if (FUNCTIONAL_SYSTEMS.includes(system)) {
    return Math.max(5, Math.round((score - 25) * 0.35));
  }
  if (score < 52) return 10;
  if (score < 65) return 10 + Math.round((score - 52) * 2);
  if (score < 78) return 36 + Math.round((score - 65) * 2.5);
  return Math.min(75, 68 + Math.round((score - 78) * 0.8));
}

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
      rankedSystems:      null,
      bodyParts:          [],
      symptoms:           [],
      strongAreas:        [],
      goodNews:           ["Overall constitution looks steady"],
      redFlags:           [],
      recovery:           null,
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
      surpriseObservation: null,
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

  const isFunctional = FUNCTIONAL_SYSTEMS.includes(findings.primaryFocus.system);
  const illnessProbability = illnessProbabilityFor(findings.primaryFocus.system, primaryScore);

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
    : primaryScore < 65 ? "3–5 days"
    : primaryScore < 78 ? "5–7 days"
    : "5–7 days, don't rush it";

  // Strong areas: low-score systems not currently activated
  const activeSet  = new Set(findings.activeSystems);
  const strongAreas = Object.entries(STRONG_DISPLAY)
    .filter(([sys]) => !activeSet.has(sys) && (profile[sys as keyof BodyRiskProfile] ?? 0) < 45)
    .slice(0, 3)
    .map(([, name]) => name);

  // Mental note — only flag when mental load meaningfully exceeds physical sensitivity
  const mentalScore = Math.max(profile.mentalWellness, profile.energyStamina);
  const mentalNote  = (mentalScore >= primaryScore + 8 || (isFunctional && mentalScore >= 65))
    ? "Mental fatigue and stress are a greater risk today than physical illness."
    : null;

  // Good news — strong areas phrased positively
  const goodNews = strongAreas.map(a => `${a} looks strong this week`);

  // Red flags — warning signs that indicate worsening
  const redFlags: string[] = primaryScore >= 65
    ? ["If symptoms worsen after day 3, consider medical attention",
       "Fever or significant pain is a signal to rest completely"]
    : primaryScore >= 52
    ? ["Watch for symptoms that appear in the evening — they tend to linger longer"]
    : [];

  // Recovery expectation
  const recovery: string | null =
    primaryScore < 52 ? null
    : primaryScore < 65 ? "Fast — most symptoms, if they develop, resolve within 3–5 days with rest"
    : primaryScore < 78 ? "Moderate — may take 5–7 days; don't push through fatigue"
    : "Slow — rest is essential; don't underestimate this";

  // Surprise observation — what the chart shows that the user didn't ask about
  const surpriseObservation: string | null =
    mentalNote
      ? "What actually catches my attention more than physical health is mental load — stress is the real risk today"
      : strongAreas.length >= 2
      ? `What's worth noting is how strong your ${strongAreas[0]?.toLowerCase()} and ${strongAreas[1]?.toLowerCase()} are in your chart right now`
      : null;

  // Build ranked system list for multi-system awareness
  const rankedSystems: HealthSystemScore[] | null = findings.rankedSystems.length > 0
    ? findings.rankedSystems.map(f => ({
        name: f.displayName,
        score: f.score,
        illnessProbability: illnessProbabilityFor(f.system, f.score),
      }))
    : null;

  return {
    type: "health",
    overallStatus,
    primarySystem:    findings.primaryFocus.displayName,
    primarySystemKey: findings.primaryFocus.system,
    rankedSystems,
    bodyParts,
    symptoms:         findings.symptoms,
    strongAreas,
    goodNews,
    redFlags,
    recovery,
    illnessProbability,
    severity,
    seriousRisk,
    timeline,
    energyNote: findings.energyArc,
    mentalNote,
    surpriseObservation,
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

  const strategyNote =
    overallProbability >= 70
      ? "Be visible and take ownership of results — this is the window for it"
      : overallProbability >= 50
      ? "Consistent, quiet execution matters more than visibility right now"
      : "Focus on completing commitments before starting anything new";

  const surpriseObservation =
    activationScore >= 70 && frictionNote
      ? "What surprised me is how strong the chart looks despite the friction — the underlying support is genuine, just moving slower than expected"
      : activationScore < 50 && promiseScore >= 70
      ? "Your natal chart has strong career promise — what's suppressing it right now is the current period, not permanent"
      : null;

  return {
    type: "career",
    primaryAspect,
    aspects,
    opportunityNote,
    frictionNote,
    timing,
    overallProbability,
    strategyNote,
    surpriseObservation,
  };
}

// ── Finance interpreter ───────────────────────────────────────────────────────

function interpretProperty(
  diagnosis:      AstrologicalDiagnosis,
  intent:         IntentAnalysis,
  manifestations: Array<{ title: string; probability: number }> | null,
): PropertyBrief {
  const s = diagnosis.overallState;
  const q = intent.stated.toLowerCase();
  const primaryFocus =
    /\bsell|sale\b/.test(q)                         ? "Sale"
    : /construct|build|renovat|repair/.test(q)      ? "Construction"
    : /home loan|\bloan\b|emi|mortgage/.test(q)     ? "Home Loan"
    : /\bmove|moving|shift|relocat|rent/.test(q)    ? "Moving"
    : /\bland\b|\bplot\b|farm/.test(q)              ? "Land"
    : "Home Purchase";
  const direction: PropertyBrief["direction"] =
    s === "Highly Favorable" || s === "Favorable" ? "Favourable"
    : s === "Moderate" ? "Steady"
    : s === "Challenging" ? "Delayed"
    : "Unfavourable";
  return {
    type: "property",
    primaryFocus,
    direction,
    manifestations: (manifestations ?? []).slice(0, 3).map(m => m.title),
    opportunity: direction === "Favourable" ? "Supportive period for planned property steps"
      : direction === "Steady" ? "Groundwork — research, savings and paperwork — pays off now"
      : null,
    risk: direction === "Unfavourable" ? "Avoid major property commitments until timing improves"
      : direction === "Delayed" ? "Expect delays in approvals, registration or possession"
      : null,
  };
}

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

  const timeline: string | null =
    s === "Highly Favorable" || s === "Favorable" ? "Conditions should remain favorable for 3–4 weeks"
    : s === "Moderate" ? "No major shift expected in the next 2 weeks"
    : s === "Challenging" ? "Pressure may ease in 2–3 weeks as transit positions shift"
    : null;

  const surpriseObservation =
    s === "Challenging" && score >= 60
      ? "What's interesting is that despite the pressure, the natal chart shows strong financial potential — this is a timing issue, not a structural one"
      : s === "Highly Favorable" && score < 70
      ? "The overall flow is positive, but the activation is lower than the promise suggests — don't overcommit"
      : null;

  return {
    type: "finance",
    areas,
    primaryFlow,
    primarySource: "Career income and professional stability",
    opportunity,
    risk,
    timeline,
    surpriseObservation,
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

  const surpriseObservation =
    CONFLICT[s] === "Low" && ATTENTION[s]?.length > 0
      ? "What's worth noting despite the overall stability is that small communication gaps tend to widen if ignored — not urgent, but worth addressing"
      : CONFLICT[s] === "High" && STRONG[s]?.length > 0
      ? "Interestingly, even with the tension, the long-term foundation between you is intact — this is a period issue, not a relationship issue"
      : null;

  return {
    type:           "relationship",
    strongAreas:    STRONG[s]   ?? [],
    attentionAreas: ATTENTION[s] ?? [],
    conflictRisk:   CONFLICT[s] ?? "Mild",
    primaryDynamic: DYNAMICS[s] ?? "Stable relationship phase",
    surpriseObservation,
  };
}

// ── Spirituality interpreter ──────────────────────────────────────────────────

function interpretSpirituality(
  diagnosis: AstrologicalDiagnosis,
  chartData: ChartData,
): SpiritualityBrief {
  const PLANET_ORDER = ["Jupiter", "Venus", "Mercury", "Moon", "Sun", "Saturn", "Mars", "Rahu", "Ketu"];

  // Pick keyPlanet: prefer diagnosis.keyPlanet, then first supporting factor planet, then Jupiter
  let keyPlanet = diagnosis.keyPlanet ?? "";
  if (!keyPlanet || !PLANET_WORSHIP[keyPlanet]) {
    for (const p of PLANET_ORDER) {
      const found = diagnosis.supportingFactors.some(f => f.includes(p));
      if (found) { keyPlanet = p; break; }
    }
  }
  if (!keyPlanet || !PLANET_WORSHIP[keyPlanet]) keyPlanet = "Jupiter";

  const worship = PLANET_WORSHIP[keyPlanet];

  // Confidence: blend dasha + transit alignment
  const dashaBonus    = diagnosis.dashaAlignment   === "supportive"  ? 15 : diagnosis.dashaAlignment   === "neutral" ? 5 : -5;
  const transitBonus  = diagnosis.transitAlignment === "favorable"   ? 12 : diagnosis.transitAlignment === "neutral" ? 4 : -3;
  const baseScore     = diagnosis.overallScore;
  const confidence    = Math.min(98, Math.max(50, Math.round(baseScore * 0.73 + dashaBonus + transitBonus)));

  // whyNow — why THIS planet at THIS time
  const supportLine = chartData.natalPromise?.supporting
    .find(s => s.toLowerCase().includes(keyPlanet.toLowerCase()))
    ?? diagnosis.supportingFactors[0]
    ?? `${keyPlanet} is currently active through the ongoing dasha period`;

  const whyNow = `${supportLine}. ${
    diagnosis.dashaAlignment === "supportive"
      ? "The dasha period strongly amplifies this planet's influence right now."
      : diagnosis.transitAlignment === "favorable"
      ? "Current transits are reinforcing this planet's positive effect."
      : "This planet holds the strongest positive charge in your chart at this time."
  }`;

  // confidenceReason
  const dashaDesc   = diagnosis.dashaAlignment   === "supportive" ? "aligns" : "is active";
  const transitDesc = diagnosis.transitAlignment === "favorable"  ? "favorable transit supports" : "transit active for";
  const confidenceReason = `${diagnosis.dashaAlignment.charAt(0).toUpperCase() + diagnosis.dashaAlignment.slice(1)} dasha ${dashaDesc} with ${keyPlanet}; ${transitDesc} ${keyPlanet} in natal chart this week`;

  // duration
  const duration = diagnosis.timeline
    ? `Strongest over the next ${diagnosis.timeline}`
    : diagnosis.dashaAlignment === "supportive"
    ? "Active for the next 2–3 weeks while this dasha phase continues"
    : "Most responsive over the next 7–10 days";

  // Secondary planet
  const secondaryPlanet = (() => {
    for (const p of PLANET_ORDER) {
      if (p === keyPlanet) continue;
      if (diagnosis.supportingFactors.some(f => f.includes(p))) return p;
    }
    return null;
  })();

  return {
    type:               "spirituality",
    keyPlanet,
    confidence,
    whyNow,
    lifeAreasSupported: worship.governs,
    bestDay:            worship.day,
    mantra:             worship.mantra,
    duration,
    charity:            worship.charity,
    behaviour:          worship.behaviour,
    avoid:              worship.avoid,
    expectedBenefit:    worship.expectedBenefit,
    confidenceReason,
    secondaryPlanet,
  };
}

// ── Consultation Priority Engine ──────────────────────────────────────────────
// Scores all available observations by severity × confidence × novelty.
// Returns the top 3 to prevent information overload.

function computeTopPriorities(
  domain:    string,
  brief:     ConsultationBrief["domainBrief"],
  diagnosis: AstrologicalDiagnosis,
  history:   string[],   // recent assistant response texts for novelty scoring
): string[] {
  const candidates: Array<{ text: string; score: number }> = [];

  const noveltyFactor = (text: string) => {
    const mentions = history.filter(h => h.toLowerCase().includes(text.toLowerCase().slice(0, 15))).length;
    return mentions === 0 ? 1.0 : mentions === 1 ? 0.6 : 0.2;
  };

  const severity = diagnosis.overallScore >= 75 ? 3 : diagnosis.overallScore >= 55 ? 2 : 1;
  const conf     = diagnosis.confidence === "high" ? 3 : diagnosis.confidence === "medium" ? 2 : 1;

  if (brief.type === "health") {
    // Use body-part language, not system name or raw %
    const watchPhrase = brief.bodyParts.length > 0
      ? brief.bodyParts.slice(0, 2).join(" and ").toLowerCase()
      : brief.primarySystem.toLowerCase();
    const feelingLabel = brief.illnessProbability >= 70 ? "real chance of feeling off if you push"
      : brief.illnessProbability >= 55 ? "possible if not careful"
      : "mild — worth being careful";
    candidates.push({ text: `${watchPhrase} — ${feelingLabel}`, score: severity * conf * noveltyFactor(brief.primarySystem) });
    if (brief.energyNote)
      candidates.push({ text: brief.energyNote, score: 1.5 * conf * noveltyFactor("energy") });
    if (brief.mentalNote)
      candidates.push({ text: brief.mentalNote, score: 2 * conf * noveltyFactor("mental fatigue") });
    brief.goodNews.forEach(g =>
      candidates.push({ text: `Positive: ${g}`, score: 1 * conf * noveltyFactor(g) }));
  }

  if (brief.type === "career") {
    const top = brief.aspects[0];
    if (top) {
      // Direction label as natural language, not raw %
      const dirLabel = top.direction === "Strong" ? "looking strong" : top.direction === "Building" ? "building momentum" : top.direction === "Stable" ? "holding steady" : top.direction === "Weak" ? "under pressure" : "facing obstacles";
      candidates.push({ text: `${top.name}: ${dirLabel}`, score: severity * conf * noveltyFactor(top.name) });
    }
    if (brief.opportunityNote)
      candidates.push({ text: brief.opportunityNote, score: 2 * conf * noveltyFactor(brief.opportunityNote.slice(0, 20)) });
    if (brief.frictionNote)
      candidates.push({ text: brief.frictionNote, score: 1.5 * conf * noveltyFactor("delay") });
    if (brief.strategyNote)
      candidates.push({ text: brief.strategyNote, score: 1.8 * conf * 1.0 });
  }

  if (brief.type === "finance") {
    const topArea = brief.areas.find(a => a.status === "Risky" || a.status === "Cautious");
    if (topArea)
      candidates.push({ text: `${topArea.name}: ${topArea.status}`, score: severity * conf * noveltyFactor(topArea.name) });
    if (brief.risk)
      candidates.push({ text: brief.risk, score: severity * conf * noveltyFactor("risk") });
    if (brief.opportunity)
      candidates.push({ text: brief.opportunity, score: 1.5 * conf * noveltyFactor("opportunity") });
  }

  if (brief.type === "relationship") {
    if (brief.primaryDynamic)
      candidates.push({ text: brief.primaryDynamic, score: severity * conf * noveltyFactor("relationship") });
    brief.attentionAreas.forEach(a =>
      candidates.push({ text: `${a} needs attention`, score: 1.5 * conf * noveltyFactor(a) }));
  }

  if (brief.type === "spirituality") {
    candidates.push({ text: `Focus on ${brief.keyPlanet} this period`, score: 3 * conf * 1.0 });
    candidates.push({ text: brief.whyNow, score: 2 * conf * 1.0 });
    candidates.push({ text: brief.expectedBenefit, score: 1.5 * conf * 1.0 });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => c.text);
}

// ── Health system → ruling planet ────────────────────────────────────────────
// Vedic correspondence: which planet governs each body system.
// Used to generate the WHY explanation in health consultations.

const SYSTEM_RULING_PLANET: Record<string, string> = {
  respiratorySystem:       "Mercury",
  coldViralSusceptibility: "Moon",
  throat:                  "Mercury",
  digestiveSystem:         "Moon",
  stomach:                 "Moon",
  head:                    "Sun",
  heart:                   "Sun",
  joints:                  "Saturn",
  back:                    "Saturn",
  kidneys:                 "Venus",
  liver:                   "Jupiter",
  mentalWellness:          "Moon",
  nervousSystem:           "Mercury",
  energyStamina:           "Sun",
  sleep:                   "Moon",
  recovery:                "Saturn",
  immuneSystem:            "Sun",
  skinHealth:              "Venus",
  inflammation:            "Mars",
  allergySensitivity:      "Moon",
};

const PLANET_HEALTH_WHY: Record<string, string> = {
  Mercury: "Mercury governs the respiratory and nervous systems — when it is stressed or weak, the airways and nerves become sensitive",
  Moon:    "The Moon governs fluid balance, cold sensitivity, the digestive system, and emotional health — today its influence is stronger than usual",
  Sun:     "The Sun governs vitality and immune strength — a weakened solar influence reduces energy and resistance simultaneously",
  Saturn:  "Saturn governs the structural systems — joints, spine, and recovery pace all follow Saturn's cycles closely",
  Venus:   "Venus governs skin health and kidney function — sensitivity in these areas tracks Venus's current transit position",
  Jupiter: "Jupiter governs liver function, metabolism, and expansion — imbalanced Jupiter creates heaviness and sluggishness in these areas",
  Mars:    "Mars governs inflammation, heat, and physical drive — an aggravated Mars creates heat-based sensitivity in the affected tissues",
};

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

      // Use body-part language for the opening sentence, never the system name
      const hBodyPhrase = h.bodyParts.length >= 2
        ? `your ${h.bodyParts[0].toLowerCase()} and ${h.bodyParts[1].toLowerCase()}`
        : h.bodyParts.length === 1
        ? `your ${h.bodyParts[0].toLowerCase()}`
        : `your ${h.primarySystem.toLowerCase()}`;

      mainConclusion =
        h.overallStatus === "Healthy"
          ? "Your health looks clear today — I'm not seeing anything to worry about."
          : h.overallStatus === "Mild Sensitivity"
          ? `There's a mild sensitivity around ${hBodyPhrase} — nothing serious, but worth being a little careful.`
          : h.overallStatus === "Moderate Concern"
          ? `${hBodyPhrase.charAt(0).toUpperCase() + hBodyPhrase.slice(1)} are under some stress today — I'd take it easy and not push through.`
          : `${hBodyPhrase.charAt(0).toUpperCase() + hBodyPhrase.slice(1)} need some extra care right now — I wouldn't push through it.`;

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
        ? pa.direction === "Strong"
          ? `${c.primaryAspect} is looking genuinely well-supported right now — the chart is leaning strongly in your favour.`
          : pa.direction === "Building"
          ? `${c.primaryAspect} is building — not guaranteed yet, but conditions are moving in the right direction.`
          : pa.direction === "Stable"
          ? `${c.primaryAspect} is holding steady — not a peak moment, but progress is real.`
          : `${c.primaryAspect} faces some friction right now — the chart shows genuine obstacles worth understanding.`
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

    case "property": {
      const p = interpretProperty(diagnosis, intent, chartData.manifestations ?? null);
      domainBrief    = p;
      overallVerdict = p.direction;
      mainConclusion =
        p.direction === "Favourable" ? `The chart supports ${p.primaryFocus.toLowerCase()} steps in this period.`
        : p.direction === "Steady"   ? `Property matters look steady — a time to prepare ${p.primaryFocus.toLowerCase()} carefully rather than rush.`
        : `Property decisions need patience right now — ${(p.risk ?? "timing is not yet supportive").toLowerCase()}.`;
      recommendation = p.risk
        ? "Hold big property commitments; use this time for research, documents and savings."
        : "Move forward on planned property steps, with documents and finances checked first.";
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

    case "spirituality": {
      const sp = interpretSpirituality(diagnosis, chartData);
      domainBrief    = sp;
      overallVerdict = `${sp.keyPlanet} is your strongest active planet this week`;
      mainConclusion = `This week, ${sp.keyPlanet} is the planet most worth strengthening — it's currently the most responsive to worship and devotional practice.`;
      unexpectedObservation = sp.secondaryPlanet
        ? `${sp.secondaryPlanet} is also quietly active in the background — you don't need to focus on it, but it's worth being aware of.`
        : null;
      recommendation = `Focus exclusively on ${sp.keyPlanet} for the next two weeks rather than trying to strengthen multiple planets. ${sp.behaviour}`;
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

  // Planet context — WHY the key planet matters for this domain
  // For health: use Vedic system→planet mapping to explain WHY this area is activated
  // For other domains: pull from natal promise if available
  let planetContext: string | null = null;
  if (domain === "health" && domainBrief.type === "health") {
    const rulingPlanet = SYSTEM_RULING_PLANET[domainBrief.primarySystemKey];
    planetContext = rulingPlanet ? (PLANET_HEALTH_WHY[rulingPlanet] ?? null) : null;
  } else {
    planetContext = chartData.natalPromise?.supporting
      .find(s => diagnosis.keyPlanet && s.toLowerCase().includes(diagnosis.keyPlanet.toLowerCase()))
      ?? chartData.natalPromise?.supporting[0]
      ?? null;
  }

  const remedies = computeRemedies(domain, domainBrief);

  // Priority Engine — top 3 observations, deduplicated by novelty (no history available here; route.ts will pass it later)
  const topPriorities = computeTopPriorities(domain, domainBrief, diagnosis, []);

  return {
    domain,
    overallVerdict,
    mainConclusion,
    unexpectedObservation,
    recommendation,
    remedies,
    planetContext,
    topPriorities,
    domainBrief,
    investigationReport: chartData.investigationReport,
  };
}

// ── System prompt renderer ────────────────────────────────────────────────────
// Converts ConsultationBrief into the diagnosis block the LLM narrates from.
// Every fact here was computed by the engine — the LLM cannot invent beyond it.

export function renderConsultationBrief(brief: ConsultationBrief, question: string, isFollowUp = false): string {
  const { domainBrief: db } = brief;

  // ── Prepend Investigation Trail when available ────────────────────────────
  // Gold Standard answers (health, career, finance, property) get the same findings (and the transits) in
  // the domain CHART EVIDENCE block, so the trail and transit audit are left
  // out there — they would duplicate it and push the prompt past the Groq
  // free tier's 8,000 tokens-per-minute limit.
  const goldBrief = (db.type === "health" || db.type === "career" || db.type === "finance" || db.type === "property") && !!db.goldStandard;
  const investigationBlock = brief.investigationReport && !goldBrief
    ? renderInvestigationReport(brief.investigationReport, question) + "\n\n"
    : "";

  const lines: string[] = [
    `━━━ DIAGNOSIS (engine-computed — DO NOT invent numbers beyond what is listed here) ━━━`,
    `QUESTION: "${question}"`,
    `OVERALL: ${brief.overallVerdict}`,
  ];

  if (db.type === "health") {
    // Multi-system ranked list — the key architectural upgrade
    if (db.rankedSystems && db.rankedSystems.length > 0) {
      lines.push(`ALL ACTIVE BODY SYSTEMS — FOR CALIBRATION ONLY. DO NOT QUOTE THESE SCORES IN YOUR RESPONSE.`);
      lines.push(`Use them to decide what to emphasise. Never say "ranking of X" or "score of Y".`);
      for (const sys of db.rankedSystems) {
        const bar = "█".repeat(Math.round(sys.score / 10));
        const pad = " ".repeat(Math.max(1, 28 - sys.name.length));
        lines.push(`  ${sys.name}:${pad}${sys.score}  ${bar}`);
      }
      const primary   = db.rankedSystems[0];
      const secondary = db.rankedSystems[1];
      if (secondary && secondary.score >= primary.score - 8) {
        lines.push(`  NOTE: ${primary.name} leads, but ${secondary.name} is almost equally activated (${secondary.score} vs ${primary.score}).`);
        lines.push(`  If the user mentions symptoms of ${secondary.name.toLowerCase()}, acknowledge that system directly.`);
      } else if (secondary) {
        lines.push(`  PRIMARY: ${primary.name} (${primary.score}) — strongest active system. Narrate this first.`);
      }
    } else {
      // Use body-part language; primarySystem is internal, never expose it to LLM
      const primaryLabel = db.bodyParts.length > 0
        ? db.bodyParts.slice(0, 3).join(", ")
        : db.primarySystem;
      lines.push(`PRIMARY AREA: ${primaryLabel}`);
    }
    if (db.bodyParts.length > 0)
      lines.push(`BODY PARTS: ${db.bodyParts.join("  ·  ")}`);
    if (db.symptoms.length > 0) {
      lines.push(`IF ANYTHING DEVELOPS, EXPECT:`);
      db.symptoms.forEach(s => lines.push(`  • ${s}`));
    }
    if (db.goodNews.length > 0)
      lines.push(`GOOD NEWS: ${db.goodNews.join("  ·  ")}`);
    if (db.strongAreas.length > 0)
      lines.push(`STABLE TODAY: ${db.strongAreas.join("  ·  ")}`);
    if (db.redFlags.length > 0) {
      lines.push(`RED FLAGS (only mention if relevant):`);
      db.redFlags.forEach(r => lines.push(`  • ${r}`));
    }
    if (db.goldStandard) {
      // Gold Standard §7: qualitative evidence strength, not an illness probability.
      lines.push(`EVIDENCE STRENGTH: ${db.evidenceStrength ?? "Insufficient"}  ← say this in words; never a percentage`);
    } else {
      // Translate probability to feeling language — never expose the raw % to the LLM
      const probLabel = db.illnessProbability >= 70 ? "real chance of feeling off if you push"
        : db.illnessProbability >= 55 ? "possible if you're not careful"
        : db.illnessProbability >= 40 ? "low — worth being mindful"
        : "unlikely — looking clear";
      lines.push(`ILLNESS LIKELIHOOD: ${probLabel}  ← speak this way, NEVER quote a percentage`);
    }
    if (db.severity) {
      const sevPhrase: Record<string, string> = {
        Significant: "worth taking seriously — don't dismiss",
        Moderate:    "mild — just be a bit careful",
        Minor:       "very mild — just a touch of extra care",
      };
      lines.push(`CONCERN LEVEL: ${sevPhrase[db.severity] ?? db.severity} — temporary if anything develops`);
    }
    if (db.goldStandard) {
      // Gold Standard §10: astrology must never exclude disease, so "risk is
      // low/unlikely" becomes "no strong indication" of serious strain.
      const strain: Record<HealthBrief["seriousRisk"], string> = {
        "Very unlikely": "no strong indication of serious strain",
        "Unlikely":      "no strong indication of serious strain; minor stress only",
        "Possible":      "some indication of more serious strain — recommend seeing a doctor",
      };
      lines.push(`SERIOUS STRAIN INDICATION: ${strain[db.seriousRisk]}  ← never say a disease is ruled out or that risk is low or zero`);
    } else {
      lines.push(`SERIOUS ILLNESS RISK: ${db.seriousRisk}  ← DO NOT CONTRADICT THIS`);
    }
    if (db.goldStandard) {
      // Gold Standard §8: timing only from dasha and transits, never day counts.
      lines.push(`TIMING: ${db.timing ?? "dasha period not available"}  ← anchor timing ONLY to this period and the transits in HEALTH CHART EVIDENCE; never give a number of days or weeks`);
      if (db.recovery) lines.push(`RECOVERY CAPACITY: ${db.recovery.split(" — ")[0]}`);
    } else {
      lines.push(`TIMELINE: ${db.timeline ?? "No illness expected — nothing to time"}  ← DO NOT INVENT A DIFFERENT TIMELINE`);
      if (db.recovery) lines.push(`RECOVERY: ${db.recovery}`);
    }
    lines.push(`ENERGY: ${db.energyNote}`);
    if (db.mentalNote) lines.push(`MENTAL NOTE: ${db.mentalNote}`);
  }

  if (db.type === "career" && db.goldStandard) {
    // Gold Standard §7/§8: directions in words, no engine scores; timing from the dated dasha.
    lines.push(`PRIMARY FOCUS: ${db.primaryAspect}`);
    lines.push(`CAREER BREAKDOWN (direction of each area — say it in words, never as a number):`);
    db.aspects.forEach(a => {
      const pad = " ".repeat(Math.max(1, 18 - a.name.length));
      lines.push(`  ${a.name}:${pad}${a.direction}`);
    });
    lines.push(`OPPORTUNITY: ${db.opportunityNote}`);
    if (db.frictionNote) lines.push(`FRICTION: ${db.frictionNote}`);
    lines.push(`EVIDENCE STRENGTH: ${db.evidenceStrength ?? "Insufficient"}  ← say this in words; never a percentage`);
    lines.push(`TIMING: ${db.goldTiming ?? "dasha period not available"}  ← anchor timing ONLY to this period and the dates in CAREER CHART EVIDENCE; never give a number of days or weeks`);
  } else if (db.type === "career") {
    lines.push(`PRIMARY FOCUS: ${db.primaryAspect}`);
    lines.push(`CAREER BREAKDOWN (reference for direction — narrate naturally, don't list percentages mechanically):`);
    db.aspects.forEach(a => {
      const pad = " ".repeat(Math.max(1, 18 - a.name.length));
      lines.push(`  ${a.name}:${pad}${a.direction} (Signal: ${a.probability}/100)`);
    });
    lines.push(`OPPORTUNITY: ${db.opportunityNote}`);
    if (db.frictionNote) lines.push(`FRICTION: ${db.frictionNote}`);
    lines.push(`TIMING: ${db.timing ?? "No specific window yet"}  ← anchor your timeline to this, do not invent a different one`);
    lines.push(`OVERALL SIGNAL STRENGTH: ${db.overallProbability}/100`);
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
    if (db.goldStandard) {
      // Gold Standard §7/§8: evidence strength in words; timing from the dated dasha.
      lines.push(`EVIDENCE STRENGTH: ${db.evidenceStrength ?? "Insufficient"}  ← say this in words; never a percentage`);
      lines.push(`TIMING: ${db.goldTiming ?? "dasha period not available"}  ← anchor timing ONLY to this period and the dates in FINANCE CHART EVIDENCE; never give a number of days or weeks`);
    }
  }

  if (db.type === "property") {
    lines.push(`PRIMARY FOCUS: ${db.primaryFocus}`);
    lines.push(`DIRECTION: ${db.direction}`);
    if (db.manifestations.length) lines.push(`PROPERTY THEMES THE CHART RANKS HIGHEST: ${db.manifestations.join(" · ")}`);
    if (db.opportunity) lines.push(`OPPORTUNITY: ${db.opportunity}`);
    if (db.risk) lines.push(`RISK: ${db.risk}`);
    if (db.goldStandard) {
      lines.push(`EVIDENCE STRENGTH: ${db.evidenceStrength ?? "Insufficient"}  ← say this in words; never a percentage`);
      lines.push(`TIMING: ${db.goldTiming ?? "dasha period not available"}  ← anchor timing ONLY to this period and the dates in PROPERTY CHART EVIDENCE; never give a number of days or weeks`);
    }
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

  if (db.type === "spirituality") {
    lines.push(`KEY PLANET: ${db.keyPlanet}`);
    lines.push(`WHY NOW: ${db.whyNow}`);
    lines.push(`LIFE AREAS SUPPORTED: ${db.lifeAreasSupported.join(", ")}`);
    lines.push(`HOW LONG: ${db.duration}`);
    lines.push(`CONFIDENCE REASON: ${db.confidenceReason}`);
    lines.push(`BEST DAY: ${db.bestDay}`);
    lines.push(`MANTRA: ${db.mantra}`);
    lines.push(`CHARITY: ${db.charity}`);
    lines.push(`BEHAVIOUR: ${db.behaviour}`);
    lines.push(`AVOID: ${db.avoid}`);
    lines.push(`EXPECTED BENEFIT: ${db.expectedBenefit}`);
    if (db.secondaryPlanet) lines.push(`SECONDARY PLANET (mention briefly): ${db.secondaryPlanet}`);
  }

  // Planet context — why the key planet is relevant to THIS chart (chart-specific, not generic)
  if (brief.planetContext) {
    lines.push(`\nWHY THIS PLANET MATTERS FOR THIS CHART (use this to explain — it's specific to this person):\n  ${brief.planetContext}`);
  }

  // Top priorities — the 3 most important observations, scored by severity × confidence × novelty
  if (brief.topPriorities.length > 0) {
    lines.push(`\nTOP 3 PRIORITIES (address these, not everything above):`);
    brief.topPriorities.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
    lines.push(`  Do NOT mention lower-priority findings. Wisdom is knowing what to leave out.`);
  }

  // Follow-up vs fresh question
  if (isFollowUp) {
    lines.push(
      `\nFOLLOW-UP INSTRUCTION: The user already received the full diagnosis in a prior turn. ` +
      `Do NOT repeat the same content, the same opening, or the same conclusion.\n\n` +

      `CASE A — Their question lists specific areas to explore ` +
      `(e.g. "Is this about energy levels, sleep, digestion, or something else?"):\n` +
      `  → Pick ONE area from their list — whichever is most relevant from the DIAGNOSIS above.\n` +
      `  → Go deep on ONLY that one area. 2–3 paragraphs entirely about it.\n` +
      `  → Do NOT say "actually it's about [a different system]" — pick FROM what they listed.\n` +
      `  → Use personal body-part language: "your stomach", "how tired you feel", "your sleep quality".\n` +
      `  → Start: "Let's focus on [X] specifically..." or "Looking more closely at [X]..."\n\n` +

      `CASE B — Their question is a specific follow-up ("what about sleep?", "tell me more about digestion"):\n` +
      `  → Answer only that specific sub-question in 2–3 paragraphs.\n` +
      `  → Continue the conversation naturally:\n` +
      `  "Good follow-up — looking specifically at [X]..."\n` +
      `  "Building on what I said — if we isolate [X]..."\n` +
      `  "Interestingly, [X] isn't where the chart points..."\n\n` +

      `In both cases: body-part language only, never system names. Keep it to 2–3 paragraphs.`
    );
  } else {
    lines.push(`\nYOUR OPENING SENTENCE: "${brief.mainConclusion}"  ← START WITH THIS EXACTLY`);
  }

  // Mandatory surprise observation
  const surprise = brief.unexpectedObservation
    ?? (db.type !== "spirituality" && "surpriseObservation" in db ? db.surpriseObservation : null);
  if (surprise) {
    lines.push(
      `\nMANDATORY SURPRISE — include in paragraph 3, worded as a genuine discovery:\n` +
      `  "${surprise}"\n` +
      `  Use: "What actually caught my attention..." / "The part I wouldn't ignore..." / "One thing I didn't expect..."`
    );
  }

  lines.push(`\nCLOSING RECOMMENDATION: ${brief.recommendation}`);
  if (brief.remedies.length > 0) {
    lines.push(`ASTROLOGICAL REMEDIES (weave naturally into recommendation paragraph):`);
    brief.remedies.forEach(r => lines.push(`  • ${r}`));
  }

  return investigationBlock + lines.join("\n");
}
