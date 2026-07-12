# DivyaDrishti — Agent Guide

> **Vedic Astrology Intelligence Platform** — Full-stack Next.js 16 web app + Expo 56 React Native mobile companion.
>
> *Vedic wisdom, modern intelligence.*

---

## ⚠️ Critical Framework Warnings

<!-- BEGIN:nextjs-agent-rules -->
### This is NOT the Next.js you know
This version (16.2.1) has **breaking changes** — APIs, conventions, and file structure may differ from training data.
**Read `node_modules/next/dist/docs/` before writing any code.** Heed all deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:expo-agent-rules -->
### Expo HAS CHANGED
This project uses **Expo SDK 56** (React Native 0.85.3, React 19).
**Read https://docs.expo.dev/versions/v56.0.0/ before writing any mobile code.**
The mobile app lives in `C:\Users\rahul\DivyaDrishti-Mobile\mobile\`.
<!-- END:expo-agent-rules -->

---

## Project Overview

DivyaDrishti is a Vedic astrology intelligence platform that combines traditional Jyotish principles with AI to deliver personalized cosmic guidance. It has two parts:

| Part | Location | Stack | Dev Command |
|------|----------|-------|-------------|
| **Web App** | `C:\Users\rahul\DivyaDrishti\` | Next.js 16, React 19, TailwindCSS v4, Prisma, PostgreSQL | `npm run dev` → port **3001** |
| **Mobile App** | `C:\Users\rahul\DivyaDrishti-Mobile\mobile\` | Expo 56, Expo Router, React Native 0.85.3 | `npx expo start` |

The mobile app talks to the **web backend** over HTTP. In development the API URL is configurable via the in-app settings (stored in AsyncStorage under `divya:apiUrl`).

---

## Repository Layout

### Web (`C:\Users\rahul\DivyaDrishti\`)

```
src/
  app/                     # Next.js App Router pages
    api/                   # Route handlers (REST API)
      astrology/           # Chart, dasha, transit, panchang endpoints
      auth/                # login / signup
      cosmic-card/         # Cosmic card generation
      email/               # Email delivery
      guidance/            # AI guidance endpoints
      life-insights/       # Life insight analytics & predictions
      narrative/           # AI narrative generation
      panchang/            # Daily panchang
      predictions/         # Prediction records
      reflections/         # Daily reflections
      user/                # User profile & birth details
    dashboard/             # /dashboard route
    guidance/              # /guidance route
    login/                 # /login route
    onboarding/            # /onboarding route
    globals.css            # Global styles
    layout.tsx             # Root layout
    page.tsx               # Landing / redirect
    actions.ts             # Server actions

  components/              # All React UI components (33+ files)
    AapkiKundali.tsx       # Birth chart display
    DashboardHub.tsx       # Main dashboard (29 KB — large, handle carefully)
    KundliPage.tsx         # Full Kundali page (44 KB)
    LifeInsightsPage.tsx   # Life insights (148 KB — largest component)
    PlanetsDetailsPage.tsx # Planet detail views (83 KB)
    PredictionsPage.tsx    # Predictions (75 KB)
    TransitsPage.tsx       # Transits page (68 KB)
    Sidebar.tsx            # Navigation sidebar
    OnboardingForm.tsx     # Onboarding multi-step form
    # ... and many more

  context/
    LanguageContext.tsx    # Hindi/English language switcher (shared with mobile API)

  lib/
    ai/
      provider.ts          # AI provider abstraction (Gemini primary → DeepSeek fallback)
    astrology/
      engine.ts            # Core Vedic chart computation (Swiss Ephemeris WASM)
      dasha.ts             # Vimshottari Dasha calculations
      panchang.ts          # Daily panchang calculator
      panchangFormatter.ts # Panchang display formatting
      transit.ts           # Planetary transit engine
      houseResolver.ts     # House lord resolution
      houseLords.ts        # House lord mappings
    ai/ backtest/ dashboard/ data/ enforcement/ execution/
    guidance/ intelligence/ scheduler/ scoring/ utils/
    prisma.ts              # Prisma client singleton
    password.ts            # bcrypt password utilities

prisma/
  schema.prisma            # PostgreSQL schema (see Data Models below)
