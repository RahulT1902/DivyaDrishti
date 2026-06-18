# DivyaDrishti — Experience Invariants

> **Status**: Active | **Version**: 1.0.0 | **Last Reviewed**: May 2026
>
> This document codifies the **emotional and interaction design invariants** of DivyaDrishti. 
> These guidelines are not recommendations; they are product constraints that protect the emotional atmosphere, psychological safety, and ritual pacing of the experience.

---

## The Core Thesis: Atmosphere is Identity

In DivyaDrishti, we are not optimizing for feature volume, raw engagement metrics, or calculation speed. We are optimizing for **emotional atmosphere and reflective behavior**. 

Our engineering and design efforts are directed toward transitioning from **feature design to ritual behavior design**. The user should interact with this software in the same state of mind they bring to lighting a candle, brewing morning tea, or starting a meditation.

```
       [ Traditional App ]                 [ DivyaDrishti ]
      Urgency & Stimulation             Stillness & Reflection
      • Gamification/Streaks            • Voluntary Engagement
      • Doom-astrology alerts           • Non-deterministic guidance
      • Pulsing/Blinking dots           • Deep, slow breathing room
```

---

## 1. Target Emotional States

Every screen, interaction, copy block, and layout decision must align with the target emotional state.

| We actively cultivate: | We aggressively avoid: |
|---|---|
| **Held**: The user feels safe, accepted, and contained. | **Monitored**: The feeling of telemetry, tracking, or surveillance. |
| **Calm**: A low-heart-rate, spacious interface. | **Stimulated**: Colorful spikes, dopamine hit indicators, or high energy. |
| **Grounded**: Focused on bodily, spatial, and present awareness. | **Alerted**: Red badges, high-contrast attention callouts, or alarm prompts. |
| **Reflective**: Inviting pause, self-inquiry, and internal space. | **Pressured**: Urgency indicators, ticking countdowns, or task anxiety. |

---

## 2. The Interaction Invariants

### INVARIANT 1: Stillness Communicates Trust
- **No attention-seeking animations**: Foreground UI elements must never pulse, bounce, spin, or jitter. 
- **No live-system energy**: Do not display "online indicators," blinking heartbeats, active processing pings, or real-time connectivity status dots. Stillness is the primary indicator of software stability.
- **Exceptions**: Natural loading states (such as a slow, fading transition or a transient skeleton screen) are allowed during network requests, but they must automatically transition to stillness once resolved.

### INVARIANT 2: Environmental Motion Only
- **Motion speed and loop cycle**: Animations are restricted to ambient background drifts, subtle breathing gradients, and environmental color shifts.
- **The 10-Second rule**: Any infinite animation loop must take at least **10 to 16 seconds** to complete one full cycle. 
- **Transitions**: Slide-ins and page transitions must be slow, easing in and out (`framer-motion` duration of `0.6s` to `1.2s` with ease-out), avoiding mechanical snappiness or high velocity.

### INVARIANT 3: One Emotional Focus per Surface
- A viewport must guide the user to do or feel **one thing** at a time.
- Do not stack dense, competitive cognitive spaces. If the user is calibrating their Morning Brief, they must not see active Remedies or charts vying for visual dominance.
- White space (breathing room) is a first-class feature. If a surface feels "crowded," reduce the visual density or hide detail layers behind a deliberate side drawer.

### INVARIANT 4: Zero Gamified Spirituality
- DivyaDrishti must never use growth-hacking mechanics.
- **Forbidden**: Points, experience scores, ranking tiers, leveling systems, penalizing streaks, visual badges, share triggers, or lock-in loops.
- **Streaks and Consistency**: If consistency is tracked (e.g., in reflection history), it must be framed as a *reflection loop* rather than a gamified obligation. There are no penalty cycles for "missing a day."

---

## 3. Language & Interpretation Invariants

Our text and narrative guidance must reflect **guided symbolic self-reflection**, not predictive or doom astrology.

### RULE 1: Never Deterministic
Astrological signals do not dictate physical reality or fate. They offer symbolic frameworks for looking inward.
- *Avoid*: "Saturn entering your 10th house will cause job loss."
- *Use*: "As Saturn patterns draw attention to professional foundations, it is an inviting time to review what structures no longer serve your growth."

### RULE 2: Strengths Must Include Shadow/Distortion Tendencies
No archetype or planet is purely beneficial or harmful. Every strength has an unconscious distortion pattern (the shadow), and every difficulty contains a seed of integration.
- For every planetary strength or placement surfaced, the system must present a `shadowTendency` (a self-awareness prompt) and `groundingGuidance` (a quiet behavioral pivot) to ensure psychological integration.

### RULE 3: Imbalance as Misalignment, Never Punishment
Astrological configurations that are challenging must never be framed as karmic punishment, curses, or negative fate.
- Frame imbalances as invitations to align, reintegrate, or rest.
- Refuse fear-based timing traps ("Your window of opportunity is closing," "Critical danger period").

### Example Transformations

| Poor Narrative Style (Avoid) | Calming Narrative Style (Apply) |
|---|---|
| “Mars causes aggression and arguments today.” | “When urgency rises internally, stillness before reaction becomes protective.” |
| “Your Saturn Dasha is starting; prepare for a period of delay, hardship, and loss.” | “An upcoming cycle draws focus toward slow foundations. Pacing yourself becomes a source of quiet strength.” |
| “Warning: Rahu is disrupting your thoughts. Perform remedies immediately to avoid bad decisions.” | “With mental signals shifting, pausing to breathe before making commitments helps anchor your clarity.” |

---

## 4. High-Risk Future Features

When building new features, protect the experiential coherence of the product. The following patterns are **critical risks** that must be actively rejected:

1. **Noisy Widgets**: Real-time notifications, chat bubbles that pop up with uninvited tips, or floating elements.
2. **Notification Escalation**: Re-engagement emails or push notifications that appeal to fear of missing out (FOMO) or spiritual urgency.
3. **Engagement Metrics**: Visualizing how many minutes a user spent, or prompting them to spend more time in the app.
4. **Growth-Hacking Loops**: Refer-a-friend flows embedded inside spiritual rituals, or locking core meditative features behind social sharing tasks.

---

*Our moat is not our calculation engine. It is not our database structure. It is not our LLM orchestration.*
*Our moat is this emotional philosophy encoded into interaction design.*
