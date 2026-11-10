# Shared timing engine (Multi-Domain spec, Phase A)

`src/lib/consultation/timing/` gives every domain the same dated astrology:
the full dasha with dates, dasha changes, dated transit events and dated
windows for the period a question asks about. A domain contributes only the
houses it cares about (`DOMAIN_HOUSES`); its interpretation rules are Phase B.

Principle: **calculate → establish evidence → interpret → predict.** The LLM
narrates the rendered block. It never computes a date, and the integrity gate
rejects any date or dated event that is not in the evidence.

## Files

| File | Role |
|---|---|
| `timingEngine.ts` | Window resolution, dasha periods and changes, transit events, factors, windows, Pratyantar link, compact rendering |
| `relations.ts` | Shared classical tables: graha drishti, natural friendship, sign lords, house-to-house relationship |
| `timingValidator.ts` | Integrity-gate check for dates and dated event claims (each verb tied to its own planet, so multi-planet sentences are checked too) |
| `claimValidator.ts` | Integrity-gate check for dignity, house placement, ingress targets, "Nth from" relations, natural friendship and dasha lordship |

## Where the dates come from

| Evidence | Source |
|---|---|
| Mahadasha / Antardasha / Pratyantar start and end | `buildMahadashaTimeline`, `buildAntardasha`, `buildPratyantardasha` (`src/lib/astrology/dasha.ts`). The timeline starts at the birth moment in UT (`chart.birthUtc`). |
| Dasha changes in the period | Every Pratyantar start inside the window, labelled Mahadasha/Antardasha/Pratyantar by which level changes |
| Sign changes and stations | Swiss Ephemeris positions (`calculateCurrentTransits`), stepped daily (6-hourly when the Moon is tracked), each change refined to about 15 minutes |

Dasha dates are shown with `~`. Different programs use slightly different
Lahiri ayanamsha values, and a few arc-seconds of Moon longitude move a
Pratyantar boundary by a day or two (e.g. 19 vs 21 Dec 2026 for the same chart).

## Windows

The period is split at every sign change, station and dasha change, so
"before 16 Nov" and "after 16 Nov" stay distinct. Each window gets:

- **Factors:** for each moving planet (and any slow planet that changes sign or
  stations in the period), its house from the Ascendant and from the Moon.
  - **+ / −** marks whether the transit is favourable by classical gochara from
    the Moon (Phaladeepika ch. 26; vedha not applied).
  - **\*** marks an active dasha lord.
  - **@** lists the domain houses the planet touches by placement, aspect or lordship.
- **Direction:** favourable, caution or mixed, from the weighted sum of all
  factors. Slow planets weigh more; dasha lords and domain-relevant planets
  count ×1.5.
- **Confidence:** firm, moderate or tentative, from how strongly the factors
  agree. It is not a probability.

Windows shorter than a minimum length (3 h day / 12 h week / 2 days month /
7 days year), or beyond the per-horizon cap, are folded into a neighbour. The
folded event keeps its date ("then 2 Dec Mercury enters Scorpio") and the
positions it changes are listed inline, so nothing is hidden.

## Pratyantar link

For the running Pratyantar lord, the engine states:
- its natal house, dignity and lordships;
- its relationship to the Mahadasha and Antardasha lords: house distance (6/8,
  2/12, kendra, trine, 3/11), mutual aspects, and natural friendship (a node
  acts through its sign lord);
- which of the question's domain houses it rules or occupies.

## Integration

- **Health (Phase A):** wired into the Gold Standard health prompt
  (`brain/index.ts`), and only when the caller passes `chartData.timing` (the
  chat route and `scripts/pundit-review.ts` do). The block replaces the
  single-day transit snapshot in HEALTH CHART EVIDENCE.
- **Career (Phase B):** gets the same timing plus its own evidence block,
  CAREER CHART EVIDENCE (`goldStandard/domainEvidence.ts`):
  - the 10th, 6th, 2nd, 11th, 7th and 9th houses with lords, occupants and aspects;
  - the karakas Sun, Saturn, Mercury and Jupiter;
  - what the dasha lords rule or occupy;
  - Dashamsha (D10) corroboration of the 10th lord, the karakas and the dasha lords.
  - A question about the job itself ("switch", "employer", "interview"…)
    times against the job houses (2, 6, 8, 10, 11, 12) instead.
  - Its prompt wording lives in `goldStandard/domainPrompts.ts`.
- **Finance (Phase B):** FINANCE CHART EVIDENCE.
  - Houses: 2nd (savings), 11th (income), 5th (investments), 9th (fortune),
    10th (earnings) and 12th (expenses).
  - Karakas: Jupiter, Venus, Mercury and Moon.
  - Hora (D2) corroboration: every planet sits in the Sun's hora (Leo) or the
    Moon's hora (Cancer), so the block says which hora the key planets fall in.
    It shows how wealth tends to come, not how much. CIE findings that read
    the Hora by houses are left out.
  - Answers never name a stock, fund, amount or return, and always say they
    are not financial advice; the server adds that line if missing.
