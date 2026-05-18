import React from "react";
import { motion } from "framer-motion";
import { DashboardUIState } from "../../lib/dashboard/dashboardStateComposer";
import ExecutionModeBadge, { ExecutionMode } from "./ExecutionModeBadge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  state: DashboardUIState;
}

export default function CurrentPhaseHero({ state }: Props) {
  const { currentPhase, lifeScores } = state;
  const safeStability = isNaN(lifeScores.stability) ? 50 : Math.round(lifeScores.stability);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#F1E7D0] rounded-2xl p-8 shadow-sm relative overflow-hidden"
    >
      {/* Subtle warm glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/60 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8 relative">
        <div>
          <p className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mb-2">Current Planetary Phase</p>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-amber-900 mb-1 leading-tight">
            {currentPhase.title.split(":")[0]}
            {currentPhase.title.includes(":") && (
              <>
                :{" "}
                <span className="text-amber-600">
                  {currentPhase.title.split(":")[1]}
                </span>
              </>
            )}
          </h2>
          <p className="text-amber-800/50 max-w-xl text-sm leading-relaxed">
            {currentPhase.summary}
          </p>
        </div>

        <ExecutionModeBadge mode={currentPhase.executionMode as ExecutionMode} />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {/* Focus Areas */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Focus Areas
          </h4>
          <ul className="space-y-2">
            {currentPhase.focus.map((item, i) => (
              <li key={i} className="text-sm text-amber-900/70 flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas of Caution */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Areas of Caution
          </h4>
          <ul className="space-y-2">
            {currentPhase.avoid.map((item, i) => (
              <li key={i} className="text-sm text-amber-900/70 flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Emotional Balance */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <h4 className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest mb-3">Emotional Balance</h4>
          <p className="text-lg font-serif font-semibold text-amber-900 mb-3">{currentPhase.dominantTone}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${safeStability}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
              />
            </div>
            <span className="text-[10px] text-amber-700/50 font-bold whitespace-nowrap">
              Resilience: {Math.round(safeStability / 10)}/10
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
