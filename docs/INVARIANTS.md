# DivyaDrishti — Architectural Invariants

> **Status**: Active | **Version**: 1.0.0 | **Last Reviewed**: May 2026
>
> This document defines the **non-negotiable architectural rules** of DivyaDrishti.
> Any code change that violates these invariants must be rejected in review,
> regardless of business rationale. These rules are the moat.

---

## INVARIANT 1 — The Fundamental Separation

> **Deterministic systems own reasoning. LLMs own narration. Never the reverse.**

- The symbolic engine computes signals, scores, and states.
- The LLM translates that output into human-readable guidance.
- An LLM must **never** compute a score, make an astrological judgment, or produce a causal claim.

**Violation examples (forbidden):**
```
// ❌ FORBIDDEN — LLM doing reasoning
"Based on planetary positions, I calculate your career score as 72%."

// ✅ CORRECT — Deterministic engine computes, LLM narrates
engine.compute() → score: 72
llm.narrate("Career momentum at 72% tends to support structured outreach.")
```

---

## INVARIANT 2 — LLMs Never Access Raw Astrology

> **No planet positions, house numbers, nakshatra names, yoga calculations, or aspect logic may be passed to an LLM prompt.**

- Prompts are assembled by `NarrativePromptAssembler` only.
- Prompts contain: scores (0-100), modes (ARCHITECT/WARRIOR), trajectory labels, behavioral recommendations.
- Prompts never contain: planet names in reasoning context, house numbers, astrological rationale.

**Allowed exception:** A planet name may appear as a **behavioral archetype label** (e.g., "Saturn-like discipline") inside style guide templates — never as a causal claim.

---

## INVARIANT 3 — Narrative Output is Always Validated

> **No LLM output may reach the user without passing `validateNarrative()` from `narrativeGuardrails.ts`.**

- `NarrativeRenderer` runs guardrail validation on every response.
- On validation failure: auto-sanitize, log violation, and fall back to deterministic template.
- Template fallbacks are always pre-validated and compliant.

---

## INVARIANT 4 — Goals Contextualize, Never Mutate

> **User goals reinterpret and prioritize signals. They must never modify core astrological scores.**

```typescript
// ❌ FORBIDDEN — Score mutation
careerScore += 20; // because user has a career goal

// ✅ CORRECT — Reinterpretation without mutation
goalContextMapper.mapGoalToState(goal, lifeState) // returns GoalAlignedState
// Original lifeState.activeDomains.career.score is UNCHANGED
```

---

## INVARIANT 5 — FocusPrioritizer Maximum is 3

> **The system must never present more than 3 daily priorities to the user.**

- Enforced in `FocusPrioritizer.prioritize()` via `.slice(0, 3)`.
- This is a product invariant, not a UI constraint. It must hold at engine level.
- Future agents adding priority signals must compete through the same ranked pool.

---

## INVARIANT 6 — Timeline Windows Must Be Smoothed

> **Raw signal oscillations must never be directly surfaced as timeline windows.**

- `TemporalSmoother.smooth()` must be applied before any window is returned to UI or API.
- Adjacent windows of the same category must be merged.
- Window minimum duration: 7 days (prevents chaotic adjacent switching).

---

## INVARIANT 7 — Memory Influence Requires Relevance Threshold

> **User memories may only influence guidance if `relevanceScore > 0.5`.**

- `AdaptiveMemoryRanker` calculates relevance using importance, recency decay, and phase-matching.
- Memory influence must be surfaced as observations, never as direct claims.
- Memory must **never** mutate the core LifeState — it only adjusts narrative emphasis.

---

## INVARIANT 8 — The DashboardState is the UI Contract

> **UI components must derive their state from `DashboardUIState` only, never from raw LifeState, agents, or synthesizers directly.**

- Pipeline: `LifeState → DashboardStateComposer → DashboardUIState → UI Components`
- Components are pure presentation. They receive props, not engine references.
- This ensures consistency, testability, and future replaceability of the intelligence layer.

---

## INVARIANT 9 — Cache Tier Separation

> **Different data layers have different volatility. Cache policies must reflect this.**

| Tier | Data | Cache Duration |
|------|------|---------------|
| Immutable | BirthChart, natal calculations | Permanent (invalidate on birth data change only) |
| Semi-stable | LifeState, TimelineProjection, GoalAlignments | 6–24 hours |
| Volatile | DailyBriefing, Memory-influenced guidance | Session / midnight reset |

Mixing tiers is a critical error. A volatile output must never be cached at an immutable tier.

---

## INVARIANT 10 — Narrative Tone Prohibition

> **The system must never produce fear-based, deterministic, or invasive emotional content.**

Prohibited patterns are codified in `narrativeGuardrails.ts`:
- Deterministic fate claims ("will happen", "guaranteed", "destined")
- Fear language ("disaster", "catastrophe", "doomed")
- Medical or financial certainty claims
- Content that creates dependency or amplifies anxiety

**The system should always feel:** *aware, adaptive, grounded — not omniscient, alarming, or manipulative.*

---

*These invariants are the architectural constitution of DivyaDrishti. Protect them.*
