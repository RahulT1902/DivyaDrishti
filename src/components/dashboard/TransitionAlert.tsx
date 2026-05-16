import React from "react";
import { motion } from "framer-motion";
import { Timer, ArrowRight } from "lucide-react";

interface Props {
  daysRemaining: number;
  from: string;
  to: string;
  intensity: number;
}

export default function TransitionAlert({ daysRemaining, from, to, intensity }: Props) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Timer className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Upcoming Energetic Shift</h4>
          <p className="text-xs text-slate-400">
            Transitioning from <span className="text-slate-200">{from}</span> to <span className="text-indigo-300 font-bold">{to}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Countdown</p>
          <p className="text-2xl font-bold text-white">{daysRemaining} <span className="text-xs font-normal opacity-50">Days</span></p>
        </div>
        
        <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Next Intensity</p>
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-1 h-3 rounded-full ${i < intensity / 2 ? 'bg-indigo-400' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
