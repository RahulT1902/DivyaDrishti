import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { getEngine } from "@/lib/astrology/engine";
import { computePanchang, PanchangResult } from "@/lib/astrology/panchang";
import { Constants } from "@fusionstrings/swisseph-wasi";

// ── In-memory daily cache ─────────────────────────────────────────────────────
// Cache key: "YYYY-MM-DD:lat:lng:tz"
// Tithi / Nakshatra / Rahu Kaal only change on predictable daily boundaries,
// so recomputing on every request is unnecessary.
const panchangCache = new Map<string, PanchangResult>();

// ── Get today's date string in a given IANA timezone ─────────────────────────
function getTodayInTimezone(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function GET(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // ── 1. Load birth profile from DB ─────────────────────────────────────────
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      include: { birthDetails: true },
    });

    if (!user?.birthDetails) {
      return NextResponse.json(
        { success: false, error: "Birth details not found" },
        { status: 404 },
      );
    }

    const { latitude, longitude, timezone } = user.birthDetails;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const tz  = (timezone as string) || "Asia/Kolkata";

    // ── 2. Today in user's local timezone ─────────────────────────────────────
    const todayStr = getTodayInTimezone(tz);

    // ── 3. Cache check ────────────────────────────────────────────────────────
    const cacheKey = `${todayStr}:${lat.toFixed(4)}:${lng.toFixed(4)}:${tz}`;
    const cached = panchangCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, panchang: cached });
    }

    // ── 4. Current Julian Day (UTC now) ───────────────────────────────────────
    const now = new Date();
    const utDecimal =
      now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600;

    const eph = await getEngine();
    const julDay = eph.swe_julday(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      utDecimal,
      Constants.SE_GREG_CAL,
    );

    // ── 5. Sidereal mode: Lahiri / Chitra Paksha (SE_SIDM_LAHIRI = 1) ─────────
    eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
    const flags = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;

    // ── 6. Sun and Moon sidereal longitudes ───────────────────────────────────
    const sunResult  = eph.swe_calc_ut(julDay, Constants.SE_SUN,  flags);
    const moonResult = eph.swe_calc_ut(julDay, Constants.SE_MOON, flags);

    const sunLongitude  = sunResult.xx[0];
    const moonLongitude = moonResult.xx[0];

    // ── 7. Compute Panchang ───────────────────────────────────────────────────
    const result = computePanchang({
      sunLongitude,
      moonLongitude,
      date: todayStr,
      lat,
      lng,
      timezone: tz,
    });

    // ── 8. Cache and return ───────────────────────────────────────────────────
    panchangCache.set(cacheKey, result);

    return NextResponse.json({ success: true, panchang: result });
  } catch (error: unknown) {
    console.error("[panchang/today] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Panchang computation failed",
      },
      { status: 500 },
    );
  }
}
