"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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
}

const DEFAULT_TRANSITS: TransitEffect[] = [
  { planet: "Saturn", symbol: "♄", sign: "Aquarius", house: 2, motion: "Direct", status: "Sensitive Cycle", influence: "Saturn demands deep financial consolidation and structured, truthful communication. Focus on building long-term assets rather than speculative moves.", color: "indigo", nature: "sensitive" },
  { planet: "Jupiter", symbol: "♃", sign: "Aries", house: 4, motion: "Direct", status: "Supportive Cycle", influence: "Jupiter expands your internal stability, family happiness, and desire for deep wisdom. An excellent phase for learning, meditation, and acquiring core stability.", color: "amber", nature: "supportive" },
  { planet: "Rahu", symbol: "☊", sign: "Pisces", house: 10, motion: "Retrograde", status: "Sensitive Cycle", influence: "Rahu transiting the house of karma triggers a powerful ambition to reinvent your professional path, but requires caution against impulsiveness and illusion.", color: "rose", nature: "sensitive" },
  { planet: "Moon", symbol: "☾", sign: "Sagittarius", house: 7, motion: "Direct", status: "Supportive Cycle", influence: "The Moon's transits bring focus onto partnerships, emotional sensitivity, and collaborative harmony. Be soft in primary relationships.", color: "emerald", nature: "supportive" },
  { planet: "Sun", symbol: "☉", sign: "Leo", house: 3, motion: "Direct", status: "Supportive Cycle", influence: "The Sun in the 3rd house ignites courageous action, enhanced willpower, and positive relations with peers. Express your ideas clearly.", color: "amber", nature: "supportive" },
];

