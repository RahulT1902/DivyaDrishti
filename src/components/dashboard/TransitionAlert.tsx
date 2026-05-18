import React from "react";
import { motion } from "framer-motion";
import { Timer, ShieldCheck } from "lucide-react";

interface Props {
  daysRemaining: number;
  from: string;
  to: string;
  intensity: number;
}

export default function TransitionAlert({ daysRemaining, from, to, intensity }: Props) {
  const safeDays = isNaN(daysRemaining) ? 14 : daysRemaining;
  const safeIntensity = isNaN(intensity) ? 5 : intensity;
  const isStable = !to || to === "Unknown" || to === "Stable Cycle" || safeDays <= 0;

  return (
    <motion.div
      whileHover={{ translateY: -2 }}
      className="bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 border border-amber-200/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 blur-[20px] rounded-full -mr-6 -mt-6" />

      {/* Top Header Row */}
      <div className="flex items-start gap-3.5 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${isStable ? "bg-emerald-600" : "bg-amber-600"}`}>
          {isStable ? (
            <ShieldCheck className="w-5 h-5 text-white" />
          ) : (
            <Timer className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-950 tracking-tight mb-0.5">
            {isStable ? "Current Planetary Alignment" : "Upcoming Planetary Shift"}
          </h4>
          <p className="text-xs text-amber-800 font-medium leading-normal">
            {isStable ? (
              <>
                Deep in <span className="text-amber-950 font-bold underline decoration-emerald-400 decoration-2">{from}</span> with steady energy.
              </>
            ) : (
              <>
                Transitioning from <span className="text-amber-950 font-bold underline decoration-amber-400 decoration-2">{from}</span> to{" "}
                <span className="text-amber-900 font-bold underline decoration-amber-500 decoration-2">{to}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="h-px bg-amber-100/80 w-full" />

      {/* Grid or Info Row */}
      <div className="grid grid-cols-2 gap-4 items-center relative z-10">
        {/* Left Card: Countdown / Status */}
        <div className="bg-white/80 border border-amber-100 rounded-xl p-3 text-center shadow-2xs">
          <p className="text-[10px] font-extrabold text-amber-800/80 uppercase tracking-wider mb-1">
            {isStable ? "Cycle Status" : "Countdown"}
          </p>
          <p className={`text-2xl font-black leading-none ${isStable ? "text-emerald-700" : "text-amber-900"}`}>
            {isStable ? (
              "Steady"
            ) : (
              <>
                {safeDays} <span className="text-xs font-bold text-amber-600/70">Days</span>
              </>
            )}
          </p>
        </div>

        {/* Right Card: Intensity */}
        <div className="bg-white/80 border border-amber-100 rounded-xl p-3 text-center shadow-2xs">
          <p className="text-[10px] font-extrabold text-amber-800/80 uppercase tracking-wider mb-2.5">
            {isStable ? "Current Intensity" : "Next Phase Intensity"}
          </p>
          <div className="flex gap-1.5 justify-center items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-3.5 rounded-sm transition-colors duration-300 ${
                  i < Math.round(safeIntensity / 2)
                    ? isStable
                      ? "bg-gradient-to-t from-emerald-600 to-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                      : "bg-gradient-to-t from-amber-600 to-amber-500 shadow-[0_0_6px_rgba(217,119,6,0.3)]"
                    : "bg-amber-100"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
