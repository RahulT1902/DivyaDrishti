"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavigationDashboard from "./NavigationDashboard";
import KundliPage from "./KundliPage";
import PredictionsPage from "./PredictionsPage";
import TransitsPage from "./TransitsPage";
import DashaTimelineView from "./DashaTimelineView";
import { Sparkles, Loader, Quote } from "lucide-react";
import PunditChatView from "./PunditChatView";
import DailyRitualPage from "./DailyRitualPage";
import RemediesPage from "./RemediesPage";
import PlanetsDetailsPage from "./PlanetsDetailsPage";
import WeeklyRhythmPage from "./WeeklyRhythmPage";
import LifeInsightsPage from "./LifeInsightsPage";
import { useLanguage } from "@/context/LanguageContext";

type Tab = "daily" | "home" | "kundali" | "transit" | "dasha" | "predictions" | "planets" | "chat" | "remedies" | "weekly" | "life-insights";

export default function DashboardHub({ user }: { user: any }) {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const emailQuery = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
      const res = await fetch(`/api/astrology/chart${emailQuery}`);
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || (isHindi ? "कॉस्मिक डेटा लोड करने में विफल" : "Failed to load cosmic data"));
      }
    } catch (err) {
      setError(isHindi ? "आकाशीय इंजन से जुड़ने में त्रुटि" : "Error connecting to celestial engine");
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
      case "daily":
        return <DailyRitualPage user={user} />;
      case "home":
        return <HomeTab user={user} data={data} />;
      case "kundali":
        return <KundliPage chartData={data} />;
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
        return <PredictionsPage chartData={data} />;
      case "transit":
        return <TransitsPage chartData={data} />;
      case "planets":
        return <PlanetsDetailsPage chartData={data} />;
      case "remedies":
        return <RemediesPage chartData={data} setActiveTab={setActiveTab} />;
      case "weekly":
        return <WeeklyRhythmPage chartData={data} user={user} />;
      case "life-insights":
        return <LifeInsightsPage user={user} />;
      case "chat":
        return <PunditChatView />;
      default:
        return <HomeTab user={user} data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF]">
      <NavigationDashboard 
        tab={activeTab as string} 
        setTab={(t) => setActiveTab(t as Tab)} 
        onLogout={() => {
          localStorage.removeItem("divya:loggedIn");
          localStorage.removeItem("divya:userEmail");
          router.push("/login");
        }} 
      />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {renderContent()}
      </motion.div>
    </div>
  );
}

