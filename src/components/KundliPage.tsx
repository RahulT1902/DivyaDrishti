"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Database, Navigation, Star } from "lucide-react";

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
  { houseNum: 1,  x: 120, y: 40,  width: 160, height: 100, signClass: "left-1/2 top-2 -translate-x-1/2" }, // Top Center Diamond
  { houseNum: 2,  x: 55,  y: 15,  width: 90,  height: 65,  signClass: "left-3 top-3" },                      // Top Left Triangle
  { houseNum: 3,  x: 15,  y: 55,  width: 65,  height: 90,  signClass: "left-3 top-3" },                      // Left Top Triangle
  { houseNum: 4,  x: 40,  y: 120, width: 100, height: 160, signClass: "left-3 top-1/2 -translate-y-1/2" },   // Left Center Diamond
  { houseNum: 5,  x: 15,  y: 255, width: 65,  height: 90,  signClass: "left-3 bottom-3" },                   // Left Bottom Triangle
  { houseNum: 6,  x: 55,  y: 320, width: 90,  height: 65,  signClass: "left-3 bottom-3" },                   // Bottom Left Triangle
  { houseNum: 7,  x: 120, y: 260, width: 160, height: 100, signClass: "left-1/2 bottom-2 -translate-x-1/2" },// Bottom Center Diamond
  { houseNum: 8,  x: 255, y: 320, width: 90,  height: 65,  signClass: "right-3 bottom-3" },                  // Bottom Right Triangle
  { houseNum: 9,  x: 320, y: 255, width: 65,  height: 90,  signClass: "right-3 bottom-3" },                  // Right Bottom Triangle
  { houseNum: 10, x: 260, y: 120, width: 100, height: 160, signClass: "right-3 top-1/2 -translate-y-1/2" },  // Right Center Diamond
  { houseNum: 11, x: 320, y: 55,  width: 65,  height: 90,  signClass: "right-3 top-3" },                     // Right Top Triangle
  { houseNum: 12, x: 255, y: 15,  width: 90,  height: 65,  signClass: "right-3 top-3" }                      // Top Right Triangle
];

