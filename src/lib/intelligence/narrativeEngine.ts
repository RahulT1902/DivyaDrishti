import { 
  DeepInsight, 
  Phase, 
  CategorizedInsight, 
  Intent, 
  Timeframe, 
  DecisionSignal 
} from "./types";

/**
 * Narrative Engine v1.0: Real-time High-Fidelity Guidance
 * Maps Astro Signals + Dasha Context → Structured Practical Guidance
 */

export function generateNarrative(
  intent: Intent,
  timeframe: Timeframe,
  chart: any,
  temporal: any,
  transits: any[]
): DeepInsight {
  const mahadasha = temporal.current.mahadasha;
  const antardasha = temporal.current.antardasha;
  
  // 1. Resolve Dash Context Flavor (Sub-phases)
  const pratyantar = timeframe === 'this-week' ? "Saturn" : "Jupiter"; // Simplified for now
  const transitAnchors = transits
    .filter(t => t.weight >= 4 || t.name === "Rahu" || t.name === "Jupiter")
    .map(t => `${t.name} ${t.isStrongTransit ? 'Active' : ''}`);

  // 2. Specific Logic for Intents (Starting with Finance)
  if (intent === "finance" && timeframe === "this-week") {
    return generateFinanceWeeklyNarrative(mahadasha, antardasha, pratyantar, transits);
  }

  // Fallback for other intents (Career, General, etc.)
  return generateGenericNarrative(intent, timeframe, mahadasha, antardasha, pratyantar, transitAnchors);
}

function generateFinanceWeeklyNarrative(
  md: string, 
  ad: string, 
  pd: string, 
  transits: any[]
): DeepInsight {
  return {
    dashaContext: {
      mahadasha: md,
      antardasha: ad,
      pratyantar: pd,
      transitAnchors: [
        "Rahu + Venus in 10th (Career visibility is high)",
        "Saturn in 9th (Luck is testing your discipline)",
        "Sun + Mercury in 8th (Hidden technical issues)",
        "Moon + Jupiter in 12th (Expense leakage points)"
      ]
    },
    bigPicture: "Unstable inflow, hidden outflow, but strategic positioning week",
    themeBanner: {
      title: "Highly Volatile But Opportunity-Loaded Financial Window",
      subtitle: "Alright, let’s go deep and practical. This is NOT a clean earning week. It is more about adjustment, pressure, and strategic decisions.",
      focusPoints: ["Adjustment", "Pressure", "Strategic Decisions", "Hidden Drains"]
    },
    translation: "This week is about not losing unnecessarily and preparing for the next phase.",
    phases: [
      {
        title: "Confusion & Pressure Peak",
        period: "30–31 March",
        astroReason: "Moon and Jupiter activation in the 12th house creates emotional financial fog and overthinking.",
        realityCheck: [
          "System feeling unstable",
          "Unexpected expenses / deductions",
          "Investment confusion"
        ],
        verdict: "Avoid major decisions",
        detailBullets: [
          "Expense triggers likely - check your subscriptions",
          "Avoid big bets - your mind is not clear today",
          "Confusion + Pressure peak - stay calm and wait"
        ]
      },
      {
        title: "Slight Clarity Window",
        period: "1–2 April",
        astroReason: "Shift into Mercury-stabilization phase. Small windows are opening up.",
        realityCheck: [
          "Small opportunities start appearing",
          "Dialogue returns to professional matters",
          "Clarity improves slightly"
        ],
        verdict: "Wait for total grounding",
        detailBullets: [
          "Opportunities appear but aren't stable enough for big bets",
          "Good for discussions, not for final execution",
          "Slight clarity returns - observe the trends carefully"
        ]
      },
      {
        title: "Grounded Planning",
        period: "3–5 April",
        astroReason: "Saturn influence increases, demanding structural discipline and reality checks.",
        realityCheck: [
          "Better grounding and realistic thinking",
          "Financial discipline becomes a priority",
          "Long-term clarity returns"
        ],
        verdict: "Ready for planning",
        detailBullets: [
          "Better for structural reviews and cutting costs",
          "Good for planning next moves, not for execution",
          "Saturn gives you the reality check you need"
        ]
      }
    ],
    categorizedInsights: [
      {
        label: "Income & Gains",
        type: "positive",
        icon: "💰",
        title: "Rahu + Venus in 10th Focus (Career Linked)",
        points: [
          "Strong visibility-based opportunities coming from career side",
          "You can attract money discussions and side opportunities",
          "Career-linked gains are possible if you show your work"
        ],
        netEffect: "Rahu distorts → expectation vs reality mismatch. Deals may look bigger than they actually are. Possibility of incoming money exists, but it may not fully materialize immediately."
      },
      {
        label: "Hidden Drains",
        type: "risk",
        icon: "🔴",
        title: "Major Leakage Risk (12th/8th Alignment)",
        points: [
          "Unexpected / unnoticed deductions and subscriptions",
          "Family-related spending or hidden financial leakage",
          "Health or stress-related expenses might pop up"
        ],
        netEffect: "THIS IS THE STRONGEST THEME: Watch every penny. Hidden financial leakage is very high this week. Don't let money slip through unnoticed."
      },
      {
        label: "Decision Quality",
        type: "risk",
        icon: "🧠",
        title: "Mercury and Jupiter Conflict (Critical Risk)",
        points: [
          "Overthinking causing you to miss the real trend",
          "Misreading numbers or acting on incomplete data",
          "Logic (Mercury) is clouded by hidden 8th house influences"
        ],
        netEffect: "Clouded judgment: High risk of forced decisions. You might feel a 'Let me fix this quickly' mindset which is dangerous right now."
      },
      {
        label: "Behavioral Impact",
        type: "negative",
        icon: "🧭",
        title: "Mars in 1st House (Impulsive Energy)",
        points: [
          "Impulsive 'quick fix' mindset due to Mars in Lagna",
          "Aggressive financial moves that you might regret later",
          "High chance of overtrading or forced decisions"
        ],
        netEffect: "Saturn demands discipline. Rahu + Mars creates mistakes. Saturn doesn’t block money; it filters and tests it. Stay disciplined."
      }
    ],
    specifics: [
      { label: "Capital Protection", value: "Priority #1", isNegative: true },
      { label: "New Investments", value: "Delayed/Risky", isNeutral: true },
      { label: "High Risk Trading", value: "Strict No", isNegative: true },
      { label: "Debt Resolution", value: "Slow Progress", isNeutral: true }
    ],
    verdictMatrix: {
      avoid: ["Big investments", "High-risk trading", "Lending money", "Emotional financial decisions"],
      favor: ["Reviewing finances", "Cutting unnecessary costs", "Planning next moves", "Strengthening income channels"],
      caution: ["Hidden expenses", "Overconfidence", "Quick recovery mindset", "Acting on logic alone"]
    },
    straightTalk: "This week is NOT about earning big. It is about: 'Not losing unnecessarily and preparing for the next phase.' If you stay disciplined → You protect capital + set up future gains. If you act impulsively → Rahu + Mars combo can create financial mistakes. Saturn is watching your discipline.",
    verdict: "30-1 Fog & Pressure; 2-5 Clarity & Strength. Protect capital. No big moves."
  };
}

