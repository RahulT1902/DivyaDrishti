"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHub from "@/components/DashboardHub";

type User = {
  id: string;
  name: string;
  email: string;
  birthDetails: unknown;
  streakCount: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loggedIn = window.localStorage.getItem("divya:loggedIn");
    if (loggedIn !== "true") {
      router.replace("/login");
      return;
    }

    const loadUser = async () => {
      try {
        const userEmail = window.localStorage.getItem("divya:userEmail") || "";
        const res = await fetch("/api/user", {
          cache: "no-store",
          headers: userEmail ? { "x-user-email": userEmail } : undefined,
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          window.localStorage.removeItem("divya:loggedIn");
          router.replace("/login");
          return;
        }

        setUser(json.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        window.localStorage.removeItem("divya:loggedIn");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-base font-medium">Loading your dashboard…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardHub user={user} />;
}
