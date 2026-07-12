import { DomainKnowledgePack } from "../../core/domain";

// HEALTH_KNOWLEDGE_PACK is the declarative configuration for the Health Domain Engine.
//
// Signal hierarchy (maps to user-visible scores):
//
//   Constitution     → physical-vitality hypothesis + HEALTH_VITALITY / HEALTH_CONSTITUTION
//   Immunity         → physical-vitality + adversity-resilience + HEALTH_IMMUNITY / HEALTH_RECOVERY
//   Mental Health    → physical-vitality + HEALTH_MENTAL
//   Longevity        → discipline-perseverance + HEALTH_LONGEVITY / HEALTH_CHRONIC
//   Recovery         → adversity-resilience + HEALTH_RECOVERY / HEALTH_IMMUNITY
//   Chronic Risk     → adversity-resilience + HEALTH_CHRONIC / HEALTH_VULNERABILITY
//
// Note: D6 (Shashtamsha) is not yet in ChartSuite — all signals are D1-based.
// Phase A will add D6 reason codes to immunity, longevity, and chronic-risk signals,
// improving their scoring accuracy and confidence.
//
// Recommendation Templates fire when their triggerSignal meets their condition.
// The Health Engine generates no recommendations of its own — it delegates entirely here.

export const HEALTH_KNOWLEDGE_PACK: DomainKnowledgePack = {
  domain: "Health",

  signals: [
    {
      id:               "constitution",
      label:            "Constitution Strength",
      description:      "Overall bodily vitality, physical resilience, and constitutional baseline",
      hypothesisIds:    ["physical-vitality"],
      reasonCodes:      ["HEALTH_VITALITY", "HEALTH_CONSTITUTION"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "immunity",
      label:            "Immunity Resilience",
      description:      "Capacity to fight disease, resist infection, and maintain physiological balance",
      hypothesisIds:    ["physical-vitality", "adversity-resilience"],
      reasonCodes:      ["HEALTH_IMMUNITY", "HEALTH_RECOVERY"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "mental-health",
      label:            "Mental Health",
      description:      "Emotional stability, psychological resilience, and digestive equilibrium",
      hypothesisIds:    ["physical-vitality"],
      reasonCodes:      ["HEALTH_MENTAL"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
    {
      id:               "longevity",
      label:            "Longevity Indicator",
      description:      "Long-term vitality, life-span support, and chronic-disease resilience",
      hypothesisIds:    ["discipline-perseverance"],
      reasonCodes:      ["HEALTH_LONGEVITY", "HEALTH_CHRONIC"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "recovery-capacity",
      label:            "Recovery Capacity",
      description:      "Speed and completeness of recovery from illness, surgery, or stress",
      hypothesisIds:    ["adversity-resilience"],
      reasonCodes:      ["HEALTH_RECOVERY", "HEALTH_IMMUNITY"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
    {
      id:               "chronic-risk",
      label:            "Chronic Risk",
      description:      "Susceptibility to long-term, recurring, or structural health conditions",
      hypothesisIds:    ["adversity-resilience"],
      reasonCodes:      ["HEALTH_CHRONIC", "HEALTH_VULNERABILITY"],
      hypothesisWeight: 0.50,
      inferenceWeight:  0.50,
    },
  ],

  recommendations: [
    {
      id:              "leverage-strong-constitution",
      action:          "Invest in preventive health practices to sustain your strong constitutional foundation",
      triggerSignalId: "constitution",
      condition:       "high",
      priority:        "Medium",
      rationale:       "Constitution signal is strong — proactive wellness practices compound well on a robust physiological baseline.",
    },
    {
      id:              "immunity-building",
      action:          "Prioritize immunity-building routines: sleep, seasonal diet, and stress management",
      triggerSignalId: "immunity",
      condition:       "low",
      priority:        "High",
      rationale:       "Immunity signal is low — the physiological defense system requires deliberate reinforcement.",
    },
    {
      id:              "mental-health-support",
      action:          "Establish regular mental wellness practices: meditation, journaling, or professional support",
      triggerSignalId: "mental-health",
      condition:       "low",
      priority:        "High",
      rationale:       "Mental health signal is low — emotional and psychological stability is the most immediate health priority.",
    },
    {
      id:              "longevity-focus",
      action:          "Adopt structured longevity practices: regular health screenings, bone health, and chronic-disease prevention",
      triggerSignalId: "longevity",
      condition:       "low",
      priority:        "High",
      rationale:       "Longevity signal is low — long-term structural health requires proactive attention and periodic medical review.",
    },
    {
      id:              "chronic-risk-management",
      action:          "Engage in active chronic-risk management: track symptoms, avoid overexertion, maintain medical monitoring",
      triggerSignalId: "chronic-risk",
      condition:       "active-timing",
      priority:        "Critical",
      rationale:       "Chronic risk is active during the current timing window — heightened vigilance over recurrent or structural health issues is warranted now.",
    },
    {
      id:              "recovery-facilitation",
      action:          "Allow adequate recovery time after illness or physical exertion — resist the urge to rush back to full activity",
      triggerSignalId: "recovery-capacity",
      condition:       "low",
      priority:        "High",
      rationale:       "Recovery capacity signal is low — the body's recuperative mechanisms need additional time and supportive conditions.",
    },
  ],
};
