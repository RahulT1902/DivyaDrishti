"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions";
import CitySearch from "@/components/CitySearch";

export default function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const handleCitySelect = (city: any) => {
    setSelectedCity(city);
  };

  const clientAction = async (formData: FormData) => {
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
        {/* Success Orbs */}
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
            onClick={() => router.refresh()}
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
      {/* Decorative Floating Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none delay-1000" />
      
      <div className="w-full max-w-xl space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-900/50 backdrop-blur-md border border-zinc-800 shadow-2xl mb-2">
            <div className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Secure Initialization Protocol
            </div>
          </div>
          
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-600 drop-shadow-2xl">
            DivyaDrishti
          </h1>
          <p className="text-zinc-500 text-xs font-bold tracking-[0.5em] uppercase opacity-80">
            Quantitative Life Operating System
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-zinc-800 to-amber-500/20 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          
          <form
            action={clientAction}
            className="relative bg-[#0a0a0a]/80 backdrop-blur-2xl p-12 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8"
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                  Step 01: Establish Identity
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

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                    Step 02: Birth Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 
                               focus:border-zinc-500 transition-all outline-none text-white
                               [color-scheme:dark] cursor-pointer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                    Step 03: Birth Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 
                               focus:border-zinc-500 transition-all outline-none text-white
                               [color-scheme:dark] cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black ml-1">
                  Step 04: Location Intent
                </label>
                <div className="space-y-4">
                  <CitySearch onSelect={handleCitySelect} />
                  
                  <input type="hidden" name="latitude" value={selectedCity?.lat || ""} />
                  <input type="hidden" name="longitude" value={selectedCity?.lng || ""} />
                  <input type="hidden" name="timezone" value={selectedCity?.timezone || ""} />

                  {selectedCity && (
                    <div className="flex items-center justify-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <p className="text-[10px] text-amber-500/80 font-mono font-bold tracking-widest uppercase">
                        GEOLOCATION LOCKED: {selectedCity.lat.toFixed(4)}°N / {selectedCity.lng.toFixed(4)}°E
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isPending}
              className={`w-full relative group overflow-hidden p-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500
                         ${isPending 
                           ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                           : "bg-white text-black hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"}`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-4">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  Calibrating Neural Engine...
                </span>
              ) : (
                "Initialize System"
              )}
              
              {!isPending && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-6 opacity-40 group hover:opacity-100 transition-opacity">
          <div className="h-px w-12 bg-zinc-800" />
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
            Security Protocol Tier IV
          </p>
          <div className="h-px w-12 bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
