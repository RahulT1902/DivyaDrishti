# DivyaDrishti Architecture Specification v1.0

**Effective date:** 2026-07-11
**Status:** Frozen

| Axis | Version |
|---|---|
| Architecture | 1.0 |
| Knowledge Base | 1.0 |

---

## Purpose

This document defines the stable architecture of DivyaDrishti, a neuro-symbolic Decision Intelligence Engine for Vedic astrology. It describes the eight-layer pipeline, the responsibility of each layer, the stable interfaces that constitute the public contract, and the governance rules that determine how future development must proceed.

This document is the architectural contract. Any proposed change that modifies a stable interface, adds a pipeline stage, or introduces a new abstraction layer must justify itself against this contract and increment ARCHITECTURE_VERSION before merging.

---

## The Eight-Layer Pipeline

Data flows top-to-bottom. Each layer has a single responsibility and receives its inputs from the layer(s) above. Layers never call downstream layers. The `AstrologyContextBuilder` is the single orchestration point — domain engines never call astrological layers directly.

```
Swiss Ephemeris Output  (raw planetary positions and chart data)
         ↓
 Layer 1  PlanetIntelligenceEngine    → PlanetRole[]
          What functional role does each planet play in this chart?
          (benefic/malefic, yogakaraka, lord assignments, combustion, etc.)
         ↓
 Layer 2  PlanetStrengthEngine        → PlanetStrength[]
          How strong is each planet? (Shadbala — 6 components, 92% implemented)
         ↓
 Layer 3  YogaEngine                  → YogaDetectionResult
          Which yogas exist in the birth chart? (immutable natal promises)
         ↓
 Layer 4  ActivationEngine            → YogaActivation[]
          Which yogas are currently active? (5-component dasha model)
         ↓
 Layer 5  InferenceEngine             → InferenceConclusion[]
          Which symbolic rules apply? (stamped with ruleId, version, provenance, horizon)
         ↓
 Layer 6  HypothesisEngine            → Hypothesis[]
          Which abstract concepts (leadership, discipline, wisdom) are supported?
         ↓
 Layer 7  InferenceGraphBuilder       → InferenceNode[]
          Bidirectional graph connecting Facts → Inferences → Hypotheses → Decisions
          Enables "Why?" traversal; supports ExplainabilityCoverage computation.
         ↓
 Layer 8  Meta-Quality Metrics        → KnowledgeCompletenessScore + ExplainabilityCoverage
          Stamped last, after the full context is assembled.
          completeness:   how much of the intended reasoning model was applied?
          explainability: what fraction of conclusions are fully graph-traceable?
         ↓
 AstrologyContext  (complete — handed to Domain Engines)
```

After `AstrologyContext` is assembled, domain engines (`CareerEngine`, and future `FinanceEngine`, `MarriageEngine`, etc.) operate on it. Domain engines never call astrological layers. They consume signals, compute domain assessments, and build narrator prompts.

---

## Stable Interfaces

These are the types and classes that form the public contract. Changing them requires an architecture version bump.

### Core Data Types

| Interface | Responsibility |
|---|---|
| `AstrologyContext` | The single enriched object that flows through all engines. |
| `ChartSuite` | All divisional charts for one birth (D1–D12 currently; D6/D20/D24/D30/D60 in Phase A). |
| `DivisionalChart` | One divisional chart — planets, houses, ascendant, strengths. |
| `PlanetRole` | Functional role of one planet in one chart. |
| `PlanetStrength` | Shadbala-derived strength for one planet (10 components, 6 implemented). |
| `YogaBirthPromise` | Immutable natal yoga fact — no status, no timing. |
| `YogaActivation` | Mutable yoga status — carries DashaProvenance. |
| `YogaAnalysis` | Combines birth promises and activations. |
| `InferenceConclusion` | One stamped rule conclusion (ruleId, ruleSetVersion, provenance, horizon). |
| `Hypothesis` | Abstract cross-domain concept (leadership, discipline, wisdom, etc.). |
| `InferenceNode` | Graph node — type is Fact / Inference / Hypothesis / Decision. |
| `KnowledgeCompletenessScore` | How much of the reasoning model was applied (0–100). |
| `ExplainabilityCoverage` | What fraction of conclusions are Fact→…→Decision traceable. |

### Domain Contract

| Interface | Responsibility |
|---|---|
| `DomainEngine<T>` | Contract all domain engines implement: `evaluate(ctx): T`, `buildPrompt(assessment, query?): PromptContext`. |
| `DomainSignal` | Synthesised 0–100 score per sub-dimension (leadership, job-stability, etc.). |
| `DomainKnowledgePack` | Declarative config: signal mappings and recommendation templates. |
| `Recommendation` | Star-rated action (1–5 stars) with trigger condition. |
| `DecisionGraph` | Structured domain output: currentState, supporting/blocking factors, timing, confidence. |

### Inference Rule Contract

| Type | Responsibility |
|---|---|
| `InferenceRule` | `{ id, domain, priority, test(ctx, sym): boolean, conclude(ctx, sym): DraftConclusion }` |
| `DraftConclusion` | What rule authors return — excludes ruleId, ruleSetVersion, provenance, horizon (engine stamps these). |
| `SymbolRegistry` | Symbolic query API for rules — abstracts chart/strength/yoga lookups. |

---

## Versioning

### Architecture Version (ARCHITECTURE_VERSION in `src/lib/core/version.ts`)

Increment when:
- A pipeline stage is added or removed
- A stable interface changes its contract (field added/removed, type changed)
- A new abstraction layer is introduced

Do **not** increment for:
- New inference rules or yogas
- New divisional chart support
- New domain engines (they extend `DomainEngine<T>`, not the architecture)
- Bug fixes within a layer that do not change the output contract

