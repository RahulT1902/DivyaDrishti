"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Wallet, 
  Heart, 
  Zap, 
  Target, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface DashboardData {
  career: { score: number; status: string; insight: string; recommendations: string[] };
  finance: { score: number; status: string; insight: string; recommendations: string[] };
  emotional: { score: number; status: string };
  timeline: { title: string; opportunities: string[]; cautions: string[] }[];
}

export default function LifeOSDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-white mb-2">
            Your <span className="font-semibold text-purple-400">Life OS</span>
          </h1>
          <p className="text-slate-400">Personalized Timing & Decision Intelligence</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 uppercase tracking-widest">Active Cycle</p>
          <p className="text-xl text-purple-300 font-medium">Saturn-Jupiter Expansion</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Domain Scores */}
        <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreCard 
            title="Career Momentum" 
            score={data.career.score} 
            status={data.career.status} 
            icon={<TrendingUp className="w-5 h-5" />} 
            color="purple"
          />
          <ScoreCard 
            title="Financial Stability" 
            score={data.finance.score} 
            status={data.finance.status} 
            icon={<Wallet className="w-5 h-5" />} 
            color="emerald"
          />
          <ScoreCard 
            title="Emotional Balance" 
            score={data.emotional.score} 
            status={data.emotional.status} 
            icon={<Heart className="w-5 h-5" />} 
            color="rose"
          />

          {/* Deep Insight Area */}
          <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              AI Intelligence Synthesis
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-widest">The Career Shift</h3>
                <p className="text-lg leading-relaxed text-slate-200">
                  {data.career.insight}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {data.career.recommendations.map((rec, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-full">
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Goals</h3>
                <div className="space-y-4">
                  <GoalItem title="Q3 Revenue Milestone" progress={75} />
                  <GoalItem title="Leadership Transition" progress={40} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Sidebar */}
        <section className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-purple-500/20 rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-400" />
              Timing Windows
            </h2>
            <div className="space-y-8">
              {data.timeline.map((phase, i) => (
                <TimelineItem key={i} phase={phase} isFirst={i === 0} />
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              Habit Adaptation
            </h2>
            <div className="space-y-4">
              <HabitItem title="Morning Meditation" guidance="High Mars energy: Extend by 10 mins." />
              <HabitItem title="Deep Work" guidance="Saturn pressure: Best window 9am-12pm." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ScoreCard({ title, score, status, icon, color }: any) {
  const colorMap: any = {
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl transition-all hover:bg-slate-900"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-white">{score}%</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{status}</p>
      <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={`h-full ${color === 'purple' ? 'bg-purple-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`}
        />
      </div>
    </motion.div>
  );
}

function GoalItem({ title, progress }: any) {
  return (
    <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <span className="text-xs text-purple-400 font-bold">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-purple-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function TimelineItem({ phase, isFirst }: any) {
  return (
    <div className="relative pl-6 border-l border-slate-800 pb-2 last:pb-0">
      <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${isFirst ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-700'}`} />
      <h4 className="text-sm font-bold text-white mb-2">{phase.title}</h4>
      <div className="space-y-2">
        {phase.opportunities.map((opt: string, i: number) => (
          <p key={i} className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {opt}
          </p>
        ))}
        {phase.cautions.map((cau: string, i: number) => (
          <p key={i} className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {cau}
          </p>
        ))}
      </div>
    </div>
  );
}

function HabitItem({ title, guidance }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 w-2 h-2 rounded-full bg-amber-400" />
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{guidance}</p>
      </div>
    </div>
  );
}
