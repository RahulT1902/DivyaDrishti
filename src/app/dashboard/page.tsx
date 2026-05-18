"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardStateComposer, DashboardUIState } from "../../lib/dashboard/dashboardStateComposer";
import { LifeStateSynthesizer } from "../../lib/intelligence/synthesizers/lifeStateSynthesizer";
import { TimelineProjectionEngine } from "../../lib/intelligence/timeline/timelineProjectionEngine";
import CurrentPhaseHero from "../../components/timeline/CurrentPhaseHero";
import TimelineBand from "../../components/timeline/TimelineBand";
import MomentumCard from "../../components/dashboard/MomentumCard";
import TransitionAlert from "../../components/dashboard/TransitionAlert";
import AstrologyAnchor from "../../components/dashboard/AstrologyAnchor";
import PlanetarySnapshot from "../../components/dashboard/PlanetarySnapshot";
import PunditChatView from "../../components/PunditChatView";
import DashaTimelineView from "../../components/DashaTimelineView";
import KundliPage from "../../components/KundliPage";
import PredictionsPage from "../../components/PredictionsPage";
import RemediesPage from "../../components/RemediesPage";
import TransitsPage from "../../components/TransitsPage";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";

const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const getSign = (n: number) => SIGN_NAMES[(n - 1) % 12] || "Unknown";

