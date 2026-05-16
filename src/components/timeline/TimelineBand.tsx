import React from "react";
import { motion } from "framer-motion";
import { TimelineWindow } from "../../lib/intelligence/contracts/timelineState";
import { format } from "date-fns";

interface Props {
  windows: TimelineWindow[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  EXPANSION: "from-emerald-900/40 to-emerald-800/20 border-emerald-500/30",
  DISCIPLINE: "from-blue-900/40 to-blue-800/20 border-blue-500/30",
  VOLATILITY: "from-indigo-900/40 to-indigo-800/20 border-indigo-500/30",
  RECOVERY: "from-purple-900/40 to-purple-800/20 border-purple-500/30",
  TRANSFORMATION: "from-rose-900/40 to-rose-800/20 border-rose-500/30",
  VISIBILITY: "from-amber-900/40 to-amber-800/20 border-amber-500/30",
};

export default function TimelineBand({ windows, activeId, onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory py-4">
      <div className="flex gap-4 min-w-max px-8">
        {windows.map((window, idx) => {
          const isActive = window.id === activeId;
          const colorClass = categoryColors[window.category] || categoryColors.DISCIPLINE;
          
          return (
            <motion.button
              key={window.id}
              onClick={() => onSelect?.(window.id)}
              whileHover={{ y: -4 }}
              className={`
                snap-start flex flex-col justify-between w-64 h-32 p-4 rounded-2xl border backdrop-blur-md transition-all
                bg-gradient-to-br ${colorClass}
                ${isActive ? 'ring-2 ring-white/50 border-white/40' : 'border-slate-800 hover:border-slate-700'}
              `}
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {format(new Date(window.startDate), "MMM d")} — {format(new Date(window.endDate), "MMM d")}
                </p>
                <h4 className="text-sm font-semibold text-white truncate">{window.title}</h4>
              </div>
              
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-medium text-slate-300 bg-black/30 px-2 py-0.5 rounded-full">
                  {window.category}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-3 rounded-full ${i < window.intensity / 2 ? 'bg-white/60' : 'bg-white/10'}`} 
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
