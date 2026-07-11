import { DomainKnowledgePack } from "../../core/domain";

// CAREER_KNOWLEDGE_PACK is the declarative configuration for the Career Domain Engine.
//
// Signal hierarchy (maps to user-visible scores):
//
//   Leadership          → leadership-potential hypothesis + CAREER_AUTHORITY reason codes
//   Authority           → leadership-potential + discipline-perseverance + CAREER_GOVERNMENT
//   Recognition         → leadership-potential + communication-excellence + CAREER_RECOGNITION
//   Entrepreneurship    → leadership-potential + physical-vitality + adversity-resilience
//   Job Stability       → discipline-perseverance + adversity-resilience + CAREER_DISCIPLINE
//   Promotion Potential → leadership-potential + discipline-perseverance + 10TH_LORD_STRONG
//   Professional Growth → wisdom-expansion + communication-excellence + CAREER_WISDOM
//   Risk Tolerance      → physical-vitality + adversity-resilience + CAREER_MARTIAL
//
// Recommendation Templates fire when their triggerSignal meets their condition.
// The Career Engine generates no recommendations of its own — it delegates entirely here.

export const CAREER_KNOWLEDGE_PACK: DomainKnowledgePack = {
  domain: "Career",

  signals: [
    {
      id:               "leadership",
      label:            "Leadership",
      description:      "Capacity to lead, inspire, and manage others",
      hypothesisIds:    ["leadership-potential"],
      reasonCodes:      ["CAREER_AUTHORITY", "CAREER_RECOGNITION", "YOGAKARAKA_STRONG", "MANAGEMENT_APTITUDE"],
      hypothesisWeight: 0.70,
      inferenceWeight:  0.30,
    },
    {
      id:               "authority",
      label:            "Authority",
      description:      "Formal power, government roles, institutional status",
      hypothesisIds:    ["leadership-potential", "discipline-perseverance"],
      reasonCodes:      ["CAREER_AUTHORITY", "CAREER_GOVERNMENT", "10TH_LORD_STRONG"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "recognition",
      label:            "Recognition",
      description:      "Public acknowledgment, awards, professional reputation",
      hypothesisIds:    ["leadership-potential", "communication-excellence"],
      reasonCodes:      ["CAREER_RECOGNITION", "CAREER_SUCCESS", "OVERALL_POSITIVE"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "entrepreneurship",
      label:            "Entrepreneurship",
      description:      "Capacity to start and run independent ventures",
      hypothesisIds:    ["leadership-potential", "physical-vitality", "adversity-resilience"],
      reasonCodes:      ["CAREER_MARTIAL", "CAREER_LEADERSHIP", "CAREER_AUTHORITY"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "job-stability",
      label:            "Job Stability",
      description:      "Consistency in employment and satisfaction in structured service roles",
      hypothesisIds:    ["discipline-perseverance", "adversity-resilience"],
      reasonCodes:      ["CAREER_DISCIPLINE", "CAREER_GOVERNMENT"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "promotion-potential",
      label:            "Promotion Potential",
      description:      "Likelihood of advancement within an existing career path",
      hypothesisIds:    ["leadership-potential", "discipline-perseverance"],
      reasonCodes:      ["10TH_LORD_STRONG", "CAREER_SUCCESS", "CAREER_AUTHORITY"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "professional-growth",
      label:            "Professional Growth",
      description:      "Capacity for skill development, learning, and domain expansion",
      hypothesisIds:    ["wisdom-expansion", "communication-excellence"],
      reasonCodes:      ["CAREER_WISDOM", "CAREER_TEACHING", "CAREER_ADVISORY", "HIGH_CHART_QUALITY"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "risk-tolerance",
      label:            "Risk Tolerance",
      description:      "Willingness and capacity to take calculated career risks",
      hypothesisIds:    ["physical-vitality", "adversity-resilience"],
      reasonCodes:      ["CAREER_MARTIAL", "CAREER_LEADERSHIP"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
  ],

  recommendations: [
    {
      id:              "pursue-leadership",
      action:          "Apply for leadership or management positions",
      triggerSignalId: "leadership",
      condition:       "high",
      priority:        "High",
      rationale:       "Leadership signal is strong — positional and functional planetary support is aligned for authority roles.",
    },
    {
      id:              "seek-authority-role",
      action:          "Pursue roles with formal authority or institutional backing",
      triggerSignalId: "authority",
      condition:       "very-high",
      priority:        "Critical",
      rationale:       "Authority signal is very high — government, institutional, or senior executive roles are particularly well-supported.",
    },
    {
      id:              "launch-venture",
      action:          "Launch or significantly expand an independent venture",
      triggerSignalId: "entrepreneurship",
      condition:       "high",
      priority:        "High",
      rationale:       "Entrepreneurship signal is strong — the chart supports self-directed work and independent enterprise.",
    },
    {
      id:              "invest-in-growth",
      action:          "Invest in professional development, certifications, or advanced training",
      triggerSignalId: "professional-growth",
      condition:       "high",
      priority:        "Medium",
      rationale:       "Strong growth signal — educational investments compound particularly well in this period.",
    },
    {
      id:              "visibility-campaign",
      action:          "Position for public visibility, speaking engagements, or field recognition",
      triggerSignalId: "recognition",
      condition:       "high",
      priority:        "Medium",
      rationale:       "Recognition signal is active — efforts to raise your professional profile will be well-received.",
    },
    {
      id:              "time-the-promotion-ask",
      action:          "Request promotion or formal advancement during current dasha window",
      triggerSignalId: "promotion-potential",
      condition:       "active-timing",
      priority:        "Critical",
      rationale:       "Promotion signal aligns with active dasha support — this is the optimal window for formal advancement.",
    },
    {
      id:              "stabilize-before-change",
      action:          "Consolidate current position before pursuing a career change",
      triggerSignalId: "job-stability",
      condition:       "low",
      priority:        "High",
      rationale:       "Low stability signal — this is a foundation-building phase, not a transition phase.",
    },
    {
      id:              "avoid-high-risk-moves",
      action:          "Avoid high-risk career moves, abrupt departures, or impulsive launches",
      triggerSignalId: "risk-tolerance",
      condition:       "blocked",
      priority:        "Critical",
      rationale:       "Blocked timing or low support — impulsive career changes carry elevated downside risk.",
    },
  ],
};
