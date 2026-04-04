"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHub from "@/components/DashboardHub";
import { Loader } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <p className="text-slate-400">Redirecting...</p>
      </div>
    );
  }

  return <DashboardHub user={user} />;
}
