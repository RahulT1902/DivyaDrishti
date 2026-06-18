"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, XCircle, Share2, Compass, Eye, Download, X } from "lucide-react";
import { DailyBriefing } from "@/lib/guidance/guidanceCompressor";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  briefing: DailyBriefing;
  userName?: string;
  userEmail: string;
  themeMode?: "morning" | "evening";
}

export default function MorningBriefCard({ briefing, userName, userEmail, themeMode }: Props) {
  const { isHindi, t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const isMorning = themeMode === "morning";
  const isDark = false;

  // Localized translator functions for dynamic strings to ensure native emotional flow
  const getLocalizedHeadline = (headline: string) => {
    if (!isHindi) return headline;
    const h = headline.trim().toLowerCase();
    
    // Deterministic template headlines
    if (h.includes("structured execution phase")) {
      return "संरचित कर्म चरण — आज अपनी ऊर्जा को नए कार्यों के बजाय पूर्व-निर्धारित दायित्वों को पूरा करने में लगाएं।";
    }
    if (h.includes("strategic boldness phase")) {
      return "रणनीतिक साहस चरण — आज साहसिक निर्णय लेने और महत्वाकांक्षी परियोजनाओं को गति देने के लिए समय अनुकूल है।";
    }
    if (h.includes("collaborative expansion phase")) {
      return "सहयोगात्मक विस्तार चरण — आज साझेदारों के साथ मिलकर काम करने और सामूहिक विकास पर ध्यान केंद्रित करने का अवसर है।";
    }
    if (h.includes("internal integration phase")) {
      return "आंतरिक एकीकरण चरण — आज गहरे आत्म-मंथन, विश्राम और अपने मानसिक संतुलन को सुदृढ़ करने पर ध्यान दें।";
    }
    if (h.includes("adaptive observation phase")) {
      return "अनुकूलनशील अवलोकन चरण — आज कोई भी बड़ा कदम उठाने से बचें और शांत रहकर केवल परिस्थितियों का सूक्ष्म निरीक्षण करें।";
    }

    if (h.includes("momentum is building") && h.includes("architect")) {
      return "गति बढ़ रही है — संरेखित स्थिरता आज के लाभ को बढ़ाएगी।";
    }
    if (h.includes("momentum is building") && h.includes("warrior")) {
      return "गति बढ़ रही है — निर्णायक ऊर्जा आज के लाभ को बढ़ाएगी।";
    }
    if (h.includes("steady conditions favor consistent")) {
      return "स्थिर परिस्थितियाँ प्रतिक्रियाशील निर्णयों के बजाय निरंतर और विचारशील प्रगति के अनुकूल हैं।";
    }
    if (h.includes("elevated complexity today")) {
      return "आज जटिलता बढ़ी हुई है — सोच-समझकर की गई प्रतिक्रियाएँ हमेशा सहज प्रवृत्ति से बेहतर प्रदर्शन करती हैं।";
    }
    if (h.includes("this is a phase for building")) {
      return "यह निर्माण का चरण है, विस्तार का नहीं — अनुशासित नींव दीर्घकालिक लाभ देती है।";
    }
    return headline;
  };

  const getLocalizedFocus = (item: string) => {
    if (!isHindi) return item;
    const lower = item.toLowerCase();
    if (lower.includes("structured planning")) return "संरचित योजना";
    if (lower.includes("active listening")) return "सक्रिय श्रवण";
    if (lower.includes("stay consistent")) return "निरंतरता बनाए रखें";
    if (lower.includes("review your plans")) return "अपनी योजनाओं की समीक्षा करें";
    if (lower.includes("build structure")) return "संरचना का निर्माण करें";
    if (lower.includes("practice deliberate pauses")) return "आज कोई भी बड़ा संकल्प लेने से पहले विचारपूर्ण विराम लें";
    if (lower.includes("begin consolidating momentum")) {
      return "आगामी चरण से पहले अपनी गति को सुदृढ़ करना शुरू करें";
    }
    if (lower.includes("collaborating on shared goals")) return "साझे लक्ष्यों पर सहयोग";
    if (lower.includes("initiating important projects")) return "महत्वपूर्ण परियोजनाएं आरंभ करना";
    if (lower.includes("restructuring routines")) return "दिनचर्या का पुनर्गठन";
    if (lower.includes("mindful restraint")) return "सचेत संयम";
    if (lower.includes("refining active workflows")) return "सक्रिय कार्यप्रवाह को परिष्कृत करना";
    if (lower.includes("nurturing key relationships")) return "प्रमुख संबंधों का पोषण";
    if (lower.includes("taking new initiatives")) return "नई पहलें करना";
    if (lower.includes("expanding network")) return "सामूहिक संपर्क बढ़ाना";
    if (lower.includes("capitalizing on momentum")) return "गतिशीलता का लाभ उठाना";
    if (lower.includes("stay grounded in reality")) return "यथार्थ में स्थिर रहें";
    return item;
  };

  const getLocalizedAvoid = (item: string) => {
    if (!isHindi) return item;
    const lower = item.toLowerCase();
    if (lower.includes("reactionary emails")) return "प्रतिक्रियाशील ई-मेल";
    if (lower.includes("unplanned spending")) return "अनायोजित व्यय";
    if (lower.includes("shortcuts")) return "शॉर्टकट (जल्दबाज़ी)";
    if (lower.includes("impulsive spending")) return "जल्दबाज़ी में खर्च";
    if (lower.includes("speculative risks")) return "सट्टा जोखिम";
    if (lower.includes("impulsive commitments")) return "जल्दबाज़ी में वादे";
    if (lower.includes("avoid over-committing")) return "अति-प्रतिबद्धता से बचें";
    return item;
  };

  // Derive execution title mapping for premium, calm tone (cleaner, faster to parse)
  const executionStyles: Record<string, { label: string; bg: string; border: string; text: string }> = {
    ARCHITECT: {
      label: t("Architect Style • Structured Consolidation", "संरचित स्थिरता"),
      bg: isDark ? "bg-indigo-950/45" : "bg-indigo-50",
      border: isDark ? "border-indigo-800/30" : "border-indigo-100",
      text: isDark ? "text-indigo-200" : "text-indigo-800",
    },
    WARRIOR: {
      label: t("Warrior Style • Decisive Focus", "निर्णायक ऊर्जा"),
      bg: isDark ? "bg-amber-950/45" : "bg-amber-50",
      border: isDark ? "border-amber-800/30" : "border-amber-100",
      text: isDark ? "text-amber-200" : "text-amber-800",
    },
  };

  const style = executionStyles[briefing.executionMode] || executionStyles.ARCHITECT;

  return (
    <div className={`space-y-6 ${isHindi ? "leading-loose" : ""}`}>
      {/* ── 1. Theme of the Day Header ────────────────────────────────────────── */}
      <div className="text-center py-4 space-y-2">
        <span className={`text-[10px] font-bold uppercase tracking-[0.4em] block ${isDark ? (isMorning ? "text-amber-300/60" : "text-indigo-300/60") : "text-amber-700/60"} ${isHindi ? "tracking-wider text-xs" : ""}`}>
          {t("Theme of the Day", "आज का भाव")}
        </span>
        <h2 className={`text-2xl font-serif tracking-wide italic font-light ${isDark ? "text-slate-100" : "text-[#3F2D1D]"} ${isHindi ? "text-3xl leading-relaxed font-normal not-italic" : ""}`}>
          {getLocalizedHeadline(briefing.headline)}
        </h2>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold ${style.bg} ${style.border} ${style.text} ${isHindi ? "tracking-wider text-[10px] py-1.5 px-4" : ""}`}>
          <Compass className="w-3 h-3" />
          {style.label}
        </span>
      </div>

      {/* ── 2. Primary Guidance Card ──────────────────────────────────────────── */}
      <div className={`relative overflow-hidden p-8 rounded-[2rem] shadow-sm space-y-6 border transition-all duration-1000 ${
        isDark 
          ? isMorning
            ? "bg-gradient-to-br from-[#2D1625]/60 to-[#140C12]/95 border-[#522546]/30 text-slate-100 backdrop-blur-md"
            : "bg-gradient-to-br from-[#121622]/60 to-[#08090C]/95 border-[#232B40]/30 text-slate-100 backdrop-blur-md"
          : "bg-white border-[#F1E7D0] text-[#3F2D1D]"
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />
        
        {/* Directive details */}
        <div className="space-y-2">
          <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-amber-300/80" : "text-amber-800/80"} ${isHindi ? "tracking-wider text-[10px]" : ""}`}>
            {t("Celestial Directive", "आकाशीय निर्देश")}
          </p>
          <p className={`text-base font-light leading-relaxed ${isDark ? "text-slate-200" : "text-[#3F2D1D]/80"} ${isHindi ? "text-lg leading-loose font-normal" : ""}`}>
            {t(
              "Practice strategic restraint. Channel your momentum primarily into consolidating core goals rather than scattering energy into new initiatives.",
              "रणनीतिक संयम का अभ्यास करें। अपनी ऊर्जा को नई पहलों में बिखेरने के बजाय मुख्य लक्ष्यों को सुदृढ़ करने में केंद्रित करें।"
            )}
          </p>
        </div>

        {/* Dynamic transition/memory context */}
        {(briefing.memoryInfluence || briefing.transitionAlert) && (
          <div className={`border-t pt-4 space-y-2 ${isDark ? "border-white/10" : "border-[#F1E7D0]/60"}`}>
            {briefing.memoryInfluence && (
              <p className={`text-xs font-light italic leading-relaxed ${isDark ? "text-purple-300/80" : "text-purple-900/70"} ${isHindi ? "text-sm leading-relaxed" : ""}`}>
                ✦ {isHindi ? "आपकी पिछली स्मृतियां सुझाव देती हैं कि आज प्रतिक्रियाशील निर्णयों के प्रति सतर्क रहें।" : briefing.memoryInfluence}
              </p>
            )}
            {briefing.transitionAlert && (
              <p className={`text-xs font-light italic leading-relaxed ${isDark ? "text-amber-300/80" : "text-amber-900/70"} ${isHindi ? "text-sm leading-relaxed" : ""}`}>
                ⚡ {isHindi ? "ऊर्जा चक्र में बदलाव समीप है — वर्तमान स्थिति को समेटना शुरू करें।" : briefing.transitionAlert}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Priorities & Restraints Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Do (Priorities) */}
        <div className={`p-6 rounded-[2rem] border shadow-sm space-y-4 ${
          isDark 
            ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-100" 
            : "bg-emerald-50/60 border border-emerald-100 text-[#3F2D1D]"
        }`}>
          <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? "text-emerald-300" : "text-emerald-800"} ${isHindi ? "tracking-wider text-xs" : ""}`}>
            <BrainCircuit className="w-3.5 h-3.5" />
            {t("Today Favors (Focus)", "आज अनुकूल है")}
          </h3>
          <ul className="space-y-3.5">
            {briefing.priorities.map((priority, index) => (
              <li key={index} className="flex gap-3 items-start">
                <span className={`text-[9px] font-bold mt-1 shrink-0 ${isDark ? "text-emerald-400/80" : "text-emerald-600/60"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className={`text-xs font-light leading-relaxed ${isDark ? "text-emerald-100/90" : "text-emerald-950/80"} ${isHindi ? "text-sm leading-relaxed" : ""}`}>
                  {getLocalizedFocus(priority)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Avoid (Restraints) */}
        <div className={`p-6 rounded-[2rem] border shadow-sm space-y-4 ${
          isDark 
            ? "bg-rose-950/20 border-rose-900/30 text-rose-100" 
            : "bg-rose-50/60 border border-rose-100 text-[#3F2D1D]"
        }`}>
          <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? "text-rose-300" : "text-rose-800"} ${isHindi ? "tracking-wider text-xs" : ""}`}>
            <XCircle className="w-3.5 h-3.5" />
            {t("Mindful Restraints (Avoid)", "आज संयम रखें")}
          </h3>
          <ul className="space-y-3">
            {briefing.avoid.map((avoid, index) => (
              <li key={index} className="flex gap-2 items-start">
                <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isDark ? "bg-rose-400/50" : "bg-rose-500/40"}`} />
                <p className={`text-xs font-light leading-relaxed ${isDark ? "text-rose-100/90" : "text-rose-950/80"} ${isHindi ? "text-sm leading-relaxed" : ""}`}>
                  {getLocalizedAvoid(avoid)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 4. Premium Share Section ─────────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-5 py-2.5 border text-xs font-semibold uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-sm ${
            isDark 
              ? "bg-white/5 border-white/10 text-slate-100 hover:bg-white/10" 
              : "bg-white border-[#F1E7D0] text-[#3F2D1D] hover:bg-[#EADFC7]/50"
          } ${isHindi ? "tracking-wider text-[10px]" : ""}`}
        >
          <Share2 className="w-3.5 h-3.5 text-current opacity-70" />
          {t("Share Today's Cosmic Card", "आज का खगोलीय पत्र साझा करें")}
        </button>
      </div>

      {/* ── 5. Cosmic Card Premium Editorial Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-[#F8F5EF] border border-[#F1E7D0] rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white border border-[#F1E7D0] text-[#3F2D1D]/70 hover:bg-[#EADFC7]/50 transition-all z-10 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 text-center space-y-6">
                <div className="space-y-1">
                  <h3 className={`text-lg font-serif text-[#3F2D1D] font-light ${isHindi ? "text-xl leading-relaxed" : ""}`}>
                    {t("Your Shareable Cosmic Card", "आपका दैनिक खगोलीय पत्र")}
                  </h3>
                  <p className="text-xs text-amber-800/60 font-serif">
                    {t("Premium spiritual editorial layout. Press and hold to save on mobile.", "उत्कृष्ट आध्यात्मिक रूपरेखा। मोबाइल पर सहेजने के लिए दबाकर रखें।")}
                  </p>
                </div>

                {/* Editorial Card Preview */}
                <div className="relative aspect-square max-w-[360px] mx-auto rounded-2xl overflow-hidden border border-[#F1E7D0] shadow-2xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/cosmic-card?email=${encodeURIComponent(userEmail)}`}
                    alt="Today's Cosmic Card"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href={`/api/cosmic-card?email=${encodeURIComponent(userEmail)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 px-5 py-2.5 bg-white border border-[#F1E7D0] text-[#3F2D1D] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#EADFC7]/50 transition-all shadow-sm ${isHindi ? "tracking-wider" : ""}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("Open Original", "मूल पत्र खोलें")}
                  </a>
                  <a
                    href={`/api/cosmic-card?email=${encodeURIComponent(userEmail)}`}
                    download={`CosmicCard-${new Date().toISOString().split("T")[0]}.png`}
                    className={`flex items-center gap-2 px-5 py-2.5 bg-[#3F2D1D] border border-[#3F2D1D] text-[#F8F5EF] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#3F2D1D]/90 transition-all shadow-sm ${isHindi ? "tracking-wider" : ""}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("Download PNG", "डाउनलोड पीएनजी")}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
