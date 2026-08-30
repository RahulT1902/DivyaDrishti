export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";
import { buildSuccessResponse, buildErrorResponse } from "@/lib/utils/apiResponse";

const REPORT_PRICE_PAISE = 59900; // ₹599 in paise

function getRazorpay() {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys not configured.");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(req: NextRequest) {
  try {
    const userEmail = getAuthUser(req)?.email ?? "";
    if (!userEmail) return buildErrorResponse("AUTH_REQUIRED", "Authentication required.", 401);

    const { year } = await req.json();
    const targetYear = Number(year);
    if (!targetYear || targetYear < 2024 || targetYear > 2035) {
      return buildErrorResponse("DATA_MALFORMATION", "Invalid year.", 400);
    }

    const user = await prisma.user.findFirst({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) return buildErrorResponse("DATA_MALFORMATION", "User not found.", 404);

    // Check if already purchased
    const existing = await prisma.annualReport.findUnique({
      where: { userId_year: { userId: user.id, year: targetYear } },
      select: { paidAt: true, razorpayOrderId: true },
    });
    if (existing?.paidAt) {
      return buildSuccessResponse({ alreadyPurchased: true, year: targetYear });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount:   REPORT_PRICE_PAISE,
      currency: "INR",
      receipt:  `ar_${user.id}_${targetYear}`,
      notes:    { userId: user.id, year: String(targetYear) },
    });

    // Upsert the report row with the order id (not yet paid)
    await prisma.annualReport.upsert({
      where:  { userId_year: { userId: user.id, year: targetYear } },
      update: { razorpayOrderId: order.id },
      create: { userId: user.id, year: targetYear, razorpayOrderId: order.id },
    });

    return buildSuccessResponse({
      orderId:  order.id,
      amount:   REPORT_PRICE_PAISE,
      currency: "INR",
      keyId:    process.env.RAZORPAY_KEY_ID,
      year:     targetYear,
    });
  } catch (err: any) {
    console.error("[annual-report/purchase] Error:", err);
    return buildErrorResponse("INTERNAL_ERROR", err.message);
  }
}
