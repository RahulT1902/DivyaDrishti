import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getCurrentDasha } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateHumanGuidance } from "@/lib/intelligence/interpretationEngine";
import { generateKundaliReport } from "@/lib/intelligence/reportEngine";
import { DecisionSignal, Intent, Timeframe } from "@/lib/intelligence/types";
import { buildSuccessResponse, buildErrorResponse, ErrorType } from "@/lib/utils/apiResponse";

// Helper for 6:00 AM boundary logic
function getCycleInfo(timezone: string = "Asia/Kolkata") {
  const now = new Date();
  
  // Calculate today's 6:00 AM in the given timezone
  // For India (+5.5), 6:00 AM is 0:30 AM UTC
  const today6AM = new Date(now);
  today6AM.setHours(6, 0, 0, 0);

  // If now is before 6 AM today, the CURRENT boundary was 6 AM yesterday
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
  console.log("STEP 1: Astrology Request received");
  try {
    const { searchParams } = new URL(req.url);
    const intent = (searchParams.get("intent") as Intent) || "general";
    const timeframe = (searchParams.get("timeframe") as Timeframe) || "this-week";

    // 1. Get User
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      include: { 
        birthDetails: true,
        predictions: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      },
    });

    if (!user || !user.birthDetails) {
      console.error("STEP 1.1: User or birth details missing");
      return NextResponse.json({ 
        success: false, 
        error: { code: "NOT_FOUND", message: "User or birth profile not initialized." }
      }, { status: 404 });
    }

    const { birthDetails } = user;
    const cycle = getCycleInfo(birthDetails.timezone);

    // 2. Perform Astrology & Temporal Calculation (Deterministic)
    // These are always needed for the UI, regardless of cached guidance
    console.log("STEP 2: Initializing Astrology Engine");
    let chart;
    try {
      chart = await calculateLagnaChart({
        date: birthDetails.dateOfBirth.toISOString().split('T')[0], 
        time: birthDetails.timeOfBirth,
        latitude: birthDetails.latitude,
        longitude: birthDetails.longitude,
        timezone: birthDetails.timezone,
      });
    } catch (engineError: any) {
      console.error("ENGINE FAILURE [WASM]:", engineError.message);
      return buildErrorResponse("ENGINE_FAILURE", "The astrology engine is currently recalibrating. Please try again in a moment.");
    }
    console.log("STEP 3: Astrology Calculation Complete");

    const moon = chart.planets.find(p => p.name === "Moon");
    if (!moon) throw new Error("Moon data required for Rashi calculation");
    
    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);
    const currentDasha = getCurrentDasha(timeline, new Date());
    const currentTransits = await calculateCurrentTransits();

    if (!currentDasha || !currentDasha.ad) {
      throw new Error("Could not calculate current Dasha window");
    }

    const temporal = {
      current: {
        mahadasha: currentDasha.md.planet,
        antardasha: currentDasha.ad.planet,
        start: currentDasha.ad.start,
        end: currentDasha.ad.end,
      },
      next: currentDasha.nextAd ? {
        antardasha: currentDasha.nextAd.planet,
        startsAt: currentDasha.nextAd.start
      } : null,
      timeline: {
        past: timeline.filter((t: any) => new Date(t.end) < new Date()),
        present: currentDasha,
        future: timeline.filter((t: any) => new Date(t.start) > new Date())
      }
    };

    // 2b. Generate Human Guidance Report (The Brain)
    console.log("STEP 4: Beginning Intelligent Report Generation");
    const report = generateKundaliReport(chart, temporal, timeframe);
    console.log("STEP 5: Report Generation Successful");

    // 3. Caching & Streak Logic
    let streakCount = (user as any).streakCount || 0;
    const lastViewed = (user as any).lastViewedAt;

    if (lastViewed) {
      if (lastViewed < cycle.currentBoundary && lastViewed >= cycle.prevBoundary) {
        streakCount++;
      } else if (lastViewed < cycle.prevBoundary) {
        streakCount = 1;
      }
    } else {
      streakCount = 1;
    }

    // 4. Cache Check for Guidance
    const existingGuidance = await prisma.predictionRecord.findFirst({
      where: {
        userId: user.id,
        domain: intent,
        createdAt: { gte: cycle.currentBoundary }
      },
      orderBy: { createdAt: "desc" }
    });

    let guidance;
    if (existingGuidance && existingGuidance.prediction) {
      guidance = JSON.parse(existingGuidance.prediction);
    } else {
      // 5. Generate with Evolution Tracking
      guidance = await generateHumanGuidance(
        chart,
        currentTransits.positions,
        currentDasha,
        intent,
        timeframe,
        ((user as any).lastDecisionSignal as DecisionSignal) || undefined
      );

      // 6. Save State & History
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            lastIntent: intent,
            lastTimeframe: timeframe,
            lastDecisionSignal: guidance.decisionSignal,
            lastViewedAt: new Date(),
            streakCount
          } as any
        }),
        prisma.predictionRecord.create({
          data: {
            userId: user.id,
            type: "daily_guidance",
            domain: intent,
            prediction: JSON.stringify(guidance),
            predictionScore: guidance.confidenceScore,
            accuracyPredicted: 0,
            confidence: guidance.confidenceScore,
            risk: guidance.conflictLevel === "high" ? 0.8 : 0.2,
            startTime: cycle.currentBoundary,
            endTime: cycle.nextBoundary
          }
        })
      ]);
    }

    // 7. Journey Narrative
    const journey = user.predictions.map(p => {
       const g = p.prediction ? JSON.parse(p.prediction) : null;
       return {
         intent: p.domain,
         decisionSignal: g?.decisionSignal || "WAIT",
         confidenceLabel: g?.confidenceLevel === "high" ? "Strong clarity" : g?.confidenceLevel === "moderate" ? "Developing clarity" : "Clarity is forming",
         timeframe: g?.timeframe || "this-week",
         createdAt: p.createdAt
       };
    });

    return buildSuccessResponse({
      user: { name: user.name, streak: streakCount },
      guidance,
      report,
      chart,
      temporal,
      journey,
      refresh: {
        nextRefreshSession: cycle.secondsUntilNext,
        lastRefreshBoundary: cycle.currentBoundary
      },
      meta: {
        intent,
        timeframe,
        cycleId: cycle.currentCycleId,
        labels: {
          GO: "Pravah (Flow)",
          WAIT: "Dharya (Patience)",
          AVOID: "Sanyam (Restraint)"
        }
      }
    });
  } catch (error: any) {
    console.error("STEP FAILURE: Astrology API Error", {
      message: error.message,
      stack: error.stack
    });
    return buildErrorResponse("INTERNAL_ERROR", error.message || "Connection interrupted. We couldn't retrieve your guidance.");
  }
}
