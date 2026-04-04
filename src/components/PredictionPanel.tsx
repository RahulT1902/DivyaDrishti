"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Target, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  MessageSquare, 
  ArrowRight,
  Briefcase,
  Wallet,
  Heart,
  Activity,
  Plus
} from "lucide-react";
import ContextualChat from "./ContextualChat";
import { Intent, Timeframe } from "../lib/intelligence/types";

type ViewState = "period" | "category" | "result";

interface PredictionPanelProps {
  chart: any;
  dasha: any;
  transits: any;
  guidance?: any;
}

export default function PredictionPanel({ chart, dasha, transits, guidance }: PredictionPanelProps) {
  const [viewState, setViewState] = useState<ViewState>("period");
  const [period, setPeriod] = useState<Timeframe>("today");
  const [category, setCategory] = useState<Intent>("general");

  const periods: { id: Timeframe; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "this-week", label: "This Week" },
    { id: "this-month", label: "Monthly" },
    { id: "year", label: "Yearly" },
  ];

  const categories: { id: Intent; label: string; icon: any; sub: string }[] = [
    { id: "career", label: "Career", icon: Briefcase, sub: "Work & Ambition" },
    { id: "finance", label: "Finance", icon: Wallet, sub: "Wealth & Stability" },
    { id: "health", label: "Health", icon: Activity, sub: "Vitality & Energy" },
    { id: "general", label: "General", icon: Target, sub: "Overall Flow" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {viewState === "period" && (
          <motion.div 
            key="period"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Select Time Frame</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPeriod(p.id);
                    setViewState("category");
                  }}
                  className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group flex flex-col items-start gap-4"
                >
                  <span className="text-[10px] uppercase tracking-widest font-black text-white/20 group-hover:text-amber-500/60">Duration</span>
                  <span className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">{p.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {viewState === "category" && (
          <motion.div 
            key="category"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setViewState("period")}
              className="text-[10px] uppercase tracking-widest font-black text-white/20 hover:text-white transition-colors flex items-center gap-2"
            >
              ← Change Period ({period.toUpperCase()})
            </button>
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Choose Focus Area</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id);
                    setViewState("result");
                  }}
                  className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-amber-500/10 group-hover:border-amber-500/20">
                      <c.icon className="w-6 h-6 text-white/40 group-hover:text-amber-500" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-lg font-bold text-white group-hover:text-amber-500">{c.label}</span>
                      <span className="text-[10px] uppercase tracking-widest font-black text-white/20">{c.sub}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-amber-500 transform group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {viewState === "result" && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 w-full max-w-xl mx-auto"
          >
            <div className="flex items-center justify-between px-2">
              <button 
                onClick={() => setViewState("category")}
                className="text-[10px] uppercase tracking-widest font-black text-[#E6C200]/60 hover:text-[#E6C200] transition-colors flex items-center gap-2"
              >
                ← Back to Categories
              </button>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-[#E6C200]/10 border border-[#E6C200]/20 text-[9px] font-black uppercase text-[#E6C200]">{period}</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/40">{category}</span>
              </div>
            </div>

            {/* Immersion Header */}
            <div className="text-center space-y-2 py-4">
               <h2 className="text-xl font-bold text-white uppercase tracking-tighter italic">Stellar Guidance</h2>
               <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">Context Locked: {period} / {category}</p>
            </div>

            {/* Big Chat Box - Primary Delivery */}
            <div className="rounded-[2.5rem] bg-black border border-white/10 overflow-hidden min-h-[550px] flex flex-col shadow-2xl relative">
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E6C200]/50 to-transparent opacity-50" />
               <ContextualChat 
                 variant="dark"
                 intent={category} 
                 timeframe={period} 
                 guidance={guidance}
                 initialMessage={`**${period.toUpperCase()} ${category.toUpperCase()} OUTLOOK**\n\n${guidance?.oneLineTruth || "Aligning with current planetary energies..."}\n\n${guidance?.currentSituation || "The current transits suggest a focus on disciplined action."}\n\n**Guidance:** ${guidance?.whatToDo?.[0] || "Maintain focus on long-term stability."}\n\nHow can I help you explore this specific alignment further?`}
               />
            </div>

            <button 
              onClick={() => setViewState("period")}
              className="w-full py-5 rounded-full bg-white/5 border border-white/5 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all"
            >
              Start New Analysis +
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
