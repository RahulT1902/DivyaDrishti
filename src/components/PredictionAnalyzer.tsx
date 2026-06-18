"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Briefcase,
  DollarSign,
  Heart,
  Activity,
  Brain,
  Sparkles,
  Loader,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PredictionChat from "./PredictionChat";

type Timeframe = "today" | "this-week" | "this-month" | "this-year";
type Domain = "career" | "finance" | "health" | "relationships" | "growth" | "mind";
type OutputMode = "PANDIT" | "SIMPLE_ENGLISH";
type PredictionPayload = {
  analysis?: string;
  narrative?: string;
  detailedReport?: Record<string, { title?: string; content?: string }>;
  keyPoints?: string[];
};

export default function PredictionAnalyzer() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("today");
  const [selectedDomain, setSelectedDomain] = useState<Domain>("career");
  const [selectedMode, setSelectedMode] = useState<OutputMode>("PANDIT");
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionPayload | null>(null);
  const [showChat, setShowChat] = useState(false);

  const timeframes: { id: Timeframe; label: string; icon: LucideIcon }[] = [
    { id: "today", label: "Today", icon: Calendar },
    { id: "this-week", label: "This Week", icon: Calendar },
    { id: "this-month", label: "This Month", icon: Calendar },
    { id: "this-year", label: "This Year", icon: Calendar },
  ];

  const domains: { id: Domain; label: string; icon: LucideIcon; color: string }[] = [
    { id: "career", label: "Career", icon: Briefcase, color: "from-blue-500 to-cyan-500" },
    { id: "finance", label: "Finance", icon: DollarSign, color: "from-green-500 to-emerald-500" },
    { id: "health", label: "Health", icon: Activity, color: "from-red-500 to-pink-500" },
    {
      id: "relationships",
      label: "Relationships",
      icon: Heart,
      color: "from-rose-500 to-pink-500",
    },
    { id: "growth", label: "Growth", icon: Sparkles, color: "from-purple-500 to-pink-500" },
    { id: "mind", label: "Mind & Peace", icon: Brain, color: "from-indigo-500 to-purple-500" },
  ];

  const fetchPredictions = async (mode: OutputMode) => {
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
    const res = await fetch(
      `/api/predictions/analyze?timeframe=${selectedTimeframe}&domain=${selectedDomain}&mode=${mode}&email=${encodeURIComponent(userEmail)}`
    );
    const data = await res.json();
    if (data.success) {
      setPredictions(data.predictions);
      return true;
    }
    return false;
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const ok = await fetchPredictions(selectedMode);
      if (ok) {
        setShowChat(true);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (mode: OutputMode) => {
    if (mode === selectedMode) return;
    setSelectedMode(mode);
    if (!showChat) return;
    setModeLoading(true);
    try {
      await fetchPredictions(mode);
    } catch (err) {
      console.error("Failed to switch mode:", err);
    } finally {
      setModeLoading(false);
    }
  };

  if (showChat && predictions) {
    return (
      <PredictionChat
        predictions={predictions}
        timeframe={selectedTimeframe}
        domain={selectedDomain}
        outputMode={selectedMode}
        modeLoading={modeLoading}
        onModeChange={handleModeChange}
        onBack={() => setShowChat(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Prediction Analysis</h1>
          <p className="text-slate-400">Select a timeframe and area to receive detailed guidance</p>
          <div className="mt-4 inline-flex rounded-lg border border-purple-500/30 bg-slate-900/50 p-1">
            <button
              onClick={() => handleModeChange("PANDIT")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedMode === "PANDIT" ? "bg-purple-500 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Hindi
            </button>
            <button
              onClick={() => handleModeChange("SIMPLE_ENGLISH")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedMode === "SIMPLE_ENGLISH" ? "bg-purple-500 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timeframe Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Timeframe
            </h2>
            <div className="space-y-3">
              {timeframes.map((tf) => (
                <motion.button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTimeframe === tf.id
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-purple-500/50 hover:text-slate-300"
                  }`}
                >
                  <div className="font-semibold">{tf.label}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Domain Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Select Area
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {domains.map((domain) => {
                const Icon = domain.icon;
                return (
                  <motion.button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${
                      selectedDomain === domain.id
                        ? `border-purple-500 bg-gradient-to-br ${domain.color} text-white shadow-lg shadow-purple-500/50`
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-purple-500/50 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-semibold">{domain.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Analyze Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze & Get Insights
              </>
            )}
          </button>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "Real-time Analysis",
              desc: "Get current planet positions and their impact on your selected area",
            },
            {
              title: "Timeframe-specific",
              desc: "Predictions tailored to your selected timeframe for accuracy",
            },
            {
              title: "Interactive Chat",
              desc: "Ask follow-up questions and get deeper insights on the analysis",
            },
          ].map((info, idx) => (
            <div
              key={idx}
              className="p-6 bg-slate-900/30 border border-purple-500/10 rounded-lg"
            >
              <h3 className="font-semibold text-white mb-2">{info.title}</h3>
              <p className="text-sm text-slate-400">{info.desc}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
