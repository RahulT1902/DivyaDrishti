# ChatPundit Gold Standard v1.0

Adopted 2026-11-04 as the benchmark for every ChatPundit response. Health migrates first; other domains follow one at a time, each validated against this standard before the next starts.

The standard measures **reasoning quality and response structure**. It is not evidence that astrology forecasts medical or life events accurately; predictive performance needs separate validation against prospectively recorded outcomes.

- Rubric (code): [`src/lib/consultation/goldStandard/rubric.ts`](../src/lib/consultation/goldStandard/rubric.ts)
- Benchmark: [`scripts/pundit-benchmark.ts`](../scripts/pundit-benchmark.ts) → results in `tests/pundit-benchmark/results/`
- Reference sample ("Gold Standard Health Prediction"): not yet provided. The rubric is built from the written framework below.

---

## Framework (as adopted)

### Objective

Use the accompanying Gold Standard Health Prediction as the reference for all future health-related consultations.

The objective is to produce chart-specific, multi-factor Vedic astrology interpretations that combine technical astrological reasoning with natural, human-readable explanations.

Do not simply imitate the sample's wording. Replicate its reasoning methodology.

### 1. Chart-first reasoning

Before generating any prediction:

- Retrieve the user's authoritative natal chart.
- Verify planetary sign, house, degree and dignity.
- Separate natal placements from current transits.
- Retrieve the active Mahadasha, Antardasha and Pratyantar.
- Verify the requested date and applicable planetary positions.
- Never invent missing planetary placements.

If essential chart information is unavailable, explicitly state what cannot yet be assessed.

### 2. Multi-factor analysis

Every interpretation must evaluate multiple relevant astrological factors.

For health:
- Ascendant and Ascendant lord.
- Sixth house and sixth lord.
- Eighth house and eighth lord.
- Twelfth house and twelfth lord.
- Moon and its condition.
- Relevant planetary aspects and conjunctions.
- Current Dasha activation.
- Current transit interactions.

For other domains, select the relevant houses and planetary significators instead of reusing the health framework.

### 3. Planetary evidence hierarchy

1. Natal chart establishes the underlying astrological framework.
2. Dasha identifies activated planetary and house themes.
3. Transits provide timing and temporary influences.
4. Supporting aspects and planetary strength refine the interpretation.
5. Contradictory and protective influences balance the conclusion.

Never make a strong prediction based on a single planetary placement.

### 4. Supporting and contradicting indicators

For every important prediction, identify:

- What supports the interpretation.
- What weakens the interpretation.
- Which planetary factors provide protection or mitigation.
- Whether the evidence is strong, moderate, weak or insufficient.

Do not selectively present only challenging planetary influences.

### 5. Prediction structure

A. Overall prediction and headline.
B. Current Dasha influence.
C. Relevant natal planetary combinations.
D. Current transit interactions.
E. Domain-specific interpretation.
F. Favourable influences.
G. Challenging influences.
H. Expected timing and duration, where justified.
I. Practical guidance.
J. Limitations and confidence explanation.

### 6. Writing style

- Write like an experienced Vedic astrologer.
- Explain planetary combinations in natural language.
- Translate planetary symbolism into meaningful life implications.
- Avoid repetitive descriptions of planetary placements.
- Avoid generic statements applicable to every Gemini Ascendant.
- Avoid unnecessary technical terminology.
- Explain why a prediction is being made.

### 7. Confidence and probability

Do not manufacture numerical probabilities.

Use qualitative evidence strength unless an independently validated statistical model supports numerical confidence.

Astrological evidence strength must not be presented as medical or scientific probability.

### 8. Temporal intelligence

Distinguish:

- Daily: Moon and short-term transits.
- Weekly: Fast planetary movements and their interactions.
- Monthly: Broader transit patterns.
- Long-term: Natal chart and Dasha periods.

Do not assign arbitrary recovery periods or event dates.

### 9. Conversational memory

Use previously verified chart data and relevant user-reported context. Maintain a distinction between natal chart facts, calculated planetary transits, astrological interpretations, actual events reported by the user, and historical predictions.

Never retrospectively claim that an event was predicted.

### 10. Safety and honesty

For health consultations, astrology must never diagnose, exclude disease, predict laboratory values or replace medical care.

For all domains, explicitly acknowledge insufficient evidence rather than manufacturing a prediction.

### Final acceptance criterion