function HomeTab({ user, data }: { user: any, data: any }) {
  const { isHindi } = useLanguage();
  const { narrative, insights, guidance, temporal } = data;

  // Premium, culturally intelligent client-side translator functions
  const getLocalizedDasha = (dashaStr: string) => {
    if (!isHindi || !dashaStr) return dashaStr;
    const parts = dashaStr.split(/([\s\-/]+)/);
    return parts.map(part => {
      const trimmed = part.trim().toLowerCase();
      if (trimmed === "saturn") return "शनि";
      if (trimmed === "jupiter") return "गुरु";
      if (trimmed === "venus") return "शुक्र";
      if (trimmed === "sun") return "सूर्य";
      if (trimmed === "moon") return "चंद्र";
      if (trimmed === "mars") return "मंगल";
      if (trimmed === "mercury") return "बुध";
      if (trimmed === "rahu") return "राहु";
      if (trimmed === "ketu") return "केतु";
      if (trimmed === "dasha") return "दशा";
      if (trimmed === "bhukti") return "भुक्ति";
      if (trimmed === "stable") return "स्थिर";
      return part;
    }).join("");
  };

  const getLocalizedPrimaryInsight = (text: string) => {
    if (!isHindi || !text) return text;
    const trimmed = text.trim();
    if (trimmed.includes("Financial conditions are in a consolidation phase")) {
      return "वित्तीय स्थिति समेकन के चरण में है। इस परिवेश में दीर्घकालिक स्थिरता का निर्माण करना सट्टा व्यापार की तुलना में कहीं अधिक फलदायी रहता है।";
    }
    if (trimmed.includes("Career conditions appear moderately stable")) {
      return "करियर की स्थिति मध्यम रूप से स्थिर प्रतीत होती है। इस चरण में अनुशासित और संरचित कार्यशैली, प्रतिक्रियाशील बदलावों की तुलना में बेहतर परिणाम देती है।";
    }
    if (trimmed.includes("Depth is achieved through patient re-evaluation")) {
      return "धैर्यपूर्वक पुनर्मूल्यांकन करने से संबंधों में प्रगाढ़ता प्राप्त होती है।";
    }
    if (trimmed.includes("Resilience builds through structured recovery")) {
      return "संरचित पुनर्जीवन के माध्यम से स्वास्थ्य और मानसिक लचीलापन सुदृढ़ होता है।";
    }
    if (trimmed.includes("Security builds through cautious accumulation")) {
      return "सतर्कतापूर्वक संचय करने से वित्तीय सुरक्षा का निर्माण होता है।";
    }
    if (trimmed.includes("recognition improves after workload stabilization") || trimmed.includes("workload stabilization")) {
      return "कार्यभार स्थिर होने के बाद कार्यक्षेत्र में सम्मान और मान्यता में वृद्धि होती है।";
    }
    if (trimmed.includes("A phase of structural consolidation where caution is required")) {
      return "संरचनात्मक समेकन का एक चरण जहाँ सावधानी और संयम की आवश्यकता है।";
    }
    if (trimmed.includes("A harmonious phase favoring steady progress")) {
      return "एक सामंजस्यपूर्ण चरण जो निरंतर और स्थिर प्रगति के अनुकूल है।";
    }
    if (trimmed.includes("Cosmic alignment requires observation")) {
      return "आकाशीय संरेखण के लिए शांत अवलोकन की आवश्यकता है।";
    }
    if (trimmed.includes("Recalibrating cosmic alignment")) {
      return "आकाशीय संरेखण का पुनर्मूल्यांकन किया जा रहा है।";
    }
    if (trimmed.includes("Waiting for accurate birth data")) {
      return "सटीक जन्म विवरण की प्रतीक्षा की जा रही है।";
    }
    return text;
  };

  const getLocalizedNarrative = (text: string) => {
    if (!isHindi || !text) return text;
    const trimmed = text.trim();
    if (trimmed.includes("More responsibility before recognition")) {
      return "सम्मान और मान्यता प्राप्त होने से पहले उत्तरदायित्व में वृद्धि होगी। पदोन्नति में गति धीमी हो सकती है, परंतु आपकी संरचनात्मक महत्ता बढ़ रही है।";
    }
    if (trimmed.includes("Visibility is expanding")) {
      return "आपकी दृश्यता का विस्तार हो रहा है और संरचनात्मक गति प्रगति का समर्थन कर रही है।";
    }
    if (trimmed.includes("Liquidity pressure necessitates")) {
      return "तरलता का दबाव संचय चक्र की आवश्यकता को दर्शाता है। सट्टा और त्वरित लाभ के प्रलोभन से बचें।";
    }
    if (trimmed.includes("Stable inflow phase")) {
      return "स्थिर आय का चरण है, जो संरचित और सुरक्षित विकास के अनुकूल है।";
    }
    if (trimmed.includes("Emotional distance requires")) {
      return "भावनात्मक दूरी के कारण कार्मिक पुनर्मूल्यांकन की आवश्यकता है। आपसी संवाद में कुछ तनाव संभव है।";
    }
    if (trimmed.includes("Favorable phase for connection")) {
      return "आपसी संबंधों और सामंजस्यपूर्ण संरेखण के लिए अत्यंत अनुकूल चरण है।";
    }
    if (trimmed.includes("Physical stamina requires")) {
      return "शारीरिक सहनशक्ति और ऊर्जा के सतर्क प्रबंधन की आवश्यकता है। स्वास्थ्य सुधार और विश्राम पर ध्यान दें।";
    }
    if (trimmed.includes("Vitality is stable")) {
      return "प्राण ऊर्जा और जीवन शक्ति स्थिर है, जो शारीरिक सुदृढ़ता के निर्माण के लिए अनुकूल है।";
    }
    if (trimmed.includes("Stability and structural focus")) {
      return "स्थिरता और संरचनात्मक फोकस ही आज की मुख्य कुंजी है।";
    }
    if (trimmed.includes("Waiting for accurate birth data")) {
      return "सटीक जन्म विवरण की प्रतीक्षा की जा रही है।";
    }
    if (trimmed.includes("Proceed with awareness")) {
      return "पूर्ण सचेतता और जागरूकता के साथ आगे बढ़ें।";
    }
    if (trimmed.includes("Please update your profile details")) {
      return "कृपया अपने प्रोफ़ाइल विवरण को अपडेट करें।";
    }
    if (trimmed.includes("Recalibrating cosmic alignment")) {
      return "आकाशीय संरेखण का पुनर्मूल्यांकन किया जा रहा है।";
    }
    return text;
  };

  const getLocalizedSupporting = (text: string) => {
    if (!isHindi || !text) return text;
    const trimmed = text.trim();
    if (trimmed.includes("Trust the current phase")) return "वर्तमान चरण पर विश्वास रखें।";
    if (trimmed.includes("Patience yields results")) return "धैर्य से सकारात्मक परिणाम मिलते हैं।";
    if (trimmed.includes("Focus on what is in your control")) return "उन चीज़ों पर ध्यान केंद्रित करें जो आपके नियंत्रण में हैं।";
    if (trimmed.includes("Stay consistent")) return "निरंतरता बनाए रखें।";
    if (trimmed.includes("Review your plans")) return "अपनी योजनाओं की समीक्षा करें।";
    if (trimmed.includes("Build structure")) return "संरचना का निर्माण करें।";
    if (trimmed.includes("Taking new initiatives")) return "नई पहलें करना";
    if (trimmed.includes("Expanding network")) return "सामूहिक संपर्क बढ़ाना";
    if (trimmed.includes("Capitalizing on momentum")) return "गतिशीलता का लाभ उठाना";
    if (trimmed.includes("Avoid over-committing")) return "अति-प्रतिबद्धता से बचें";
    if (trimmed.includes("Stay grounded in reality")) return "यथार्थ में स्थिर रहें";
    return text;
  };

  const getLocalizedCaution = (text: string) => {
    if (!isHindi || !text) return text;
    const trimmed = text.trim();
    if (trimmed.includes("Avoid impulsive decisions")) return "इस चरण के दौरान जल्दबाज़ी में निर्णय लेने से बचें।";
    if (trimmed.includes("Avoid over-committing")) return "अति-प्रतिबद्धता से बचें";
    return text;
  };

  const getLocalizedDoAvoid = (text: string) => {
    if (!isHindi || !text) return text;
    const lower = text.toLowerCase();
    if (lower.includes("stay consistent")) return "निरंतरता बनाए रखें";
    if (lower.includes("review your plans")) return "अपनी योजनाओं की समीक्षा करें";
    if (lower.includes("build structure")) return "संरचना का निर्माण करें";
    if (lower.includes("structured planning")) return "संरचित योजना";
    if (lower.includes("active listening")) return "सक्रिय श्रवण";
    if (lower.includes("practice deliberate pauses")) return "विचारपूर्ण विराम लें";
    if (lower.includes("begin consolidating momentum")) return "अपनी गति को सुदृढ़ करना शुरू करें";
    if (lower.includes("collaborating on shared goals")) return "साझे लक्ष्यों पर सहयोग";
    if (lower.includes("initiating important projects")) return "महत्वपूर्ण परियोजनाएं आरंभ करना";
    if (lower.includes("restructuring routines")) return "दिनचर्या का पुनर्गठन";
    if (lower.includes("mindful restraint")) return "सचेत संयम";
    if (lower.includes("refining active workflows")) return "सक्रिय कार्यप्रवाह को परिष्कृत करना";
    if (lower.includes("nurturing key relationships")) return "प्रमुख संबंधों का पोषण";
    if (lower.includes("reactionary emails")) return "प्रतिक्रियाशील ई-मेल";
    if (lower.includes("unplanned spending")) return "अनायोजित व्यय";
    if (lower.includes("shortcuts")) return "शॉर्टकट (जल्दबाज़ी)";
    if (lower.includes("impulsive spending")) return "जल्दबाज़ी में खर्च";
    if (lower.includes("speculative risks")) return "सट्टा जोखिम";
    if (lower.includes("impulsive commitments")) return "जल्दबाज़ी में वादे";
    if (lower.includes("taking new initiatives")) return "नई पहलें करना";
    if (lower.includes("expanding network")) return "सामूहिक संपर्क बढ़ाना";
    if (lower.includes("capitalizing on momentum")) return "गतिशीलता का लाभ उठाना";
    if (lower.includes("avoid over-committing")) return "अति-प्रतिबद्धता से बचें";
    if (lower.includes("stay grounded in reality")) return "यथार्थ में स्थिर रहें";
    return text;
  };

  return (
    <main className={`min-h-screen text-[#3F2D1D] p-6 font-sans relative overflow-hidden ${isHindi ? "leading-loose" : ""}`}>
      {/* Mystical Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-12 relative z-10 animate-in fade-in duration-1000">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className={`font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent font-serif ${isHindi ? "text-3xl tracking-wide font-normal" : "text-2xl tracking-widest"}`}>
              {isHindi ? "दिव्यदृष्टि" : "DIVYADRISHTI"}
            </h1>
            <p className={`text-amber-800/60 font-medium uppercase ${isHindi ? "text-xs tracking-wide leading-relaxed" : "text-[10px] tracking-[0.4em]"}`}>
              {isHindi ? "आकाशीय मार्गदर्शन प्रणाली" : "Celestial Guidance System"}
            </p>
          </div>
          <div className="px-5 py-2 bg-white border border-[#F1E7D0] rounded-full flex items-center gap-3 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500" />
             <p className={`font-bold text-[#3F2D1D]/80 uppercase leading-none ${isHindi ? "text-xs tracking-wide leading-relaxed" : "text-[10px] tracking-widest"}`}>
                {isHindi ? `संरेखण सक्रिय: ${user.name}` : `Alignment Confirmed: ${user.name}`}
             </p>
          </div>
        </div>

        {/* Hero Insight - The Pundit's Opening Statement */}
        <div className="relative group overflow-hidden p-12 rounded-[3.5rem] bg-white border border-[#F1E7D0] shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-12">
             <Quote className="w-12 h-12 text-amber-700/10" />
          </div>
          <div className="max-w-3xl space-y-6">
             <span className={`font-bold uppercase text-amber-700/80 block ${isHindi ? "text-xs tracking-wide" : "text-[10px] tracking-[0.6em]"}`}>
                {isHindi ? "प्रारंभिक वक्तव्य" : "Opening Statement"}
             </span>
             <h2 className={`font-serif leading-tight text-[#3F2D1D] ${isHindi ? "text-3xl leading-relaxed font-normal" : "text-4xl"}`}>
                {getLocalizedPrimaryInsight(insights.primary)}
             </h2>
             <p className={`text-[#3F2D1D]/70 font-light max-w-2xl ${isHindi ? "text-xl leading-loose font-normal not-italic" : "text-xl leading-relaxed italic"}`}>
                "{isHindi ? getLocalizedNarrative(narrative.split("\n")[0]) : narrative.split("\n")[0]}"
             </p>
          </div>
        </div>

        {/* Core Domains Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Life Season & Guidance */}
          <div className="lg:col-span-8 space-y-10">
             
             {/* Dasha Phase Strip */}
             <div className="p-8 rounded-[2.5rem] bg-white border border-[#F1E7D0] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <div className="space-y-1">
                      <p className={`font-bold uppercase text-amber-700 ${isHindi ? "text-xs tracking-wide mb-1" : "text-[10px] tracking-widest"}`}>
                         {isHindi ? "वर्तमान जीवन दशा" : "Current Life Season"}
                      </p>
                      <div className="flex items-end gap-3 font-serif">
                        <h3 className={`text-[#3F2D1D] ${isHindi ? "text-3xl leading-relaxed font-normal" : "text-4xl"}`}>{getLocalizedDasha(temporal?.stack?.mahadasha) || "..."}</h3>
                        <span className="text-2xl text-[#3F2D1D]/30">/</span>
                        <h3 className={`text-amber-800 ${isHindi ? "text-3xl leading-relaxed font-normal" : "text-4xl"}`}>{getLocalizedDasha(temporal?.stack?.antardasha) || "..."}</h3>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`uppercase ${isHindi ? "text-xs tracking-wide text-[#3F2D1D]/60" : "text-[10px] tracking-widest text-[#3F2D1D]/40"}`}>
                         {isHindi ? "अगला चक्र परिवर्तन" : "Next Shift"}
                      </p>
                      <p className={`font-medium text-[#3F2D1D]/70 ${isHindi ? "text-sm leading-relaxed" : "text-sm"}`}>
                         {getLocalizedDasha(temporal?.stack?.nextAntardasha) || (isHindi ? "स्थिर" : "Stable")}
                      </p>
                   </div>
                </div>
                <p className={`text-[#3F2D1D]/70 font-light border-t border-[#F1E7D0]/60 pt-6 ${isHindi ? "text-lg leading-loose font-normal" : "text-lg leading-relaxed"}`}>
                   {isHindi ? (
                     <>
                       यह अवधि मुख्य रूप से <span className="text-amber-800 font-medium">स्थिरता और अनुशासित प्रगति</span> पर केंद्रित है। आकाशीय प्रवाह तीव्र बाहरी गतिशीलता के बजाय संरचनात्मक समीक्षा के अनुकूल हैं।
                     </>
                   ) : (
                     <>
                       This period is primarily focused on <span className="text-amber-800 font-medium">stabilization and disciplined growth</span>. 
                       The planetary currents favor structural review over rapid external movement.
                     </>
                   )}
                </p>
             </div>

             {/* Top Guidance Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white border border-[#F1E7D0] shadow-sm">
                   <p className={`font-bold uppercase text-[#3F2D1D]/60 mb-4 ${isHindi ? "text-xs tracking-wide" : "text-[10px] tracking-widest"}`}>
                      {isHindi ? "सहायक तर्क" : "Supporting Logic"}
                   </p>
                   <ul className="space-y-3">
                      {insights.supporting.slice(0, 3).map((point: string, i: number) => (
                        <li key={i} className={`text-[#3F2D1D]/70 flex items-start gap-2 ${isHindi ? "text-sm leading-relaxed font-normal" : "text-sm"}`}>
                           <span className="text-amber-700/60">•</span> {getLocalizedSupporting(point)}
                        </li>
                      ))}
                   </ul>
                </div>
                <div className="p-8 rounded-3xl bg-amber-500/[0.02] border border-amber-200 text-amber-900 shadow-sm">
                   <p className={`font-bold uppercase text-amber-800 mb-4 ${isHindi ? "text-xs tracking-wide" : "text-[10px] tracking-widest"}`}>
                      {isHindi ? "विशेष सावधानी" : "Critical Caution"}
                   </p>
                   <p className={`text-amber-900/80 leading-relaxed font-light ${isHindi ? "text-sm leading-relaxed font-normal not-italic" : "text-sm italic"}`}>
                      "{getLocalizedCaution(insights.caution)}"
                   </p>
                </div>
             </div>
          </div>

          {/* Right: Behavioral Directives */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white border border-[#F1E7D0] rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                <h4 className={`font-bold uppercase text-[#3F2D1D]/60 text-center block ${isHindi ? "text-xs tracking-wide" : "text-[11px] tracking-[0.4em]"}`}>
                   {isHindi ? "दैनिक व्यावहारिक दिशा-निर्देश" : "Behavioral Directives"}
                </h4>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <p className={`font-bold uppercase text-emerald-700 pl-1 ${isHindi ? "text-[10px] tracking-wide" : "text-[9px] tracking-widest"}`}>
                         {isHindi ? "आज अवश्य करें" : "Primary Actions (Do)"}
                      </p>
                      <div className="space-y-2">
                        {guidance.do.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className={`p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950/80 ${isHindi ? "text-xs leading-relaxed" : "text-xs"}`}>
                             {getLocalizedDoAvoid(item)}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className={`font-bold uppercase text-rose-700 pl-1 ${isHindi ? "text-[10px] tracking-wide" : "text-[9px] tracking-widest"}`}>
                         {isHindi ? "आज संयम रखें" : "Mindful Restraints (Avoid)"}
                      </p>
                      <div className="space-y-2">
                        {guidance.avoid.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className={`p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-950/80 ${isHindi ? "text-xs leading-relaxed" : "text-xs"}`}>
                             {getLocalizedDoAvoid(item)}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* System Footer */}
        <div className="pt-10 flex items-center justify-between border-t border-[#F1E7D0]">
          <p className={`font-serif text-[#3F2D1D]/40 uppercase ${isHindi ? "text-[10px] tracking-wide" : "text-[9px] tracking-widest"}`}>
             {isHindi ? `${user.name} • जन्म विवरण सत्यापित` : `${user.name} • Birth Integrity Confirmed`}
          </p>
          <p className={`font-serif text-[#3F2D1D]/40 uppercase italic ${isHindi ? "text-[10px] tracking-wide not-italic" : "text-[9px] tracking-widest"}`}>
            {isHindi ? "दिव्यदृष्टि एस्ट्रो v2.0" : "DIVYADRISHTI ASTRO v2.0"}
          </p>
        </div>

      </div>
    </main>
  );
}

function LoadingScreen() {
  const { isHindi } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8F5EF] text-[#3F2D1D]">
      <Loader className="w-8 h-8 text-amber-700 animate-spin" />
      <p className={`text-[#3F2D1D]/60 font-serif ${isHindi ? "text-base leading-relaxed" : ""}`}>
        {isHindi ? "आपका आकाशीय डेटा लोड हो रहा है..." : "Loading your cosmic data..."}
      </p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string | null }) {
  const { isHindi } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8F5EF] text-[#3F2D1D]">
      <p className={`text-rose-700 font-semibold ${isHindi ? "text-base leading-relaxed" : ""}`}>
        {error ? (isHindi && error === "Failed to load cosmic data" ? "आकाशीय डेटा लोड करने में विफल" : error) : (isHindi ? "कुछ त्रुटि हुई" : "Something went wrong")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className={`px-6 py-2 bg-[#3F2D1D] text-[#F8F5EF] rounded-lg hover:bg-[#3F2D1D]/90 transition-all font-semibold ${isHindi ? "text-sm leading-relaxed" : ""}`}
      >
        {isHindi ? "पुनः प्रयास करें" : "Retry"}
      </button>
    </div>
  );
}

function ComingSoonTab({ title }: { title: string }) {
  const { isHindi } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F8F5EF] text-[#3F2D1D]">
      <Sparkles className="w-12 h-12 text-amber-700" />
      <h2 className="text-2xl font-bold text-[#3F2D1D] font-serif">{title}</h2>
      <p className="text-[#3F2D1D]/60">{isHindi ? "शीघ्र ही आ रहा है..." : "Coming soon..."}</p>
    </div>
  );
}
