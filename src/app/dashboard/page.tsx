"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  User as UserIcon,
  Sparkles,
  Search,
  Zap,
  Calendar,
  Compass
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ModuleDashboard from "@/components/ModuleDashboard";
import KundaliModule from "@/components/KundaliModule";
import AapkiKundali from "@/components/AapkiKundali";
import ContextualChat from "@/components/ContextualChat";
import { DarshanMoment } from "@/components/DarshanMoment";
import { Intent, Timeframe } from "@/lib/intelligence/types";

type ApiState = 
  | { status: "initial" }
  | { status: "loading" }
  | { status: "success"; data: any }
  | { status: "error"; message: string; code: string; type: "NETWORK_ERROR" | "DATA_MALFORMATION" | "ENGINE_FAILURE" | "INTERNAL_ERROR" };

export default function Dashboard() {
  const [state, setState] = useState<ApiState>({ status: "initial" });
  const [intent, setIntent] = useState<Intent>("general");
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const [showDarshan, setShowDarshan] = useState(false);
  const [activeModule, setActiveModule] = useState("home");
  
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestId = useRef(0);
  const retryCount = useRef(0);

  // 🧪 Final Refinement 1: Safe Session Store (SRE Pattern)
  const getSafeSession = useCallback(<T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const value = localStorage.getItem(key);
      return (value as unknown as T) || fallback;
    } catch {
      return fallback;
    }
  }, []);

  // 🧪 Final Refinement 2: Auto-Navigation Manager
  useEffect(() => {
    if (intent && intent !== "general" && activeModule === "kundli") {
      const timer = setTimeout(() => {
        const element = document.getElementById(`guidance-${intent}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [intent, activeModule]);

  // 1. Session Memory: Restore Context on Mount
  useEffect(() => {
    const savedTimeframe = getSafeSession("lastTimeframe", "today") as Timeframe;
    const savedIntent = getSafeSession("lastIntent", "general") as Intent;
    
    setTimeframe(savedTimeframe);
    setIntent(savedIntent);

    const lastSeen = localStorage.getItem("lastDarshanDate");
    const today = new Date().toISOString().split("T")[0];
    if (lastSeen !== today) {
      setShowDarshan(true);
      localStorage.setItem("lastDarshanDate", today);
    }
  }, [getSafeSession]);

  // 🧭 Central Core: Data Contract Validator
  const isValidResponse = useCallback((json: any): boolean => {
    return (
      json?.success === true &&
      json?.data?.report &&
      json?.data?.report?.hero &&
      json?.data?.report?.lifeAreas &&
      json?.data?.user &&
      json?.data?.chart
    );
  }, []);

  // 2. Debounced Data Sync with Smart Retry & Timeout Logic
  const fetchData = useCallback(async (currentIntent: Intent, currentTimeframe: Timeframe, isRetry = false) => {
    const requestId = ++currentRequestId.current;
    
    // Only set loading if it's the first attempt or manual trigger
    if (!isRetry) {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryCount.current = 0;
      setState({ status: "loading" });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s Hard Timeout (Resilient for cold starts)
    
    try {
      const res = await fetch(`/api/astrology/chart?intent=${currentIntent}&timeframe=${currentTimeframe}`, {
        signal: controller.signal
      });
      const json = await res.json();
      
      clearTimeout(timeoutId);
      
      if (requestId !== currentRequestId.current) return;

      if (json.success) {
        if (!isValidResponse(json)) {
          console.error("CONTRACT BREACH: API returned success but payload is malformed.");
          setState({ 
            status: "error", 
            message: "The stars are visible but their patterns are unclear. Please retry.",
            code: "DATA_MALFORMATION",
            type: "DATA_MALFORMATION"
          });
          return;
        }

        console.log("DEBUG: API Success, Data Contract Verified");
        setState({ status: "success", data: json.data });
        retryCount.current = 0; // Reset on success
        localStorage.setItem("lastTimeframe", currentTimeframe);
        localStorage.setItem("lastIntent", currentIntent);
      } else {
        const errType = json.error?.code as any || "INTERNAL_ERROR";
        setState({ 
          status: "error", 
          message: json.error?.message || "Cosmic alignment interrupted.",
          code: errType,
          type: errType
        });
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (requestId !== currentRequestId.current) return;
      
      if (e.name === 'AbortError') return; // Silence expected aborts
      
      console.error(`STEP FAILURE [Attempt ${retryCount.current + 1}]:`, e.message);

      // Smart Retry Logic (Up to 3 times)
      if (retryCount.current < 2) {
        retryCount.current++;
        const delay = retryCount.current * 1500; // 1.5s, 3s
        console.log(`RETRY TRIGGERED [${retryCount.current}/3] due to: ${e.message}`);
        
        retryTimerRef.current = setTimeout(() => {
          fetchData(currentIntent, currentTimeframe, true);
        }, delay);
      } else {
        setState({ 
          status: "error", 
          message: "Connection interrupted. We couldn't retrieve your guidance.",
          code: e.name === 'AbortError' ? "TIMEOUT" : "NETWORK_ERROR",
          type: "NETWORK_ERROR"
        });
      }
    }
  }, []);

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    
    fetchTimerRef.current = setTimeout(() => {
      fetchData(intent, timeframe);
    }, 200);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [intent, timeframe, fetchData]);

  const timeframes: Timeframe[] = ["today", "this-week", "this-month", "year"];

  return (
    <div className="flex min-h-screen selection:bg-amber-500/30 overflow-y-auto scroll-smooth">
      {/* Texture Overlay */}
      <div className="fixed inset-0 paper-texture opacity-10 pointer-events-none z-50" />
      
      <Sidebar 
        activeModule={activeModule} 
        onModuleSelect={(m) => setActiveModule(m)} 
      />
 
      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden min-w-0">
        <header className="h-20 px-8 md:px-12 flex items-center justify-between border-b border-black/[0.03] sticky top-0 bg-white/60 backdrop-blur-xl z-20">
          <div className="flex flex-col">
             <h1 className="text-lg font-light text-black/80 tracking-tight">
               Namaste, <span className="font-bold text-black">{state.status === 'success' ? state.data?.user?.name : "Seeker"}</span>
             </h1>
             <p className="text-[10px] text-black/40 font-medium italic">Aaj ka din dheere-dheere spashtata la raha hai</p>
          </div>
 
          <div className="flex items-center gap-6">
             {/* Decision Pill Header */}
             <div className="signal-badge bg-black/[0.02] border-black/[0.03] text-black/40 shadow-inner">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black">
                   {state.status === 'success' ? state.data?.report?.hero?.decisionState : "Observation"} Mode
                </span>
             </div>
 
             <div className="flex items-center gap-5 border-l border-black/[0.05] pl-6">
                <button className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] text-black/30 hover:text-black transition-all group">
                   <Globe className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                   <span>EN | हिंदी</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-black/5 border border-black/5 flex items-center justify-center hover:bg-black/10 transition-all shadow-sm">
                   <UserIcon className="w-5 h-5 text-black/40" />
                </button>
             </div>
          </div>
        </header>
 
        <div className="flex-1 p-8 md:p-12 max-w-7xl w-full mx-auto relative focus-visible:outline-none">
          {state.status === "loading" && (
            <div className="flex items-center justify-center h-[60vh]">
              <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.1)]"
              />
            </div>
          )}

          {state.status === "error" && (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-600/40">
                    <Compass className="w-10 h-10 animate-pulse" />
                </div>
                <div className="text-center space-y-3">
                   <p className="text-sm font-bold text-black/80">{state.message}</p>
                   <p className="text-[10px] text-black/30 uppercase tracking-[0.2em] font-black">Error Code: {state.code || "UNKNOWN"}</p>
                </div>
                <button 
                  onClick={() => fetchData(intent, timeframe)} 
                  className="px-10 py-3.5 rounded-2xl bg-black text-white hover:bg-black/80 transition-all shadow-xl shadow-black/10 text-[10px] uppercase tracking-[0.3em] font-black"
                >
                  Seek Guidance Again
                </button>
            </div>
          )}

          {state.status === "success" && (
            <div className="space-y-16 pb-20">
              <AnimatePresence mode="wait">
                {activeModule === "home" ? (
                  <motion.div 
                    key="home-grid"
                    initial={{ opacity: 0, scale: 0.992 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ModuleDashboard onModuleSelect={(m) => setActiveModule(m)} userName={state.data.user.name} />
                  </motion.div>
                ) : activeModule === "kundli" ? (
                  <motion.div 
                    key="kundli-console"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <AapkiKundali 
                      chart={state.data.chart} 
                      temporal={state.data.temporal} 
                      report={state.data.report} 
                      guidance={state.data.guidance}
                    />
                  </motion.div>
                ) : activeModule === "charts" ? (
                  <motion.div 
                    key="kundli-report"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                  >
                    <div className="lg:col-span-8 space-y-16">
                      <KundaliModule 
                        chart={state.data.chart} 
                        temporal={state.data.temporal} 
                        report={state.data.report} 
                        intent={intent}
                      />
                      <ContextualChat guidance={state.data.guidance} intent={intent} timeframe={timeframe} />
                    </div>
 
                    {/* Guidance Selection Rail (Context-First) */}
                    <div className="lg:col-span-4 space-y-8">
                       <div className="glass-card p-10 bg-white border-black/[0.03] shadow-sm space-y-10 sticky top-28">
                          
                          {/* Segmented Timeframe Selector (Subtle Context) */}
                          <div className="space-y-4">
                             <div className="flex items-center justify-between px-1">
                                <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-black/20">Set Context</h4>
                                <Calendar className="w-3.5 h-3.5 text-black/10" />
                              </div>
                             <div className="flex bg-black/[0.02] p-1 rounded-2xl border border-black/[0.01]">
                                {timeframes.map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`flex-1 py-3 text-[9px] uppercase tracking-widest font-black transition-all duration-300 rounded-xl ${
                                      timeframe === t 
                                        ? "bg-white text-amber-600 shadow-sm border border-amber-500/10" 
                                        : "text-black/20 hover:text-black/40"
                                    }`}
                                  >
                                    {t.replace("this-", "")}
                                  </button>
                                ))}
                             </div>
                             <p className="text-[10px] text-black/30 font-medium italic text-center pt-1 animate-pulse">Guidance for: {timeframe.replace("this-", "").toUpperCase()}</p>
                          </div>

                          <div className="w-full h-[1px] bg-black/[0.03]" />

                          {/* Humanized Domain Header */}
                          <div className="space-y-8">
                             <div className="flex items-center gap-3">
                                <Search className="w-4 h-4 text-amber-600/40" />
                                <h3 className="text-[11px] uppercase tracking-[0.2em] text-black/60 font-black">Where do you seek clarity?</h3>
                             </div>

                             <div className="flex flex-col gap-3">
                                {["general", "career", "finance", "health", "relationships"].map((i) => (
                                  <button 
                                    key={i} 
                                    onClick={() => setIntent(i as Intent)}
                                    className={`w-full px-6 py-4 rounded-[1.5rem] flex items-center justify-between border transition-all duration-300 group hover:delay-50 ${
                                      intent === i 
                                        ? "border-amber-500 bg-amber-500/5 text-amber-700 shadow-sm" 
                                        : "border-black/[0.02] bg-black/[0.01] text-black/40 hover:border-black/5 hover:bg-black/5"
                                    }`}
                                    style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                                  >
                                    <div className="flex flex-col items-start gap-1">
                                       <span className="text-[11px] uppercase tracking-[0.2em] font-black">{i}</span>
                                       <span className="text-[9px] font-medium text-black/20 group-hover:text-black/40 transition-colors">
                                          {i === 'career' ? 'Work & decisions' : 
                                           i === 'finance' ? 'Wealth & stability' :
                                           i === 'health' ? 'Energy & vitality' :
                                           i === 'relationships' ? 'Partnerships' : 'Overall flow'}
                                       </span>
                                    </div>
                                    <Zap className={`w-3.5 h-3.5 transition-all duration-500 ${intent === i ? 'scale-110 text-amber-500' : 'opacity-10 group-hover:opacity-30'}`} />
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-[50vh]">
                     <p className="text-black/20 lowercase tracking-[0.5em] italic">The stars are still aligning for this module...</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {showDarshan && (
          <DarshanMoment name={state.status === 'success' ? state.data?.user?.name : "Seeker"} onComplete={() => setShowDarshan(false)} />
        )}
      </main>
    </div>
  );
}
