"use client";

import React, { useState } from "react";
import { 
  Home, 
  User, 
  FileText, 
  Edit3, 
  Printer, 
  Database, 
  BarChart3, 
  Layout, 
  Search, 
  Wallet,
  Globe,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  X,
  Flame,
  Binary
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  onModuleSelect: (module: string) => void;
  activeModule: string;
}

export default function Sidebar({ onModuleSelect, activeModule }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["calculations"]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const navGroups = [
    {
      id: "profile",
      label: "User Profile",
      icon: User,
      items: [
        { id: "kundli", label: "Aapki Kundli", icon: Flame },
        { id: "profile", label: "Profile Settings", icon: Settings },
      ]
    },
    {
      id: "calculations",
      label: "Calculations",
      icon: Database,
      items: [
        { id: "charts", label: "Charts & Tables", icon: Layout },
        { id: "dasha", label: "Dasha Timeline", icon: BarChart3 },
        { id: "numerology", label: "Numerology", icon: Binary },
      ]
    },
    {
      id: "reports",
      label: "Predictions & Reports",
      icon: FileText,
      items: [
        { id: "nature", label: "Inner Nature", icon: Sparkles },
        { id: "life-areas", label: "Life Guidance", icon: Search },
        { id: "match", label: "Match Horoscope", icon: Sparkles },
      ]
    }
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex-shrink-0 overflow-y-auto no-scrollbar bg-[#FAFAFA] border-r border-black/[0.03] flex flex-col z-30 transition-all duration-500 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.02)]">
      {/* Premium Logo Section: Prabhat Soul */}
      <div className="p-8 pb-10 flex flex-col gap-1 border-b border-black/[0.03] mb-6">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onModuleSelect("home")}>
          <div className="relative">
            <div className="absolute -inset-2 bg-amber-500/10 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xl relative z-10">🪔</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.5em] font-black text-black/80 group-hover:text-black transition-colors">
            DivyaDrishti
          </span>
        </div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/20 font-black ml-9">Samay ka margdarshan</p>
        <button className="lg:hidden absolute top-8 right-4 text-black/40 hover:text-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 space-y-2">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            <button 
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-black/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <group.icon className="w-3.5 h-3.5 text-black/20 group-hover:text-amber-600 transition-colors" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-black/30 group-hover:text-black/60">
                  {group.label}
                </span>
              </div>
              {expandedGroups.includes(group.id) ? (
                <ChevronDown className="w-3.5 h-3.5 text-black/20" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-black/20" />
              )}
            </button>

            <AnimatePresence>
              {expandedGroups.includes(group.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black/[0.01] rounded-2xl mt-1"
                >
                  <div className="py-2 px-2 space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onModuleSelect(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                          activeModule === item.id 
                          ? "bg-white text-amber-600 shadow-[0_2px_10px_rgba(245,158,11,0.1)] border border-amber-500/10" 
                          : "text-black/40 hover:text-black/80 hover:bg-black/5 border border-transparent"
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${activeModule === item.id ? "text-amber-500" : "text-black/10 group-hover:text-black/30"}`} />
                        <span className="text-[13px] font-bold tracking-wide">
                          {item.label}
                        </span>
                        <ChevronRight className={`ml-auto w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ${
                          activeModule === item.id ? "translate-x-0 opacity-40" : "translate-x-[-10px]"
                        }`} />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-8 border-t border-black/5 space-y-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 group cursor-pointer hover:bg-amber-500/10 transition-all">
          <Wallet className="w-4 h-4 text-amber-500/50 group-hover:scale-110 transition-transform" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-black/20 font-black">Credits</p>
            <p className="text-sm font-black text-amber-600">₹ 0.0</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-black text-black/10 italic">
          <span>v1.2.5 Hardened</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
        </div>
      </div>
    </aside>
  );
}
