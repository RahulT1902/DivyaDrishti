import { getHouseLord, SIGN_RULERS, ZODIAC_SIGNS } from "../../core/astrology/lordshipEngine";
import { buildChartFacts, validateInterpretationFacts } from "../../core/astrology/chartFacts";
import { assemblePunditBrain } from "../../consultation/brain";
import { AstrologyContextBuilder } from "../../core/context-builder/astroContextBuilder";
import type { ChartSuite, Sign, PlanetName } from "../../core/types";
import type { ChartData } from "../../consultation/brain/DIE_domainInterpreter";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  } else {
    console.log(`  ✓ [PASS] ${message}`);
  }
}

// ── Expected Parashari Lordship Matrix (12 Ascendants × 12 Houses) ───────────
const PARASHARI_MATRIX: Record<number, Record<number, PlanetName>> = {
  // 1: Aries
  1: { 1:"Mars", 2:"Venus", 3:"Mercury", 4:"Moon", 5:"Sun", 6:"Mercury", 7:"Venus", 8:"Mars", 9:"Jupiter", 10:"Saturn", 11:"Saturn", 12:"Jupiter" },
  // 2: Taurus
  2: { 1:"Venus", 2:"Mercury", 3:"Moon", 4:"Sun", 5:"Mercury", 6:"Venus", 7:"Mars", 8:"Jupiter", 9:"Saturn", 10:"Saturn", 11:"Jupiter", 12:"Mars" },
  // 3: Gemini
  3: { 1:"Mercury", 2:"Moon", 3:"Sun", 4:"Mercury", 5:"Venus", 6:"Mars", 7:"Jupiter", 8:"Saturn", 9:"Saturn", 10:"Jupiter", 11:"Mars", 12:"Venus" },
  // 4: Cancer
  4: { 1:"Moon", 2:"Sun", 3:"Mercury", 4:"Venus", 5:"Mars", 6:"Jupiter", 7:"Saturn", 8:"Saturn", 9:"Jupiter", 10:"Mars", 11:"Venus", 12:"Mercury" },
  // 5: Leo
  5: { 1:"Sun", 2:"Mercury", 3:"Venus", 4:"Mars", 5:"Jupiter", 6:"Saturn", 7:"Saturn", 8:"Jupiter", 9:"Mars", 10:"Venus", 11:"Mercury", 12:"Moon" },
  // 6: Virgo
  6: { 1:"Mercury", 2:"Venus", 3:"Mars", 4:"Jupiter", 5:"Saturn", 6:"Saturn", 7:"Jupiter", 8:"Mars", 9:"Venus", 10:"Mercury", 11:"Moon", 12:"Sun" },
  // 7: Libra
  7: { 1:"Venus", 2:"Mars", 3:"Jupiter", 4:"Saturn", 5:"Saturn", 6:"Jupiter", 7:"Mars", 8:"Venus", 9:"Mercury", 10:"Moon", 11:"Sun", 12:"Mercury" },
  // 8: Scorpio
  8: { 1:"Mars", 2:"Jupiter", 3:"Saturn", 4:"Saturn", 5:"Jupiter", 6:"Mars", 7:"Venus", 8:"Mercury", 9:"Moon", 10:"Sun", 11:"Mercury", 12:"Venus" },
  // 9: Sagittarius
  9: { 1:"Jupiter", 2:"Saturn", 3:"Saturn", 4:"Jupiter", 5:"Mars", 6:"Venus", 7:"Mercury", 8:"Moon", 9:"Sun", 10:"Mercury", 11:"Venus", 12:"Mars" },
  // 10: Capricorn
  10: { 1:"Saturn", 2:"Saturn", 3:"Jupiter", 4:"Mars", 5:"Venus", 6:"Mercury", 7:"Moon", 8:"Sun", 9:"Mercury", 10:"Venus", 11:"Mars", 12:"Jupiter" },
  // 11: Aquarius
  11: { 1:"Saturn", 2:"Jupiter", 3:"Mars", 4:"Venus", 5:"Mercury", 6:"Moon", 7:"Sun", 8:"Mercury", 9:"Venus", 10:"Mars", 11:"Jupiter", 12:"Saturn" },
  // 12: Pisces
  12: { 1:"Jupiter", 2:"Mars", 3:"Venus", 4:"Mercury", 5:"Moon", 6:"Sun", 7:"Mercury", 8:"Venus", 9:"Mars", 10:"Jupiter", 11:"Saturn", 12:"Saturn" },
};

