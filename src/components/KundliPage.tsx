"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Database, Navigation, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Fallback planetary data
const PLANETS = [
  { abbr: "La", name: "Lagna",   sign: "Capricorn", house: 1,  status: "",          degree: "15°22'08\"" },
  { abbr: "Sa", name: "Saturn",  sign: "Aquarius",  house: 2,  status: "Dominant",  degree: "11°44'33\"" },
  { abbr: "Ju", name: "Jupiter", sign: "Aries",     house: 4,  status: "Neutral",   degree: "12°05'17\"" },
  { abbr: "Ma", name: "Mars",    sign: "Scorpio",   house: 11, status: "Dominant",  degree: "10°18'52\"" },
  { abbr: "Su", name: "Sun",     sign: "Leo",       house: 8,  status: "Neutral",   degree: "08°33'41\"" },
  { abbr: "Mo", name: "Moon",    sign: "Taurus",    house: 5,  status: "Strong",    degree: "05°47'29\"" },
  { abbr: "Me", name: "Mercury", sign: "Virgo",     house: 9,  status: "Dominant",  degree: "15°12'03\"" },
  { abbr: "Ve", name: "Venus",   sign: "Pisces",    house: 3,  status: "Neutral",   degree: "12°58'44\"" },
  { abbr: "Ra", name: "Rahu",    sign: "Pisces",    house: 3,  status: "",          degree: "22°11'18\"" },
  { abbr: "Ke", name: "Ketu",    sign: "Virgo",     house: 9,  status: "",          degree: "22°11'18\"" },
];

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const PLANET_NAMES_HI: Record<string, string> = {
  Lagna: "लग्न",
  Sun: "सूर्य",
  Moon: "चंद्र",
  Mars: "मंगल",
  Mercury: "बुध",
  Jupiter: "गुरु",
  Venus: "शुक्र",
  Saturn: "शनि",
  Rahu: "राहु",
  Ketu: "केतु",
};

const ZODIAC_SIGNS_HI: Record<string, string> = {
  Aries: "मेष",
  Taurus: "वृषभ",
  Gemini: "मिथुन",
  Cancer: "कर्क",
  Leo: "सिंह",
  Virgo: "कन्या",
  Libra: "तुला",
  Scorpio: "वृश्चिक",
  Sagittarius: "धनु",
  Capricorn: "मकर",
  Aquarius: "कुंभ",
  Pisces: "मीन",
};

const STATUS_HI: Record<string, string> = {
  Retrograde: "वक्री",
  Combust: "अस्त",
  Exalted: "उच्च",
  Debilitated: "नीच",
  Dominant: "बलवान",
  Strong: "सुदृढ़",
  Neutral: "सामान्य",
  Stable: "स्थिर",
  Sensitive: "संवेदनशील",
  Supportive: "अनुकूल",
  Active: "सक्रिय",
  Ascendant: "लग्न",
  "Birth Chart": "जन्म कुंडली",
  Planets: "ग्रह स्थिति",
  Dasha: "दशा काल",
  Transit: "गोचर प्रवाह",
  "Chart Legend": "कुंडली संकेत",
};

const translatePlanet = (name: string, isHindi: boolean) => {
  return isHindi ? (PLANET_NAMES_HI[name] || name) : name;
};

const translateZodiac = (sign: string, isHindi: boolean) => {
  return isHindi ? (ZODIAC_SIGNS_HI[sign] || sign) : sign;
};

const translateStatus = (status: string, isHindi: boolean) => {
  if (!status) return "";
  return isHindi ? (STATUS_HI[status] || status) : status;
};

