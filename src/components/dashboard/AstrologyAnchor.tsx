"use client";

import React from "react";
import { motion } from "framer-motion";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_RULERS: Record<string, string> = {
  Aries: "Mars", Scorpio: "Mars",
  Taurus: "Venus", Libra: "Venus",
  Gemini: "Mercury", Virgo: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Sagittarius: "Jupiter", Pisces: "Jupiter",
  Capricorn: "Saturn", Aquarius: "Saturn"
};

const getSignName = (signNum: number) => {
  return ZODIAC_SIGNS[(signNum - 1) % 12] || "Aries";
};

export default function AstrologyAnchor({ chartData }: { chartData?: any }) {
  const realChart = chartData?.chart;
  const realLagnaSignNum = realChart?.lagna?.sign || 10;
  const realLagnaSignName = getSignName(realLagnaSignNum);
  
  const realMD = chartData?.temporal?.stack?.mahadasha || "Saturn";
  const realAD = chartData?.temporal?.stack?.antardasha || "Jupiter";
  
  const moonPlanet = realChart?.planets?.find((p: any) => p.name === "Moon");
  const moonSignName = moonPlanet ? getSignName(moonPlanet.sign) : "Taurus";
  const rulingPlanet = SIGN_RULERS[realLagnaSignName] || "Saturn";

  const mdEndsAt = chartData?.temporal?.timing?.endsAt 
    ? new Date(chartData.temporal.timing.endsAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Aug 2035";

  // Calculate elapsed progress percent for the active dasha phase
  const startsAtMs = chartData?.temporal?.timing?.startsAt ? new Date(chartData.temporal.timing.startsAt).getTime() : 0;
  const endsAtMs = chartData?.temporal?.timing?.endsAt ? new Date(chartData.temporal.timing.endsAt).getTime() : 0;
  const nowMs = new Date().getTime();
  
  let progressPercent = 45;
  if (startsAtMs && endsAtMs && endsAtMs > startsAtMs) {
    const total = endsAtMs - startsAtMs;
    const elapsed = Math.max(0, nowMs - startsAtMs);
    progressPercent = Math.max(5, Math.min(95, Math.round((elapsed / total) * 100)));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
      {/* Lagna / Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-1 bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 blur-[40px] -mr-6 -mt-6 rounded-full" />
        <h4 className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Birth Chart Identity</h4>
        <h2 className="text-2xl font-serif font-semibold text-amber-900 mb-4">
          {realLagnaSignName} <span className="text-amber-600/60 font-normal text-lg">Ascendant</span>
        </h2>

        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-amber-700/40 uppercase tracking-wider mb-0.5">Ruling Planet</p>
            <p className="text-sm font-bold text-amber-800">{rulingPlanet}</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-700/40 uppercase tracking-wider mb-0.5">Moon Sign</p>
            <p className="text-sm font-bold text-amber-900">{moonSignName}</p>
          </div>
        </div>
      </motion.div>

      {/* Dasha Timeline Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-1 md:col-span-2 bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm flex flex-col justify-between"
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h4 className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest mb-1">Current Life Chapter (Dasha)</h4>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-serif font-semibold text-amber-900">{realMD}</h2>
              <span className="text-amber-600/60 text-sm">Mahadasha</span>
            </div>
            <p className="text-xs text-amber-700/50 mt-0.5">Active until {mdEndsAt}</p>
          </div>

          <div className="text-right">
            <h4 className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest mb-1">Current Focus</h4>
            <div className="flex items-baseline gap-2 justify-end">
              <h2 className="text-xl font-serif font-semibold text-amber-600">{realAD}</h2>
              <span className="text-amber-600/60 text-sm">Antardasha</span>
            </div>
            <p className="text-xs text-amber-700/50 mt-0.5">{chartData?.temporal?.timing?.remaining || "—"} remaining</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-amber-700/40 font-bold uppercase tracking-widest mb-1.5">
            <span>{realMD} Journey</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-amber-300 w-[30%]" />
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[15%] relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-amber-500 rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
