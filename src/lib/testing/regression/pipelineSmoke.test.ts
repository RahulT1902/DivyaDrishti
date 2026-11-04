import { assemblePunditBrain } from "../../consultation/brain";
import { AstrologyContextBuilder } from "../../core/context-builder/astroContextBuilder";
import { buildChartFacts, validateInterpretationFacts } from "../../core/astrology/chartFacts";
import type { ChartSuite, Sign } from "../../core/types";
import type { ChartData } from "../../consultation/brain/DIE_domainInterpreter";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  } else {
    console.log(`  ✓ [PASS] ${message}`);
  }
}

const geminiSuite: any = {
  D1: {
    chartType: "D1", metadata: { varga: 1, purpose: "Overall life", accuracyWeight: 1, source: "Computed" },
    ascendant: { sign: 3, signName: "Gemini", degreeInSign: 15, nakshatra: "Ardra", lord: "Mercury" },
    houses: [
      { number: 1, sign: 3, signName: "Gemini", lord: "Mercury", planets: [] },
      { number: 2, sign: 4, signName: "Cancer", lord: "Moon", planets: [] },
      { number: 3, sign: 5, signName: "Leo", lord: "Sun", planets: [] },
      { number: 4, sign: 6, signName: "Virgo", lord: "Mercury", planets: ["Mars", "Saturn"] },
      { number: 5, sign: 7, signName: "Libra", lord: "Venus", planets: ["Jupiter"] },
      { number: 6, sign: 8, signName: "Scorpio", lord: "Mars", planets: [] },
      { number: 7, sign: 9, signName: "Sagittarius", lord: "Jupiter", planets: [] },
      { number: 8, sign: 10, signName: "Capricorn", lord: "Saturn", planets: [] },
      { number: 9, sign: 11, signName: "Aquarius", lord: "Saturn", planets: [] },
      { number: 10, sign: 12, signName: "Pisces", lord: "Jupiter", planets: [] },
      { number: 11, sign: 1, signName: "Aries", lord: "Mars", planets: [] },
      { number: 12, sign: 2, signName: "Taurus", lord: "Venus", planets: [] },
    ],
    planets: [
      { planet: "Jupiter", sign: 7, signName: "Libra", house: 5, longitude: 195, latitude: 0, speed: 0.1, isRetrograde: false, isCombust: false, nakshatra: "Swati", lord: "Venus" },
      { planet: "Mars", sign: 6, signName: "Virgo", house: 4, longitude: 165, latitude: 0, speed: 0.5, isRetrograde: false, isCombust: false, nakshatra: "Hasta", lord: "Mercury" },
      { planet: "Saturn", sign: 6, signName: "Virgo", house: 4, longitude: 170, latitude: 0, speed: 0.05, isRetrograde: false, isCombust: false, nakshatra: "Hasta", lord: "Mercury" },
    ],
    lords: [
      { house: 1, lord: "Mercury", lordPlacedInHouse: 4, isInOwnHouse: false, isExalted: false, isDebilitated: false, lordPlacedInSign: 6 },
      { house: 5, lord: "Venus", lordPlacedInHouse: 4, isInOwnHouse: false, isExalted: false, isDebilitated: true, lordPlacedInSign: 6 },
      { house: 6, lord: "Mars", lordPlacedInHouse: 4, isInOwnHouse: false, isExalted: false, isDebilitated: false, lordPlacedInSign: 6 },
      { house: 10, lord: "Jupiter", lordPlacedInHouse: 5, isInOwnHouse: false, isExalted: false, isDebilitated: false, lordPlacedInSign: 7 },
    ],
    aspects: [],
    conjunctions: [],
    yogas: [],
    strengths: [],
  },
  D9: { chartType: "D9", metadata: { varga: 9, purpose: "Marriage and dharma", accuracyWeight: 0, source: "Placeholder" }, ascendant: { sign: 3, signName: "Gemini", degreeInSign: 15, nakshatra: "Ardra", lord: "Mercury" }, houses: [], planets: [], lords: [], aspects: [], conjunctions: [], yogas: [], strengths: [] },
  D10: {
    chartType: "D10", metadata: { varga: 10, purpose: "Career", accuracyWeight: 1, source: "Computed" },
    ascendant: { sign: 4, signName: "Cancer", degreeInSign: 15, nakshatra: "Pushya", lord: "Moon" },
    houses: [
      { number: 10, sign: 1, signName: "Aries", lord: "Mars", planets: ["Sun"] }
    ],
    planets: [],
    lords: [
      { house: 10, lord: "Mars", lordPlacedInHouse: 10, isInOwnHouse: true, isExalted: false, isDebilitated: false, lordPlacedInSign: 1 }
    ],
    aspects: [],
    conjunctions: [],
    yogas: [],
    strengths: [],
  },
  D2: { chartType: "D2", metadata: { varga: 2, purpose: "Wealth", accuracyWeight: 0, source: "Placeholder" }, ascendant: { sign: 3, signName: "Gemini", degreeInSign: 0, nakshatra: "", lord: "Mercury" }, houses: [], planets: [], lords: [], aspects: [], conjunctions: [], yogas: [], strengths: [] },
};

const geminiContext = new AstrologyContextBuilder().build(geminiSuite as ChartSuite, {});

const geminiChartFacts = buildChartFacts(
  3,
  [
    { planet: "Jupiter", sign: 7, house: 5 },
    { planet: "Mars", sign: 6, house: 4 },
    { planet: "Saturn", sign: 6, house: 4 },
  ],
  [
    { planet: "Jupiter", sign: 4, house: 2 },
    { planet: "Saturn", sign: 12, house: 10 },
  ]
);

export async function runPipelineSmokeTests() {
  console.log("===============================================================================");
  console.log("  RUNNING PIPELINE & SPECIFIC QUESTION SMOKE TESTS");
  console.log("===============================================================================\n");

  const questions = [
    "How's my career this week?",
    "Is Venus my 10th lord?",
    "What does my D10 say about my career?",
    "Does my 6th lord strengthen my career?"
  ];

  for (const q of questions) {
    console.log(`\n--- Question: "${q}" ---`);
    const brain = await assemblePunditBrain(
      q,
      [],
      "test-user-123",
      [],
      geminiContext,
      { mahadasha: "Rahu", antardasha: "Jupiter", periodStart: "2026-01-01", periodEnd: "2028-01-01" },
      "career",
      {} as ChartData
    );

    const prompt = brain.systemPrompt;
    assert(prompt.includes("10TH HOUSE LORD: Jupiter"), "Prompt correctly specifies Jupiter as 10th house lord");
    assert(prompt.includes("SIGNAL STRENGTH:"), "Prompt exposes SIGNAL STRENGTH explicitly");
    assert(prompt.includes("CALCULATION CONFIDENCE:"), "Prompt exposes CALCULATION CONFIDENCE explicitly");
    assert(!prompt.includes("PROBABILITY:"), "Prompt contains NO pseudo-probability percentage");

    const val = validateInterpretationFacts(geminiChartFacts, prompt);
    if (!val.valid) console.log("Validation Errors:", val.errors);
    assert(val.valid, "System prompt facts pass validateInterpretationFacts calculation integrity check");
  }

  console.log("\n===============================================================================");
  console.log("  ALL PIPELINE SMOKE TESTS PASSED SUCCESSFULLY");
  console.log("===============================================================================");
}

if (require.main === module) {
  runPipelineSmokeTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
