"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import MorningBriefing from "@/components/dashboard/MorningBriefing";
import { DailyBriefing } from "@/lib/guidance/guidanceCompressor";

export default function GuidancePage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [userName, setUserName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guidance/daily")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBriefing(data.briefing);
          setUserName(data.userName);
        } else {
          setError(data.error || "Unable to load briefing.");
        }
      })
      .catch(() => setError("Network error loading briefing."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Sparkles className="w-8 h-8 text-purple-500" />
        </motion.div>
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">
          Synthesizing your day&hellip;
        </p>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-2">Unable to load briefing</p>
          <p className="text-slate-700 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return <MorningBriefing briefing={briefing} userName={userName} />;
}
