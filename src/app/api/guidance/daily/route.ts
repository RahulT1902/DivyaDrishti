import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLagnaChart } from "@/lib/astrology/engine";
import { getNakshatra, getBalanceYears, buildMahadashaTimeline, getDashaContext } from "@/lib/astrology/dasha";
import { calculateCurrentTransits } from "@/lib/astrology/transit";
import { generateTransitIntelligence } from "@/lib/intelligence/transit";
import { LifeStateSynthesizer } from "@/lib/intelligence/synthesizers/lifeStateSynthesizer";
import { TimelineProjectionEngine } from "@/lib/intelligence/timeline/timelineProjectionEngine";
import { DashboardStateComposer } from "@/lib/dashboard/dashboardStateComposer";
import { GoalContextMapper } from "@/lib/intelligence/goals/goalContextMapper";
import { DailyGuidanceSynthesizer } from "@/lib/guidance/dailyGuidanceSynthesizer";

function getMidnightUTC(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email") || "";
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (emailParam || emailHeader).trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication email required." },
        { status: 400 }
      );
    }

    // ── 1. Load User with Context ───────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        birthDetails: true,
        memories: { orderBy: { createdAt: "desc" }, take: 20 },
        goals: { where: { currentStatus: "ACTIVE" }, take: 10 },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    if (!user.birthDetails) {
      return NextResponse.json(
        { success: false, onboardingNeeded: true, error: "Birth profile details not set." },
        { status: 200 }
      );
    }

    const { birthDetails } = user;
    const targetDate = getMidnightUTC();

    // ── 2. Check Database Cache for Today's Insight ─────────────────────────
    const cachedInsight = await prisma.dailyInsight.findFirst({
      where: {
        userId: user.id,
        date: targetDate,
      },
    });

    if (cachedInsight) {
      const focus = cachedInsight.focusAreas as any;
      const briefing = {
        date: cachedInsight.date.toISOString(),
        executionMode: focus.executionMode || "ARCHITECT",
        headline: cachedInsight.summary,
        priorities: cachedInsight.favorable as string[],
        avoid: cachedInsight.cautions as string[],
        memoryInfluence: focus.memoryInfluence,
        transitionAlert: focus.transitionAlert,
        confidenceScore: focus.confidenceScore ?? 0.8,
      };

      return NextResponse.json({
        success: true,
        briefing,
        humanizedHeadline: briefing.headline,
        userName: user.name,
      });
    }

    // ── 3. Run Astrological Calculation Engines ─────────────────────────────
    const chart = await calculateLagnaChart({
      date: birthDetails.dateOfBirth.toISOString().split("T")[0],
      time: birthDetails.timeOfBirth,
      latitude: birthDetails.latitude,
      longitude: birthDetails.longitude,
      timezone: birthDetails.timezone,
    });

    const moon = chart.planets.find((p) => p.name === "Moon");
    if (!moon) {
      throw new Error("Unable to retrieve lunar position for user birth details.");
    }

    const nakshatra = getNakshatra(moon.longitude);
    const balance = getBalanceYears(nakshatra.lord, nakshatra.progress);
    const timeline = buildMahadashaTimeline(birthDetails.dateOfBirth, nakshatra.lord, balance);

    const temporal = getDashaContext(timeline, new Date());
    const currentTransits = await calculateCurrentTransits();
    const transitIntelligence = generateTransitIntelligence(
      currentTransits.positions,
      chart.planets,
      chart.lagna.sign
    );

    const realDashaCtx = {
      currentMahadasha: temporal?.stack?.mahadasha,
      currentAntardasha: temporal?.stack?.antardasha,
    };
    const realTransits = transitIntelligence?.transits || [];
    const realTimeline = timeline.map((p: any) => ({
      planet: p.planet,
      start: new Date(p.start),
      end: new Date(p.end),
    }));

    // ── 4. Synthesize Rich LifeState and Temporal Projection ────────────────
    const lifeSynthesizer = new LifeStateSynthesizer();
    const lifeState = await lifeSynthesizer.synthesize(
      chart,
      realDashaCtx as any,
      realTimeline,
      realTransits,
      user.goals,
      user.memories
    );

    const projectionEngine = new TimelineProjectionEngine();
    const projection = await projectionEngine.project(
      "30D",
      {
        primaryArchetype: dashaArchetype(realDashaCtx.currentMahadasha || "Saturn"),
        longTermThemes: lifeState.primaryThemes,
        confidence: lifeState.confidenceScore,
      } as any,
      {
        intensity: lifeState.overallState.volatilityScore,
        confidence: lifeState.confidenceScore,
        activeTriggers: [],
      } as any
    );

    const composer = new DashboardStateComposer();
    const dashboardState = composer.compose(lifeState, projection);

    // ── 5. Map Goals to Aligned Context ─────────────────────────────────────
    const goalMapper = new GoalContextMapper();
    const goalAlignments = await Promise.all(
      user.goals.slice(0, 3).map((g) => goalMapper.mapGoalToState(g as any, lifeState))
    );

    // ── 6. Synthesize Unified Daily Briefing ────────────────────────────────
    const dailySynthesizer = new DailyGuidanceSynthesizer();
    const output = await dailySynthesizer.synthesize(
      dashboardState,
      lifeState,
      goalAlignments,
      user.memories as any
    );

    const briefing = output.briefing;

    // ── 7. Cache in Database as DailyInsight ────────────────────────────────
    await prisma.dailyInsight.create({
      data: {
        userId: user.id,
        date: targetDate,
        summary: briefing.headline,
        favorable: briefing.priorities,
        cautions: briefing.avoid,
        focusAreas: {
          executionMode: briefing.executionMode,
          memoryInfluence: briefing.memoryInfluence,
          transitionAlert: briefing.transitionAlert,
          confidenceScore: briefing.confidenceScore,
        },
        emotionalTone: lifeState.emotionalState.dominantTone,
      },
    });

    return NextResponse.json({
      success: true,
      briefing,
      humanizedHeadline: briefing.headline,
      userName: user.name,
    });
  } catch (error: any) {
    console.error("[Guidance API Error]", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Failed to synthesize daily guidance payload." },
      { status: 500 }
    );
  }
}

function dashaArchetype(planet: string): string {
  const archetypes: Record<string, string> = {
    Sun: "Vitalizer",
    Moon: "Nurturer",
    Mars: "Warrior",
    Mercury: "Communicator",
    Jupiter: "Teacher",
    Venus: "Harmonizer",
    Saturn: "Builder",
    Rahu: "Amplifier",
    Ketu: "Disruptor",
  };
  return archetypes[planet] || "Teacher";
}
