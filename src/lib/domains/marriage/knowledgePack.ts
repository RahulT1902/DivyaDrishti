import { DomainKnowledgePack } from "../../core/domain";

// MARRIAGE_KNOWLEDGE_PACK is the declarative configuration for the Marriage Domain Engine.
//
// Signal hierarchy (maps to user-visible scores):
//
//   Marriage Potential    → relationship-harmony hypothesis + MARRIAGE_POTENTIAL / MARRIAGE_VENUS / MARRIAGE_HARMONY
//   Partner Compatibility → relationship-harmony + wisdom-expansion + MARRIAGE_D9 / MARRIAGE_JUPITER
//   Romantic Harmony      → relationship-harmony + MARRIAGE_VENUS / MARRIAGE_LOVE / RELATIONSHIP_HARMONY
//   Marriage Stability    → discipline-perseverance + relationship-harmony + MARRIAGE_HARMONY / MARRIAGE_JUPITER
//   Relationship Timing   → relationship-harmony + MARRIAGE_POTENTIAL / MARRIAGE_D9
//   Delay Risk            → adversity-resilience + MARRIAGE_DELAY / MARRIAGE_KARMA
//
// Recommendation Templates fire when their triggerSignal meets their condition.
// The Marriage Engine generates no recommendations of its own — it delegates entirely here.

export const MARRIAGE_KNOWLEDGE_PACK: DomainKnowledgePack = {
  domain: "Marriage",

  signals: [
    {
      id:               "marriage-potential",
      label:            "Marriage Potential",
      description:      "Overall promise of a fulfilling, timely marriage in the birth chart",
      hypothesisIds:    ["relationship-harmony"],
      reasonCodes:      ["MARRIAGE_POTENTIAL", "MARRIAGE_VENUS", "MARRIAGE_HARMONY"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "partner-compatibility",
      label:            "Partner Compatibility",
      description:      "Compatibility and harmony with a life partner as shown by Navamsa and benefic influences",
      hypothesisIds:    ["relationship-harmony", "wisdom-expansion"],
      reasonCodes:      ["MARRIAGE_D9", "MARRIAGE_JUPITER"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "romantic-harmony",
      label:            "Romantic Harmony",
      description:      "Depth of romantic connection, attraction, and relational joy",
      hypothesisIds:    ["relationship-harmony"],
      reasonCodes:      ["MARRIAGE_VENUS", "MARRIAGE_LOVE", "RELATIONSHIP_HARMONY"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "marriage-stability",
      label:            "Marriage Stability",
      description:      "Long-term durability and structural strength of the marital bond",
      hypothesisIds:    ["discipline-perseverance", "relationship-harmony"],
      reasonCodes:      ["MARRIAGE_HARMONY", "MARRIAGE_JUPITER"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "relationship-timing",
      label:            "Relationship Timing",
      description:      "Auspiciousness of the current period for marriage or deepening partnership",
      hypothesisIds:    ["relationship-harmony"],
      reasonCodes:      ["MARRIAGE_POTENTIAL", "MARRIAGE_D9"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
    {
      id:               "delay-risk",
      label:            "Delay Risk",
      description:      "Likelihood of marriage delays or karmic obstacles to partnership",
      hypothesisIds:    ["adversity-resilience"],
      reasonCodes:      ["MARRIAGE_DELAY", "MARRIAGE_KARMA"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
  ],

  recommendations: [
    {
      id:              "act-on-marriage-potential",
      action:          "Actively pursue marriage during the current auspicious period",
      triggerSignalId: "marriage-potential",
      condition:       "very-high",
      priority:        "Critical",
      rationale:       "Marriage potential is very high — the chart strongly supports a fulfilling union; delay is inadvisable during this window.",
    },
    {
      id:              "invest-in-partnership",
      action:          "Deepen existing relationships or create conditions for a meaningful new partnership",
      triggerSignalId: "marriage-potential",
      condition:       "high",
      priority:        "High",
      rationale:       "Marriage potential is strong — this is a productive period for building and deepening romantic connections.",
    },
    {
      id:              "delay-risk-mitigation",
      action:          "Seek remediation and patience — marriage timing requires careful planning in this period",
      triggerSignalId: "delay-risk",
      condition:       "high",
      priority:        "High",
      rationale:       "Delay risk is elevated — karmic or structural obstacles are active; use this time for self-preparation rather than forcing timelines.",
    },
    {
      id:              "deepen-compatibility",
      action:          "Invest in understanding your partner's values, worldview, and spiritual nature",
      triggerSignalId: "partner-compatibility",
      condition:       "high",
      priority:        "Medium",
      rationale:       "Partner compatibility signal is strong — deepening mutual understanding at this time will yield long-term relationship rewards.",
    },
    {
      id:              "romantic-expression",
      action:          "Express affection openly and invest in romantic experiences — your capacity for love is heightened",
      triggerSignalId: "romantic-harmony",
      condition:       "high",
      priority:        "Medium",
      rationale:       "Romantic harmony is active — this is an ideal time for creative expression, romance, and deepening emotional bonds.",
    },
    {
      id:              "time-the-commitment",
      action:          "Formalize relationship commitments — current dasha timing supports marriage or deep partnership",
      triggerSignalId: "relationship-timing",
      condition:       "active-timing",
      priority:        "Critical",
      rationale:       "Relationship timing aligns with active dasha support — this is the optimal window for formalizing partnership commitments.",
    },
  ],
};
