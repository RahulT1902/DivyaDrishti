import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateHumanGuidance } from "@/lib/intelligence/interpretationEngine";
import { generateKundaliReport } from "@/lib/intelligence/reportEngine";
import { generateNarrative } from "@/lib/intelligence/narrativeEngine";
import { extractAstroSignals } from "@/lib/intelligence/astroSignals";
import { generateTransitIntelligence } from "@/lib/intelligence/transit";
import { synthesizeLifeDomains } from "@/lib/intelligence/domain";
import { DecisionSignal, Intent, Timeframe } from "@/lib/intelligence/types";
import { buildSuccessResponse, buildErrorResponse, ErrorType } from "@/lib/utils/apiResponse";

// Helper for 6:00 AM boundary logic
function getCycleInfo(timezone: string = "Asia/Kolkata") {
  const now = new Date();
  
  const today6AM = new Date(now);
  today6AM.setHours(6, 0, 0, 0);

  const currentBoundary = now < today6AM 
    ? new Date(today6AM.getTime() - 24 * 60 * 60 * 1000) 
    : today6AM;

  const prevBoundary = new Date(currentBoundary.getTime() - 24 * 60 * 60 * 1000);
  const nextBoundary = new Date(currentBoundary.getTime() + 24 * 60 * 60 * 1000);

  return {
    currentCycleId: currentBoundary.toISOString().split("T")[0],
    currentBoundary,
    prevBoundary,
    nextBoundary,
    secondsUntilNext: Math.max(0, Math.floor((nextBoundary.getTime() - now.getTime()) / 1000))
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainParam = searchParams.get("intent") || "general";
    const timeframeParam = searchParams.get("timeframe") || "this-week";
    
    const intent: Intent = {
      domain: domainParam as any,
      type: "general",
      confidence: 1,
      timeframe: timeframeParam
    };
    const timeframe = timeframeParam as Timeframe;

    const emailParam = searchParams.get("email") || "";
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (emailParam || emailHeader).trim().toLowerCase();

    // 1. Get User by email (or fall back to most recent for backward compat)
    const user = await prisma.user.findFirst({
      where: userEmail ? { email: userEmail } : undefined,
      orderBy: userEmail ? undefined : { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user || !user.birthDetails) {
      return buildErrorResponse("DATA_MALFORMATION", "User or birth profile not initialized.", 404);
    }

    const { birthDetails } = user;
    const cycle = getCycleInfo(birthDetails.timezone);

    // 2. Astrology Engine
    const chart = await calculateLagnaChart({
      date: birthDetails.dateOfBirth.toISOString().split('T')[0], 
      time: birthDetails.timeOfBirth,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone: birthDetails.timezone,
    });

    const moon = chart.planets.find(p => p.name === "Moon");
    if (!moon) throw new Error("Moon data required");
    
    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
    
    // 3. Orchestrate High-Fidelity Dasha & Narrative
    const temporal = getDashaContext(timeline, new Date());
    const currentTransits = await calculateCurrentTransits();
    
    // 4. Intelligence & Suppression
    // Pass dasha stack safely — temporal can be null if date is out of cycle range
    let signals = extractAstroSignals(chart, currentTransits.positions, temporal?.stack ?? null, intent);
    
    // Intent-Based Suppression logic (Soft Suppression)
    if (intent.domain === "career") {
      signals = signals.map(s => {
        const areas = Array.isArray(s.area) ? s.area : [];
        if (areas.includes("spouse") || areas.includes("spiritual")) {
          return { ...s, strengthScore: (s.strengthScore || 50) * 0.3 };
        }
        return s;
      });
    }

    const narrative = generateNarrative(intent, timeframe, chart, temporal, signals);
    const report = generateKundaliReport(chart, temporal, timeframe);
    const transitIntelligence = generateTransitIntelligence(currentTransits.positions, chart.planets, chart.lagna.sign);
    const dashaCtx = {
      mahadasha: temporal?.stack?.mahadasha || "Saturn",
      antardasha: temporal?.stack?.antardasha || "Jupiter",
      pratyantar: temporal?.stack?.pratyantar || "Unknown",
      transitAnchors: []
    };
    const domainIntelligence = synthesizeLifeDomains(chart, dashaCtx as any, transitIntelligence);

    // Safely extract insight values with fallbacks
    const primaryInsight = narrative.heroInsight || "Your life chapters are being calibrated.";

    const supportingPoints = narrative.phases?.[0]?.opportunities || ["Trust the current phase.", "Patience yields results.", "Focus on what is in your control."];

    const cautionPoint = narrative.phases?.[0]?.cautions?.[0] || "Avoid impulsive decisions during this phase.";

    return buildSuccessResponse({
      user: { name: user.name },
      narrative: narrative.realityTranslation || narrative.verdict,
      insights: {
        primary: primaryInsight,
        supporting: supportingPoints,
        caution: cautionPoint
      },
      guidance: {
        do: narrative.phases?.[0]?.opportunities || ["Stay consistent.", "Review your plans.", "Build structure."],
        avoid: narrative.phases?.[0]?.cautions || ["Shortcuts", "Impulsive spending", "Speculative risks"]
      },
      chart,
      temporal,
      timeline,
      transitIntelligence,
      domainIntelligence,
      meta: {
        intent,
        timeframe,
        cycleId: cycle.currentCycleId
      }
    });
  } catch (error: any) {
    console.error("[chart/route] Error:", error);
    return buildErrorResponse("INTERNAL_ERROR", error.message);
  }
}
