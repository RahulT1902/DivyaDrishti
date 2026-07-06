export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { LifeInsightsService, FeedbackCollector } from "@/lib/intelligence/lifeInsights/services";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";

    if (!userEmail) {
      return buildErrorResponse("DATA_MALFORMATION", "User email is required.", 400);
    }

    // 1. Fetch User and Birth Profile
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      include: { birthDetails: true }
    });

    if (!user || !user.birthDetails) {
      return buildErrorResponse("DATA_MALFORMATION", "User profile or birth details not initialized.", 404);
    }

    const { birthDetails } = user;

    // 2. Astrology Chart calculations
    const chart = await calculateLagnaChart({
      date: birthDetails.dateOfBirth.toISOString().split("T")[0],
      time: birthDetails.timeOfBirth,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone: birthDetails.timezone
    });

    // 3. Vimshottari Dasha Context & Timeline Calculations
    const moon = chart.planets.find(p => p.name === "Moon");
    if (!moon) {
      return buildErrorResponse("INTERNAL_ERROR", "Unable to compute lunar coordinates.");
    }

    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
    const temporal = getDashaContext(timeline, new Date());

    // 4. Orchestrate high-fidelity cached payload
    const payload = await LifeInsightsService.getDashboardPayload(
      user.id,
      chart as any,
      timeline,
      birthDetails.dateOfBirth,
      temporal
    );

    return buildSuccessResponse({
      ...payload,
      isPremium: (user as any).isPremium || false // Simulated or stored flag
    });
  } catch (error: any) {
    console.error("[life-insights/GET] Error:", error);
    return buildErrorResponse("INTERNAL_ERROR", error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email } = body;

    if (!email) {
      return buildErrorResponse("DATA_MALFORMATION", "Email is required.", 400);
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return buildErrorResponse("DATA_MALFORMATION", "User not found.", 404);
    }

    if (action === "FEEDBACK") {
      const { periodStart, periodEnd, theme, eventName, feedback } = body;
      if (!periodStart || !periodEnd || !theme || !eventName || !feedback) {
        return buildErrorResponse("DATA_MALFORMATION", "Missing feedback fields.", 400);
      }

      const result = await FeedbackCollector.saveFeedback(user.id, {
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        theme,
        eventName,
        feedback
      });

      return buildSuccessResponse({ success: true, feedback: result });
    }

    if (action === "ANALYTICS") {
      const { eventType, category, engagementTimeMs, metadata } = body;
      if (!eventType) {
        return buildErrorResponse("DATA_MALFORMATION", "eventType is required.", 400);
      }

      const result = await FeedbackCollector.saveAnalytics(user.id, {
        eventType,
        category,
        engagementTimeMs,
        metadata
      });

      return buildSuccessResponse({ success: true, analytics: result });
    }

    if (action === "JOURNAL") {
      const { journalId, status } = body;
      if (!journalId || !status) {
        return buildErrorResponse("DATA_MALFORMATION", "journalId and status are required.", 400);
      }

      const result = await prisma.lifeInsightPredictionJournal.update({
        where: { id: journalId },
        data: { status }
      });

      return buildSuccessResponse({ success: true, journal: result });
    }

    return buildErrorResponse("DATA_MALFORMATION", "Invalid action request.", 400);
  } catch (error: any) {
    console.error("[life-insights/POST] Error:", error);
    return buildErrorResponse("INTERNAL_ERROR", error.message);
  }
}
