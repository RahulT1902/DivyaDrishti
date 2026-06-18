"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Wind, CheckCircle2 } from "lucide-react";

type Energy = "HIGH" | "NEUTRAL" | "LOW" | null;
type Stress = "LOW" | "MEDIUM" | "HIGH" | null;

export default function ReflectionLogger() {
  const [hasLogged, setHasLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [energy, setEnergy] = useState<Energy>(null);
  const [stress, setStress] = useState<Stress>(null);
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if the user has already logged today
    const checkStatus = async () => {
      try {
        const email = localStorage.getItem("divya:userEmail");
        if (!email) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/reflections?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        
        if (data.success && data.hasLoggedToday) {
          setHasLogged(true);
        }
      } catch (err) {
        console.error("Failed to check reflection status", err);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleSubmit = async () => {
    if (!energy || !stress) return;
    
    setIsSubmitting(true);
    try {
      const email = localStorage.getItem("divya:userEmail");
      if (!email) throw new Error("No user email found");

      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          energy,
          stress,
          notes: notes.trim(),
          source: "MANUAL"
        })
      });

      const data = await res.json();
      if (data.success || data.alreadyLogged) {
        setHasLogged(true);
      }
    } catch (err) {
      console.error("Failed to submit reflection", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 min-h-[300px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 relative overflow-hidden bg-white/80">
      {/* Soft Background Accent */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-100/50 rounded-full blur-[60px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {hasLogged ? (
          <motion.div
            key="logged"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm mb-2">
              <span className="text-3xl">🪔</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-amber-900">Reflection Logged</h3>
            <p className="text-sm text-amber-800 max-w-[240px] leading-relaxed">
              Today's emotional state has been securely mapped to your current planetary cycle.
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-500/50 pt-4">
              Thank you for checking in
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 relative z-10"
          >
            <header className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                How are you feeling today?
              </h3>
              <p className="text-xs text-amber-700">Take a moment to anchor your current state.</p>
            </header>

            {/* Energy Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-amber-900/40">Energy</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEnergy("HIGH")}
                  className={`py-3 px-2 rounded-xl border text-sm transition-all flex flex-col items-center gap-1 ${
                    energy === "HIGH" 
                      ? "bg-amber-50 border-amber-300 shadow-inner" 
                      : "bg-white border-[#F1E7D0] hover:bg-amber-50/50"
                  }`}
                >
                  <span className="text-xl">🙂</span>
                  <span className={`text-[10px] font-bold ${energy === "HIGH" ? "text-amber-800" : "text-amber-900/50"}`}>Energized</span>
                </button>
                <button
                  onClick={() => setEnergy("NEUTRAL")}
                  className={`py-3 px-2 rounded-xl border text-sm transition-all flex flex-col items-center gap-1 ${
                    energy === "NEUTRAL" 
                      ? "bg-amber-50 border-amber-300 shadow-inner" 
                      : "bg-white border-[#F1E7D0] hover:bg-amber-50/50"
                  }`}
                >
                  <span className="text-xl">😐</span>
                  <span className={`text-[10px] font-bold ${energy === "NEUTRAL" ? "text-amber-800" : "text-amber-900/50"}`}>Balanced</span>
                </button>
                <button
                  onClick={() => setEnergy("LOW")}
                  className={`py-3 px-2 rounded-xl border text-sm transition-all flex flex-col items-center gap-1 ${
                    energy === "LOW" 
                      ? "bg-amber-50 border-amber-300 shadow-inner" 
                      : "bg-white border-[#F1E7D0] hover:bg-amber-50/50"
                  }`}
                >
                  <span className="text-xl">😞</span>
                  <span className={`text-[10px] font-bold ${energy === "LOW" ? "text-amber-800" : "text-amber-900/50"}`}>Drained</span>
                </button>
              </div>
            </div>

            {/* Stress Selection */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest font-black text-amber-900/40">Stress</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setStress("LOW")}
                  className={`py-2.5 px-4 rounded-xl border text-xs text-left transition-all ${
                    stress === "LOW" ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold" : "bg-white border-[#F1E7D0] text-amber-900/60 hover:bg-emerald-50/30"
                  }`}
                >
                  Calm
                </button>
                <button
                  onClick={() => setStress("MEDIUM")}
                  className={`py-2.5 px-4 rounded-xl border text-xs text-left transition-all ${
                    stress === "MEDIUM" ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold" : "bg-white border-[#F1E7D0] text-amber-900/60 hover:bg-amber-50/50"
                  }`}
                >
                  Pressured
                </button>
                <button
                  onClick={() => setStress("HIGH")}
                  className={`py-2.5 px-4 rounded-xl border text-xs text-left transition-all ${
                    stress === "HIGH" ? "bg-rose-50 border-rose-200 text-rose-800 font-semibold" : "bg-white border-[#F1E7D0] text-amber-900/60 hover:bg-rose-50/30"
                  }`}
                >
                  Overwhelmed
                </button>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase tracking-widest font-black text-amber-900/40">What affected you most? (Optional)</label>
                <span className={`text-[9px] font-bold ${notes.length >= 300 ? "text-rose-500" : "text-amber-900/30"}`}>
                  {notes.length}/300
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.substring(0, 300))}
                placeholder="A brief note on today's dominant theme..."
                className="w-full bg-[#FFFDF8] border border-[#F1E7D0] rounded-xl p-3 text-sm text-amber-900 placeholder:text-amber-900/20 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none h-20 transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!energy || !stress || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Anchor State</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
