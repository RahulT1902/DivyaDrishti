import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await req.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "All fields (email, current, and new password) are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Verify current password
    if (!user.passwordHash || !verifyPassword(String(currentPassword), user.passwordHash)) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Update password hash
    const updated = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        passwordHash: hashPassword(String(newPassword)),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to change password." },
      { status: 500 }
    );
  }
}