```

### Mobile (`C:\Users\rahul\DivyaDrishti-Mobile\mobile\`)

```
src/
  app/
    _layout.tsx            # Root layout — auth guard, font loading, routing
    login.tsx              # Sign in / Sign up screen
    onboarding.tsx         # Birth details onboarding
    kundali.tsx            # Birth chart viewer (39 KB)
    predictions.tsx        # Cosmic predictions (33 KB)
    planets.tsx            # Planet analysis
    remedies.tsx           # Sacred remedies
    weekly-rhythm.tsx      # Weekly rhythm view
    dasha.tsx              # Dasha timeline
    chat.tsx               # Pandit chat (consult)
    (tabs)/
      _layout.tsx          # Bottom tab navigator
      dashboard.tsx        # Home dashboard
      insights.tsx         # Life insights (35 KB)
      ritual.tsx           # Daily ritual
      transits.tsx         # Planetary transits (35 KB)

  context/
    LanguageContext.tsx    # Hindi/English language switcher

  services/
    api.ts                 # HTTP client (reads API URL from AsyncStorage)

  constants/
    theme.ts               # Spacing, color tokens
```

---

## Data Models (Prisma / PostgreSQL)

Key models in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `User` | Core user identity (email, password hash, reputation score) |
| `UserProfile` | Display name, timezone, language, onboarding status |
| `BirthChart` | Computed Vedic chart (lat/lon, ayanamsa, **cached `chartData` JSON** — do NOT recompute per request) |
| `UserGoal` | Goals across 6 life categories (CAREER, BUSINESS, FINANCE, RELATIONSHIP, HEALTH, SPIRITUALITY) |
| `HabitTracking` | Habit streaks and consistency scores |
| `TimelineWindow` | Astrological timeline windows with opportunities, cautions, recommendations |
| `DailyInsight` | AI-generated daily insights per user |
| `UserMemory` | Semantic memory with optional pgvector embedding |
| `LifeInsightFeedback` | User feedback on prediction accuracy |
| `LifeInsightAnalytics` | Engagement analytics for life insight predictions |
| `LifeInsightPredictionJournal` | Saved predictions with confidence scores |

> **Legacy models** (`BirthDetails`, `PredictionRecord`, `ActionUnit`, `LifePortfolio`, `AccountabilityNode`) are retained for migration safety only. Prefer the newer equivalents.

---

## AI Provider System

File: [`src/lib/ai/provider.ts`](src/lib/ai/provider.ts)

**Resolution order:**
1. **Gemini** (primary) — uses `GEMINI_API_KEY` + `@ai-sdk/google`, model: `gemini-2.0-flash`
2. **DeepSeek** (fallback) — uses `DEEPSEEK_API_KEY` + `@ai-sdk/openai`, OpenAI-compat endpoint

**Always use `callAI()`** for one-shot LLM calls. It handles fallback automatically:

```ts
import { callAI } from "@/lib/ai/provider";
const { text, provider } = await callAI({ prompt: "...", system: "...", temperature: 0.7 });
```

Use `getAIModel()` only when you need to pass the model reference directly to Vercel AI SDK's `generateText` / `streamText`.

---

## Astrology Engine

File: [`src/lib/astrology/engine.ts`](src/lib/astrology/engine.ts)

- Uses `@fusionstrings/swisseph-wasi` (Swiss Ephemeris compiled to WASM).
- **Async WebAssembly** is enabled in `next.config.ts` via `asyncWebAssembly: true`.
- The `BirthChart.chartData` JSON field is a **cached computed chart** — never recompute per-request; always read from DB and recompute only on initial save or explicit refresh.
- Ayanamsa is stored per chart and affects all calculations — always pass it through.

---

## Authentication

- **Web:** Email + bcrypt password hash stored in `User.passwordHash`. No JWT/session library — session state managed via server actions and cookies.
- **Mobile:** Stores `divya:loggedIn` and `divya:userEmail` in AsyncStorage. Auth is checked on every route segment change in `_layout.tsx`.

**Auth flow (mobile):**
1. POST `/api/auth/login` or `/api/auth/signup`
2. On success → store in AsyncStorage → check `BirthDetails` → route to `/(tabs)/dashboard` or `/onboarding`

---

## Design System & Aesthetics

### Web
- **CSS Framework:** TailwindCSS v4 (PostCSS plugin: `@tailwindcss/postcss`)
- **Animations:** Framer Motion (`framer-motion ^12`)
- **Icons:** Lucide React (`lucide-react ^1.7`)
- **Fonts:** Geist (via `next/font`)
- **Theme:** Dark cosmic / deep space aesthetic with gradient accents

### Mobile
- **Theme:** Warm spiritual/parchment palette
  - Background: `#F8F5EF` (warm parchment)
  - Primary: `#D97706` (amber-600)
  - Text: `#451A03` (amber-950) / `#78350F` (amber-900)
  - Border: `#EFE8D9`
