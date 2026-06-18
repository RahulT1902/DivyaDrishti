import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const emailParam = req.nextUrl.searchParams.get("email");
    const emailHeader = req.headers.get("x-user-email");
    const email = (emailParam || emailHeader || "").trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: email ? { email } : undefined,
      orderBy: email ? undefined : { createdAt: "desc" },
      include: { birthDetails: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        birthDetails: user.birthDetails,
        streakCount: (user as any).streakCount || 0,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error fetching user" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const emailHeader = req.headers.get("x-user-email");
    const body = await req.json();
    const { name, date: dateStr, time, latitude, longitude, timezone } = body;
    const email = (body.email || emailHeader || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!name || !dateStr || !time || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: "All profile and birth details are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    await prisma.$connect();

    const existing = await prisma.user.findUnique({
      where: { email },
      include: { birthDetails: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: name.trim(),
        birthDetails: existing.birthDetails
          ? {
              update: {
                dateOfBirth: date,
                timeOfBirth: time,
                latitude: parsedLat,
                longitude: parsedLng,
                timezone: timezone || "Asia/Kolkata",
              },
            }
          : {
              create: {
                dateOfBirth: date,
                timeOfBirth: time,
                latitude: parsedLat,
                longitude: parsedLng,
                timezone: timezone || "Asia/Kolkata",
              },
            },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error updating profile" },
      { status: 500 }
    );
  }
}
