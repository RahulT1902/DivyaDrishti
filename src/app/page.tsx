import { prisma } from "@/lib/prisma";
import HomePage from "@/components/HomePage";
import DashboardHub from "@/components/DashboardHub";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
    include: { birthDetails: true }
  });

  // First time user - show lively home page
  if (!user) {
    return <HomePage />;
  }

  // User exists but no birth details - redirect to onboarding
  if (!user.birthDetails) {
    redirect("/onboarding");
  }

  // User has birth details - show dashboard
  return <DashboardHub user={user} />;
}
