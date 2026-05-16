import React from "react";
import { motion } from "framer-motion";
import { LifeState } from "../../lib/intelligence/contracts/lifeState";
import ExecutionModeBadge, { ExecutionMode } from "./ExecutionModeBadge";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface Props {
  lifeState: LifeState;
}

export default function CurrentPhaseHero({ lifeState }: Props) {
  const { overallState, behavioralGuidance, emotionalState } = lifeState;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Life Phase</p>
          <h2 className="text-3xl font-light text-white mb-1">
            {overallState.title.split(":")[0]}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {overallState.title.split(":")[1]}
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            {overallState.summary}
          </p>
        </div>
        
        <ExecutionModeBadge mode={lifeState.metadata.dominantPlanetaryDrivers.includes("Saturn") ? "ARCHITECT" : "WARRIOR" as ExecutionMode} />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Strategic Focus */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Strategic Focus
          </h4>
          <ul className="space-y-2">
            {behavioralGuidance.recommendedBehaviors.map((item, i) => (
              <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Cautionary Areas */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Avoid Now
          </h4>
          <ul className="space-y-2">
            {behavioralGuidance.avoidBehaviors.map((item, i) => (
              <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 rounded-full bg-rose-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Resilience Metric */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Internal State</h4>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-bold text-white">{emotionalState.dominantTone}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${emotionalState.resilienceScore * 10}%` }}
                  className="h-full bg-blue-500"
                />
             </div>
             <span className="text-[10px] text-slate-500 font-bold">Resilience: {emotionalState.resilienceScore}/10</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
