"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, AlertTriangle, Compass, History } from "lucide-react";

interface DashaTimelineViewProps {
  temporal: any;
  narrative: string;
  insights: any;
  guidance: any;
}

function PunditNarrative({ narrative }: { narrative: string }) {
  const parts = narrative.split("\n\n").filter(p => p.trim() !== "");
  return (
    <div className="space-y-5">
      {parts.map((part, i) => {
        if (i === 0) return (
          <p key={i} className="text-xl font-serif font-medium text-amber-900 border-l-4 border-amber-500 pl-5 py-1 leading-snug">
            {part}
          </p>
        );
        if (i === parts.length - 1) return (
          <p key={i} className="text-sm font-bold text-amber-600 border-t border-amber-100 pt-4 tracking-wide">
            {part}
          </p>
        );
        return (
          <p key={i} className="text-sm text-amber-800/60 font-light leading-relaxed whitespace-pre-wrap pl-5">
            {part}
          </p>
        );
      })}
    </div>
  );
}

export default function DashaTimelineView({ temporal, narrative, insights, guidance }: DashaTimelineViewProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* Hero Summary Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#F1E7D0] shadow-sm p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/60 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none" />
        <div className="absolute top-6 right-6">
          <div className="bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
              {temporal.timing.pressure} Pressure Phase
            </span>
          </div>
        </div>

        <div className="space-y-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700/60">Active Dasha Profile</h3>
          </div>

          <div className="flex flex-wrap items-end gap-6 font-serif">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-700/40">Mahadasha</p>
              <h4 className="text-4xl md:text-5xl text-amber-900 font-semibold">{temporal.stack.mahadasha}</h4>
            </div>
            <span className="text-3xl text-amber-300 pb-1">/</span>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-700/40">Sub-phase</p>
              <h4 className="text-4xl md:text-5xl text-amber-600 font-light">{temporal.stack.antardasha}</h4>
            </div>
            {temporal.stack.pratyantar && (
              <>
                <span className="text-3xl text-amber-300 pb-1">/</span>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-amber-700/40">Clarity Focus</p>
                  <h4 className="text-4xl md:text-5xl text-amber-400/70 font-light">{temporal.stack.pratyantar}</h4>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#F1E7D0]">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-700/40">Dominant Force</p>
              <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {temporal.stack.mahadasha}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-700/40">Clarity Level</p>
              <p className="text-sm font-medium text-amber-700">High Resolution</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-amber-700/40">Remaining Time</p>
              <p className="text-sm font-medium text-amber-900">Ends in {temporal.timing.remaining}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Narrative */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-amber-700/50">The Reading</h3>
            </div>
            <PunditNarrative narrative={narrative} />
          </div>

          {/* Expandable Why */}
          <div className="bg-white border border-[#F1E7D0] rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="w-full flex items-center justify-between p-5 hover:bg-amber-50 transition-all"
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700/60">
                Why does this phase feel this way?
              </span>
              <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${showExplainer ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showExplainer && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-sm text-amber-800/60 font-light leading-relaxed border-t border-[#F1E7D0]">
                    This phase combines Jupiter's expansion energy with Saturn's discipline—pushing growth, but only through consistent, patient effort. The combination creates productive tension that ultimately builds lasting foundations.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Insights & Guidance */}
        <div className="lg:col-span-5 space-y-6">

          {/* Current Reality */}
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-amber-700/50">Current Reality</h4>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 leading-relaxed">{insights.primary}</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600 mb-2">What to Watch</p>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500/60 mt-0.5 shrink-0" />
                <p className="text-sm text-orange-800/70 leading-relaxed">{insights.caution}</p>
              </div>
            </div>
          </div>

          {/* Guidance */}
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-amber-700/50">The Path Forward</h4>
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Do More Of</span>
              </div>
              <ul className="space-y-2">
                {guidance.do.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-emerald-800/70 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Practice Restraint</span>
              </div>
              <ul className="space-y-2">
                {guidance.avoid.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-rose-800/70 flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next Phase Shift */}
      <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-amber-700/50 mb-4">Next Phase Shift</h4>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-sm text-amber-800/70 leading-relaxed max-w-lg">
            The next phase reduces pressure and allows faster movement with clearer decisions. What you build now determines how fast you move next.
          </p>
          <p className="text-[11px] font-mono text-amber-600 whitespace-nowrap">
            Starts {new Date(temporal.timing.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
          <div className="h-full w-[40%] bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
        </div>
        <p className="text-[10px] text-amber-600/50 mt-1">40% through current Antardasha</p>
      </div>
    </div>
  );
}
