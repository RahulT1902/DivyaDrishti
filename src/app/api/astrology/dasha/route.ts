export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";

function humanDuration(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "ending soon";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} yr ${remMonths} mo`;
}

export async function GET(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      include: { birthDetails: true },
    });
    if (!user?.birthDetails) return buildErrorResponse("DATA_MALFORMATION", "Profile not found.", 404);

    const { birthDetails } = user;
    const chart = await calculateLagnaChart({
      date:      birthDetails.dateOfBirth.toISOString().split("T")[0],
      time:      birthDetails.timeOfBirth,
      latitude:  birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone:  birthDetails.timezone,
    });

    const moon = chart.planets.find(p => p.name === "Moon");
    if (!moon) return buildErrorResponse("INTERNAL_ERROR", "Moon data missing.", 500);

    const nakshatra = getNakshatra(moon.longitude);
    const balance   = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline  = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
    const temporal  = getDashaContext(timeline, new Date());

    if (!temporal) return buildErrorResponse("INTERNAL_ERROR", "Dasha context unavailable.", 500);

    const now = Date.now();
    const antaEnds = temporal.timing.endsAt.getTime();
    const msLeft   = antaEnds - now;

    // Find the mahadasha end by scanning the timeline
    const mdPeriod = timeline.find(t => t.planet === temporal.stack.mahadasha);
    const mdEnds   = mdPeriod?.end ?? null;
    const mdMsLeft = mdEnds ? mdEnds.getTime() - now : null;

    return buildSuccessResponse({
      mahadasha:            temporal.stack.mahadasha,
      antardasha:           temporal.stack.antardasha,
      antadashaEndsAt:      temporal.timing.endsAt.toISOString(),
      antadashaTimeLeft:    humanDuration(msLeft),
      mahadashaEndsAt:      mdEnds?.toISOString() ?? null,
      mahadashaTimeLeft:    mdMsLeft != null ? humanDuration(mdMsLeft) : null,
    });
  } catch (err: any) {
    console.error("[dasha/route] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}