### Knowledge Version (KNOWLEDGE_VERSION in `src/lib/core/version.ts`)

Increment with each knowledge addition:
- A new yoga definition
- A new inference rule or rule file
- A new divisional chart added to ChartSuite
- A new domain engine (Career, Finance, Marriage, etc.)
- A new DomainKnowledgePack

This separation makes regression analysis tractable:
> "Why did this chart's career signal change from 72 to 68?"
> → Knowledge version bumped 1.0 → 1.1 (new D6 rules added)
> → Architecture version unchanged — the pipeline is identical
> → Audit scope is surgical: only new rules, no structural changes

---

## Governance Rules

**The architecture is frozen at v1.0.**

### The Primary Rule

> No new architectural abstractions without replacing an existing one.

Every future enhancement must fit into one of the eight existing layers or extend one of the stable interfaces. It must not introduce a new pipeline stage, a new abstract framework, or a new orchestration pattern.

### Decision Table

| Addition | Correct placement | Not |
|---|---|---|
| Ashtakavarga (bindhu scoring) | New inference rules using `SymbolRegistry` (Layer 5) | A new "AshtakavargaEngine" (Layer 9) |
| Argala (planetary intervention) | New inference rules (Layer 5) | A new "ArgalaLayer" |
| D6 / D20 / D24 / D30 / D60 | New fields on `ChartSuite`; `SymbolRegistry` methods | New "DivisionalEngine" |
| Finance domain | New `FinanceEngine implements DomainEngine<FinanceAssessment>` | New pipeline stage |
| Jaimini Karaka | Extension of `PlanetRole` type + new `SymbolRegistry` methods | New "JaiminiLayer" |
| Kala Bala | New component in `PlanetStrengthEngine` (Layer 2) | New "TemporalEngine" |

### Change Classification

| Change | Version Bump Required |
|---|---|
| New yoga, rule, or domain engine | KNOWLEDGE_VERSION |
| New field on existing interface | ARCHITECTURE_VERSION (minor) |
| New pipeline stage | ARCHITECTURE_VERSION (major, requires design review) |
| Bug fix within a layer, no contract change | Neither |

---

## The Three Quality Metrics

Every `AstrologyContext` carries three orthogonal quality metrics:

| Metric | Question answered | Location |
|---|---|---|
| **Confidence** | "How strongly does the model believe this conclusion?" | `InferenceConclusion.confidence` (0–100) |
| **Completeness** | "How much of the intended reasoning model was applied?" | `AstrologyContext.completeness.overall` (0–100) |
| **Explainability** | "What fraction of conclusions are fully graph-traceable?" | `AstrologyContext.explainability.coverageScore` (0–100) |

A conclusion can be **high-confidence, low-completeness** — a strong yoga is correctly detected (confidence: 85), but Ashtakavarga, Argala, transit, and Kala Bala are absent (completeness: 43). The conclusion is reliable within the applied model, but significant reasoning depth was not exercised.

A conclusion can be **high-completeness, low-explainability** — all reasoning modules fired, but not all conclusions fed into the hypothesis layer and graph. Those "opaque" conclusions are valid but cannot be interrogated by "Why?" traversal.

### Completeness Components (v1.0 Baseline)

| Component | Weight | Baseline Status |
|---|---|---|
| D1 Birth Chart | 20% | Full |
| D10 Dashamsa (Career) | 12% | Full when D10 rules fire |
| D9 Navamsa | 6% | Partial (chart computed, no dedicated rules) |
| Dasha Timing | 15% | Full / Missing |
| Transit Timing | 10% | Full / Missing |
| Shadbala | 15% | Partial (92% implemented — Kala Bala et al. pending) |
| Ashtakavarga | 8% | Missing (Phase B) |
| Argala | 5% | Missing (Phase C) |
| Advanced Divisionals | 9% | Missing (Phase A) |

Typical scores: ~43 without dasha/transit, ~58 with dasha, ~68 with dasha + transit.

---

## Knowledge Roadmap

These phases expand knowledge within the frozen architecture. None require a new pipeline stage.

### Phase A — Knowledge Expansion (Divisional Charts)
D2 (Wealth), D3 (Siblings), D6 (Health), D12 (Parents), D20 (Spirituality), D24 (Education), D30 (Suffering), D60 (Karma)

Each addition: new `ChartSuite` field → new `SymbolRegistry` methods → new inference rules → higher completeness score.

### Phase B — Timing Depth
Full Mahadasha model, Antardasha, Pratyantardasha, Transit refinement, Ashtakavarga bindhu scoring.

All fit into existing Layer 4 (ActivationEngine) and Layer 5 (InferenceEngine).

### Phase C — Symbolic Knowledge
Dharma-Karmadhipati Yoga, Vasumati Yoga, Chandra-Mangala, Raja Sambandha, Argala, Avastha — all new entries in `YogaEngine` and inference rule files.

### Phase D — Domain Expansion
Finance, Marriage, Health, Education, Spirituality — each a new `DomainEngine<T>` implementation with its own `DomainKnowledgePack` and assessment type. Architecture is unchanged.

---

## Regression Corpus Target

Prediction quality is validated by a growing corpus of known charts, not by architectural changes.

- **Target:** 100–200 birth charts with known outcomes
- **Format:** `RegressionCase` with known signal ranges, expected yoga activations, and expected domain states
- **Runner:** `npm run regression` — deterministic, exits code 1 on deviation
- **Governance:** knowledge version bumps must not regress existing cases without explanation

---

*This document was authored at architecture freeze (2026-07-11, after Step 5c + Phase 6 implementation). It supersedes all prior design notes.*
