# DivyaDrishti — Ritual Experience Principles

This document governs the design, pacing, aesthetics, and interaction mechanics of DivyaDrishti. All frontend components, transitions, copy, and layout structures must align with these guidelines to ensure the software remains a calm, sacred daily ritual.

---

## 1. Core Psychological Objective
**"What should the user feel?"**
The user should feel a sense of clarity, groundedness, and emotional alignment. The experience should mimic lighting a candle, brewing morning tea, or sitting down for meditation. It should NEVER feel like checking a social feed, a calendar dashboard, or an analytical tool.

- **Before opening**: Anticipation of gentle grounding.
- **During engagement**: Focused attention, spacious breathing room, quiet revelation.
- **After closing**: Reassurance, clarity of purpose, emotional readiness.

---

## 2. Pacing Rules
- **No Infinite Scroll**: The daily dashboard has a clear beginning, middle, and end. When the user finishes reading, they are done. 
- **The 45-Second Calibration**: The Morning Brief must be readable in under 45 seconds. It is a catalyst for daily action, not a research paper.
- **The 30-Second Close**: The Evening Reflection is an ambient check-in, designed for quick emotional alignment, taking less than 30 seconds to complete.

---

## 3. Information Density Limits
- **One Primary Insight per Screen**: Focus the user's attention. If they are reading their Morning Brief, the Panchang should not be vying for visual dominance.
- **Ambient Astrology**: Astrology is used for *interpretation*, not *exposure*. Hide planetary degrees, houses, and complex names behind subtle tooltips or details panels. Keep the primary card interface clean.
- **Minimalist Lists**: Limit action lists to exactly 3 items and avoid lists to exactly 2 items.

---

## 4. Visual & Motion Restraint
- **Subtle Time-of-Day Transitions**: 
  - *Morning Mode* (Sunrise to 4:00 PM): Light amber and soft gold glowing accents against a deep, warm aubergine background.
  - *Evening Mode* (4:00 PM to Dawn): Silver, steel-blue, and dark violet accents against a deep, cold space-black background.
  - Transitions between these modes must be achieved via slow, ambient CSS gradients—never harsh layout shifts or aggressive flashing.
- **Micro-Animations only**: Animation is limited to gentle fade-ins (`framer-motion` duration of `0.6s` to `1.2s` with ease-out) and soft pulsing effects on interactive elements. Avoid bouncing, spinning, or high-velocity page transitions.

---

## 5. Daily Behavior Bridge ("Today Favors")
- The Panchang must not be displayed in isolation. Every astrological element is translated into practical guidance.
- We bridge ancient calculations with daily life by adding a dedicated **"Today Favors"** list directly below the five limbs of the Panchang, indicating 2-3 specific behavioral styles favored by today's alignments.

---

## 6. Forgiving Reflection Loops
- Humans misclick. The Evening Reflection allows edits for exactly **1 hour** post-submission.
- After 1 hour, the entry is locked to prevent obsessive re-logging and preserve the integrity of the historical predictive feedback loop.

---

## 7. The Cosmic Card Philosophy
- **Calm over Noise**: The shareable daily card must resemble premium spiritual editorial design. 
- Use thin borders, generous padding, high-contrast serif typography, and deep backgrounds.
- Avoid large logos, promotional banners, or loud badges. The card should be beautiful enough that a user would print it out or keep it on their screen as a wallpaper.

---

## 8. Anti-Notification & Attention Philosophy
- **Zero Attention Traps**: No red badges, no unread notification counts, and no gamified streaks that feel punitive if broken.
- **Quiet Calibration**: Streaks represent consistency and self-awareness, not competitive performance.
