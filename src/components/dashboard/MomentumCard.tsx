import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  label: string;
  score: number;
  trend: "up" | "down" | "stable";
  color: "purple" | "emerald" | "rose" | "amber";
}

const colorMap = {
  purple: "bg-indigo-50 border-indigo-100 text-indigo-700",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  rose: "bg-orange-50 border-orange-100 text-orange-700",
  amber: "bg-amber-50 border-amber-100 text-amber-700",
};

const barColorMap = {
  purple: "from-indigo-400 to-indigo-500",
  emerald: "from-emerald-400 to-emerald-500",
  rose: "from-orange-400 to-orange-500",
  amber: "from-amber-400 to-amber-500",
};

export default function MomentumCard({ label, score, trend, color }: Props) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const safeScore = isNaN(score) ? 60 : Math.min(Math.max(Math.round(score), 0), 100);

  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${colorMap[color]}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
        <Icon className="w-4 h-4 opacity-50" />
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold text-amber-900">{safeScore}</span>
        <span className="text-xs opacity-40">%</span>
      </div>

      <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden border border-black/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeScore}%` }}
          className={`h-full bg-gradient-to-r ${barColorMap[color]} rounded-full`}
        />
      </div>
    </div>
  );
}
