"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NavigationDashboard from "./NavigationDashboard";
import KundaliDetailedView from "./KundaliDetailedView";
import KundaliChart from "./KundaliChart";
import PredictionAnalyzer from "./PredictionAnalyzer";
import { Sparkles, Loader } from "lucide-react";

type Tab = "home" | "kundali" | "transit" | "dasha" | "predictions" | "planets" | "chat";

export default function DashboardHub({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch chart data on mount
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/astrology/chart");
        const data = await res.json();
        if (data.success) {
          setChartData(data.chart);
        } else {
          setError("Failed to load chart data");
        }
      } catch (err) {
        setError("Error loading chart");
        console.error("Chart error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "kundali" && !chartData) {
      fetchChartData();
    }
  }, [activeTab, chartData]);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab user={user} />;
      case "kundali":
        return loading ? (
          <LoadingScreen />
        ) : chartData ? (
          <KundaliDetailedView chartData={chartData} user={user} />
        ) : (
          <ErrorScreen error={error} />
        );
      case "predictions":
        return <PredictionAnalyzer />;
      case "transit":
        return <ComingSoonTab title="Transit Analysis" />;
      case "dasha":
        return <ComingSoonTab title="Dasha Timeline" />;
      case "planets":
        return <ComingSoonTab title="Planets Details" />;
      case "chat":
        return <ComingSoonTab title="AI Chat Assistant" />;
      default:
        return <HomeTab user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <NavigationDashboard tab={activeTab as string} setTab={(t) => setActiveTab(t as Tab)} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {renderContent()}
      </motion.div>
    </div>
  );
}

function HomeTab({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [temporal, setTemporal] = useState<any>(null);
  const [experience, setExperience] = useState<any>(null);

  const calculateChart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/astrology/chart");
      const data = await res.json();
      if (data.success) {
        setChartData(data.chart);
        setTemporal(data.temporal);
        setExperience({
          snapshot: { title: "Today's Cosmic Alignment", message: "The stars are in motion, and so are you." },
          guidance: { focus: "Clarity & Intention", avoid: "Hasty Decisions", time: "2 PM - 6 PM" },
          domains: {
            career: { state: "Power Phase", message: "Professional opportunities are aligned." },
            finance: { state: "Stable", message: "Financial flow is steady and reliable." },
            relationships: { state: "Growth Phase", message: "Relationships deepen with understanding." },
          },
          phase: { message: "A time of balance and reflection. Use this wisdom." },
        });
      }
    } catch (err) {
      console.error("Failed to fetch chart:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090117] text-white p-6 font-sans relative overflow-hidden">
      {/* Mystical Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-10 relative z-10 animate-in fade-in duration-1000">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              DIVYADRISHTI
            </h1>
            <p className="text-[10px] text-indigo-300/60 font-medium uppercase tracking-[0.4em]">
              Celestial Guidance System
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-indigo-950/40 border border-indigo-500/20 rounded-full backdrop-blur-md">
               <p className="text-[10px] font-medium text-indigo-200">
                 <span className="text-amber-500 mr-2">✧</span> {user.name.toUpperCase()}
               </p>
             </div>
             {!chartData && (
                <button 
                  onClick={calculateChart}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50"
                >
                  {loading ? "Aligning..." : "Sync with Cosmos"}
                </button>
              )}
          </div>
        </div>

        {experience ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* 1. Cosmic Snapshot (Hero) */}
            <div className="relative group overflow-hidden p-10 rounded-[3rem] bg-indigo-950/20 border border-indigo-500/20 backdrop-blur-xl">
               <div className="absolute top-0 right-0 p-10">
                 <span className="text-[9px] font-bold uppercase tracking-[0.8em] text-indigo-400/40">Today's Energy</span>
               </div>
               <div className="max-w-2xl space-y-4">
                 <h2 className="text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                   {experience.snapshot.title}
                 </h2>
                 <p className="text-xl text-indigo-100/70 font-light leading-relaxed italic">
                   "{experience.snapshot.message}"
                 </p>
               </div>
            </div>

            {/* 2. Today's Guidance Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { label: "Channel Focus", value: experience.guidance.focus, icon: "🎯" },
                 { label: "Mindful Avoidance", value: experience.guidance.avoid, icon: "🛡️" },
                 { label: "Peak Window", value: experience.guidance.time, icon: "⏳" }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/10 hover:border-amber-500/30 transition-all">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">{item.label}</p>
                      <p className="text-sm font-medium text-indigo-50">{item.value}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* 3. Main Content Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Visuals & Phase */}
              <div className="lg:col-span-7 space-y-8">
                {/* Kundali Chart Card */}
                <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-[3rem] p-8 relative overflow-hidden">
                   <div className="absolute top-8 left-8">
                     <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-400">Birth Alignment</h3>
                     <p className="text-[9px] text-indigo-500/60 font-mono">NORTH INDIAN STYLE</p>
                   </div>
                   <KundaliChart 
                     lagnaSign={chartData.lagna.sign} 
                     planets={chartData.planets} 
                   />
                </div>

                {/* Dasha Phase Card */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/10 rounded-[2.5rem] p-8">
                   <div className="space-y-4">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Life Season</p>
                     <div className="flex items-end gap-3 font-serif">
                       <h3 className="text-4xl text-white">{temporal.current.mahadasha}</h3>
                       <span className="text-2xl text-indigo-500/40">/</span>
                       <h3 className="text-4xl text-indigo-300">{temporal.current.antardasha}</h3>
                     </div>
                     <p className="text-lg text-indigo-100/60 font-light leading-relaxed">
                        {experience.phase.message}
                     </p>
                     <p className="text-[10px] font-mono text-indigo-500/40 uppercase pt-2">
                       Active Window: Until {new Date(temporal.current.end).toLocaleDateString()}
                     </p>
                   </div>
                </div>
              </div>

              {/* Right Column: Life Areas & Planets */}
              <div className="lg:col-span-5 space-y-6">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-indigo-400/60 pl-2">Life Domains</h4>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(experience.domains).map(([key, data]: [string, any]) => (
                    <div key={key} className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] ${getThemeColor(data.state)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{domainIcons[key]}</span>
                          <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">{key}</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border border-current opacity-60">
                          {data.state}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed opacity-90">{data.message}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 border border-dashed border-indigo-500/20 rounded-[3rem]">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-indigo-300/40 font-serif tracking-widest uppercase">
              {loading ? "Mapping Stellar Influences..." : "Mirroring Your Cosmic Profile..."}
            </p>
          </div>
        )}

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
}
