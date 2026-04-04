"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DarshanMomentProps {
  onComplete: () => void;
  name: string;
}

export const DarshanMoment: React.FC<DarshanMomentProps> = ({ onComplete, name }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // 3.2s total to accommodate the new 3-phase timing
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 1200);
    }, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Phase 1: Stillness Layer (0-200ms) */}
          {/* This is handled by the base white bg and the delayed start of secondary and core layers */}

          {/* Phase 2: Awakening (200ms - 800ms) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1.2 }}
            className="absolute inset-0"
          >
            {/* Subtle Background Layer: Warm Sunrise Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FFF8E7] via-white to-[#F7F9FC] opacity-100" />
            
            {/* Subtle Sri Yantra Background Pattern */}
            <div className="absolute inset-0 sacred-geometry opacity-[0.02] pointer-events-none" />

            {/* Sunlight Expansion Animation: The 'Bloom' */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 1.4, 1.3], 
                opacity: [0, 0.5, 0.45] 
              }}
              transition={{ delay: 0.2, duration: 3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[80px]"
            />
          </motion.div>

          {/* Phase 3: Clarity (800ms+) */}
          <div className="relative text-center space-y-12 px-6 z-10">
            {/* Greeting (Primary Insight) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            >
              <h2 className="text-4xl md:text-5xl font-light text-black/80 tracking-tight">
                Namaste, <span className="font-bold text-black">{name}</span>
              </h2>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 1.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <p className="text-sm md:text-base text-black/40 italic font-medium tracking-[0.05em] px-4">
                "Samay ka margdarshan dheere-dheere prakat ho raha hai..."
              </p>
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent mx-auto" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-black/20 font-black">
                Time is revealing its guidance
              </p>
            </motion.div>
          </div>

          {/* Paper Texture Overlay */}
          <div className="paper-texture opacity-10 pointer-events-none absolute inset-0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
