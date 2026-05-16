import React from "react";
import { Compass, Sword, Landmark, HeartPulse, Search } from "lucide-react";
import { motion } from "framer-motion";

export type ExecutionMode = "ARCHITECT" | "WARRIOR" | "DIPLOMAT" | "HEALER" | "OBSERVER";

interface Props {
  mode: ExecutionMode;
}

const modeConfigs: Record<ExecutionMode, { icon: any; color: string; bg: string; label: string }> = {
  ARCHITECT: { icon: Landmark, color: "text-blue-400", bg: "bg-blue-400/10", label: "Structured Execution" },
  WARRIOR: { icon: Sword, color: "text-rose-400", bg: "bg-rose-400/10", label: "Bold Visibility" },
  DIPLOMAT: { icon: Compass, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Collaborative Expansion" },
  HEALER: { icon: HeartPulse, color: "text-purple-400", bg: "bg-purple-400/10", label: "Internal Integration" },
  OBSERVER: { icon: Search, color: "text-amber-400", bg: "bg-amber-400/10", label: "Fluid Adaptability" },
};

export default function ExecutionModeBadge({ mode }: Props) {
  const config = modeConfigs[mode] || modeConfigs.ARCHITECT;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-current ${config.bg} ${config.color}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-widest">{mode}</span>
      <span className="text-[10px] opacity-70 uppercase tracking-tighter">| {config.label}</span>
    </motion.div>
  );
}
