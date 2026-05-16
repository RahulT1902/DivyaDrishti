"use server";

import { prisma } from "@/lib/prisma";

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = (formData.get("email") as string | null)?.trim().toLowerCase() || "";
    const dateStr = formData.get("date") as string;
    const time = formData.get("time") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const timezone = (formData.get("timezone") as string) || "Asia/Kolkata";

    // Ensure connection is active (helps wake up Neon if it's sleeping)
    await prisma.$connect();

    // Combine date and time if needed, but schema simple for now
    const date = new Date(dateStr);

    const targetEmail = email || `${Date.now()}@local.dev`;
    const existing = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { birthDetails: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
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
    } else {
      await prisma.user.create({
        data: {
          name,
          email: targetEmail,
          birthDetails: {
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
    }

    return { success: true };
  } catch (error) {
    console.error("Initialization error:", error);
    return { success: false, error: "System could not calibrate. Check connection." };
  }
}
