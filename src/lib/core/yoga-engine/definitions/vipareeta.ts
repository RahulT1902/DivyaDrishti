import { YogaDefinition } from "../../types";

// Viparita Raja Yogas — "reverse" yogas formed when lords of Dusthana houses
// (6th, 8th, 12th) are placed in other Dusthana houses.  The debilitation of
// malefic houses cancels out, producing unexpected rise.
//
// Key caveat: the Dusthana lord must NOT be ALSO placed in a Kendra/Trikona,
// and must NOT be aspected by strong benefics — otherwise the yoga is diluted.
// Strength modifiers below capture this nuance.

const DUSTHANA_HOUSES = [6, 8, 12];

function dusthanaModifiers(planet: "6th" | "8th" | "12th") {
  return [
    {
      condition: { type: "LordOfHouseInGroup" as const, lordOf: parseInt(planet), group: "Kendra" as const },
      strengthDelta: -30,
      description: `Lord of ${planet} also in Kendra — Viparita yoga diluted`,
    },
    {
      condition: { type: "LordOfHouseInGroup" as const, lordOf: parseInt(planet), group: "Trikona" as const },
      strengthDelta: -20,
      description: `Lord of ${planet} in Trikona — Viparita yoga partially diluted`,
    },
  ];
}

// ── Harsha Yoga ───────────────────────────────────────────────────────────────
// Lord of the 6th in 6th, 8th, or 12th.

export const HARSHA_YOGA: YogaDefinition = {
  id: "harsha-yoga",
  name: "Harsha Yoga",
  sanskritName: "Harsha",
  category: "Vipareeta",
  domains: ["Victory over enemies", "Courage", "Health", "Hidden strength"],
  severity: 78,
  priority: 40,
  conditions: {
    type: "OR", rules: DUSTHANA_HOUSES.map(h => ({
      type: "LordOfHouseInHouse" as const,
      lordOf: 6,
      inHouse: h,
    })),
  },
  modifiers: dusthanaModifiers("6th"),
  description:
    "Lord of the 6th house placed in a Dusthana (6th, 8th, or 12th) — the enemy house lord destroys itself, conferring victory over adversaries, good health, and hidden resilience.",
  classicalReference: "Brihat Parashara Hora Shastra, Viparita Raja Yoga",
};

// ── Sarala Yoga ───────────────────────────────────────────────────────────────
// Lord of the 8th in 6th, 8th, or 12th.

export const SARALA_YOGA: YogaDefinition = {
  id: "sarala-yoga",
  name: "Sarala Yoga",
  sanskritName: "Sarala",
  category: "Vipareeta",
  domains: ["Longevity", "Fearlessness", "Hidden knowledge", "Crisis resilience"],
  severity: 80,
  priority: 41,
  conditions: {
    type: "OR", rules: DUSTHANA_HOUSES.map(h => ({
      type: "LordOfHouseInHouse" as const,
      lordOf: 8,
      inHouse: h,
    })),
  },
  modifiers: dusthanaModifiers("8th"),
  description:
    "Lord of the 8th house in a Dusthana — neutralizes hidden obstacles, conferring longevity, fearlessness, and strength in times of crisis.",
  classicalReference: "Brihat Parashara Hora Shastra, Viparita Raja Yoga",
};

// ── Vimala Yoga ───────────────────────────────────────────────────────────────
// Lord of the 12th in 6th, 8th, or 12th.

export const VIMALA_YOGA: YogaDefinition = {
  id: "vimala-yoga",
  name: "Vimala Yoga",
  sanskritName: "Vimala",
  category: "Vipareeta",
  domains: ["Freedom from debt", "Spiritual liberation", "Peaceful endings", "Savings"],
  severity: 75,
  priority: 42,
  conditions: {
    type: "OR", rules: DUSTHANA_HOUSES.map(h => ({
      type: "LordOfHouseInHouse" as const,
      lordOf: 12,
      inHouse: h,
    })),
  },
  modifiers: dusthanaModifiers("12th"),
  description:
    "Lord of the 12th in a Dusthana — expenses and losses are contained; spiritual liberation is accessed through controlled renunciation rather than forced sacrifice.",
  classicalReference: "Brihat Parashara Hora Shastra, Viparita Raja Yoga",
};

export const VIPAREETA_YOGAS: YogaDefinition[] = [HARSHA_YOGA, SARALA_YOGA, VIMALA_YOGA];
