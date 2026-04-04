"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Binary, 
  BarChart3, 
  Sparkles, 
  Search, 
  Compass,
  Briefcase,
  TrendingUp,
  Heart,
  ChevronRight
} from "lucide-react";

interface ModuleDashboardProps {
  onModuleSelect: (module: string) => void;
  userName: string;
}

export default function ModuleDashboard({ onModuleSelect, userName }: ModuleDashboardProps) {
  const modules = [
    {
      id: "kundli",
      title: "Birth Blueprint",
      description: "Complete analysis of your celestial DNA and planetary strengths.",
      icon: Binary,
      color: "indigo",
      delay: 0.1
    },
    {
      id: "dasha",
      title: "Dasha Timeline",
      description: "Navigate the shifting tides of time and cosmic influence.",
      icon: BarChart3,
      color: "amber",
      delay: 0.2
    },
    {
      id: "nature",
      title: "Inner Nature",
      description: "Deep dive into your core personality and emotional signature.",
      icon: Compass,
      color: "cyan",
      delay: 0.3
    },
    {
      id: "life-areas",
      title: "Life Guidance",
      description: "Actionable paths for Career, Wealth, Health, and Love.",
      icon: Search,
      color: "emerald",
      delay: 0.4
    },
    {
      id: "match",
      title: "Match Horoscope",
      description: "Understand the energetic resonance between two souls.",
      icon: Heart,
      color: "rose",
      delay: 0.5
    },
    {
      id: "transit",
      title: "Stellar Flow",
      description: "Real-time transit updates and planetary transit logic.",
      icon: TrendingUp,
      color: "purple",
      delay: 0.6
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "indigo": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 glow-indigo-500/20";
      case "amber": return "text-amber-400 bg-amber-500/10 border-amber-500/20 glow-amber-500/20";
      case "cyan": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 glow-cyan-500/20";
      case "emerald": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald-500/20";
      case "rose": return "text-rose-400 bg-rose-500/10 border-rose-500/20 glow-rose-500/20";
      case "purple": return "text-purple-400 bg-purple-500/10 border-purple-500/20 glow-purple-500/20";
      default: return "text-white/40 bg-white/5 border-white/10 glow-white/10";
    }
  };

  return (
    <div className="space-y-12">
      {/* Hello Section (Internal Dashboard Header): Prabhat Style */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.5em] text-black/20 font-black">Margdarshan Dashboard</p>
        <h2 className="text-3xl font-light text-black tracking-tight">
          Explore your path, <span className="font-bold text-black">{userName}</span>
        </h2>
      </div>

      {/* Module Grid: Performance Hardened */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {modules.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: m.delay * 0.5, 
              duration: 0.28,
              ease: [0.4, 0, 0.2, 1]
            }}
            onClick={() => onModuleSelect(m.id)}
            className="group glass-card p-8 cursor-pointer flex flex-col justify-between hover:scale-[1.01] transition-all duration-180 relative overflow-hidden bg-white"
            style={{ contain: 'layout paint' } as any}
          >
            <div className="space-y-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${getColorClasses(m.color)}`}>
                <m.icon className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-black/80 tracking-tight">{m.title}</h3>
                <p className="text-xs text-black/40 font-medium leading-relaxed">
                  {m.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 relative z-10">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-black/20 group-hover:text-amber-600 transition-colors">
                Prabhat Darshan
              </span>
              <div className="w-10 h-10 rounded-full bg-black/2 border border-black/5 flex items-center justify-center transition-all group-hover:bg-amber-500/10 group-hover:border-amber-500/20">
                <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-amber-600 transition-all group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Subtle Sunrise Hint on Hover */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