- **Property (Phase B):** its own chat domain. Questions about a house, flat,
  plot, land, home loan, construction or vastu are routed there; astrology
  phrases like "my 7th house" are not.
  - PROPERTY CHART EVIDENCE: the 4th house (home, land, vehicles) plus the
    2nd, 11th, 8th, 12th and 10th.
  - Karakas: Mars, Venus, Moon and Saturn.
  - Chaturthamsha (D4) corroboration; the CIE now reads D4 too.
  - Answers never name a price, amount, location or market move, and always
    say they are not financial or legal advice and to check documents.
- **Marriage (Phase B):** the `relationship` chat domain (clients' variants
  such as "relationships" or "marriage" are mapped to it by `canonicalDomain`).
  - RELATIONSHIP CHART EVIDENCE: the 7th house plus the 2nd, 5th, 8th, 11th and 12th.
  - Karakas: Venus, Jupiter, Moon and Mars.
  - Navamsa (D9) corroboration.
  - Answers never predict divorce, separation, infidelity or a partner's
    illness or death; no fear-based dosha talk; no verdicts to stay or leave.
- **Family (Phase B):** a FamilyBrief of its own (focus: parents, mother,
  father, siblings, children or harmony at home).
  - FAMILY CHART EVIDENCE: the 4th (mother, home), 9th (father), 3rd
    (siblings), 2nd (family unit), 5th (children) and 12th.
  - Karakas: Moon, Sun, Mars and Jupiter.
  - Dwadashamsha (D12) corroboration; the CIE now reads D12 too.
  - Answers never predict a family member's illness, accident or death and
    never blame or take sides.
- **Education (Phase B):** an EducationBrief of its own (focus: exams,
  admission, higher studies, study abroad, competitive exams, focus).
  - EDUCATION CHART EVIDENCE: the 4th, 5th, 9th, 2nd, 11th and 6th houses.
  - Karakas: Mercury, Jupiter, Moon and Saturn.
  - Siddhamsha (D24) corroboration. D24 is now part of the chart suite, and
    the CIE reads it.
  - Answers never promise a rank, score, admission or result.
  - In D24 the nodes always share a sign (180° × 24 is a whole number of
    circles), so Rahu and Ketu together there is correct, not a bug.
- **Gold charts unchanged:** they have no birth date, so their health and
  marriage prompts are byte-identical to before. Their career prompts now use
  the career Gold Standard; the gold test charts have no Dashamsha, so that
  section reads "not available" there.

## Answer gate

`punditAnswer.ts` runs both validators on the draft. Errors go back to the
model for one rewrite; sentences that still fail are dropped.

- **Natal or transit:** a claim passes if it matches the natal chart or any
  position in the period asked. Today's position counts only when there is no
  dated evidence. A sentence that says "transit" must match a transit position.
- **Divisional charts:** a sentence naming the divisional chart (or its
  Ascendant, e.g. "With Leo rising…") is checked against that chart too. Such
  sentences often mix both charts, so a claim fails only if it is false in both.
- **Aspects and pairs:** claimed aspects must follow from the planet's positions
  (graha drishti); "Rahu and Ketu in the 8th and 2nd" is read in order.
- **Windows:** a range called favourable or "best" must not span a firm
  caution window. A year answer must cover Mahadasha and Antardasha changes,
  not every Pratyantar change.
- **Unattributable claims are skipped:** a false alarm would drop a correct
  sentence.
- **Dropped sentences are recorded:** they come back in
  `droppedSentences` with their reasons and are logged as `[Gate] Dropped sentences`.
- **Key-dates fallback:** if a dropped sentence carried a date, or the answer
  still skips a dasha change, a plain-language "Key dates" paragraph built from
  the computed windows (`renderKeyDates`) is appended. The reading never
  silently loses its timing.

## Token budget

The block is 380–600 tokens depending on the period, and the health system
prompt grows from ~6,550 to ~7,400 tokens.

On the Groq free tier (8,000 tokens/minute), gpt-oss-20b at its default
reasoning effort returned empty answers even before this change. It now runs
at `reasoningEffort: "low"` (`src/lib/ai/provider.ts`). Each call logs its
input and output tokens.

## Tests

- `npx tsx --env-file=.env scripts/timing-acceptance.ts --user <id prefix>`
  (or `--chart <review chart id>`): deterministic acceptance tests. Every
  emitted date is re-checked against an independent computation.
- `npx tsx --env-file=.env scripts/claim-validator-test.ts --user <id prefix>`:
  deterministic gate tests: misdated and merged events, dignity, houses,
  relations, friendship, dasha lords, the key-dates fallback, and "April 2028".
- `GEMINI_API_KEY= npx tsx --env-file=.env scripts/timing-compare.ts --user <id prefix> --out <file>`:
  before/after answers on Groq, scored on the Step A conditions and the rubric.
- `npx tsx --env-file=.env scripts/timing-compare.ts --gemini --user <id prefix> --out <file>`:
  the four Step A benchmark questions on Gemini, using `BENCHMARK_GEMINI_API_KEY`
  (refuses to run without it). Each answer records which model wrote it.
- Write compare output outside the repo; it is a personal reading.
