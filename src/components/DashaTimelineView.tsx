"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, AlertTriangle, Compass, History } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DashaTimelineViewProps {
  temporal: any;
  narrative: string;
  insights: any;
  guidance: any;
}

const PLANET_NAMES_HI: Record<string, string> = {
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु"
};

const translatePlanetHi = (name: string) => {
  return PLANET_NAMES_HI[name] || name;
};

const translateTimeHi = (str: string) => {
  if (!str) return "";
  return str
    .replace(/years?/gi, "वर्ष")
    .replace(/months?/gi, "माह")
    .replace(/days?/gi, "दिन")
    .replace(/ends in/gi, "")
    .trim();
};

const getLocalizedPrimaryInsight = (text: string, isHindi: boolean) => {
  if (!isHindi || !text) return text;
  const trimmed = text.trim();
  if (trimmed.includes("A harmonious phase favoring steady progress")) {
    return "एक सामंजस्यपूर्ण चरण जो निरंतर और स्थिर प्रगति के अनुकूल है।";
  }
  if (trimmed.includes("Stability and structural focus")) {
    return "स्थिरता और संरचनात्मक फोकस ही आज की मुख्य कुंजी है।";
  }
  return text;
};

const getLocalizedCaution = (text: string, isHindi: boolean) => {
  if (!isHindi || !text) return text;
  const trimmed = text.trim();
  if (trimmed.includes("Avoid over-committing")) {
    return "अति-प्रतिबद्धता से बचें";
  }
  return text;
};

const getLocalizedDoAvoid = (text: string, isHindi: boolean) => {
  if (!isHindi || !text) return text;
  const lower = text.toLowerCase();
  if (lower.includes("taking new initiatives")) return "नई पहलें करना";
  if (lower.includes("expanding network")) return "सामूहिक संपर्क बढ़ाना";
  if (lower.includes("capitalizing on momentum")) return "गतिशीलता का लाभ उठाना";
  if (lower.includes("avoid over-committing")) return "अति-प्रतिबद्धता से बचें";
  if (lower.includes("stay grounded in reality")) return "यथार्थ में स्थिर रहें";
  return text;
};

function PunditNarrative({ narrative }: { narrative: string }) {
  const parts = narrative.split("\n\n").filter(p => p.trim() !== "");
  return (
    <div className="space-y-5">
      {parts.map((part, i) => {
        if (i === 0) return (
          <p key={i} className="text-xl font-serif font-medium text-amber-900 border-l-4 border-amber-500 pl-5 py-1 leading-snug">
            {part}
          </p>
        );
        if (i === parts.length - 1) return (
          <p key={i} className="text-sm font-bold text-amber-600 border-t border-amber-100 pt-4 tracking-wide">
            {part}
          </p>
        );
        return (
          <p key={i} className="text-sm text-amber-800 font-normal leading-relaxed whitespace-pre-wrap pl-5">
            {part}
          </p>
        );
      })}
    </div>
  );
}

