"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import CitySearch from "@/components/CitySearch";
import { registerUser } from "@/app/actions";
import { ArrowRight, Sparkles, Calendar, Clock, MapPin, User, Loader2 } from "lucide-react";

type OnboardingData = { name: string; date: string; time: string; city: any };

const STEPS = [
  { num: 1, icon: User,     label: "Who you are" },
  { num: 2, icon: Calendar, label: "Date of birth" },
  { num: 3, icon: Clock,    label: "Birth time" },
  { num: 4, icon: MapPin,   label: "Birth place" },
];

export default function OnboardingRitual() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({ name: "", date: "", time: "", city: null });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    const email = typeof window !== "undefined" ? window.localStorage.getItem("divya:userEmail") : null;
    formData.append("name", data.name);
    if (email) formData.append("email", email);
    formData.append("date", data.date);
    formData.append("time", data.time);
    formData.append("latitude", data.city.lat.toString());
    formData.append("longitude", data.city.lng.toString());
    formData.append("timezone", data.city.timezone);
    const res = await registerUser(formData);
    if (res.success) {
      window.localStorage.setItem("divya:loggedIn", "true");
      router.push("/dashboard");
    } else {
      setLoading(false);
      alert("Could not save your details. Please try again.");
    }
  };

  const variants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -24 },
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col items-center justify-center px-6 py-12">
      {/* Soft background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-amber-200/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-200 mx-auto mb-3">
            <span className="text-white text-xl font-bold">ॐ</span>
          </div>
          <p className="text-xs font-bold text-amber-600/50 uppercase tracking-widest">DivyaDrishti · Birth Details</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-12">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.num}>
                <div className={`flex flex-col items-center gap-1 ${step >= s.num ? "opacity-100" : "opacity-30"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step === s.num ? "bg-amber-600 text-white" : step > s.num ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-400"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${step > s.num ? "bg-emerald-400" : "bg-amber-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="space-y-8">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Step 1 of 4</p>
                <h1 className="text-3xl md:text-4xl font-serif font-light text-amber-900 leading-snug">
                  Let's align your <br /><span className="font-semibold text-amber-600 italic">cosmic blueprint.</span>
                </h1>
              </div>
              <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
                <label className="block text-xs font-bold text-amber-700/50 uppercase tracking-widest mb-3">Your Name</label>
                <input
                  type="text" placeholder="e.g. Rahul Sharma"
                  value={data.name} onChange={e => setData({ ...data, name: e.target.value })}
                  className="w-full text-2xl font-serif font-light text-amber-900 bg-transparent border-b-2 border-amber-200 focus:border-amber-500 outline-none pb-2 placeholder-amber-200 transition-colors"
                  autoFocus
                />
              </div>
              <button disabled={!data.name} onClick={nextStep}
                className="flex items-center gap-3 text-amber-700 font-medium hover:text-amber-900 disabled:opacity-30 transition-all group">
                Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="space-y-8">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Step 2 of 4</p>
                <h1 className="text-3xl md:text-4xl font-serif font-light text-amber-900 leading-snug">
                  When were you <br /><span className="font-semibold text-amber-600 italic">born into this world?</span>
                </h1>
              </div>
              <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
                <label className="block text-xs font-bold text-amber-700/50 uppercase tracking-widest mb-3">Date of Birth</label>
                <input
                  type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })}
                  className="w-full text-2xl font-serif font-light text-amber-900 bg-transparent border-b-2 border-amber-200 focus:border-amber-500 outline-none pb-2 [color-scheme:light] transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-6">
                <button onClick={prevStep} className="text-sm text-amber-600/50 hover:text-amber-800 uppercase tracking-widest transition-colors">← Back</button>
                <button disabled={!data.date} onClick={nextStep}
                  className="flex items-center gap-3 text-amber-700 font-medium hover:text-amber-900 disabled:opacity-30 transition-all group">
                  Next <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="space-y-8">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Step 3 of 4</p>
                <h1 className="text-3xl md:text-4xl font-serif font-light text-amber-900 leading-snug">
                  The exact moment <br /><span className="font-semibold text-amber-600 italic">of your alignment.</span>
                </h1>
                <p className="text-xs text-amber-700/40 mt-2">As accurate as possible — even approximate helps your Lagna calculation.</p>
              </div>
              <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
                <label className="block text-xs font-bold text-amber-700/50 uppercase tracking-widest mb-3">Birth Time</label>
                <input
                  type="time" step="60" value={data.time} onChange={e => setData({ ...data, time: e.target.value })}
                  className="w-full text-3xl font-serif font-light text-amber-900 bg-transparent border-b-2 border-amber-200 focus:border-amber-500 outline-none pb-2 [color-scheme:light] transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-6">
                <button onClick={prevStep} className="text-sm text-amber-600/50 hover:text-amber-800 uppercase tracking-widest transition-colors">← Back</button>
                <button disabled={!data.time} onClick={nextStep}
                  className="flex items-center gap-3 text-amber-700 font-medium hover:text-amber-900 disabled:opacity-30 transition-all group">
                  Final Step <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }} className="space-y-8">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Step 4 of 4</p>
                <h1 className="text-3xl md:text-4xl font-serif font-light text-amber-900 leading-snug">
                  Where did you <br /><span className="font-semibold text-amber-600 italic">first draw breath?</span>
                </h1>
              </div>
              <div className="bg-white border border-[#F1E7D0] rounded-2xl p-6 shadow-sm">
                <label className="block text-xs font-bold text-amber-700/50 uppercase tracking-widest mb-3">Birth City</label>
                <CitySearch onSelect={city => setData({ ...data, city })} />
              </div>
              <div className="flex gap-6 items-center pt-2">
                <button disabled={loading} onClick={prevStep} className="text-sm text-amber-600/50 hover:text-amber-800 uppercase tracking-widest transition-colors">← Back</button>
                <button
                  disabled={!data.city || loading} onClick={handleSubmit}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 disabled:opacity-40 transition-all shadow-sm shadow-amber-200"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Aligning your chart...</>
                  ) : (
                    <>Reveal My Chart <Sparkles className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
