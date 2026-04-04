"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, ShieldAlert, Compass } from "lucide-react";

interface PlanetMeaning {
  name: string;
  sign: string;
  house: number;
  strength: string;
  role: string;
  representing: string;
  meaning: string;
  challenge: string;
  guidance: string;
}

interface PlanetMeaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  planet: PlanetMeaning | null;
}

export const PlanetMeaningModal: React.FC<PlanetMeaningModalProps> = ({ isOpen, onClose, planet }) => {
  if (!planet) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop: Minimal Blur & High Performance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
          />

          {/* Side Panel: Prabhat Light Institutional Style */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white border-l border-black/[0.05] shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] overflow-y-auto no-scrollbar"
          >
            {/* Header: Fixed & Soulsul */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl p-8 border-b border-black/[0.03] flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-amber-600 font-black mb-1">Planetary Guidance</p>
                <h2 className="text-2xl font-light text-black tracking-tight leading-none">
                  {planet.name} <span className="text-black/20 mx-1">in</span> {planet.sign}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-black/2 flex items-center justify-center text-black/20 hover:text-black/60 transition-colors border border-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: High Contrast & Soulful Depth */}
            <div className="p-8 space-y-12">
              {/* Snapshot Stats: Clean Grids */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-black/[0.01] border border-black/[0.03]">
                  <p className="text-[9px] uppercase tracking-widest text-black/30 mb-2 font-black">Strength</p>
                  <p className={`text-xs font-black tracking-widest uppercase ${
                    planet.strength === 'Dominant' ? 'text-emerald-600' : 
                    planet.strength === 'Supportive' ? 'text-amber-600' :
                    'text-black/40'
                  }`}>{planet.strength}</p>
                </div>
                <div className="p-5 rounded-2xl bg-black/[0.01] border border-black/[0.03]">
                  <p className="text-[9px] uppercase tracking-widest text-black/30 mb-2 font-black">Archetype Role</p>
                  <p className="text-xs font-black text-black/60 tracking-widest uppercase">{planet.role}</p>
                </div>
              </div>

              {/* Sections: Spiritual Narrative */}
              <div className="space-y-12 pb-10">
                <section className="space-y-5">
                  <div className="flex items-center gap-3 text-amber-600/40">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black">Representation</h3>
                  </div>
                  <p className="text-xl text-black font-medium leading-tight italic tracking-tight">
                    “{planet.representing}”
                  </p>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-3 text-black/20">
                    <Compass className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black">Core Meaning</h3>
                  </div>
                  <p className="text-base text-black/60 leading-relaxed font-medium">
                    {planet.meaning}
                  </p>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-3 text-rose-500/30">
                    <ShieldAlert className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-rose-700/60">The Shadow</h3>
                  </div>
                  <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                    <p className="text-[13px] text-rose-800 leading-relaxed italic font-medium">
                      {planet.challenge}
                    </p>
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="flex items-center gap-3 text-emerald-600/30">
                    <Zap className="w-4 h-4" />
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-emerald-700/60">Action Guidance</h3>
                  </div>
                  <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 shadow-xl shadow-amber-500/5">
                    <p className="text-base text-amber-900 font-bold leading-relaxed">
                      {planet.guidance}
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 paper-texture opacity-10 pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
