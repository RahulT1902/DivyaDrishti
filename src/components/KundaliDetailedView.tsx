"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import KundaliChart from "./KundaliChart";
import { Moon, ChevronDown, Globe, Clock, Calendar } from "lucide-react";

export default function KundaliDetailedView({ chartData, user }: any) {
  const [expandedSection, setExpandedSection] = useState<string | null>("chart");

  if (!chartData || !chartData.planets) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p>Loading Kundali...</p>
      </div>
    );
  }

  const lagnaSign = chartData.lagna || 1;
  const planets = chartData.planets || [];

  // Format planet display
  const planetDetails = planets.map((p: any) => ({
    ...p,
    signed: p.sign || 1,
    degree: Math.floor(p.degree || 0),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{user?.name}'s Kundali</h1>
          <p className="text-slate-400">Your complete birth chart analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8">
              <div className="flex flex-col items-center">
                <KundaliChart
                  lagnaSign={lagnaSign}
                  planets={planetDetails}
                  variant="dark"
                  title="Your Kundali"
                />
                <div className="mt-8 text-center">
                  <p className="text-slate-400 text-sm">Lagna: {getLagnaName(lagnaSign)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Birth Details Card */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Birth Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Date of Birth</p>
                    <p className="text-white font-semibold">
                      {user?.birthDetails?.dateOfBirth
                        ? new Date(user.birthDetails.dateOfBirth).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Time of Birth</p>
                    <p className="text-white font-semibold">{user?.birthDetails?.timeOfBirth}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Birth Location</p>
                    <p className="text-white font-semibold text-sm">
                      {user?.birthDetails?.latitude?.toFixed(4)}°N / {user?.birthDetails?.longitude?.toFixed(4)}°E
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: "Transit Planets", href: "#transit" },
                  { label: "Dasha Timeline", href: "#dasha" },
                  { label: "Predictions", href: "#predictions" },
                ].map((link) => (
                  <button
                    key={link.label}
                    className="w-full text-left px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-purple-300 transition-all"
                  >
                    {link.label} →
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Planets Detail Section */}
        <motion.div
          className="mt-8 bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Planetary Positions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planetDetails.map((planet: any, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-purple-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{planet.name}</h4>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                    {getLagnaName(planet.sign)}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {planet.degree}°{" "}
                  {planet.isRetrograde && <span className="text-orange-400">R</span>}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function getLagnaName(num: number): string {
  const names = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  return names[Math.max(0, Math.min(11, num - 1))];
}
