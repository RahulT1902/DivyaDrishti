import React from "react";
import { motion } from "framer-motion";

interface TransitEffect {
  planet: string;
  status: string;
  influence: string;
  color: "amber" | "indigo" | "emerald" | "rose";
}

const mockTransitEffects: TransitEffect[] = [
  {
    planet: "Saturn",
    status: "Currently influencing",
    influence: "Saturn Discipline Cycle — Career & Structure",
    color: "indigo"
  },
  {
    planet: "Jupiter",
    status: "Supporting",
    influence: "Jupiter Growth Phase — Learning & Expansion",
    color: "amber"
  },
  {
    planet: "Moon",
    status: "Elevated",
    influence: "Rohini Nakshatra — Emotional Sensitivity",
    color: "rose"
  }
];

const cardMap = {
  indigo: "bg-indigo-50 border-indigo-100",
  amber:  "bg-amber-50 border-amber-100",
  emerald:"bg-emerald-50 border-emerald-100",
  rose:   "bg-rose-50 border-rose-100",
};

const textMap = {
  indigo: "text-indigo-700",
  amber:  "text-amber-700",
  emerald:"text-emerald-700",
  rose:   "text-rose-700",
};

const dotMap = {
  indigo: "bg-indigo-400",
  amber:  "bg-amber-500",
  emerald:"bg-emerald-400",
  rose:   "bg-rose-400",
};

const letterMap = {
  indigo: "text-indigo-600 bg-indigo-100",
  amber:  "text-amber-700 bg-amber-100",
  emerald:"text-emerald-700 bg-emerald-100",
  rose:   "text-rose-600 bg-rose-100",
};

export default function PlanetarySnapshot({ chartData }: { chartData?: any }) {
  // If chartData has transit signals, map them
  const liveTransits = chartData?.transitIntelligence?.transits || [];
  
  const displayTransits: TransitEffect[] = liveTransits.length > 0 
    ? liveTransits.slice(0, 6).map((t: any) => {
        const isSupportive = t.nature?.toLowerCase().includes("supportive") || t.nature?.toLowerCase().includes("benefic") || t.nature?.toLowerCase().includes("expansion");
        const isChallenging = t.nature?.toLowerCase().includes("sensitive") || t.nature?.toLowerCase().includes("friction") || t.nature?.toLowerCase().includes("pressure") || t.nature?.toLowerCase().includes("volatile") || t.nature?.toLowerCase().includes("challenging");
        
        return {
          planet: t.planet,
          status: isSupportive ? "Supporting" : isChallenging ? "Challenging" : "Active Cycle",
          influence: t.whyItMatters?.[0] || `${t.planet} transiting your ${t.houseFromLagna} house.`,
          color: isSupportive ? "amber" : isChallenging ? "rose" : "indigo"
        };
      })
    : mockTransitEffects;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-serif font-semibold text-amber-900">Planetary Snapshot</h3>
        <p className="text-xs text-amber-700">Current transit effects on your chart</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayTransits.map((t, idx) => (
          <motion.div
            key={`${t.planet}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-5 rounded-2xl border ${cardMap[t.color] || cardMap.indigo}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-serif ${letterMap[t.color] || letterMap.indigo}`}>
                {t.planet.charAt(0)}
              </div>
              <h4 className="text-base font-serif font-semibold text-amber-900">{t.planet}</h4>
              <div className={`w-1.5 h-1.5 rounded-full ml-auto ${dotMap[t.color] || dotMap.indigo}`} />
            </div>

            <p className="text-[10px] uppercase tracking-widest text-amber-700/40 mb-1">{t.status}</p>
            <p className={`text-sm font-medium leading-snug ${textMap[t.color] || textMap.indigo}`}>{t.influence}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
