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
        streakCount: user.streakCount || 0,
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
