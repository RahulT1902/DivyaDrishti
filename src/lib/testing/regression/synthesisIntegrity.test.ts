import { assemblePunditBrain } from "../../consultation/brain";
import { AstrologyContextBuilder } from "../../core/context-builder/astroContextBuilder";
import { buildChartFacts, validateInterpretationSynthesis } from "../../core/astrology/chartFacts";
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
    metadata: { name: "Rasi Chart", source: "Computed" },
    chartType: "D1",
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
  D9: { metadata: { name: "Navamsa", source: "Computed" }, chartType: "D9", ascendant: { sign: 3, signName: "Gemini", degreeInSign: 15, nakshatra: "Ardra", lord: "Mercury" }, houses: [], planets: [], lords: [], aspects: [], conjunctions: [], yogas: [], strengths: [] },
  D10: {
    metadata: { name: "Dasamsa", source: "Computed" },
    chartType: "D10",
    ascendant: { sign: 4, signName: "Cancer", degreeInSign: 15, nakshatra: "Pushya", lord: "Moon" },
    houses: [
      { number: 10, sign: 1, signName: "Aries", lord: "Mars", planets: ["Sun", "Jupiter", "Venus", "Mercury"] }
    ],
    planets: [],
    lords: [
      { house: 10, lord: "Mars", lordPlacedInHouse: 10, isInOwnHouse: true, isExalted: true, isDebilitated: false, lordPlacedInSign: 1 }
    ],
    aspects: [],
    conjunctions: [],
    yogas: [],
    strengths: [],
  },
  D2: { metadata: { name: "Hora", source: "Placeholder" }, chartType: "D2", ascendant: { sign: 3, signName: "Gemini", degreeInSign: 0, nakshatra: "", lord: "Mercury" }, houses: [], planets: [], lords: [], aspects: [], conjunctions: [], yogas: [], strengths: [] },
};

const geminiContext = new AstrologyContextBuilder().build(geminiSuite as ChartSuite, {});

export async function runSynthesisIntegrityTests() {
  console.log("===============================================================================");
  console.log("  RUNNING COMPREHENSIVE RV2 SYNTHESIS INTEGRITY REGRESSION SUITE");
  console.log("===============================================================================\n");

  const brain = await assemblePunditBrain(
    "How's my career this week?",
    [],
    "test-user-rv2",
    [],
    geminiContext,
    { mahadasha: "Rahu", antardasha: "Jupiter", periodStart: "2026-01-01", periodEnd: "2028-01-01" },
    "career",
    {} as ChartData
  );

  const report = brain.investigationReport;
  assert(report !== undefined, "CIE Investigation report exists");
  const exp = report?.scoreExplanation;
  assert(exp !== undefined, "Auditable ScoreExplanation is present in InvestigationReport");

  if (exp) {
    assert(exp.baseline === 50, "ScoreExplanation baseline is exactly 50 (neutral midpoint)");
    assert(exp.rawSignalScore === exp.baseline + exp.netEvidenceDelta, "Math invariant: rawSignalScore = baseline + netEvidenceDelta");
    assert(exp.signalStrength >= 0 && exp.signalStrength <= 100, "Math invariant: 0 <= signalStrength <= 100");

    assert(Math.abs(exp.boundedD10Delta) <= 15, `D10 net aggregate contribution bounded to <= 15 (got ${exp.boundedD10Delta}, raw was ${exp.rawD10Delta})`);

    for (const item of exp.breakdown) {
      assert(item.provenance.factIds.length > 0, `Breakdown item '${item.factor}' has non-empty factIds provenance (${item.provenance.factIds.join(", ")})`);
      assert(item.evidenceIds.length > 0, `Breakdown item '${item.factor}' has non-empty evidenceIds traceability (${item.evidenceIds.join(", ")})`);
    }
  }

  console.log("\n── 4. Semantic Claim-Strength Validation Gate Tests ──");
  
  const certaintyText = "Your career growth is guaranteed and certain this month.";
  const certVal = validateInterpretationSynthesis({ conclusion: { overallScore: 75 } }, certaintyText);
  assert(!certVal.valid, "validateInterpretationSynthesis rejects CERTAINTY class text ('guaranteed', 'certain')");
  assert(certVal.errors.some(e => e.includes("prohibited CERTAINTY phrasing")), "Correctly flags prohibited CERTAINTY error");

  const veryStrongText = "You are set for a massive breakthrough and explosive growth in career.";
  const vsValLow = validateInterpretationSynthesis({ conclusion: { overallScore: 50 } }, veryStrongText);
  assert(!vsValLow.valid, "validateInterpretationSynthesis rejects VERY_STRONG class text when score is 50 (< 72)");

  const vsValHigh = validateInterpretationSynthesis({ conclusion: { overallScore: 80 } }, veryStrongText);
  assert(vsValHigh.valid, "validateInterpretationSynthesis permits VERY_STRONG class text when score is 80 (>= 72)");

  console.log("\n===============================================================================");
  console.log("  ALL RV2 SYNTHESIS INTEGRITY TESTS PASSED SUCCESSFULLY");
  console.log("===============================================================================");
}

if (require.main === module) {
  runSynthesisIntegrityTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
