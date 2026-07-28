"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { authFetch } from "@/lib/auth/webFetch";

interface DashaInfo {
  mahadasha:         string;
  antardasha:        string;
  antadashaTimeLeft: string;
}

interface DashaCountdownProps {
  onAskDasha?: (question: string) => void;
}

export default function DashaCountdown({ onAskDasha }: DashaCountdownProps) {
  const [dasha, setDasha] = useState<DashaInfo | null>(null);

  useEffect(() => {
    authFetch("/api/astrology/dasha")
      .then(r => r.json())
      .then(data => {
        if (data.success) setDasha(data.data);
      })
      .catch(() => { /* silent — this is an enrichment, not critical */ });
  }, []);

  if (!dasha) return null;

  const handleClick = () => {
    onAskDasha?.(
      `What does my current ${dasha.antardasha} antardasha mean for me right now, and what should I focus on before it ends?`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex items-center justify-between px-5 py-2 bg-amber-50/80 border-b border-[#F1E7D0]/60"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-amber-500/60 shrink-0" />
        <span className="text-[10px] text-amber-700/70 font-medium tracking-wide">
          <span className="font-bold text-amber-800">{dasha.mahadasha}</span>
          {" "}Mahadasha · {" "}
          <span className="font-bold text-amber-800">{dasha.antardasha}</span>
          {" "}Antardasha · Ends in{" "}
          <span className="font-semibold text-amber-700">{dasha.antadashaTimeLeft}</span>
        </span>
      </div>
      <button
        onClick={handleClick}
        className="text-[9px] font-bold text-amber-500 uppercase tracking-widest hover:text-amber-700 transition-colors whitespace-nowrap"
      >
        What does this mean? →
      </button>
    </motion.div>
  );
}
