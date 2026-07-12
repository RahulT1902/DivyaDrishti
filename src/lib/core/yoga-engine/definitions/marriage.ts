import { YogaDefinition } from "../../types";

// Marriage yoga definitions.
// These yogas describe structural chart patterns that indicate marriage quality,
// timing, and relationship karma.  They feed the yoga engine and eventually
// reach the Marriage Domain Engine via YogaBirthPromise / YogaActivation.
//
// Categories:
//   Kalathra Yoga  — auspicious benefic presence in 7th house
//   Vivaha Yoga    — 7th lord well-placed in kendra or trikona
//   Kalatra Dosha  — malefic occupancy of 7th; delays and karma

// ── Kalathra Yoga ────────────────────────────────────────────────────────────
// Natural benefic (Jupiter, Venus, or Moon) in the 7th house.
// Kalathra = "spouse" in Sanskrit — a planet here colors the quality of
// marriage and the nature of the partner.

export const KALATHRA_YOGA: YogaDefinition = {
  id:           "kalathra",
  name:         "Kalathra Yoga",
  sanskritName: "Kalathra",
  category:     "Misc",
  domains:      ["Marriage", "Partnership"],
  severity:     75,
  priority:     60,
  conditions: {
    type: "OR", rules: [
      { type: "PlanetInHouse", planet: "Jupiter", house: 7 },
      { type: "PlanetInHouse", planet: "Venus",   house: 7 },
      { type: "PlanetInHouse", planet: "Moon",    house: 7 },
    ],
  },
  modifiers: [
    {
      condition:     { type: "PlanetIsExalted", planet: "Venus" },
      strengthDelta: +18,
      description:   "Venus exalted in 7th — Kalathra Yoga at peak romantic potency",
    },
    {
      condition:     { type: "PlanetIsExalted", planet: "Jupiter" },
      strengthDelta: +15,
      description:   "Jupiter exalted in 7th — exceptionally blessed and protective marriage",
    },
    {
      condition:     { type: "PlanetIsCombust", planet: "Venus" },
      strengthDelta: -20,
      description:   "Venus combust — Kalathra Yoga weakened; romantic fulfillment reduced",
    },
    {
      condition:     { type: "PlanetIsCombust", planet: "Jupiter" },
      strengthDelta: -15,
      description:   "Jupiter combust — protective quality of Kalathra reduced",
    },
  ],
  description:
    "Natural benefic in 7th house — auspicious for marriage and partnership happiness; the spouse is likely educated, refined, or spiritually inclined.",
  classicalReference: "Brihat Parashara Hora Shastra, Kalathra Bhava",
};

// ── Vivaha Yoga ───────────────────────────────────────────────────────────────
// 7th lord placed in a kendra (1/4/7/10) or trikona (1/5/9) in the birth chart.
// A well-placed 7th lord ensures the marriage domain is fully activated
// and that partnership manifests in a timely, fulfilling way.

export const VIVAHA_YOGA: YogaDefinition = {
  id:           "vivaha",
  name:         "Vivaha Yoga",
  sanskritName: "Vivaha",
  category:     "Misc",
  domains:      ["Marriage", "Relationships"],
  severity:     70,
  priority:     61,
  conditions: {
    type: "OR", rules: [
      { type: "LordOfHouseInGroup", lordOf: 7, group: "Kendra"  },
      { type: "LordOfHouseInGroup", lordOf: 7, group: "Trikona" },
    ],
  },
  modifiers: [
    {
      condition:     { type: "LordOfHouseInHouse", lordOf: 7, inHouse: 7 },
      strengthDelta: +10,
      description:   "7th lord in own house — Vivaha Yoga strengthened by dignity",
    },
    {
      condition:     { type: "LordOfHouseInHouse", lordOf: 7, inHouse: 1 },
      strengthDelta: +8,
      description:   "7th lord in lagna — marriage is a defining life theme",
    },
  ],
  description:
    "7th lord placed in a kendra or trikona — marriage promise is strong and well-supported; partnership arrives at the right time with favorable conditions.",
  classicalReference: "Jataka Parijata, Vivaha Yoga",
};

// ── Kalatra Dosha ─────────────────────────────────────────────────────────────
// Saturn or Mars in the 7th house.
// "Dosha" = blemish or defect — this pattern introduces delays, friction,
// or karmic weight into marriage.  It is not permanently adverse; specific
// dasha periods can activate the positive dimension (enduring structure from
// Saturn, passion and energy from Mars).

export const KALATRA_DOSHA: YogaDefinition = {
  id:           "kalatra-dosha",
  name:         "Kalatra Dosha",
  sanskritName: "Kalatra Dosha",
  category:     "Misc",
  domains:      ["Marriage delays", "Relationship karma"],
  severity:     35,
  priority:     62,
  conditions: {
    type: "OR", rules: [
      { type: "PlanetInHouse", planet: "Saturn", house: 7 },
      { type: "PlanetInHouse", planet: "Mars",   house: 7 },
    ],
  },
  modifiers: [
    {
      condition:     { type: "PlanetIsExalted", planet: "Saturn" },
      strengthDelta: +12,
      description:   "Saturn exalted — Kalatra Dosha moderated; structured, enduring partnership is possible",
    },
    {
      condition:     { type: "PlanetIsExalted", planet: "Mars" },
      strengthDelta: +10,
      description:   "Mars exalted — assertive partner; conflict managed with strength and courage",
    },
    {
      condition:     { type: "PlanetIsDebilitated", planet: "Saturn" },
      strengthDelta: -15,
      description:   "Saturn debilitated in 7th — severe marriage delays or chronic partnership instability",
    },
    {
      condition:     { type: "PlanetIsDebilitated", planet: "Mars" },
      strengthDelta: -12,
      description:   "Mars debilitated — aggression or impulsiveness undermines relationship stability",
    },
  ],
  description:
    "Saturn or Mars in 7th house — delays, karmic weight, or friction in marriage; partner may be demanding, older, or bring responsibilities; remediation through awareness and patience is key.",
  classicalReference: "Phaladeepika, Kalatra Bhava Dosha",
};

export const MARRIAGE_YOGAS: YogaDefinition[] = [
  KALATHRA_YOGA, VIVAHA_YOGA, KALATRA_DOSHA,
];