function createMockChartSuite(ascendantSign: Sign): ChartSuite {
  const SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  return {
    D1: {
      chartType: "D1",
      ascendant: { sign: ascendantSign, signName: SIGN_NAMES[ascendantSign - 1], degreeInSign: 15 },
      planets: [
        { planet: "Jupiter", sign: 4, signName: "Cancer", house: 2, degreeInSign: 10, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Venus", sign: 6, signName: "Virgo", house: 4, degreeInSign: 12, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Saturn", sign: 12, signName: "Pisces", house: 10, degreeInSign: 5, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Mars", sign: 7, signName: "Libra", house: 5, degreeInSign: 8, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Mercury", sign: 5, signName: "Leo", house: 3, degreeInSign: 20, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Sun", sign: 5, signName: "Leo", house: 3, degreeInSign: 18, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Moon", sign: 9, signName: "Sagittarius", house: 7, degreeInSign: 22, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Rahu", sign: 11, signName: "Aquarius", house: 9, degreeInSign: 14, isRetrograde: false, isCombust: false, isVargottama: false },
        { planet: "Ketu", sign: 5, signName: "Leo", house: 3, degreeInSign: 14, isRetrograde: false, isCombust: false, isVargottama: false },
      ],
      houses: Array.from({ length: 12 }, (_, i) => {
        const h = i + 1;
        const s = ((((ascendantSign - 1 + i) % 12) + 12) % 12 + 1) as Sign;
        return {
          number: h,
          sign: s,
          signName: SIGN_NAMES[s - 1],
          lord: SIGN_RULERS[s],
          planets: [],
        };
      }),
      lords: Array.from({ length: 12 }, (_, i) => {
        const h = i + 1;
        const s = ((((ascendantSign - 1 + i) % 12) + 12) % 12 + 1) as Sign;
        return {
          house: h,
          lord: SIGN_RULERS[s],
          lordPlacedInHouse: h,
          lordPlacedInSign: s,
          isInOwnHouse: true,
          isExalted: false,
          isDebilitated: false,
        };
      }),
      aspects: [],
      conjunctions: [],
      yogas: [],
      strengths: [],
      metadata: { varga: 1, purpose: "Overall Life", accuracyWeight: 1.0, source: "Computed" },
    },
    D9: {
      chartType: "D9",
      ascendant: { sign: ascendantSign, signName: SIGN_NAMES[ascendantSign - 1], degreeInSign: 15 },
      planets: [], houses: [], lords: [], aspects: [], conjunctions: [], yogas: [], strengths: [],
      metadata: { varga: 9, purpose: "Marriage & Destiny", accuracyWeight: 0.95, source: "Computed" },
    },
    D10: {
      chartType: "D10",
      ascendant: { sign: ascendantSign, signName: SIGN_NAMES[ascendantSign - 1], degreeInSign: 15 },
      planets: [], houses: [], lords: [], aspects: [], conjunctions: [], yogas: [], strengths: [],
      metadata: { varga: 10, purpose: "Career & Fame", accuracyWeight: 0.95, source: "Computed" },
    },
  } as unknown as ChartSuite;
}

export async function runLordshipIntegrityTests() {
  console.log("===============================================================================");
  console.log("  RUNNING COMPREHENSIVE LORDSHIP INTEGRITY REGRESSION SUITE");
  console.log("===============================================================================\n");

  // 1. Matrix Test: 12 Ascendants × 12 Houses
  console.log("── 1. Testing Parashari Lordship Matrix (144 Combinations) ──");
  let passedCount = 0;
  for (let asc = 1; asc <= 12; asc++) {
    for (let house = 1; house <= 12; house++) {
      const expectedLord = PARASHARI_MATRIX[asc][house];
      const actualLord = getHouseLord(asc as Sign, house);
      assert(
        actualLord === expectedLord,
        `Ascendant ${ZODIAC_SIGNS[asc - 1]} House ${house}: expected ${expectedLord}, got ${actualLord}`
      );
      passedCount++;
    }
  }
  console.log(`  ✓ Successfully verified ${passedCount}/144 lordship matrix entries.\n`);

  // 2. Gemini Ascendant Specific Assertions
  console.log("── 2. Gemini Ascendant Lordship Assertions ──");
  assert(getHouseLord(3, 1) === "Mercury", "Gemini 1st Lord is Mercury");
  assert(getHouseLord(3, 2) === "Moon",    "Gemini 2nd Lord is Moon");
  assert(getHouseLord(3, 3) === "Sun",     "Gemini 3rd Lord is Sun");
  assert(getHouseLord(3, 4) === "Mercury", "Gemini 4th Lord is Mercury");
  assert(getHouseLord(3, 5) === "Venus",   "Gemini 5th Lord is Venus");
  assert(getHouseLord(3, 6) === "Mars",    "Gemini 6th Lord is Mars");
  assert(getHouseLord(3, 7) === "Jupiter", "Gemini 7th Lord is Jupiter");
  assert(getHouseLord(3, 8) === "Saturn",  "Gemini 8th Lord is Saturn");
  assert(getHouseLord(3, 9) === "Saturn",  "Gemini 9th Lord is Saturn");
  assert(getHouseLord(3, 10) === "Jupiter", "Gemini 10th Lord is JUPITER (Not Venus)");
  assert(getHouseLord(3, 11) === "Mars",   "Gemini 11th Lord is Mars");
  assert(getHouseLord(3, 12) === "Venus",  "Gemini 12th Lord is Venus");

  // 3. Validation Gate Integrity Tests
  console.log("\n── 3. Calculation Integrity Validation Gate Tests ──");
  const geminiFacts = buildChartFacts(3, [
    { planet: "Jupiter", sign: 4, house: 2 },
    { planet: "Venus", sign: 6, house: 4 },
  ]);

  assert(geminiFacts.houseLords[10] === "Jupiter", "ChartFacts houseLords[10] is Jupiter for Gemini");
  assert(geminiFacts.houseLords[5] === "Venus", "ChartFacts houseLords[5] is Venus for Gemini");
  assert(geminiFacts.houseLords[12] === "Venus", "ChartFacts houseLords[12] is Venus for Gemini");

  const badText = "The placement of your 10th-house lord Venus in a debilitated position adds friction.";
  const badValidation = validateInterpretationFacts(geminiFacts, badText);
  assert(!badValidation.valid, "validateInterpretationFacts rejects '10th-house lord Venus' for Gemini");
  assert(
    badValidation.errors.length > 0 && badValidation.errors[0].includes("Calculation Integrity Failure"),
    "Validation error correctly formats Calculation Integrity Failure message"
  );

  const goodText = "Jupiter's sub-period favors career growth as your 10th-house lord Jupiter is well placed.";
  const goodValidation = validateInterpretationFacts(geminiFacts, goodText);
  assert(goodValidation.valid, "validateInterpretationFacts accepts '10th-house lord Jupiter' for Gemini");

  // 4. Production Brain E2E Integration Test for Gemini Career Question
  console.log("\n── 4. Production Brain Pipeline E2E Gemini Test ──");
  const mockSuite = createMockChartSuite(3);
  const symbolicCtx = new AstrologyContextBuilder().build(mockSuite, {
    dasha: { mahadasha: "Rahu", antardasha: "Jupiter", periodStart: "2025-01-01", periodEnd: "2027-01-01" },
  });

  const chartData: ChartData = {};
  const brainResult = await assemblePunditBrain(
    "How's my career this week?",
    [],
    "test-user-123",
    [],
    symbolicCtx,
    { mahadasha: "Rahu", antardasha: "Jupiter", periodStart: "2025-01-01", periodEnd: "2027-01-01" },
    "career",
    chartData
  );

  assert(brainResult.systemPrompt.includes("10TH HOUSE LORD: Jupiter"), "System prompt includes authoritative 10TH HOUSE LORD: Jupiter");
  assert(!brainResult.systemPrompt.includes("10th-house lord Venus"), "System prompt NEVER refers to Venus as 10th lord");

  const promptCheck = validateInterpretationFacts(geminiFacts, brainResult.systemPrompt);
  if (!promptCheck.valid) {
    console.log("Validation Errors in System Prompt:", promptCheck.errors);
    const matchingLines = brainResult.systemPrompt.split("\n").filter(l => l.toLowerCase().includes("10") && l.toLowerCase().includes("venus"));
    console.log("Matching lines in systemPrompt:", matchingLines);
  }
  assert(promptCheck.valid, "Generated system prompt passes validateInterpretationFacts with zero errors");

  // 5. Cross-Varga D1 vs D10 Lordship Matrix & Generic 6th Lord Tests
  console.log("\n── 5. Cross-Varga D1 vs D10 Matrix & Generic 6th Lord Tests ──");
  for (let d1Asc = 1; d1Asc <= 12; d1Asc++) {
    for (let d10Asc = 1; d10Asc <= 12; d10Asc++) {
      const d1_10thLord = getHouseLord(d1Asc as Sign, 10);
      const d10_10thLord = getHouseLord(d10Asc as Sign, 10);
      
      // Assert independence: D1 10th lord relies only on d1Asc, D10 10th lord relies only on d10Asc
      assert(
        d1_10thLord === PARASHARI_MATRIX[d1Asc][10],
        `D1 Asc ${ZODIAC_SIGNS[d1Asc - 1]} 10th Lord is ${d1_10thLord}`
      );
      assert(
        d10_10thLord === PARASHARI_MATRIX[d10Asc][10],
        `D10 Asc ${ZODIAC_SIGNS[d10Asc - 1]} 10th Lord is ${d10_10thLord}`
      );
    }
  }

  // Generic 6th Lord Resolution across multiple ascendants
  const sixthLords = [
    { asc: 3, lord: "Mars" },    // Gemini -> Scorpio -> Mars
    { asc: 2, lord: "Venus" },   // Taurus -> Libra -> Venus
    { asc: 4, lord: "Jupiter" }, // Cancer -> Sagittarius -> Jupiter
    { asc: 5, lord: "Saturn" },  // Leo -> Capricorn -> Saturn
  ];
  for (const item of sixthLords) {
    const calculated6thLord = getHouseLord(item.asc as Sign, 6);
    assert(
      calculated6thLord === item.lord,
      `Ascendant ${ZODIAC_SIGNS[item.asc - 1]} 6th Lord is ${item.lord} (Calculated deterministically)`
    );
  }

  console.log("\n===============================================================================");
  console.log("  ALL LORDSHIP INTEGRITY TESTS PASSED SUCCESSFULLY");
  console.log("===============================================================================");
}

// Execute if run via CLI
if (require.main === module) {
  runLordshipIntegrityTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
