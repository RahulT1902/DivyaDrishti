"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KundaliChart from "./KundaliChart";
import { PlanetMeaningModal } from "./PlanetMeaningModal";
import { 
  History, 
  Zap, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Wallet,
  Heart,
  Compass,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Info,
  ChevronDown,
  LayoutGrid,
  Target,
  ArrowUpRight,
  MinusCircle,
  Lightbulb,
  Brain,
  AlertCircle,
  XCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { KundaliReport, Intent, DeepInsight, Phase } from "../lib/intelligence/types";

interface KundaliModuleProps {
  chart: any;
  temporal: any;
  report: KundaliReport;
  intent?: Intent;
}

export default function KundaliModule({ chart, temporal, report, intent = "general" }: KundaliModuleProps) {
  const [activeTab, setActiveTab] = useState("guidance");
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  console.log("DEBUG: KundaliModule report prop:", report);

  if (!report) {
    return (
      <div className="p-12 rounded-[3.5rem] bg-amber-500/5 border border-amber-500/10 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Compass className="w-8 h-8 text-amber-600/40 animate-spin-slow" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-black/80">Guidance Unreachable</h3>
          <p className="text-xs text-black/40 max-w-xs mx-auto italic font-medium">The celestial patterns are resolving. This section will appear shortly once alignment is established.</p>
        </div>
      </div>
    );
  }

  // 🧭 UX Hardening: Auto-Tab & Auto-Expansion Synchronization
  useEffect(() => {
    if (intent && intent !== "general") {
      setActiveTab("guidance");
      setHighlightedCard(intent);
      
      // If the intent has deep intelligence, we can auto-expand it or just highlight
      // For now, let's just highlight to avoid jarring layout jumps unless user clicks
      const timer = setTimeout(() => setHighlightedCard(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [intent]);

  const tiers = [
    { id: "guidance", label: "Margdarshan Guidance", icon: Compass, tier: 1 },
    { id: "timeline", label: "Pravāh Timeline", icon: History, tier: 2 },
    { id: "nature", label: "Inner Nature", icon: Sparkles, tier: 2 },
    { id: "research", label: "Deep Research (Charts)", icon: LayoutGrid, tier: 3 },
  ];

  const handlePlanetClick = (planet: any) => {
    const house = ((planet.sign - chart.lagna.sign + 12) % 12) + 1;
    setSelectedPlanet({
      ...planet,
      sign: getSignName(planet.sign),
      house,
      meaning: `This placement shapes your ${planet.role} energy in the field of ${getSignName(planet.sign)}.`,
      challenge: "Awareness of this force prevents reactive choices.",
      guidance: "Align with the functional strength of this placement."
    });
    setIsPanelOpen(true);
  };

  return (
    <div className="space-y-12">
      {/* 🌅 TIER 1: HERO DECISION STATE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card bg-white border-black/[0.03] shadow-sm relative overflow-hidden"
      >
        <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />
        <div className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row gap-10 items-start md:items-center">
          <div className="flex flex-col gap-4 shrink-0">
             <div className={`px-6 py-2.5 rounded-full text-[13px] font-black tracking-[0.2em] uppercase border flex items-center gap-3 ${
                report?.hero?.decisionState === 'ACT' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10' :
                report?.hero?.decisionState === 'WAIT' ? 'bg-amber-500/5 text-amber-600 border-amber-500/10' :
                'bg-black/5 text-black/40 border-black/10'
             }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                   report?.hero?.decisionState === 'ACT' ? 'bg-emerald-500' :
                   report?.hero?.decisionState === 'WAIT' ? 'bg-amber-500' : 'bg-black/40'
                }`} />
                {report?.hero?.decisionState || "OBSERVE"} MODE
             </div>
             <p className="text-[11px] uppercase tracking-widest text-black/30 font-bold ml-1">{report?.hero?.timeAnchor || "Current Window"}</p>
          </div>

          <div className="flex-1 space-y-4">
             <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight leading-tight italic">
                “{report?.hero?.insight || "Clarity is forming in the current cycle."}”
             </h2>
             
             <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setShowWhy(!showWhy);
                    const current = parseInt(localStorage.getItem("whyEngagementScore") || "0");
                    localStorage.setItem("whyEngagementScore", Math.min(current + 1, 5).toString());
                  }}
                  className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-black transition-all w-fit group ${
                    parseInt(typeof window !== 'undefined' ? localStorage.getItem("whyEngagementScore") || "10" : "10") < 3 
                      ? "text-black/10 scale-95 opacity-50" 
                      : "text-black/30 hover:text-amber-600" 
                  }`}
                >
                  <Info className="w-3 h-3 transition-transform group-hover:scale-110" />
                  Why this insight?
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showWhy ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showWhy && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[13px] text-black/50 font-medium leading-relaxed max-w-2xl border-l-2 border-amber-500/20 pl-4 py-1">
                        {report?.hero?.why}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </motion.div>

      {/* 🧭 NAVIGATION & TIERED VIEW */}
      <div className="space-y-10">
        {!expandedCard && (
          <div className="flex border-b border-black/[0.03] overflow-x-auto no-scrollbar relative z-10 glass-card bg-white/50 py-1">
            {tiers.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all shrink-0 border-b-2 ${
                  activeTab === tab.id 
                    ? "border-amber-500 text-amber-600 bg-amber-500/[0.03]" 
                    : "border-transparent text-black/20 hover:text-black/60"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.tier === 1 && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded ml-1">KEY</span>}
              </button>
            ))}
          </div>
        )}

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* 🔴 DEEP INTELLIGENCE EXPANDED VIEW */}
            {expandedCard ? (
              <motion.div 
                key={`expanded-${expandedCard}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                 <button 
                   onClick={() => setExpandedCard(null)}
                   className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-black text-black/30 hover:text-black transition-all group"
                 >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    Back to Guidance Grid
                 </button>

                 <DeepReportView area={expandedCard} report={report} temporal={temporal} />
              </motion.div>
            ) : activeTab === "guidance" && (
              <motion.div 
                key="guidance" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                 {Object.entries(report?.lifeAreas || {}).map(([key, area]: any, i: number) => (
                   <motion.div 
                     id={`guidance-${key}`}
                     key={key}
                     layoutId={`card-${key}`}
                     onClick={() => area.deepIntelligence && setExpandedCard(key)}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: highlightedCard === key ? 1.02 : 1,
                        borderColor: highlightedCard === key ? "rgba(245, 158, 11, 0.4)" : "rgba(0, 0, 0, 0.03)",
                        boxShadow: highlightedCard === key ? "0 20px 40px rgba(245, 158, 11, 0.08)" : "none"
                     }}
                     transition={{ 
                        delay: 0.1 + i * 0.08,
                        scale: { type: "spring", stiffness: 300, damping: 20 }
                     }}
                     className={`p-10 rounded-[3rem] bg-white border transition-all flex flex-col justify-between space-y-10 group relative ${area.deepIntelligence ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'}`}
                   >
                     {highlightedCard === key && (
                        <motion.div 
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="absolute -top-4 left-10 px-4 py-1.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20 z-10"
                        >
                           <span className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                              <Compass className="w-3 h-3" /> Selected Clarity Scope
                           </span>
                        </motion.div>
                     )}

                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex flex-col gap-1">
                              <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-amber-600/60 transition-colors uppercase">
                                 {key} Guidance
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                  area.weight === 'foundation' ? 'bg-emerald-500/10 text-emerald-700' :
                                  area.weight === 'active' ? 'bg-amber-500/10 text-amber-700' :
                                  'bg-rose-500/10 text-rose-700'
                                }`}>
                                   {area.weight === 'foundation' ? '🟢 Foundation' : 
                                    area.weight === 'active' ? '🟡 Active Influence' : '🔴 Immediate Challenge'}
                                </span>
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-2xl bg-black/[0.02] flex items-center justify-center border border-black/[0.05]">
                              {key === 'career' ? <Briefcase className="w-4 h-4 text-black/20" /> :
                               key === 'finance' ? <Wallet className="w-4 h-4 text-black/20" /> :
                               key === 'relationships' ? <Heart className="w-4 h-4 text-black/20" /> :
                               <Sparkles className="w-4 h-4 text-black/20" />}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h3 className="text-xl font-bold text-black tracking-tight leading-tight italic">“{area.insight}”</h3>
                           <p className="text-[13px] text-black/50 leading-relaxed font-bold tracking-tight">{area.meaning}</p>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-6 border-t border-black/[0.02]">
                        <div className="space-y-1">
                           <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold">Actions for current cycle</p>
                           <div className="flex gap-2">
                             {area.guidance.slice(0, 1).map((g: string, j: number) => (
                               <div key={j} className="flex gap-2 items-center">
                                  <ArrowRight className="w-3 h-3 text-amber-500/40" />
                                  <p className="text-[10px] text-black/80 font-bold">{g}</p>
                               </div>
                             ))}
                           </div>
                        </div>
                        {area.deepIntelligence && (
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/10 group-hover:bg-amber-500 group-hover:text-white transition-all">
                             Read Full Report <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                     </div>
                   </motion.div>
                 ))}
              </motion.div>
            )}

            {/* Other tabs remain same... */}
            {activeTab === "timeline" && <div className="p-20 text-center text-black/20 italic">Pravāh Timeline Content...</div>}
          </AnimatePresence>
        </div>
      </div>

      <PlanetMeaningModal 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        planet={selectedPlanet} 
      />
    </div>
  );
}


// --- Deep Intelligence View Component ---

function DeepReportView({ area, report, temporal }: { area: string, report: KundaliReport, temporal: any }) {
  const data = (report?.lifeAreas as any)?.[area]?.deepIntelligence as DeepInsight;
  if (!data) return <div className="text-black/30 italic">No deep intelligence available for this horizon.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
       {/* 🧩 Left: Dasha & Context Rails */}
       <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-10 bg-amber-500/[0.02] border-amber-500/10 space-y-8">
             <div className="flex items-center gap-3 text-amber-700">
                <History className="w-4 h-4" />
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-black">Active Dasha Context</h4>
             </div>
             <div className="space-y-6">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] uppercase tracking-widest text-black/30 font-bold">Mahadasha</span>
                   <span className="text-xl font-bold text-black tracking-tight">{data.dashaContext.mahadasha}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] uppercase tracking-widest text-black/30 font-bold">Antardasha</span>
                   <span className="text-2xl font-black text-black tracking-tighter uppercase">{data.dashaContext.antardasha}</span>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                   <span className="text-[9px] uppercase tracking-widest text-amber-700 font-black flex items-center gap-2">
                       Pratyantar <Target className="w-3 h-3" />
                   </span>
                   <span className="text-lg font-bold text-amber-700">{data.dashaContext.pratyantar}</span>
                </div>
             </div>
          </div>

          <div className="glass-card p-10 bg-white border-black/[0.03] space-y-6">
             <div className="flex items-center gap-3 text-black/30">
                <LayoutGrid className="w-4 h-4" />
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-black/20">Transit Anchors</h4>
             </div>
             <div className="space-y-4">
                {data.dashaContext.transitAnchors.map((anchor, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                     <div className="w-1.5 h-1.5 rounded-full bg-black/10 mt-1.5 group-hover:bg-amber-500 transition-colors" />
                     <span className="text-[12px] text-black/60 font-medium leading-tight">{anchor}</span>
                  </div>
                ))}
             </div>
          </div>
       </div>

       {/* 📜 Right: High-Fidelity Narrative Report */}
       <div className="lg:col-span-8 space-y-16 pb-20">
          <header className="space-y-10">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${report.hero.decisionState === 'ACT' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <h3 className="text-[11px] uppercase tracking-[0.5em] font-black text-black/40 italic">🎯 {area.toUpperCase()} INTELLIGENCE REPORT</h3>
             </div>
             
             <div className="space-y-10">
                <h1 className="text-5xl md:text-6xl font-bold text-black tracking-tighter leading-[0.85] italic">
                   “{data.bigPicture}”
                </h1>

                {/* Thematic Focusing Banner */}
                <div className="p-10 rounded-[3rem] bg-black text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-700">
                   <div className="absolute inset-0 paper-texture opacity-20 pointer-events-none" />
                   <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                   
                   <div className="relative z-10 space-y-8">
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase tracking-[0.6em] font-black text-amber-500">🔴 Overall Theme</h4>
                        <p className="text-2xl font-bold tracking-tight italic">“{data.themeBanner.title}”</p>
                        <p className="text-sm text-white/40 font-medium">{data.themeBanner.subtitle}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                         {data.themeBanner.focusPoints.map((point, i) => (
                           <div key={i} className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span className="text-[11px] uppercase tracking-widest font-black text-white/60">{point}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </header>

          <div className="w-full h-[1px] bg-black/[0.03]" />

          {/* 💰 Categorized Insights (Straight Talk Cards) */}
          <section className="space-y-10">
             <div className="flex items-center gap-3 text-black/20">
                <LayoutGrid className="w-4 h-4" />
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-black italic">Strategic Insight Breakdown</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.categorizedInsights.map((insight, i) => (
                  <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-black/[0.03] shadow-sm space-y-6 hover:shadow-xl transition-all group">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                              insight.type === 'positive' ? 'bg-emerald-500/5 text-emerald-600' :
                              insight.type === 'risk' ? 'bg-amber-500/5 text-amber-600' :
                              'bg-black/5 text-black/40'
                           }`}>
                              {insight.label === 'Income & Gains' ? <Wallet className="w-5 h-5" /> : 
                               insight.label === 'Decision Quality' ? <Brain className="w-5 h-5" /> :
                               insight.label === 'Behavioral Impact' ? <TrendingUp className="w-5 h-5" /> :
                               <AlertCircle className="w-5 h-5" />}
                           </div>
                           <h4 className="text-[13px] font-black uppercase tracking-widest text-black/80">{insight.label}</h4>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-black/20">{insight.title}</p>
                        <div className="space-y-3">
                           {insight.points.map((p, j) => (
                             <div key={j} className="flex gap-3 items-start">
                                <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-black/10 group-hover:text-amber-500 transition-colors" />
                                <span className="text-[13px] text-black/60 font-bold leading-snug tracking-tight">{p}</span>
                             </div>
                           ))}
                        </div>
                     </div>

                     {insight.netEffect && (
                        <div className={`mt-6 p-4 rounded-2xl border-l-4 ${
                           insight.type === 'positive' ? 'bg-emerald-500/[0.02] border-emerald-500 text-emerald-800/60' :
                           insight.type === 'risk' ? 'bg-amber-500/[0.02] border-amber-500 text-amber-800/60' :
                           'bg-black/[0.01] border-black/10 text-black/40'
                        }`}>
                           <p className="text-[11px] font-bold italic">👉 {insight.netEffect}</p>
                        </div>
                     )}
                  </div>
                ))}
             </div>
          </section>

          <div className="w-full h-[1px] bg-black/[0.03]" />

          {/* 📅 Phased Chronicle (Specific Timing Window) */}
          <section className="space-y-10">
             <div className="flex items-center gap-3 text-black/20">
                <History className="w-4 h-4" />
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-black italic">Weekly Phased Guidance</h4>
             </div>
             
             <div className="space-y-10">
                {data.phases.map((phase, i) => (
                   <div key={i} className="flex gap-10">
                      <div className="shrink-0 w-16 pt-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-black/20 transform -rotate-90 block origin-left translate-x-4">
                           {phase.period}
                         </span>
                      </div>
                      <div className="flex-1 space-y-6 pb-12 border-l border-black/[0.03] pl-10 relative">
                         <div className="absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full bg-white border-2 border-black/10" />
                         <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-black tracking-tighter">{phase.title}</h4>
                            <p className="text-xs text-black/30 font-medium italic">{phase.astroReason}</p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {phase.detailBullets?.map((bullet, j) => (
                               <div key={j} className="flex items-center gap-3 p-4 bg-black/[0.01] rounded-2xl border border-black/[0.03]">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                                  <span className="text-[12px] font-bold text-black/60 tracking-tight">{bullet}</span>
                               </div>
                            ))}
                         </div>
                         <div className="flex items-center gap-2 text-emerald-600/60">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-widest font-black">Verdict: {phase.verdict}</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </section>

          <div className="w-full h-[1px] bg-black/[0.03]" />

          {/* 🧭 Verdict Matrix (Favor vs Avoid) */}
          <section className="space-y-10">
             <div className="flex items-center gap-3 text-black/20">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-black italic">Final Strategic Verdict</h4>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-[3rem] bg-amber-500/5 border border-amber-500/10 space-y-6">
                   <div className="flex items-baseline justify-between">
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-amber-700">❌ Avoid</h5>
                      <XCircle className="w-4 h-4 text-amber-500/40" />
                   </div>
                   <div className="space-y-3">
                      {data.verdictMatrix.avoid.map((item, i) => (
                        <p key={i} className="text-[13px] font-bold text-black/70 italic tracking-tight underline decoration-amber-500/20 underline-offset-4">{item}</p>
                      ))}
                   </div>
                </div>

                <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 space-y-6">
                   <div className="flex items-baseline justify-between">
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-emerald-700">✅ Favor</h5>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500/40" />
                   </div>
                   <div className="space-y-3">
                      {data.verdictMatrix.favor.map((item, i) => (
                        <p key={i} className="text-[13px] font-bold text-black/70 italic tracking-tight underline decoration-emerald-500/20 underline-offset-4">{item}</p>
                      ))}
                   </div>
                </div>

                <div className="p-8 rounded-[3rem] bg-black/[0.02] border border-black/[0.05] space-y-6">
                   <div className="flex items-baseline justify-between">
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-black/60">⚠️ Be Careful</h5>
                      <AlertTriangle className="w-4 h-4 text-black/20" />
                   </div>
                   <div className="space-y-3">
                      {data.verdictMatrix.caution.map((item, i) => (
                        <p key={i} className="text-[13px] font-bold text-black/40 italic tracking-tight">{item}</p>
                      ))}
                   </div>
                </div>
             </div>
          </section>

          {/* 🧠 Straight Talk Banner */}
          <footer className="p-12 md:p-16 rounded-[4rem] bg-black text-white relative overflow-hidden group">
             <div className="absolute inset-0 paper-texture opacity-10 pointer-events-none" />
             <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
             
             <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-4 text-amber-500">
                   <Lightbulb className="w-6 h-6" />
                   <h4 className="text-[11px] uppercase tracking-[0.6em] font-black">🧠 Straight Talk (Based on Your Chart)</h4>
                </div>
                
                <p className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight italic">
                   “{data.straightTalk}”
                </p>

                <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                   <ShieldCheck className="w-5 h-5 text-amber-500" />
                   <p className="text-sm font-bold text-white/60 tracking-tight">Final Verdict: {data.verdict}</p>
                </div>
             </div>
          </footer>
       </div>
    </div>
  );
}

function getSignName(sign: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}
