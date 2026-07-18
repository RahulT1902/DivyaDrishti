# DivyaDrishti — Agent Guide (Web Backend)

> Vedic Astrology Intelligence Platform — Next.js 16 API backend + web frontend.
> Primary working directory: `C:\Users\rahul\DivyaDrishti\`
> Shared GitHub remote: `RahulT1902/DivyaDrishti`

---

## Two-App Architecture

| App | Location | Role |
|-----|----------|------|
| **Web (this repo)** | `C:\Users\rahul\DivyaDrishti\` | API backend + web frontend. All astrological computation happens here. |
| **Mobile web** | `C:\Users\rahul\DivyaDrishti-Mobile\` | Separate Next.js app optimized for mobile browsers. Calls this app's API. |

Both repos push to the same GitHub remote. Always `git pull --rebase` the Mobile repo before pushing it, since both share files that can conflict.

---

## Critical Warnings

- **Next.js 16.2.1** — breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before using any Next.js API.
- **No `prisma migrate dev`** — this project uses `npx prisma db push` directly. There is no `migrations/` folder.
- **`postinstall: "prisma generate"`** is in `package.json` — runs automatically on `npm install`. Vercel runs it too.
- **Gold suite must pass before every merge** — `npx tsx scripts/validate.ts` (6 charts, 37 assertions).

---

## Symbolic Pipeline (Architecture v1.0 — frozen)

The core engine is an 8-layer deterministic pipeline. **Do not propose adding or removing layers.**

```
ChartSuite → PlanetIntelligence → PlanetStrength → YogaDetection
→ ActivationEngine → InferenceEngine → HypothesisEngine → DecisionGraph
→ AstrologyContext
```

Single entry point: `AstrologyContextBuilder.build(chartSuite, { dasha?, transit?, horizon? })`

Three-layer narrator model:
1. **Engine state** (hidden — deterministic symbolic output)
2. **Pundit observations** (LLM input — pre-computed content with placeholders)
3. **Conversation** (LLM output — narrates, never reasons)

---

## Consultation Intelligence Layer

Lives in `src/lib/consultation/`. Enables multi-turn conversation continuity.

| File | Role |
|------|------|
| `conversationState.ts` | Extracts `ConversationState` from history + optional stored memories. Parses prior assessment from last assistant message (emoji header + "Overall:" line). |
| `intentResolver.ts` | Maps question → `ResolvedConsultationIntent`. 11 intent types: Forecast, Timing, Decision, Advice, Probability, Explanation, FollowUp, PlanetQuestion, DashaQuestion, TransitQuestion, Comparison. |
| `questionPlanner.ts` | Returns `ConsultationPlan` with `responseMode: "full" \| "delta" \| "direct"`. Builds `directPrompt` for delta/direct. |
| `sessionMemory.ts` | `loadUserMemories()`, `saveConsultationMemory()`, `extractMemoryFromResponse()`. Fire-and-forget — never blocks the chat response. |

**Response routing** (in `src/app/api/astrology/chat/route.ts`):
1. Load stored memories → `buildConversationState(q, history, storedMemories)`
2. `resolveConsultationIntent` → `planConsultation`
3. If `responseMode !== "full"` → call AI with `directPrompt` (1–4 sentences)
4. Else → run domain engine → full structured response → `saveConsultationMemory()`

---

## Domain Engines

Lives in `src/lib/domains/`. Each engine: `evaluate(ctx: AstrologyContext)` → `buildPrompt(assessment, question)` → `{ systemInstruction, userMessage }`.

| Domain | Engine | Emoji | Key features |
|--------|--------|-------|-------------|
| Health | `HealthEngine` | 🌿 | `buildEnrichedPrompt()` with body risk profile + temporal label (Today/Tomorrow) |
| Career | `CareerEngine` | 💼 | `evaluateCareerSituations()` — named situations: Promotion Window, Building Phase, etc. |
| Finance | `FinanceEngine` | 💰 | Money flow, opportunity, conditional risk section |
| Marriage | `MarriageEngine` | 💝 | Relationship compatibility and timing |

**Temporal queries:** `calculateCurrentTransits(forDate?: Date)` in `src/lib/astrology/transit.ts`. Pass `new Date(Date.now() + 86400000)` for tomorrow. The `temporalLabel` ("Today"/"Tomorrow") propagates to `buildEnrichedPrompt`.

---

## Gold Suite (run before every merge)

```bash
npx tsx scripts/validate.ts
```

6 charts, 37 assertions, must be 100%. Never merge a rule/yoga/inference change that breaks this.

```
tests/gold-charts/
  career/chart001/                  # Cancer asc, exalted 10th lord + Sun
  career/chart002/                  # Cancer asc, debilitated combust 10th lord
  marriage/chart001/                # Aries asc, exalted Venus, Moon in 7th
  health/chart001/                  # Leo asc, Sun in lagna, exalted Mars in 6th
  health/chart001-transit-today/    # Moon in 1st → score 65/100
  health/chart001-transit-tomorrow/ # Moon in 6th → score 38/100
