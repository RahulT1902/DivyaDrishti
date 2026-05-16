"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompleteTransitReport, TransitIntelligence } from "@/lib/intelligence/transit/types";
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Target, 
  Activity, 
  Info, 
  Clock, 
  Crosshair 
} from "lucide-react";

export default function TransitAnalyzer({ transitData }: { transitData: CompleteTransitReport }) {
  if (!transitData || !transitData.transits) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Transit data is currently unavailable.
      </div>
    );
  }

  const { climate, transits } = transitData;
  
  const macroDrivers = transits.filter(t => t.tier === 1);
  const activeTriggers = transits.filter(t => t.tier === 2);
  const moodModifiers = transits.filter(t => t.tier === 3);

  return (
    <main className="min-h-screen text-white p-6 font-sans relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12 relative z-10 animate-in fade-in duration-1000 pb-20">
        
        {/* Section 1: Current Cosmic Climate */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              Current Cosmic Climate
            </h2>
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              Live Environmental Synthesis
            </div>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/20 backdrop-blur-xl">
            <h3 className="text-3xl font-light text-white leading-tight mb-6">
              {climate.headline}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-indigo-500/10">
              <ClimateMeter label="Structural Pressure" value={climate.netPressure} color="amber" />
              <ClimateMeter label="Growth Opportunity" value={climate.netOpportunity} color="emerald" />
              <ClimateMeter label="Environmental Volatility" value={climate.netVolatility} color="rose" />
            </div>
          </div>
        </section>

        {/* Section 2: Macro Drivers (Big Four) */}
        <section className="space-y-6">
          <h2 className="text-xl font-serif text-indigo-200">Tier 1: Macro Drivers</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {macroDrivers.map(transit => (
              <MacroDriverCard key={transit.planet} transit={transit} />
            ))}
          </div>
        </section>

        {/* Section 3: Transit Matrix */}
        <section className="space-y-6">
          <h2 className="text-xl font-serif text-indigo-200">Tier 2 & 3: Fast Triggers & Mood Modifiers</h2>
          <div className="bg-slate-900/40 border border-indigo-500/10 rounded-3xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-indigo-950/50 text-indigo-300">
                  <tr>
                    <th className="px-6 py-4 font-medium">Planet</th>
                    <th className="px-6 py-4 font-medium">Sign</th>
                    <th className="px-6 py-4 font-medium">Nature</th>
                    <th className="px-6 py-4 font-medium">Natal Houses (L/M)</th>
                    <th className="px-6 py-4 font-medium">Activation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-500/5">
                  {[...activeTriggers, ...moodModifiers].map(transit => (
                    <tr key={transit.planet} className="hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${transit.tier === 2 ? 'bg-orange-500' : 'bg-blue-400'}`} />
                          <span className="font-semibold text-white">{transit.planet}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-indigo-200">{transit.sign} ({transit.degree}°)</td>
                      <td className="px-6 py-4 text-indigo-200 capitalize">{transit.nature}</td>
                      <td className="px-6 py-4 text-indigo-200">{transit.houseFromLagna}th / {transit.houseFromMoon}th</td>
                      <td className="px-6 py-4">
                        {transit.activatedNatalPoints.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {transit.activatedNatalPoints.map((a, i) => (
                              <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded-md text-[10px]">
                                {a.type}: {a.planet}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function ClimateMeter({ label, value, color }: { label: string, value: number, color: 'amber' | 'emerald' | 'rose' }) {
  const bgColors = {
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs uppercase tracking-widest text-indigo-300">
        <span>{label}</span>
        <span className="font-mono text-white">{value}/10</span>
      </div>
      <div className="flex gap-1 h-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-sm ${i < value ? bgColors[color] : 'bg-slate-800'}`}
          />
        ))}
      </div>
    </div>
  );
}

function MacroDriverCard({ transit }: { transit: TransitIntelligence }) {
  const [expanded, setExpanded] = useState(false);

  const getThemeColors = (planet: string) => {
    switch (planet) {
      case "Saturn": return "from-slate-800 to-indigo-950 border-slate-700 text-slate-300";
      case "Jupiter": return "from-amber-900/40 to-orange-950/40 border-amber-500/30 text-amber-200";
      case "Rahu": return "from-purple-900/40 to-fuchsia-950/40 border-purple-500/30 text-purple-200";
      case "Ketu": return "from-zinc-800/80 to-slate-900/80 border-zinc-500/30 text-zinc-300";
      default: return "from-indigo-900/20 to-slate-900/20 border-indigo-500/20 text-indigo-200";
    }
  };

  const theme = getThemeColors(transit.planet);

  return (
    <div className={`rounded-3xl border bg-gradient-to-br backdrop-blur-xl overflow-hidden transition-all ${theme}`}>
      <div className="p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-3xl font-serif text-white">{transit.planet}</h3>
            <p className="text-sm opacity-70 mt-1">in {transit.sign} • {transit.houseFromLagna}th House</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-black/20 text-xs font-medium capitalize border border-white/10">
              {transit.nature}
            </span>
          </div>
        </div>

        {/* Intensity Meters */}
        <div className="space-y-3 bg-black/20 p-4 rounded-2xl">
          <IntensityBar label="Pressure" value={transit.intensity.pressure} color="bg-amber-500" icon={<AlertTriangle className="w-3 h-3" />} />
          <IntensityBar label="Opportunity" value={transit.intensity.opportunity} color="bg-emerald-500" icon={<Target className="w-3 h-3" />} />
          <IntensityBar label="Volatility" value={transit.intensity.volatility} color="bg-rose-500" icon={<Activity className="w-3 h-3" />} />
        </div>

        {/* Manifestations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">External Triggers</p>
            <ul className="space-y-1">
              {transit.manifestations.external.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="opacity-40 mt-1">•</span>
                  <span className="opacity-90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Internal State</p>
            <ul className="space-y-1">
              {transit.manifestations.internal.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="opacity-40 mt-1">•</span>
                  <span className="opacity-90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Expandable "Why This Matters" */}
        <div className="pt-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Why this matters
          </button>
          
          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  {transit.whyItMatters.map((reason, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                      <Info className="w-4 h-4 shrink-0 opacity-50 mt-0.5" />
                      <p className="text-sm opacity-80">{reason}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-4 opacity-60 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>This influence remains structurally active for the coming months.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

function IntensityBar({ label, value, color, icon }: { label: string, value: number, color: string, icon: React.ReactNode }) {
  // Use blocks instead of a continuous bar for the "intelligence dashboard" feel
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 flex items-center gap-1.5 opacity-70 text-xs uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="flex-1 flex gap-0.5 font-mono text-[10px] leading-none text-slate-500">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`${i < value ? 'text-white' : ''}`}>
            {i < value ? '█' : '░'}
          </span>
        ))}
      </div>
    </div>
  );
}