const NAV_TABS = ["Dashboard", "Kundli", "Dashas", "Transits", "Predictions", "Remedies", "Ask Pundit"];

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardUIState | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"30D" | "90D" | "365D">("90D");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [realChartData, setRealChartData] = useState<any>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("divya:loggedIn");
    localStorage.removeItem("divya:userEmail");
    router.push("/login");
  };

  // ── LOAD REAL CHART PIPELINE ──────────────────────────────────────────────
  useEffect(() => {
    const loggedIn = localStorage.getItem("divya:loggedIn");
    const userEmail = localStorage.getItem("divya:userEmail");
    if (!loggedIn || !userEmail) {
      router.replace("/login");
      return;
    }

    // Fetch real user profile for avatar
    fetch(`/api/user?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => { if (d.success && d.user) setUser({ name: d.user.name, email: d.user.email }); })
      .catch(() => {});

    async function loadRealChart() {
      try {
        const res = await fetch(`/api/astrology/chart?email=${encodeURIComponent(userEmail!)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setChartError(data.error || "Chart calculation failed");
          setLoading(false);
          return;
        }
        setRealChartData(data.data);
      } catch (e: any) {
        setChartError(e.message || "Unknown error");
        setLoading(false);
      }
    }
    loadRealChart();
  }, [router]);

  // ── RE-CALCULATE DASHBOARD UI STATE WHEN CHART DATA OR TIMEFRAME CHANGES ───
  useEffect(() => {
    if (!realChartData) return;

    async function computeUIState() {
      try {
        const synthesizer = new LifeStateSynthesizer();
        const projector = new TimelineProjectionEngine();
        const composer = new DashboardStateComposer();
        const realNatal = realChartData.chart;
        const realDashaCtx = { 
          currentMahadasha: realChartData.temporal?.stack?.mahadasha, 
          currentAntardasha: realChartData.temporal?.stack?.antardasha 
        };
        const realTransits = realChartData.transitIntelligence?.signals || [];
        const rawTimeline = realChartData.timeline || [];
        const realTimeline = rawTimeline.map((p: any) => ({
          planet: p.planet,
          start: new Date(p.start),
          end: new Date(p.end)
        }));

        const lifeState = await synthesizer.synthesize(realNatal, realDashaCtx as any, realTimeline, realTransits);
        const projection = await projector.project(timeframe,
          { primaryArchetype: "Architect", longTermThemes: ["Structure", "Growth"], confidence: 0.8 } as any,
          { intensity: 5, activeTriggers: [], data: {} } as any
        );
        const uiState = composer.compose(lifeState, projection);
        setState(uiState);
      } catch (e: any) {
        console.error("Error computing UI State:", e);
      } finally {
        setLoading(false);
      }
    }

    computeUIState();
  }, [realChartData, timeframe]);

  // ---- Panchang: derive Moon sign from real chart if available ----
  const moonPlanet = realChartData?.chart?.planets?.find((p: any) => p.name === "Moon");
  const moonSignName = moonPlanet ? getSign(moonPlanet.sign) : "—";
  const panchang = {
    tithi: "Ekadashi",           // TODO: calculate from real ephemeris
    nakshatra: "Rohini",         // TODO: calculate from real ephemeris
    moonSign: moonSignName,       // ✅ REAL from SwissEph
    rahuKaal: "3:00 PM – 4:30 PM"
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-amber-700 font-bold tracking-widest uppercase text-xs"
        >
          ॐ Aligning Planetary Positions...
        </motion.div>
      </div>
    );
  }

  if (chartError) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <p className="text-rose-600 font-bold mb-2">Chart Calculation Error</p>
          <p className="text-sm text-amber-800/60 mb-4">{chartError}</p>
          <button onClick={() => router.push("/onboarding")} className="px-6 py-2 bg-amber-600 text-white rounded-full text-sm font-bold">
            Re-enter Birth Details
          </button>
        </div>
      </div>
    );
  }

  // ── Build real Dasha props from API response ──────────────────────────────
  const realTemporal = realChartData?.temporal;
  const realNarrative = realChartData?.narrative || "Your chart is being read...";
  const realInsights = {
    primary: realChartData?.insights?.primary || "Calculating...",
    caution: realChartData?.insights?.caution || "Stay patient.",
  };
  const realGuidance = {
    do:    realChartData?.guidance?.do    || ["Stay consistent", "Build foundations"],
    avoid: realChartData?.guidance?.avoid || ["Impulsive decisions", "Shortcuts"],
  };

  // ── Real lagna sign for identity display ─────────────────────────────────
  const lagnaSign   = realChartData?.chart?.lagna?.sign ? getSign(realChartData.chart.lagna.sign) : "—";
  const mahadasha   = realTemporal?.stack?.mahadasha || "—";
  const antardasha  = realTemporal?.stack?.antardasha || "—";

  const renderTabContent = () => {
    switch (activeTab) {
      case "Dashas":
        return (
          <div className="pt-4">
            <DashaTimelineView
              temporal={realTemporal || { stack: { mahadasha: "—", antardasha: "—", pratyantar: null }, timing: { pressure: "—", remaining: "—", endsAt: new Date().toISOString() } }}
              narrative={realNarrative}
              insights={realInsights}
              guidance={realGuidance}
            />
          </div>
        );

      case "Ask Pundit":
        return (
          <div className="pt-4">
            <PunditChatView />
          </div>
        );

      case "Transits":
        return (
          <div className="pt-4">
            <TransitsPage chartData={realChartData} />
          </div>
        );

      case "Predictions":
        return (
          <div className="pt-4">
            <PredictionsPage chartData={realChartData} />
          </div>
        );

      case "Remedies":
        return (
          <div className="pt-4">
            <RemediesPage chartData={realChartData} />
          </div>
        );

      case "Kundli":
        return (
          <div className="pt-4">
            <KundliPage chartData={realChartData} />
          </div>
        );

      default: // Dashboard
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-20">
            {/* Left Main Column (65% width on large screens) */}
            <div className="lg:col-span-2 space-y-10 min-w-0">
              {/* Identity & Chapter Anchor */}
              <AstrologyAnchor chartData={realChartData} />

              {/* Current Phase Hero */}
              <CurrentPhaseHero state={state} />

              {/* Timeline Section */}
              <section className="space-y-5">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-amber-900">Planetary Timeline</h3>
                    <p className="text-xs text-amber-700/50">Upcoming planetary periods & their influence</p>
                  </div>
                  <div className="flex gap-2">
                    {(["30D", "90D", "365D"] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-colors ${timeframe === tf ? "bg-amber-600 text-white shadow-sm" : "bg-amber-100 border border-amber-200 text-amber-700 hover:bg-amber-200"}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <TimelineBand windows={state.timeline.windows} />
              </section>

              {/* Planetary Snapshot */}
              <PlanetarySnapshot chartData={realChartData} />

              {/* Momentum / Support Cards */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-serif font-semibold text-amber-900">Life Domain Momentum</h3>
                  <p className="text-xs text-amber-700/50">Vedic support scores across focus areas</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {state.momentum.map((card, i) => (
                    <MomentumCard key={i} {...card} score={isNaN(card.score) ? 60 : card.score} />
                  ))}
                </div>
              </section>
            </div>

            {/* Right Sidebar Column (35% width on large screens) */}
            <div className="space-y-8">
              {/* Transition Alert */}
              <TransitionAlert
                daysRemaining={state.nextTransition.daysRemaining ?? 14}
                from={state.nextTransition.from || "Saturn Mahadasha"}
                to={state.nextTransition.to || "Jupiter Antardasha"}
                intensity={state.nextTransition.intensity ?? 6}
              />

              {/* Score Summary Card (Resilience Metrics) */}
              <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                {/* Subtle Watermark */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 blur-[30px] -mr-6 -mt-6 rounded-full opacity-50" />
                <h4 className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest mb-6">Current Energy Balance</h4>
                <div className="space-y-6">
                  <ScoreBar label="Inner Stability" value={Math.round(state.lifeScores.stability)} />
                  <ScoreBar label="Mental Clarity" value={Math.round(state.lifeScores.clarity)} />
                  <ScoreBar label="Emotional Balance" value={Math.round(100 - state.lifeScores.volatility)} />
                </div>
              </div>

              {/* Chart Confidence Card */}
              <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FFF6E5] border border-amber-200 rounded-2xl p-6 flex flex-col justify-center text-center shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-amber-100/80 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="text-base font-serif font-semibold text-amber-900 mb-1">Chart Confidence</h4>
                <p className="text-3xl font-bold text-amber-600">
                  {isNaN(state.timeline.confidenceScore) ? "85" : Math.round((state.timeline.confidenceScore || 0.85) * 100)}%
                </p>
                <p className="text-xs text-amber-700/50 mt-3 max-w-xs mx-auto leading-relaxed">
                  Based on Dasha-Transit alignment across your birth chart.
                </p>

                {/* AI Insight Strip */}
                <div className="mt-5 p-3.5 bg-white/80 rounded-xl border border-amber-200 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">✦ Pundit Guidance</p>
                  <p className="text-xs text-amber-950 font-serif leading-relaxed italic">
                    This period favors disciplined planning over aggressive expansion. Focus on consolidating relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#3F2D1D] font-sans selection:bg-amber-300/40">

      {/* ====== PANCHANG STRIP ====== */}
      <div className="bg-[#2A1E17] text-[#EDE7DE] text-[11px] font-serif tracking-widest uppercase py-2.5 px-8 flex items-center justify-center gap-8 flex-wrap border-b border-amber-900/10">
        <span className="flex items-center gap-2 font-sans font-semibold text-amber-300">TITHI <span className="text-[#EDE7DE] font-serif font-normal">{panchang.tithi}</span></span>
        <span className="text-amber-600/40">✦</span>
        <span className="flex items-center gap-2 font-sans font-semibold text-amber-300">NAKSHATRA <span className="text-[#EDE7DE] font-serif font-normal">{panchang.nakshatra}</span></span>
        <span className="text-amber-600/40">✦</span>
        <span className="flex items-center gap-2 font-sans font-semibold text-amber-300">MOON SIGN <span className="text-[#EDE7DE] font-serif font-normal">{panchang.moonSign}</span></span>
        <span className="text-amber-600/40">✦</span>
        <span className="flex items-center gap-2 font-sans font-semibold text-amber-300">RAHU KAAL <span className="text-[#EDE7DE] font-serif font-normal font-sans">{panchang.rahuKaal}</span></span>
      </div>

      {/* ====== CHART IDENTITY DEBUG BAR ====== */}
      <div className="bg-emerald-900/90 text-emerald-200 text-[10px] font-mono tracking-widest py-1.5 px-8 flex items-center justify-center gap-6 flex-wrap">
        <span>✅ LIVE CHART</span>
        <span className="text-emerald-400/50">|</span>
        <span>Lagna: <strong className="text-white">{lagnaSign}</strong></span>
        <span className="text-emerald-400/50">|</span>
        <span>Moon: <strong className="text-white">{moonSignName}</strong></span>
        <span className="text-emerald-400/50">|</span>
        <span>MD: <strong className="text-white">{mahadasha}</strong> / AD: <strong className="text-white">{antardasha}</strong></span>
        <span className="text-emerald-400/50">|</span>
        <span>User: <strong className="text-white">{user?.email || "—"}</strong></span>
      </div>

      {/* ====== TOP NAVIGATION ====== */}
      <header className="h-16 border-b border-[#F1E7D0] bg-[#FFFDF8]/90 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-200">
            <span className="text-white text-sm font-bold">ॐ</span>
          </div>
          <span className="text-lg font-serif font-bold text-amber-900">DivyaDrishti</span>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {NAV_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            if (tab === "Ask Pundit") {
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm border ${
                    isSelected
                      ? "bg-[#FFF2D8] text-amber-900 border-amber-400 shadow-inner"
                      : "bg-[#FFFDF4] text-amber-850 border-[#EADFC7] hover:bg-[#FFF5DF] hover:border-amber-400 hover:shadow-md"
                  }`}
                >
                  <span>✨</span>
                  <span>Ask Pundit</span>
                </button>
              );
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "text-amber-800/50 hover:text-amber-800 hover:bg-amber-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(p => !p)}
            className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center shadow-sm hover:border-amber-400 transition-colors"
          >
            <span className="text-xs font-bold text-amber-800">
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-[#F1E7D0] rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-4 border-b border-[#F1E7D0]">
                <p className="text-sm font-semibold text-amber-900 truncate">{user?.name || "—"}</p>
                <p className="text-xs text-amber-700/50 truncate">{user?.email || "—"}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setProfileOpen(false); router.push("/onboarding"); }}
                  className="w-full text-left text-sm text-amber-800/70 hover:text-amber-900 hover:bg-amber-50 rounded-xl px-3 py-2 transition-colors"
                >
                  Edit Birth Details
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm text-rose-600 hover:bg-rose-50 rounded-xl px-3 py-2 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const safeValue = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold text-amber-700/60 uppercase tracking-tighter">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
        />
      </div>
    </div>
  );
}
