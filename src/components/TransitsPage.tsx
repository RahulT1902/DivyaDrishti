"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, ChevronDown, ChevronUp, Loader2, Sparkles, Star, Navigation } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TransitEffect {
  planet: string; symbol: string; sign: string; house: number;
  motion: "Direct" | "Retrograde"; status: string; influence: string;
  color: "amber" | "indigo" | "emerald" | "rose"; nature: "supportive" | "sensitive";
}

interface LifeDomainCard {
  id: string; icon: string; title: string; titleHindi: string;
  narrative: string;
  planetSignals: string[]; activatedPatterns: string[];
  caution: string | null; primaryPlanet: string;
  strength: "supportive" | "sensitive" | "neutral";
  statusLabel?: string;
  statusLabelHindi?: string;
  emphasisTag?: "Most Active" | "Currently Influenced" | null;
  emphasisTagHindi?: "सर्वाधिक सक्रिय" | "वर्तमान में प्रभावित" | null;
  confidenceTone?: string;
  confidenceToneHindi?: string;
  timingWindow?: string;
  timingWindowHindi?: string;
  whyThisMatters?: {
    transitReasoning: string;
    transitReasoningHindi: string;
    dashaInfluence: string;
    dashaInfluenceHindi: string;
    practicalInterpretation: string;
    practicalInterpretationHindi: string;
    emotionalGuidance: string;
    emotionalGuidanceHindi: string;
  };
}

const DEFAULT_TRANSITS: TransitEffect[] = [
  { planet: "Saturn", symbol: "♄", sign: "Aquarius", house: 2, motion: "Direct", status: "Sensitive Cycle", influence: "Saturn demands deep financial consolidation and structured, truthful communication. Focus on building long-term assets rather than speculative moves.", color: "indigo", nature: "sensitive" },
  { planet: "Jupiter", symbol: "♃", sign: "Aries", house: 4, motion: "Direct", status: "Supportive Cycle", influence: "Jupiter expands your internal stability, family happiness, and desire for deep wisdom. An excellent phase for learning, meditation, and acquiring core stability.", color: "amber", nature: "supportive" },
  { planet: "Rahu", symbol: "☊", sign: "Pisces", house: 10, motion: "Retrograde", status: "Sensitive Cycle", influence: "Rahu transiting the house of karma triggers a powerful ambition to reinvent your professional path, but requires caution against impulsiveness and illusion.", color: "rose", nature: "sensitive" },
  { planet: "Moon", symbol: "☾", sign: "Sagittarius", house: 7, motion: "Direct", status: "Supportive Cycle", influence: "The Moon's transits bring focus onto partnerships, emotional sensitivity, and collaborative harmony. Be soft in primary relationships.", color: "emerald", nature: "supportive" },
  { planet: "Sun", symbol: "☉", sign: "Leo", house: 3, motion: "Direct", status: "Supportive Cycle", influence: "The Sun in the 3rd house ignites courageous action, enhanced willpower, and positive relations with peers. Express your ideas clearly.", color: "amber", nature: "supportive" },
];

const DEFAULT_TRANSITS_HI: TransitEffect[] = [
  { planet: "शनि", symbol: "♄", sign: "कुंभ", house: 2, motion: "Direct", status: "संवेदनशील चक्र", influence: "शनि देव आपके द्वितीय भाव में वित्तीय सुदृढ़ता और सत्य निष्ठा की वाणी की मांग कर रहे हैं। सट्टा या जल्दबाजी के निर्णयों से बचें और दीर्घकालिक संपत्ति के निर्माण पर ध्यान केंद्रित करें।", color: "indigo", nature: "sensitive" },
  { planet: "गुरु", symbol: "♃", sign: "मेष", house: 4, motion: "Direct", status: "अनुकूल प्रवाह", influence: "चतुर्थ भाव में गुरु देव की उपस्थिति आंतरिक शांति, पारिवारिक सौहार्द और आत्म-ज्ञान में विस्तार दे रही है। अध्ययन, ध्यान और जीवन में स्थिरता स्थापित करने के लिए श्रेष्ठ काल है।", color: "amber", nature: "supportive" },
  { planet: "राहु", symbol: "☊", sign: "मीन", house: 10, motion: "Retrograde", status: "संवेदनशील चक्र", influence: "कर्म भाव में राहु का यह गोचर व्यावसायिक रूपरेखा में नवीनता और तीव्र महत्वाकांक्षा देता है, परंतु आवेशपूर्ण और अचानक निर्णयों से सावधान रहना अपेक्षित है।", color: "rose", nature: "sensitive" },
  { planet: "चंद्र", symbol: "☾", sign: "धनु", house: 7, motion: "Direct", status: "अनुकूल प्रवाह", influence: "सप्तम भाव में चंद्र देव का गोचर साझेदारी, वैवाहिक संबंधों और साझा कार्यों में संवेदनशीलता और आपसी तालमेल बढ़ाता है। प्रियजनों के साथ कोमलता बरतें।", color: "emerald", nature: "supportive" },
  { planet: "सूर्य", symbol: "☉", sign: "सिंह", house: 3, motion: "Direct", status: "अनुकूल प्रवाह", influence: "तृतीय भाव में सूर्य देव का गोचर साहस, पराक्रम और मित्रों के साथ संबंधों में सकारात्मक ऊर्जा का संचार करता है। अपने विचारों को स्पष्टता से व्यक्त करें।", color: "amber", nature: "supportive" },
];