```

Every production bug → permanent gold chart.

---

## Data Models (Prisma / Neon PostgreSQL)

Schema: `prisma/schema.prisma`. Key models:

| Model | Purpose |
|-------|---------|
| `User` | Email, password hash (bcrypt), reputation score |
| `BirthDetails` | **Active auth lookup** — DOB, time, lat/lng, timezone. Used in `user.birthDetails`. |
| `BirthChart` | Cached computed chart JSON. Read from DB, never recompute per request. |
| `ConsultationMemory` | Last known domain assessment per user (overallLine, whySentence, dasha snapshot). `@@unique([userId, domain])`. **Table must be created with `npx prisma db push`** — not done yet as of 2026-07-13. |
| `UserMemory` | Semantic memory (vector embedding optional) |
| `LifeInsightPredictionJournal` | Saved predictions with confidence scores |

> `BirthChart` and `BirthDetails` are separate models. The chat route uses `user.birthDetails` (not `BirthChart`). Don't confuse them.

---

## Authentication

JWT-based. File: `src/lib/auth/`

- `getAuthUser(req)` — resolves auth from: (1) `Authorization: Bearer <jwt>` header, (2) `x-user-email` header (legacy), (3) `email` query param (legacy).
- `verifyToken(token)` → `{ userId, email }` or null.
- Web auth: JWT stored in `localStorage` as `divya:token` + `divya:loggedIn`, `divya:userEmail`.
- Login page: `src/app/login/page.tsx` — Sign In / Create Account toggle. Defaults to Sign In.
- Onboarding: `src/app/onboarding/page.tsx` — 4-step form with Month/Day/Year dropdowns (not `type="date"`) and Hour/Minute dropdowns (not `type="time"`).

---

## AI Provider

File: `src/lib/ai/provider.ts`

Resolution order: **Gemini** (`GEMINI_API_KEY`, `gemini-2.0-flash`) → **DeepSeek** (`DEEPSEEK_API_KEY`, OpenAI-compat).

Always use `callAI({ prompt, system?, temperature? })` — never instantiate providers in route handlers.

---

## Astrology Stack

- Swiss Ephemeris WASM: `@fusionstrings/swisseph-wasi`. Async WASM enabled in `next.config.ts`.
- Ayanamsa: Lahiri (sidereal). All positions are sidereal — not tropical.
- Dasha: Vimshottari (120-year cycle from Moon nakshatra at birth).
- Panchang: Tithi, Nakshatra, Yoga, Karana, Vara. `src/lib/astrology/panchang.ts`.
- Houses: Whole-sign.

---

## Repository Structure

```
src/
  app/
    api/
      astrology/chat/route.ts     # Main Pundit chat endpoint (large — read carefully)
      astrology/chart/            # Chart computation
      auth/login/  auth/signup/   # JWT auth
      family/                     # (planned) Family member kundalis
      user/                       # User profile + birth details
    dashboard/  guidance/  login/  onboarding/
    actions.ts                    # Server actions (registerUser)

  components/
    PunditChatView.tsx            # Chat UI (expandable domain responses)
    OnboardingForm.tsx            # Legacy all-in-one onboarding (has "Sign in" link)
    DashboardHub.tsx              # Main dashboard
    Sidebar.tsx                   # Nav sidebar

  lib/
    consultation/                 # Consultation Intelligence Layer (see above)
    core/                         # Symbolic pipeline internals
    domains/health/ career/ finance/ marriage/
    astrology/                    # Engine, dasha, transit, panchang
    ai/provider.ts
    auth/getUser.ts  auth/jwt.ts
    prisma.ts                     # Singleton Prisma client

  scripts/
    validate.ts                   # Gold suite runner

tests/gold-charts/                # Regression test fixtures
prisma/schema.prisma
```

---

## Dev Commands

```powershell
# From C:\Users\rahul\DivyaDrishti\
npm run dev          # Dev server → port 3001
npm run build        # Production build (--webpack)
npm run validate     # Gold suite (alias for npx tsx scripts/validate.ts)
npx tsc --noEmit     # TypeScript check (no output = clean)
npx prisma db push   # Sync schema to Neon DB (use instead of migrate dev)
npx prisma generate  # Regenerate client after schema change
npx prisma studio    # DB browser
```

---

## Roadmap (next features)

1. **Family Plan** — up to 4 kundalis per account. New `FamilyMember` model. `GET/POST /api/family`, `DELETE /api/family/[id]`. Chat route accepts optional `familyMemberId`. Person-switcher UI in chat.
2. **Proactive Daily Brief** — push notification + morning card (Moon + transits).
3. **Remediation Layer** — domain state + dasha → practical remedy recommendations.
4. **Ashtakavarga Transit Accuracy** — chart-specific transit scoring.

---

## What NOT to do

- Don't propose architectural pipeline changes (frozen v1.0).
- Don't use `npx prisma migrate dev` — use `npx prisma db push`.
- Don't instantiate AI providers directly in routes — use `callAI()`.
- Don't use `new PrismaClient()` inline — import from `@/lib/prisma`.
- Don't merge rules/yogas without passing the gold suite.
- Don't add features to multiple domains in parallel — one at a time with gold chart coverage.

---

*Keep this file updated as the project evolves. Last updated: 2026-07-13.*
