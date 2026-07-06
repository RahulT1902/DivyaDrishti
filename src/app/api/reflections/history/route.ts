import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth/getUser";

export async function GET(req: NextRequest) {
  try {
    const email = getAuthUser(req)?.email || "";

    if (!email) {
      return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Retrieve last 7 logged reflections sorted descending by date
    const history = await prisma.dailyReflection.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        date: "desc"
      },
      take: 7
    });

    return NextResponse.json({
      success: true,
      history: history.reverse() // Return in chronological order
    });
  } catch (error: any) {
    console.error("[Reflections History API] GET failed:", error.message);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