const CARD_STYLES = { indigo: "bg-[#F3F6FC] border-[#DCE4F5]", amber: "bg-[#FCF9F3] border-[#F2E7D0]", emerald: "bg-[#F4FAF6] border-[#D4EFE0]", rose: "bg-[#FCF3F4] border-[#F5DCDE]" };
const BADGE_STYLES = { indigo: "bg-indigo-100/70 border-indigo-200 text-indigo-800", amber: "bg-amber-100/70 border-amber-200 text-amber-800", emerald: "bg-emerald-100/70 border-emerald-200 text-emerald-800", rose: "bg-rose-100/70 border-rose-200 text-rose-800" };
const PLANET_SYMBOLS: Record<string, string> = { Sun: "☉", Moon: "☾", Mars: "♂", Mercury: "☿", Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋" };

const PLANET_NAMES_HI: Record<string, string> = {
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु"
};

const ZODIAC_SIGNS_HI: Record<string, string> = {
  Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क", Leo: "सिंह", Virgo: "कन्या", Libra: "तुला", Scorpio: "वृश्चिक", Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुंभ", Pisces: "मीन"
};

const translatePlanetHi = (name: string) => {
  return PLANET_NAMES_HI[name] || name;
};

const translateSignHi = (name: string) => {
  return ZODIAC_SIGNS_HI[name] || name;
};

const STRENGTH_STYLES = {
  supportive: { card: "bg-emerald-50/60 border-emerald-200", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Supportive", labelHindi: "अनुकूल" },
  sensitive:  { card: "bg-rose-50/60 border-rose-200",     badge: "bg-rose-100 text-rose-800 border-rose-200",       dot: "bg-rose-500",   label: "Sensitive",   labelHindi: "संवेदनशील" },
  neutral:    { card: "bg-white border-[#F1E7D0]",         badge: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-400",  label: "Stable",      labelHindi: "स्थिर" },
};

interface HouseLayoutConfig {
  houseNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signClass: string;
}

const HOUSE_LAYOUTS: HouseLayoutConfig[] = [
  { houseNum: 1,  x: 120, y: 50,    width: 160, height: 85,  signClass: "left-1/2 top-1 -translate-x-1/2" }, // Top Center Diamond
  { houseNum: 2,  x: 55,  y: 10,    width: 90,  height: 50,  signClass: "left-1 top-1" },                      // Top Left Triangle
  { houseNum: 3,  x: 10,  y: 55,    width: 50,  height: 90,  signClass: "left-1 top-1" },                      // Left Top Triangle
  { houseNum: 4,  x: 50,  y: 120,   width: 85,  height: 160, signClass: "left-1 top-1/2 -translate-y-1/2" },   // Left Center Diamond
  { houseNum: 5,  x: 10,  y: 255,   width: 50,  height: 90,  signClass: "left-1 bottom-1" },                   // Left Bottom Triangle
  { houseNum: 6,  x: 55,  y: 340,   width: 90,  height: 50,  signClass: "left-1 bottom-1" },                   // Bottom Left Triangle
  { houseNum: 7,  x: 120, y: 265,   width: 160, height: 85,  signClass: "left-1/2 bottom-1 -translate-x-1/2" },// Bottom Center Diamond
  { houseNum: 8,  x: 255, y: 340,   width: 90,  height: 50,  signClass: "right-1 bottom-1" },                  // Bottom Right Triangle
  { houseNum: 9,  x: 340, y: 255,   width: 50,  height: 90,  signClass: "right-1 bottom-1" },                  // Right Bottom Triangle
  { houseNum: 10, x: 265, y: 120,   width: 85,  height: 160, signClass: "right-1 top-1/2 -translate-y-1/2" },  // Right Center Diamond
  { houseNum: 11, x: 340, y: 55,    width: 50,  height: 90,  signClass: "right-1 top-1" },                     // Right Top Triangle
  { houseNum: 12, x: 255, y: 10,    width: 90,  height: 50,  signClass: "right-1 top-1" }                      // Top Right Triangle
];

const getPlanetSymbol = (abbr: string) => {
  switch (abbr) {
    case "Su": return "☉";
    case "Mo": return "☾";
    case "Ma": return "♂";
    case "Me": return "☿";
    case "Ju": return "♃";
    case "Ve": return "♀";
    case "Sa": return "♄";
    case "Ra": return "☊";
    case "Ke": return "☋";
    case "La": return "✦";
    default: return "";
  }
};

const getPlanetAbbreviation = (abbr: string, isHindi: boolean) => {
  if (!isHindi) return abbr;
  switch (abbr) {
    case "La": return "ल";
    case "Su": return "सू";
    case "Mo": return "चं";
    case "Ma": return "मं";
    case "Me": return "बु";
    case "Ju": return "गु";
    case "Ve": return "शु";
    case "Sa": return "श";
    case "Ra": return "रा";
    case "Ke": return "के";
    default: return abbr;
  }
};

const getPlanetChartStyle = (abbr: string) => {
  switch (abbr) {
    case "La":
      return "bg-[#D97706] border border-[#B45309] text-white font-bold shadow-sm";
    case "Su":
      return "bg-[#FEF3C7] border border-[#F59E0B] text-[#78350F] font-bold shadow-sm";
    case "Mo":
      return "bg-[#EFF6FF] border border-[#3B82F6] text-[#1E3A8A] font-bold shadow-sm";
    case "Ma":
      return "bg-[#FEE2E2] border border-[#EF4444] text-[#7F1D1D] font-bold shadow-sm";
    case "Me":
      return "bg-[#ECFDF5] border border-[#10B981] text-[#064E3B] font-bold shadow-sm";
    case "Ju":
      return "bg-[#FFFBEB] border-2 border-[#D97706] text-[#78350F] font-bold shadow-sm ring-1 ring-amber-500/10";
    case "Ve":
      return "bg-[#FFF5F7] border border-[#EC4899] text-[#831843] font-bold shadow-sm";
    case "Sa":
      return "bg-[#1E293B] border-2 border-[#0F172A] text-[#F8FAFC] font-bold shadow-sm ring-1 ring-slate-800/10 scale-105 shadow-[0_2px_6px_rgba(15,23,42,0.2)]";
    case "Ra":
    case "Ke":
      return "bg-[#27272A] border-2 border-[#09090B] text-[#F4F4F5] font-bold shadow-sm ring-1 ring-zinc-800/10 scale-105 shadow-[0_2px_6px_rgba(9,9,11,0.2)]";
    default:
      return "bg-[#FFFDFB] border border-[#F1E7D0] text-[#3F2D1D] font-medium shadow-sm";
  }
};

const getPlanetContainerClass = (houseNum: number) => {
  switch (houseNum) {
    case 1:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[98%] mt-5 mb-1 z-10";
    case 2:
    case 12:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[98%] mt-3 mb-0.5 z-10";
    case 3:
    case 11:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[98%] mt-3 mb-0.5 z-10";
    case 4:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[95%] mt-0 ml-4 z-10";
    case 10:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[95%] mt-0 mr-4 z-10";
    case 5:
    case 9:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[98%] mb-3 mt-0.5 z-10";
    case 6:
    case 8:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[98%] mb-3 mt-0.5 z-10";
    case 7:
      return "flex flex-wrap gap-1.5 justify-center items-center max-w-[98%] mb-5 mt-1 z-10";
    default:
      return "flex flex-wrap gap-1.5 justify-center items-center z-10";
  }
};

const getVisualWeight = (planetName: string, isHindi: boolean) => {
  switch (planetName) {
    case "Saturn":
    case "Rahu":
    case "Ketu":
      return {
        label: isHindi ? "दीर्घकालिक चक्र" : "Major Cycle",
        badgeClass: "bg-amber-900/10 border-amber-900/60 text-amber-950 font-bold border-2 ring-1 ring-amber-900/10 shadow-sm",
        chartBadgeClass: "bg-amber-900 border-2 border-amber-800 text-white scale-105 font-bold shadow-[0_2px_8px_rgba(140,110,64,0.3)]",
        weight: isHindi ? "अति उच्च" : "Very High",
        timeSensitivity: isHindi ? "वर्ष पर्यंत सक्रिय" : "Active through year"
      };
    case "Jupiter":
      return {
        label: isHindi ? "विस्तार प्रवाह" : "Expansion Phase",
        badgeClass: "bg-[#FFF9EE] border-[#F5DCA8] text-[#8C6E40] font-semibold border-2 shadow-sm",
        chartBadgeClass: "bg-[#FFFEEB] border-2 border-[#E6D0A0] text-amber-900 scale-100 font-semibold shadow-sm",
        weight: isHindi ? "उच्च" : "High",
        timeSensitivity: isHindi ? "ऋतु चक्र पर्यंत" : "Active through season"
      };
    case "Mars":
    case "Sun":
      return {
        label: isHindi ? "मध्यम ऊर्जा" : "Medium Energy",
        badgeClass: "bg-white border-[#F1E7D0] text-[#3F2D1D] border shadow-sm",
        chartBadgeClass: "bg-white border border-[#EAD0A0] text-[#3F2D1D] font-medium shadow-sm",
        weight: isHindi ? "सामान्य" : "Medium",
        timeSensitivity: isHindi ? "मास पर्यंत सक्रिय" : "Active through month"
      };
    case "Mercury":
      return {
        label: isHindi ? "सौम्य गति" : "Light Current",
        badgeClass: "bg-[#FCFAF7]/80 border-[#F2ECE0] text-[#5C4D3C]/80 border shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]",
        chartBadgeClass: "bg-[#FAF7F0] border border-[#E6DCC3]/80 text-[#3F2D1D]/90 text-[9.5px] shadow-sm",
        weight: isHindi ? "सौम्य" : "Light",
        timeSensitivity: isHindi ? "कुछ सप्ताह में शिथिल" : "Fades in few weeks"
      };
    case "Moon":
    default:
      return {
        label: isHindi ? "क्षणिक तरंग" : "Passing Rhythm",
        badgeClass: "bg-white/40 border-[#F5EFE0]/40 text-[#5C4D3C]/60 border",
        chartBadgeClass: "bg-[#FFFDFB]/60 border border-[#F1E7D0]/40 text-[#3F2D1D]/60 text-[9px] shadow-sm",
        weight: isHindi ? "अति सौम्य" : "Very Light",
        timeSensitivity: isHindi ? "दो दिनों में संक्रमण" : "Fades in 2 days"
      };
  }
};

type FilterType = "all" | "supportive" | "sensitive";

export default function TransitsPage({ chartData }: { chartData?: any }) {
  // ── Global language context — single source of truth ──
  const { isHindi, mode } = useLanguage();

  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<"cycles" | "chart">("cycles");
  const [domains, setDomains] = useState<LifeDomainCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const realLagnaSignNum = chartData?.chart?.lagna?.sign || 10; // Default Capricorn baseline
  const liveTransits = chartData?.transitIntelligence?.transits || [];
  const climate = chartData?.transitIntelligence?.climate;
  
  const displayTransits: TransitEffect[] = liveTransits.length > 0
    ? liveTransits.map((t: any) => {
        const isSupportive = t.nature?.toLowerCase().includes("supportive") || t.nature?.toLowerCase().includes("benefic") || t.nature?.toLowerCase().includes("expansion");
        const isChallenging = t.nature?.toLowerCase().includes("sensitive") || t.nature?.toLowerCase().includes("friction") || t.nature?.toLowerCase().includes("pressure") || t.nature?.toLowerCase().includes("volatile") || t.nature?.toLowerCase().includes("challenging");
        const color = isSupportive ? "amber" : isChallenging ? "rose" : "indigo";
        const nature = isSupportive ? "supportive" : isChallenging ? "sensitive" : "neutral";
        
        let influence = t.whyItMatters?.[0] || `${t.planet} transiting house ${t.houseFromLagna}.`;
        if (isHindi && t.whyItMattersHindi?.[0]) {
          influence = t.whyItMattersHindi[0];
        } else if (isHindi) {
          influence = `${translatePlanetHi(t.planet)} देव का ${t.houseFromLagna ? `चक्र के ${t.houseFromLagna} भाव` : 'चार्ट'} में संचरण हो रहा है, जो जीवन के महत्वपूर्ण आयामों को प्रभावित कर रहा है।`;
        }

        return {
          planet: isHindi ? translatePlanetHi(t.planet) : t.planet,
          symbol: PLANET_SYMBOLS[t.planet] || "✦",
          sign: isHindi ? translateSignHi(t.sign) : (t.sign || "Active Sign"),
          house: t.houseFromLagna || 1,
          motion: t.retrograde ? (isHindi ? "वक्री" : "Retrograde") : (isHindi ? "मार्गी" : "Direct"),
          status: isHindi 
            ? (isSupportive ? "अनुकूल प्रवाह" : isChallenging ? "संवेदनशील चक्र" : "सक्रिय चक्र")
            : (isSupportive ? "Supportive Cycle" : isChallenging ? "Sensitive Cycle" : "Active Cycle"),
          influence,
          color,
          nature: nature === "neutral" ? "supportive" : nature
        };
      })
    : (isHindi ? DEFAULT_TRANSITS_HI : DEFAULT_TRANSITS);

  const filteredTransits = displayTransits.filter(t => filter === "all" || t.nature === filter);

  const fetchDomains = async (apiMode: "SIMPLE_ENGLISH" | "PANDIT") => {
    setLoading(true);
    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
      const res = await fetch(`/api/predictions/analyze?timeframe=this-month&domain=growth&mode=${apiMode}&email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success && data.predictions?.lifeDomainPredictions) {
        setDomains(data.predictions.lifeDomainPredictions);
        setLoaded(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Re-fetch when global language changes (if already loaded)
  useEffect(() => {
    if (loaded) {
      setLoaded(false);
      fetchDomains(mode);
    }
  }, [mode]);

  const toggleCard = (id: string) => setExpandedCards(p => ({ ...p, [id]: !p[id] }));

  // Dynamic Transit Focus Callout sentence
  const getTransitFocus = () => {
    const saturn = liveTransits.find((t: any) => t.planet === "Saturn");
    const rahu = liveTransits.find((t: any) => t.planet === "Rahu");
    const jupiter = liveTransits.find((t: any) => t.planet === "Jupiter");

    if (saturn && (saturn.houseFromLagna === 1 || saturn.houseFromLagna === 10 || saturn.houseFromLagna === 2)) {
      return isHindi 
        ? "वर्तमान धीमी गति के गोचर आपके जीवन में दीर्घकालिक पुनर्गठन, स्थिर संपत्ति निर्माण और धैर्यपूर्ण संवाद पर विशेष बल दे रहे हैं।"
        : "Current slow-moving transits strongly emphasize long-term restructuring, building stable asset structures, and patient communication.";
    }
    if (rahu && (rahu.houseFromLagna === 10 || rahu.houseFromLagna === 1)) {
      return isHindi 
        ? "सक्रिय ग्रहीय प्रवाह आपके व्यावसायिक पथ में नवीनता और आत्म-मंथन की प्रेरणा दे रहे हैं, परंतु आवेश में आकर किए गए निर्णयों से बचने की सलाह दी जाती है।"
        : "Active planetary currents invite professional reinvention and deep vocational focus, but advise caution against impulsive reactive shifts.";
    }
    if (jupiter && (jupiter.houseFromLagna === 4 || jupiter.houseFromLagna === 9 || jupiter.houseFromLagna === 1)) {
      return isHindi 
        ? "आकाशीय संरेखण इस समय आपके मन की शांति, गहरी अंतर्दृष्टि और सुदृढ़ पारिवारिक नींव को संवारने में सहायक हैं।"
        : "The celestial alignment favors internal emotional stability, acquiring core wisdom, and nurturing warm home foundations.";
    }
    return isHindi 
      ? "आपके सक्रिय गोचर इस समय संतुलित आचरण, आवश्यक अनुशासन के विकास और धीमी गति से चलने वाले ग्रहीय चक्रों के साथ कदम मिलाने पर बल दे रहे हैं।"
      : "Your active transits emphasize calm alignment, building foundational discipline, and aligning steps with slow-moving planetary cycles.";
  };

  // Helper for Qualitative Climate Indicators
  const getClimateLabel = (type: "pressure" | "opportunity" | "volatility", value?: number) => {
    const score = value !== undefined ? value : 50;
    if (type === "pressure") {
      if (score > 70) return isHindi ? "गहन अनुशासन (Restraint)" : "Elevated Restraint";
      if (score > 40) return isHindi ? "मध्यम स्थिरता (Grounding)" : "Moderate Grounding";
      return isHindi ? "सौम्य सुगमता (Ease)" : "Gentle Ease";
    } else if (type === "opportunity") {
      if (score > 70) return isHindi ? "सघन संरेखण (Alignment)" : "Heightened Alignment";
      if (score > 40) return isHindi ? "क्रमशः विकास (Building)" : "Gradually Building";
      return isHindi ? "शांत प्रवाह (Flow)" : "Quiet Flow";
    } else { // volatility
      if (score > 70) return isHindi ? "सक्रिय ऊर्जा परिवर्तन (Volatility)" : "Active Volatility";
      if (score > 40) return isHindi ? "सौम्य परिवर्तन (Shifting)" : "Gentle Shifting";
      return isHindi ? "शांत संतुलन (Integration)" : "Calm Integration";
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-4 space-y-12 pb-20">

      {/* ── Header + View Toggle ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#F1E7D0] pb-6">
        <div className="space-y-1.5">
          <h2 className={`text-2xl font-serif font-semibold text-amber-900 ${isHindi ? 'tracking-normal' : ''}`}>
            {isHindi ? "वर्तमान गोचर विश्लेषण" : "Current Transit Analysis"}
          </h2>
          <p className="text-sm text-amber-700/60">
            {isHindi ? "आपके उदय लग्न पर ग्रहों की तात्कालिक स्थिति और उनके प्रभाव का सूक्ष्म विवेचन" : "Live planetary positions and their direct influence on your baseline chart"}
          </p>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Subtle typographical toggle */}
          <div className="flex gap-6 items-center">
            <button
              onClick={() => setViewMode("cycles")}
              className={`pb-1.5 text-xs font-serif font-bold uppercase transition-all relative ${
                isHindi ? 'tracking-normal' : 'tracking-wider'
              } ${
                viewMode === "cycles"
                  ? "text-amber-900 border-b-2 border-amber-600"
                  : "text-amber-850/50 hover:text-amber-850 border-b-2 border-transparent"
              }`}
            >
              {isHindi ? "सक्रिय गोचर चक्र" : "Active Cycles"}
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`pb-1.5 text-xs font-serif font-bold uppercase transition-all relative ${
                isHindi ? 'tracking-normal' : 'tracking-wider'
              } ${
                viewMode === "chart"
                  ? "text-amber-900 border-b-2 border-amber-600"
                  : "text-amber-850/50 hover:text-amber-850 border-b-2 border-transparent"
              }`}
            >
              {isHindi ? "गोचर (पारगमन) चार्ट" : "Gochar (Transit) Chart"}
            </button>
          </div>

          {/* Filter ONLY shown in Active Cycles view */}
          {viewMode === "cycles" && (
            <div className="bg-[#FFFDF8] border border-[#F1E7D0] p-1 rounded-xl flex items-center gap-1 shadow-sm">
              {(["all", "supportive", "sensitive"] as const).map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${isHindi ? 'tracking-normal' : 'tracking-wider'} ${filter === t ? "bg-amber-100 text-amber-900 border border-amber-200/50 shadow-inner" : "text-amber-800/50 hover:text-amber-800"}`}>
                  {t === "all" ? (isHindi ? "सभी गोचर" : "All Cycles") : t === "supportive" ? (isHindi ? "अनुकूल प्रवाह" : "Supportive") : (isHindi ? "संवेदनशील चक्र" : "Sensitive")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewMode === "cycles" ? (
        /* ── Main Split Grid (Cycles List View) ── */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-5">
            {filteredTransits.length > 0 ? filteredTransits.map((t, idx) => (
              <motion.div key={`${t.planet}-${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className={`p-6 rounded-2xl border relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ${CARD_STYLES[t.color] || CARD_STYLES.indigo}`}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#F1E7D0] flex items-center justify-center text-lg font-bold font-serif shadow-sm text-amber-900">{t.symbol}</div>
                    <div>
                      <h4 className={`text-base font-serif font-bold text-[#3F2D1D] ${isHindi ? 'tracking-normal' : ''}`}>{t.planet}</h4>
                      <p className="text-[10px] text-amber-700/50 uppercase tracking-widest font-mono">
                        {isHindi ? `${t.house} भाव ✦ ${t.sign} ✦ ${t.motion}` : `House ${t.house} ✦ ${t.sign} ✦ ${t.motion}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border shadow-sm ${isHindi ? 'tracking-normal' : 'tracking-widest'} ${BADGE_STYLES[t.color] || BADGE_STYLES.indigo}`}>{t.status}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-[#3F2D1D] font-serif pl-12 border-l-2 border-amber-600/20 italic">"{t.influence}"</p>
              </motion.div>
            )) : (
              <div className="bg-white border border-[#F1E7D0] rounded-2xl p-12 text-center text-amber-700/50 italic shadow-sm">
                {isHindi ? "इस श्रेणी में कोई सक्रिय गोचर उपलब्ध नहीं है।" : "No active transits match this filter."}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-80 h-80 text-amber-900">
                <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
                <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase mb-2.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "✦ पंडित जी का गोचर मार्गदर्शन" : "✦ Pundit Transit Guidance"}
              </h4>
              <p className="text-[13px] text-amber-950 font-serif leading-relaxed italic">
                {isHindi 
                  ? "वर्तमान में धीमी गति से चलने वाले ग्रह आपकी कुंडली के अत्यंत प्रभावशाली क्षेत्रों को सक्रिय कर रहे हैं। राहु आपके दशम भाव (कर्म क्षेत्र) में मीन राशि में वक्री गति से संचरण कर रहे हैं, जिससे व्यावसायिक जीवन में कुछ अस्थाई उतार-चढ़ाव आ सकते हैं परंतु इसके साथ ही कर्म के प्रति एक गहन महत्वाकांक्षा जागृत होगी। स्वयं को शांत रखें, अचानक या आवेश में आकर कोई निर्णय न लें और शनि देव के अनुशासन व धैर्यपूर्ण सिद्धांतों का आश्रय लें।"
                  : "The current transiting planets are activating highly focal sectors of your chart. With Rahu retrograding through Pisces in your 10th house, expect temporary career turbulence but high vocational drive. Remain anchored, avoid sudden reactive pivots, and rely on Saturn's disciplined structures."}
              </p>
            </div>
            <div className="h-px bg-[#F1E7D0]" />
            <div>
              <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase mb-3 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                {isHindi ? "✦ मंद गति ग्रहीय गोचर स्थिति" : "✦ Slow-Moving Transit Status"}
              </h4>
              {[{ sym: "♄", name: "Saturn", pos: "Aquarius (2nd House)", dir: "Direct", col: "text-indigo-700" }, { sym: "♃", name: "Jupiter", pos: "Aries (4th House)", dir: "Direct", col: "text-emerald-700" }, { sym: "☊", name: "Rahu", pos: "Pisces (10th House)", dir: "Retrograde", col: "text-rose-600" }].map(p => (
                <div key={p.name} className="flex justify-between items-center bg-[#FFFDF9] border border-[#F1E7D0] px-4 py-2.5 rounded-xl text-xs mb-2">
                  <span className="font-serif font-bold text-amber-950 flex items-center gap-1.5">
                    <span className="text-amber-600">{p.sym}</span> {isHindi ? translatePlanetHi(p.name) : p.name}
                  </span>
                  <span className="text-amber-700/60">
                    {isHindi 
                      ? (p.name === "Saturn" ? "कुंभ (द्वितीय भाव)" : p.name === "Jupiter" ? "मेष (चतुर्थ भाव)" : "मीन (दशम भाव)") 
                      : p.pos}
                  </span>
                  <span className={`font-semibold ${p.col}`}>
                    {isHindi ? (p.dir === "Direct" ? "मार्गी" : "वक्री") : p.dir}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px bg-[#F1E7D0]" />
            <div className="space-y-3">
              <div>
                <h4 className={`text-[10px] font-bold text-emerald-700/80 uppercase mb-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "✦ सहायक साधना एवं संरेखण" : "✦ Supportive Actions"}
                </h4>
                <ul className="text-xs text-emerald-800/80 space-y-1 list-disc pl-4 font-serif">
                  {isHindi ? (
                    <>
                      <li>चतुर्थ भाव में गुरु के विस्तार प्रवाह से जुड़ने हेतु प्रतिदिन ध्यान व मौन साधना करें।</li>
                      <li>द्वितीय भाव में शनि देव के अनुशासन का सम्मान करते हुए अपनी वाणी में गंभीरता व संरचना लाएं।</li>
                      <li>नवीन साझेदारियों या प्रतिबद्धताओं में प्रवेश करने से पूर्व गंभीर शोध व आत्म-मंथन करें।</li>
                    </>
                  ) : (
                    <>
                      <li>Meditate daily to align with Jupiter's 4th house expansion.</li>
                      <li>Express ideas with structure to channel Saturn's 2nd house rule.</li>
                      <li>Conduct deep research before committing to new partners.</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className={`text-[10px] font-bold text-rose-700/80 uppercase mb-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "✦ सौम्य जागरूकता एवं संयम" : "✦ Mindful Releases"}
                </h4>
                <ul className="text-xs text-rose-800/80 space-y-1 list-disc pl-4 font-serif">
                  {isHindi ? (
                    <>
                      <li>अचानक, अस्थिर वित्तीय या संपत्ति निवेश के निर्णयों से बचें।</li>
                      <li>वाणी में कटुता, व्यर्थ वाद-विवाद या रक्षात्मक रुख अपनाने से बचें।</li>
                      <li>राहु के भ्रम के प्रभाव में आकर आजीविका या कार्यक्षेत्र में तात्कालिक आवेशपूर्ण निर्णय न लें।</li>
                    </>
                  ) : (
                    <>
                      <li>Avoid sudden, volatile financial or asset investments.</li>
                      <li>Avoid unnecessary verbal arguments or defensive communication.</li>
                      <li>Refuse reactive vocational impulses driven by Rahu's illusions.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Gochar (Transit) Chart View ── */
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Transit Focus Callout Banner */}
          <div className="bg-[#FAF8F5] border border-[#F1E7D0] px-6 py-5 rounded-2xl shadow-sm text-center font-serif flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-10 text-4xl">🪐</div>
            <p className={`text-[9px] font-bold uppercase ${isHindi ? 'tracking-normal text-xs' : 'tracking-[0.3em]'} text-amber-800/50`}>
              {isHindi ? "✦ गोचर मुख्य संरेखण ✦" : "✦ Transit Focus ✦"}
            </p>
            <p className="text-[15px] text-[#3F2D1D] italic font-medium leading-relaxed max-w-3xl">
              "{getTransitFocus()}"
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Gochar Diamond Chart (3/5 wide) */}
            <div className="lg:col-span-3 bg-white border border-[#F1E7D0] rounded-2xl p-8 shadow-sm flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6">
                <p className={`text-[10px] font-bold text-amber-600/60 uppercase ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "गोचर कुंडली (पारंपरिक उत्तर भारतीय हीरा प्रारूप)" : "Gochar Chart (Traditional North Indian Diamond View)"}
                </p>
                <div className="text-right text-[10px] font-mono text-amber-700/60">
                  {isHindi ? "जन्म उदय लग्न: " : "Natal Lagna: "}
                  <span className="font-bold text-[#8C6E40]">
                    {isHindi ? translateSignHi(getSignName(realLagnaSignNum)) : getSignName(realLagnaSignNum)} ({realLagnaSignNum})
                  </span>
                </div>
              </div>

              <div className="w-full max-w-[420px] relative aspect-square bg-[#FAF7F0] border-2 border-[#EADFC7] rounded-3xl p-4 shadow-inner">
                <svg viewBox="0 0 400 400" className="w-full h-full text-amber-900 drop-shadow-sm select-none">
                  {/* Kendra Diamonds */}
                  <polygon points="200,200 100,100 200,0 300,100" fill="#FDFBF7" className="transition-colors hover:fill-amber-50/20" />
                  <polygon points="200,200 100,300 200,400 300,300" fill="#FDFBF7" className="transition-colors hover:fill-amber-50/20" />
                  <polygon points="200,200 100,100 0,200 100,300" fill="#FDFBF7" className="transition-colors hover:fill-amber-50/20" />
                  <polygon points="200,200 300,100 400,200 300,300" fill="#FDFBF7" className="transition-colors hover:fill-amber-50/20" />

                  {/* Outer Trikona & Dusthana Triangles */}
                  <polygon points="0,0 200,0 100,100" fill="#FAF6EA" />
                  <polygon points="0,0 0,200 100,100" fill="#FAF6EA" />
                  <polygon points="0,400 0,200 100,300" fill="#FAF6EA" />
                  <polygon points="0,400 200,400 100,300" fill="#FAF6EA" />
                  <polygon points="400,400 200,400 300,300" fill="#FAF6EA" />
                  <polygon points="400,400 400,200 300,300" fill="#FAF6EA" />
                  <polygon points="400,0 400,200 300,100" fill="#FAF6EA" />
                  <polygon points="400,0 200,0 300,100" fill="#FAF6EA" />

                  {/* Grid Lines */}
                  <rect x="0" y="0" width="400" height="400" fill="none" stroke="#C5B495" strokeWidth="2.5" />
                  <line x1="0" y1="0" x2="400" y2="400" stroke="#C5B495" strokeWidth="1.5" />
                  <line x1="400" y1="0" x2="0" y2="400" stroke="#C5B495" strokeWidth="1.5" />
                  <line x1="200" y1="0" x2="0" y2="200" stroke="#C5B495" strokeWidth="2" />
                  <line x1="0" y1="200" x2="200" y2="400" stroke="#C5B495" strokeWidth="2" />
                  <line x1="200" y1="400" x2="400" y2="200" stroke="#C5B495" strokeWidth="2" />
                  <line x1="400" y1="200" x2="200" y2="0" stroke="#C5B495" strokeWidth="2" />

                  {/* Render Houses (Deterministic UI logic - never recalculates server-side values) */}
                  {HOUSE_LAYOUTS.map(layout => {
                    const houseNum = layout.houseNum;
                    const signNum = ((realLagnaSignNum + houseNum - 2) % 12) + 1;
                    
                    // Filter transiting planets located in this specific house
                    const transitPlanetsInHouse = liveTransits.filter((t: any) => t.houseFromLagna === houseNum);
                    
                    // Include Lagna "La" anchor in House 1
                    const displayElements = houseNum === 1
                      ? [{ abbr: "La", name: "Lagna", retrograde: false, status: "Ascendant" }, ...transitPlanetsInHouse.map((p: any) => ({ abbr: p.planet.substring(0, 2), name: p.planet, retrograde: p.retrograde, status: p.nature }))]
                      : transitPlanetsInHouse.map((p: any) => ({ abbr: p.planet.substring(0, 2), name: p.planet, retrograde: p.retrograde, status: p.nature }));

                    return (
                      <foreignObject key={houseNum} x={layout.x} y={layout.y} width={layout.width} height={layout.height}>
                        <div className="w-full h-full relative flex flex-col justify-center items-center p-1 text-center select-none overflow-visible">
                          
                          {/* Elegant Zodiac Sign Number Badge */}
                          <span className={`absolute font-serif font-bold text-[11px] text-[#8C6E40] ${layout.signClass}`}>
                            {signNum}
                          </span>

                          {/* Planets inside this house */}
                          {displayElements.length > 0 ? (
                            <div className={getPlanetContainerClass(houseNum)}>
                              {displayElements.map((el: any, idx: number) => {
                                return (
                                  <span
                                    key={idx}
                                    title={`${el.name} ${el.retrograde ? (isHindi ? '(वक्री)' : '(Retrograde)') : ''}`}
                                    className={`text-[9.5px] px-1.5 py-0.5 rounded transition-transform hover:scale-110 cursor-help flex items-center gap-1 shrink-0 ${getPlanetChartStyle(el.abbr)}`}
                                  >
                                    <span>{getPlanetAbbreviation(el.abbr, isHindi)}</span>
                                    <span className="text-[10.5px] font-bold shrink-0">{getPlanetSymbol(el.abbr)}</span>
                                    {el.retrograde && <span className="text-[8.5px] font-serif font-semibold text-amber-700">℞</span>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </foreignObject>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Legend */}
              <div className="w-full mt-6 bg-[#FAF8F5] border border-[#F1E7D0] p-4 rounded-xl">
                <p className={`text-[9px] font-bold text-amber-700/50 uppercase mb-2.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "गोचर संकेत कुंजी" : "Gochar Legend"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-amber-800/60 font-serif">
                  <div className="flex items-center gap-1.5"><span className="font-serif font-bold text-amber-900">℞</span> {isHindi ? "वक्री (ग्रहों की पीछे की ओर प्रतीत होती गति)" : "Retrograde (Apparent backward motion)"}</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#1E293B] border border-slate-900 rounded inline-block" /> {isHindi ? "उच्च प्रभाव गुरुत्व (शनि, राहु, केतु)" : "High Weight (Saturn, Rahu, Ketu)"}</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#FFFEEB] border border-[#E6D0A0] rounded inline-block" /> {isHindi ? "मध्यम-उच्च प्रभाव गुरुत्व (गुरु)" : "Medium/High Weight (Jupiter)"}</div>
                  <div className="flex items-center gap-1.5"><span className="font-mono text-amber-600">✦</span> {isHindi ? "लग्न बिंदु (उदय लग्न संरेखण)" : "Lagna Point (Ascendant baseline)"}</div>
                </div>
              </div>
            </div>

            {/* Premium Gochar Sidebar & Climate Metrics (2/5 wide) */}
            <div className="lg:col-span-2 bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-80 h-80 text-amber-900">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
                  <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>

              {/* Atmospheric Cosmic Climate Indicators */}
              <div>
                <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase mb-4 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "✦ गोचरीय जलवायु संकेत" : "✦ Cosmic Climate Reading"}
                </h4>
                <div className="space-y-4 font-serif">
                  <div className="flex justify-between items-center bg-[#FAF8F5] border border-[#F1E7D0] px-4 py-2.5 rounded-xl">
                    <span className="text-xs text-amber-900/60">{isHindi ? "दैवीय अनुशासन (दबाव)" : "Celestial Pressure"}</span>
                    <span className="text-xs font-bold text-amber-950 bg-amber-50 border border-amber-200/50 px-2.5 py-0.5 rounded-full">
                      {getClimateLabel("pressure", climate?.netPressure)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#FAF8F5] border border-[#F1E7D0] px-4 py-2.5 rounded-xl">
                    <span className="text-xs text-amber-900/60">{isHindi ? "सघन संरेखण (अवसर)" : "Opportunities Aligning"}</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      {getClimateLabel("opportunity", climate?.netOpportunity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#FAF8F5] border border-[#F1E7D0] px-4 py-2.5 rounded-xl">
                    <span className="text-xs text-amber-900/60">{isHindi ? "सक्रिय ऊर्जा परिवर्तन (अस्थिरता)" : "Atmospheric Volatility"}</span>
                    <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                      {getClimateLabel("volatility", climate?.netVolatility)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              {/* Detail Transiting Planets Table */}
              <div>
                <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase mb-3.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? "✦ तात्कालिक गोचर स्थितियां" : "✦ Live Transit Positions"}
                </h4>
                <div className="space-y-3 font-sans text-xs">
                  {liveTransits.map((t: any) => {
                    const weightStyles = getVisualWeight(t.planet, isHindi);
                    return (
                      <div key={t.planet} className="flex justify-between items-center border-b border-[#F1E7D0]/40 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 font-serif text-sm leading-none shrink-0">{PLANET_SYMBOLS[t.planet] || "✦"}</span>
                          <div>
                            <p className="font-serif font-bold text-[#3F2D1D] flex items-center gap-1">
                              {isHindi ? translatePlanetHi(t.planet) : t.planet}
                              {t.retrograde && <span className="text-[9px] font-bold text-amber-700 italic">℞</span>}
                            </p>
                            <p className="text-[9px] text-amber-700/40 tracking-wider uppercase font-mono">
                              {isHindi ? `${t.houseFromLagna} भाव • ${translateSignHi(t.sign)}` : `House ${t.houseFromLagna} • ${t.sign}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${weightStyles.badgeClass}`}>
                            {weightStyles.label}
                          </span>
                          <p className="text-[8.5px] text-amber-700/50 mt-1 italic font-serif">{weightStyles.timeSensitivity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TRANSIT BASED PREDICTIONS — 12 Life Domains
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-[#F1E7D0] pt-8">
          <div>
            <p className={`text-[10px] font-bold text-amber-600/50 uppercase mb-1 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
              {isHindi ? "✦ प्रगाढ़ वैदिक अंतर्दृष्टि" : "✦ Deep Vedic Intelligence"}
            </p>
            <h3 className={`text-xl font-serif font-semibold text-amber-900 ${isHindi ? 'tracking-normal' : ''}`}>
              {isHindi ? "गोचर आधारित भविष्यफल" : "Transit Based Predictions"}
            </h3>
            <p className="text-sm text-amber-700/50 mt-1">
              {isHindi ? "सक्रिय गोचरीय ग्रह किस प्रकार आपके विभिन्न जीवन क्षेत्रों को प्रभावित करते हैं — आपकी वर्तमान दशा के आलोक में विवेचित" : "How active planetary transits influence each major life domain — read by your Dasha stack"}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            {/* Load Button — language is controlled globally via nav */}
            {!loaded && (
              <button
                onClick={() => fetchDomains(mode)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#FCFAF2] border-2 border-amber-300 text-amber-900 text-sm font-serif font-semibold hover:bg-amber-50 hover:border-amber-400 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🪔"}
                {loading ? (isHindi ? "ग्रहों का संरेखण पढ़ा जा रहा है..." : "Consulting the stars...") : (isHindi ? "गोचर भविष्यफल प्राप्त करें" : "Load Transit Predictions")}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-amber-700/50 uppercase tracking-widest font-serif italic">
              {isHindi ? "पंडित जी आपके सभी बारह जीवन क्षेत्रों पर गोचर के प्रभाव का सूक्ष्म अध्ययन कर रहे हैं..." : "The Pundit is reading your transits across all life domains..."}
            </p>
          </div>
        )}

        {/* Domain Cards Grid */}
        {!loading && loaded && domains.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {domains.map((domain, idx) => {
              const styles = STRENGTH_STYLES[domain.strength];
              const isExpanded = expandedCards[domain.id] ?? false;

              // Enforce Math-Based Hierarchy & Restraint (Issue 4)
              const isMostActive = domain.emphasisTag === "Most Active";
              const isInfluenced = domain.emphasisTag === "Currently Influenced";

              const cardBorderClass = isMostActive
                ? "border-[#DCA842] ring-1 ring-[#DCA842]/30 bg-[#FFFDF9] shadow-[0_6px_20px_rgba(220,168,66,0.05)]"
                : isInfluenced
                ? "border-indigo-200/80 bg-white shadow-sm"
                : `${styles.card} shadow-sm`;

              const currentStatusLabel = isHindi
                ? (domain.statusLabelHindi || styles.labelHindi)
                : (domain.statusLabel || styles.label);

              return (
                <motion.div key={domain.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-300 ${cardBorderClass}`}>

                  {/* Header — always visible */}
                  <button onClick={() => toggleCard(domain.id)} className="w-full text-left p-5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">{domain.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h5 className="text-[14px] font-serif font-bold text-[#3F2D1D]">{isHindi ? domain.titleHindi : domain.title}</h5>
                          {!isHindi && <span className="text-[10px] text-amber-700/50 font-serif">{domain.titleHindi}</span>}
                          
                          {/* Dynamic Hindi/English Status Badge (Issue 3) */}
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles.badge}`}>
                            {currentStatusLabel}
                          </span>

                          {/* Dynamic Priority Indicators (Issue 4) */}
                          {isMostActive && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white shadow-sm font-sans">
                              {isHindi ? "सर्वाधिक सक्रिय" : "Most Active"}
                            </span>
                          )}
                          {isInfluenced && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/60 font-sans">
                              {isHindi ? "वर्तमान में प्रभावित" : "Currently Influenced"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {domain.planetSignals.map(p => (
                            <span key={p} className="text-[9px] font-mono font-bold text-amber-700/60 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-600/60" /> : <ChevronDown className="w-4 h-4 text-amber-600/60" />}
                    </div>
                  </button>

                  {/* Preview — first pattern, collapsed */}
                  {!isExpanded && domain.activatedPatterns[0] && (
                    <div className="px-5 pb-5 -mt-2">
                      <p className="text-xs text-[#3F2D1D]/70 font-serif italic pl-11 border-l-2 border-amber-300/50 leading-relaxed">
                        {domain.activatedPatterns[0]}
                        {domain.activatedPatterns.length > 1 && <span className="text-amber-500 ml-1">+{domain.activatedPatterns.length - 1} more insights...</span>}
                      </p>
                    </div>
                  )}

                  {/* Expanded — full Pundit-depth content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-6 space-y-5">

                        {/* Timing Window & Confidence Tone Banners */}
                        {(domain.timingWindow || domain.confidenceTone) && (
                          <div className="ml-11 flex flex-wrap gap-2 text-[11px] font-serif">
                            {domain.confidenceTone && (
                              <span className="bg-amber-50/60 text-amber-800 border border-amber-200/50 px-2.5 py-1 rounded-lg font-medium shadow-sm">
                                {isHindi ? "प्रभाव तीव्रता: " : "Activation: "}
                                <strong className="text-amber-900">{isHindi ? domain.confidenceToneHindi : domain.confidenceTone}</strong>
                              </span>
                            )}
                            {domain.timingWindow && (
                              <span className="bg-[#F6F5F2]/80 text-[#5C4D3C] border border-[#E6DCC3] px-2.5 py-1 rounded-lg shadow-sm">
                                {isHindi ? "समय सीमा: " : "Timeline: "}
                                <strong className="text-[#3F2D1D]">{isHindi ? domain.timingWindowHindi : domain.timingWindow}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Pundit Oral Narrative — main reading */}
                        <div className="bg-[#FAF4E5] border border-[#DFD3BA] rounded-2xl p-5 relative overflow-hidden ml-11">
                          <div className="absolute right-3 bottom-3 text-5xl text-amber-700/5 select-none font-serif font-bold">ॐ</div>
                          <p className="text-[9px] font-bold text-amber-600/60 uppercase tracking-widest mb-3">
                            {isHindi ? "💬 पंडित जी का मार्गदर्शन" : "💬 Pundit's Reading"}
                          </p>
                          <p className="text-[13px] text-amber-950 font-serif leading-relaxed">
                            {domain.narrative}
                          </p>
                        </div>

                        {/* 2x2 "Why This Matters" Segmented Grid (Issue 5) */}
                        {domain.whyThisMatters && (
                          <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl p-4 space-y-1.5 shadow-sm">
                              <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <span>🪐</span> {isHindi ? "गोचरीय कारण" : "Transit Reasoning"}
                              </p>
                              <p className="text-xs text-[#3F2D1D]/90 font-serif leading-relaxed">
                                {isHindi ? domain.whyThisMatters.transitReasoningHindi : domain.whyThisMatters.transitReasoning}
                              </p>
                            </div>

                            <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl p-4 space-y-1.5 shadow-sm">
                              <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <span>⏳</span> {isHindi ? "दशा चक्र प्रभाव" : "Dasha Influence"}
                              </p>
                              <p className="text-xs text-[#3F2D1D]/90 font-serif leading-relaxed">
                                {isHindi ? domain.whyThisMatters.dashaInfluenceHindi : domain.whyThisMatters.dashaInfluence}
                              </p>
                            </div>

                            <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl p-4 space-y-1.5 shadow-sm">
                              <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <span>✅</span> {isHindi ? "व्यावहारिक कदम" : "Practical Action"}
                              </p>
                              <p className="text-xs text-[#3F2D1D]/90 font-serif leading-relaxed">
                                {isHindi ? domain.whyThisMatters.practicalInterpretationHindi : domain.whyThisMatters.practicalInterpretation}
                              </p>
                            </div>

                            <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-xl p-4 space-y-1.5 shadow-sm">
                              <p className="text-[10px] font-bold text-indigo-700/70 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <span>⚓</span> {isHindi ? "आंतरिक संतुलन" : "Internal Calm"}
                              </p>
                              <p className="text-xs text-[#3F2D1D]/90 font-serif leading-relaxed">
                                {isHindi ? domain.whyThisMatters.emotionalGuidanceHindi : domain.whyThisMatters.emotionalGuidance}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Transit Signal Bullets */}
                        {domain.activatedPatterns.length > 0 && (
                          <div className="ml-11 space-y-2 pt-2 border-t border-dashed border-[#F1E7D0]">
                            <p className="text-[9px] font-bold text-amber-600/50 uppercase tracking-widest mb-2">✦ {isHindi ? "सक्रिय गोचर संकेत" : "Active Transit Signals"}</p>
                            {domain.activatedPatterns.map((pattern, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-amber-500 mt-1 shrink-0 text-xs">✦</span>
                                <p className="text-xs text-[#3F2D1D]/80 font-serif leading-relaxed">{pattern}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Caution Banner */}
                        {domain.caution && (
                          <div className="ml-11 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 shadow-sm">
                            <Zap className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-rose-800 font-serif leading-relaxed">
                              <span className="font-bold">{isHindi ? "⚠️ सावधानी: " : "⚠️ Caution: "}</span>{domain.caution}
                            </p>
                          </div>
                        )}

                        {/* Primary Planet Badge */}
                        <div className="ml-11 flex items-center gap-2 pt-1">
                          <Shield className="w-3 h-3 text-amber-500" />
                          <p className="text-[10px] text-amber-700/60 uppercase tracking-widest font-mono">
                            {isHindi ? "मुख्य ग्रह" : "Primary Governing Planet"}: <strong className="text-amber-800">{domain.primaryPlanet}</strong>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty / Not Loaded Hint */}
        {!loading && !loaded && (
          <div className="bg-[#FFFDF8] border border-dashed border-amber-200 rounded-2xl p-10 text-center">
            <p className="text-3xl mb-3">🪔</p>
            <p className="text-sm font-serif text-amber-800/60 italic">
              {isHindi 
                ? "द्वादश जीवन क्षेत्रों पर पंडित जी का सूक्ष्म व गंभीर मार्गदर्शन प्राप्त करने के लिए ऊपर 'गोचर भविष्यफल प्राप्त करें' पर क्लिक करें।" 
                : "Click \"Load Transit Predictions\" above to receive the Pundit's deep reading across all 12 life domains."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function getSignName(signNum: number) {
  const ZODIAC_SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  return ZODIAC_SIGNS[(signNum - 1) % 12] || "Aries";
}
