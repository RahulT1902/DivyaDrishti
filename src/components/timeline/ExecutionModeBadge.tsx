import React from "react";
import { Compass, Sword, Landmark, HeartPulse, Search } from "lucide-react";
import { motion } from "framer-motion";

export type ExecutionMode = "ARCHITECT" | "WARRIOR" | "DIPLOMAT" | "HEALER" | "OBSERVER";

interface Props {
  mode: ExecutionMode;
}

const modeConfigs: Record<ExecutionMode, { icon: any; color: string; bg: string; border: string; label: string }> = {
  ARCHITECT: { icon: Landmark,   color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  label: "Structured & Disciplined" },
  WARRIOR:   { icon: Sword,      color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", label: "Bold & Direct" },
  DIPLOMAT:  { icon: Compass,    color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200",label: "Collaborative Harmony" },
  HEALER:    { icon: HeartPulse, color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", label: "Internal Reflection" },
  OBSERVER:  { icon: Search,     color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200", label: "Patient Observation" },
};

export default function ExecutionModeBadge({ mode }: Props) {
  const config = modeConfigs[mode] || modeConfigs.ARCHITECT;
  const Icon = config.icon;

  return (
    <div className="flex flex-col md:items-end">
      <span className="text-[10px] font-bold text-amber-700/40 uppercase tracking-widest mb-1">Recommended Approach</span>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.bg} ${config.border} ${config.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-widest">{config.label}</span>
      </motion.div>
    </div>
  );
}
