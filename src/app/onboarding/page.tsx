"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import CitySearch from "@/components/CitySearch";
import { registerUser } from "@/app/actions";
import { ArrowRight, Sparkles, Calendar, Clock, MapPin, User } from "lucide-react";

type OnboardingData = {
  name: string;
  date: string;
  time: string;
  city: any;
};

export default function OnboardingRitual() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    date: "",
    time: "",
    city: null,
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("date", data.date);
    formData.append("time", data.time);
    formData.append("latitude", data.city.lat.toString());
    formData.append("longitude", data.city.lng.toString());
    formData.append("timezone", data.city.timezone);

    const res = await registerUser(formData);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setLoading(false);
      alert("Calibration failed. Please try again.");
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                s <= step ? "w-8 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-sm uppercase tracking-[0.3em] text-cyan-500 font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> The Beginning
                </h2>
                <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                  Let's align your <br /><span className="text-gradient font-medium">cosmic blueprint.</span>
                </h1>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="What is your name?"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full h-16 bg-transparent border-b border-white/20 text-3xl font-light text-white outline-none focus:border-cyan-500 transition-colors placeholder:text-white/10 px-2"
                  autoFocus
                />
                <User className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10 w-8 h-8" />
              </div>

              <button
                disabled={!data.name}
                onClick={nextStep}
                className="group flex items-center gap-3 text-white/50 hover:text-white transition-all disabled:opacity-0"
              >
                Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-sm uppercase tracking-[0.3em] text-cyan-500 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Earthly Arrival
                </h2>
                <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                  When were you <br /><span className="text-gradient font-medium">born into this world?</span>
                </h1>
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => setData({ ...data, date: e.target.value })}
                  className="w-full h-16 bg-transparent border-b border-white/20 text-3xl font-light text-white outline-none focus:border-cyan-500 transition-colors [color-scheme:dark] px-2"
                  autoFocus
                />
              </div>

              <div className="flex gap-8">
                <button
                  onClick={prevStep}
                  className="text-white/30 hover:text-white transition-all text-sm uppercase tracking-widest"
                >
                  Back
                </button>
                <button
                  disabled={!data.date}
                  onClick={nextStep}
                  className="group flex items-center gap-3 text-white/50 hover:text-white transition-all disabled:opacity-0"
                >
                  Next Alignment <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-sm uppercase tracking-[0.3em] text-cyan-500 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Universal Time
                </h2>
                <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                  The exact moment <br /><span className="text-gradient font-medium">of your alignment.</span>
                </h1>
              </div>

              <div className="relative">
                <input
                  type="time"
                  step="60"
                  value={data.time}
                  onChange={(e) => setData({ ...data, time: e.target.value })}
                  className="w-full h-16 bg-transparent border-b border-white/20 text-4xl font-light text-white outline-none focus:border-cyan-500 transition-colors [color-scheme:dark] px-2"
                  autoFocus
                />
              </div>

              <div className="flex gap-8">
                <button
                  onClick={prevStep}
                  className="text-white/30 hover:text-white transition-all text-sm uppercase tracking-widest"
                >
                  Back
                </button>
                <button
                  disabled={!data.time}
                  onClick={nextStep}
                  className="group flex items-center gap-3 text-white/50 hover:text-white transition-all disabled:opacity-0"
                >
                  Final Calibration <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-sm uppercase tracking-[0.3em] text-cyan-500 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Sacred Location
                </h2>
                <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                  Where did you <br /><span className="text-gradient font-medium">first draw breath?</span>
                </h1>
              </div>

              <div className="pt-4">
                <CitySearch onSelect={(city) => setData({ ...data, city })} />
              </div>

              <div className="flex gap-8 items-center pt-8">
                <button
                  disabled={loading}
                  onClick={prevStep}
                  className="text-white/30 hover:text-white transition-all text-sm uppercase tracking-widest"
                >
                  Back
                </button>
                <button
                  disabled={!data.city || loading}
                  onClick={handleSubmit}
                  className="h-14 px-8 rounded-full bg-white text-black font-medium hover:bg-cyan-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-white"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                    />
                  ) : (
                    <>Align My Path <Sparkles className="w-4 h-4 fill-black" /></>
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
