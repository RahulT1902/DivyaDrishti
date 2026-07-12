// ── DivyaDrishti Version Constants ───────────────────────────────────────────
//
// Three independent version axes — each evolves on its own cadence:
//
//   ARCHITECTURE_VERSION — the eight-layer pipeline and its stable interfaces.
//     Increment ONLY when a pipeline stage is added/removed, or a stable
//     interface (AstrologyContext, DomainEngine, InferenceConclusion, etc.) changes
//     its contract. Target: rare. A frozen architecture should stay on v1.x
//     for months or years.
//
//   KNOWLEDGE_VERSION — the astrological knowledge encoded in the engine:
//     yogas, inference rules, divisional charts, domain knowledge packs.
//     Increment with every knowledge addition — a new yoga, a new rule file,
//     a new divisional chart, a new domain engine. Target: frequent.
//
//   GOLD_SUITE_VERSION — the regression test corpus in tests/gold-charts/.
//     Increment when charts are added or assertions change materially.
//     Gate: no knowledge merge may pass CI unless the gold suite version is
//     also specified in the release notes and all charts pass at 100%.
//
// The three-axis separation makes regression analysis tractable:
//   "Why did this chart's career signal change from 72 to 68?"
//   → Knowledge version bumped from 1.2 → 1.3 (new D6 rules added)
//   → Architecture version unchanged — the pipeline is identical
//   → Gold suite version unchanged — same test corpus, so the diff is surgical

export const ARCHITECTURE_VERSION = "1.0";
export const KNOWLEDGE_VERSION    = "1.2";
export const GOLD_SUITE_VERSION   = "1.0";

// Release KPI targets (Gold Suite v1.0+)
// These are checked manually during release; future CI may enforce them.
//
//   gold-chart pass rate     100%        — every chart in the suite must pass
//   assertion pass rate      > 99%       — across all assertions
//   opaque inferences        0           — all fired rules must be graph-traceable
//   rule precision           > 95%       — triggered / expected per rule
//   knowledge completeness   domain-specific targets (Career ≥ 70, Marriage ≥ 60, etc.)

// Current as of: 2026-07-12
// Architecture: 8-layer pipeline, all core interfaces stable, architecture frozen
// Knowledge v1.1 additions:
//   Shadbala: all 10 components now implemented (avastha, cheshtaBala, drikBala, kalaBala)
//             MODEL_CONFIDENCE → 100%
//   Yogas:    +2 new yogas (Chandra-Mangala, Adhiyoga) in lunar.ts
//             Total yoga library: 25 yogas across 6 categories
//   Rules:    +8 career rules (priorities 23–30) covering Sun/Mercury/Jupiter/Venus placements,
//             technical careers, financial career signals
//             +8 wealth inference rules in wealth.ts (WEALTH_RULES now registered)
//             Wealth domain: first rules coverage added
//
// Knowledge v1.2 additions:
//   Domains:  Marriage Engine (MarriageEngine, MARRIAGE_KNOWLEDGE_PACK, 6 signals)
//             Health Engine (HealthEngine, HEALTH_KNOWLEDGE_PACK, 6 signals)
//             Finance Engine (FinanceEngine, FINANCE_KNOWLEDGE_PACK, 6 signals)
//   Rules:    +10 marriage inference rules (MARRIAGE_RULES) — 7th house, Venus, D9, Jupiter
//             +10 health inference rules (HEALTH_RULES) — Lagna lord, Sun, Moon, Mars, Saturn
//             +6 Ashtakavarga inference rules (ASHTAKAVARGA_RULES) — bindhu-based scoring
//   Yogas:    +3 marriage yogas (kalathra, vivaha, kalatra-dosha) in marriage.ts
//             +2 arishta yogas (chandal, shakata) in arishta.ts
//             +3 finance yogas (vasumati, kahala, lakshmi) in finance.ts
//             Total yoga library: 33 yogas across 7 categories
//   Ashtakavarga: 7-planet Binna + Sarva computation added to SymbolRegistry (lazy-cached)
//                 binnaAshtakavarga(), sarvaAshtakavarga(), sarvaAtPlanet(), binnaAtPlanet()