export default function DashaTimelineView({ temporal, narrative, insights, guidance }: DashaTimelineViewProps) {
  const { isHindi } = useLanguage();
  const [showExplainer, setShowExplainer] = useState(false);

  const translatedMahadasha = isHindi ? translatePlanetHi(temporal.stack.mahadasha) : temporal.stack.mahadasha;
  const translatedAntardasha = isHindi ? translatePlanetHi(temporal.stack.antardasha) : temporal.stack.antardasha;
  const translatedPratyantar = isHindi ? translatePlanetHi(temporal.stack.pratyantar) : temporal.stack.pratyantar;

  const getPressureLabel = (pressure: string) => {
    if (!isHindi) return `${pressure} Pressure Phase`;
    switch (pressure?.toLowerCase()) {
      case "high": return "सघन आत्म-मंथन काल (सक्रिय)";
      case "medium": return "मध्यम अनुशासन काल (सक्रिय)";
      case "low": return "सौम्य संरेखण काल (सक्रिय)";
      default: return "सक्रिय दशा संरेखण";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* Hero Summary Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#F1E7D0] shadow-sm p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100/60 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none" />
        <div className="absolute top-6 right-6">
          <div className="bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
            <span className={`text-[10px] font-bold text-amber-700 uppercase ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
              {getPressureLabel(temporal.timing.pressure)}
            </span>
          </div>
        </div>

        <div className="space-y-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className={`text-sm font-bold uppercase ${isHindi ? 'tracking-normal text-base text-amber-900' : 'tracking-[0.3em] text-amber-700/60'}`}>
              {isHindi ? "सक्रिय दशा चक्र विन्यास" : "Active Dasha Profile"}
            </h3>
          </div>

          <div className="flex flex-wrap items-end gap-6 font-serif">
            <div className="space-y-1">
              <p className={`text-[10px] uppercase text-amber-700/40 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "महादशा स्वामी" : "Mahadasha"}
              </p>
              <h4 className="text-4xl md:text-5xl text-amber-900 font-semibold">{translatedMahadasha}</h4>
            </div>
            <span className="text-3xl text-amber-300 pb-1">/</span>
            <div className="space-y-1">
              <p className={`text-[10px] uppercase text-amber-700/40 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "अंतर्दशा स्वामी" : "Sub-phase"}
              </p>
              <h4 className="text-4xl md:text-5xl text-amber-600 font-medium">{translatedAntardasha}</h4>
            </div>
            {temporal.stack.pratyantar && (
              <>
                <span className="text-3xl text-amber-300 pb-1">/</span>
                <div className="space-y-1">
                  <p className={`text-[10px] uppercase text-amber-700/40 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                    {isHindi ? "प्रत्यंतर्दशा (स्पष्टता)" : "Clarity Focus"}
                  </p>
                  <h4 className="text-4xl md:text-5xl text-amber-500 font-medium">{translatedPratyantar}</h4>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#F1E7D0]">
            <div className="space-y-1">
              <p className={`text-[10px] uppercase text-amber-700/40 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "मुख्य ग्रहीय ऊर्जा" : "Dominant Force"}
              </p>
              <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {translatedMahadasha}
              </p>
            </div>
            <div className="space-y-1">
              <p className={`text-[10px] uppercase text-amber-700/40 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "विवेचन सटीकता" : "Clarity Level"}
              </p>
              <p className="text-sm font-medium text-amber-700">
                {isHindi ? "अत्यंत सूक्ष्म (उच्च सटीकता)" : "High Resolution"}
              </p>
            </div>
            <div className="space-y-1">
              <p className={`text-[10px] uppercase text-amber-700/40 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "अवशिष्ट गोचर काल" : "Remaining Time"}
              </p>
              <p className="text-sm font-medium text-amber-900">
                {isHindi 
                  ? `${translateTimeHi(temporal.timing.remaining)} शेष` 
                  : `Ends in ${temporal.timing.remaining}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Narrative */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <h3 className={`text-[11px] font-bold uppercase text-amber-700 ${isHindi ? 'tracking-normal text-xs' : 'tracking-[0.4em]'}`}>
                {isHindi ? "पंडित जी का महादशा विवेचन" : "The Reading"}
              </h3>
            </div>
            <PunditNarrative narrative={narrative} />
          </div>

          {/* Expandable Why */}
          <div className="bg-white border border-[#F1E7D0] rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="w-full flex items-center justify-between p-5 hover:bg-amber-50 transition-all"
            >
              <span className={`text-[11px] font-bold uppercase text-amber-700/60 ${isHindi ? 'tracking-normal' : 'tracking-widest'}`}>
                {isHindi ? "यह महादशा चक्र ऐसा क्यों महसूस हो रहा है?" : "Why does this phase feel this way?"}
              </span>
              <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${showExplainer ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showExplainer && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-sm text-amber-800 font-normal leading-relaxed border-t border-[#F1E7D0]">
                    {isHindi 
                      ? "यह काल गुरुदेव की विस्तारवादी ऊर्जा तथा शनि देव के अनुशासित न्यायप्रिय प्रभाव का एक सुंदर संगम है। यह आपके जीवन में धैर्य और निरंतर श्रम के माध्यम से प्रगति का मार्ग प्रशस्त करता है। इस संयोजन से उत्पन्न सकारात्मक रचनात्मक खिंचाव दीर्घकालिक सुदृढ़ नींव का निर्माण करने में सहायक होता है।"
                      : "This phase combines Jupiter's expansion energy with Saturn's discipline—pushing growth, but only through consistent, patient effort. The combination creates productive tension that ultimately builds lasting foundations."}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Insights & Guidance */}
        <div className="lg:col-span-5 space-y-6">

          {/* Current Reality */}
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className={`text-[11px] font-bold uppercase text-amber-700 ${isHindi ? 'tracking-normal text-xs' : 'tracking-[0.4em]'}`}>
              {isHindi ? "तात्कालिक वास्तविकता" : "Current Reality"}
            </h4>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 leading-relaxed">{getLocalizedPrimaryInsight(insights.primary, isHindi)}</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <p className={`text-[9px] font-bold uppercase text-orange-600 mb-2 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "सौम्य जागरूकता एवं संयम" : "What to Watch"}
              </p>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500/60 mt-0.5 shrink-0" />
                <p className="text-sm text-orange-800 leading-relaxed">{getLocalizedCaution(insights.caution, isHindi)}</p>
              </div>
            </div>
          </div>

          {/* Guidance */}
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className={`text-[11px] font-bold uppercase text-amber-700 ${isHindi ? 'tracking-normal text-xs' : 'tracking-[0.4em]'}`}>
              {isHindi ? "साधना एवं कर्म संरेखण पथ" : "The Path Forward"}
            </h4>
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className={`text-[10px] font-bold uppercase text-emerald-700 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "इनका अधिक अभ्यास करें (साधना)" : "Do More Of"}
                </span>
              </div>
              <ul className="space-y-2">
                {guidance.do.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {getLocalizedDoAvoid(item, isHindi)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className={`text-[10px] font-bold uppercase text-rose-700 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "इनमें संयम बरतें (नियम)" : "Practice Restraint"}
                </span>
              </div>
              <ul className="space-y-2">
                {guidance.avoid.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-rose-800 flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span> {getLocalizedDoAvoid(item, isHindi)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next Phase Shift */}
      <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
        <h4 className={`text-[11px] font-bold uppercase text-amber-700 mb-4 ${isHindi ? 'tracking-normal text-xs' : 'tracking-[0.4em]'}`}>
          {isHindi ? "अगला दशा परिवर्तन काल" : "Next Phase Shift"}
        </h4>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-sm text-amber-800 leading-relaxed max-w-lg">
            {isHindi 
              ? "आगामी दशा चक्र ग्रहीय दबाव को शिथिल करेगा, जिससे आपको स्पष्ट निर्णय लेने और त्वरित प्रगति करने के नए अवसर मिलेंगे। वर्तमान में आपके द्वारा निर्मित अनुशासित नींव ही आपकी आगामी यात्रा की गति निर्धारित करेगी।"
              : "The next phase reduces pressure and allows faster movement with clearer decisions. What you build now determines how fast you move next."}
          </p>
          <p className="text-[11px] font-mono text-amber-600 whitespace-nowrap">
            {isHindi 
              ? `प्रारंभ तिथि: ${new Date(temporal.timing.endsAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : `Starts ${new Date(temporal.timing.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
          <div className="h-full w-[40%] bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
        </div>
        <p className="text-[10px] text-amber-600/50 mt-1">
          {isHindi 
            ? `वर्तमान अंतर्दशा का 40% भाग पूर्ण` 
            : "40% through current Antardasha"}
        </p>
      </div>
    </div>
  );
}