A good ChatPundit response must answer five questions:

1. What is the astrological indication?
2. Which planetary combinations support it?
3. What contradicts or mitigates it?
4. When is the indication relevant?
5. How confident can the interpretation reasonably be?

The output should feel like an intelligent personal consultation, not an automatically generated horoscope.

---

## How the standard maps onto the existing architecture

No new pipeline layers. Each role in the standard is an existing component:

| Role in the standard | Existing component | Status |
|---|---|---|
| Chart Intelligence | Symbolic pipeline + `ChartFacts` (signs, houses, lordships, dignity) | Degrees and aspects exist in the engine but are not passed to the Pundit |
| Dasha Intelligence | `src/lib/astrology/dasha.ts`, Pundit L2 | Pratyantar is computed but barely used |
| Transit Intelligence | `src/lib/astrology/transit.ts`, CIE transit evidence | Available |
| Domain Reasoner | DIE (`DIE_domainInterpreter.ts`) | Available |
| Evidence Evaluator | CIE (`CIE_investigationEngine.ts`): SUPPORTS / FRICTION / NOTE; health examines houses 1, 6, 8, 12 | Mitigating factors are not surfaced separately |
| Temporal Reasoner | L1 timeframe + L4 timeline | The health card's "Timeline: 5–7 days" is fixed, which §8 rules out |
| ChatPundit | L8 response planner + system prompt (`brain/index.ts`) | The Constitution says "not in the language of planets … unless asked"; overridden for health by this standard |

## Rubric v1.0

`scoreConsultation()` scores the **LLM narrative only**: no summary card, no server-written "astrological basis" paragraph. Those are templated and would pass the dasha and lordship checks on the model's behalf.

| Check | Criterion | Passes when |
|---|---|---|
| `structure` | Q1 indication | ≥ 4 paragraphs and ≥ 250 words |
| `dasha` | Q2 support | Names the active Mahadasha and Antardasha |
| `multi-factor` | Q2 support | Uses ≥ 3 of: Ascendant, 6th, 8th, 12th house/lord, Moon |
| `transit` | Q2 support | A sentence explains a transit by planet |
| `mitigation` | Q3 contradiction | A balancing or protective factor tied to a planet or house |
| `timing` | Q4 timing | No durations ("5–7 days", "within 2 weeks") unless tied to a dasha or transit |
| `confidence` | Q5 confidence | States qualitative evidence strength |
| `no-percent` | R1, §7 | No numeric probabilities |
| `medical-safety` | R2, §10 (health) | Says astrology does not replace medical care |
| `integrity` | R3 | Passes the chat route's integrity gate (lordships, placements, certainty) |

The checks are text heuristics. They show whether required reasoning is present and forbidden patterns are absent, not whether the astrology is wise. Read the answers alongside the score.

## Running the benchmark

```powershell
npx tsx --env-file=.env scripts/pundit-benchmark.ts <label>
# or: npm run benchmark:pundit -- <label>   (needs tsx on PATH)
```

It runs the real Pundit path (`assemblePunditBrain` → `generatePunditAnswer`, the same function the chat route uses) on every chart in `tests/gold-charts/health/`, asks "How's my health?" and "How's my health today?", and scores each narrative. The sky is fixed (`BENCHMARK_TRANSITS`) so runs are comparable.

Unlike `npm run validate`, it calls the AI provider: scores vary between runs and it costs API usage. Compare averages across runs, not single answers. It does not replace the gold suite; both must pass before a merge.

## Results

| Date | Label | Prompt state | Average | Notes |
|---|---|---|---|---|
| 2026-11-04 | baseline | Before Gold Standard changes (Gemini primary, length fixes, basis paragraph) | **43%** | All 6 answers fail `dasha`, `multi-factor`, `transit`, `confidence`, `medical-safety`; "today" answers also fail `structure` |

## Roadmap

1. **Done:** standard, rubric, benchmark, baseline.
2. **Health to standard:** A–J structure in the health prompt; pass CIE evidence through (6th, 8th, 12th lords, Moon, pratyantar, mitigating factors); summary card shows qualitative evidence strength and dasha/transit-based timing instead of "Likelihood" and "Timeline: 5–7 days"; medical-safety line.
3. **Validate:** benchmark, `npm run validate`, 20 real charts, review, merge.
4. Next domains, one at a time, each with its own factor set in the rubric.
