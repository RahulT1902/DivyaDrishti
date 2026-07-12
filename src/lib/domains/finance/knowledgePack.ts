import { DomainKnowledgePack } from "../../core/domain";

// FINANCE_KNOWLEDGE_PACK is the declarative configuration for the Finance Domain Engine.
//
// Signal hierarchy (maps to user-visible scores):
//
//   Wealth Accumulation  → wealth-generation hypothesis + WEALTH_ACCUMULATION / WEALTH_DHANA / FINANCIAL_STABILITY
//   Income Potential     → wealth-generation + discipline-perseverance + INCOME_GAINS / WEALTH_FORTUNE
//   Investment Aptitude  → wisdom-expansion + wealth-generation + WEALTH_JUPITER / WEALTH_FORTUNE
//   Financial Stability  → discipline-perseverance + FINANCIAL_STABILITY / WEALTH_ACCUMULATION
//   Luck Factor          → wealth-generation + spiritual-inclination + WEALTH_FORTUNE / INCOME_GAINS
//   Debt Risk            → adversity-resilience + WEALTH_CHALLENGE
//
// The Finance domain's signals tap into the Wealth inference conclusions through
// the hypothesis system. The hypothesis "wealth-generation" (domains: Finance:0.95)
// is populated from WEALTH_RULES conclusions (domain "Wealth") — hypotheses
// accumulate from ALL inference conclusions cross-domain.
//
// Wealth reason codes from WEALTH_RULES:
//   WEALTH_DHANA, WEALTH_ACCUMULATION, INCOME_GAINS, FINANCIAL_STABILITY,
//   WEALTH_JUPITER, WEALTH_VENUS, WEALTH_CHALLENGE, WEALTH_FORTUNE

export const FINANCE_KNOWLEDGE_PACK: DomainKnowledgePack = {
  domain: "Finance",

  signals: [
    {
      id:               "wealth-accumulation",
      label:            "Wealth Accumulation",
      description:      "Capacity to accumulate and preserve material wealth over time",
      hypothesisIds:    ["wealth-generation"],
      reasonCodes:      ["WEALTH_ACCUMULATION", "WEALTH_DHANA", "FINANCIAL_STABILITY"],
      hypothesisWeight: 0.65,
      inferenceWeight:  0.35,
    },
    {
      id:               "income-potential",
      label:            "Income Potential",
      description:      "Capacity to generate recurring income and sustained financial inflows",
      hypothesisIds:    ["wealth-generation", "discipline-perseverance"],
      reasonCodes:      ["INCOME_GAINS", "WEALTH_FORTUNE"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "investment-aptitude",
      label:            "Investment Aptitude",
      description:      "Ability to make sound financial decisions and beneficial investments",
      hypothesisIds:    ["wisdom-expansion", "wealth-generation"],
      reasonCodes:      ["WEALTH_JUPITER", "WEALTH_FORTUNE"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
    {
      id:               "financial-stability",
      label:            "Financial Stability",
      description:      "Long-term stability, consistency of resources, and financial resilience",
      hypothesisIds:    ["discipline-perseverance"],
      reasonCodes:      ["FINANCIAL_STABILITY", "WEALTH_ACCUMULATION"],
      hypothesisWeight: 0.55,
      inferenceWeight:  0.45,
    },
    {
      id:               "luck-factor",
      label:            "Luck Factor",
      description:      "Fortune, divine blessings, and luck-based financial gains",
      hypothesisIds:    ["wealth-generation", "spiritual-inclination"],
      reasonCodes:      ["WEALTH_FORTUNE", "INCOME_GAINS"],
      hypothesisWeight: 0.60,
      inferenceWeight:  0.40,
    },
    {
      id:               "debt-risk",
      label:            "Debt Risk",
      description:      "Susceptibility to financial liabilities, debt accumulation, and resource drain",
      hypothesisIds:    ["adversity-resilience"],
      reasonCodes:      ["WEALTH_CHALLENGE"],
      hypothesisWeight: 0.50,
      inferenceWeight:  0.50,
    },
  ],

  recommendations: [
    {
      id:              "exceptional-wealth-period",
      action:          "Pursue major wealth-building opportunities — this period has exceptional financial potential",
      triggerSignalId: "wealth-accumulation",
      condition:       "very-high",
      priority:        "Critical",
      rationale:       "Wealth accumulation signal is very high — natal promise and current activation align for significant wealth-building moves.",
    },
    {
      id:              "income-expansion",
      action:          "Expand income streams — seek new revenue channels or increase primary income",
      triggerSignalId: "income-potential",
      condition:       "high",
      priority:        "High",
      rationale:       "Strong income potential — chart supports new financial inflows and income growth.",
    },
    {
      id:              "investment-action",
      action:          "Commit to planned investments — analytical and timing conditions are favorable",
      triggerSignalId: "investment-aptitude",
      condition:       "high",
      priority:        "High",
      rationale:       "High investment aptitude — wisdom and fortune indicators align for sound financial commitments.",
    },
    {
      id:              "financial-foundation",
      action:          "Focus on financial foundation-building — save, reduce liabilities, and consolidate assets",
      triggerSignalId: "financial-stability",
      condition:       "low",
      priority:        "High",
      rationale:       "Low stability signal — this is a phase for consolidation and conservative financial management, not expansion.",
    },
    {
      id:              "debt-avoidance",
      action:          "Avoid new debt obligations — financial vulnerability is elevated",
      triggerSignalId: "debt-risk",
      condition:       "high",
      priority:        "Critical",
      rationale:       "Elevated debt risk — chart indicates financial strain patterns; avoid liabilities and over-extension.",
    },
    {
      id:              "fortune-acting",
      action:          "Act on financial opportunities quickly — luck factor is active and dasha-supported",
      triggerSignalId: "luck-factor",
      condition:       "active-timing",
      priority:        "Critical",
      rationale:       "Luck factor aligns with active dasha support — fortune-driven financial gains are currently accessible.",
    },
    {
      id:              "wealth-preservation",
      action:          "Protect and preserve existing wealth — hold rather than speculate",
      triggerSignalId: "wealth-accumulation",
      condition:       "blocked",
      priority:        "High",
      rationale:       "Blocked wealth accumulation — preserve current assets and avoid speculative moves until signals improve.",
    },
    {
      id:              "income-diversification",
      action:          "Diversify income sources to reduce single-stream dependence",
      triggerSignalId: "income-potential",
      condition:       "low",
      priority:        "Medium",
      rationale:       "Low income potential — spreading across multiple income streams reduces financial risk in this phase.",
    },
  ],
};
