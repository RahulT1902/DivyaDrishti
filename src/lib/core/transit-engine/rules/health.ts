import { TransitRule, TransitEvidence, TRANSIT_DURATIONS } from "../types";

// Health transit inference rules.
//
// Each rule converts a TransitFact into TransitEvidence that flows into
// the ActivationEngine's transit component.
//
// Design contract:
//   - scoreDelta range: -30 (severe challenge) to +30 (strong support)
//   - Duration comes from TRANSIT_DURATIONS — the Moon drives day-to-day changes,
//     Saturn drives multi-year patterns
//   - Keep the conclude() pure: no I/O, no side effects

export const HEALTH_TRANSIT_RULES: TransitRule[] = [

  // ── Moon transits ──────────────────────────────────────────────────────────
  // Duration: ~2.5 days.  These are the primary drivers of today ≠ tomorrow.

  {
    id:       "transit-moon-1st-health",
    domain:   "Health",
    priority: 10,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 1,
    conclude: fact => ({
      ruleId:      "transit-moon-1st-health",
      domain:      "Health",
      label:       "Moon in lagna: Physical vitality elevated",
      description: "Transiting Moon in the 1st house strengthens the body's energy and emotional resilience. Physical vitality, immunity, and overall health outlook improve.",
      planet:      "Moon",
      natalHouse:  1,
      scoreDelta:  15,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  {
    id:       "transit-moon-6th-health",
    domain:   "Health",
    priority: 11,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 6,
    conclude: fact => ({
      ruleId:      "transit-moon-6th-health",
      domain:      "Health",
      label:       "Moon in 6th: Digestive sensitivity",
      description: "Transiting Moon in the 6th house (roga bhava) activates disease indicators. Digestive discomfort, minor infections, or fatigue are elevated risks. Avoid heavy meals and overexertion.",
      planet:      "Moon",
      natalHouse:  6,
      scoreDelta:  -12,
      direction:   "Challenging",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  {
    id:       "transit-moon-8th-health",
    domain:   "Health",
    priority: 12,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 8,
    conclude: fact => ({
      ruleId:      "transit-moon-8th-health",
      domain:      "Health",
      label:       "Moon in 8th: Energy dip and vulnerability",
      description: "Transiting Moon in the 8th house (longevity house) signals temporary energy depletion and increased health vulnerability. Rest and avoid high-stress activities.",
      planet:      "Moon",
      natalHouse:  8,
      scoreDelta:  -15,
      direction:   "Challenging",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  {
    id:       "transit-moon-12th-health",
    domain:   "Health",
    priority: 13,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 12,
    conclude: fact => ({
      ruleId:      "transit-moon-12th-health",
      domain:      "Health",
      label:       "Moon in 12th: Mental fatigue and sleep disruption",
      description: "Transiting Moon in the 12th house (isolation/rest bhava) elevates mental fatigue, sleep sensitivity, and hidden health concerns. Rest and recovery are favored over exertion.",
      planet:      "Moon",
      natalHouse:  12,
      scoreDelta:  -8,
      direction:   "Challenging",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  {
    id:       "transit-moon-4th-health",
    domain:   "Health",
    priority: 14,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 4,
    conclude: fact => ({
      ruleId:      "transit-moon-4th-health",
      domain:      "Health",
      label:       "Moon in 4th: Emotional well-being and comfort",
      description: "Transiting Moon in the 4th house (home/heart) supports emotional well-being, restful sleep, and chest/lung health. Good for convalescing or focusing on self-care routines.",
      planet:      "Moon",
      natalHouse:  4,
      scoreDelta:  10,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  {
    id:       "transit-moon-5th-health",
    domain:   "Health",
    priority: 15,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 5,
    conclude: fact => ({
      ruleId:      "transit-moon-5th-health",
      domain:      "Health",
      label:       "Moon in 5th: Positive emotional health",
      description: "Transiting Moon in the 5th house supports heart health, creative energy, and emotional positivity. A good period for light exercise and joyful activity.",
      planet:      "Moon",
      natalHouse:  5,
      scoreDelta:  10,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  {
    id:       "transit-moon-9th-health",
    domain:   "Health",
    priority: 16,
    test:     fact => fact.planet === "Moon" && fact.natalHouse === 9,
    conclude: fact => ({
      ruleId:      "transit-moon-9th-health",
      domain:      "Health",
      label:       "Moon in 9th: Grace and vitality",
      description: "Transiting Moon in the 9th house (fortune bhava) elevates vitality through grace and positive environment. Outdoor activities, nature, and spiritual practice support health.",
      planet:      "Moon",
      natalHouse:  9,
      scoreDelta:  12,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Moon,
    }),
  },

  // ── Jupiter transits ───────────────────────────────────────────────────────
  // Duration: ~1 year.  Strong, sustained health effects.

  {
    id:       "transit-jupiter-1st-health",
    domain:   "Health",
    priority: 20,
    test:     fact => fact.planet === "Jupiter" && fact.natalHouse === 1,
    conclude: fact => ({
      ruleId:      "transit-jupiter-1st-health",
      domain:      "Health",
      label:       "Jupiter transiting lagna: Major vitality boost",
      description: "Jupiter transiting the natal lagna is one of the strongest health-protective transits. Immunity, vitality, and recovery capacity are significantly elevated for this ~1-year period.",
      planet:      "Jupiter",
      natalHouse:  1,
      scoreDelta:  25,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Jupiter,
    }),
  },

  {
    id:       "transit-jupiter-6th-health",
    domain:   "Health",
    priority: 21,
    test:     fact => fact.planet === "Jupiter" && fact.natalHouse === 6,
    conclude: fact => ({
      ruleId:      "transit-jupiter-6th-health",
      domain:      "Health",
      label:       "Jupiter in 6th: Disease conquered",
      description: "Jupiter transiting the 6th house reduces the power of existing ailments and improves the body's ability to recover. Chronic conditions may improve. Medical treatment is favored.",
      planet:      "Jupiter",
      natalHouse:  6,
      scoreDelta:  18,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Jupiter,
    }),
  },

  // ── Saturn transits ───────────────────────────────────────────────────────
  // Duration: ~2.5 years.  These are the slow-burn health patterns.

  {
    id:       "transit-saturn-1st-health",
    domain:   "Health",
    priority: 30,
    test:     fact => fact.planet === "Saturn" && fact.natalHouse === 1,
    conclude: fact => ({
      ruleId:      "transit-saturn-1st-health",
      domain:      "Health",
      label:       "Saturn transiting lagna: Structural health stress (~2.5 years)",
      description: "Saturn transiting the natal lagna signals a sustained period of health testing — chronic fatigue, joint issues, dental concerns, or metabolic challenges. Discipline in diet and sleep is the antidote.",
      planet:      "Saturn",
      natalHouse:  1,
      scoreDelta:  -18,
      direction:   "Challenging",
      duration:    TRANSIT_DURATIONS.Saturn,
    }),
  },

  {
    id:       "transit-saturn-6th-health",
    domain:   "Health",
    priority: 31,
    test:     fact => fact.planet === "Saturn" && fact.natalHouse === 6,
    conclude: fact => ({
      ruleId:      "transit-saturn-6th-health",
      domain:      "Health",
      label:       "Saturn in 6th: Discipline conquers disease",
      description: "Saturn in the 6th can go both ways: it destroys enemies (including disease) through discipline, but also creates persistent minor ailments if lifestyle is irregular. Routine is the key variable.",
      planet:      "Saturn",
      natalHouse:  6,
      scoreDelta:  -5,   // slight negative — context-dependent, lifestyle determines outcome
      direction:   "Neutral",
      duration:    TRANSIT_DURATIONS.Saturn,
    }),
  },

  {
    id:       "transit-saturn-8th-health",
    domain:   "Health",
    priority: 32,
    test:     fact => fact.planet === "Saturn" && fact.natalHouse === 8,
    conclude: fact => ({
      ruleId:      "transit-saturn-8th-health",
      domain:      "Health",
      label:       "Saturn in 8th: Longevity under pressure (~2.5 years)",
      description: "Saturn in the 8th house (longevity bhava) is a significant multi-year health test. Chronic conditions, hidden imbalances, and energy depletion are elevated. Preventive care and annual health checks are important.",
      planet:      "Saturn",
      natalHouse:  8,
      scoreDelta:  -20,
      direction:   "Challenging",
      duration:    TRANSIT_DURATIONS.Saturn,
    }),
  },

  // ── Mars transits ──────────────────────────────────────────────────────────
  // Duration: ~6 weeks.  Acute, sharp effects — fever, injury, inflammation.

  {
    id:       "transit-mars-6th-health",
    domain:   "Health",
    priority: 40,
    test:     fact => fact.planet === "Mars" && fact.natalHouse === 6,
    conclude: fact => ({
      ruleId:      "transit-mars-6th-health",
      domain:      "Health",
      label:       "Mars in 6th: Fever and inflammation risk",
      description: "Mars transiting the 6th house activates acute health events — fever, infections, surgical risk, or inflammatory conditions. High-impact physical activity carries injury risk.",
      planet:      "Mars",
      natalHouse:  6,
      scoreDelta:  -10,
      direction:   "Challenging",
      duration:    TRANSIT_DURATIONS.Mars,
    }),
  },

  {
    id:       "transit-mars-1st-health",
    domain:   "Health",
    priority: 41,
    test:     fact => fact.planet === "Mars" && fact.natalHouse === 1,
    conclude: fact => ({
      ruleId:      "transit-mars-1st-health",
      domain:      "Health",
      label:       "Mars transiting lagna: Physical energy surge",
      description: "Mars in the lagna elevates physical energy, drive, and competitive capacity. Good for exercise and physical achievement, but impulsivity increases injury risk. Channel energy deliberately.",
      planet:      "Mars",
      natalHouse:  1,
      scoreDelta:  8,
      direction:   "Supportive",
      duration:    TRANSIT_DURATIONS.Mars,
    }),
  },
];
