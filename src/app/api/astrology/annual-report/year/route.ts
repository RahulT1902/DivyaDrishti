export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const year = Number(req.nextUrl.searchParams.get("year"));
    if (!year) return buildErrorResponse("DATA_MALFORMATION", "year param required.", 400);

    const user = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
    if (!user) return buildErrorResponse("DATA_MALFORMATION", "User not found.", 404);

    const report = await prisma.annualReport.findUnique({
      where: { userId_year: { userId: user.id, year } },
    });

    if (!report) return buildSuccessResponse({ exists: false });
    if (!report.paidAt) return buildSuccessResponse({ exists: true, paid: false });

    return buildSuccessResponse({
      exists:       true,
      paid:         true,
      year:         report.year,
      career:       report.career,
      health:       report.health,
      finance:      report.finance,
      relationship: report.relationship,
      paidAt:       report.paidAt,
    });
  } catch (err: any) {
    console.error("[annual-report/year] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}
