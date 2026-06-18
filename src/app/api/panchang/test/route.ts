import { NextRequest, NextResponse } from "next/server";
import { computePanchang } from "@/lib/astrology/panchang";

// Diverse test locations (Delhi, London, San Francisco)
const LOCATIONS = [
  { name: "New Delhi", lat: 28.6139, lng: 77.2090, timezone: "Asia/Kolkata" },
  { name: "London", lat: 51.5074, lng: -0.1278, timezone: "Europe/London" },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, timezone: "America/Los_Angeles" }
];

// Generate 20 diverse dates across seasons and years
const DATES = [
  "2026-01-01", "2026-03-21", "2026-06-21", "2026-09-21", "2026-12-21", // Solstices & Equinoxes 2026
  "2025-01-15", "2025-05-15", "2025-08-15", "2025-11-15",             // 2025 seasonal points
  "1980-01-01", "1990-06-15", "2000-12-31", "2010-04-30", "2020-08-08", // Historical anchor dates
  "2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22", // Current week transitions
  "2024-02-29" // Leap day
];

export async function GET(req: NextRequest) {
  try {
    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < DATES.length; i++) {
      const date = DATES[i];
      // Rotate through the three test locations
      const loc = LOCATIONS[i % LOCATIONS.length];

      // Simulate Sun and Moon positions (dynamic test data for unit validation)
      // Sun moves ~1 degree/day starting from 0 at spring equinox
      // Moon moves ~13.2 degrees/day
      const dayOfYear = i * 18;
      const sunLongitude = (dayOfYear) % 360;
      const moonLongitude = (dayOfYear * 13.2) % 360;

      let error = null;
      let output = null;

      try {
        output = computePanchang({
          sunLongitude,
          moonLongitude,
          date,
          lat: loc.lat,
          lng: loc.lng,
          timezone: loc.timezone
        });

        // ── Validation Assertions ──
        // 1. Tithi names must be in our standard lists
        const validTithis = [
          "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
          "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
          "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"
        ];
        if (!validTithis.includes(output.tithi)) {
          throw new Error(`Invalid Tithi calculated: ${output.tithi}`);
        }

        // 2. Paksha must be Shukla or Krishna
        if (output.paksha !== "Shukla" && output.paksha !== "Krishna") {
          throw new Error(`Invalid Paksha: ${output.paksha}`);
        }

        // 3. Nakshatra must belong to the 27 Nakshatras
        const validNakshatras = [
          "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
          "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
          "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
          "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
          "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha",
          "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
        ];
        if (!validNakshatras.includes(output.nakshatra)) {
          throw new Error(`Invalid Nakshatra: ${output.nakshatra}`);
        }

        // 4. Moon sign must be valid
        const validSigns = [
          "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
          "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ];
        if (!validSigns.includes(output.moonSign)) {
          throw new Error(`Invalid Moon Sign: ${output.moonSign}`);
        }

        // 5. Rahu Kaal format check (must match time format e.g. "9:15 AM")
        const timeRegex = /^\d{1,2}:\d{2}\s+(?:AM|PM)$/i;
        if (!timeRegex.test(output.rahuKaal.start) || !timeRegex.test(output.rahuKaal.end)) {
          throw new Error(`Invalid Rahu Kaal format: ${output.rahuKaal.start} to ${output.rahuKaal.end}`);
        }

        passedCount++;
      } catch (err: any) {
        error = err.message;
        failedCount++;
      }

      results.push({
        testCase: i + 1,
        date,
        location: loc.name,
        input: { sunLongitude, moonLongitude },
        output,
        status: error ? "FAILED" : "PASSED",
        error
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalTests: DATES.length,
        passed: passedCount,
        failed: failedCount
      },
      results
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
