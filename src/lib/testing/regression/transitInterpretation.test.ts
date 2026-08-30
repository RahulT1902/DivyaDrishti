import { interpretChartTransit } from "../../core/transit-engine/chartTransitInterpreter";

export function runTransitRegressionTests() {
  console.log("===============================================================================");
  console.log("  RUNNING COMPREHENSIVE TRANSIT INTERPRETATION REGRESSION SUITE");
  console.log("===============================================================================\n");

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Test A: Sagittarius Ascendant + Venus in Libra
  // Expected: 11th house gains/network/income primary; NOT "long-term foundation"
  // ---------------------------------------------------------------------------
  const testA = interpretChartTransit(9, "Venus", 7, {
    dashaInfo: { mahadasha: "Rahu", antardasha: "Jupiter" },
  });

  assert(testA.transit.house === 11, "Test A: House calculation", `Expected 11, got ${testA.transit.house}`);
  assert(testA.planetRole.signDignity === "own", "Test A: Sign dignity calculation", `Expected own, got ${testA.planetRole.signDignity}`);
  assert(
    testA.planetRole.housesRuled.includes(6) && testA.planetRole.housesRuled.includes(11),
    "Test A: Venus rules 6th & 11th for Sag",
    `Houses ruled: ${testA.planetRole.housesRuled.join(",")}`
  );

  const primaryTopicsA = testA.themes.primary.map(t => t.topic.toLowerCase()).join(" ");
  assert(
    primaryTopicsA.includes("gains") || primaryTopicsA.includes("network") || primaryTopicsA.includes("income"),
    "Test A: Primary themes emphasize gains/networks/income",
    `Got primary topics: ${primaryTopicsA}`
  );

  assert(
    !primaryTopicsA.includes("long-term foundation"),
    "Test A: Primary themes MUST NOT default to generic 'long-term foundation'",
    `Found forbidden string in primary topics: ${primaryTopicsA}`
  );

  // ---------------------------------------------------------------------------
  // Test B: Venus in Virgo (Debilitation)
  // Expected: Debilitation is recognized and caution factor added
  // ---------------------------------------------------------------------------
  const testB = interpretChartTransit(9, "Venus", 6);
  assert(testB.planetRole.signDignity === "debilitated", "Test B: Debilitation recognized", `Got ${testB.planetRole.signDignity}`);
  assert(testB.cautionFactors.length > 0, "Test B: Caution factors generated for debilitation");

  // ---------------------------------------------------------------------------
  // Test C: Venus in Taurus (Own Sign 6th House)
  // Expected: Own sign strength recognized in 6th house
  // ---------------------------------------------------------------------------
  const testC = interpretChartTransit(9, "Venus", 2);
  assert(testC.transit.house === 6, "Test C: Transited house is 6th", `Got ${testC.transit.house}`);
  assert(testC.planetRole.signDignity === "own", "Test C: Own sign dignity for Taurus", `Got ${testC.planetRole.signDignity}`);

  // ---------------------------------------------------------------------------
  // Test D: Venus Transit through 4th House (Pisces)
  // Expected: 4th house themes become primary
  // ---------------------------------------------------------------------------
  const testD = interpretChartTransit(9, "Venus", 12);
  assert(testD.transit.house === 4, "Test D: Transited house is 4th", `Got ${testD.transit.house}`);
  const primaryTopicsD = testD.themes.primary.map(t => t.topic.toLowerCase()).join(" ");
  assert(
    primaryTopicsD.includes("home") || primaryTopicsD.includes("domestic") || primaryTopicsD.includes("security"),
    "Test D: 4th house domestic/home themes are primary",
    `Got primary topics: ${primaryTopicsD}`
  );

  // ---------------------------------------------------------------------------
  // Test E: Mercury / 3rd-House Activation
  // Expected: Communication warning appears ONLY when supported
  // ---------------------------------------------------------------------------
  const testE_noSupport = interpretChartTransit(9, "Venus", 7);
  assert(
    testE_noSupport.themes.conditional.length === 0,
    "Test E: Communication warning SUPPRESSED when no 3rd house/Mercury mechanism exists"
  );

  const testE_withSupport = interpretChartTransit(9, "Venus", 7, { thirdHouseAfflicted: true });
  assert(
    testE_withSupport.themes.conditional.some(t => t.topic.toLowerCase().includes("communication")),
    "Test E: Communication warning INCLUDED when 3rd house is afflicted"
  );

  // ---------------------------------------------------------------------------
  // Test F: Strong Venus + Conflicting Dasha
  // Expected: Dasha interaction reflected as mixed/conditional
  // ---------------------------------------------------------------------------
  const testF = interpretChartTransit(9, "Venus", 7, {
    dashaInfo: { mahadasha: "Ketu", antardasha: "Saturn" },
  });
  assert(testF.dashaInteraction !== undefined, "Test F: Dasha interaction recorded");

  // ---------------------------------------------------------------------------
  // Generic Override Test: Explicitly Catch Original Bug
  // ---------------------------------------------------------------------------
  const genericOverrideTest = interpretChartTransit(9, "Venus", 7);
  const allPrimaryText = genericOverrideTest.themes.primary.map(t => `${t.topic}: ${t.description}`).join("\n");

  assert(
    !allPrimaryText.toLowerCase().includes("communication gaps will surface"),
    "Generic Override Test: 'communication gaps will surface' suppressed from primary"
  );
  assert(
    !allPrimaryText.toLowerCase().includes("mutual commitment"),
    "Generic Override Test: 'mutual commitment' suppressed from primary"
  );

  // ---------------------------------------------------------------------------
  // End-to-End Test: Full Audit Contract Verification
  // ---------------------------------------------------------------------------
  assert(testA.chart.ascendantName === "Sagittarius", "E2E: Ascendant name is Sagittarius");
  assert(testA.transit.signName === "Libra", "E2E: Transit sign name is Libra");
  assert(testA.overallVerdict === "Highly Supportive", "E2E: Overall verdict is Highly Supportive");
  assert(testA.confidence === "high", "E2E: Confidence is high");

  console.log(`\n===============================================================================`);
  console.log(`  REGRESSION TEST SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`===============================================================================\n`);

  if (passedCount !== totalCount) {
    throw new Error(`Regression test suite failed! ${totalCount - passedCount} test(s) failed.`);
  }

  return { passedCount, totalCount };
}

// Auto-run if executed via tsx / node script
if (require.main === module) {
  runTransitRegressionTests();
}
