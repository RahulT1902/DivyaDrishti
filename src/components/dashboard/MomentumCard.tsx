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
  purple: "text-purple-400 bg-purple-400/5 border-purple-400/20",
  emerald: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
  rose: "text-rose-400 bg-rose-400/5 border-rose-400/20",
  amber: "text-amber-400 bg-amber-400/5 border-amber-400/20",
};

const barColorMap = {
  purple: "bg-purple-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
};

export default function MomentumCard({ label, score, trend, color }: Props) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-sm ${colorMap[color]}`}>
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-bold text-white">{Math.round(score)}</span>
        <span className="text-xs opacity-50">%</span>
      </div>

      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={`h-full ${barColorMap[color]}`}
        />
      </div>
    </div>
  );
}
