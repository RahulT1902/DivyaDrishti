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
  1: { 1:"Mars", 2:"Venus", 3:"Mercury", 4:"Moon", 5:"Sun", 6:"Mercury", 7:"Venus", 8:"Mars", 9:"Jupiter", 10:"Saturn", 11:"Saturn", 12:"Jupiter" },
  2: { 1:"Venus", 2:"Mercury", 3:"Moon", 4:"Sun", 5:"Mercury", 6:"Venus", 7:"Mars", 8:"Jupiter", 9:"Saturn", 10:"Saturn", 11:"Jupiter", 12:"Mars" },
  3: { 1:"Mercury", 2:"Moon", 3:"Sun", 4:"Mercury", 5:"Venus", 6:"Mars", 7:"Jupiter", 8:"Saturn", 9:"Saturn", 10:"Jupiter", 11:"Mars", 12:"Venus" },
  4: { 1:"Moon", 2:"Sun", 3:"Mercury", 4:"Venus", 5:"Mars", 6:"Jupiter", 7:"Saturn", 8:"Saturn", 9:"Jupiter", 10:"Mars", 11:"Venus", 12:"Mercury" },
  5: { 1:"Sun", 2:"Mercury", 3:"Venus", 4:"Mars", 5:"Jupiter", 6:"Saturn", 7:"Saturn", 8:"Jupiter", 9:"Mars", 10:"Venus", 11:"Mercury", 12:"Moon" },
  6: { 1:"Mercury", 2:"Venus", 3:"Mars", 4:"Jupiter", 5:"Saturn", 6:"Saturn", 7:"Jupiter", 8:"Mars", 9:"Venus", 10:"Mercury", 11:"Moon", 12:"Sun" },
  7: { 1:"Venus", 2:"Mars", 3:"Jupiter", 4:"Saturn", 5:"Saturn", 6:"Jupiter", 7:"Mars", 8:"Venus", 9:"Mercury", 10:"Moon", 11:"Sun", 12:"Mercury" },
  8: { 1:"Mars", 2:"Jupiter", 3:"Saturn", 4:"Saturn", 5:"Jupiter", 6:"Mars", 7:"Venus", 8:"Mercury", 9:"Moon", 10:"Sun", 11:"Mercury", 12:"Venus" },
  9: { 1:"Jupiter", 2:"Saturn", 3:"Saturn", 4:"Jupiter", 5:"Mars", 6:"Venus", 7:"Mercury", 8:"Moon", 9:"Sun", 10:"Mercury", 11:"Venus", 12:"Mars" },
  10: { 1:"Saturn", 2:"Saturn", 3:"Jupiter", 4:"Mars", 5:"Venus", 6:"Mercury", 7:"Moon", 8:"Sun", 9:"Mercury", 10:"Venus", 11:"Mars", 12:"Jupiter" },
  11: { 1:"Saturn", 2:"Jupiter", 3:"Mars", 4:"Venus", 5:"Mercury", 6:"Moon", 7:"Sun", 8:"Mercury", 9:"Venus", 10:"Mars", 11:"Jupiter", 12:"Saturn" },
  12: { 1:"Jupiter", 2:"Mars", 3:"Venus", 4:"Mercury", 5:"Moon", 6:"Sun", 7:"Mercury", 8:"Venus", 9:"Mars", 10:"Jupiter", 11:"Saturn", 12:"Saturn" },
};

export async function runLordshipIntegrityTests() {
  console.log("===============================================================================");
  console.log("  RUNNING COMPREHENSIVE LORDSHIP INTEGRITY REGRESSION SUITE (MOBILE)");
  console.log("===============================================================================\n");

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

  assert(getHouseLord(3, 5) === "Venus",   "Gemini 5th Lord is Venus");
  assert(getHouseLord(3, 10) === "Jupiter", "Gemini 10th Lord is JUPITER");
  assert(getHouseLord(3, 12) === "Venus",  "Gemini 12th Lord is Venus");

  const sixthLords = [
    { asc: 3, lord: "Mars" },
    { asc: 2, lord: "Venus" },
    { asc: 4, lord: "Jupiter" },
    { asc: 5, lord: "Saturn" },
  ];
  for (const item of sixthLords) {
    const calculated6thLord = getHouseLord(item.asc as Sign, 6);
    assert(
      calculated6thLord === item.lord,
      `Ascendant ${ZODIAC_SIGNS[item.asc - 1]} 6th Lord is ${item.lord} (Calculated deterministically)`
    );
  }

  console.log("\n===============================================================================");
  console.log("  ALL LORDSHIP INTEGRITY TESTS PASSED SUCCESSFULLY (MOBILE)");
  console.log("===============================================================================");
}

if (require.main === module) {
  runLordshipIntegrityTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
