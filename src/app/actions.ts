"use server";

import { prisma } from "@/lib/prisma";

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const dateStr = formData.get("date") as string;
    const time = formData.get("time") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const timezone = (formData.get("timezone") as string) || "Asia/Kolkata";

    // Ensure connection is active (helps wake up Neon if it's sleeping)
    await prisma.$connect();

    // Combine date and time if needed, but schema simple for now
    const date = new Date(dateStr);

    await prisma.user.create({
      data: {
        name,
        email: `${Date.now()}@local.dev`, // temp for single-user mode
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

    return { success: true };
  } catch (error) {
    console.error("Initialization error:", error);
    return { success: false, error: "System could not calibrate. Check connection." };
  }
}
