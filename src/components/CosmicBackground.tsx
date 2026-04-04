"use client";

import React from "react";
import { motion } from "framer-motion";

export const CosmicBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-transparent overflow-hidden">
      {/* 🌅 Prabhat Atmos: Lightweight Morning Clarity Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtlest Sunrise Warmth: Simple Radial, No Blur Overload */}
        <motion.div
          animate={{
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[100px]"
        />
        
        {/* Paper Texture Overlay: Consistent with Global Style */}
        <div className="absolute inset-0 paper-texture opacity-5 pointer-events-none" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
};
