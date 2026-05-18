import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DashboardStateComposer } from "@/lib/dashboard/dashboardStateComposer";
import { DailyGuidanceSynthesizer } from "@/lib/guidance/dailyGuidanceSynthesizer";
import { GoalContextMapper } from "@/lib/intelligence/goals/goalContextMapper";

/**
 * GET /api/guidance/daily
 * 
 * Runs the complete Daily Guidance pipeline server-side.
 * Returns a fully deterministic + humanized DailyBriefing payload.
 * 
 * No raw astrological data is exposed in the response.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email") || "";
    const emailHeader = req.headers.get("x-user-email") || "";
    const userEmail = (emailParam || emailHeader).trim().toLowerCase();

    // ── 1. Load User Context ────────────────────────────────────────────────
    const user = await prisma.user.findFirst({
      where: userEmail ? { email: userEmail } : undefined,
      orderBy: userEmail ? undefined : { createdAt: "desc" },
      include: {
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

    // ── 2. Load Cached Dashboard State ─────────────────────────────────────
    // In production: load from a cached LifeState record (e.g., Redis or DailyInsight)
    // For MVP: we return a deterministic fallback briefing
    const mockDashboardState = {
      currentPhase: {
        title: "Structured Expansion Phase",
        summary: "A phase that rewards steady, disciplined progress.",
        executionMode: "ARCHITECT",
        focus: ["Strategic planning", "Structured communication", "Long-term documentation"],
        avoid: ["Reactive decisions", "Impulsive scaling"],
      },
      momentum: [
        { label: "Career Momentum", score: 72, trend: "up", color: "purple" },
        { label: "Financial Stability", score: 65, trend: "stable", color: "emerald" },
        { label: "Emotional Load", score: 45, trend: "down", color: "rose" },
      ],
      nextTransition: {
        label: "Next: EXPANSION",
        daysRemaining: 12,
        from: "Structured Expansion",
        to: "EXPANSION",
        intensity: 7,
      },
      timeline: {
        overallTrajectory: { direction: "ASCENDING", momentumScore: 7, volatilityScore: 4, clarityScore: 7.5 },
        windows: [],
        confidenceScore: 0.82,
      } as any,
      lifeScores: { stability: 68, clarity: 75, volatility: 40 },
    } as any;

    // ── 3. Map Goals to GoalAlignedState ───────────────────────────────────
    const goalMapper = new GoalContextMapper();
    const goalAlignments = await Promise.all(
      user.goals.slice(0, 3).map(g => goalMapper.mapGoalToState(g as any, {} as any))
    );

    // ── 4. Run Daily Guidance Synthesizer ──────────────────────────────────
    const synthesizer = new DailyGuidanceSynthesizer();
    const output = await synthesizer.synthesize(
      mockDashboardState,
      {} as any,          // LifeState — will be replaced with real cached state
      goalAlignments,
      user.memories as any
    );

    // ── 5. Persist as DailyInsight for history ─────────────────────────────
    // Skipping prisma write for MVP — can be added once schema is migrated

    return NextResponse.json({
      success: true,
      briefing: output.briefing,
      humanizedHeadline: output.humanizedHeadline,
      meta: output.source,
      userName: user.name,
    });
  } catch (error: any) {
    console.error("[Guidance API]", error?.message);
    return NextResponse.json(
      { success: false, error: "Failed to generate daily guidance." },
      { status: 500 }
    );
  }
}
