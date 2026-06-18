import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EnergyLevel, StressLevel } from "@prisma/client";

// Normalize date to strictly midnight UTC for canonical daily anchoring
function getMidnightUTC(dateString?: string): Date {
  const date = dateString ? new Date(dateString) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || req.headers.get("x-user-email");
    const dateStr = searchParams.get("date"); // Optional, defaults to today

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

    const targetDate = getMidnightUTC(dateStr || undefined);

    const reflection = await prisma.dailyReflection.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      hasLoggedToday: !!reflection,
      reflection 
    });
  } catch (error: any) {
    console.error("[Reflections API] GET failed:", error.message);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || req.headers.get("x-user-email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 });
    }

    const { energy, stress, notes, source } = body;

    // Validate Enums strictly
    if (!["HIGH", "NEUTRAL", "LOW"].includes(energy)) {
      return NextResponse.json({ success: false, error: "Invalid energy level" }, { status: 400 });
    }
    
    if (!["LOW", "MEDIUM", "HIGH"].includes(stress)) {
      return NextResponse.json({ success: false, error: "Invalid stress level" }, { status: 400 });
    }

    // Limit notes to strictly 300 characters to prevent therapy-dumping/essay writing
    let safeNotes = null;
    if (notes && typeof notes === "string") {
      safeNotes = notes.trim().substring(0, 300);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const targetDate = getMidnightUTC();

    // STRICT RULE: Do not allow multiple writes or overwrites per day. 
    // This maintains canonical temporal anchors and prevents obsessive logging.
    const existing = await prisma.dailyReflection.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate
        }
      }
    });

    if (existing) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (existing.createdAt > oneHourAgo) {
        const updatedReflection = await prisma.dailyReflection.update({
          where: { id: existing.id },
          data: {
            energy: energy as EnergyLevel,
            stress: stress as StressLevel,
            notes: safeNotes,
            source: source || "MANUAL"
          }
        });
        return NextResponse.json({ success: true, reflection: updatedReflection, updated: true });
      }

      return NextResponse.json({ 
        success: false, 
        alreadyLogged: true,
        error: "A reflection has already been recorded for today." 
      }, { status: 409 });
    }

    const newReflection = await prisma.dailyReflection.create({
      data: {
        userId: user.id,
        date: targetDate,
        energy: energy as EnergyLevel,
        stress: stress as StressLevel,
        notes: safeNotes,
        source: source || "MANUAL"
      }
    });

    return NextResponse.json({ success: true, reflection: newReflection });
  } catch (error: any) {
    console.error("[Reflections API] POST failed:", error.message);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
