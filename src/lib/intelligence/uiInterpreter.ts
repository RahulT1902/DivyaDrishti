import { MasterSignal } from "./resolver";
import { ActionableSignal } from "./interpreter";

export type Domain = "career" | "finance" | "health" | "relationships" | "self";

export interface DomainInput {
  score: number;
  activation: "PEAK" | "ACTIVE" | "DORMANT";
}

export interface ExperiencePayload {
  snapshot: {
    title: string;
    message: string;
  };
  guidance: {
    focus: string;
    avoid: string;
    time: string;
  };
  domains: Record<Domain, {
    state: string;
    message: string;
  }>;
  phase: {
    name: string;
    message: string;
  };
}

/**
 * The Astrologer Voice.
 * Translates quantitative intelligence into human-centric experiences.
 */
export function generateExperience(
  master: MasterSignal, 
  signals: ActionableSignal[], 
  dasha: { md: string, ad: string }
): ExperiencePayload {
  
  // 1. Snapshot Generation
  const snapshot = getSnapshot(master);

  // 2. Guidance Generation
  const guidance = {
    focus: master.favor[0] || "General Growth",
    avoid: master.avoid[0] || "Impulsive Actions",
    time: master.tradableWindow !== "N/A" ? master.tradableWindow : "Steady Flow Throughout Day"
  };

  // 3. Domain Interpretation
  // In a real scenario, we'd calculate these activations based on house-lord transits.
  // For now, we use a mapping based on current planetary strengths.
  const domains: ExperiencePayload["domains"] = {
    career: interpretDomain("career", { score: 75, activation: getActivation(master, ["Saturn", "Sun", "Mars"]) }),
    finance: interpretDomain("finance", { score: 60, activation: getActivation(master, ["Jupiter", "Venus"]) }),
    health: interpretDomain("health", { score: 50, activation: getActivation(master, ["Sun", "Moon", "Mars"]) }),
    relationships: interpretDomain("relationships", { score: 80, activation: getActivation(master, ["Venus", "Moon"]) }),
    self: interpretDomain("self", { score: 90, activation: getActivation(master, ["Sun", "Jupiter"]) })
  };

  // 4. Phase Storytelling
  const phase = {
    name: `${dasha.md} – ${dasha.ad} Period`,
    message: getDashaMessage(dasha.md, dasha.ad)
  };

  return {
    snapshot,
    guidance,
    domains,
    phase
  };
}

function getSnapshot(master: MasterSignal) {
  if (master.state === "AGGRESSIVE") {
    return {
      title: "Growth & Opportunity",
      message: "Today brings a surge of cosmic support. A favorable day for bold initiatives and moving forward with purpose."
    };
  } else if (master.state === "RESTRICTIVE") {
    return {
      title: "Protection & Review",
      message: "The heavens advise a steady, cautious approach. Use today for auditing, risk management, and internal stability."
    };
  } else {
    return {
      title: "Steady Flow",
      message: "A day of quiet observation. Maintain your current path and look for subtle openings rather than forced moves."
    };
  }
}

function getActivation(master: MasterSignal, relatedPlanets: string[]): "PEAK" | "ACTIVE" | "DORMANT" {
  if (relatedPlanets.includes(master.dominantPlanet)) {
    return master.confidence > 70 ? "PEAK" : "ACTIVE";
  }
  return "DORMANT";
}

export function interpretDomain(domain: Domain, input: DomainInput) {
  const { activation } = input;

  const map = {
    PEAK: {
      title: "Power Phase",
      theme: "bold",
    },
    ACTIVE: {
      title: "Growth Phase",
      theme: "steady",
    },
    DORMANT: {
      title: "Steady Phase",
      theme: "cautious",
    },
  };

  const messages: Record<Domain, Record<string, string>> = {
    career: {
      PEAK: "Your professional influence is at a peak. Take lead on new projects.",
      ACTIVE: "Steady progress in your career path. Focus on refined execution.",
      DORMANT: "A period of internal consolidation. Plan your next moves silently."
    },
    finance: {
      PEAK: "Wealth indicators are strong. Strategic investments or gains are favored.",
      ACTIVE: "Maintain discipline. Financial growth comes from consistency.",
      DORMANT: "Preserve and protect. Avoid speculative risks right now."
    },
    health: {
      PEAK: "Vitality is high. Excellent time for physical activity and energy work.",
      ACTIVE: "Stable wellness. Keep your daily routine consistent.",
      DORMANT: "Rest and rejuvenation are prioritized. Listen to your body's limits."
    },
    relationships: {
      PEAK: "Deep emotional resonance. Favors heart-centered communication.",
      ACTIVE: "Harmony is supported. Good for social interactions and bonding.",
      DORMANT: "Seek solitude or low-key interactions. Reflect on boundaries."
    },
    self: {
      PEAK: "Clarity of soul purpose. A time of high self-awareness and power.",
      ACTIVE: "Personal growth is steady. You are aligned with your intentions.",
      DORMANT: "Introspective phase. Trust the slow unfolding of your identity."
    }
  };

  return {
    state: map[activation].title,
    message: messages[domain][activation]
  };
}

function getDashaMessage(md: string, ad: string): string {
  const pairs: Record<string, string> = {
    "Jupiter-Venus": "Expansion through relationships, comfort, and creative learning.",
    "Jupiter-Saturn": "Balanced growth through discipline and structural change.",
    "Mars-Mercury": "Surge in analytical energy. Quick decisions meet sharp logic.",
    "Saturn-Rahu": "Intense structural shifts. Ambition meets karmic pressure.",
    "Sun-Moon": "Harmony between external purpose and internal needs."
  };

  const key = `${md}-${ad}`;
  return pairs[key] || "A period of unique transformation and evolutionary growth.";
}