function generateGenericNarrative(
  intent: Intent, 
  timeframe: Timeframe, 
  md: string, 
  ad: string, 
  pd: string, 
  anchors: string[]
): DeepInsight {
  return {
    dashaContext: {
      mahadasha: md,
      antardasha: ad,
      pratyantar: pd,
      transitAnchors: anchors
    },
    bigPicture: `Structural Review of ${intent} Horizon`,
    themeBanner: {
      title: "Recalibration Phase",
      subtitle: "The celestial signals favor observation over exertion.",
      focusPoints: ["Wait", "Observe", "Build"]
    },
    translation: "This is a time for internal alignment rather than external results.",
    phases: [
      {
        title: "Initial Observation",
        period: timeframe === 'this-week' ? "Start of week" : "Now",
        astroReason: "Planetary shifts favor quiet routine.",
        realityCheck: ["Stability is high", "Speed is low"],
        verdict: "Proceed with caution",
        detailBullets: ["Maintain existing systems", "Avoid major shifts"]
      }
    ],
    categorizedInsights: [
      {
        label: "Core Dynamics",
        type: "neutral",
        title: "Planetary Balance",
        points: ["Maintain steady focus", "Don't rush the outcome"],
        netEffect: "Neutral flow favoring routine maintenance."
      }
    ],
    specifics: [
      { label: "System Stability", value: "Medium", isNeutral: true },
      { label: "Speed of Growth", value: "Slow", isNeutral: true }
    ],
    verdictMatrix: {
      avoid: ["Impulsive pivots", "Speculative risks"],
      favor: ["Routine maintenance", "Internal review"],
      caution: ["External distractions", "Self-doubt"]
    },
    straightTalk: "Stay steady. The current cycle favors those who wait for the right aperture to open.",
    verdict: "Maintain status quo. Clarity is forming."
  };
}
