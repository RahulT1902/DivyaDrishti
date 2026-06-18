"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Sun, Moon, Loader2, RefreshCw } from "lucide-react";
import MorningBriefCard from "./MorningBriefCard";
import PanchangCard from "./PanchangCard";
import ReflectionCard from "./ReflectionCard";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  user: {
    name?: string;
    email: string;
  };
}

export default function DailyRitualPage({ user }: Props) {
  const { isHindi, language, mode, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [userName, setUserName] = useState<string>(user.name || (isHindi ? "साधक" : "Seeker"));

  // Time-aware theme state: "morning" | "evening"
  const [themeMode, setThemeMode] = useState<"morning" | "evening">("morning");
  // Track if theme has been manually overridden
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Read local time to detect default theme mode (Cutoff at 4:00 PM / 16:00)
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 16) {
      setThemeMode("evening");
    } else {
      setThemeMode("morning");
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrent fetching of Guidance and Panchang
      const [guidanceRes, panchangRes] = await Promise.all([
        fetch(`/api/guidance/daily?email=${encodeURIComponent(user.email)}&mode=${mode}`),
        fetch(`/api/panchang/today?email=${encodeURIComponent(user.email)}&language=${language}`)
      ]);

      const guidanceData = await guidanceRes.json();
      const panchangData = await panchangRes.json();

      if (guidanceData.success) {
        setBriefing(guidanceData.briefing);
        if (guidanceData.userName) {
          setUserName(guidanceData.userName);
        }
      } else {
        throw new Error(guidanceData.error || (isHindi ? "दैनिक विवरण लोड करने में विफल" : "Failed to load daily briefing"));
      }

      if (panchangData.success) {
        setPanchang(panchangData.panchang);
      } else {
        throw new Error(panchangData.error || (isHindi ? "दैनिक पंचांग लोड करने में विफल" : "Failed to load daily panchang"));
      }
    } catch (err: any) {
      console.error("Error loading daily ritual details:", err);
      setError(err.message || (isHindi ? "दैनिक अनुष्ठान स्थान स्थापित करने में विफल। कृपया पुन: प्रयास करें।" : "Failed to establish ritual space. Please retry."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchData();
    }
  }, [user?.email, language]);

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === "morning" ? "evening" : "morning"));
    setIsManualOverride(true);
  };

  // Format today's date elegantly
  const getFormattedDate = () => {
    return new Date().toLocaleDateString(isHindi ? "hi-IN" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-[#3F2D1D]">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-xs text-amber-800/60 uppercase tracking-[0.2em] font-serif animate-pulse">
          {t("Opening Sacred Timeline...", "पावन समय-रेखा खोली जा रही है...")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto p-6">
        <p className="text-rose-700 text-sm font-light">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#F1E7D0] text-[#3F2D1D] text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-[#EADFC7]/50 transition-all cursor-pointer shadow-sm font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#3F2D1D]/70" />
          {t("Re-align Space", "अंतरिक्ष को संरेखित करें")}
        </button>
      </div>
    );
  }

  const isMorning = themeMode === "morning";

  return (
    <div
      className="min-h-screen p-6 font-sans relative overflow-hidden transition-all duration-1000 bg-[#F8F5EF] text-[#3F2D1D]"
    >
      {/* Mystical Background Lighting Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          {isMorning ? (
            <motion.div
              key="morning-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-amber-500/10 via-amber-800/5 to-transparent blur-[130px] rounded-full"
              style={{ animationDuration: "14s" }}
            />
          ) : (
            <motion.div
              key="evening-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-500/10 via-[#1D1233]/5 to-transparent blur-[130px] rounded-full"
              style={{ animationDuration: "12s" }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        {/* ── Header Greeting Section ────────────────────────────────────────── */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-[#F1E7D0]"
        >
          <div className="space-y-1">
            <h1 className={`font-serif tracking-wide font-light ${isHindi ? "text-3xl md:text-4xl leading-relaxed" : "text-3xl"}`}>
              {isMorning ? t("Blessed Morning,", "मंगलमय प्रभात,") : t("Peaceful Evening,", "शांत संध्या,")}{" "}
              <span
                className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600 font-serif"
              >
                {userName}
              </span>
            </h1>
            <p
              className={`text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 transition-colors duration-1000 text-amber-800/60 ${isHindi ? "tracking-wider mt-1" : ""}`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              {getFormattedDate()}
            </p>
          </div>

          {/* Theme Ambiance Switcher */}
          <button
            onClick={handleToggleTheme}
            className={`self-start px-5 py-2.5 rounded-full border flex items-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest cursor-pointer shadow-sm bg-white hover:bg-amber-50/45 ${
              isMorning
                ? "border-amber-500/20 text-amber-800 hover:border-amber-400/40"
                : "border-indigo-500/20 text-indigo-800 hover:border-indigo-400/40"
            }`}
            title={t("Toggle morning or evening ambiance manually", "मैन्युअल रूप से सुबह या शाम का माहौल बदलें")}
          >
            {isMorning ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {t("Sunrise Warmth", "सूर्योदय की ऊष्मा")}
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                {t("Moonlit Deep", "चंद्रमा की गहनता")}
              </>
            )}
          </button>
        </div>

        {/* ── Main content components sequence ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="space-y-10"
        >
          {/* Morning Guidance Brief Card */}
          {briefing && (
            <MorningBriefCard
              briefing={briefing}
              userName={userName}
              userEmail={user.email}
              themeMode={themeMode}
            />
          )}

          {/* Panchang Limb Almanac Card */}
          {panchang && <PanchangCard panchang={panchang} themeMode={themeMode} />}

          {/* Evening Reflection Card */}
          <ReflectionCard userEmail={user.email} themeMode={themeMode} />
        </motion.div>

        {/* ── System Footer ─────────────────────────────────────────────────── */}
        <div
          className={`pt-6 flex items-center justify-between border-t text-[9px] font-serif tracking-widest uppercase border-[#F1E7D0] text-amber-800/40 ${isHindi ? "tracking-wider text-[10px]" : ""}`}
        >
          <span>
            {isHindi
              ? `${userName} • संरेखित समय ध्यान`
              : `${userName} • Aligned timing focus`}
          </span>
          <span className="italic">
            {isHindi
              ? "दिव्यदृष्टि v2.0 • दैनिक अनुष्ठान स्थान"
              : "DivyaDrishti v2.0 • Daily Ritual Space"}
          </span>
        </div>
      </div>
    </div>
  );
}
