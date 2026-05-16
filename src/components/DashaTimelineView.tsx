"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Info, AlertTriangle, CheckCircle2, Compass } from "lucide-react";

interface DashaTimelineViewProps {
  temporal: any;
  narrative: string;
  insights: any;
  guidance: any;
}

// --- PunditNarrative: 7-Layer Visual Renderer ---
function PunditNarrative({ narrative }: { narrative: string }) {
  const parts = narrative.split("\n\n").filter(p => p.trim() !== "");

  const LAYER_STYLES = [
    // Layer 1: Statement — Large, authoritative
    "text-xl font-serif font-medium text-white leading-snug border-l-4 border-amber-500 pl-6 py-1",
    // Layer 2: Mirror — Warm, personal
    "text-base text-amber-100/80 font-light leading-relaxed pl-6 italic",
    // Layer 3: Emotional Truth — Softer, validating
    "text-sm text-indigo-200/60 italic font-light leading-relaxed pl-6",
    // Layer 4: Tension & Signature Punch — Highlighted, stark
    "text-base text-rose-200/80 font-medium leading-relaxed border-l-2 border-rose-500/50 pl-6",
    // Layer 5: Bridge & Guidance — Confident, clean
    "text-sm text-emerald-100/70 leading-relaxed pl-6 bg-emerald-500/5 p-4 rounded-xl",
    // Layer 6: Verdict — Bold, conclusive
    "text-sm font-bold text-amber-400 border-t border-indigo-500/10 pt-6 pl-6 mt-2",
  ];

  return (
    <div className="space-y-5">
      {parts.map((part, i) => (
        <p key={i} className={`${LAYER_STYLES[i] || "text-sm text-indigo-100/60 pl-6"} animate-in fade-in slide-in-from-bottom-2 duration-700 whitespace-pre-wrap`}
           style={{ animationDelay: `${i * 100}ms` }}>
          {part}
        </p>
      ))}
    </div>
  );
}
export default function DashaTimelineView({ temporal, narrative, insights, guidance }: DashaTimelineViewProps) {
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-6 animate-in fade-in duration-700">
      
      {/* 1. Hero Summary Panel */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950/40 border border-indigo-500/20 backdrop-blur-2xl p-10 shadow-2xl">
        <div className="absolute top-0 right-0 p-8">
           <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1 rounded-full">
             <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">
                {temporal.timing.pressure} Pressure Phase
             </span>
           </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
               <Compass className="w-5 h-5 text-white" />
             </div>
             <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-300/80">Active Phase Profile</h3>
          </div>

          <div className="flex flex-wrap items-end gap-6 font-serif">
             <div className="space-y-1">
               <p className="text-[10px] uppercase tracking-widest text-indigo-500/50">Mahadasha</p>
               <h4 className="text-5xl text-white">{temporal.stack.mahadasha}</h4>
             </div>
             <span className="text-4xl text-indigo-500/30 pb-1">/</span>
             <div className="space-y-1">
               <p className="text-[10px] uppercase tracking-widest text-indigo-500/50">Sub-phase</p>
               <h4 className="text-5xl text-indigo-300">{temporal.stack.antardasha}</h4>
             </div>
             {temporal.stack.pratyantar && (
               <>
                 <span className="text-4xl text-indigo-500/30 pb-1">/</span>
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-widest text-indigo-500/50">Clarity Focus</p>
                   <h4 className="text-5xl text-indigo-400/60">{temporal.stack.pratyantar}</h4>
                 </div>
               </>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-indigo-500/10">
             <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400/40">Dominant Force</p>
                <p className="text-sm font-medium text-indigo-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {temporal.stack.mahadasha}
                </p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400/40">Clarity Level</p>
                <p className="text-sm font-medium text-amber-200">High Resolution</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400/40">Time Perspective</p>
                <p className="text-sm font-medium text-indigo-100">
                  Ends in {temporal.timing.remaining}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* 2. Narrative Engine Rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: 7-Layer Pundit Narrative */}
        <div className="lg:col-span-7 space-y-8">
           <div className="space-y-6">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400/60 pl-2">The Reading</h3>
              <PunditNarrative narrative={narrative} />
           </div>

           {/* Expandable Why Section */}
           <div className="rounded-2xl border border-indigo-500/10 bg-indigo-950/20 overflow-hidden">
             <button 
               onClick={() => setShowExplainer(!showExplainer)}
               className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
             >
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Why this phase feels this way?</span>
               </div>
               <ChevronRight className={`w-4 h-4 text-indigo-500 transition-transform ${showExplainer ? 'rotate-90' : ''}`} />
             </button>
             <AnimatePresence>
               {showExplainer && (
                 <motion.div 
                   initial={{ height: 0 }} 
                   animate={{ height: 'auto' }} 
                   exit={{ height: 0 }}
                   className="overflow-hidden"
                 >
                   <div className="p-6 pt-0 text-sm text-indigo-100/60 font-light leading-relaxed border-t border-indigo-500/5 mt-4">
                      <p>
                        This phase combines expansion with restriction—pushing growth, but only through discipline and correction.
                      </p>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>

        {/* Right: Insights & Guidance */}
        <div className="lg:col-span-5 space-y-8">
           
           {/* Insight Ranking */}
           <div className="space-y-4">
             <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400/60 pl-2">Current Reality</h4>
             <div className="space-y-3">
                <div className="p-5 rounded-[2rem] bg-amber-500/5 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-100 leading-relaxed">{insights.primary}</p>
                </div>
                <div className="p-5 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/10">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-2">What to Watch</p>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500/60 mt-0.5" />
                    <p className="text-sm text-indigo-100/70 leading-relaxed">{insights.caution}</p>
                  </div>
                </div>
             </div>
           </div>

           {/* Behavioral Guidance */}
           <div className="space-y-4">
             <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400/60 pl-2">The Path Forward</h4>
             <div className="grid grid-cols-1 gap-3">
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20">
                   <div className="flex items-center gap-2 mb-4">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Active Alignment</span>
                   </div>
                   <ul className="space-y-3">
                      {guidance.do.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-emerald-50/80 flex items-start gap-2">
                          <span className="text-emerald-500/40">•</span> {item}
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20">
                   <div className="flex items-center gap-2 mb-4">
                     <AlertTriangle className="w-4 h-4 text-rose-500" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Practice Restraint</span>
                   </div>
                   <ul className="space-y-3">
                      {guidance.avoid.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-rose-50/80 flex items-start gap-2">
                          <span className="text-rose-500/40">•</span> {item}
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
           </div>

        </div>
      </div>

      {/* 3. Transition Mapping (Now vs Next) */}
      <div className="pt-10 border-t border-indigo-500/10">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400/60 pl-2">Next Phase Shift</h4>
               <div className="p-8 rounded-[2rem] bg-indigo-950/30 border border-indigo-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Phase contrast</p>
                    <span className="text-[9px] font-mono text-indigo-500 uppercase">Starts {new Date(temporal.timing.endsAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-indigo-100 font-light leading-relaxed">
                    The next phase reduces pressure and allows faster movement with clearer decisions.
                  </p>
               </div>
            </div>
            
            <div className="space-y-4 flex flex-col justify-end">
               <div className="flex items-center gap-4 px-6 pt-4">
                  <div className="flex-1 h-1 rounded-full bg-indigo-950">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full" style={{ width: '40%' }} />
                  </div>
                  <span className="text-[10px] font-mono text-indigo-500 tracking-widest uppercase">Transition: 40% Complete</span>
               </div>
               <p className="text-[11px] text-indigo-100/40 font-serif italic text-right pr-6">
                 "What you build now determines how fast you move next."
               </p>
            </div>
         </div>
      </div>

    </div>
  );
}
