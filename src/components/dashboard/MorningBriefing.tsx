"use client";

import React from "react";
import { motion } from "framer-motion";
import { DailyBriefing } from "../../lib/guidance/guidanceCompressor";
import ExecutionModeBadge, { ExecutionMode } from "../timeline/ExecutionModeBadge";
import {
  CheckCircle2,
  XCircle,
  Timer,
  BrainCircuit,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";

interface Props {
  briefing: DailyBriefing;
  userName?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export default function MorningBriefing({ briefing, userName }: Props) {
  const greeting = getGreeting();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 py-16"
    >
      {/* Header */}
      <motion.div variants={item} className="text-center mb-12">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-3 flex items-center justify-center gap-2">
          <CalendarDays className="w-3 h-3" />
          {format(new Date(), "EEEE, MMMM do")}
        </p>
        <h1 className="text-3xl font-light text-white mb-1">
          {greeting}
          {userName ? `, ${userName}` : ""}.
        </h1>
        <p className="text-xs text-slate-500 uppercase tracking-widest">Your Strategic Navigation Briefing</p>
      </motion.div>

      {/* Card Container */}
      <div className="w-full max-w-lg space-y-4">
        {/* Headline */}
        <motion.div
          variants={item}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full" />
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Environment</p>
            <ExecutionModeBadge mode={briefing.executionMode as ExecutionMode} />
          </div>
          <p className="text-lg font-light text-slate-100 leading-relaxed">
            {briefing.headline}
          </p>
        </motion.div>

        {/* Priorities */}
        <motion.div
          variants={item}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8"
        >
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
            Today&apos;s Priorities
          </h3>
          <ol className="space-y-5">
            {briefing.priorities.map((p, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="text-[10px] font-black text-slate-600 mt-0.5 w-4 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-200 leading-relaxed">{p}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Avoid */}
        <motion.div
          variants={item}
          className="bg-slate-900/50 border border-rose-500/10 rounded-3xl p-8"
        >
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Avoid Today
          </h3>
          <ul className="space-y-3">
            {briefing.avoid.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Memory Influence (conditional) */}
        {briefing.memoryInfluence && (
          <motion.div
            variants={item}
            className="bg-slate-900/30 border border-purple-500/10 rounded-3xl px-8 py-5"
          >
            <p className="text-xs text-purple-300/70 leading-relaxed italic">
              {briefing.memoryInfluence}
            </p>
          </motion.div>
        )}

        {/* Transition Alert (conditional) */}
        {briefing.transitionAlert && (
          <motion.div
            variants={item}
            className="bg-slate-900 border border-indigo-500/20 rounded-3xl px-8 py-5 flex items-center gap-4"
          >
            <Timer className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-300/80 leading-relaxed">
              {briefing.transitionAlert}
            </p>
          </motion.div>
        )}

        {/* Confidence Footer */}
        <motion.div variants={item} className="text-center pt-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            Engine Confidence: {Math.round(briefing.confidenceScore * 100)}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