- **Fonts:** Inter (Regular 400, SemiBold 600, Bold 700) via `@expo-google-fonts/inter`. Georgia/serif for headings on iOS.
- **Animations:** Moti (`moti ^0.30`) + React Native Reanimated 4
- **Icons:** Lucide React Native (`lucide-react-native ^1.20`)
- **Language:** Hindi/English toggling via `LanguageContext`

---

## Environment Variables

### Web (`.env` at `C:\Users\rahul\DivyaDrishti\`)

```env
DATABASE_URL=           # PostgreSQL connection string (required)
GEMINI_API_KEY=         # Google Gemini API key (primary AI)
DEEPSEEK_API_KEY=       # DeepSeek API key (AI fallback)
```

### Mobile (`.env` at `C:\Users\rahul\DivyaDrishti-Mobile\`)

Mobile does not use `.env` directly; the backend API URL is configured at runtime via the in-app settings panel and stored in AsyncStorage.

---

## Development Commands

### Web

```powershell
# From C:\Users\rahul\DivyaDrishti\
npm run dev        # Start dev server on port 3001
npm run build      # Production build (--webpack flag set)
npm run lint       # ESLint

# Prisma
npx prisma studio  # Open DB browser
npx prisma migrate dev --name <name>   # New migration
npx prisma generate                    # Regenerate client after schema change
```

### Mobile

```powershell
# From C:\Users\rahul\DivyaDrishti-Mobile\mobile\
npx expo start              # Start Metro bundler
npx expo run:android        # Build & run on Android device/emulator
npx expo run:ios            # Build & run on iOS simulator
npx expo start --web        # Web preview
```

---

## Key Conventions

### Do
- **Always read the Next.js docs** in `node_modules/next/dist/docs/` before using any Next.js API.
- **Always read https://docs.expo.dev/versions/v56.0.0/** before writing any Expo or React Native code.
- Use `callAI()` from `src/lib/ai/provider.ts` for all LLM calls — never instantiate providers directly in route handlers.
- Read `BirthChart.chartData` from the database — never recompute the full chart per request.
- Use the Prisma singleton from `src/lib/prisma.ts` (not `new PrismaClient()` inline).
- Keep large components focused — `LifeInsightsPage.tsx` (148 KB), `KundliPage.tsx` (44 KB), etc. are already large. Prefer extracting new sub-components over growing these further.
- Use TypeScript strictly — `tsconfig.json` is strict mode.
- Maintain the Hindi/English language context pattern already established in `LanguageContext`.

### Don't
- Don't add new direct Gemini/DeepSeek SDK imports in route handlers — use `callAI()` / `getAIModel()`.
- Don't use `new PrismaClient()` inline — always import from `@/lib/prisma`.
- Don't recompute birth charts unless explicitly saving/refreshing — use cached `chartData`.
- Don't use TailwindCSS classes not compatible with v4 (`@apply` with arbitrary values may behave differently).
- Don't use Expo APIs not available in SDK 56 — check the versioned docs first.
- Don't install new packages without checking compatibility with React 19 and Next.js 16.

---

## Architecture Notes

### API ↔ Mobile Connection
The mobile app is a **thin client** — it calls the Next.js API routes for all data. The API URL is user-configurable in the login screen settings (gear icon). In local development, set it to your machine's LAN IP, e.g., `http://192.168.1.x:3001`.

### Vedic Astrology Domain
- **Ayanamsa:** Sidereal system (Vedic / Lahiri) — distinct from Western tropical. All planetary positions are sidereal.
- **Dasha System:** Vimshottari Dasha (120-year cycle). Computed from Moon's nakshatra at birth.
- **Panchang:** Daily almanac including Tithi, Nakshatra, Yoga, Karana, and Vara.
- **Houses:** Whole-sign house system by default; ascendant (Lagna) is fundamental.

### Component Naming
Large feature components follow `<Feature>Page.tsx` convention (e.g., `PlanetsDetailsPage.tsx`, `LifeInsightsPage.tsx`). Dashboard sub-widgets follow `<Feature>Card.tsx` or `<Feature>View.tsx`.

---

## Testing & Verification

- No automated test suite is currently configured.
- Verify changes by running `npm run dev` and navigating the relevant page in-browser.
- For mobile changes, use `npx expo start` and test on an Android device or emulator.
- Run `npm run lint` to catch TypeScript/ESLint issues before committing.
- For Prisma schema changes, always run `npx prisma migrate dev` and `npx prisma generate`.

---

*This file is for AI coding agents. Keep it up to date as the project evolves.*
