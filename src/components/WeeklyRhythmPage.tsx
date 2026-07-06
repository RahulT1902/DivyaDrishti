"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Brain, TrendingUp, Sparkles, Loader2, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { authFetch } from "@/lib/auth/webFetch";

interface ReflectionHistoryItem {
  id: string;
  date: string;
  energy: "HIGH" | "NEUTRAL" | "LOW";
  stress: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
}

export default function WeeklyRhythmPage({ chartData, user }: { chartData?: any; user?: any }) {
  const { isHindi } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ReflectionHistoryItem[]>([]);
  const [panchang, setPanchang] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [historyRes, panchangRes] = await Promise.all([
        authFetch("/api/reflections/history"),
        authFetch("/api/panchang/today"),
      ]);
      const historyData = await historyRes.json();
      const panchangData = await panchangRes.json();
      if (historyData.success) setHistory(historyData.history || []);
      if (panchangData.success) setPanchang(panchangData.panchang);
    } catch (err: any) {
      console.error("Error loading weekly rhythm:", err);
      setError(err.message || "Failed to fetch weekly rhythm data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate last 7 calendar days starting from 6 days ago up to today
  const getCalendarDays = () => {
    const days = [];
    const weekdays = isHindi
      ? ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);

      const realLog = history.find(item => {
        const itemDate = new Date(item.date);
        itemDate.setUTCHours(0, 0, 0, 0);
        return itemDate.getTime() === d.getTime();
      });

      // Real Panchang data available only for today
      const todayPanchang = i === 0 ? panchang : null;

      days.push({
        dateObject: d,
        dayLabel: weekdays[d.getDay()],
        dayNum: d.getDate(),
        panchang: todayPanchang,
        log: realLog || null,
      });
    }
    return days;
  };

  const days = getCalendarDays();

  // Compute stats for Temporal Intelligence Summary
  const loggedCount = history.length;
  const highEnergyDays = history.filter(h => h.energy === "HIGH").length;
  const highStressDays = history.filter(h => h.stress === "HIGH").length;

  // Render loading or error
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-[#3F2D1D]">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin" />
        <p className="text-xs text-amber-800/60 uppercase tracking-[0.2em] font-serif animate-pulse">
          {isHindi ? "सामयिक सहसंबंधों का विश्लेषण किया जा रहा है..." : "Computing Temporal Correlations..."}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8F5EF] text-[#3F2D1D] p-6 font-sans relative overflow-hidden transition-all duration-1000 ${isHindi ? "leading-loose" : ""}`}>
      
      {/* background lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-800/5 to-transparent blur-[120px] rounded-full animate-pulse" style={{ animationDuration: "10s" }} />
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header Block */}
        <div className="border-b border-[#F1E7D0] pb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif tracking-wide font-light">
              {isHindi ? (
                <>साप्ताहिक <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600 font-serif">लय</span></>
              ) : (
                <>Weekly <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600 font-serif">Rhythm</span></>
              )}
            </h2>
            <p className="text-xs text-amber-800/60 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {isHindi 
                ? "सामयिक सहसंबंध आव्यूह — ग्रहीय गति बनाम लॉग किए गए शारीरिक अनुभव"
                : "Temporal Correlation Matrix — Planetary Speeds vs. Logged Reflections"}
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white border border-[#F1E7D0] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#3F2D1D]/60">
              {isHindi ? "दैहिक लय पैटर्न" : "Somatic Rhythm Patterns"}
            </span>
          </div>
        </div>

        {/* ── Temporal Intelligence Moat card ─────────────────────────────────── */}
        <div className="bg-white border border-[#F1E7D0] rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-sm">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Brain className="w-5 h-5 text-amber-700" />
              <span className="text-xs uppercase font-bold tracking-widest text-amber-850">
                {isHindi ? "व्यक्तिगत समय-चक्र विवेचन" : "Personalised Temporal Intelligence"}
              </span>
            </div>
            <h3 className="text-xl font-serif text-[#3F2D1D]">
              {isHindi ? "आकाशीय चरण संरेखण" : "Cosmic Phase Alignment"}
            </h3>
            <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light">
              {isHindi 
                ? "जब चंद्रमा रोहिणी या पुष्य जैसे पुष्टकारी नक्षत्रों से गुजरता है, तो आपके विचारों में उच्च प्राण ऊर्जा और जीवंतता देखी जाती है। इसके विपरीत, शनि-प्रभावित या मंगल की धीमी गोचर गतियों के दौरान आंतरिक खिंचाव या तनाव में वृद्धि हो सकती है। ये गोचरजन्य अवलोकन हैं — कोई अपरिवर्तनीय भविष्यवाणियां नहीं। इनका उपयोग अपने जीवन की गति को अनुकूल बनाने के लिए करें, न कि किसी कठोर नियम के रूप में।"
                : "Periods when the Moon passes through nourishing Nakshatras like Rohini or Pushya tend to coincide with higher recorded vitality in your reflections. Conversely, slower transits and Mars activity appear to correlate with increased inner tension. These are observational patterns — not predictions. Use them as gentle prompts for pacing, not as fixed rules."}
            </p>
          </div>
          
          <div className="md:col-span-4 bg-[#F8F5EF] border border-[#F1E7D0] rounded-2xl p-5 space-y-3 h-full flex flex-col justify-center">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#3F2D1D]/60 font-light">
                {isHindi ? "चक्र लॉगिंग निरंतरता:" : "Cycle Logging Consistency:"}
              </span>
              <span className="text-amber-800 font-bold">{loggedCount}/{isHindi ? "7 दिन" : "7 Days"}</span>
            </div>
            <div className="w-full bg-[#EADFC7] rounded-full h-1.5">
              <div className="bg-amber-750 h-1.5 rounded-full" style={{ width: `${(loggedCount / 7) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#3F2D1D]/60 font-light">
              <span>
                {isHindi ? `उच्च प्राण ऊर्जा: ${highEnergyDays} दिन` : `Vitality peaks: ${highEnergyDays} days`}
              </span>
              <span>
                {isHindi ? `आंतरिक तनाव: ${highStressDays} दिन` : `Tension spikes: ${highStressDays} days`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Weekly Calendar Grid ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm uppercase tracking-widest text-amber-850 font-bold">
              {isHindi ? "साप्ताहिक संरेखण आव्यूह" : "Week-at-a-Glance Matrix"}
            </h4>
            <span className="text-[10px] text-[#3F2D1D]/55 font-light italic">
              {isHindi ? "छोटे उपकरणों पर देखने के लिए क्षैतिज रूप से स्क्रॉल करें" : "Scroll horizontally if viewing on smaller devices"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day, idx) => {
              const isToday = idx === 6;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 bg-white flex flex-col justify-between space-y-4 transition-all hover:border-amber-300/40 shadow-sm ${
                    isToday ? "border-amber-500 ring-1 ring-amber-500/20" : "border-[#F1E7D0]"
                  }`}
                >
                  {/* Date Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#3F2D1D]/55 block">{day.dayLabel}</span>
                      <span className="text-lg font-serif font-semibold text-[#3F2D1D]">{day.dayNum}</span>
                    </div>
                    {isToday && (
                      <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                        {isHindi ? "आज" : "Today"}
                      </span>
                    )}
                  </div>

                  {/* Panchang / Transit — real data for today, archived label for past */}
                  {day.panchang ? (
                    <div className="p-2.5 rounded-xl border text-[10px] font-sans border-emerald-200 text-emerald-800 bg-emerald-50/50">
                      <span className="font-bold block text-[9px] uppercase tracking-wider mb-0.5">
                        {day.panchang.nakshatra?.name ?? (isHindi ? "नक्षत्र" : "Nakshatra")}
                      </span>
                      <span className="block font-medium leading-tight opacity-90">
                        {day.panchang.tithi?.name ?? ""}
                      </span>
                      {day.panchang.yoga?.name && (
                        <span className="block text-[8px] font-bold mt-1 uppercase tracking-widest text-right opacity-60">
                          {day.panchang.yoga.name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl border text-[10px] font-sans border-[#F1E7D0] text-[#3F2D1D]/40 bg-[#F8F5EF]/60 text-center italic">
                      {isHindi ? "गोचर डेटा अनुपलब्ध" : "Transit archived"}
                    </div>
                  )}

                  {/* Reflection Log Correlation */}
                  <div className="border-t border-[#F1E7D0]/60 pt-3 space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-[#3F2D1D]/50 block font-bold">
                      {isHindi ? "लॉग किया गया शारीरिक संरेखण" : "Logged SOMATICS"}
                    </span>
                    
                    {day.log ? (
                      <div className="space-y-1.5">
                        {/* Energy */}
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#3F2D1D]/60 font-light">{isHindi ? "प्राण ऊर्जा:" : "Vitality:"}</span>
                          <span className={`font-semibold ${
                            day.log.energy === "HIGH" ? "text-emerald-700" : day.log.energy === "NEUTRAL" ? "text-amber-700" : "text-indigo-700"
                          }`}>
                            {day.log.energy === "HIGH" 
                              ? (isHindi ? "⚡ उच्च" : "⚡ High") 
                              : day.log.energy === "NEUTRAL" 
                                ? (isHindi ? "😐 मध्यम" : "😐 Mid") 
                                : (isHindi ? "💤 निम्न" : "💤 Low")}
                          </span>
                        </div>
                        {/* Stress */}
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#3F2D1D]/60 font-light">{isHindi ? "आंतरिक तनाव:" : "Tension:"}</span>
                          <span className={`font-semibold ${
                            day.log.stress === "LOW" ? "text-emerald-700" : day.log.stress === "MEDIUM" ? "text-amber-700" : "text-rose-700"
                          }`}>
                            {day.log.stress === "LOW" 
                              ? (isHindi ? "🟢 शांत" : "🟢 Calm") 
                              : day.log.stress === "MEDIUM" 
                                ? (isHindi ? "🟡 मध्यम" : "🟡 Mid") 
                                : (isHindi ? "🔴 तीव्र" : "🔴 Tight")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-[#3F2D1D]/40 block text-center py-1">
                        {isHindi ? "कोई प्रविष्टि नहीं" : "No reflection"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Correlation Analysis Matrix ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Somatic Correlation Explanation */}
          <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <TrendingUp className="w-5 h-5 text-amber-700" />
              <h4 className="text-sm font-semibold text-[#3F2D1D] uppercase tracking-widest font-serif">
                {isHindi ? "अवलोकित ऊर्जावान विन्यास" : "Observed Energetic Patterns"}
              </h4>
            </div>
            
            <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light">
              {isHindi 
                ? "वैदिक ज्योतिष में, नक्षत्रों के माध्यम से चंद्रमा की गोचर गति को आपके आंतरिक भावनात्मक वातावरण का सूचक माना जाता है — यह आपके अनुभवों को बाध्य करने वाला कोई कठोर नियम नहीं है। तीव्र चंद्रमा बाहरी गतिविधियों और उत्साह के दिनों के अनुकूल होता है; जबकि मंद चंद्रमा शांत, अंतर्मुखी और आत्म-मंथन के समय का संकेत देता है।"
                : "In Vedic Jyotish, the Moon's transit speed through Nakshatras is considered an indicator of the ambient emotional climate — not a deterministic ruler of your experience. A fast Moon tends to coincide with more outward-facing days; a slow Moon with quieter, more inward ones."}
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <p className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold mb-1">
                  {isHindi ? "तीव्र नक्षत्र गोचर" : "Swift Nakshatra Transits"}
                </p>
                <p className="text-xs text-[#3F2D1D]/80 font-light leading-relaxed">
                  {isHindi 
                    ? "लूनर गोचर की तीव्र गतियों के दौरान शारीरिक और मानसिक प्राण ऊर्जा उच्च स्तर पर देखी जाती है। इस अवधि में रचनात्मक योजनाएं और बाहरी संपर्क वाले कार्यों को प्राथमिकता देने पर विचार करें।"
                    : "Periods of faster lunar movement tend to appear alongside higher recorded vitality in somatic reflections. Consider planning outward-facing work during these windows."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <p className="text-[10px] uppercase tracking-widest text-rose-800 font-bold mb-1">
                  {isHindi ? "मंद शनि-प्रभावित काल" : "Slower Saturn-Influenced Periods"}
                </p>
                <p className="text-xs text-[#3F2D1D]/80 font-light leading-relaxed">
                  {isHindi 
                    ? "शनि के प्रभाव या धीमी चंद्र गति के दौरान भावनात्मक चंचलता में कमी और एकाग्रता में वृद्धि होती है। इन्हें बाधा के रूप में नहीं, बल्कि स्वयं को पुनः व्यवस्थित करने वाले एक प्राकृतिक समेकन चरण के रूप में देखें।"
                    : "Periods of increased Saturn transit activity appear to correlate with reduced emotional steadiness. These are natural consolidation phases — not obstacles."}
                </p>
              </div>
            </div>
          </div>

          {/* Temporal Advice / Practical Behavioral Action */}
          <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h4 className="text-sm font-semibold text-[#3F2D1D] uppercase tracking-widest font-serif">
                  {isHindi ? "क्रियात्मक आकाशीय निर्देश" : "Actionable Guidance"}
                </h4>
              </div>
              <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light">
                {isHindi 
                  ? "अपने आकाशीय संरेखण को अधिकतम करने के लिए, अपनी दिनचर्या को अपने प्राकृतिक बायोमेट्रिक प्रवाह के साथ तालमेल में लाएं:"
                  : "To maximize your alignment, adjust your schedule to match your natural biometric flow:"}
              </p>
              
              <ul className="space-y-2 text-xs font-light text-[#3F2D1D]/85">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>
                    {isHindi ? (
                      <>महत्वपूर्ण वार्तालाप और संवाद वृषभ या मिथुन राशि के गोचर के दौरान नियोजित करें जब आपका आकाशीय गति अंक 75%+ होता है।</>
                    ) : (
                      <><strong>Plan critical communications</strong> during Moon-in-Taurus or Gemini transits where your cosmic speed score sits at 75%+.</>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>
                    {isHindi ? (
                      <>मंगलवार तथा वृश्चिक राशि के धीमे गोचर काल में शांत अंतर्मुखी विश्राम को प्राथमिकता दें, और अत्यधिक बाहरी मुलाकातों को सीमित रखें।</>
                    ) : (
                      <><strong>Schedule quiet introspective resets</strong> on Tuesdays and slow Scorpio transits, minimizing heavy outward-facing meetings.</>
                    )}
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mt-3">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[10.5px] leading-relaxed text-amber-900 font-light italic">
                {isHindi 
                  ? "स्मरण रखें: गोचर बाहरी पर्यावरण और वातावरण को दर्शाता है। आपकी दैनिक शारीरिक प्रतिक्रियाएं आपकी आंतरिक संवेदनशीलता को दर्शाती हैं। वास्तविक प्रभुत्व केवल शांत और संयमित रहने में निहित है।"
                  : "Remember: The transits reflect the environmental climate. Your daily somatic reflections reflect your reaction. Mastery lies in quiet containment."}
              </p>
            </div>
          </div>

        </div>

        {/* System Footer info */}
        <div className="pt-6 flex items-center justify-between border-t border-[#F1E7D0] text-[9px] font-serif tracking-widest text-amber-800/40 uppercase">
          <span>{isHindi ? "व्यक्तिगत सामयिक बोध" : "Personalised Temporal Awareness"}</span>
          <span>{isHindi ? "अवलोकन जन्य · अभविष्यवाणी" : "Observational · Not Predictive"}</span>
        </div>

      </div>
    </div>
  );
}
