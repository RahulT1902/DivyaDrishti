"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavigationDashboard from "./NavigationDashboard";
import KundaliDetailedView from "./KundaliDetailedView";
import KundaliChart from "./KundaliChart";
import PredictionAnalyzer from "./PredictionAnalyzer";
import DashaTimelineView from "./DashaTimelineView";
import { Sparkles, Loader, Quote } from "lucide-react";
import PunditChatView from "./PunditChatView";
import TransitAnalyzer from "./TransitAnalyzer";

type Tab = "home" | "kundali" | "transit" | "dasha" | "predictions" | "planets" | "chat";

export default function DashboardHub({ user }: { user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/astrology/chart");
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || "Failed to load cosmic data");
      }
    } catch (err) {
      setError("Error connecting to celestial engine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
      fetchDashboardData();
    }
  }, [data]);

  const renderContent = () => {
    if (loading && !data) return <LoadingScreen />;
    if (error) return <ErrorScreen error={error} />;
    if (!data) return <LoadingScreen />;

    switch (activeTab) {
      case "home":
        return <HomeTab user={user} data={data} />;
      case "kundali":
        return <KundaliDetailedView chartData={data.chart} user={user} onNavigate={(tab: string) => setActiveTab(tab as Tab)} />;
      case "dasha":
        return (
          <DashaTimelineView 
            temporal={data.temporal} 
            narrative={data.narrative} 
            insights={data.insights} 
            guidance={data.guidance} 
          />
        );
      case "predictions":
        return <PredictionAnalyzer />;
      case "transit":
        return <TransitAnalyzer transitData={data.transitIntelligence} />;
      case "planets":
        return <ComingSoonTab title="Planets Details" />;
      case "chat":
        return <PunditChatView />;
      default:
        return <HomeTab user={user} data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090117]">
      <NavigationDashboard tab={activeTab as string} setTab={(t) => setActiveTab(t as Tab)} onLogout={() => router.push("/login")} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {renderContent()}
      </motion.div>
    </div>
  );
}

function HomeTab({ user, data }: { user: any, data: any }) {
  const { narrative, insights, guidance, temporal, chart } = data;

  return (
    <main className="min-h-screen text-white p-6 font-sans relative overflow-hidden">
      {/* Mystical Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10 animate-in fade-in duration-1000">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              DIVYADRISHTI
            </h1>
            <p className="text-[10px] text-indigo-300/60 font-medium uppercase tracking-[0.4em]">Celestial Guidance System</p>
          </div>
          <div className="px-5 py-2 bg-indigo-950/40 border border-indigo-500/20 rounded-full backdrop-blur-md flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-none">
                Alignment Confirmed: {user.name}
             </p>
          </div>
        </div>

        {/* Hero Insight - The Pundit's Opening Statement */}
        <div className="relative group overflow-hidden p-12 rounded-[3.5rem] bg-indigo-950/20 border border-indigo-500/10 backdrop-blur-3xl transition-all hover:bg-indigo-950/30">
          <div className="absolute top-0 right-0 p-12">
             <Quote className="w-12 h-12 text-indigo-500/10" />
          </div>
          <div className="max-w-3xl space-y-6">
             <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-amber-500/60">Opening Statement</span>
             <h2 className="text-4xl font-serif leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-50 to-indigo-200">
                {insights.primary}
             </h2>
             <p className="text-xl text-indigo-100/60 font-light leading-relaxed italic max-w-2xl">
                "{narrative.split("\n")[0]}"
             </p>
          </div>
        </div>

        {/* Core Domains Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Life Season & Guidance */}
          <div className="lg:col-span-8 space-y-10">
             
             {/* Dasha Phase Strip */}
             <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-indigo-500/10">
                <div className="flex items-center justify-between mb-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Current Life Season</p>
                      <div className="flex items-end gap-3 font-serif">
                        <h3 className="text-4xl text-white">{temporal?.stack?.mahadasha || "..."}</h3>
                        <span className="text-2xl text-indigo-500/40">/</span>
                        <h3 className="text-4xl text-indigo-300">{temporal?.stack?.antardasha || "..."}</h3>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-indigo-500/40 uppercase tracking-widest">Next Shift</p>
                      <p className="text-sm font-medium text-indigo-100/60">{temporal?.stack?.nextAntardasha || "Stable"}</p>
                   </div>
                </div>
                <p className="text-lg text-indigo-100/70 font-light leading-relaxed border-t border-indigo-500/5 pt-6">
                   This period is primarily focused on <span className="text-amber-500/80 font-medium">stabilization and disciplined growth</span>. 
                   The planetary currents favor structural review over rapid external movement.
                </p>
             </div>

             {/* Top Guidance Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-indigo-950/20 border border-indigo-500/10">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-4">Supporting Logic</p>
                   <ul className="space-y-3">
                      {insights.supporting.slice(0, 3).map((point: string, i: number) => (
                        <li key={i} className="text-sm text-indigo-100/60 flex items-start gap-2">
                          <span className="text-amber-500/40">•</span> {point}
                        </li>
                      ))}
                   </ul>
                </div>
                <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-4">Critical Caution</p>
                   <p className="text-sm text-amber-100/70 leading-relaxed font-light italic">
                      "{insights.caution}"
                   </p>
                </div>
             </div>
          </div>

          {/* Right: Behavioral Directives */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-[2.5rem] p-8 space-y-8">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400/60 text-center">Behavioral Directives</h4>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 pl-1">Primary Actions (Do)</p>
                      <div className="space-y-2">
                        {guidance.do.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-50/70">
                             {item}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 pl-1">Mindful Restraints (Avoid)</p>
                      <div className="space-y-2">
                        {guidance.avoid.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-50/70">
                             {item}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* System Footer */}
        <div className="pt-10 flex items-center justify-between border-t border-indigo-500/10">
          <p className="text-[9px] font-serif tracking-widest text-indigo-500/40 uppercase">
             {user.name} • Birth Integrity Confirmed
          </p>
          <p className="text-[9px] font-serif tracking-widest text-indigo-500/40 uppercase italic">
            DIVYADRISHTI ASTRO v2.0
          </p>
        </div>

      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Loader className="w-8 h-8 text-purple-400 animate-spin" />
      <p className="text-slate-400">Loading your cosmic data...</p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <p className="text-red-400 font-semibold">{error || "Something went wrong"}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
      >
        Retry
      </button>
    </div>
  );
}

function ComingSoonTab({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Sparkles className="w-12 h-12 text-purple-400" />
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400">Coming soon...</p>
    </div>
  );
}

const domainIcons: Record<string, string> = {
  career: "💼",
  finance: "💰",
  health: "🛡️",
  relationships: "🤝",
  growth: "🌱",
  mind: "🧠",
};

const getThemeColor = (state: string) => {
  switch (state) {
    case "Power Phase":
      return "text-amber-400 border-amber-500/30 bg-amber-500/5 shadow-[0_0_20px_rgba(255,193,7,0.1)]";
    case "Growth Phase":
      return "text-indigo-400 border-indigo-500/30 bg-indigo-500/5";
    default:
      return "text-zinc-400 border-zinc-800 bg-zinc-900/40";
  }
};
