# DivyaDrishti — Astrological Knowledge Specification

**Architecture Version:** 1.0 (frozen)
**Knowledge Version:** 1.0
**Last updated:** 2026-07-11
**Purpose:** Living inventory of every supported astrological concept with implementation status. This is the knowledge backlog that guides future development.

---

## Table of Contents

1. [Divisional Charts (Vargas)](#1-divisional-charts-vargas)
2. [Planetary Strength (Shadbala)](#2-planetary-strength-shadbala)
3. [Yoga Library](#3-yoga-library)
4. [Inference Rule Coverage](#4-inference-rule-coverage)
5. [Domain Engines](#5-domain-engines)
6. [DivyaDrishti v2.0 Target](#6-divyadrishti-v20-target)

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✓ Full | In ChartSuite AND has dedicated inference rules firing on it |
| ~ Partial | In ChartSuite but no dedicated inference rules yet |
| ✗ Missing | Not in ChartSuite (may exist in the `ChartType` union, but not wired into the pipeline) |

---

## 1. Divisional Charts (Vargas)

### 1.1 Implemented Charts (in ChartSuite)

The `ChartSuite` interface (`src/lib/core/types.ts`, line 574) currently holds eight charts. Everything downstream — the Yoga Engine, Inference Engine, and Career Domain Engine — operates on this suite.

| Varga | Status | Purpose / Life Domain | Inference Coverage | Notes |
|-------|--------|----------------------|--------------------|-------|
| D1 — Rashi | ✓ Full | Whole-life natal chart; all physical-world significations | 5 general rules + 8 D1 career rules | Most comprehensively covered chart; foundation for every other engine |
| D2 — Hora | ~ Partial | Wealth, material resources, financial assets | None yet | Chart computed; no dedicated wealth-inference rules (planned with Finance domain engine) |
| D3 — Drekkana | ~ Partial | Siblings, courage, short journeys, communication | None yet | Chart computed; no dedicated rules |
| D4 — Chaturthamsha | ~ Partial | Property, fixed assets, fortune, ancestral land | None yet | Chart computed; no dedicated rules |
| D7 — Saptamsha | ~ Partial | Children, procreation, progeny and their welfare | None yet | Chart computed; no dedicated rules |
| D9 — Navamsha | ~ Partial | Marriage, dharma, soul nature; amplifies D1 dignity | None yet | Chart computed; designated "Partial" at 6% weight in the KnowledgeCompletenessEngine; Phase 5 will add Navamsha inference rules |
| D10 — Dashamsha | ✓ Full* | Career, profession, public life, social contribution | 5 dedicated D10 career rules | *Full when D10-specific rules fire (D10_ reason codes); Partial when no D10 trigger conditions are met for that chart |
| D12 — Dwadashamsha | ~ Partial | Parents, lineage, ancestors, hereditary traits | None yet | Chart computed; no dedicated rules |

### 1.2 Charts in `ChartType` Union but Not in ChartSuite (Phase 5 Target)

These charts exist in the `ChartType` TypeScript union (types.ts, lines 7–10) — meaning evidence and conclusions can reference them — but they are not yet properties of `ChartSuite`. They are marked "Phase 5 additions" in the suite comment (line 583).

| Varga | Status | Purpose / Life Domain | Phase Target | Notes |
|-------|--------|----------------------|--------------|----|
| D6 — Shashthamsha | ✗ Missing | Health, diseases, enemies, debts, service | Phase 5 | Governs the 6th house significations at varga level; needed for Health domain engine |
| D20 — Vimshamsha | ✗ Missing | Spirituality, religious practice, mantra siddhi | Phase 5 | Required for a Spirituality domain engine |
| D24 — Chaturvimshamsha | ✗ Missing | Education, learning, academic achievements | Phase 5 | Required for Education domain engine |
| D30 — Trimshamsha | ✗ Missing | Suffering, adversity, disease, misfortune | Phase 5 | Important for health and karmic suffering analysis |
| D60 — Shashtyamsha | ✗ Missing | Past life karma, deepest soul imprints | Phase 5 | The "final arbiter" in classical texts; highest varga weight |

### 1.3 Charts in `ChartType` Union with No Planned Phase

The following charts are recognized by the type system but have no dedicated ChartSuite entry or phase assignment documented in the codebase. They are structurally acknowledged (AstrologicalEvidence.sourceChart can reference them) but are not computed.

| Varga | Status | Purpose / Life Domain |
|-------|--------|-----------------------|
| D16 — Shodashamsha | ✗ Missing | Vehicles, comforts, conveyances, happiness |
| D27 — Bhamsha | ✗ Missing | Strength and weakness; physical constitution |
| D40 — Khavedamsha | ✗ Missing | Auspicious/inauspicious effects, maternal lineage |
| D45 — Akshavedamsha | ✗ Missing | General karma, paternal lineage |

### 1.4 Charts Outside the Type System

The following standard Jyotish divisional charts are not present in the `ChartType` union at all. They are outside the current scope of DivyaDrishti v1.x.

| Varga | Purpose |
|-------|---------|
| D5 — Panchamsha | Past life deeds, divine grace |
| D8 — Ashtamsha | Longevity, accidents, sudden events |
| D11 — Rudramsha | Gains and losses, rudra principle |

All other divisional numbers (D13–D15, D17–D19, D21–D23, D25–D26, D28–D29, D31–D39, D41–D44, D46–D59) are outside scope and are not referenced anywhere in the codebase.

---

## 2. Planetary Strength (Shadbala)

DivyaDrishti implements a ten-component weighted Shadbala model defined in `src/lib/core/strength-engine/strengthWeights.ts`. The current model confidence is **92%** (sum of implemented component weights).

All components score on a 0–100 scale and are combined as a weighted composite into `PlanetStrength.overallStrength`. Stub components are fixed at 50 until implemented.

| # | Component | Status | Weight | Description |
|---|-----------|--------|--------|-------------|
| 1 | **sthanaBala** (Positional Strength) | ✓ Implemented | 25% | Dignity score: exalted (+100), own sign (+80), friend's sign (+60), neutral (+50), enemy sign (+30), debilitated (0) |
| 2 | **digBala** (Directional Strength) | ✓ Implemented | 20% | Each planet has a preferred angular house; strength peaks at that house and diminishes 180° away (Sun/Jupiter → 10th; Moon/Venus → 4th; Mars/Saturn → 7th; Mercury → 1st) |
| 3 | **combustion** (Combustion Factor) | ✓ Implemented | 15% | 100 = free; 0 = fully combust; graduated by orb from the Sun; Sun itself is immune |
| 4 | **naisargikaBala** (Natural Strength) | ✓ Implemented | 12% | Intrinsic planetary hierarchy: Saturn > Jupiter > Mars > Sun > Venus > Mercury > Moon (permanent, never changes) |
| 5 | **retrograde** (Retrogression Bonus) | ✓ Implemented | 10% | Retrograde: 70; direct motion: 50; retrograde planets gain intensity by re-traversing degrees |
| 6 | **vargottama** (Vargottama Bonus) | ✓ Implemented | 10% | Same sign in D1 and D9: 85; normal: 50; vargottama signifies maximum expression of natal potential |
| 7 | **kalaBala** (Temporal Strength) | ✗ Phase 3B stub | 4% | Time-based factors: day/night rulership, hora lord, paksha (lunar fortnight), ayana (solstice half), year/month/day strength |
| 8 | **cheshtaBala** (Motional Strength) | ✗ Phase 3B stub | 2% | Speed and directional motion relative to mean motion; vakra (retrograde) and atichara (accelerated) states |
| 9 | **drikBala** (Aspectual Strength) | ✗ Phase 3B stub | 1% | Net benefic minus malefic aspects received; full/partial aspect weights per classical rules |
| 10 | **avastha** (Planetary State) | ✗ Phase 3B stub | 1% | Baladi avasthas (infant/child/youth/old/dead) based on degree within sign; bala avastha weakens, yuva strengthens |

**Implemented weight total: 92% → MODEL_CONFIDENCE = 92**
**Stub weight total: 8% (Phase 3B)**

The `PlanetStrength.confidence` field tracks this: it equals `MODEL_CONFIDENCE` until all stubs are filled, at which point it reaches 100.

---

## 3. Yoga Library

All yoga definitions live in `src/lib/core/yoga-engine/definitions/`. The Yoga Engine (`yogaEngine.ts`) evaluates `ALL_YOGA_DEFINITIONS` (the merged, priority-sorted export from `definitions/index.ts`) against the D1 chart. **Total implemented yogas: 23.**

### 3.1 Category: Raj (Royal / Status Yogas)

| ID | Name | Sanskrit | Severity | Key Domains |
|----|------|----------|----------|-------------|
| `gajakesari` | Gajakesari Yoga | Gajakesari | 88 | Reputation, Wealth, Wisdom, Public influence |
| `raj-yoga` | Raj Yoga | Raja Yoga | 95 | Status, Authority, Career success, Recognition, Power |
| `lakshmi-yoga` | Lakshmi Yoga | Lakshmi Yoga | 90 | Wealth, Prosperity, Fortune, Status |
| `neecha-bhanga` | Neecha Bhanga Raja Yoga | Neecha Bhanga Raja Yoga | 82 | Rise after adversity, Struggle then success, Late-blooming career |

**Detection logic:**
- Gajakesari: Moon in kendra from Jupiter OR Jupiter in kendra from Moon (covers the classical Kesari Yoga — see note below).
- Raj Yoga: Custom `evaluateFn` checks all six Trikona × Kendra lord pairs for conjunction or mutual aspect; also fires when one planet owns both (Yogakaraka).
- Lakshmi Yoga: 9th lord in own house AND placed in Kendra or Trikona.
- Neecha Bhanga: Custom `evaluateFn` checks four classical cancellation conditions per debilitated planet (sign lord in kendra, exaltation planet in kendra, retrogression, aspect from sign lord).

### 3.2 Category: PanchaMahapurusha (Five Great Person Yogas)

| ID | Name | Sanskrit | Severity | Planet | Key Domains |
|----|------|----------|----------|--------|-------------|
| `ruchaka` | Ruchaka Yoga | Ruchaka | 90 | Mars | Courage, Physical prowess, Leadership, Wealth |
| `bhadra` | Bhadra Yoga | Bhadra | 88 | Mercury | Intelligence, Communication, Business, Learning |
| `hamsa` | Hamsa Yoga | Hamsa | 92 | Jupiter | Wisdom, Spirituality, Dharma, Teaching, Prosperity |
| `malavya` | Malavya Yoga | Malavya | 88 | Venus | Luxury, Beauty, Love, Wealth, Arts |
| `sasa` | Sasa Yoga | Shasha | 85 | Saturn | Authority, Discipline, Perseverance, Property, Service |

**Detection logic (all five follow same pattern):** Planet in own sign OR exalted AND placed in a Kendra (1st/4th/7th/10th). Strength computed from planet's `overallStrength`. Combustion weakens each; vargottama amplifies.

### 3.3 Category: Dhana (Wealth Yogas)

| ID | Name | Sanskrit | Severity | Key Domains |
|----|------|----------|----------|-------------|
| `dhana-yoga` | Dhana Yoga | Dhana Yoga | 85 | Wealth, Income, Financial accumulation, Material gains |
| `dhana-yoga-9-2` | Dhana Yoga (Fortune + Wealth) | Bhagya Dhana Yoga | 80 | Inherited wealth, Fortune, Paternal inheritance |
| `guru-dhana-yoga` | Guru Dhana Yoga | — | 75 | Wealth through wisdom, Teaching income, Advisory prosperity |

**Detection logic:**
- Dhana Yoga: Lords of 2nd and 11th in conjunction or mutual aspect (custom `evaluateFn`).
- Dhana Yoga 9-2: Lords of 9th and 2nd conjunct or in mutual aspect (DSL rule).
- Guru Dhana Yoga: Jupiter placed in house 2, 5, 9, or 11 (DSL OR rule).

### 3.4 Category: Chandra (Lunar Yogas)

| ID | Name | Sanskrit | Severity | Key Domains |
|----|------|----------|----------|-------------|
| `sunapha` | Sunapha Yoga | Sunapha | 72 | Wealth, Fame, Intelligence, Royal favour |
| `anapha` | Anapha Yoga | Anapha | 70 | Renown, Good health, Charitable nature, Enjoyment |
| `durudhara` | Durudhara Yoga | Durudhara | 78 | Wealth, Charity, Comfort, Balanced mind |
| `kemadrum` | Kemadrum Yoga | Kemadrum | 65 | Mental isolation, Emotional hardship *(negative anti-yoga)* |

**Detection logic (all custom `evaluateFn`):**
- Sunapha: Non-Sun planet in 2nd house from Moon.
- Anapha: Non-Sun planet in 12th house from Moon.
- Durudhara: Non-Sun planets on BOTH sides of Moon (2nd and 12th); requires Sunapha AND Anapha simultaneously.
- Kemadrum: No planet (excluding shadows) in 2nd or 12th from Moon; partially cancelled if Moon exalted or Jupiter in kendra from Moon.

### 3.5 Category: Vipareeta (Reversal / Hidden Strength Yogas)

| ID | Name | Sanskrit | Severity | Lord | Key Domains |
|----|------|----------|----------|------|-------------|
| `harsha-yoga` | Harsha Yoga | Harsha | 78 | 6th lord | Victory over enemies, Courage, Health, Hidden strength |
| `sarala-yoga` | Sarala Yoga | Sarala | 80 | 8th lord | Longevity, Fearlessness, Hidden knowledge, Crisis resilience |
| `vimala-yoga` | Vimala Yoga | Vimala | 75 | 12th lord | Freedom from debt, Spiritual liberation, Peaceful endings, Savings |

**Detection logic (all DSL OR rule):** Dusthana lord (6th/8th/12th respectively) placed in any of the three Dusthana houses (6/8/12). Weakened if the lord also falls in Kendra (-30) or Trikona (-20).

### 3.6 Category: Misc (Special / Cross-Category Yogas)

| ID | Name | Sanskrit | Severity | Key Domains |
|----|------|----------|----------|-------------|
| `budha-aditya` | Budha-Aditya Yoga | Budha-Aditya | 72 | Intelligence, Administrative skill, Communication, Reputation |
| `amala-yoga` | Amala Yoga | Amala | 75 | Spotless reputation, Career excellence, Ethical leadership |
| `parivartana-yoga` | Parivartana Yoga | Parivartana | 70 | Exchange of energy, Mutual benefit between house domains |
| `veshi` | Veshi Yoga | Veshi | 60 | Eloquence, Prosperity, Industriousness |

**Detection logic:**
- Budha-Aditya: Sun and Mercury conjunct AND Mercury NOT combust; strengthened if Mercury in own sign or exalted.
- Amala Yoga: Natural benefic (Jupiter or Venus) in 10th house from lagna; weakened by combustion.
- Parivartana: Custom `evaluateFn` checks all planet pairs for mutual sign exchange (planet A in sign ruled by B, and B in sign ruled by A); shadow planets excluded.
- Veshi: Planet in 2nd from Sun (implemented via `PlanetAspectsPlanet` DSL checks from Sun to each non-Moon planet).

---

### 3.7 Planned Yogas (Not Yet Implemented)

The following yogas are referenced in classical Vedic texts but absent from `ALL_YOGA_DEFINITIONS`. They are the primary candidates for the next knowledge increment.

> **Note on Kesari Yoga:** Classical Kesari Yoga (Jupiter in kendra from Moon, or Moon in kendra from Jupiter) is already fully covered by the existing `gajakesari` definition, which uses an identical OR condition. No separate entry is needed.

| Planned ID | Name | Classical Source | Category | Key Domains | Detection Sketch |
|------------|------|-----------------|----------|-------------|-----------------|
| `chandra-mangala` | Chandra-Mangala Yoga | Phaladeepika | Misc | Wealth, courage, independent income, business | Moon and Mars conjunct or in mutual aspect (7th aspect) |
| `adhiyoga` | Adhiyoga | BPHS, Adhiyoga adhyaya | Raj | Ministerial status, leadership, good health, longevity | Mercury, Venus, or Jupiter (all three preferably) in 6th, 7th, or 8th from Moon |
| `saraswati-yoga` | Saraswati Yoga | Phala Deepika | Misc | Arts, learning, eloquence, creative genius | Venus, Mercury, and Jupiter all in own/exaltation/friendly signs AND in Kendra, Trikona, or 2nd house |
| `vasumati-yoga` | Vasumati Yoga | Phaladeepika | Dhana | Wealth, comfort, gains from many sources | Natural benefics (Jupiter, Venus, Mercury, Moon) in Upachaya houses (3rd/6th/10th/11th) |
| `kahala-yoga` | Kahala Yoga | Jataka Parijata | Raj | Authority, bold action, command over others | Lords of 4th and 9th in mutual kendra AND lagna lord strong |
| `chamara-yoga` | Chamara Yoga | Phaladeepika | Raj | Royal distinction, debate skill, longevity, respect | Lagna lord exalted in kendra, aspected by Jupiter; or two benefics in 1st house |
| `shankha-yoga` | Shankha Yoga | Phaladeepika | Raj | Compassion, justice, prosperity, long life | Lords of 5th and 6th in mutual kendra AND lagna lord strong |
| `shubha-kartari` | Shubha Kartari Yoga | BPHS | Misc | Protection and enhancement of the enclosed house | Natural benefics in houses immediately flanking (2nd and 12th from) a given house |
| `papa-kartari` | Papa Kartari Yoga | BPHS | Misc | Affliction and blockage of enclosed house | Natural malefics in houses flanking a given house; negative modifier on that house |
| `voshi-yoga` | Voshi Yoga | Phaladeepika | Misc | Eloquence, virtuous conduct, fame | Planet (other than Moon) in 12th house from Sun (complement to the existing Veshi) |
| `obhayachari-yoga` | Obhayachari Yoga | Phaladeepika | Raj | Balance, power, eloquence, royal favour | Planets (excluding Moon) on both sides of Sun (2nd and 12th) simultaneously |
| `parvata-yoga` | Parvata Yoga | BPHS | Raj | Prosperity, renown, authority | Lords of 6th and 8th in own houses or all four Kendras occupied by benefics |

---

## 4. Inference Rule Coverage

The Inference Engine (`src/lib/core/inference-engine/inferenceEngine.ts`) merges `GENERAL_RULES` and `CAREER_RULES` into a single priority-sorted `ALL_RULES` array. Comments in that file mark the Phase 5+ placeholder for Wealth, Marriage, Health, and Education rule files.

### 4.1 General Rules — 5 rules

These fire across all domains. Domain engines receive their outputs via `AstrologyContext.inferences`.

| Rule ID | Priority | Direction | Description |
|---------|----------|-----------|-------------|
| `gen-yogakaraka-strong` | 1 | Positive | Yogakaraka planet(s) are strong (≥65/100) — overall life quality elevated |
| `gen-multiple-active-yogas` | 2 | Positive | Two or more yogas currently Active or Peak — above-average outcomes across domains |
| `gen-lagna-lord-strong` | 3 | Positive | Lagna lord strength ≥60 — strong personal vitality and self-expression |
| `gen-lagna-lord-weak` | 4 | Negative | Lagna lord strength <35 — reduced personal efficacy; requires conscious effort |
| `gen-high-yoga-strength` | 5 | Positive | Overall yoga birth strength ≥70 — exceptional natal chart quality |

**Gaps:** No general rules yet for malefic dominance, overall debilitation pattern, nodal axis strength, or chart polarity (benefic vs. malefic heavy).

### 4.2 Career Rules — 13 rules

All operate on D1 and D10 data retrieved through `SymbolRegistry`.

| Rule ID | Priority | Direction | Basis |
|---------|----------|-----------|-------|
| `career-raj-yoga-active` | 10 | Positive | Raj Yoga Active or Peak → authority and professional status |
| `career-10th-lord-strong` | 11 | Positive | 10th lord strength ≥65 AND placed in Kendra/Trikona → career success |
| `career-hamsa-yoga` | 12 | Positive | Hamsa Yoga present → teaching, counselling, wisdom professions |
| `career-ruchaka-yoga` | 13 | Positive | Ruchaka Yoga present → military, sports, engineering, entrepreneurship |
| `career-sasa-yoga` | 14 | Positive | Sasa Yoga present → government, law, real estate, structured discipline |
| `career-sun-leadership` | 15 | Positive | Sun in 1st or 10th house, strength ≥60 → leadership and management |
| `career-neecha-bhanga` | 16 | Mixed | Neecha Bhanga on career planets → struggle followed by powerful rise |
| `career-d10-lagna-lord-strong` | 17 | Positive | D10 lagna lord strong (≥60) → career identity well-supported |
| `career-d10-10th-lord-strong` | 18 | Positive | D10 10th lord strong (≥60) in Kendra/Trikona → strong vocational trajectory |
| `career-d10-sun-prominent` | 19 | Positive | Sun in D10 Kendra/Trikona, strength ≥55 → authority and recognition via career |
| `career-10th-lord-weak` | 20 | Negative | 10th lord strength <35 → career direction requires sustained effort |
| `career-d10-saturn-career` | 21 | Positive | Saturn in D10 Kendra/Trikona, strength ≥55 → disciplined service career |
| `career-d10-10th-afflicted` | 22 | Negative | D10 10th house has malefic(s) without benefic relief → career obstacles |

**Gaps in career coverage:** No rules yet for Malavya (Venus-driven creative careers), Bhadra (Mercury-driven analytical/communication careers), D10 Jupiter/Venus prominence, or Amala Yoga career signal.

### 4.3 Planned Domain Rules (0 rules each)

These rule namespaces are listed as Phase 5+ placeholders in `inferenceEngine.ts` and have no implementation:

| Domain | Planned Rule File | Key Signals Needed |
|--------|------------------|--------------------|
| **Wealth** | `rules/wealth.ts` | 2nd/11th lord strength, Dhana Yoga activation, Jupiter karaka, D2 lagna/lord |
| **Marriage** | `rules/marriage.ts` | 7th lord, Venus/Jupiter state, D9 navamsha quality, relationship timing |
| **Health** | `rules/health.ts` | 6th/8th/12th lords, malefic afflictions on lagna, D6 chart signals |
| **Education** | `rules/education.ts` | 5th lord, Mercury/Jupiter strength, D24 chart signals |
| **Spirituality** | `rules/spirituality.ts` | 9th/12th lords, Ketu, D20 chart signals, Hamsa Yoga |

---

## 5. Domain Engines

A Domain Engine implements `DomainEngine<T>` from `src/lib/core/domain.ts`. It consumes `AstrologyContext.inferences` and `AstrologyContext.hypotheses` — it never reads raw chart data directly.

| Domain | Engine Status | Output Type | Knowledge Pack | Notes |
|--------|--------------|-------------|---------------|-------|
| **Career** | ✓ Implemented | `CareerAssessment` | `CAREER_KNOWLEDGE_PACK` | 8 signals, 8 recommendations, D10 integration, full `DecisionGraph`, uncertainty and completeness attached |
| **Finance / Wealth** | ✗ Planned | — | — | Requires Wealth inference rules + D2 chart in suite |
| **Marriage** | ✗ Planned | — | — | Requires Marriage inference rules + D9 Navamsha dedicated rules |
| **Health** | ✗ Planned | — | — | Requires Health inference rules + D6 chart in suite |
| **Education** | ✗ Planned | — | — | Requires Education inference rules + D24 chart in suite |
| **Spirituality** | ✗ Planned | — | — | Requires Spirituality inference rules + D20 chart in suite |

### Career Domain Engine — Signal Inventory

The `CAREER_KNOWLEDGE_PACK` (`src/lib/domains/career/knowledgePack.ts`) defines eight output signals and eight recommendation templates:

**Signals:** Leadership, Authority, Recognition, Entrepreneurship, Job Stability, Promotion Potential, Professional Growth, Risk Tolerance.

**Recommendations fire when:** pursue-leadership, seek-authority-role, launch-venture, invest-in-growth, visibility-campaign, time-the-promotion-ask, stabilize-before-change, avoid-high-risk-moves.

---

## 6. DivyaDrishti v2.0 Target

This section defines the concrete completion criteria for reaching **Knowledge Completeness > 90%** across all major domains. The current completeness baseline (when dasha and transit are absent) is approximately 43–52% depending on whether D10 rules fire.

### 6.1 Knowledge Completeness Baseline (v1.0)

From `KnowledgeCompletenessEngine` (`src/lib/core/knowledge-completeness/engine.ts`):

| Component | Current Status | Weight | Contribution |
|-----------|---------------|--------|--------------|
| D1 Birth Chart | Full | 20% | 20% |
| D10 Dashamsha | Full or Partial | 12% | 12% or 6% |
| D9 Navamsha | Partial | 6% | 3% |
| Dasha Timing | Full if provided, else Missing | 15% | 15% or 0% |
| Transit Timing | Full if provided, else Missing | 10% | 10% or 0% |
| Shadbala (Planetary Strength) | Partial (92%) | 15% | 7.5% |
| Ashtakavarga | Missing | 8% | 0% |
| Argala | Missing | 5% | 0% |
| Advanced Divisionals (D6/D20/D24/D30/D60) | Missing | 9% | 0% |
| **Total (with dasha + transit + D10 active)** | | **100%** | **~67.5%** |

### 6.2 v2.0 Completion Criteria

To reach Knowledge Completeness ≥ 90%, the following work items must ship:

**A. Complete Shadbala (Phase 3B) — +3.75% completeness**
- Implement `kalaBala` (temporal strength: hora, paksha, ayana, year/month/day lords) — 4% weight
- Implement `cheshtaBala` (motional/speed relative to mean motion) — 2% weight
- Implement `drikBala` (net aspectual strength, benefic minus malefic) — 1% weight
- Implement `avastha` (baladi avasthas based on degree-in-sign) — 1% weight
- When all four are implemented, `MODEL_CONFIDENCE` = 100 and the Shadbala component becomes Full (15% → 15% contribution, up from 7.5%)

**B. Add Advanced Divisionals to ChartSuite (Phase 5) — +4.5% completeness**
- Add D6 (Shashthamsha) to `ChartSuite` with at least 3 Health inference rules
- Add D20 (Vimshamsha) with Spirituality inference rules
- Add D24 (Chaturvimshamsha) with Education inference rules
- Add D30 (Trimshamsha) with suffering/adversity inference rules
- Add D60 (Shashtyamsha) with karma-level inference rules
- When D10-equivalent inference coverage exists, component becomes Full (9% weight fully contributed)

**C. Ashtakavarga Integration (Phase 7) — +8% completeness**
- Compute Sarvashtakavarga (SAV) and Bhinna Ashtakavarga (BAV) for all 7 classic planets
- Bindhu scores for each house inform transit quality scoring
- Integrate with Transit Engine for `transit` field in `AstrologyContext`
- Component moves from Missing to Full (8% weight)

**D. Argala Integration (Phase 7) — +5% completeness**
- Implement Argala (planetary intervention) analysis: which planets create Argala on which houses
- Compute Virodha Argala (obstruction) and net Argala strength
- Component moves from Missing to Full (5% weight)

**E. Expand the Yoga Library to 100+ validated yogas**
- Current: 23 yogas
- Immediate priority: 12 planned yogas listed in Section 3.7
- Subsequent: Nabhasa yogas (Rajju, Musala, Nala, etc.), Sankhya yogas, Ashrayadi yogas
- All must include `classicalReference`, modifiers for combustion/retrogression, and a `strengthFormula`

**F. All 5 Major Domain Engines**

| Domain Engine | Prerequisite Charts | Prerequisite Rules |
|--------------|--------------------|--------------------|
| Finance / Wealth | D2 in ChartSuite | `WEALTH_RULES` (≥10 rules) |
| Marriage | D9 dedicated rules | `MARRIAGE_RULES` (≥10 rules) |
| Health | D6 in ChartSuite | `HEALTH_RULES` (≥10 rules) |
| Education | D24 in ChartSuite | `EDUCATION_RULES` (≥8 rules) |
| Spirituality | D20 in ChartSuite | `SPIRITUALITY_RULES` (≥8 rules) |

Each domain engine needs: a typed output interface (like `CareerAssessment`), a `DomainKnowledgePack` (like `CAREER_KNOWLEDGE_PACK`), dedicated signals with hypothesis and inference weights, and recommendation templates.

**G. Regression Corpus: 200+ validated charts**
- Each chart needs birth data, expected yoga activations, expected domain signals, and known life outcomes
- Minimum 200 charts covering all ascendants, diverse dasha periods, and edge cases (retrograde lagna lords, multiple combust planets, all-malefic charts)
- Regression suite should run against each `KNOWLEDGE_VERSION` bump to catch regressions in inference output

### 6.3 v2.0 Knowledge Version Targets

| Knowledge Version | Target Milestone |
|------------------|-----------------|
| 1.1 | Complete Shadbala (Phase 3B) — MODEL_CONFIDENCE = 100 |
| 1.2 | D6 + Health domain engine live |
| 1.3 | D20 + Spirituality domain engine live |
| 1.4 | D24 + Education domain engine live |
| 1.5 | D2 + Finance/Wealth domain engine live |
| 1.6 | D9 dedicated rules + Marriage domain engine live |
| 1.7 | D30 + D60 in ChartSuite with inference rules |
| 1.8 | Ashtakavarga integration (Phase 7) |
| 1.9 | Argala integration (Phase 7) |
| 2.0 | 100+ validated yogas + 200-chart regression corpus + KnowledgeCompleteness ≥ 90% |

---

*This document is generated from a read-only audit of the v1.0 codebase. All status values are derived directly from the source files listed in the header. To update this document, re-audit the definition files after each knowledge version increment.*
