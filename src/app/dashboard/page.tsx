"use client";

import React, { useState, useEffect } from "react";
import { DashboardStateComposer, DashboardUIState } from "../../lib/dashboard/dashboardStateComposer";
import { LifeStateSynthesizer } from "../../lib/intelligence/synthesizers/lifeStateSynthesizer";
import { TimelineProjectionEngine } from "../../lib/intelligence/timeline/timelineProjectionEngine";
import CurrentPhaseHero from "../../components/timeline/CurrentPhaseHero";
import TimelineBand from "../../components/timeline/TimelineBand";
import MomentumCard from "../../components/dashboard/MomentumCard";
import TransitionAlert from "../../components/dashboard/TransitionAlert";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, LayoutDashboard, Calendar, Zap, Bell } from "lucide-react";

// Mock Data for MVP Unification
const mockNatal = { planets: [], houses: [], ascendant: 0 } as any;
const mockDashaCtx = { currentMahadasha: "Saturn", currentAntardasha: "Jupiter" } as any;
const mockTimeline = [] as any;
const mockTransits = [
  { planet: "Saturn", nature: "supportive", reason: "Stable placement in 10th house", area: ["career"], intensity: 8 },
  { planet: "Mars", nature: "challenging", reason: "Retrograde square to moon", area: ["emotional"], intensity: 6 }
] as any;

export default function DashboardPage() {
  const [state, setState] = useState<DashboardUIState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadState() {
      const synthesizer = new LifeStateSynthesizer();
      const projector = new TimelineProjectionEngine();
      const composer = new DashboardStateComposer();

      // 1. Synthesize Life State
      const lifeState = await synthesizer.synthesize(mockNatal, mockDashaCtx, mockTimeline, mockTransits);
      
      // 2. Project Timeline
      const projection = await projector.project("90D", { primaryArchetype: "Architect", longTermThemes: ["Structure", "Growth"], confidence: 0.8 } as any, { intensity: 5, activeTriggers: [], data: {} } as any);
      
      // 3. Compose UI State
      const uiState = composer.compose(lifeState, projection);
      
      setState(uiState);
      setLoading(false);
    }
    loadState();
  }, []);

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-purple-400 font-bold tracking-widest uppercase text-xs"
        >
          Synthesizing Life State...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-8 gap-10 z-50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <nav className="flex flex-col gap-8 text-slate-500">
          <LayoutDashboard className="w-6 h-6 text-purple-400 cursor-pointer" />
          <Calendar className="w-6 h-6 hover:text-slate-300 transition-colors cursor-pointer" />
          <Zap className="w-6 h-6 hover:text-slate-300 transition-colors cursor-pointer" />
          <Bell className="w-6 h-6 hover:text-slate-300 transition-colors cursor-pointer" />
        </nav>
      </aside>

      <main className="pl-20">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-900 flex items-center justify-between px-12 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dashboard</span>
            <span className="text-slate-700">/</span>
            <span className="text-xs font-bold text-white uppercase tracking-widest">Life Navigation</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right mr-4 hidden md:block">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Intelligence</p>
                <p className="text-xs text-purple-400 font-medium">DivyaDrishti Engine v2.1</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700" />
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto space-y-12">
          {/* Current Phase Hero */}
          <CurrentPhaseHero lifeState={state.timeline as any} /> 

          {/* Timeline Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-semibold text-white">Life Rhythm</h3>
                <p className="text-xs text-slate-500">Spatialized 90-Day Forecast</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold rounded-lg text-slate-400 uppercase">30D</button>
                <button className="px-3 py-1 bg-purple-500 text-[10px] font-bold rounded-lg text-white uppercase">90D</button>
                <button className="px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold rounded-lg text-slate-400 uppercase">365D</button>
              </div>
            </div>
            <TimelineBand windows={state.timeline.windows} />
          </section>

          {/* Transition Alert */}
          <TransitionAlert 
            daysRemaining={state.nextTransition.daysRemaining} 
            from={state.nextTransition.from} 
            to={state.nextTransition.to} 
            intensity={state.nextTransition.intensity} 
          />

          {/* Momentum Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {state.momentum.map((card, i) => (
              <MomentumCard key={i} {...card} />
            ))}
          </section>

          {/* Score Summary Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
             <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">System Resilience Metrics</h4>
                <div className="space-y-8">
                  <ScoreBar label="Environmental Stability" value={state.lifeScores.stability} />
                  <ScoreBar label="Decision Clarity" value={state.lifeScores.clarity} />
                  <ScoreBar label="Phase Volatility" value={state.lifeScores.volatility} />
                </div>
             </div>
             <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-8 flex flex-col justify-center text-center">
                <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Engine Confidence</h4>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  {Math.round(state.timeline.confidenceScore * 100)}%
                </p>
                <p className="text-xs text-slate-500 mt-4 max-w-xs mx-auto">
                  Based on high-fidelity sample density across dasha and transit alignment layers.
                </p>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="h-full bg-slate-400"
        />
      </div>
    </div>
  );
}