export default function KundliPage({ chartData }: { chartData?: any }) {
  const [activeView, setActiveView] = useState<ActiveView>("lagna");

  const realChart = chartData?.chart;
  const realLagnaSignNum = realChart?.lagna?.sign || 10; // Default Capricorn
  const realLagnaSignName = getSignName(realLagnaSignNum);
  
  const realMD = chartData?.temporal?.stack?.mahadasha || "Saturn";
  const realAD = chartData?.temporal?.stack?.antardasha || "Jupiter";
  
  // Format Lagna display info:
  const moonPlanet = realChart?.planets?.find((p: any) => p.name === "Moon");
  const moonSignName = moonPlanet ? getSignName(moonPlanet.sign) : "Taurus";
  const lagnaInfoText = `${realLagnaSignName} Ascendant • ${realMD} Mahadasha • Moon in ${moonSignName}`;

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
    ? new Date(chartData.temporal.timing.endsAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Aug 2035";

  const dashaList = chartData?.temporal?.stack 
    ? [
        { planet: realAD, type: "Antardasha", period: chartData.temporal.timing.remaining + " remaining", status: "active" },
        { planet: chartData.temporal.stack.pratyantar || "Mercury", type: "Pratyantar", period: "Current sub-period", status: "next" },
      ]
    : [
        { planet: "Jupiter", type: "Antardasha", period: "Nov 2023 – Mar 2027", status: "active" },
        { planet: "Saturn",  type: "Antardasha", period: "Mar 2027 – Apr 2030", status: "next" },
        { planet: "Mercury", type: "Antardasha", period: "Apr 2030 – Jan 2033", status: "upcoming" },
      ];

  const transitList = chartData?.transitIntelligence?.signals?.length > 0
    ? chartData.transitIntelligence.signals.slice(0, 4).map((t: any, i: number) => {
        const colors = ["indigo", "amber", "rose", "orange"];
        const pSign = realChart?.planets?.find((p: any) => p.name === t.planet)?.sign || 1;
        const pHouse = realChart?.planets ? (((pSign - realLagnaSignNum + 12) % 12) + 1) : 1;
        
        return {
          planet: t.planet,
          sign: getSignName(pSign),
          house: pHouse,
          influence: t.reason || `${t.planet} transiting through your charts.`,
          color: colors[i % 4]
        };
      })
    : [
        { planet: "Saturn",  sign: "Aquarius",  house: 2,  influence: "Saturn Discipline Cycle — Career & Foundations", color: "indigo" },
        { planet: "Jupiter", sign: "Aries",     house: 4,  influence: "Jupiter Growth Phase — Learning & Home", color: "amber" },
      ];

  const tabs = [
    { id: "lagna",   label: "Birth Chart", icon: Sparkles },
    { id: "planets", label: "Planets",     icon: Star },
    { id: "dasha",   label: "Dasha",       icon: Database },
    { id: "transit", label: "Transit",     icon: Navigation },
  ];

  return (
    <div className="max-w-5xl mx-auto pt-4 space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-amber-900">Kundli — Birth Chart</h2>
        <p className="text-sm text-amber-700/50">{lagnaInfoText}</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveView(t.id as ActiveView)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeView === t.id ? "bg-amber-600 text-white shadow-sm" : "bg-white border border-[#F1E7D0] text-amber-700 hover:border-amber-300 hover:bg-amber-50"}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
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
              <p className="text-[10px] font-bold text-amber-600/50 uppercase tracking-widest mb-6 self-start">Lagna Chart (Traditional North Indian Diamond View)</p>
              
              <div className="w-full max-w-[420px] relative aspect-square bg-[#FAF7F0] border-2 border-[#EADFC7] rounded-3xl p-4 shadow-inner">
                <svg viewBox="0 0 400 400" className="w-full h-full text-amber-900 drop-shadow-sm select-none">
                  
                  {/* Background fills for Kendra (pillar) houses vs. outer triangles */}
                  {/* Kendra Diamonds highlighted extremely softly */}
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

                          {/* Planets inside this house with Saffron Personality Badges */}
                          {planetsInHouse.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center items-center max-w-[90%] mt-2 z-10">
                              {planetsInHouse.map((p, idx) => (
                                <span
                                  key={idx}
                                  title={`${p.name} (${p.degree} - ${p.status || 'Active'})`}
                                  className={`text-[9.5px] font-bold font-mono px-1.5 py-0.5 rounded shadow-sm transition-transform hover:scale-110 cursor-help flex items-center gap-0.5 ${
                                    p.abbr === "La" 
                                      ? "bg-amber-700 text-white border border-amber-800" 
                                      : "bg-[#FFF9EE] border border-[#F5DCA8] text-[#3F2D1D] hover:border-amber-500"
                                  }`}
                                >
                                  {p.abbr}{getPlanetSymbol(p.abbr)}
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
                <h4 className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-2.5">✦ Why This Matters</h4>
                <p className="text-[13px] text-amber-950 font-serif leading-relaxed italic">
                  Your {realLagnaSignName} ascendant and active {realMD} Mahadasha are currently amplifying ambition, experimentation, and mental restlessness. This period favors strategic reinvention but requires emotional grounding and disciplined decision-making.
                </p>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              <div>
                <h4 className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-3.5">✦ Astrological DNA</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">Lagna Lord</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {(LAGNA_LORDS[realLagnaSignName] || { name: "Saturn", symbol: "♄" }).name} <span className="font-mono text-amber-600">{(LAGNA_LORDS[realLagnaSignName] || { name: "Saturn", symbol: "♄" }).symbol}</span>
                    </p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">Nakshatra</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {moonPlanet?.nakshatra || "Mula"}
                    </p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">Moon Sign</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {moonSignName} <span className="font-mono text-amber-600">☾</span>
                    </p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F1E7D0] p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-700/40 uppercase tracking-wider mb-0.5">Current Dasha</p>
                    <p className="text-xs font-serif font-bold text-amber-950">
                      {realMD} <span className="text-[9px] font-sans text-amber-600">MD</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              <div>
                <h4 className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-2.5">✦ Supportive Influences</h4>
                <div className="flex flex-wrap gap-1.5">
                  {displayPlanets.filter((p: any) => ["Dominant", "Strong", "Exalted", "Vargottama"].includes(p.status) && p.abbr !== "La").length > 0 ? (
                    displayPlanets.filter((p: any) => ["Dominant", "Strong", "Exalted", "Vargottama"].includes(p.status) && p.abbr !== "La").map((p, idx) => (
                      <span key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                        <span>{getPlanetSymbol(p.abbr)}</span>
                        <strong>{p.name}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-800/40 italic">Calm environmental integration</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-2.5">✦ Sensitive Areas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {displayPlanets.filter((p: any) => ["Combust", "Retrograde", "Debilitated"].includes(p.status) || ["Rahu", "Ketu"].includes(p.name)).length > 0 ? (
                    displayPlanets.filter((p: any) => ["Combust", "Retrograde", "Debilitated"].includes(p.status) || ["Rahu", "Ketu"].includes(p.name)).map((p, idx) => (
                      <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                        <span>{getPlanetSymbol(p.abbr)}</span>
                        <strong>{p.name}</strong>
                        {p.status && <span className="text-[8px] text-rose-500/70">({p.status})</span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-800/40 italic">No high-stress indicators active</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Current Planetary Influences Section */}
          <div className="bg-[#FAF8F5] border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-4">Current Planetary Influences</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="font-mono text-amber-600">☊</span> Rahu in Pisces (10th House)
                </p>
                <p className="text-xs text-amber-800/60 leading-relaxed">
                  Amplifies career ambition, business experimentation, and desire for growth, but invites occasional uncertainty.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="font-mono text-amber-600">♄</span> Saturn in Aquarius (2nd House)
                </p>
                <p className="text-xs text-amber-800/60 leading-relaxed">
                  Demands absolute financial discipline, long-term foundation building, and responsible communication.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-serif font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="font-mono text-amber-600">♃</span> Jupiter in Aries (4th House)
                </p>
                <p className="text-xs text-amber-800/60 leading-relaxed">
                  Supports internal stability, growth of home environments, learning, and strong maternal relationships.
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-amber-700/50 uppercase tracking-widest mb-3">Chart Legend</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["Vargottama", "Planetary strength matches Navamsa"], ["Retrograde", "Apparent backward movement"], ["Combust", "Close proximity to the Sun"], ["Ascendant (La)", "Lagna point at time of birth"]].map(([sym, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-amber-800/60">
                  <span className="font-mono font-bold text-amber-600">{sym}</span> {label}
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
                  {["Planet", "Sign", "House", "Strength", "Degree"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-amber-700/50 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E7D0]">
                {displayPlanets.map((p, i) => (
                  <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold font-mono flex items-center justify-center">{p.abbr}</span>
                        <span className="font-medium text-amber-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-amber-800/70">{p.sign}</td>
                    <td className="px-5 py-4 text-amber-800/70">House {p.house}</td>
                    <td className="px-5 py-4">
                      {p.status ? (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status === "Vargottama" || p.status === "Ascendant" ? "bg-emerald-100 text-emerald-700" : p.status === "Retrograde" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
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
            <p className="text-[10px] font-bold text-amber-600/50 uppercase tracking-widest mb-4">Active Mahadasha</p>
            <h2 className="text-5xl font-serif font-light text-amber-900 mb-1">{realMD}</h2>
            <p className="text-sm text-amber-700/50 mb-6">Active until {dashaEndsAt}</p>
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden mb-2">
              <div className="h-full w-[65%] bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" />
            </div>
            <p className="text-xs text-amber-600/40 mb-6">Active Phase</p>

            {/* Elegant Nested Dasha Progression Timeline Mini-Bar */}
            <div className="mt-8 pt-6 border-t border-[#F1E7D0] text-left">
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600/70 mb-4">✦ Chapter Progression Timeline</p>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 ring-4 ring-amber-100 flex items-center justify-center shrink-0" />
                  <div className="flex-1 flex justify-between items-center bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2 shadow-sm">
                    <span className="font-serif font-bold text-amber-950">{realMD} Mahadasha</span>
                    <span className="text-[10px] text-amber-600 font-mono font-medium">Underway</span>
                  </div>
                </div>
                <div className="pl-[5px] border-l border-dashed border-amber-300 space-y-3 ml-[4px]">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <div className="flex-1 flex justify-between items-center bg-white border border-[#F1E7D0] rounded-xl px-3 py-1.5 shadow-sm">
                      <span className="font-medium text-amber-900">├── {realAD} Antardasha (Current Focus)</span>
                      <span className="text-[9px] text-amber-500 font-mono">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                    <div className="flex-1 flex justify-between items-center bg-white border border-[#F1E7D0] rounded-xl px-3 py-1.5">
                      <span className="text-amber-800">├── Saturn Antardasha (Next Phase)</span>
                      <span className="text-[9px] text-amber-400 font-mono">Starts Mar 2027</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-200 shrink-0" />
                    <div className="flex-1 flex justify-between items-center bg-white border border-[#F1E7D0] rounded-xl px-3 py-1.5">
                      <span className="text-amber-800">└── Mercury Antardasha (Future Chapter)</span>
                      <span className="text-[9px] text-amber-400 font-mono">Starts Apr 2030</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {dashaList.map((d, i) => (
            <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border shadow-sm ${d.status === "active" ? "bg-amber-50 border-amber-200" : "bg-white border-[#F1E7D0]"}`}>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${d.status === "active" ? "text-amber-600" : "text-amber-700/30"}`}>{d.type}{d.status === "active" ? " — Current" : ""}</p>
                <p className={`text-lg font-serif font-semibold ${d.status === "active" ? "text-amber-900" : "text-amber-800/50"}`}>{d.planet}</p>
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
                  {t.planet.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-serif font-semibold text-amber-900">{t.planet}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/70 ${themeColor.txt}`}>House {t.house}</span>
                  </div>
                  <p className="text-[10px] text-amber-700/40 mb-1">in {t.sign}</p>
                  <p className={`text-sm font-medium ${themeColor.txt}`}>{t.influence}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
