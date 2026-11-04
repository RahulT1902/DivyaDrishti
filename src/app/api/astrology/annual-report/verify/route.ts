// AI calls go to Gemini first (~11-14s); keep well above it, within Vercel Hobby limits.
export const maxDuration = 60;

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";
import { generateAnnualReport } from "@/lib/reports/annualReportGenerator";

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const body   = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, year } = await req.json();
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return buildErrorResponse("DATA_MALFORMATION", "Payment details missing.", 400);
    }

    // Verify signature
    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return buildErrorResponse("AUTH_REQUIRED", "Payment signature invalid.", 401);
    }

    const user = await prisma.user.findFirst({
      where:   { email: userEmail },
      include: { birthDetails: true },
    });
    if (!user?.birthDetails) return buildErrorResponse("DATA_MALFORMATION", "Profile not found.", 404);

    const targetYear = Number(year);

    // Mark as paid
    await prisma.annualReport.update({
      where: { razorpayOrderId },
      data:  { razorpayPaymentId, paidAt: new Date() },
    });

    // Generate report (synchronous — takes ~20–30s)
    const domains = await generateAnnualReport(targetYear, user.id, user.birthDetails);

    // Persist
    const report = await prisma.annualReport.update({
      where: { razorpayOrderId },
      data: {
        career:       domains.career,
        health:       domains.health,
        finance:      domains.finance,
        relationship: domains.relationship,
      },
    });

    return buildSuccessResponse({
      year:         report.year,
      career:       report.career,
      health:       report.health,
      finance:      report.finance,
      relationship: report.relationship,
      paidAt:       report.paidAt,
    });
  } catch (err: any) {
    console.error("[annual-report/verify] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}
