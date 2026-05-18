import React from "react";
import { motion } from "framer-motion";
import { TimelineWindow } from "../../lib/intelligence/contracts/timelineState";
import { format } from "date-fns";

interface Props {
  windows: TimelineWindow[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

const categoryConfig: Record<string, { bg: string; border: string; badge: string; label: string }> = {
  EXPANSION:           { bg: "bg-emerald-50",  border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", label: "Jupiter Growth Phase" },
  DISCIPLINE:          { bg: "bg-indigo-50",   border: "border-indigo-200",  badge: "bg-indigo-100 text-indigo-700",  label: "Saturn Discipline Cycle" },
  VOLATILITY:          { bg: "bg-orange-50",   border: "border-orange-200",  badge: "bg-orange-100 text-orange-700",  label: "Mars Volatility Period" },
  RECOVERY:            { bg: "bg-purple-50",   border: "border-purple-200",  badge: "bg-purple-100 text-purple-700",  label: "Ketu Recovery Phase" },
  TRANSFORMATION:      { bg: "bg-rose-50",     border: "border-rose-200",    badge: "bg-rose-100 text-rose-700",      label: "Rahu Transformation" },
  VISIBILITY:          { bg: "bg-amber-50",    border: "border-amber-200",   badge: "bg-amber-100 text-amber-700",    label: "Sun Visibility Phase" },
  EMOTIONAL_PROCESSING:{ bg: "bg-sky-50",      border: "border-sky-200",     badge: "bg-sky-100 text-sky-700",        label: "Moon Emotional Cycle" },
};

export default function TimelineBand({ windows, activeId, onSelect }: Props) {
  return (
    <div 
      className="snap-x snap-mandatory py-2 scroll-smooth custom-scrollbar"
      style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}
    >
      <div className="flex gap-4 min-w-max px-1">
        {windows.map((window, idx) => {
          const isActive = window.id === activeId;
          const cfg = categoryConfig[window.category] || categoryConfig.DISCIPLINE;

          return (
            <motion.button
              key={window.id}
              onClick={() => onSelect?.(window.id)}
              whileHover={{ y: -3 }}
              className={`
                snap-start flex flex-col justify-between w-56 h-32 p-4 rounded-2xl border shadow-sm transition-all
                ${cfg.bg} ${cfg.border}
                ${isActive ? "ring-2 ring-amber-500 border-amber-400" : "hover:border-amber-300"}
              `}
            >
              <div>
                <p className="text-[9px] font-bold text-amber-700/50 uppercase tracking-widest mb-1">
                  {format(new Date(window.startDate), "MMM d")} — {format(new Date(window.endDate), "MMM d")}
                </p>
                <h4 className="text-sm font-semibold text-amber-900 text-left leading-snug">{window.title}</h4>
              </div>

              <div className="flex justify-between items-end">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-2.5 rounded-full ${i < window.intensity / 2 ? "bg-amber-500" : "bg-amber-100"}`}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