const CARD_STYLES = { indigo: "bg-[#F3F6FC] border-[#DCE4F5]", amber: "bg-[#FCF9F3] border-[#F2E7D0]", emerald: "bg-[#F4FAF6] border-[#D4EFE0]", rose: "bg-[#FCF3F4] border-[#F5DCDE]" };
const BADGE_STYLES = { indigo: "bg-indigo-100/70 border-indigo-200 text-indigo-800", amber: "bg-amber-100/70 border-amber-200 text-amber-800", emerald: "bg-emerald-100/70 border-emerald-200 text-emerald-800", rose: "bg-rose-100/70 border-rose-200 text-rose-800" };
const PLANET_SYMBOLS: Record<string, string> = { Sun: "☉", Moon: "☾", Mars: "♂", Mercury: "☿", Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋" };

const STRENGTH_STYLES = {
  supportive: { card: "bg-emerald-50/60 border-emerald-200", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Supportive", labelHindi: "अनुकूल" },
  sensitive:  { card: "bg-rose-50/60 border-rose-200",     badge: "bg-rose-100 text-rose-800 border-rose-200",       dot: "bg-rose-500",   label: "Sensitive",   labelHindi: "संवेदनशील" },
  neutral:    { card: "bg-white border-[#F1E7D0]",         badge: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-400",  label: "Stable",      labelHindi: "स्थिर" },
};

type FilterType = "all" | "supportive" | "sensitive";
type LangMode = "PANDIT" | "SIMPLE_ENGLISH";

export default function TransitsPage({ chartData }: { chartData?: any }) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [lang, setLang] = useState<LangMode>("PANDIT");
  const [domains, setDomains] = useState<LifeDomainCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const rawSignals = chartData?.transitIntelligence?.signals || [];
  const displayTransits: TransitEffect[] = rawSignals.length > 0
    ? rawSignals.map((t: any) => {
        const isSupportive = t.nature?.toLowerCase() === "supportive";
        const isChallenging = t.nature?.toLowerCase() === "challenging";
        return { planet: t.planet, symbol: PLANET_SYMBOLS[t.planet] || "✦", sign: t.sign || "Active Sign", house: t.house || 1, motion: t.retrograde ? "Retrograde" : "Direct", status: isSupportive ? "Supportive Cycle" : isChallenging ? "Sensitive Cycle" : "Active cycle", influence: t.reason || `${t.planet} transiting house ${t.house}.`, color: isSupportive ? "amber" : isChallenging ? "rose" : "indigo", nature: isSupportive ? "supportive" : "sensitive" };
      })
    : DEFAULT_TRANSITS;

  const filteredTransits = displayTransits.filter(t => filter === "all" || t.nature === filter);

  const fetchDomains = async (mode: LangMode) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/predictions/analyze?timeframe=this-month&domain=growth&mode=${mode}`);
      const data = await res.json();
      if (data.success && data.predictions?.lifeDomainPredictions) {
        setDomains(data.predictions.lifeDomainPredictions);
        setLoaded(true);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleCard = (id: string) => setExpandedCards(p => ({ ...p, [id]: !p[id] }));
  const isPandit = lang === "PANDIT";

  return (
    <div className="max-w-7xl mx-auto pt-4 space-y-12 pb-20">

      {/* ── Header + Filter ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-amber-900">Current Transit Analysis</h2>
          <p className="text-sm text-amber-700/60">Live planetary positions and their direct influence on your life</p>
        </div>
        <div className="bg-[#FFFDF8] border border-[#F1E7D0] p-1 rounded-xl flex items-center gap-1 self-start shadow-sm">
          {(["all", "supportive", "sensitive"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === t ? "bg-amber-100 text-amber-900 border border-amber-200/50 shadow-inner" : "text-amber-800/50 hover:text-amber-800"}`}>
              {t === "all" ? "All Cycles" : t === "supportive" ? "Supportive" : "Sensitive"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Split Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-5">
          {filteredTransits.length > 0 ? filteredTransits.map((t, idx) => (
            <motion.div key={`${t.planet}-${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className={`p-6 rounded-2xl border relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ${CARD_STYLES[t.color] || CARD_STYLES.indigo}`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#F1E7D0] flex items-center justify-center text-lg font-bold font-serif shadow-sm text-amber-900">{t.symbol}</div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-[#3F2D1D]">{t.planet}</h4>
                    <p className="text-[10px] text-amber-700/50 uppercase tracking-widest font-mono">House {t.house} ✦ {t.sign} ✦ {t.motion}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${BADGE_STYLES[t.color] || BADGE_STYLES.indigo}`}>{t.status}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-[#3F2D1D] font-serif pl-12 border-l-2 border-amber-600/20 italic">"{t.influence}"</p>
            </motion.div>
          )) : (
            <div className="bg-white border border-[#F1E7D0] rounded-2xl p-12 text-center text-amber-700/50 italic shadow-sm">No active transits match this filter.</div>
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
            <h4 className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-2.5">✦ Pundit Transit Guidance</h4>
            <p className="text-[13px] text-amber-950 font-serif leading-relaxed italic">"The current transiting planets are activating highly focal sectors of your chart. With Rahu retrograding through Pisces in your 10th house, expect temporary career turbulence but high vocational drive. Remain anchored, avoid sudden reactive pivots, and rely on Saturn's disciplined structures."</p>
          </div>
          <div className="h-px bg-[#F1E7D0]" />
          <div>
            <h4 className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-3">✦ Slow-Moving Transit Status</h4>
            {[{ sym: "♄", name: "Saturn", pos: "Aquarius (2nd House)", dir: "Direct", col: "text-indigo-700" }, { sym: "♃", name: "Jupiter", pos: "Aries (4th House)", dir: "Direct", col: "text-emerald-700" }, { sym: "☊", name: "Rahu", pos: "Pisces (10th House)", dir: "Retrograde", col: "text-rose-600" }].map(p => (
              <div key={p.name} className="flex justify-between items-center bg-[#FFFDF9] border border-[#F1E7D0] px-4 py-2.5 rounded-xl text-xs mb-2">
                <span className="font-serif font-bold text-amber-950 flex items-center gap-1.5"><span className="text-amber-600">{p.sym}</span> {p.name}</span>
                <span className="text-amber-700/60">{p.pos}</span>
                <span className={`font-semibold ${p.col}`}>{p.dir}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-[#F1E7D0]" />
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-widest mb-1.5">✦ Supportive Actions</h4>
              <ul className="text-xs text-emerald-800/80 space-y-1 list-disc pl-4 font-serif">
                <li>Meditate daily to align with Jupiter's 4th house expansion.</li>
                <li>Express ideas with structure to channel Saturn's 2nd house rule.</li>
                <li>Conduct deep research before committing to new partners.</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-rose-700/80 uppercase tracking-widest mb-1.5">✦ Mindful Releases</h4>
              <ul className="text-xs text-rose-800/80 space-y-1 list-disc pl-4 font-serif">
                <li>Avoid sudden, volatile financial or asset investments.</li>
                <li>Avoid unnecessary verbal arguments or defensive communication.</li>
                <li>Refuse reactive vocational impulses driven by Rahu's illusions.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TRANSIT BASED PREDICTIONS — 12 Life Domains
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-[#F1E7D0] pt-8">
          <div>
            <p className="text-[10px] font-bold text-amber-600/50 uppercase tracking-widest mb-1">✦ Deep Vedic Intelligence</p>
            <h3 className="text-xl font-serif font-semibold text-amber-900">Transit Based Predictions</h3>
            <p className="text-sm text-amber-700/50 mt-1">How active planetary transits influence each major life domain — read by your Dasha stack</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            {/* Language Toggle */}
            {loaded && (
              <div className="inline-flex rounded-lg bg-amber-100/50 p-0.5 border border-[#E6DBC3]">
                {(["PANDIT", "SIMPLE_ENGLISH"] as const).map(m => (
                  <button key={m} disabled={loading}
                    onClick={() => { setLang(m); fetchDomains(m); }}
                    className={`px-3 py-1 text-xs font-serif font-medium rounded-md transition-all ${lang === m ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 hover:text-amber-900"} disabled:opacity-50`}>
                    {m === "PANDIT" ? "Hindi / English" : "Pure English"}
                  </button>
                ))}
              </div>
            )}

            {/* Load Button */}
            {!loaded && (
              <button
                onClick={() => fetchDomains(lang)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#FCFAF2] border-2 border-amber-300 text-amber-900 text-sm font-serif font-semibold hover:bg-amber-50 hover:border-amber-400 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "🪔"}
                {loading ? "Consulting the stars..." : "Load Transit Predictions"}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-amber-700/50 uppercase tracking-widest font-serif italic">The Pundit is reading your transits across all life domains...</p>
          </div>
        )}

        {/* Domain Cards Grid */}
        {!loading && loaded && domains.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {domains.map((domain, idx) => {
              const styles = STRENGTH_STYLES[domain.strength];
              const isExpanded = expandedCards[domain.id] ?? false;
              return (
                <motion.div key={domain.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${styles.card}`}>

                  {/* Header — always visible */}
                  <button onClick={() => toggleCard(domain.id)} className="w-full text-left p-5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">{domain.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h5 className="text-[14px] font-serif font-bold text-[#3F2D1D]">{isPandit ? domain.titleHindi : domain.title}</h5>
                          {!isPandit && <span className="text-[10px] text-amber-700/50 font-serif">{domain.titleHindi}</span>}
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles.badge}`}>{isPandit ? styles.labelHindi : styles.label}</span>
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

                        {/* Pundit Oral Narrative — main reading */}
                        <div className="bg-[#FAF4E5] border border-[#DFD3BA] rounded-2xl p-5 relative overflow-hidden ml-11">
                          <div className="absolute right-3 bottom-3 text-5xl text-amber-700/5 select-none font-serif font-bold">ॐ</div>
                          <p className="text-[9px] font-bold text-amber-600/60 uppercase tracking-widest mb-3">
                            {isPandit ? "💬 पंडित जी का मार्गदर्शन" : "💬 Pundit's Reading"}
                          </p>
                          <p className="text-[13px] text-amber-950 font-serif leading-relaxed">
                            {domain.narrative}
                          </p>
                        </div>

                        {/* Transit Signal Bullets */}
                        {domain.activatedPatterns.length > 0 && (
                          <div className="ml-11 space-y-2">
                            <p className="text-[9px] font-bold text-amber-600/50 uppercase tracking-widest mb-2">✦ {isPandit ? "सक्रिय गोचर संकेत" : "Active Transit Signals"}</p>
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
                          <div className="ml-11 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                            <Zap className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-rose-800 font-serif leading-relaxed">
                              <span className="font-bold">{isPandit ? "⚠️ सावधानी: " : "⚠️ Caution: "}</span>{domain.caution}
                            </p>
                          </div>
                        )}

                        {/* Primary Planet Badge */}
                        <div className="ml-11 flex items-center gap-2">
                          <Shield className="w-3 h-3 text-amber-500" />
                          <p className="text-[10px] text-amber-700/60 uppercase tracking-widest font-mono">
                            {isPandit ? "मुख्य ग्रह" : "Primary Governing Planet"}: <strong className="text-amber-800">{domain.primaryPlanet}</strong>
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
            <p className="text-sm font-serif text-amber-800/60 italic">Click "Load Transit Predictions" above to receive the Pundit's deep reading across all 12 life domains.</p>
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
