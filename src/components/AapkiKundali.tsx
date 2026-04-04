"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Target, 
  Database, 
  Lock,
  Navigation,
  Box,
  Compass,
  FileText,
  Star
} from "lucide-react";
import KundaliChart from "./KundaliChart";
import PredictionPanel from "./PredictionPanel";
import { NatalChart } from "../lib/intelligence/types";

interface AapkiKundaliProps {
  chart: NatalChart;
  temporal: any;
  report: any;
  guidance?: any;
}

const planetAbbr: Record<string, string> = {
  Lagna: "La", Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
  Uranus: "Ur", Neptune: "Ne", Pluto: "Pl"
};

type ActiveView = "lagna" | "navamsha" | "shodashvarga" | "transit" | "dasha" | "predictions";

export default function AapkiKundali({ chart, temporal, report, guidance }: AapkiKundaliProps) {
  const [activeView, setActiveView] = useState<ActiveView>("lagna");

  const gridItems = [
    { id: "lagna", label: "Planet", icon: Sparkles, active: true },
    { id: "dasha", label: "Dasha", icon: Database, active: true },
    { id: "predictions", label: "Predictions", icon: Target, active: true },
    { id: "kp", label: "KP System", icon: Compass, active: false },
    { id: "shodashvarga", label: "Shodashvarga", icon: Box, active: true },
    { id: "lalkitab", label: "Lal Kitab", icon: Book, active: false },
    { id: "varshphal", label: "Varshphal", icon: FileText, active: false },
    { id: "rajyoga", label: "Raj Yoga", icon: Star, active: false },
    { id: "transit", label: "Transit", icon: Navigation, active: true },
  ];

  // Helper to format degrees into DMS
  const formatDMS = (value: number) => {
    const deg = Math.floor(value);
    const min = Math.floor((value % 1) * 60);
    const sec = Math.floor((((value % 1) * 60) % 1) * 60);
    return `${deg.toString().padStart(2, '0')}°${min.toString().padStart(2, '0')}'${sec.toString().padStart(2, '0')}"`;
  };

  const renderContent = () => {
    // Inject Lagna (La) into the rendering data
    const chartPlanets = [
      { name: "Lagna", sign: chart.lagna.sign, positionInSign: chart.lagna.positionInSign, degree: chart.lagna.degree },
      ...chart.planets
    ];

    switch (activeView) {
      case "lagna":
        return <KundaliChart variant="dark" lagnaSign={chart.lagna.sign} planets={chartPlanets} title="Lagna Chart" />;
      case "navamsha":
      case "shodashvarga":
        const d9Planets = chartPlanets.map(p => ({ ...p, sign: (p as any).navamsaSign || p.sign }));
        return <KundaliChart variant="dark" lagnaSign={chart.lagna.navamsaSign} planets={d9Planets} title="Navamsha Chart (D9)" />;
      case "transit":
        return <KundaliChart variant="dark" lagnaSign={chart.lagna.sign} planets={chartPlanets} title="Transit: Current Grahas" />;
      case "dasha":
        return (
          <div className="w-full max-w-md aspect-square flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 border-2 border-[#E6C200]/5 rounded-full animate-pulse" />
             <div className="relative z-10 flex flex-col items-center space-y-6 bg-black/40 p-12 rounded-full border border-[#E6C200]/20">
                <Database className="w-10 h-10 text-[#E6C200]/40" />
                <div className="text-center space-y-2">
                   <h4 className="text-[10px] text-[#E6C200]/60 font-black uppercase tracking-[0.4em]">Active Mahadasha</h4>
                   <p className="text-4xl font-light text-white tracking-tighter italic">{temporal.current.md.planet}</p>
                   <div className="flex items-center gap-4 pt-4">
                      <span className="text-[10px] text-white/40 font-mono tracking-widest">{temporal.current.md.start} — {temporal.current.md.end}</span>
                   </div>
                </div>
                <div className="pt-4 flex flex-col items-center gap-1">
                   <span className="text-[9px] text-[#E6C200]/40 uppercase tracking-[0.2em] font-black">Antardasha</span>
                   <span className="text-lg font-bold text-white/80">{temporal.current.ad.planet}</span>
                </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5] pb-20 px-4 md:px-10 flex flex-col items-center font-sans">
      
      {/* 1. Header Navigation */}
      <div className="w-full max-w-md py-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs uppercase tracking-widest">Basic</span>
            <span className="text-white text-xs font-bold uppercase tracking-widest border-b-2 border-white pb-1">Lagna</span>
            <span className="text-white/40 text-xs uppercase tracking-widest">Navamsha</span>
         </div>
         <div className="flex gap-4">
            <button className="bg-[#E6C200] text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#E6C200]/10">
               <Database className="w-3 h-3" /> Upgrade
            </button>
         </div>
      </div>

      {/* 2. Chat Input */}
      <div className="w-full max-w-md pb-6">
         <div className="relative group">
            <input 
               type="text" 
               placeholder={`Chat with ${activeView.charAt(0).toUpperCase() + activeView.slice(1)}`}
               className="w-full py-4 pl-6 pr-14 bg-[#111111] border border-white/10 rounded-full text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E6C200]/40 transition-all"
            />
            <button className="absolute right-2 top-2 w-10 h-10 bg-[#E6C200] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#E6C200]/20 hover:scale-105 active:scale-95 transition-all">
               <Navigation className="w-4 h-4 rotate-90" />
            </button>
         </div>
      </div>

      {/* 3. Main Display Area */}
      <div className="w-full flex flex-col items-center min-h-[440px]">
         <AnimatePresence mode="wait">
            <motion.div 
               key={activeView}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full flex justify-center"
            >
               {activeView === "predictions" ? (
                 <div className="w-full max-w-md space-y-4">
                    <KundaliChart variant="dark" lagnaSign={chart.lagna.sign} planets={[{name:"Lagna", ...chart.lagna}, ...chart.planets]} title="Birth Chart (Natal)" />
                    <div className="mt-8">
                       <PredictionPanel chart={chart} dasha={temporal.current} transits={null} guidance={guidance} />
                    </div>
                 </div>
               ) : renderContent()}
            </motion.div>
         </AnimatePresence>
      </div>

      {/* 4. Legend Grid - EXACTLY AS IMAGE */}
      {activeView !== "predictions" && activeView !== "dasha" && (
        <div className="w-full max-w-md grid grid-cols-3 gap-y-4 py-6 px-2 border-t border-white/5 mt-4">
           <div className="flex items-center gap-2 text-[11px] font-bold text-white whitespace-nowrap">
              <span className="text-[#E6C200] text-lg font-mono">*</span> Retrograde
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-white whitespace-nowrap">
              <span className="text-[#E6C200] text-lg font-mono">^</span> Combust
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-white whitespace-nowrap">
              <span className="text-[#E6C200] text-lg font-mono">□</span> Vargottama
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-white whitespace-nowrap">
              <span className="text-[#E6C200] text-lg font-mono">↑</span> Exalted
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-white whitespace-nowrap">
              <span className="text-[#E6C200] text-lg font-mono">↓</span> Debilitated
           </div>
        </div>
      )}

      {/* 5. 3x3 Grid Buttons */}
      <div className="w-full max-w-md pt-4 grid grid-cols-3 gap-2 px-2">
         {gridItems.map((item) => (
           <button
             key={item.id}
             onClick={() => item.active && setActiveView(item.id as ActiveView)}
             disabled={!item.active}
             className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                activeView === item.id 
                  ? 'bg-black border-[#E6C200]/40 text-[#E6C200]' 
                  : item.active 
                    ? 'bg-[#111111] border-white/5 text-white/40 hover:border-white/10' 
                    : 'bg-black/20 border-transparent text-white/5 opacity-50'
             }`}
           >
             <item.icon className={`w-4 h-4 ${activeView === item.id ? 'text-[#E6C200]' : 'text-white/20'}`} />
             <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
           </button>
         ))}
      </div>

      {/* 6. High-Fidelity Degrees Footer - EXACTLY AS IMAGE */}
      <div className="w-full max-w-md pt-12 px-2 pb-10">
         <div className="grid grid-cols-3 gap-x-4 gap-y-3 font-mono text-[11px] leading-tight">
            <div className="flex items-center gap-2 text-white">
               <span className="font-black">La</span> <span>{formatDMS(chart.lagna.positionInSign)}</span>
            </div>
            {chart.planets.map((p, i) => (
               <div key={i} className="flex items-center gap-2 text-white whitespace-nowrap">
                  <span className="font-black">{planetAbbr[p.name] || p.name.slice(0, 2)}</span> 
                  <span>{formatDMS(p.positionInSign)}</span>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
}

function Book({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

function getSignName(sign: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign - 1];
}
