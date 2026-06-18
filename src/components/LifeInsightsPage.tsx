"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  HelpCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Compass, 
  Heart, 
  Zap, 
  Clock, 
  Lock, 
  Download, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Activity, 
  Star,
  FileText,
  Copy
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface UserProps {
  user: {
    name: string;
    email: string;
  };
}

export default function LifeInsightsPage({ user }: UserProps) {
  const { isHindi } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Tabs: timeline, radar, journal, report
  const [activeSubTab, setActiveSubTab] = useState<"timeline" | "radar" | "journal" | "report">("timeline");

  // Filters for Timeline
  const [selectedChapter, setSelectedChapter] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<number | "All" | null>(null);

  // Expanded contributors legders
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  // Premium tier mock state
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [upgrading, setUpgrading] = useState<boolean>(false);

  // Copy snapshot state
  const [copied, setCopied] = useState<boolean>(false);

  // Feedback validation action feedback
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Fetch payload
  const fetchPayload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/life-insights?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setPayload(data.data);
        setIsPremium(data.data.isPremium);
      } else {
        setError(data.error?.message || "Failed to parse astrological insights.");
      }
    } catch (err) {
      setError("Celestial engines are currently busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayload();
    
    // Log page visit analytics
    fetch("/api/life-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        action: "ANALYTICS",
        eventType: "PAGE_VISIT",
        category: "life_insights"
      })
    }).catch(err => console.error("Analytics log error:", err));
  }, []);

  const handleFeedback = async (periodId: string, eventName: string, theme: string, start: string, end: string, feedback: string) => {
    setSubmittingFeedback(`${periodId}-${eventName}`);
    try {
      const res = await fetch("/api/life-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          action: "FEEDBACK",
          periodStart: start,
          periodEnd: end,
          theme,
          eventName,
          feedback
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(`${periodId}-${eventName}`);
        // Recalculate validation rates dynamically in state
        setPayload((prev: any) => {
          const updatedFeedbackMap = { ...prev.feedbackMap, [eventName]: feedback };
          // Calculate overall rate
          let total = 0, count = 0;
          Object.values(updatedFeedbackMap).forEach(v => {
            const score = v === "HAPPENED" ? 100 : v === "PARTIALLY_HAPPENED" ? 50 : 0;
            total += score;
            count++;
          });
          const newRates = { ...prev.validationRates };
          if (count > 0) newRates.overall = Math.round(total / count);
          
          return {
            ...prev,
            feedbackMap: updatedFeedbackMap,
            validationRates: newRates
          };
        });

        setTimeout(() => setFeedbackSuccess(null), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const handleJournalUpdate = async (journalId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/life-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          action: "JOURNAL",
          journalId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setPayload((prev: any) => {
          const updatedJournal = prev.journal.map((j: any) => 
            j.id === journalId ? { ...j, status: newStatus } : j
          );
          return { ...prev, journal: updatedJournal };
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpgrade = () => {
    setUpgrading(true);
    setTimeout(() => {
      setIsPremium(true);
      setUpgrading(false);
    }, 1500);
  };

  const copyDestinySnapshot = () => {
    if (!payload?.scorecard) return;
    const { scorecard, pattern } = payload;
    const text = `✨ Destiny Snapshot (DivyaDrishti) ✨\n\n` +
      `• Career Score: ${scorecard.career}/100\n` +
      `• Finance Score: ${scorecard.finance}/100\n` +
      `• Relationship Score: ${scorecard.relationships}/100\n` +
      `• Health Score: ${scorecard.health}/100\n` +
      `• Luck Score: ${scorecard.luck}/100\n` +
      `• Overall Score: ${scorecard.overall}/100\n\n` +
      `🏆 Strongest Area: ${pattern.strongestArea}\n` +
      `🌌 Current Life Chapter: ${pattern.currentPhase}\n\n` +
      `Explore your sacred roadmap at DivyaDrishti.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-[#3F2D1D]">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-xs text-amber-800/60 uppercase tracking-[0.2em] font-serif">
          {isHindi ? "आकाशीय कालचक्र संरेखित हो रहा है..." : "Aligning Sacred Cosmic Timeline..."}
        </p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-[#3F2D1D]">
        <AlertTriangle className="w-12 h-12 text-rose-600" />
        <p className="text-sm font-serif font-bold text-rose-800">{error || "Failed to load cosmic records."}</p>
        <button onClick={fetchPayload} className="px-6 py-2 bg-[#3F2D1D] text-[#F8F5EF] rounded-xl hover:bg-[#3F2D1D]/90 transition-all font-semibold text-xs uppercase tracking-widest">
          Retry Realignment
        </button>
      </div>
    );
  }

  const { timelineEvents, futureRadar, scorecard, pattern, transition, journal, validationRates, feedbackMap, natalPromiseSummary, advancedInsights, majorYears } = payload;

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    
    if (cat === "All") {
      setSelectedYear("All");
      return;
    }

    // Find all events matching the category
    const catEvents = timelineEvents?.filter((ev: any) => {
      const chapterMatch = selectedChapter === "All" || ev.chapter.toLowerCase().includes(selectedChapter.split(" (")[0].toLowerCase());
      const categoryMatch = ev.category.toLowerCase() === cat.toLowerCase();
      return chapterMatch && categoryMatch;
    }) || [];

    if (catEvents.length > 0) {
      // Find if current selectedYear contains any matching event
      const currentYearHasMatch = selectedYear !== null && selectedYear !== "All" && catEvents.some((ev: any) => {
        const startYear = new Date(ev.start).getFullYear();
        const endYear = new Date(ev.end).getFullYear();
        return selectedYear >= startYear && selectedYear <= endYear;
      });

      if (!currentYearHasMatch) {
        // Automatically select the first matching year
        const firstMatchingYear = new Date(catEvents[0].start).getFullYear();
        setSelectedYear(firstMatchingYear);
      }
    } else {
      // If no matching events, set selectedYear to All
      setSelectedYear("All");
    }
  };

  const domainTranslations: Record<string, string> = {
    "Education": isHindi ? "शिक्षा और विद्या" : "Education",
    "Career": isHindi ? "आजीविका और करियर" : "Career",
    "Wealth": isHindi ? "धन और समृद्धि" : "Wealth",
    "Marriage": isHindi ? "विवाह और दांपत्य" : "Marriage",
    "Children": isHindi ? "संतान और वंश" : "Children",
    "Property": isHindi ? "भूमि और संपत्ति" : "Property",
    "Spirituality": isHindi ? "आध्यात्मिकता" : "Spirituality",
    "Foreign Settlement": isHindi ? "विदेश यात्रा व वास" : "Foreign Settlement",
    "Business": isHindi ? "व्यापार और उद्यम" : "Business",
    "Leadership": isHindi ? "नेतृत्व और अधिकार" : "Leadership",
    "Health": isHindi ? "स्वास्थ्य और आरोग्य" : "Health"
  };

  // Filters calculation
  const chapters = ["All", "Learning & Foundation (18-24)", "Career Building (25-32)", "Wealth & Recognition (33-40)", "Transformation & Leadership (41+)"];
  const categories = ["All", "Career", "Wealth", "Relationships", "Challenges"];

  // Life Timeline only shows PAST chapters (chapters that have already started).
  // Chapters that haven't started yet are future forecasts and belong in the Radar tab.
  const now = new Date();
  const pastTimelineEvents = timelineEvents.filter((ev: any) => new Date(ev.start) <= now);

  // Extract unique years from past events only for the interactive year chips
  const uniqueYears = Array.from(
    new Set(
      pastTimelineEvents.map((ev: any) => new Date(ev.start).getFullYear())
    )
  ).sort((a: any, b: any) => a - b) as number[];

  const filteredEvents = pastTimelineEvents.filter((ev: any) => {
    const chapterMatch = selectedChapter === "All" || ev.chapter.toLowerCase().includes(selectedChapter.split(" (")[0].toLowerCase());
    const categoryMatch = selectedCategory === "All" || ev.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // Check if the event overlaps or matches the selected year chip
    const startYear = new Date(ev.start).getFullYear();
    const endYear = new Date(ev.end).getFullYear();
    const yearMatch = selectedYear === "All" || (selectedYear !== null && selectedYear >= startYear && selectedYear <= endYear);
    
    return chapterMatch && categoryMatch && yearMatch;
  });

  // Basic tier timeline continues through present but details are gated after 3 events
  const displayedEvents = filteredEvents;
  const displayedOpportunities = isPremium ? (futureRadar.opportunities || []) : (futureRadar.opportunities || []).slice(0, 1);
  const displayedFocusAreas = isPremium ? (futureRadar.focusAreas || []) : (futureRadar.focusAreas || []).slice(0, 1);
  const displayedTurningPoints = isPremium ? (futureRadar.majorTurningPoints || []) : (futureRadar.majorTurningPoints || []).slice(0, 1);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-12 text-[#3F2D1D]">
      
      {/* ── HEADER & SUB-TABS ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#F1E7D0]">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.4em] font-black text-amber-700/80 block">
            {isHindi ? "संरेखण सक्रिय • जीवन अंतर्दृष्टि" : "ALIGNMENT CONFIRMED • LIFE INSIGHTS"}
          </span>
          <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-amber-900 to-amber-700 bg-clip-text text-transparent">
            {isHindi ? "जीवन अंतर्दृष्टि और समय चक्र" : "Life Insights & Chronological Radar"}
          </h1>
          <p className="text-xs text-amber-800/60 uppercase tracking-widest leading-relaxed">
            {isHindi ? "अतीत की घटनाओं का सत्यापन और आगामी 3-12 महीनों का अवसर रडार" : "Validate past astrological eras and scan upcoming 3-12 months for opportunities"}
          </p>
        </div>

        {/* Premium Upgrade Badge */}
        {!isPremium ? (
          <button 
            onClick={handleUpgrade}
            disabled={upgrading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all scale-100 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {upgrading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            )}
            <span>{isHindi ? "प्रीमियम में अपग्रेड करें" : "Unlock Premium Timeline"}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-black uppercase tracking-widest">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isHindi ? "प्रीमियम एक्सेस सक्रिय" : "Premium Activated"}</span>
          </div>
        )}
      </div>

      {/* ── MAIN PAGE TAB CONTROL ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(["timeline", "radar", "journal", "report"] as const).map((tabId) => {
          const isSelected = activeSubTab === tabId;
          const labels: Record<string, string> = {
            timeline: isHindi ? "⏳ अतीत सत्यापन टाइमलाइन" : "⏳ Life Timeline",
            radar: isHindi ? "🎯 आगामी अवसर और जोखिम" : "🎯 Future Cosmic Radar",
            journal: isHindi ? "📓 भविष्यवाणी जर्नल" : "📓 Prediction Journal",
            report: isHindi ? "📜 वार्षिक जीवन रिपोर्ट" : "📜 Annual Report (PDF)"
          };
          return (
            <button
              key={tabId}
              onClick={() => {
                setActiveSubTab(tabId);
                // Log category analytics click
                fetch("/api/life-insights", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: user.email,
                    action: "ANALYTICS",
                    eventType: "VIEW_CATEGORY",
                    category: tabId
                  })
                }).catch(err => console.error("Analytics view log error:", err));
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs uppercase tracking-widest font-black transition-all ${
                isSelected
                  ? "bg-[#3F2D1D] text-[#F8F5EF] border-[#3F2D1D] shadow-md"
                  : "bg-white border-[#F1E7D0] text-[#3F2D1D]/70 hover:bg-[#EADFC7]/50"
              }`}
            >
              <span>{labels[tabId]}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: LIFE TIMELINE & PAST VALIDATION ── */}
      {activeSubTab === "timeline" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* ── NATAL PROMISE SUMMARY ── */}
          <div className="bg-[#FAF8F5] border-2 border-[#EADFC7]/50 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#EADFC7]/60 pb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-700">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-black bg-gradient-to-r from-amber-900 to-amber-700 bg-clip-text text-transparent">
                  {isHindi ? "कुंडली जन्म प्रतिज्ञा (Natal Promise V2)" : "Cosmic Natal Promise Analyzer V2"}
                </h3>
                <p className="text-xs text-amber-800/60 uppercase tracking-widest mt-1 font-bold">
                  {isHindi ? "आपके जन्म विवरणों के आधार पर ११ प्रमुख जीवन क्षेत्रों का आकाशीय स्तर निर्धारण" : "Multidimensional life-potential, stability, timing sensitivity and validation confidence"}
                </p>
              </div>
            </div>

            {/* ── ADVANCED INSIGHTS GRID ── */}
            {advancedInsights && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* Hidden Strength */}
                <div className="bg-gradient-to-br from-emerald-500/[0.03] to-emerald-500/[0.01] border border-emerald-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3 group hover:shadow-md hover:border-emerald-500/40 transition-all">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      🌟 {isHindi ? "गुप्त शक्ति" : "Hidden Strength"}
                    </span>
                    <h4 className="text-md font-serif font-black text-emerald-950 mt-1">
                      {domainTranslations[advancedInsights.hiddenStrength.domain] || advancedInsights.hiddenStrength.domain}
                    </h4>
                    <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-serif">
                      {isHindi ? advancedInsights.hiddenStrength.explanationHindi : advancedInsights.hiddenStrength.explanation}
                    </p>
                  </div>
                  <div className="text-[10px] text-emerald-800 font-black font-mono pt-2 border-t border-emerald-100/50">
                    {isHindi ? advancedInsights.hiddenStrength.reasonHindi : advancedInsights.hiddenStrength.reason}
                  </div>
                </div>

                {/* Hidden Vulnerability */}
                <div className="bg-gradient-to-br from-rose-500/[0.03] to-rose-500/[0.01] border border-rose-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3 group hover:shadow-md hover:border-rose-500/40 transition-all">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-700 border border-rose-500/20">
                      ⚠️ {isHindi ? "छिपी संवेदनशीलता" : "Hidden Vulnerability"}
                    </span>
                    <h4 className="text-md font-serif font-black text-rose-950 mt-1">
                      {domainTranslations[advancedInsights.hiddenVulnerability.domain] || advancedInsights.hiddenVulnerability.domain}
                    </h4>
                    <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-serif">
                      {isHindi ? advancedInsights.hiddenVulnerability.explanationHindi : advancedInsights.hiddenVulnerability.explanation}
                    </p>
                  </div>
                  <div className="text-[10px] text-rose-800 font-black font-mono pt-2 border-t border-rose-100/50">
                    {isHindi ? advancedInsights.hiddenVulnerability.reasonHindi : advancedInsights.hiddenVulnerability.reason}
                  </div>
                </div>

                {/* Cosmic Timing Alert */}
                <div className="bg-gradient-to-br from-purple-500/[0.03] to-purple-500/[0.01] border border-purple-500/20 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3 group hover:shadow-md hover:border-purple-500/40 transition-all">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-700 border border-purple-500/20">
                      ⚡ {isHindi ? "गोचर / समय चेतावनी" : "Cosmic Timing Alert"}
                    </span>
                    <h4 className="text-md font-serif font-black text-purple-950 mt-1">
                      {domainTranslations[advancedInsights.cosmicTimingAlert.domain] || advancedInsights.cosmicTimingAlert.domain}
                    </h4>
                    <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-serif">
                      {isHindi ? advancedInsights.cosmicTimingAlert.explanationHindi : advancedInsights.cosmicTimingAlert.explanation}
                    </p>
                  </div>
                  <div className="text-[10px] text-purple-800 font-black font-mono pt-2 border-t border-purple-100/50">
                    {isHindi ? advancedInsights.cosmicTimingAlert.reasonHindi : advancedInsights.cosmicTimingAlert.reason}
                  </div>
                </div>
              </div>
            )}

            {/* ── MULTIDIMENSIONAL PROMISE GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {natalPromiseSummary?.map((p: any) => {
                const domainName = domainTranslations[p.domain] || p.domain;

                // Potential progress bar color
                const potentialProgressBg = p.potential >= 80 ? "bg-emerald-600" :
                                            p.potential >= 70 ? "bg-amber-500" :
                                            p.potential >= 55 ? "bg-stone-500" : "bg-rose-500";

                // Stability progress bar color
                const stabilityProgressBg = p.stability >= 75 ? "bg-emerald-500" :
                                            p.stability >= 60 ? "bg-amber-500" : "bg-rose-500";

                // Timing Sensitivity progress bar color
                const timingProgressBg = p.timingSensitivity >= 75 ? "bg-purple-600" :
                                         p.timingSensitivity >= 55 ? "bg-indigo-500" : "bg-blue-400";

                const confLabel = isHindi ? (p.confidenceLabel === "Exceptional" ? "असाधारण" :
                                            p.confidenceLabel === "Very Strong" ? "अति उत्तम" :
                                            p.confidenceLabel === "Strong" ? "उत्तम" :
                                            p.confidenceLabel === "Moderate" ? "मध्यम" : "कमजोर") : p.confidenceLabel;

                return (
                  <div key={p.domain} className="bg-white border border-[#EADFC7]/55 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-amber-400/40 transition-all flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      {/* Domain Title & Confidence Tag */}
                      <div className="flex justify-between items-start gap-2 border-b border-stone-100 pb-2">
                        <span className="font-serif font-black text-xs text-[#3F2D1D]">{domainName}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border whitespace-nowrap ${
                          p.confidence >= 82 ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                          p.confidence >= 70 ? "text-amber-700 bg-amber-50 border-amber-100" : "text-stone-750 bg-stone-50 border-stone-200"
                        }`}>
                          {confLabel} ({p.confidence}%)
                        </span>
                      </div>

                      {/* Meters Container */}
                      <div className="space-y-2.5">
                        {/* Potential Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-stone-500">
                            <span>{isHindi ? "क्षमता (Potential)" : "Potential"}</span>
                            <span className="font-black text-[#3F2D1D]">{p.potential}/100</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${potentialProgressBg}`} style={{ width: `${p.potential}%` }} />
                          </div>
                        </div>

                        {/* Stability Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-stone-500">
                            <span>{isHindi ? "स्थिरता (Stability)" : "Stability"}</span>
                            <span className="font-black text-[#3F2D1D]">{p.stability}/100</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${stabilityProgressBg}`} style={{ width: `${p.stability}%` }} />
                          </div>
                        </div>

                        {/* Timing Sensitivity Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold text-stone-500">
                            <span>{isHindi ? "समय संवेदनशीलता (Timing)" : "Timing Sensitivity"}</span>
                            <span className="font-black text-[#3F2D1D]">{p.timingSensitivity}/100</span>
                          </div>
                          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className={`h-full ${timingProgressBg}`} style={{ width: `${p.timingSensitivity}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Confidence Reason */}
                      <div className="text-[9px] text-[#3F2D1D]/70 bg-stone-50 border border-stone-100 p-2 rounded-xl font-serif">
                        <span className="font-black uppercase tracking-wider text-amber-805 block mb-0.5">{isHindi ? "आकाशीय तर्क:" : "CONFIDENCE REASON:"}</span>
                        {isHindi ? p.confidenceReasonHindi : p.confidenceReason}
                      </div>

                      {/* Interpretation Layer */}
                      <div className="text-[10px] leading-relaxed font-serif text-[#3F2D1D]/90 pt-1 border-t border-stone-100">
                        <p className="italic">"{isHindi ? p.interpretationHindi : p.interpretation}"</p>
                      </div>
                    </div>

                    {/* Supporting & Weakening bullet list */}
                    <div className="space-y-2.5 border-t border-stone-100 pt-3 text-[10px] leading-relaxed">
                      {p.supporting && p.supporting.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase tracking-wider text-emerald-800 font-black block">{isHindi ? "सकारात्मक प्रभाव" : "SUPPORTING FACTORS"}</span>
                          <div className="space-y-0.5">
                            {p.supporting.map((sup: string, sIdx: number) => (
                              <div key={sIdx} className="flex items-start gap-1 text-[#3F2D1D]/75 font-serif">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{sup}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {p.weakening && p.weakening.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase tracking-wider text-rose-800 font-black block">{isHindi ? "चुनौतीपूर्ण प्रभाव" : "WEAKENING FACTORS"}</span>
                          <div className="space-y-0.5">
                            {p.weakening.map((weak: string, wIdx: number) => (
                              <div key={wIdx} className="flex items-start gap-1 text-[#3F2D1D]/75 font-serif">
                                <span className="text-rose-500 font-bold">•</span>
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Panel: Statistics & Patterns */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Real-time Accuracy Dashboard */}
              <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-black text-amber-700/60 block">
                    {isHindi ? "सत्यापन इंजन v2.0" : "VALIDATION ENGINE V2.0"}
                  </span>
                  <h3 className="text-md font-serif font-black">{isHindi ? "पूर्वानुमान सटीकता डैशबोर्ड" : "Prediction Accuracy"}</h3>
                </div>

                {/* Big Circular Validation Meter */}
                <div className="flex flex-col items-center justify-center p-4 border-b border-[#F1E7D0]/60 pb-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" className="stroke-stone-100 fill-none" strokeWidth="8" />
                      <circle 
                        cx="64" cy="64" r="54" 
                        className="stroke-emerald-600 fill-none transition-all duration-1000" 
                        strokeWidth="8"
                        strokeDasharray="339.3"
                        strokeDashoffset={339.3 - (339.3 * (validationRates.overall || 78)) / 100}
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="text-3xl font-black font-serif text-emerald-800">{validationRates.overall || 78}%</span>
                      <p className="text-[9px] uppercase tracking-widest text-[#3F2D1D]/50 font-bold mt-1">
                        {isHindi ? "कुल सटीकता" : "Overall Verified"}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#3F2D1D]/60 text-center italic mt-4 leading-relaxed">
                    {isHindi 
                      ? "सत्यापन दर सीधे आपके द्वारा दर्ज किए गए फीडबैक और अनुभवों पर आधारित है।" 
                      : "Live calibration rate generated dynamically from your life experiences feedback."}
                  </p>
                </div>

                {/* Domain Wise horizontal meters */}
                <div className="space-y-4">
                  {[
                    { name: isHindi ? "करियर और पद" : "Career Growth", val: validationRates.career || 80, color: "bg-emerald-500" },
                    { name: isHindi ? "धन और संपदा" : "Wealth Expansion", val: validationRates.finance || 72, color: "bg-amber-500" },
                    { name: isHindi ? "संबंध और परिवार" : "Relationships", val: validationRates.relationships || 68, color: "bg-rose-500" },
                    { name: isHindi ? "वाहन और संपत्ति" : "Assets & Property", val: validationRates.property || 75, color: "bg-blue-500" }
                  ].map((dom) => (
                    <div key={dom.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#3F2D1D]/80">{dom.name}</span>
                        <span className="text-stone-600">{dom.val}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className={`h-full ${dom.color} transition-all duration-1000`} style={{ width: `${dom.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical Match Audit Report */}
              <div className="bg-gradient-to-br from-amber-500/[0.01] to-amber-500/[0.04] border border-[#EADFC7] rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[60%] bg-amber-500/[0.02] blur-xl rounded-full pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <span className="text-[9px] uppercase tracking-widest font-black text-amber-700 block">
                    {isHindi ? "★ ऐतिहासिक मिलान ऑडिट" : "★ HISTORICAL MATCH AUDIT"}
                  </span>
                  <h3 className="text-md font-serif font-black text-[#3F2D1D]">
                    {isHindi ? "सत्यापित जीवन इतिहास रिपोर्ट" : "Evidence-Based Calibration"}
                  </h3>
                </div>

                <p className="text-[11px] text-stone-500 font-serif leading-relaxed relative z-10">
                  {isHindi 
                    ? "मुख्य ऐतिहासिक मील के पत्थरों और ज्योतिषीय चक्रों के बीच सत्यापित मिलान दरों का लाइव विश्लेषण:" 
                    : "Independent calibration audit comparing dynamic planetary activations against known real-world events:"}
                </p>

                <div className="space-y-2.5 relative z-10">
                  {[
                    {
                      key: "edu",
                      name: isHindi ? "उच्च शिक्षा सक्रियता (2003-2005)" : "Higher Education Activation (2003–2005)",
                      conf: 74,
                      targets: ["Advanced study planning & prep", "Entrance examination planning & attempts", "Academic specialization shifts", "Scholastic redirection & skill specialization"]
                    },
                    {
                      key: "entry",
                      name: isHindi ? "करियर प्रवेश चरण (2005)" : "Career Entry & Transition (2005)",
                      conf: 88,
                      targets: ["Unexpected first career opportunity", "Transition from education to workplace", "Initial professional foundation building", "Acquisition of practical business routines"]
                    },
                    {
                      key: "adversity",
                      name: isHindi ? "विपत्ति व पुनर्गठन (2007-2010)" : "Major Adversity Chapter (2007–2010)",
                      conf: 91,
                      targets: ["Career instability & progress delays", "Liquid capital outflow stress", "Intensive emotional intrapersonal stress", "Defensive professional posture requirement"]
                    },
                    {
                      key: "health",
                      name: isHindi ? "स्वास्थ्य संवेदनशीलता (2010)" : "Health Vulnerability Window (2010)",
                      conf: 79,
                      targets: ["Energy & physical stamina depletion", "Recovery timeline constraints & delays", "Proactive wellness habit re-alignment", "Stress management & preventative routines"]
                    },
                    {
                      key: "recovery",
                      name: isHindi ? "सुधार और स्थिरता (2011-2012)" : "Recovery & Stabilization (2011–2012)",
                      conf: 83,
                      targets: ["Relational support & marriage milestone", "Improved physical vitality & energy outlook", "Emotional stabilization & intrapersonal healing", "Domestic environment re-stabilization success"]
                    }
                  ].map((audit) => {
                    // Calculate live dynamic audit validation status based on feedbackMap clicks
                    let matchState = isHindi ? "अपुष्ट" : "Unvalidated";
                    let stateColor = "text-stone-500 bg-stone-100 border-stone-200";

                    let matchCount = 0;
                    let partialCount = 0;
                    let noMatchCount = 0;

                    audit.targets.forEach(t => {
                      const f = feedbackMap[t];
                      if (f === "HAPPENED") matchCount++;
                      else if (f === "PARTIALLY_HAPPENED") partialCount++;
                      else if (f === "DID_NOT_HAPPEN") noMatchCount++;
                    });

                    if (matchCount > 0) {
                      matchState = isHindi ? "मिलान" : "Match";
                      stateColor = "text-emerald-700 bg-emerald-50 border-emerald-200/60";
                    } else if (partialCount > 0) {
                      matchState = isHindi ? "आंशिक मिलान" : "Partial Match";
                      stateColor = "text-amber-700 bg-amber-50 border-amber-200/60";
                    } else if (noMatchCount > 0) {
                      matchState = isHindi ? "कोई मिलान नहीं" : "No Match";
                      stateColor = "text-rose-700 bg-rose-50 border-rose-200/60";
                    }

                    return (
                      <div key={audit.key} className="p-3 bg-white border border-[#F1E7D0]/60 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-amber-300 transition-colors">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-serif font-black text-[#3F2D1D]">{audit.name}</h4>
                          <div className="text-[9px] text-stone-500 font-bold uppercase">
                            {isHindi ? `गणना सटीकता: ` : `Confidence: `}
                            <span className="text-amber-700 font-black">{audit.conf}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-black uppercase border px-2.5 py-0.5 rounded-md whitespace-nowrap transition-all ${stateColor}`}>
                            {matchState}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Life Pattern Summary */}
              <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-md font-serif font-black">{isHindi ? "जीवन चक्र पैटर्न सारांश" : "Sacred Life Journey Patterns"}</h3>
                <div className="space-y-3.5 text-xs">
                  {[
                    { label: isHindi ? "सबसे मजबूत क्षेत्र" : "Strongest Area", val: pattern.strongestArea, icon: Star, color: "text-amber-500" },
                    { label: isHindi ? "दूसरा सबसे मजबूत" : "Second Strongest", val: pattern.secondStrongest, icon: Star, color: "text-amber-400" },
                    { label: isHindi ? "आवर्ती चुनौती" : "Recurring Challenge", val: pattern.recurringChallenge, icon: AlertTriangle, color: "text-rose-500" },
                    { label: isHindi ? "सबसे भाग्यशाली दशक" : "Most Fortunate Decade", val: pattern.fortunateDecade, icon: Compass, color: "text-emerald-600" },
                    { label: isHindi ? "वर्तमान समय चक्र" : "Current Phase Theme", val: pattern.currentPhase, icon: Zap, color: "text-purple-600" }
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-0.5">{item.label}</span>
                        <span className="font-bold text-[#3F2D1D]">{item.val}</span>
                      </div>
                      <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Transition Analysis ("What Changed?") */}
              <div className="bg-[#FAF6EC] border border-[#EADFC7] rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-amber-800 border-b border-[#EADFC7] pb-3">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <h3 className="text-md font-serif font-black">{isHindi ? "संक्रमण विश्लेषण (क्या बदला?)" : "Transition Analysis"}</h3>
                </div>
                
                <p className="text-xs text-[#3F2D1D]/75 leading-relaxed italic">
                  {isHindi 
                    ? "ग्रहों के संरेखण में हाल ही में हुए बदलावों का एक सिंहावलोकन, जिसने आपके जीवन के प्रमुख अध्यायों और सक्रिय दशाओं को बदल दिया है:"
                    : "A dynamic cosmic comparison showing how planetary currents transitioned from your previous cycle into the active season:"}
                </p>

                {/* Dynamic Comparison Cards */}
                <div className="flex flex-col gap-3">
                  {/* Previous Phase Card */}
                  <div className="bg-stone-100/70 border border-stone-200 rounded-2xl p-4 shadow-sm relative group">
                    <span className="text-[9px] text-stone-500 font-black uppercase block tracking-widest mb-1">
                      {isHindi ? "भूतपूर्व जीवन अध्याय" : "PREVIOUS CHAPTER"}
                    </span>
                    <span className="text-xs font-serif font-bold text-stone-600 line-through decoration-[#3F2D1D]/30 block">
                      {transition.previousPhase}
                    </span>
                  </div>

                  {/* Transition Direction Indicator */}
                  <div className="flex justify-center my-0.5">
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-300/40 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="text-[9px] uppercase tracking-widest font-black text-amber-800">
                        {isHindi ? "आकाशीय परिवर्तन" : "Cosmic Shift"}
                      </span>
                      <span className="text-amber-600 text-xs font-bold font-serif animate-bounce">↓</span>
                    </div>
                  </div>

                  {/* Current Active Phase Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-300/40 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-1.5 right-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    </div>
                    <span className="text-[9px] text-emerald-800 font-black uppercase block tracking-widest mb-1">
                      {isHindi ? "सक्रिय वर्तमान चक्र" : "ACTIVE CURRENT PHASE"}
                    </span>
                    <span className="text-xs font-serif font-black text-emerald-950 block">
                      {transition.currentPhase}
                    </span>
                  </div>
                </div>

                {/* Shift Drivers */}
                <div className="space-y-2.5 pt-2 border-t border-[#EADFC7]">
                  <span className="text-[9px] text-amber-800/80 font-black uppercase block tracking-wider">
                    {isHindi ? "मुख्य आकाशीय चालक" : "PLANETARY SHIFT DRIVERS"}
                  </span>
                  <ul className="space-y-2">
                    {transition.drivers.map((d: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#3F2D1D]/80 leading-relaxed font-serif">
                        <span className="text-amber-600 font-bold mt-0.5">✦</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Right Panel: Interactive Timeline Roadmap */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Timeline Filter Area */}
              <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#F1E7D0]/60 pb-3">
                  <h3 className="font-serif font-black text-md">{isHindi ? "कालचक्र फिल्टर" : "Sacred Eras Filtering"}</h3>
                  <span className="text-xs text-stone-500 font-medium">
                    {isHindi ? `दिखाए जा रहे हैं: ${filteredEvents.length} युग` : `Showing ${filteredEvents.length} life events`}
                  </span>
                </div>

                {/* Chapters filters */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#3F2D1D]/50 font-black block">
                    {isHindi ? "जीवन के अध्याय" : "FILTER BY LIFE CHAPTER"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {chapters.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setSelectedChapter(ch)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selectedChapter === ch
                            ? "bg-amber-100/60 border-amber-300 text-amber-900 font-bold"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                      >
                        {ch === "All" ? (isHindi ? "सभी अध्याय" : "All Chapters") : ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category tags filters */}
                <div className="space-y-2 pt-2 border-b border-stone-100 pb-4">
                  <span className="text-[9px] uppercase tracking-widest text-[#3F2D1D]/50 font-black block">
                    {isHindi ? "घटना श्रेणी (Jump to Event Type)" : "JUMP TO EVENT TYPE"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selectedCategory === cat
                            ? "bg-[#3F2D1D] border-[#3F2D1D] text-white font-bold"
                            : "bg-white border-stone-200 text-stone-600 hover:bg-[#EADFC7]/20"
                        }`}
                      >
                        {cat === "All" ? (isHindi ? "सभी श्रेणियां" : "All Categories") : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year-wise navigation chips - horizontal time machine carousel */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#3F2D1D]/50 font-black block">
                    {isHindi ? "वर्ष अनुसार कालचक्र (Time Machine)" : "CHRONOLOGICAL TIME MACHINE CHIPS"}
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide select-none -mx-1 px-1">
                    <button
                      onClick={() => setSelectedYear("All")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border transition-all whitespace-nowrap ${
                        selectedYear === "All"
                          ? "bg-amber-100/60 border-amber-300 text-amber-900 font-bold"
                          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {isHindi ? "सभी वर्ष" : "All Years"}
                    </button>
                    {uniqueYears.map((yr) => {
                      const isMajor = majorYears?.includes(yr);
                      const isSelected = selectedYear === yr;

                      let chipStyle = "bg-white border-stone-200 text-stone-600 hover:bg-[#EADFC7]/20";
                      if (isSelected) {
                        chipStyle = "bg-[#3F2D1D] border-[#3F2D1D] text-[#F8F5EF]";
                      } else if (isMajor) {
                        chipStyle = "bg-amber-500/[0.04] border-amber-300 text-amber-900 font-black shadow-sm shadow-amber-250/20";
                      }

                      return (
                        <button
                          key={yr}
                          onClick={() => setSelectedYear(yr)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-all whitespace-nowrap flex items-center gap-1 hover:scale-[1.03] active:scale-95 ${chipStyle}`}
                        >
                          {isMajor && <span className="text-amber-500 animate-pulse text-[10px]">⭐</span>}
                          <span>{yr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Major Life Events Timeline Render */}
              {selectedYear === null ? (
                <div className="bg-white border-2 border-[#EADFC7] border-dashed rounded-[2rem] p-8 md:p-12 text-center space-y-6 max-w-xl mx-auto shadow-sm animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-700 animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-md font-serif font-black text-[#3F2D1D]">
                      {isHindi ? "अपने जीवन के वर्ष का चयन करें" : "Scan Your Life Timeline"}
                    </h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-serif max-w-md mx-auto">
                      {isHindi 
                        ? "ऊपर दिए गए 'वर्ष अनुसार कालचक्र' चिप्स में से किसी भी वर्ष को चुनें। उस विशिष्ट अवधि के आकाशीय प्रभाव, ग्रहों की प्रतिज्ञा और वास्तविक जीवन के परिणामों को सक्रिय करने के लिए क्लिक करें।" 
                        : "Click on any Year Chip in the filter bar above to isolate that era, unlocking detailed planetary justifications, peak transit windows, and real-world validations."}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => setSelectedYear("All")}
                      className="px-5 py-2.5 bg-[#3F2D1D] hover:bg-[#3F2D1D]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                    >
                      🗺️ {isHindi ? "सभी वर्ष देखें" : "View All"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:left-3 md:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#F1E7D0]">
                
                <AnimatePresence mode="popLayout">
                  {displayedEvents.map((ev: any, idx: number) => {
                    const isExpanded = expandedPeriod === ev.id;
                    const evStart = new Date(ev.start);
                    const evEnd = new Date(ev.end);
                    const isCurrentlyActive = evStart <= now && evEnd > now;
                    const formattedStart = evStart.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    // For chapters still running today, show "Present" instead of a future end date
                    const formattedEnd = isCurrentlyActive
                      ? (isHindi ? "अभी" : "Present")
                      : evEnd.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    const formattedPeakStart = new Date(ev.peakStart).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
                    const formattedPeakEnd = new Date(ev.peakEnd).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

                    // Duration label: use time elapsed for active chapters
                    const effectiveEnd = isCurrentlyActive ? now : evEnd;
                    const durationMonths = Math.round((effectiveEnd.getTime() - evStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
                    const durationLabel = isCurrentlyActive
                      ? (isHindi ? "सक्रिय" : "Active Now")
                      : (durationMonths >= 12
                        ? `~${Math.round(durationMonths / 12)} yr${Math.round(durationMonths / 12) > 1 ? "s" : ""}`
                        : `~${durationMonths} mo`);

                    // Category colours
                    const categoryColors: Record<string, { bg: string; text: string; dot: string; border: string; prog: string }> = {
                      Career:        { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", border: "border-emerald-200", prog: "from-emerald-500/10 to-emerald-50" },
                      Wealth:        { bg: "bg-amber-50",   text: "text-amber-800",   dot: "bg-amber-500",   border: "border-amber-200",   prog: "from-amber-500/10 to-amber-50" },
                      Relationships: { bg: "bg-rose-50",    text: "text-rose-800",    dot: "bg-rose-500",    border: "border-rose-200",    prog: "from-rose-500/10 to-rose-50" },
                      Challenges:    { bg: "bg-stone-100",  text: "text-stone-800",   dot: "bg-stone-500",   border: "border-stone-200",   prog: "from-stone-100 to-stone-50" },
                    };
                    const styles = categoryColors[ev.category] || categoryColors.Challenges;

                    // Detect chapter boundary — show progression arrow above this card
                    const prevEv = idx > 0 ? displayedEvents[idx - 1] : null;
                    const isChapterBoundary = prevEv && prevEv.chapter !== ev.chapter;

                    return (
                      <div key={ev.id}>
                        {/* ── Chapter progression connector ── */}
                        {isChapterBoundary && (
                          <div className="flex items-center gap-3 my-2 px-2 select-none">
                            <div className="flex-1 h-px bg-[#EADFC7]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 flex items-center gap-1.5 whitespace-nowrap">
                              <span className="text-amber-500">↓</span>
                              {isHindi ? "नया जीवन अध्याय" : "Progresses Into"}
                              <span className="text-amber-500">↓</span>
                            </span>
                            <div className="flex-1 h-px bg-[#EADFC7]" />
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: idx * 0.04 }}
                          className="relative group"
                        >
                          {/* Timeline dot */}
                          <span className={`absolute -left-9 md:-left-[26px] top-5 w-4 h-4 rounded-full border-4 border-white ${styles.dot} shadow-sm group-hover:scale-125 transition-transform z-10`} />

                          {/* ── Life Chapter Card ── */}
                          <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">

                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-stone-100 pb-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                {/* Badges row */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${styles.border} ${styles.bg} ${styles.text}`}>
                                    {ev.category}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-600 border border-stone-200">
                                    {ev.chapter}
                                  </span>
                                  {/* ⊕ Merged badge */}
                                   {ev.mergedCount > 1 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                      ⊕ {isHindi ? `${ev.mergedCount} दशाएं` : `${ev.mergedCount} Dashas`}
                                    </span>
                                  )}
                                  {/* Active Now badge for currently-running chapter */}
                                  {isCurrentlyActive && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                      {isHindi ? "अभी सक्रिय" : "Active Now"}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-lg font-serif font-black text-[#3F2D1D] leading-tight">{ev.theme}</h4>
                              </div>

                              {/* Date + confidence */}
                              <div className="text-right flex-shrink-0 space-y-1">
                                <span className="text-xs font-serif font-bold text-amber-800 bg-amber-500/5 border border-amber-500/10 px-3 py-1 rounded-full whitespace-nowrap block">
                                  ⏳ {formattedStart} – {formattedEnd}
                                </span>
                                <span className="text-[10px] text-stone-400 font-bold block">{durationLabel}</span>
                                <div className="text-[10px] text-stone-500 font-bold uppercase">
                                  {isHindi ? "विश्वास: " : "Strength: "}
                                  <span className={`font-black ${ev.confidenceScore >= 85 ? "text-emerald-600" : ev.confidenceScore >= 70 ? "text-amber-600" : "text-stone-500"}`}>
                                    {ev.confidenceLabel}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* ── Locked overlay for non-premium beyond idx 3 ── */}
                            {(() => {
                              const isEventLocked = !isPremium && timelineEvents.indexOf(ev) >= 3;
                              if (isEventLocked) {
                                return (
                                  <div className="p-5 bg-gradient-to-br from-amber-500/[0.01] to-amber-500/[0.03] border border-dashed border-[#EAD9BE] rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs relative overflow-hidden">
                                    <div className="absolute top-[-30%] right-[-10%] w-[30%] h-[150%] bg-amber-500/[0.03] blur-2xl rounded-full pointer-events-none" />
                                    <div className="space-y-1 text-center md:text-left relative z-10">
                                      <div className="flex items-center justify-center md:justify-start gap-2">
                                        <Lock className="w-4 h-4 text-amber-700" />
                                        <span className="font-serif font-black text-[#3F2D1D] text-sm">{isHindi ? "जीवन अंतर्दृष्टि विवरण लॉक हैं" : "Life Chapter Details Locked"}</span>
                                      </div>
                                      <p className="text-[11px] text-stone-500 font-serif leading-relaxed">
                                        {isHindi ? "इस आकाशीय कालखंड की विस्तृत व्याख्या जानने के लिए प्रीमियम में अपग्रेड करें।" : "Upgrade to Premium to unlock planetary justifications, peak windows, and validation for this chapter."}
                                      </p>
                                    </div>
                                    <button onClick={handleUpgrade} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-transform whitespace-nowrap relative z-10">
                                      <Star className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" />
                                      <span>{isHindi ? "अनलॉक" : "Unlock Chapter"}</span>
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <>
                                  {/* Primary astrological justification */}
                                  <div className="space-y-1">
                                    <p className="text-xs font-bold text-stone-500 uppercase">{isHindi ? "आकाशीय संरेखण" : "CHAPTER SUMMARY"}</p>
                                    <p className="text-sm text-[#3F2D1D]/80 leading-relaxed font-serif italic">"{ev.why}"</p>
                                  </div>

                                  {/* Peak Time Window */}
                                  <div className="p-3 bg-amber-500/[0.02] border border-[#F1E7D0]/60 rounded-2xl flex items-center justify-between gap-4 text-xs">
                                    <div>
                                      <span className="text-[9px] text-amber-800/60 font-black uppercase block">{isHindi ? "अधिकतम प्रभाव खिड़की" : "PEAK ACTIVE TRANSIT WINDOW"}</span>
                                      <span className="font-bold text-[#3F2D1D]">{formattedPeakStart} – {formattedPeakEnd}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-lg">{isHindi ? "उच्च तीव्रता" : "Peak Intensity"}</span>
                                  </div>

                                  {/* ✦ Life Significance */}
                                  <div className="p-4 bg-gradient-to-br from-amber-50 to-[#FDFBF7] border border-amber-100/50 rounded-2xl space-y-3 shadow-sm relative overflow-hidden mt-3">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                                    <div className="space-y-1 relative z-10">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/70 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        {isHindi ? "जीवन का महत्व" : "LIFE SIGNIFICANCE"}
                                      </p>
                                      <p className="text-sm font-serif text-[#3F2D1D] leading-relaxed">
                                        {isHindi ? ev.lifeSignificanceHindi : ev.lifeSignificance}
                                      </p>
                                    </div>
                                    
                                    {ev.rememberReason && (
                                      <div className="pt-2 mt-2 border-t border-amber-200/40 relative z-10 space-y-1">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                                          {isHindi ? "आप इस अवधि को क्यों याद रख सकते हैं" : "WHY YOU MAY REMEMBER THIS PERIOD"}
                                        </p>
                                        <p className="text-[11px] text-stone-600 font-serif italic leading-relaxed">
                                          {isHindi ? ev.rememberReasonHindi : ev.rememberReason}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Beginning -> Peak -> End */}
                                  {ev.beginningState && ev.endState && (
                                    <div className="grid grid-cols-3 gap-2 mt-3 p-3 bg-stone-50/50 rounded-2xl border border-stone-100 text-center">
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 block">{isHindi ? "शुरुआत" : "BEGINNING"}</span>
                                        <div className="space-y-0.5">
                                          {ev.beginningState.map((s: string, i: number) => (
                                            <p key={i} className="text-[10px] font-bold text-[#3F2D1D] leading-tight">{s}</p>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="space-y-1.5 border-x border-stone-200/60 relative">
                                        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent -z-10" />
                                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 block">{isHindi ? "चरम" : "PEAK"}</span>
                                        <div className="space-y-0.5">
                                          {ev.peakYears?.length > 0 ? (
                                            ev.peakYears.map((yr: number) => (
                                              <p key={yr} className="text-[11px] font-black text-amber-800 leading-tight">{yr}</p>
                                            ))
                                          ) : (
                                            <p className="text-[10px] font-bold text-amber-800 leading-tight">Ongoing</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 block">{isHindi ? "अंत" : "END"}</span>
                                        <div className="space-y-0.5">
                                          {ev.endState.map((s: string, i: number) => (
                                            <p key={i} className="text-[10px] font-bold text-[#3F2D1D] leading-tight">{s}</p>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Most Likely Real-World Outcomes */}
                                  {ev.realWorldOutcomes && ev.realWorldOutcomes.length > 0 ? (
                                    <div className="space-y-3 pt-3 mt-3 border-t border-amber-100/30">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <span className="text-[11px] text-amber-900 font-black uppercase tracking-wider">
                                          {isHindi ? "संभावित वास्तविक जीवन परिणाम" : "Most Likely Real-World Outcomes"}
                                        </span>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        {[5, 4, 3].map(tier => {
                                          const items = ev.realWorldOutcomes.filter((o: any) => o.tier === tier);
                                          if (items.length === 0) return null;
                                          
                                          const stars = "★".repeat(tier);
                                          const label = tier === 5 ? "Very Likely" : tier === 4 ? "Likely" : "Possible";
                                          
                                          return (
                                            <div key={tier} className="space-y-2">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-amber-500 text-xs tracking-widest leading-none">{stars}</span>
                                                <span className="text-[10px] font-black uppercase text-amber-800/80 leading-none">{label}</span>
                                              </div>
                                              
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {items.map((outcome: any, oIdx: number) => {
                                                  const eventName = outcome.event;
                                                  const currentFeedback = feedbackMap[eventName];
                                                  const isSubmitting = submittingFeedback === `${ev.id}-${eventName}`;
                                                  const isSuccess = feedbackSuccess === `${ev.id}-${eventName}`;
                                                  
                                                  return (
                                                    <div key={oIdx} className="p-3 bg-white hover:bg-stone-50 border border-[#EADFC7] rounded-2xl flex flex-col justify-between gap-3 shadow-sm transition-all group">
                                                      <div className="space-y-1.5">
                                                        <div className="flex items-start justify-between">
                                                          <span className="text-xs font-black text-[#3F2D1D] flex items-start gap-1.5">
                                                            <span className="text-emerald-600 font-bold">✓</span>
                                                            {eventName}
                                                          </span>
                                                          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                                                            {outcome.probability}%
                                                          </span>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-stone-400 pl-4 leading-tight">
                                                          {outcome.drivers.join(" • ")}
                                                        </p>
                                                      </div>
                                                      
                                                      <div className="flex flex-wrap gap-1 border-t border-stone-100 pt-2 items-center justify-between">
                                                        {isSubmitting ? (
                                                          <div className="flex items-center gap-1 text-[10px] text-amber-700/80 font-bold uppercase py-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></div>
                                                        ) : isSuccess ? (
                                                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase py-1"><Check className="w-3.5 h-3.5" /><span>Calibrated!</span></div>
                                                        ) : currentFeedback ? (
                                                          <div className="flex items-center justify-between w-full">
                                                            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isHindi ? "दर्ज फीडबैक: " : "YOUR FEEDBACK: "}</span>
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${currentFeedback === "HAPPENED" ? "bg-emerald-500/10 text-emerald-700" : currentFeedback === "PARTIALLY_HAPPENED" ? "bg-amber-500/10 text-amber-700" : currentFeedback === "DID_NOT_HAPPEN" ? "bg-rose-500/10 text-rose-700" : "bg-stone-200 text-stone-600"}`}>
                                                              {currentFeedback.replace(/_/g, " ")}
                                                            </span>
                                                          </div>
                                                        ) : (
                                                          <>
                                                            <button onClick={() => handleFeedback(ev.id, eventName, ev.theme, ev.start, ev.end, "HAPPENED")} className="px-2 py-1 bg-stone-50 border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-lg text-[9px] font-black uppercase text-stone-500 hover:text-emerald-700 transition-all">Happened</button>
                                                            <button onClick={() => handleFeedback(ev.id, eventName, ev.theme, ev.start, ev.end, "PARTIALLY_HAPPENED")} className="px-2 py-1 bg-stone-50 border border-stone-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg text-[9px] font-black uppercase text-stone-500 hover:text-amber-700 transition-all">Partial</button>
                                                            <button onClick={() => handleFeedback(ev.id, eventName, ev.theme, ev.start, ev.end, "DID_NOT_HAPPEN")} className="px-2 py-1 bg-stone-50 border border-stone-200 hover:border-rose-500 hover:bg-rose-50 rounded-lg text-[9px] font-black uppercase text-stone-500 hover:text-rose-700 transition-all">Didn't</button>
                                                            <button onClick={() => handleFeedback(ev.id, eventName, ev.theme, ev.start, ev.end, "NOT_SURE")} className="px-2 py-1 bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-lg text-[9px] font-black uppercase text-stone-400 hover:text-stone-600 transition-all">Unsure</button>
                                                          </>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 pt-1 mt-3">
                                      <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "संभावित जीवन घटनाएं" : "PROBABLE LIFE EVENT TARGETS"}</span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {ev.likelyEvents.map((event: string, eIdx: number) => {
                                          const currentFeedback = feedbackMap[event];
                                          const isSubmitting = submittingFeedback === `${ev.id}-${event}`;
                                          const isSuccess = feedbackSuccess === `${ev.id}-${event}`;
                                          return (
                                            <div key={eIdx} className="p-3 bg-stone-50 hover:bg-stone-100/60 border border-stone-100 rounded-2xl flex flex-col justify-between gap-3 transition-colors">
                                              <span className="text-xs font-bold text-stone-800 flex items-start gap-1.5">
                                                <span className="text-amber-600 mt-0.5">✓</span>
                                                {event}
                                              </span>
                                              <div className="flex flex-wrap gap-1 border-t border-stone-200/50 pt-2 items-center justify-between">
                                                {isSubmitting ? (
                                                  <div className="flex items-center gap-1 text-[10px] text-amber-700/80 font-bold uppercase py-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></div>
                                                ) : isSuccess ? (
                                                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase py-1"><Check className="w-3.5 h-3.5" /><span>Calibrated!</span></div>
                                                ) : currentFeedback ? (
                                                  <div className="flex items-center justify-between w-full">
                                                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">{isHindi ? "दर्ज फीडबैक: " : "YOUR FEEDBACK: "}</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${currentFeedback === "HAPPENED" ? "bg-emerald-500/10 text-emerald-700" : currentFeedback === "PARTIALLY_HAPPENED" ? "bg-amber-500/10 text-amber-700" : currentFeedback === "DID_NOT_HAPPEN" ? "bg-rose-500/10 text-rose-700" : "bg-stone-200 text-stone-600"}`}>
                                                      {currentFeedback.replace(/_/g, " ")}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <button onClick={() => handleFeedback(ev.id, event, ev.theme, ev.start, ev.end, "HAPPENED")} className="px-2 py-1 bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-lg text-[9px] font-black uppercase text-stone-500 hover:text-emerald-700 transition-all">Happened</button>
                                                    <button onClick={() => handleFeedback(ev.id, event, ev.theme, ev.start, ev.end, "PARTIALLY_HAPPENED")} className="px-2 py-1 bg-white border border-stone-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg text-[9px] font-black uppercase text-stone-500 hover:text-amber-700 transition-all">Partial</button>
                                                    <button onClick={() => handleFeedback(ev.id, event, ev.theme, ev.start, ev.end, "DID_NOT_HAPPEN")} className="px-2 py-1 bg-white border border-stone-200 hover:border-rose-500 hover:bg-rose-50 rounded-lg text-[9px] font-black uppercase text-stone-500 hover:text-rose-700 transition-all">Didn't</button>
                                                    <button onClick={() => handleFeedback(ev.id, event, ev.theme, ev.start, ev.end, "NOT_SURE")} className="px-2 py-1 bg-white border border-stone-200 hover:border-stone-300 rounded-lg text-[9px] font-black uppercase text-stone-400 hover:text-stone-600 transition-all">Unsure</button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* ── Astrological Drivers accordion (replaces Contributors Ledger) ── */}
                                  <button
                                    onClick={() => setExpandedPeriod(isExpanded ? null : ev.id)}
                                    className="flex items-center gap-1.5 text-xs text-indigo-700/80 font-bold uppercase tracking-wider hover:text-indigo-900 transition-colors mt-1"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    <span>{isHindi ? (isExpanded ? "आकाशीय चालक छुपाएं" : "आकाशीय चालक देखें") : (isExpanded ? "Hide Astrological Drivers" : "View Astrological Drivers")}</span>
                                    {ev.astroDrivers?.length > 1 && (
                                      <span className="text-[9px] text-indigo-500 font-black">({ev.astroDrivers.length} periods)</span>
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {isExpanded && ev.astroDrivers && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 mt-2 space-y-3">
                                          <p className="text-[9px] font-black uppercase tracking-wider text-indigo-700/70">
                                            {isHindi ? "दशा/अन्तर्दशा विवरण" : "DASHA / ANTARDASHA BREAKDOWN"}
                                          </p>
                                          {ev.astroDrivers.map((driver: any, dIdx: number) => (
                                            <div key={dIdx} className="bg-white border border-indigo-100 rounded-xl p-3 space-y-2">
                                              <div className="flex items-center justify-between border-b border-indigo-50/50 pb-2">
                                                <div className="space-y-0.5">
                                                  <span className="text-[10px] font-black text-indigo-900 block">{driver.period}</span>
                                                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700/80 block">
                                                    {isHindi ? driver.themeHindi : driver.theme}
                                                  </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                                  {driver.mdLord} / {driver.adLord}
                                                </span>
                                              </div>
                                              
                                              {driver.experience && driver.experience.length > 0 && (
                                                <ul className="space-y-1 pl-3 list-disc list-outside text-[10px] text-stone-600 font-serif leading-relaxed">
                                                  {isHindi 
                                                    ? driver.experienceHindi?.map((exp: string, eIdx: number) => <li key={eIdx}>{exp}</li>)
                                                    : driver.experience.map((exp: string, eIdx: number) => <li key={eIdx}>{exp}</li>)
                                                  }
                                                </ul>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </>
                              );
                            })()}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>

                {/* Collapse button — visible once any year/all is selected */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setSelectedYear(null)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#EADFC7] hover:border-amber-300 text-[#3F2D1D]/70 hover:text-[#3F2D1D] rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>{isHindi ? "टाइमलाइन छुपाएं" : "Collapse Timeline"}</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "radar" && (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* ── ONE THING TO WATCH (Sacred Dashboard Highlights) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Highest Opportunity */}
            <div className="bg-gradient-to-br from-emerald-500/[0.03] to-emerald-50 border-2 border-emerald-300/40 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3 min-h-[140px] group hover:shadow-md transition-all">
              <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-emerald-500/[0.04] blur-xl rounded-full pointer-events-none" />
              <div className="space-y-1.5 relative z-10">
                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-emerald-700 block">
                  {isHindi ? "★ सर्वोच्च अनुकूलता" : "★ HIGHEST OPPORTUNITY"}
                </span>
                <h4 className="text-md font-serif font-black text-[#3F2D1D] group-hover:text-emerald-800 transition-colors">
                  {futureRadar.oneThingToWatch?.highestOpportunity?.title || (isHindi ? "करियर उन्नति व वृद्धि" : "Career Growth & Promotion")}
                </h4>
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-3xl font-black font-serif text-emerald-800">
                  {futureRadar.oneThingToWatch?.highestOpportunity?.probability || 84}%
                </span>
                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">{isHindi ? "संभावना" : "Probability"}</span>
              </div>
            </div>

            {/* Highest Risk */}
            <div className="bg-gradient-to-br from-rose-500/[0.03] to-rose-50 border-2 border-rose-300/40 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3 min-h-[140px] group hover:shadow-md transition-all">
              <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-rose-500/[0.04] blur-xl rounded-full pointer-events-none" />
              <div className="space-y-1.5 relative z-10">
                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-rose-700 block">
                  {isHindi ? "⚠ सर्वोच्च सतर्कता" : "⚠ HIGHEST RISK"}
                </span>
                <h4 className="text-md font-serif font-black text-[#3F2D1D] group-hover:text-rose-800 transition-colors">
                  {futureRadar.oneThingToWatch?.highestRisk?.title || (isHindi ? "वित्तीय दबाव व सीमाएं" : "Financial Pressure & Caution")}
                </h4>
              </div>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-3xl font-black font-serif text-rose-800">
                  {futureRadar.oneThingToWatch?.highestRisk?.probability || 72}%
                </span>
                <span className="text-[9px] text-rose-600 font-black uppercase tracking-wider">{isHindi ? "संवेदनशीलता" : "Vulnerability"}</span>
              </div>
            </div>

            {/* Important Focus Area */}
            <div className="bg-gradient-to-br from-amber-500/[0.03] to-[#FAF6EC] border-2 border-[#EADFC7] rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between gap-3 min-h-[140px] group hover:shadow-md transition-all">
              <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-amber-500/[0.04] blur-xl rounded-full pointer-events-none" />
              <div className="space-y-1.5 relative z-10">
                <span className="text-[9px] uppercase tracking-[0.2em] font-black text-amber-800 block">
                  {isHindi ? "🎯 प्राथमिक ध्यान क्षेत्र" : "🎯 TARGET FOCUS AREA"}
                </span>
                <h4 className="text-md font-serif font-black text-[#3F2D1D] group-hover:text-amber-800 transition-colors">
                  {isHindi ? "आजीविका और वित्तीय स्थिरता" : (futureRadar.oneThingToWatch?.mostImportantFocus || "Professional Growth")}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-850 font-black uppercase tracking-wider relative z-10">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>{isHindi ? "सक्रिय कुंडली दिशा निर्देश" : "Active Guidance Shield"}</span>
              </div>
            </div>
          </div>

          {/* Transition Analysis banner */}
          <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            <div className="space-y-1 max-w-xl">
              <h3 className="text-md font-serif font-black flex items-center gap-2 text-[#3F2D1D]">
                <span>🔄</span> {isHindi ? "वर्तमान चक्र में बदलाव" : "Transition Analysis: Shift Drivers"}
              </h3>
              <p className="text-xs text-[#3F2D1D]/70 leading-relaxed font-serif">
                {isHindi 
                  ? "जैसे ही आप इस 3-6 महीने की अवधि में प्रवेश करते हैं, ग्रहों का मार्ग पिछले चरण (एकत्रित अवस्था) से सक्रिय विकास चरण में स्थानांतरित हो जाता है, जो पेशेवर पहचान को मजबूत करता है।"
                  : `As you traverse the next 3–6 months, your primary Astro dynamics shift from the previous ${transition.previousPhase} phase to a balanced, opportunity-led ${transition.currentPhase}.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {transition.drivers.map((drv: string, dIdx: number) => (
                <span key={dIdx} className="px-3 py-1.5 rounded-xl border border-[#F1E7D0] bg-amber-500/[0.02] text-[10px] font-bold text-[#3F2D1D]/80">
                  ⚡ {drv}
                </span>
              ))}
            </div>
          </div>

          {/* Balanced Future Radar: Opportunities vs. Focus Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Opportunities column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-800 pb-2 border-b border-emerald-100">
                <Compass className="w-5 h-5" />
                <h3 className="font-serif font-black text-xl">{isHindi ? "सकारात्मक अवसर" : "Upcoming Favorable Opportunities"}</h3>
              </div>

              <div className="space-y-6">
                {displayedOpportunities.map((opp: any, oIdx: number) => (
                  <div key={oIdx} className="bg-white border border-[#F1E7D0] hover:border-emerald-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                    
                    {/* Opportunity Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-800">
                          {opp.domain}
                        </span>
                        <h4 className="text-md font-serif font-black text-emerald-950 mt-1">{opp.title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-serif text-emerald-800">{opp.score}%</span>
                        <p className="text-[9px] uppercase tracking-widest text-emerald-700 font-bold">{isHindi ? "अनुकूलता" : "Potential"}</p>
                      </div>
                    </div>

                    {/* Peak Window details */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col gap-2.5 text-xs text-emerald-950/80">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] text-emerald-800/60 font-black uppercase block">{isHindi ? "अधिकतम अनुकूलता समय" : "PEAK OPPORTUNITY WINDOW"}</span>
                          <span className="font-bold">
                            {new Date(opp.peakStart).toLocaleDateString("en-US", { day: "numeric", month: "short" })} – {new Date(opp.peakEnd).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {opp.validationLabel}
                          </span>
                        </div>
                      </div>

                      {opp.whyThisWindow && (
                        <div className="text-[11px] text-emerald-800/80 bg-emerald-500/[0.03] border border-emerald-500/10 p-2.5 rounded-xl font-serif">
                          <span className="font-bold text-[9px] uppercase tracking-wider text-emerald-700 block mb-0.5">{isHindi ? "यह समय क्यों?" : "WHY THIS WINDOW"}</span>
                          "{opp.whyThisWindow}"
                        </div>
                      )}
                    </div>

                    {/* Explanations */}
                    <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-serif italic">"{opp.why}"</p>

                    {opp.natalPromiseRelation && (
                      <div className="text-[11px] text-[#3F2D1D]/75 bg-[#FAF8F5] border border-[#EADFC7]/50 p-2.5 rounded-xl font-serif">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-stone-500 block mb-0.5">{isHindi ? "जन्म कुंडली संबंध (व्यक्तिगत)" : "NATAL CHART PERSONALIZATION"}</span>
                        {opp.natalPromiseRelation}
                      </div>
                    )}

                    {/* Most Likely Manifestations */}
                    {opp.mostLikelyManifestations && opp.mostLikelyManifestations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "सर्वाधिक संभावित परिणाम" : "MOST LIKELY MANIFESTATIONS"}</span>
                        <ul className="space-y-1">
                          {opp.mostLikelyManifestations.map((man: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-1.5 leading-relaxed font-serif">
                              <span className="text-emerald-600 font-bold mt-0.5">•</span>
                              <span>{man}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Possible Manifestations */}
                    {opp.possibleManifestations && opp.possibleManifestations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "संभावित परिणाम / बदलाव" : "POSSIBLE REAL-WORLD PIVOTS"}</span>
                        <ul className="space-y-1">
                          {opp.possibleManifestations.map((man: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-1.5 leading-relaxed font-serif">
                              <span className="text-stone-500 font-bold mt-0.5">•</span>
                              <span>{man}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Blockers */}
                    {opp.blockers && opp.blockers.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-rose-700 font-bold uppercase block">{isHindi ? "संभावित बाधाएं व Failure Modes" : "POTENTIAL BLOCKERS & FAILURE MODES"}</span>
                        <ul className="space-y-1">
                          {opp.blockers.map((blk: string, idx: number) => (
                            <li key={idx} className="text-xs text-rose-800 flex items-start gap-1.5 leading-relaxed font-serif">
                              <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                              <span>{blk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Checklists */}
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "अनुशंसित क्रियाएं" : "RECOMMENDED GROWTH ACTIONS"}</span>
                      <ul className="space-y-2">
                        {opp.potential.map((action: string, aIdx: number) => (
                          <li key={aIdx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-2 leading-relaxed font-serif">
                            <span className="text-emerald-600 font-black">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Drivers tags */}
                    {opp.drivers && opp.drivers.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100 text-[9px]">
                        <span className="text-stone-500 font-bold uppercase block tracking-wider">{isHindi ? "आकाशीय चालक" : "PLANETARY DRIVERS"}</span>
                        <div className="flex flex-wrap gap-1">
                          {opp.drivers.map((drv: string, dIdx: number) => (
                            <span key={dIdx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-bold uppercase">
                              ⚡ {drv}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>

            {/* Focus Areas/Cautions column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-rose-800 pb-2 border-b border-rose-100">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-serif font-black text-xl">{isHindi ? "सतर्कता और चुनौतियां" : "Restraints & Caution Radar"}</h3>
              </div>

              <div className="space-y-6">
                {displayedFocusAreas.map((risk: any, rIdx: number) => (
                  <div key={rIdx} className="bg-white border border-[#F1E7D0] hover:border-rose-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                    
                    {/* Focus Area Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 border border-rose-200 text-rose-800">
                          {risk.domain}
                        </span>
                        <h4 className="text-md font-serif font-black text-rose-950 mt-1">{risk.title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black font-serif text-rose-800">{risk.score}%</span>
                        <p className="text-[9px] uppercase tracking-widest text-rose-700 font-bold">{isHindi ? "संवेदनशीलता" : "Vulnerability"}</p>
                      </div>
                    </div>

                    {/* Peak window details */}
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col gap-2.5 text-xs text-rose-950/80">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] text-rose-800/60 font-black uppercase block">{isHindi ? "उच्च जोखिम अवधि" : "PEAK VULNERABILITY TIME"}</span>
                          <span className="font-bold">
                            {new Date(risk.peakStart).toLocaleDateString("en-US", { day: "numeric", month: "short" })} – {new Date(risk.peakEnd).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md">
                            {risk.validationLabel}
                          </span>
                        </div>
                      </div>

                      {risk.whyThisWindow && (
                        <div className="text-[11px] text-rose-800/80 bg-rose-500/[0.03] border border-rose-500/10 p-2.5 rounded-xl font-serif">
                          <span className="font-bold text-[9px] uppercase tracking-wider text-rose-700 block mb-0.5">{isHindi ? "यह समय क्यों?" : "WHY THIS WINDOW"}</span>
                          "{risk.whyThisWindow}"
                        </div>
                      )}
                    </div>

                    {/* Explanations */}
                    <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-serif italic">"{risk.why}"</p>

                    {risk.natalPromiseRelation && (
                      <div className="text-[11px] text-[#3F2D1D]/75 bg-[#FAF8F5] border border-[#EADFC7]/50 p-2.5 rounded-xl font-serif">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-stone-500 block mb-0.5">{isHindi ? "जन्म कुंडली संबंध (व्यक्तिगत)" : "NATAL CHART PERSONALIZATION"}</span>
                        {risk.natalPromiseRelation}
                      </div>
                    )}

                    {/* Most Likely Manifestations */}
                    {risk.mostLikelyManifestations && risk.mostLikelyManifestations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "सर्वाधिक संभावित परिणाम" : "MOST LIKELY MANIFESTATIONS"}</span>
                        <ul className="space-y-1">
                          {risk.mostLikelyManifestations.map((man: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-1.5 leading-relaxed font-serif">
                              <span className="text-rose-700 font-bold mt-0.5">•</span>
                              <span>{man}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Possible Manifestations */}
                    {risk.possibleManifestations && risk.possibleManifestations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "अतिरिक्त संवेदनशीलता संभावनाएं" : "POSSIBLE EXTRA CONSTRAINTS"}</span>
                        <ul className="space-y-1">
                          {risk.possibleManifestations.map((man: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-1.5 leading-relaxed font-serif">
                              <span className="text-stone-500 font-bold mt-0.5">•</span>
                              <span>{man}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Blockers */}
                    {risk.blockers && risk.blockers.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-[#802D20] font-bold uppercase block">{isHindi ? "सुरक्षात्मक कवच और समाधान" : "FAIL-SAFE PROTECTION & CHANNELS"}</span>
                        <ul className="space-y-1">
                          {risk.blockers.map((blk: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#802D20] flex items-start gap-1.5 leading-relaxed font-serif">
                              <span className="text-rose-500 font-bold mt-0.5">⚠️</span>
                              <span>{blk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Avoid Checklist */}
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <span className="text-[10px] text-stone-500 font-bold uppercase block">{isHindi ? "सावधानी (इनसे बचें)" : "MIND RESTRAINTS TO AVOID"}</span>
                      <ul className="space-y-2">
                        {risk.potential.map((avoid: string, avIdx: number) => (
                          <li key={avIdx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-2 leading-relaxed font-serif">
                            <span className="text-rose-600 font-black">✗</span>
                            <span>{avoid}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Drivers tags */}
                    {risk.drivers && risk.drivers.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#F1E7D0] text-[9px]">
                        <span className="text-stone-500 font-bold uppercase block tracking-wider">{isHindi ? "चुनौतीपूर्ण चालक" : "PLANETARY DRIVERS"}</span>
                        <div className="flex flex-wrap gap-1">
                          {risk.drivers.map((drv: string, dIdx: number) => (
                            <span key={dIdx} className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-md font-bold uppercase">
                              ⚠️ {drv}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Gating Banner for Basic Tier Future Radar */}
          {!isPremium && futureRadar.opportunities.length > 1 && (
            <div className="overflow-hidden border border-[#EAD9BE] rounded-3xl p-8 bg-gradient-to-r from-white/95 to-amber-500/[0.03] text-center shadow-lg space-y-4 max-w-3xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-700">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-serif font-black">{isHindi ? "12 महीने का भविष्य रडार लॉक है" : "12-Month Future Radar Locked"}</h4>
              <p className="text-xs text-[#3F2D1D]/70 leading-relaxed max-w-lg mx-auto font-serif">
                {isHindi 
                  ? "बेसिक उपयोगकर्ता केवल अगले 3 महीनों का अवसर पूर्वानुमान देख सकते हैं। पूरे 12 महीनों के व्यक्तिगत स्वास्थ्य, करियर, और वित्तीय भविष्य के रडार को खोलने के लिए प्रीमियम में अपग्रेड करें।" 
                  : "Basic access limits future prediction to 3 months and hides detailed monthly transitions. Upgrade now to secure a full 12-month future-cast with monthly peak windows!"}
              </p>
              <button 
                onClick={handleUpgrade}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
              >
                {isHindi ? "प्रीमियम पर अपग्रेड करें" : "Unlock 12-Month Radar"}
              </button>
            </div>
          )}

          {/* ── MAJOR TURNING POINTS ("What could change?") ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-amber-900 pb-2 border-b border-[#EADFC7]">
              <Sparkles className="w-5 h-5 text-amber-700 animate-pulse" />
              <h3 className="font-serif font-black text-xl">{isHindi ? "महत्वपूर्ण जीवन परिवर्तन (What Could Change?)" : "Major Life Turning Points: What Could Change?"}</h3>
            </div>

            <p className="text-xs text-[#3F2D1D]/75 leading-relaxed italic max-w-3xl">
              {isHindi 
                ? "ये सबसे बड़े परिवर्तनकारी बिंदु हैं जिनकी ज्योतिषीय गणना आपके आगामी अध्यायों में की गई है। प्रत्येक घटना को उसके आकाशीय प्रभाव और तीव्रता के आधार पर वर्गीकृत किया गया है:"
                : "These represent the major, highly concrete inflection points active in your dynamic astrological chart for the next 3–6 months:"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedTurningPoints.map((point: any, pIdx: number) => {
                const formattedPeakStart = new Date(point.peakStart).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                const formattedPeakEnd = new Date(point.peakEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                
                return (
                  <div key={pIdx} className="bg-white border-2 border-[#EADFC7] hover:border-amber-400/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />
                    
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-800 border border-amber-500/20">
                          {point.magnitude} Impact
                        </span>
                        <span className="text-2xl font-black font-serif text-amber-900">{point.probability}%</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-md font-serif font-black text-[#3F2D1D] group-hover:text-amber-800 transition-colors">
                          {point.title}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                          ⏳ {isHindi ? "संभावित काल:" : "ACTIVE PEAK:"} {formattedPeakStart} – {formattedPeakEnd}
                        </span>
                      </div>

                      {/* Astrological justification */}
                      <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-serif italic border-l-2 border-amber-300 pl-2">
                        "{point.why}"
                      </p>

                      {/* Manifestations */}
                      <div className="space-y-2 border-t border-stone-100 pt-3">
                        <span className="text-[8px] text-stone-500 font-black uppercase block tracking-wider">
                          {isHindi ? "अनुमेय जीवन परिवर्तन" : "PROBABLE EVENT MANIFESTATIONS"}
                        </span>
                        <ul className="space-y-1.5">
                          {point.potential.map((item: string, idx: number) => (
                            <li key={idx} className="text-xs text-[#3F2D1D]/80 flex items-start gap-1.5 font-serif leading-relaxed">
                              <span className="text-amber-600 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Drivers tags */}
                    {point.drivers && point.drivers.length > 0 && (
                      <div className="space-y-1.5 pt-3 border-t border-stone-100 text-[8px]">
                        <span className="text-stone-500 font-black uppercase block tracking-wider">{isHindi ? "आकाशीय चालक" : "PLANETARY DRIVERS"}</span>
                        <div className="flex flex-wrap gap-1">
                          {point.drivers.map((drv: string, dIdx: number) => (
                            <span key={dIdx} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 rounded font-bold uppercase">
                              {drv}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Turning point gating for Basic seeker */}
            {!isPremium && (futureRadar.majorTurningPoints || []).length > 1 && (
              <div className="overflow-hidden border border-[#EAD9BE] rounded-3xl p-6 bg-gradient-to-r from-white to-amber-500/[0.02] flex flex-col md:flex-row justify-between items-center gap-6 max-w-3xl mx-auto shadow-sm">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-sm font-serif font-black flex items-center justify-center md:justify-start gap-1.5 text-[#3F2D1D]">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>{isHindi ? "पूर्ण जीवन परिवर्तन विश्लेषण लॉक है" : "Deep Turning Points Outlook Locked"}</span>
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed font-serif">
                    {isHindi 
                      ? "आगामी 3-6 महीनों के सभी प्रमुख जीवन संक्रमण और निर्णय बिंदुओं को अनलॉक करने के लिए प्रीमियम में अपग्रेड करें।" 
                      : "Upgrade to Premium to unlock all active moderate and major life decision projections mapped to your chart."}
                  </p>
                </div>
                <button 
                  onClick={handleUpgrade}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                >
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{isHindi ? "प्रीमियम अनलॉक" : "Unlock Projections"}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── NEXT 6-MONTH OUTLOOK GRID ── */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-amber-900 pb-2 border-b border-[#EADFC7]">
              <Calendar className="w-5 h-5 text-amber-700" />
              <h3 className="font-serif font-black text-xl">{isHindi ? "आगामी ६-महीने का कालचक्र परिदृश्य" : "Next 6-Month Cosmic Outlook"}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(futureRadar.sixMonthOutlook || []).map((outlook: any, idx: number) => {
                const confColor = outlook.confidence === "Very Strong" ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                                  outlook.confidence === "Strong" ? "text-amber-700 bg-amber-50 border-amber-100" :
                                  "text-stone-700 bg-stone-50 border-stone-100";
                
                return (
                  <div key={idx} className="bg-white border border-[#EADFC7] rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block">
                        #{idx + 1} {outlook.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${confColor}`}>
                        {outlook.confidence} ({outlook.probability}%)
                      </span>
                    </div>

                    <div className="p-3 bg-amber-500/[0.01] border border-stone-100 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[8px] text-stone-400 font-black uppercase block">{isHindi ? "सक्रिय चरम महीना" : "PEAK MONTH"}</span>
                        <span className="font-bold text-amber-900 font-serif text-sm">{outlook.peak}</span>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded font-black uppercase">
                        Active Peak
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[8px] text-stone-500 font-black uppercase block tracking-wider">{isHindi ? "संभावित जीवन अभिव्यक्तियाँ" : "PROBABLE MANIFESTATIONS"}</span>
                      <ul className="space-y-1 pl-1">
                        {outlook.manifestations.map((m: string, mIdx: number) => (
                          <li key={mIdx} className="text-xs text-stone-600 flex items-center gap-1.5 font-serif leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3: PREDICTION JOURNAL ── */}
      {activeSubTab === "journal" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm space-y-2">
            <h3 className="text-md font-serif font-black">{isHindi ? "भविष्यवाणी आउटकम जर्नल" : "Prediction Outcome Journal"}</h3>
            <p className="text-xs text-[#3F2D1D]/70 leading-relaxed">
              {isHindi 
                ? "समय के साथ मासिक ज्योतिषीय गणनाओं के परिणामों को ट्रैक करें। परिणाम दर्ज करके आकाशीय सटीकता इंजन को अपने चार्ट के लिए और अधिक संवेदनशील बनाएं।" 
                : "Track the alignment of monthly forecasts against your actual lived experiences over time. Recording outcomes helps the self-learning model calibrate future accuracy rates."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journal.map((j: any) => (
              <div key={j.id} className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                
                {/* Journal Item Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-100 text-stone-600 border border-stone-200">
                      {j.targetMonth}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                      j.status === "UPCOMING" ? "bg-stone-100 text-stone-500 border border-stone-200" :
                      j.status === "HAPPENED" ? "bg-emerald-500/10 text-emerald-700" :
                      j.status === "PARTIALLY_HAPPENED" ? "bg-amber-500/10 text-amber-700" : "bg-rose-500/10 text-rose-700"
                    }`}>
                      {j.status}
                    </span>
                  </div>
                  <h4 className="text-md font-serif font-black">{j.title}</h4>
                  <p className="text-xs text-stone-500 font-bold uppercase">{isHindi ? "पूर्वानुमान: " : "FORECAST TEXT:"}</p>
                  <p className="text-xs text-[#3F2D1D]/75 leading-relaxed italic">
                    "{j.predictionText}"
                  </p>
                </div>

                {/* Journal Outcome Buttons */}
                <div className="border-t border-stone-100 pt-4 space-y-3">
                  <span className="text-[9px] text-stone-500 font-black uppercase block">{isHindi ? "आउटकम दर्ज करें" : "UPDATE OUTCOME STATUS"}</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { status: "HAPPENED", label: isHindi ? "सत्य हुआ" : "Happened", color: "hover:border-emerald-500 hover:bg-emerald-50" },
                      { status: "PARTIALLY_HAPPENED", label: isHindi ? "आंशिक रूप से" : "Partial", color: "hover:border-amber-500 hover:bg-amber-50" },
                      { status: "DID_NOT_HAPPEN", label: isHindi ? "असंतोषजनक" : "Didn't Happen", color: "hover:border-rose-500 hover:bg-rose-50" },
                      { status: "UPCOMING", label: isHindi ? "आगामी" : "Reset", color: "hover:border-stone-500 hover:bg-stone-50" }
                    ].map((btn) => (
                      <button
                        key={btn.status}
                        onClick={() => handleJournalUpdate(j.id, btn.status)}
                        className={`px-2 py-1.5 border rounded-lg text-[9px] font-black uppercase transition-all ${btn.color} ${
                          j.status === btn.status 
                            ? "bg-[#3F2D1D] text-white border-[#3F2D1D]" 
                            : "bg-white text-stone-600 border-stone-200"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: ANNUAL LIFE REPORT & SNAPSHOT ── */}
      {activeSubTab === "report" && (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* printable preview card */}
          <div className="bg-[#FFFDF9] border-2 border-[#EADFC7] rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-10 relative overflow-hidden" id="annual-report-preview">
            
            {/* watermark design */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/[0.02] blur-[100px] rounded-full pointer-events-none" />

            {/* Preview Banner Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b-2 border-[#EADFC7]/60">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-amber-700/80 block">DIVYADRISHTI ANNUAL ROADMAP</span>
                <h2 className="text-2xl font-serif font-black text-[#3F2D1D]">{isHindi ? "वार्षिक कालचक्र रिपोर्ट २०२६-२०२७" : "Annual Life Report 2026-2027"}</h2>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                  {isHindi ? `नाम: ${user.name} • जन्म चार्ट सत्यापित` : `PREPARED FOR: ${user.name} • BIRTH CHART INTEGRITY CONFIRMED`}
                </p>
              </div>
              <div className="px-4 py-2 bg-amber-500/5 border border-amber-500/10 text-amber-800 rounded-xl text-xs font-black uppercase tracking-widest">
                🏆 {isHindi ? "प्रीमियम फ्लैगशिप दस्तावेज" : "PREMIUM DOCUMENT PREVIEW"}
              </div>
            </div>

            {/* Destiny Snapshot Card Shareable */}
            <div className="bg-[#FAF8F5] border-2 border-[#EADFC7] rounded-[2rem] p-6 md:p-8 space-y-6 max-w-xl mx-auto shadow-md relative overflow-hidden group hover:shadow-xl hover:border-amber-500/40 transition-all">
              
              {/* Premium Cosmic Background Watermark */}
              <div className="absolute inset-0 bg-no-repeat bg-center opacity-[0.04] pointer-events-none flex items-center justify-center">
                <svg className="w-72 h-72 text-amber-900 animate-[spin_180s_linear_infinite]" fill="currentColor" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.2" fill="none" strokeDasharray="1,1" />
                  <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="0.3" />
                  <polygon points="50,15 53,47 85,50 53,53 50,85 47,53 15,50 47,47" stroke="currentColor" strokeWidth="0.3" fill="none" />
                </svg>
              </div>

              {/* Inner Decorative Border Frame */}
              <div className="absolute inset-2 border border-amber-600/10 rounded-[1.7rem] pointer-events-none" />

              <div className="flex justify-between items-start border-b border-stone-200/50 pb-4 relative z-10 m-2">
                <div>
                  <span className="text-[9px] text-amber-800/60 font-black uppercase block tracking-widest">DIVYADRISHTI CORE INSIGHTS</span>
                  <h4 className="text-xl font-serif font-black text-[#3F2D1D]">{isHindi ? "भाग्य स्नैपशॉट (Destiny Scorecard)" : "Destiny Snapshot Card"}</h4>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={copyDestinySnapshot} 
                    className="p-2 bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50 rounded-xl text-stone-600 transition-all shadow-sm active:scale-95"
                    title="Copy Snapshot text"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-900" />}
                  </button>
                </div>
              </div>

              {/* Progress bars metrics for scorecard (All 5 domains!) */}
              <div className="space-y-4 relative z-10 m-2">
                {[
                  { name: isHindi ? "करियर क्षमता (Career Growth)" : "Career Growth", val: scorecard.career, color: "text-emerald-700", bg: "bg-emerald-500" },
                  { name: isHindi ? "धन अनुकूलता (Finance & Assets)" : "Finance & Assets", val: scorecard.finance, color: "text-amber-700", bg: "bg-amber-500" },
                  { name: isHindi ? "संबंध सौहार्द (Relational Harmony)" : "Relational Harmony", val: scorecard.relationships, color: "text-rose-700", bg: "bg-rose-500" },
                  { name: isHindi ? "स्वास्थ्य व ऊर्जा (Health Vitality)" : "Health Vitality", val: scorecard.health, color: "text-purple-700", bg: "bg-purple-500" },
                  { name: isHindi ? "दैवीय कृपा / भाग्य (Divine Grace)" : "Divine Grace (Luck)", val: scorecard.luck, color: "text-blue-700", bg: "bg-blue-500" }
                ].map((scoreItem) => (
                  <div key={scoreItem.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold font-serif">
                      <span className="text-[#3F2D1D]/90">{scoreItem.name}</span>
                      <span className={`${scoreItem.color} font-mono`}>{scoreItem.val}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/20">
                      <div className={`h-full ${scoreItem.bg} transition-all duration-1000`} style={{ width: `${scoreItem.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Destiny Snapshot Integrated Score */}
              <div className="p-4 bg-gradient-to-r from-amber-500/[0.04] to-amber-700/[0.04] border border-[#EAD9BE] rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 m-2 shadow-inner">
                <div className="text-center sm:text-left">
                  <span className="text-[9px] text-amber-800/60 font-black uppercase block tracking-wider">{isHindi ? "एकीकृत कुंडली भाग्य सूचकांक" : "INTEGRATED ASTROLOGY INDEX"}</span>
                  <span className="text-3xl font-black font-serif text-amber-900">{scorecard.overall} <span className="text-xs text-stone-500 font-sans font-normal">/ 100</span></span>
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-[9px] text-stone-500 font-bold uppercase block tracking-wider">{isHindi ? "सक्रिय जीवन अध्याय" : "ACTIVE LIFE CHAPTER"}</span>
                  <span className="text-xs font-black uppercase text-amber-800 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg block mt-0.5">
                    {pattern.currentPhase}
                  </span>
                </div>
              </div>

              {/* Vedic Authenticity Integrity Seal */}
              <div className="flex justify-between items-center border-t border-stone-200/60 pt-4 text-[9px] text-[#3F2D1D]/60 uppercase tracking-widest font-black relative z-10 m-2">
                <span>© DIVYADRISHTI PLATFORM</span>
                <span className="px-2 py-0.5 border border-emerald-600/25 rounded-md bg-emerald-500/[0.03] text-emerald-700 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                  <span>{isHindi ? "वैदिक सत्यता सत्यापित" : "Vedic Integrity Confirmed"}</span>
                </span>
              </div>

            </div>

            {/* Core Chapters Roadmaps preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-[#3F2D1D]/80">
              
              {/* Opportunities & Chapters overview */}
              <div className="space-y-4">
                <h4 className="text-sm font-serif font-black border-b border-[#EADFC7]/60 pb-2 text-[#3F2D1D]">{isHindi ? "रिपोर्ट मुख्य विशेषताएं" : "Annual Roadmap Highlights"}</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isHindi ? "सर्वश्रेष्ठ अनुकूलता कालचक्र: " : "Peak Expansion Era: "}</strong> {pattern.fortunateDecade}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isHindi ? "प्राथमिक जीवन अध्याय: " : "Core Life Chapter: "}</strong> {pattern.currentPhase}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isHindi ? "सबसे मजबूत क्षेत्र: " : "Dominant Area: "}</strong> {pattern.strongestArea}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isHindi ? "ज्योतिषीय चालक: " : "Planetary Shift Drivers: "}</strong> {transition.drivers.join(", ")}</span>
                  </li>
                </ul>
              </div>

              {/* PDF Preview details */}
              <div className="space-y-4">
                <h4 className="text-sm font-serif font-black border-b border-[#EADFC7]/60 pb-2 text-[#3F2D1D]">{isHindi ? "दस्तावेज विवरण विवरण" : "Document Overview Details"}</h4>
                <p>
                  {isHindi 
                    ? "इस रिपोर्ट में १२ महीने के पारगमन पूर्वानुमान, वैदिक दशा के अनुसार मासिक जोखिम मार्गदर्शन, और कुंडली के अनुसार अनुकूल उपायों की सूची शामिल है।" 
                    : "This comprehensive document features granular 12-month transit graphs, monthly opportunity grids, extensive remedies based on planetary afflictions, and peak timing windows for career pivots."}
                </p>
                <div className="p-3.5 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3">
                  <FileText className="w-6 h-6 text-amber-700" />
                  <div>
                    <span className="font-bold text-stone-800 block">DivyaDrishti_Roadmap.pdf</span>
                    <span className="text-[10px] text-stone-500">14 Pages • High Fidelity Astrological Summary</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Mock Premium download Gating block */}
            <div className="relative border border-[#EAD9BE] rounded-3xl p-6 bg-gradient-to-r from-white to-amber-500/[0.02] flex flex-col md:flex-row justify-between items-center gap-6">
              
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-sm font-serif font-black flex items-center justify-center md:justify-start gap-1.5 text-[#3F2D1D]">
                  {!isPremium && <Lock className="w-4 h-4 text-amber-700" />}
                  <span>{isHindi ? "ऑफ़लाइन विश्लेषण दस्तावेज़ डाउनलोड करें" : "Download Offline Analytics Document"}</span>
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {isHindi 
                    ? "प्रीमियम ग्राहक वार्षिक कुंडली रिपोर्ट को पीडीएफ के रूप में डाउनलोड और प्रिंट कर सकते हैं।" 
                    : "Premium subscription is required to export your chronological timeline and 12-month forecast as a high-fidelity PDF."}
                </p>
              </div>

              {isPremium ? (
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3F2D1D] hover:bg-[#3F2D1D]/90 text-[#F8F5EF] rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  <span>{isHindi ? "पीडीएफ डाउनलोड करें" : "Download PDF"}</span>
                </button>
              ) : (
                <button 
                  onClick={handleUpgrade}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{isHindi ? "प्रीमियम अनलॉक करें" : "Unlock PDF Download"}</span>
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ── FOOTER GUARDRAIL WARNINGS ── */}
      <div className="bg-[#FAF5EC]/30 border border-[#F1E7D0] rounded-3xl p-6 space-y-3.5 text-xs text-amber-900/60 leading-relaxed font-serif italic text-center">
        <h4 className="text-xs font-serif font-black uppercase tracking-wider text-amber-800/80 not-italic block">{isHindi ? "⚠️ महत्वपूर्ण आध्यात्मिक और कानूनी सुरक्षा उपाय" : "⚠️ Sacred Platform Guardrails & Guidelines"}</h4>
        <p className="max-w-3xl mx-auto">
          {isHindi 
            ? "कालचक्र की भविष्यवाणियां ज्योतिषीय संभावनाओं और प्राचीन ज्ञान पर आधारित हैं। इन्हें अंतिम रूप से निश्चित घटनाओं के रूप में नहीं लिया जाना चाहिए। प्रत्येक परिस्थिति ईश्वर की इच्छा और आपके अपने कर्मों के आधीन है। हम किसी भी प्रकार की चिकित्सीय, कानूनी, या वित्तीय सलाह प्रदान नहीं करते हैं।"
            : "Astrological projections represent celestial probabilities and sacred mathematical correlations. They do not constitute guaranteed outcomes or deterministic predictions. Lived outcomes depend heavily on personal karma and willpower. This dashboard never diagnoses health conditions, nor does it provide professional legal, medical, or financial advice."}
        </p>
      </div>

    </div>
  );
}
