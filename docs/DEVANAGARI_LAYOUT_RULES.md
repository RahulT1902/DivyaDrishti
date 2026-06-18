# Devanagari Typography & Layout Guidelines

This document outlines the visual layout standards for rendering Devanagari script across the DivyaDrishti ecosystem. Devanagari requires precise spacing and vertical flow parameters to prevent layout clipping and character fragmentation.

---

## 1. The Shirorekha Integrity Rule (No Wide Tracking)

The horizontal hanging line that connects Devanagari characters (the *shirorekha*) must never be fragmented. 

*   **Rule**: Never use letter-spacing (`letter-spacing`, `tracking-wide`, `tracking-widest`, `tracking-wider`) on any text block rendered in Devanagari.
*   **Correction**: If a component wraps both English and Hindi strings and uses spacing classes, isolate the Hindi container or explicitly override with `tracking-normal` or `tracking-normal !important`.

```html
<!-- INCORRECT - Shirorekha breaks, separating letters -->
<h3 class="tracking-widest text-amber-900">मंगलमय प्रभात</h3>

<!-- CORRECT - Clean, connected letters -->
<h3 class="tracking-normal text-amber-900 text-lg leading-relaxed">मंगलमय प्रभात</h3>
```

---

## 2. Vertical Line-Height Amplification

Devanagari script has complex vertical glyph features (both *matras* above the shirorekha, like `ै`, `ो`, `ौ`, `ी`, and *halant* / subscripts below the baseline, like `ु`, `ू`, `ृ`, `्`). Standard Latin line-height defaults will clip or compress these features.

*   **Standard text blocks**: Minimum line-height must be `leading-relaxed` (1.625) or `leading-loose` (2.0) for larger paragraph readings.
*   **Dense layouts**: Never use `leading-none` or `leading-tight`. For tight areas, use at least `leading-normal` (1.5).

```css
/* Standard Latin CSS */
line-height: 1.2; 

/* Hindi/Devanagari Corrected CSS */
line-height: 1.6;
```

---

## 3. Title Scaling and Visual Weight

Hindi characters appear visually smaller and more intricate than equivalent Latin uppercase characters of the same `font-size`. 

*   **Rule**: Increase font size by roughly **10-15%** for Hindi headings when toggled, or use visual equivalents that let the ornate script hold the same structural weight.
*   **Example**: If an English label uses `text-xs`, use `text-sm` for the Hindi equivalent.
*   **Sans-Serif Baseline**: Avoid blocky, clinical system fonts. Favour smooth, humanistic sans-serifs that render Devanagari with organic pen strokes (like Google Fonts' *Teko* for large numbers, and *Outfit* / *Inter* / *Noto Sans Devanagari* for body text).

---

## 4. Mixed-Language Formatting

When mixing English/Latin labels (e.g. planetary degrees, numbers, planet abbreviations like `Sa`, `Mo`, `Ju`) alongside Sanskritized Hindi characters, follow these styling patterns:

*   **Data Values (Numbers, Deg/Min)**: Render these in standard clean monospace or light numeric fonts (`font-mono`) to keep metric grids aligned, but keep adjacent descriptions in soft Devanagari.
*   **Planet Symbols**: Keep standard symbols (e.g. `♄`, `♃`, `☉`) adjacent to Hindi planet names (e.g. `शनि ♄`, `गुरु ♃`, `सूर्य ☉`) to maintain immediate, highly readable symbolic recognition.

---

## 5. Summary Reference

| Visual Parameter | Latin Target | Devanagari Target | Rationale |
| :--- | :--- | :--- | :--- |
| **Tracking** | `tracking-widest` | `tracking-normal` | Preserves connected shirorekha lines |
| **Line-Height** | `leading-snug` (1.375) | `leading-relaxed` (1.625) | Prevents clipping of matras / subscripts |
| **Header Spacing**| Normal margins | Increased bottom margin | Avoids vertical overlap with adjacent components |
| **Font Size Scale**| `text-xs` | `text-sm` | Balances lower structural weight of ornate script |
