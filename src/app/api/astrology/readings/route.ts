export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const body = await req.json();
    const { question, answer, followUp, investigationTrail, domain } = body;

    if (!question || !answer) {
      return buildErrorResponse("DATA_MALFORMATION", "question and answer are required.", 400);
    }

    const user = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
    if (!user) return buildErrorResponse("DATA_MALFORMATION", "User not found.", 404);

    const saved = await prisma.savedReading.create({
      data: {
        userId: user.id,
        question: String(question).slice(0, 2000),
        answer: String(answer).slice(0, 8000),
        followUp: followUp ? String(followUp).slice(0, 500) : null,
        investigationTrail: investigationTrail ? String(investigationTrail).slice(0, 4000) : null,
        domain: domain ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return buildSuccessResponse({ id: saved.id, createdAt: saved.createdAt });
  } catch (err: any) {
    console.error("[readings/POST] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const user = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
    if (!user) return buildErrorResponse("DATA_MALFORMATION", "User not found.", 404);

    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

    const readings = await prisma.savedReading.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        question: true,
        answer: true,
        followUp: true,
        investigationTrail: true,
        domain: true,
        createdAt: true,
      },
    });

    const hasMore = readings.length > limit;
    const items = hasMore ? readings.slice(0, limit) : readings;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return buildSuccessResponse({ items, nextCursor, total: items.length });
  } catch (err: any) {
    console.error("[readings/GET] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return buildErrorResponse("DATA_MALFORMATION", "id is required.", 400);

    const user = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
    if (!user) return buildErrorResponse("DATA_MALFORMATION", "User not found.", 404);

    await prisma.savedReading.deleteMany({ where: { id, userId: user.id } });

    return buildSuccessResponse({ deleted: true });
  } catch (err: any) {
    console.error("[readings/DELETE] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}
