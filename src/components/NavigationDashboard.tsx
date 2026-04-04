"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Moon,
  Zap,
  Sparkles,
  Clock,
  TrendingUp,
  MessageSquare,
  Home,
  Settings,
} from "lucide-react";

export default function NavigationDashboard({
  tab,
  setTab,
}: {
  tab: string;
  setTab: (t: string) => void;
}) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "kundali", label: "Kundali", icon: Moon },
    { id: "transit", label: "Transit", icon: Zap },
    { id: "dasha", label: "Dasha", icon: Clock },
    { id: "predictions", label: "Predictions", icon: Sparkles },
    { id: "planets", label: "Planets", icon: TrendingUp },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            DivyaDrishti
          </h1>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-all">
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  tab === t.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