const getPlanetAbbr = (abbr: string, isHindi: boolean) => {
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

const getSignName = (signNum: number) => {
  return ZODIAC_SIGNS[(signNum - 1) % 12] || "Aries";
};

const LAGNA_LORDS: Record<string, { name: string; symbol: string }> = {
  Aries: { name: "Mars", symbol: "♂" },
  Taurus: { name: "Venus", symbol: "♀" },
  Gemini: { name: "Mercury", symbol: "☿" },
  Cancer: { name: "Moon", symbol: "☾" },
  Leo: { name: "Sun", symbol: "☉" },
  Virgo: { name: "Mercury", symbol: "☿" },
  Libra: { name: "Venus", symbol: "♀" },
  Scorpio: { name: "Mars", symbol: "♂" },
  Sagittarius: { name: "Jupiter", symbol: "♃" },
  Capricorn: { name: "Saturn", symbol: "♄" },
  Aquarius: { name: "Saturn", symbol: "♄" },
  Pisces: { name: "Jupiter", symbol: "♃" }
};

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

type ActiveView = "lagna" | "dasha" | "transit" | "planets";

// Geometry config for North Indian Diamond Chart (400x400 SVG coords)
interface HouseLayoutConfig {
  houseNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  // CSS class to absolute-position the small sign number inside the cell
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

export default function KundliPage({ chartData }: { chartData?: any }) {
  const { isHindi } = useLanguage();
  const [activeView, setActiveView] = useState<ActiveView>("lagna");

  const realChart = chartData?.chart;
  const realLagnaSignNum = realChart?.lagna?.sign || 10; // Default Capricorn
  const realLagnaSignName = getSignName(realLagnaSignNum);
  
  const realMD = chartData?.temporal?.stack?.mahadasha || "Saturn";
  const realAD = chartData?.temporal?.stack?.antardasha || "Jupiter";
  
  // Format Lagna display info:
  const moonPlanet = realChart?.planets?.find((p: any) => p.name === "Moon");
  const moonSignName = moonPlanet ? getSignName(moonPlanet.sign) : "Taurus";
  const lagnaInfoText = isHindi
    ? `${translateZodiac(realLagnaSignName, true)} लग्न • ${translatePlanet(realMD, true)} महादशा • चंद्र देव ${translateZodiac(moonSignName, true)} राशि में`
    : `${realLagnaSignName} Ascendant • ${realMD} Mahadasha • Moon in ${moonSignName}`;

  // Construct dynamic PLANETS list
  const displayPlanets = realChart?.planets 
    ? [
        {
          abbr: "La",
          name: "Lagna",
          sign: realLagnaSignName,
          house: 1,
          status: "Ascendant",
          degree: `${Math.floor(realChart.lagna.longitude % 30)}°${Math.floor((realChart.lagna.longitude % 30 * 60) % 60)}'00"`
        },
        ...realChart.planets.map((p: any) => {
          const abbr = p.name.substring(0, 2);
          const signName = getSignName(p.sign);
          const house = ((p.sign - realLagnaSignNum + 12) % 12) + 1;
          const status = p.isRetrograde ? "Retrograde" : p.isCombust ? "Combust" : p.isVargottama ? "Vargottama" : p.strengthLevel || "";
          
          return {
            abbr,
            name: p.name,
            sign: signName,
            house,
            status,
            degree: `${Math.floor(p.longitude % 30)}°${Math.floor((p.longitude % 30 * 60) % 60)}'${Math.floor((p.longitude % 30 * 3600) % 60)}"`
          };
        })
      ]
    : PLANETS;

  const dashaEndsAt = chartData?.temporal?.timing?.endsAt 
    ? new Date(chartData.temporal.timing.endsAt).toLocaleDateString(isHindi ? "hi-IN" : "en-US", { month: "short", year: "numeric" })
    : (isHindi ? "अगस्त 2035" : "Aug 2035");

  const dashaList = chartData?.temporal?.stack 
    ? [
        { planet: realAD, type: "Antardasha", period: chartData.temporal.timing.remaining + (isHindi ? " शेष" : " remaining"), status: "active" },
        { planet: chartData.temporal.stack.pratyantar || "Mercury", type: "Pratyantar", period: isHindi ? "वर्तमान उप-अवधि" : "Current sub-period", status: "next" },
      ]
    : [
        { planet: "Jupiter", type: "Antardasha", period: isHindi ? "नवंबर 2023 – मार्च 2027" : "Nov 2023 – Mar 2027", status: "active" },
        { planet: "Saturn",  type: "Antardasha", period: isHindi ? "मार्च 2027 – अप्रैल 2030" : "Mar 2027 – Apr 2030", status: "next" },
        { planet: "Mercury", type: "Antardasha", period: isHindi ? "अप्रैल 2030 – जनवरी 2033" : "Apr 2030 – Jan 2033", status: "upcoming" },
      ];

  const liveTransits = chartData?.transitIntelligence?.transits || [];
  const transitList = liveTransits.length > 0
    ? liveTransits.slice(0, 4).map((t: any, i: number) => {
        const colors = ["indigo", "amber", "rose", "orange"];
        return {
          planet: t.planet,
          sign: t.sign || "Active Sign",
          house: t.houseFromLagna || 1,
          influence: isHindi 
            ? (t.whyItMattersHindi?.[0] || `${translatePlanet(t.planet, true)} का आपके जीवन चक्र में गोचर प्रवाह।`)
            : (t.whyItMatters?.[0] || `${t.planet} transiting through your charts.`),
          color: colors[i % 4]
        };
      })
    : [
        { planet: "Saturn",  sign: "Aquarius",  house: 2,  influence: isHindi ? "शनि देव का गोचर — करियर एवं वित्तीय नींव सुदृढ़ करने की अवधि" : "Saturn Discipline Cycle — Career & Foundations", color: "indigo" },
        { planet: "Jupiter", sign: "Aries",     house: 4,  influence: isHindi ? "गुरु देव की अनुकम्पा — ज्ञान अर्जन एवं सुख-शांति का विस्तार" : "Jupiter Growth Phase — Learning & Home", color: "amber" },
      ];

  const tabs = [
    { id: "lagna",   label: isHindi ? "जन्म कुंडली" : "Birth Chart", icon: Sparkles },
    { id: "planets", label: isHindi ? "ग्रह स्थिति" : "Planets",     icon: Star },
    { id: "dasha",   label: isHindi ? "दशा काल" : "Dasha",       icon: Database },
    { id: "transit", label: isHindi ? "गोचर प्रवाह" : "Transit",     icon: Navigation },
  ];

  return (
    <div className="max-w-5xl mx-auto pt-4 space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-amber-900 leading-relaxed">
          {isHindi ? "कुंडली — जन्म चक्र" : "Kundli — Birth Chart"}
        </h2>
        <p className="text-sm text-amber-700/50 leading-relaxed">{lagnaInfoText}</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveView(t.id as ActiveView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeView === t.id ? "bg-amber-600 text-white shadow-sm" : "bg-white border border-[#F1E7D0] text-amber-700 hover:border-amber-300 hover:bg-amber-50"}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="tracking-normal">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart View */}
      {activeView === "lagna" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            
            {/* Left Column - Traditional North Indian Diamond Chart SVG (3/5 width) */}
            <div className="lg:col-span-3 bg-white border border-[#F1E7D0] rounded-2xl p-8 shadow-sm flex flex-col items-center">
              <p className={`text-[10px] font-bold text-amber-600/50 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-6 self-start`}>
                {isHindi ? "लग्न कुंडली (पारंपरिक उत्तर भारतीय शैली)" : "Lagna Chart (Traditional North Indian Diamond View)"}
              </p>
              
              <div className="w-full max-w-[420px] relative aspect-square bg-[#FAF7F0] border-2 border-[#EADFC7] rounded-3xl p-4 shadow-inner">
                <svg viewBox="0 0 400 400" className="w-full h-full text-amber-900 drop-shadow-sm select-none">
                  
                  {/* Background fills for Kendra (pillar) houses vs. outer triangles */}
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

                  {/* Grid Lines - Darker Gold-Earth Tone */}
                  <rect x="0" y="0" width="400" height="400" fill="none" stroke="#C5B495" strokeWidth="2.5" />
                  <line x1="0" y1="0" x2="400" y2="400" stroke="#C5B495" strokeWidth="1.5" />
                  <line x1="400" y1="0" x2="0" y2="400" stroke="#C5B495" strokeWidth="1.5" />
                  <line x1="200" y1="0" x2="0" y2="200" stroke="#C5B495" strokeWidth="2" />
                  <line x1="0" y1="200" x2="200" y2="400" stroke="#C5B495" strokeWidth="2" />
                  <line x1="200" y1="400" x2="400" y2="200" stroke="#C5B495" strokeWidth="2" />
                  <line x1="400" y1="200" x2="200" y2="0" stroke="#C5B495" strokeWidth="2" />

                  {/* Render Houses dynamically via foreignObject */}
                  {HOUSE_LAYOUTS.map(layout => {
                    const houseNum = layout.houseNum;
                    const signNum = ((realLagnaSignNum + houseNum - 2) % 12) + 1;
                    
                    // Filter planets located in this specific house
                    const planetsInHouse = displayPlanets.filter((p: any) => p.house === houseNum);

                    return (
                      <foreignObject key={houseNum} x={layout.x} y={layout.y} width={layout.width} height={layout.height}>
                        <div className="w-full h-full relative flex flex-col justify-center items-center p-1 text-center select-none overflow-visible">
                          
                          {/* Elegant Saffron/Amber Zodiac Sign Number Badge */}
                          <span className={`absolute font-serif font-bold text-[11px] text-[#8C6E40] ${layout.signClass}`}>
                            {signNum}
                          </span>

                          {/* Planets inside this house */}
                          {planetsInHouse.length > 0 ? (
                            <div className={getPlanetContainerClass(houseNum)}>
                              {planetsInHouse.map((p, idx) => (
                                <span
                                  key={idx}
                                  title={`${translatePlanet(p.name, isHindi)} (${p.degree} - ${translateStatus(p.status, isHindi) || (isHindi ? 'सक्रिय' : 'Active')})`}
                                  className={`text-[9.5px] px-1.5 py-0.5 rounded transition-transform hover:scale-110 cursor-help flex items-center gap-1 shrink-0 ${getPlanetChartStyle(p.abbr)}`}
                                >
                                  <span className="tracking-normal">{getPlanetAbbr(p.abbr, isHindi)}</span>
                                  <span className="text-[10.5px] font-bold shrink-0">{getPlanetSymbol(p.abbr)}</span>
                                  {p.status === "Retrograde" && <span className="text-[8.5px] font-serif font-semibold text-amber-700">℞</span>}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </foreignObject>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Right Column - Planetary Summary & AI Counseling (2/5 width) */}
            <div className="lg:col-span-2 bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
              {/* Faint mandala watermark */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-80 h-80 text-amber-900">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
                  <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="currentColor" strokeWidth="1" />
                  <polygon points="100,40 160,100 100,160 40,100" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                  <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="1" />
                  <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>

              <div>
                <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-2.5`}>
                  {isHindi ? "✦ प्रभाव एवं महत्व" : "✦ Why This Matters"}
                </h4>
                <p className="text-[13px] text-amber-950 font-serif leading-relaxed italic">
                  {isHindi 
                    ? `आपका ${translateZodiac(realLagnaSignName, true)} लग्न और सक्रिय ${translatePlanet(realMD, true)} महादशा वर्तमान में महत्वाकांक्षा, नवीन प्रयोग और mental restlessness को गति प्रदान कर रहे हैं। यह काल रणनीतिक आत्म-मंथन के लिए अति अनुकूल है, परंतु दैहिक शांति और संयमित निर्णयों की मांग करता है।`
                    : `Your ${realLagnaSignName} ascendant and active ${realMD} Mahadasha are currently amplifying ambition, experimentation, and mental restlessness. This period favors strategic reinvention but requires emotional grounding and disciplined decision-making.`
                  }
                </p>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              <div>
                <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-3.5`}>
                  {isHindi ? "✦ ज्योतिषीय रूपरेखा" : "✦ Astrological DNA"}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">{isHindi ? "लग्न स्वामी" : "Lagna Lord"}</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {isHindi 
                        ? `${translatePlanet((LAGNA_LORDS[realLagnaSignName] || { name: "Saturn" }).name, true)}`
                        : `${(LAGNA_LORDS[realLagnaSignName] || { name: "Saturn", symbol: "♄" }).name}`
                      } <span className="font-mono text-amber-600">{(LAGNA_LORDS[realLagnaSignName] || { name: "Saturn", symbol: "♄" }).symbol}</span>
                    </p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">{isHindi ? "नक्षत्र" : "Nakshatra"}</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {moonPlanet?.nakshatra || (isHindi ? "मूला" : "Mula")}
                    </p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">{isHindi ? "चंद्र राशि" : "Moon Sign"}</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {translateZodiac(moonSignName, isHindi)} <span className="font-mono text-amber-600">☾</span>
                    </p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">{isHindi ? "सक्रिय दशा" : "Current Dasha"}</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {translatePlanet(realMD, isHindi)} <span className="text-[9px] font-sans text-amber-600">{isHindi ? "महा" : "MD"}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              <div>
                <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-2.5`}>
                  {isHindi ? "✦ अनुकूल प्रभाव" : "✦ Supportive Influences"}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {displayPlanets.filter((p: any) => ["Dominant", "Strong", "Exalted", "Vargottama"].includes(p.status) && p.abbr !== "La").length > 0 ? (
                    displayPlanets.filter((p: any) => ["Dominant", "Strong", "Exalted", "Vargottama"].includes(p.status) && p.abbr !== "La").map((p, idx) => (
                      <span key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                        <span>{getPlanetSymbol(p.abbr)}</span>
                        <strong className="tracking-normal">{translatePlanet(p.name, isHindi)}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-800/40 italic leading-relaxed">
                      {isHindi ? "संतुलित प्राकृतिक वातावरण" : "Calm environmental integration"}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className={`text-[10px] font-bold text-amber-700/60 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-2.5`}>
                  {isHindi ? "✦ संवेदनशील क्षेत्र" : "✦ Sensitive Areas"}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {displayPlanets.filter((p: any) => ["Combust", "Retrograde", "Debilitated"].includes(p.status) || ["Rahu", "Ketu"].includes(p.name)).length > 0 ? (
                    displayPlanets.filter((p: any) => ["Combust", "Retrograde", "Debilitated"].includes(p.status) || ["Rahu", "Ketu"].includes(p.name)).map((p, idx) => (
                      <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                        <span>{getPlanetSymbol(p.abbr)}</span>
                        <strong className="tracking-normal">{translatePlanet(p.name, isHindi)}</strong>
                        {p.status && <span className="text-[8px] text-rose-500/70">({translateStatus(p.status, isHindi)})</span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-800/40 italic leading-relaxed">
                      {isHindi ? "कोई तनाव संकेत सक्रिय नहीं है" : "No high-stress indicators active"}
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Current Planetary Influences Section */}
          <div className="bg-[#FAF8F5] border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
            <p className={`text-[10px] font-bold text-amber-700/60 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-4`}>
              {isHindi ? "वर्तमान ग्रहीय प्रभाव प्रवाह" : "Current Planetary Influences"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-amber-900 flex items-center gap-1.5 leading-relaxed">
                  <span className="font-mono text-amber-600">☊</span> {isHindi ? "मीन राशि में राहु (दशम भाव)" : "Rahu in Pisces (10th House)"}
                </p>
                <p className="text-xs text-amber-800/60 leading-relaxed font-serif">
                  {isHindi 
                    ? "करियर और व्यावसायिक क्षेत्र में महत्वाकांक्षा एवं परिवर्तन की इच्छा को तीव्र करता है, परंतु भ्रम अथवा जल्दबाजी से सावधान रहना अपेक्षित है।"
                    : "Amplifies career ambition, business experimentation, and desire for growth, but invites occasional uncertainty."
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-amber-900 flex items-center gap-1.5 leading-relaxed">
                  <span className="font-mono text-amber-600">♄</span> {isHindi ? "कुंभ राशि में शनि (द्वितीय भाव)" : "Saturn in Aquarius (2nd House)"}
                </p>
                <p className="text-xs text-amber-800/60 leading-relaxed font-serif">
                  {isHindi 
                    ? "वाणी और संचित धन में पूर्ण अनुशासन, दीर्घकालिक वित्तीय संरेखण और जिम्मेदारी से बातचीत की अपेक्षा रखता है।"
                    : "Demands absolute financial discipline, long-term building, and responsible communication."
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-amber-900 flex items-center gap-1.5 leading-relaxed">
                  <span className="font-mono text-amber-600">♃</span> {isHindi ? "मेष राशि में गुरु (चतुर्थ भाव)" : "Jupiter in Aries (4th House)"}
                </p>
                <p className="text-xs text-amber-800/60 leading-relaxed font-serif">
                  {isHindi 
                    ? "आंतरिक शांति, पारिवारिक सुख, आत्म-ज्ञान और माता के साथ संबंधों में प्रगाढ़ता का पूर्ण समर्थन करता है।"
                    : "Supports internal stability, growth of home environments, learning, and strong maternal relationships."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className={`text-[10px] font-bold text-amber-700/50 uppercase ${isHindi ? 'tracking-normal text-xs font-serif leading-relaxed' : 'tracking-widest'} mb-3`}>
              {isHindi ? "कुंडली संकेत मार्गदर्शिका" : "Chart Legend"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["Vargottama", isHindi ? "वर्गोत्तम (नवांश में समान राशि)" : "Planetary strength matches Navamsa"], 
                ["Retrograde", isHindi ? "वक्री (पृथ्वी से देखने पर विपरीत गति)" : "Apparent backward movement"], 
                ["Combust", isHindi ? "अस्त (सूर्य देव के अति समीप होना)" : "Close proximity to the Sun"], 
                ["Ascendant (La)", isHindi ? "लग्न (जन्म के समय उदित राशि)" : "Lagna point at time of birth"]
              ].map(([sym, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-amber-800/60 leading-relaxed">
                  <span className="font-mono font-bold text-amber-600 shrink-0">{sym}</span> <span className="font-serif">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Planets Table */}
      {activeView === "planets" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white border border-[#F1E7D0] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 border-b border-[#F1E7D0]">
                <tr>
                  {(isHindi ? ["ग्रह", "राशि", "भाव", "बल / स्थिति", "अंश / डिग्री"] : ["Planet", "Sign", "House", "Strength", "Degree"]).map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-amber-700/50 uppercase tracking-normal font-serif">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E7D0]">
                {displayPlanets.map((p, i) => (
                  <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold font-mono flex items-center justify-center">{getPlanetAbbr(p.abbr, isHindi)}</span>
                        <span className="font-medium text-amber-900 font-serif">{translatePlanet(p.name, isHindi)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-amber-800/70 font-serif">{translateZodiac(p.sign, isHindi)}</td>
                    <td className="px-5 py-4 text-amber-800/70 font-serif">
                      {isHindi ? `भाव ${p.house}` : `House ${p.house}`}
                    </td>
                    <td className="px-5 py-4">
                      {p.status ? (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full font-serif ${p.status === "Vargottama" || p.status === "Ascendant" ? "bg-emerald-100 text-emerald-700" : p.status === "Retrograde" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{translateStatus(p.status, isHindi)}</span>
                      ) : <span className="text-amber-300">—</span>}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-amber-700/60">{p.degree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Dasha View */}
      {activeView === "dasha" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white border border-[#F1E7D0] rounded-2xl p-8 shadow-sm text-center relative overflow-hidden">
            <p className="text-[10px] font-bold text-amber-600/50 uppercase tracking-normal font-serif mb-4">{isHindi ? "सक्रिय महादशा" : "Active Mahadasha"}</p>
            <h2 className="text-5xl font-serif font-light text-amber-900 mb-1">{translatePlanet(realMD, isHindi)}</h2>
            <p className="text-sm text-amber-700/50 mb-6 font-serif">
              {isHindi ? `${dashaEndsAt} तक सक्रिय` : `Active until ${dashaEndsAt}`}
            </p>
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden mb-2">
              <div className="h-full w-[65%] bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" />
            </div>
            <p className="text-xs text-amber-600/40 mb-6 font-serif">{isHindi ? "वर्तमान सक्रिय चरण" : "Active Phase"}</p>

            {/* Elegant Nested Dasha Progression Timeline Mini-Bar */}
            <div className="mt-8 pt-6 border-t border-[#F1E7D0] text-left">
              <p className="text-[9px] font-bold uppercase tracking-normal text-amber-600/70 mb-4 font-serif">{isHindi ? "✦ जीवन अध्याय प्रगति यात्रा" : "✦ Chapter Progression Timeline"}</p>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 ring-4 ring-amber-100 flex items-center justify-center shrink-0" />
                  <div className="flex-1 flex justify-between items-center bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2 shadow-sm font-serif font-bold text-amber-950">
                    <span>{translatePlanet(realMD, isHindi)} {isHindi ? "महादशा" : "Mahadasha"}</span>
                    <span className="text-[10px] text-amber-600 font-mono font-medium">{isHindi ? "प्रगति पर" : "Underway"}</span>
                  </div>
                </div>
                <div className="pl-[5px] border-l border-dashed border-amber-300 space-y-3 ml-[4px]">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <div className="flex-1 flex justify-between items-center bg-white border border-[#F1E7D0] rounded-xl px-3 py-1.5 shadow-sm font-serif">
                      <span className="font-medium text-amber-900">├── {translatePlanet(realAD, isHindi)} {isHindi ? "अंतर्दशा (मुख्य केंद्र)" : "Antardasha (Current Focus)"}</span>
                      <span className="text-[9px] text-amber-500 font-mono">{isHindi ? "सक्रिय" : "Active"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                    <div className="flex-1 flex justify-between items-center bg-white border border-[#F1E7D0] rounded-xl px-3 py-1.5 font-serif">
                      <span className="text-amber-800">├── {isHindi ? "शनि अंतर्दशा (अगला चरण)" : "Saturn Antardasha (Next Phase)"}</span>
                      <span className="text-[9px] text-amber-450 font-mono">{isHindi ? "मार्च २०२७ से प्रारंभ" : "Starts Mar 2027"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-200 shrink-0" />
                    <div className="flex-1 flex justify-between items-center bg-white border border-[#F1E7D0] rounded-xl px-3 py-1.5 font-serif">
                      <span className="text-amber-800">└── {isHindi ? "बुध अंतर्दशा (भावी अध्याय)" : "Mercury Antardasha (Future Chapter)"}</span>
                      <span className="text-[9px] text-amber-450 font-mono">{isHindi ? "अप्रैल २०३० से प्रारंभ" : "Starts Apr 2030"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {dashaList.map((d, i) => (
            <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border shadow-sm ${d.status === "active" ? "bg-amber-50 border-amber-200" : "bg-white border-[#F1E7D0]"}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-normal font-serif mb-0.5 ${d.status === "active" ? "text-amber-600" : "text-amber-700/30"}`}>
                  {translateStatus(d.type, isHindi)}{d.status === "active" ? (isHindi ? " — वर्तमान" : " — Current") : ""}
                </p>
                <p className={`text-lg font-serif font-semibold ${d.status === "active" ? "text-amber-900" : "text-amber-800/50"}`}>
                  {translatePlanet(d.planet, isHindi)}
                </p>
              </div>
              <p className={`text-sm font-mono ${d.status === "active" ? "text-amber-700" : "text-amber-400"}`}>{d.period}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Transit View */}
      {activeView === "transit" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {transitList.map((t: any, i: number) => {
            const colorsMap: Record<string, { bg: string; txt: string }> = {
              indigo: { bg: "bg-indigo-50 border-indigo-100", txt: "text-indigo-700" },
              amber:  { bg: "bg-amber-50 border-amber-100", txt: "text-amber-700" },
              rose:   { bg: "bg-rose-50 border-rose-100", txt: "text-rose-700" },
              orange: { bg: "bg-orange-50 border-orange-100", txt: "text-orange-700" }
            };
            const themeColor = colorsMap[t.color] || colorsMap.indigo;
            return (
              <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm ${themeColor.bg}`}>
                <div className={`w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center text-xl font-serif font-bold shrink-0 ${themeColor.txt}`}>
                  {getPlanetAbbr(t.planet.substring(0, 2), isHindi)}
                </div>
                <div className="flex-1 font-serif">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-semibold text-amber-900">{translatePlanet(t.planet, isHindi)}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/70 ${themeColor.txt}`}>
                      {isHindi ? `भाव ${t.house}` : `House ${t.house}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700/40 mb-1">
                    {isHindi ? `${translateZodiac(t.sign, true)} राशि में` : `in ${t.sign}`}
                  </p>
                  <p className={`text-sm font-medium leading-relaxed ${themeColor.txt}`}>"{t.influence}"</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
