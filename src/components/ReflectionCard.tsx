"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, Save, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { authFetch } from "@/lib/auth/webFetch";

interface Props {
  userEmail: string;
  themeMode?: "morning" | "evening";
}

type EnergyLevel = "HIGH" | "NEUTRAL" | "LOW";
type StressLevel = "LOW" | "MEDIUM" | "HIGH";

interface Reflection {
  id: string;
  energy: EnergyLevel;
  stress: StressLevel;
  notes: string | null;
  createdAt: string;
}

export default function ReflectionCard({ userEmail, themeMode }: Props) {
  const { isHindi } = useLanguage();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const isMorning = themeMode === "morning";
  const isEvening = themeMode === "evening";
  const isDark = false;
  
  // Form State
  const [energy, setEnergy] = useState<EnergyLevel>("NEUTRAL");
  const [stress, setStress] = useState<StressLevel>("LOW");
  const [notes, setNotes] = useState("");
  
  // UI Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");

  const energyMap: Record<EnergyLevel, string> = {
    HIGH: isHindi ? "उच्च" : "HIGH",
    NEUTRAL: isHindi ? "सामान्य" : "NEUTRAL",
    LOW: isHindi ? "निम्न" : "LOW",
  };

  const stressMap: Record<StressLevel, string> = {
    LOW: isHindi ? "निम्न" : "LOW",
    MEDIUM: isHindi ? "मध्यम" : "MEDIUM",
    HIGH: isHindi ? "उच्च" : "HIGH",
  };

  // Fetch today's reflection on mount
  const fetchReflection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch("/api/reflections");
      const data = await res.json();
      
      if (data.success && data.reflection) {
        setReflection(data.reflection);
        setEnergy(data.reflection.energy);
        setStress(data.reflection.stress);
        setNotes(data.reflection.notes || "");
      } else {
        setReflection(null);
      }
    } catch (err: any) {
      console.error("Error fetching daily reflection:", err);
      setError(isHindi ? "आज के मनन की स्थिति लोड करने में असमर्थ।" : "Unable to load today's reflection state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchReflection();
    }
  }, [userEmail]);

  // Determine if reflection is editable (created less than 1 hour ago)
  const isEditable = (): boolean => {
    if (!reflection) return true; // Not logged yet
    const createdTime = new Date(reflection.createdAt).getTime();
    const oneHour = 60 * 60 * 1000;
    return Date.now() - createdTime < oneHour;
  };

  // Timer to update remaining editing window countdown
  useEffect(() => {
    if (!reflection) {
      setTimeLeftStr("");
      return;
    }

    const updateTimer = () => {
      const createdTime = new Date(reflection.createdAt).getTime();
      const oneHour = 60 * 60 * 1000;
      const msLeft = createdTime + oneHour - Date.now();

      if (msLeft <= 0) {
        setTimeLeftStr("");
      } else {
        const minsLeft = Math.floor(msLeft / 60000);
        const secsLeft = Math.floor((msLeft % 60000) / 1000);
        const minsUnit = isHindi ? "मि" : "m";
        const secsUnit = isHindi ? "से" : "s";
        setTimeLeftStr(`${minsLeft}${minsUnit} ${secsLeft}${secsUnit}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [reflection, isHindi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          energy,
          stress,
          notes,
          source: "MANUAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isHindi ? "मनन सहेजने में विफल।" : "Failed to log reflection."));
      }

      setReflection(data.reflection);
      setSuccessMsg(
        data.updated
          ? isHindi ? "मनन सफलतापूर्वक अपडेट किया गया।" : "Reflection updated successfully."
          : isHindi ? "मनन सफलतापूर्वक सहेज लिया गया।" : "Reflection logged successfully."
      );
      
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error("Submit reflection error:", err);
      setError(err.message || (isHindi ? "मनन सहेजने में विफल।" : "Failed to submit reflection."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 rounded-[2rem] shadow-sm flex items-center justify-center min-h-[200px] border ${
        isDark ? "bg-white/5 border-white/10" : "bg-white border-[#F1E7D0]"
      }`}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className={`w-6 h-6 animate-spin ${isDark ? "text-amber-400" : "text-amber-700"}`} />
          <span className={`text-xs uppercase tracking-widest font-serif ${isDark ? "text-slate-300" : "text-amber-800/60"}`}>
            {isHindi ? "संरेखण स्थान को ट्यून किया जा रहा है..." : "Tuning alignment space..."}
          </span>
        </div>
      </div>
    );
  }

  const editable = isEditable();

  return (
    <div className={`p-8 rounded-[2rem] shadow-sm space-y-6 border transition-all duration-1000 relative overflow-hidden ${
      isDark 
        ? isMorning
          ? "bg-gradient-to-br from-[#2D1625]/60 to-[#140C12]/95 border-[#522546]/30 text-slate-100 backdrop-blur-md"
          : "bg-gradient-to-br from-[#121622]/60 to-[#08090C]/95 border-[#232B40]/30 text-slate-100 backdrop-blur-md"
        : "bg-white border-[#F1E7D0] text-[#3F2D1D]"
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-white/10" : "border-[#F1E7D0]"}`}>
        <div className="space-y-1">
          <span className={`text-[9px] font-bold uppercase block ${
            isHindi 
              ? "tracking-wide text-[10px] leading-relaxed text-amber-800" 
              : "tracking-widest text-amber-700"
          }`}>
            {isHindi ? "संध्या मनन" : "Evening Reflection"}
          </span>
          <h3 className={`font-serif tracking-wide ${
            isHindi ? "text-xl leading-relaxed font-normal" : "text-lg"
          } ${isDark ? "text-slate-100" : "text-[#3F2D1D]"}`}>
            {isHindi ? "आंतरिक दिशा संरेखण" : "Aligning The Internal Compass"}
          </h3>
        </div>
        {reflection ? (
          editable ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
              isDark 
                ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300" 
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
            }`}>
              <Unlock className={`w-3 h-3 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              {isHindi ? `संपादन योग्य (${timeLeftStr || "समाप्ति"})` : `Editable (${timeLeftStr || "closing"})`}
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
              isDark 
                ? "bg-slate-900/40 border border-slate-800/40 text-slate-400" 
                : "bg-slate-50 border border-slate-200 text-slate-600"
            }`}>
              <Lock className="w-3 h-3 text-slate-400" />
              {isHindi ? "संबद्ध" : "Locked"}
            </div>
          )
        ) : (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
            isDark 
              ? "bg-amber-950/30 border border-amber-900/30 text-amber-300/80" 
              : "bg-amber-50/65 border border-[#F1E7D0] text-[#9E7A5A]"
          }`}>
            {isHindi ? "आज का मनन शेष है" : "Awaiting Reflection"}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Energy Level Option */}
        <div className="space-y-3">
          <label className={`text-[10px] font-bold uppercase block ${
            isHindi 
              ? "tracking-wide text-xs leading-relaxed text-[#3F2D1D]/70" 
              : "tracking-widest text-[#3F2D1D]/50"
          } ${isDark ? "text-slate-400" : ""}`}>
            {isHindi ? "वर्तमान ऊर्जा स्तर" : "Current Energy Level"}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["HIGH", "NEUTRAL", "LOW"] as EnergyLevel[]).map((level) => {
              const isSelected = energy === level;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={!editable}
                  onClick={() => setEnergy(level)}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wide transition-all duration-300 flex items-center justify-center ${
                    isSelected
                      ? isDark 
                        ? "bg-white border-white text-slate-950 font-bold shadow-md"
                        : "bg-[#3F2D1D] text-[#F8F5EF] border-[#3F2D1D] shadow-sm"
                      : isDark
                        ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        : "bg-white border-[#F1E7D0] text-[#3F2D1D]/60 hover:bg-[#EADFC7]/30"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {energyMap[level]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stress Level Option */}
        <div className="space-y-3">
          <label className={`text-[10px] font-bold uppercase block ${
            isHindi 
              ? "tracking-wide text-xs leading-relaxed text-[#3F2D1D]/70" 
              : "tracking-widest text-[#3F2D1D]/50"
          } ${isDark ? "text-slate-400" : ""}`}>
            {isHindi ? "वर्तमान तनाव स्तर" : "Current Stress Level"}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as StressLevel[]).map((level) => {
              const isSelected = stress === level;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={!editable}
                  onClick={() => setStress(level)}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wide transition-all duration-300 flex items-center justify-center ${
                    isSelected
                      ? isDark 
                        ? "bg-white border-white text-slate-950 font-bold shadow-md"
                        : "bg-[#3F2D1D] text-[#F8F5EF] border-[#3F2D1D] shadow-sm"
                      : isDark
                        ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        : "bg-white border-[#F1E7D0] text-[#3F2D1D]/60 hover:bg-[#EADFC7]/30"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {stressMap[level]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observation Notes */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className={`text-[10px] font-bold uppercase block ${
              isHindi 
                ? "tracking-wide text-xs leading-relaxed text-[#3F2D1D]/70" 
                : "tracking-widest text-[#3F2D1D]/50"
            } ${isDark ? "text-slate-400" : ""}`}>
              {isHindi ? "संरेखण टिप्पणी" : "Alignment Notes"}
            </label>
            <span className={`text-[9px] font-semibold tracking-wider ${
              notes.length > 280 
                ? "text-rose-400" 
                : isDark ? "text-slate-500" : "text-[#3F2D1D]/30"
            }`}>
              {notes.length}/300
            </span>
          </div>
          <textarea
            disabled={!editable}
            value={notes}
            onChange={(e) => setNotes(e.target.value.substring(0, 300))}
            placeholder={
              editable 
                ? isHindi 
                  ? "आज के आकाशीय प्रभाव के साथ आपके कर्मों का संरेखण कैसा रहा? अपने विचारों को संक्षिप्त, केंद्रित और स्पष्ट रखें..."
                  : "How did your actions align with today's planetary theme? Keep observations brief, focused, and honest..."
                : isHindi 
                  ? "कोई अवलोकन दर्ज नहीं किया गया।" 
                  : "No observations captured."
            }
            rows={3}
            className={`w-full p-4 rounded-2xl text-xs font-light leading-relaxed resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 ${
              isHindi ? "text-sm leading-loose" : ""
            } ${
              isDark 
                ? "bg-white/5 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-amber-400 focus:ring-amber-400" 
                : "bg-white border border-[#F1E7D0] text-[#3F2D1D] placeholder:text-[#3F2D1D]/30 focus:border-amber-600 focus:ring-amber-600"
            }`}
          />
        </div>

        {/* Feedback Alert Panel */}
        {error && (
          <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
            isDark 
              ? "bg-rose-950/20 border-rose-900/30 text-rose-200" 
              : "bg-rose-50 border border-rose-100 text-rose-900"
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-rose-400" : "text-rose-600"}`} />
            <p className={isHindi ? "text-sm leading-relaxed" : ""}>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed ${
            isDark 
              ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-200" 
              : "bg-emerald-50 border border-emerald-100 text-emerald-900"
          }`}>
            <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
            <p className={isHindi ? "text-sm leading-relaxed" : ""}>{successMsg}</p>
          </div>
        )}

        {/* Submission Button */}
        {editable && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wide rounded-full transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? "bg-[#FAF7F0] hover:bg-[#FAF7F0]/90 text-[#1C101A] border-transparent" 
                  : "bg-[#3F2D1D] text-[#F8F5EF] border-[#3F2D1D] hover:bg-[#3F2D1D]/90"
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {isHindi ? "सहेजा जा रहा है..." : "Recording..."}
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {isHindi ? "मनन सहेजें" : "Save Reflection"}
                </>
              )}
            </button>
          </div>
        )}

        {/* Locked Quote */}
        {!editable && (
          <div className="text-center pt-2">
            <p className={`text-[10px] italic font-light ${
              isHindi ? "text-xs leading-loose" : ""
            } ${isDark ? "text-slate-500" : "text-amber-800/40"}`}>
              {isHindi 
                ? '✦ "दैनिक संरेखण पर मनन करने से मानसिक स्पष्टता और आत्म-नियंत्रण सुदृढ़ होता है।"'
                : '✦ "Reflecting on your alignments daily anchors mental clarity and self-mastery."'
              }
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
