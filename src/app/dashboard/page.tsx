"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardHub from "@/components/DashboardHub";
import { authFetch } from "@/lib/auth/webFetch";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem("divya:loggedIn");
    const userEmail = localStorage.getItem("divya:userEmail");

    if (!loggedIn || !userEmail) {
      router.replace("/login");
      return;
    }

    // Fetch user profile from DB to get the actual name
    const fetchProfile = async () => {
      try {
        const res = await authFetch("/api/user");
        const data = await res.json();
        
        if (data.success && data.user) {
          setUser({ name: data.user.name, email: data.user.email });
        } else {
          // Fallback to email if name is not loaded
          setUser({ name: "Seeker", email: userEmail });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setUser({ name: "Seeker", email: userEmail });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex flex-col items-center justify-center gap-4 text-[#3F2D1D]">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-xs text-amber-800/60 uppercase tracking-[0.2em] font-serif animate-pulse">
          Opening Sacred Timeline...
        </p>
      </div>
    );
  }

  return <DashboardHub user={user} />;
}
