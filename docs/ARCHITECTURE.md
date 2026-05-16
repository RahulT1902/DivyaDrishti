# DivyaDrishti — System Architecture

> **Version**: 1.0.0 | **Classification**: Internal Engineering Reference

---

## Product Identity

DivyaDrishti is a **Contextual Life Intelligence Platform** — not an astrology app.

It answers: *"How should I navigate my current life phase?"*  
Not: *"What do the planets say?"*

Category: **AI Behavioral Timing System**

---

## The 6-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Deterministic Symbolic Layer                      │
│  /lib/astrology                                             │
│  engine.ts · dasha.ts · transit.ts · houseLords.ts         │
│  Output: NatalChart, DashaContext, TransitIntelligence[]    │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  LAYER 2: Contextual Synthesis Layer                        │
│  /lib/intelligence/synthesizers                             │
│  lifeStateSynthesizer.ts · careerSynthesizer.ts            │
│  financeSynthesizer.ts                                      │
│  /lib/intelligence/agents                                   │
│  TransitAgent · DashaAgent · RealityValidatorAgent         │
│  /lib/intelligence/resolvers                                │
│  tensionResolver.ts (v2) · realityValidator.ts             │
│  Output: LifeState (canonical contract)                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  LAYER 3: Goal Intelligence Layer                           │
│  /lib/intelligence/goals                                    │
│  goalContextMapper.ts · goalAlignmentScorer.ts             │
│  goalFrictionResolver.ts · executionStyleEngine.ts         │
│  Output: GoalAlignedState[]                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  LAYER 4: Temporal Projection Layer                         │
│  /lib/intelligence/timeline                                 │
│  timelineProjectionEngine.ts · signalAggregator.ts         │
│  windowClassifier.ts · temporalSmoother.ts                 │
│  Output: TimelineProjection (contract)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  LAYER 5: Narrative Humanization Layer                      │
│  /lib/intelligence/narrative                                │
│  narrativeGuardrails.ts (constitution)                     │
│  narrativeStyleGuide.ts · narrativePromptAssembler.ts      │
│  narrativeRenderer.ts                                       │
│  API: /api/narrative/generate                               │
│  Output: Validated narrative strings                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  LAYER 6: Daily Adaptive Guidance Layer                     │
│  /lib/guidance                                              │
│  dailyGuidanceSynthesizer.ts · adaptiveMemoryRanker.ts     │
│  focusPrioritizer.ts · guidanceCompressor.ts               │
│  API: /api/guidance/daily                                   │
│  UI: /app/guidance/page.tsx · MorningBriefing.tsx          │
│  Output: DailyBriefing (≤3 priorities, 1 headline)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Contracts

| Contract | File | Consumers |
|---|---|---|
| `LifeState` | `contracts/lifeState.ts` | All layers downstream |
| `GoalAlignedState` | `contracts/goalState.ts` | Guidance, Timeline, Narrative |
| `TimelineProjection` | `contracts/timelineState.ts` | Dashboard, Narrative |
| `DashboardUIState` | `dashboard/dashboardStateComposer.ts` | All UI components |
| `DailyBriefing` | `guidance/guidanceCompressor.ts` | MorningBriefing UI |

---

## Data Flow Summary

```
Birth Data → AstroEngine → NatalChart
                             ↓
                         DashaEngine → DashaContext
                             ↓
                         TransitEngine → TransitIntelligence[]
                             ↓
                     LifeStateSynthesizer → LifeState
                             ↓
                       GoalContextMapper → GoalAlignedState[]
                             ↓
                  TimelineProjectionEngine → TimelineProjection
                             ↓
                   DashboardStateComposer → DashboardUIState
                          ↙           ↘
             NarrativeLayer      DailyGuidanceSynthesizer
                  ↓                         ↓
          Humanized strings          DailyBriefing
                  ↓                         ↓
              Dashboard UI          MorningBriefing UI
```

---

## Database Schema Summary (Prisma)

| Model | Purpose | Cache Tier |
|---|---|---|
| `BirthChart` | Cached natal computation (JSON) | Immutable |
| `UserProfile` | Preferences and onboarding state | Long-lived |
| `UserGoal` | Active goals with emotional weight | Days |
| `HabitTracking` | Streak and consistency state | Daily |
| `TimelineWindow` | Persisted projected phases | Hours |
| `DailyInsight` | Historical briefing record | Permanent history |
| `UserMemory` | Ranked behavioral context (vector-ready) | Session-ranked |

---

## What DivyaDrishti Is NOT

- ❌ An astrology chatbot
- ❌ A horoscope generator  
- ❌ A prediction engine
- ❌ An LLM reasoning system

## What DivyaDrishti IS

- ✅ A deterministic contextual life-phase interpreter
- ✅ A goal-aware strategic navigation system
- ✅ A temporal behavioral timing engine
- ✅ An explainable, auditable AI guidance platform
