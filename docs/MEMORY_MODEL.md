# DivyaDrishti — Memory Model

> **Version**: 1.0.0 | This document defines how user memory is stored, ranked, and applied.

---

## Design Philosophy

The memory system must feel: **aware and adaptive — not invasive or surveillance-like.**

Memory influence is always:
- **Observable** — the user can see when memory context is active
- **Bounded** — never mutates core scores, only adjusts narrative emphasis
- **Decaying** — old memories lose influence over time (90-day window)
- **Thresholded** — only surfaces when `relevanceScore > 0.5`

---

## Memory Types (`MemoryType` enum)

| Type | Purpose | Influence |
|---|---|---|
| `PREFERENCE` | Communication style, output format | Narrative tone |
| `FEAR` | Recurring anxieties, stress triggers | Caution emphasis |
| `AMBITION` | Goals, aspirations, drives | Reinforcement |
| `OBSERVATION` | Behavioral patterns noted by system | Focus adjustment |
| `CONTEXT` | Situational context (job change, etc.) | Prioritization |

---

## Ranking Algorithm (`AdaptiveMemoryRanker`)

```
score = memory.importance (base: 0.5)
      + phase_boost        (FEAR during high volatility: +0.3)
      + ambition_boost     (AMBITION during low volatility: +0.2)
      + observation_boost  (always: +0.15)
      × recency_factor     (decays linearly over 90 days: 0.6 → 1.0)
```

Top 3 memories by relevance score are passed downstream. Never more.

---

## Event-Driven Write Policy (Future Implementation)

Memory writes should ONLY occur on explicit events:

| Event | Memory Written |
|---|---|
| User logs emotional state | `OBSERVATION` |
| Goal created or updated | `AMBITION` or `CONTEXT` |
| Streak broken (3+ days) | `OBSERVATION` |
| Major transition crossed | `CONTEXT` |
| Repeated query pattern (3x same topic) | `OBSERVATION` |
| User explicitly journals | `OBSERVATION` or `FEAR` |

**Prohibited write triggers:**
- Continuous background polling
- Inferred emotional states from passive behavior
- Any write not tied to an explicit user action or system event

---

## Ethical Boundaries

1. Memory must never create **dependency loops** (same fear reinforced repeatedly)
2. Memory must never **amplify anxiety** — `FEAR` memories reduce caution in low-volatility phases
3. Memory content is **never sent to the LLM raw** — only `influence` type and a sanitized behavioral signal
4. Users must have the ability to **view and delete** all their memories (GDPR compliance)
5. Memory **never mutates** `LifeState` scores — it only shifts narrative tone and focus priority ranking
