"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions";
import CitySearch from "@/components/CitySearch";

// ─── Date/Time helpers ───────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

interface DateState  { day: string; month: string; year: string }
interface TimeState  { hour: string; minute: string }

function toISODate(d: DateState): string {
  if (!d.day || !d.month || !d.year) return "";
  return `${d.year}-${d.month.padStart(2, "0")}-${d.day.padStart(2, "0")}`;
}

function toHHMM(t: TimeState): string {
  if (!t.hour) return "";
  const hh = t.hour.padStart(2, "0");
  const mm = (t.minute || "0").padStart(2, "0");
  return `${hh}:${mm}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Select({ value, onChange, children, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex-1 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80
                 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10
                 outline-none text-white appearance-none cursor-pointer
                 text-sm font-medium"
    >
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const [dateState, setDateState] = useState<DateState>({ day: "", month: "", year: "" });
  const [timeState, setTimeState] = useState<TimeState>({ hour: "", minute: "0" });

  const maxDays = dateState.month && dateState.year
    ? daysInMonth(Number(dateState.month), Number(dateState.year))
    : 31;

  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const clientAction = async (formData: FormData) => {
    const dateValue = toISODate(dateState);
    const timeValue = toHHMM(timeState);

    if (!dateValue) { setError("Please select a complete birth date."); return; }
    if (!timeValue) { setError("Please select birth hour."); return; }

    formData.set("date", dateValue);
    formData.set("time", timeValue);
    setError(null);

    startTransition(async () => {
      const result = await registerUser(formData);
      if (result.success) {
        setComplete(true);
      } else {
        setError(result.error || "Initialization failed.");
      }
    });
  };

  if (complete) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6 font-sans overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
        <div className="relative z-10 text-center space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-black tracking-tight">System Calibrated</h2>
          <p className="text-zinc-400 max-w-sm mx-auto">Your life engine has been successfully initialized. Welcome to DivyaDrishti.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 bg-white text-black rounded-xl font-bold text-sm tracking-widest uppercase hover:scale-105 transition-transform"
          >
            Enter Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6 font-sans overflow-hidden relative">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none delay-1000" />

      <div className="w-full max-w-xl space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-900/50 backdrop-blur-md border border-zinc-800 shadow-2xl mb-2">
            <div className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Birth Chart Setup
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-600 drop-shadow-2xl">
            DivyaDrishti
          </h1>
          <p className="text-zinc-500 text-xs font-bold tracking-[0.5em] uppercase opacity-80">
            Quantitative Life Operating System
          </p>
        </div>

        {/* Already registered? Sign in link */}
        <div className="text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-amber-400 font-bold hover:text-amber-300 underline underline-offset-2 transition-colors"
            >
              Sign in →
            </button>
          </p>
        </div>

        {/* Form */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-zinc-800 to-amber-500/20 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

          <form
            action={clientAction}
            className="relative bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8"
          >
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                Your Name
              </label>
              <input
                name="name"
                placeholder="Full Name"
                className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80
                           focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10
                           transition-all outline-none text-white placeholder:text-zinc-700
                           font-medium text-lg"
                required
              />
            </div>

            {/* Birth Date — 3 dropdowns */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                Date of Birth
              </label>
              <div className="flex gap-3">
                <Select value={dateState.day} onChange={v => setDateState(s => ({ ...s, day: v }))} placeholder="Day">
                  {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
                </Select>
                <Select value={dateState.month} onChange={v => setDateState(s => ({ ...s, month: v, day: "" }))} placeholder="Month">
                  {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                </Select>
                <Select value={dateState.year} onChange={v => setDateState(s => ({ ...s, year: v, day: "" }))} placeholder="Year">
                  {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </Select>
              </div>
              {/* Hidden field for the actual date value */}
              <input type="hidden" name="date" value={toISODate(dateState)} />
            </div>

            {/* Birth Time — Hour + Minute dropdowns */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                Birth Time <span className="text-zinc-600 normal-case font-normal">(24-hour, approximate is fine)</span>
              </label>
              <div className="flex gap-3 items-center">
                <Select value={timeState.hour} onChange={v => setTimeState(s => ({ ...s, hour: v }))} placeholder="Hour">
                  {HOURS.map(h => <option key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</option>)}
                </Select>
                <span className="text-zinc-600 font-bold text-lg flex-shrink-0">:</span>
                <Select value={timeState.minute} onChange={v => setTimeState(s => ({ ...s, minute: v }))} placeholder="Min">
                  {MINUTES.map(m => <option key={m} value={String(m)}>{String(m).padStart(2, "0")}</option>)}
                </Select>
              </div>
              <input type="hidden" name="time" value={toHHMM(timeState)} />
            </div>

            {/* City */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                Birth City
              </label>
              <CitySearch onSelect={setSelectedCity} />
              <input type="hidden" name="latitude"  value={selectedCity?.lat  ?? ""} />
              <input type="hidden" name="longitude" value={selectedCity?.lng  ?? ""} />
              <input type="hidden" name="timezone"  value={selectedCity?.timezone ?? ""} />
              {selectedCity && (
                <div className="flex items-center justify-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-amber-500/80 font-mono font-bold tracking-widest uppercase">
                    {selectedCity.lat.toFixed(4)}°N / {selectedCity.lng.toFixed(4)}°E
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={`w-full p-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500
                         ${isPending
                           ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                           : "bg-white text-black hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"}`}
            >
              {isPending ? "Aligning your chart..." : "Reveal My Chart"}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-6 opacity-40">
          <div className="h-px w-12 bg-zinc-800" />
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">
            Security Protocol Tier IV
          </p>
          <div className="h-px w-12 bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
