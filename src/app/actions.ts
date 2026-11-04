"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function registerUser(formData: FormData) {
  try {
    // Server actions are public endpoints: identity must come from a verified
    // token, never from a client-supplied email.
    const authUser = verifyToken((formData.get("token") as string | null) ?? "");
    if (!authUser) {
      return { success: false, error: "Your session has expired. Please sign in again." };
    }

    const name = ((formData.get("name") as string | null) ?? "").trim();
    const dateStr = formData.get("date") as string;
    const time = formData.get("time") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const timezone = (formData.get("timezone") as string) || "Asia/Kolkata";

    // Ensure connection is active (helps wake up Neon if it's sleeping)
    await prisma.$connect();

    // Combine date and time if needed, but schema simple for now
    const date = new Date(dateStr);

    const existing = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { birthDetails: true },
    });

    if (!existing) {
      return { success: false, error: "Account not found. Please sign up again." };
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(name ? { name } : {}),
        birthDetails: existing.birthDetails
          ? {
              update: {
                dateOfBirth: date,
                timeOfBirth: time,
                latitude,
                longitude,
                timezone,
              },
            }
          : {
              create: {
                dateOfBirth: date,
                timeOfBirth: time,
                latitude,
                longitude,
                timezone,
              },
            },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Initialization error:", error);
    return { success: false, error: "System could not calibrate. Check connection." };
  }
}
