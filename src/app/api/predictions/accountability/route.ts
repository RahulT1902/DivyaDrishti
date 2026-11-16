import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";
import { OUTCOMES, hitRate, type Outcome } from "@/lib/consultation/accountability";

export const dynamic = "force-dynamic";

async function userIdOf(req: NextRequest): Promise<string | null> {
  const email = getAuthUser(req)?.email;
  if (!email) return null;
  const u = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  return u?.id ?? null;
}

/**
 * Prediction check-ins (Step C).
 * GET  → { due: up to 5 passed, unanswered predictions; upcoming: count;
 *          stats: hit rate overall, by domain and by confidence }
 * Hit rates are withheld (null) below 5 answered check-ins.
 */
export async function GET(req: NextRequest) {
  const userId = await userIdOf(req);
  if (!userId) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

  const now = new Date();
  const [due, upcoming, answered] = await Promise.all([
    prisma.punditPrediction.findMany({
      where: { userId, outcome: null, windowEnd: { lte: now } },
      orderBy: { windowEnd: "desc" },
      take: 5,
      select: { id: true, domain: true, windowStart: true, windowEnd: true, direction: true, confidence: true, reason: true, checkQuestion: true },
    }),
    prisma.punditPrediction.count({ where: { userId, outcome: null, windowEnd: { gt: now } } }),
    prisma.punditPrediction.findMany({
      where: { userId, outcome: { not: null } },
      select: { domain: true, confidence: true, outcome: true },
    }),
  ]);

  const group = (key: "domain" | "confidence") => {
    const out: Record<string, ReturnType<typeof hitRate>> = {};
    for (const k of [...new Set(answered.map(a => a[key]))]) out[k] = hitRate(answered.filter(a => a[key] === k).map(a => a.outcome));
    return out;
  };

  return buildSuccessResponse({
    due,
    upcoming,
    stats: {
      overall: hitRate(answered.map(a => a.outcome)),
      byDomain: group("domain"),
      byConfidence: group("confidence"),
    },
  });
}

/** POST { id, outcome: "yes" | "somewhat" | "no" | "skip" } — the user's check-in. */
export async function POST(req: NextRequest) {
  const userId = await userIdOf(req);
  if (!userId) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

  const { id, outcome } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !OUTCOMES.includes(outcome as Outcome)) {
    return buildErrorResponse("DATA_MALFORMATION", "Provide an id and an outcome (yes, somewhat, no or skip).", 400);
  }
  // Only the owner can answer, and only once the window has passed.
  const r = await prisma.punditPrediction.updateMany({
    where: { id, userId, windowEnd: { lte: new Date() } },
    data: { outcome, answeredAt: new Date() },
  });
  if (r.count === 0) return buildErrorResponse("DATA_MALFORMATION", "Prediction not found or not yet due.", 404);
  return buildSuccessResponse({ id, outcome });
}
