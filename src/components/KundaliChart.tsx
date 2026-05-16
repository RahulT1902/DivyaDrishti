"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface Planet {
  name: string;
  sign: number; // 1-12
  degree?: number;
  positionInSign?: number; // Precise decimal for DMS
  isRetrograde?: boolean;
  isCombust?: boolean;
  isVargottama?: boolean;
  strengthLevel?: string; 
}

interface KundaliChartProps {
  lagnaSign: number; 
  planets: Planet[];
  onHouseClick?: (houseIndex: number) => void;
  variant?: "light" | "dark";
  title?: string;
}

const planetAbbr: Record<string, string> = {
  Lagna: "La", Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me",
  Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
  Uranus: "Ur", Neptune: "Ne", Pluto: "Pl"
};

// Precisely Calibrated Coordinates for 300x300 SVG
// Mimicking the reference image's clarity and clearance
const HOUSE_COORDS = [
  { signX: 150, signY: 35, pX: 150, pY: 80 },   // H1 (Top Diamond)
  { signX: 105, signY: 30, pX: 70, pY: 55 },    // H2 (Top-Left)
  { signX: 45, signY: 90, pX: 60, pY: 100 },    // H3 (Left-Top)
  { signX: 35, signY: 150, pX: 85, pY: 155 },   // H4 (Left Diamond)
  { signX: 45, signY: 210, pX: 60, pY: 220 },   // H5 (Left-Bottom)
  { signX: 105, signY: 270, pX: 70, pY: 265 },  // H6 (Bottom-Left)
  { signX: 150, signY: 265, pX: 150, pY: 220 }, // H7 (Bottom Diamond)
  { signX: 195, signY: 270, pX: 230, pY: 265 }, // H8 (Bottom-Right)
  { signX: 255, signY: 210, pX: 240, pY: 220 }, // H9 (Right-Bottom)
  { signX: 265, signY: 150, pX: 215, pY: 155 }, // H10 (Right Diamond)
  { signX: 255, signY: 90, pX: 240, pY: 100 },  // H11 (Right-Top)
  { signX: 195, signY: 30, pX: 230, pY: 55 },   // H12 (Top-Right)
];

export default function KundaliChart({ 
  lagnaSign, 
  planets, 
  onHouseClick,
  variant = "dark",
  title
}: KundaliChartProps) {
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  // Group planets by house (including Lagna)
  const housePlanets: any[][] = Array.from({ length: 12 }, () => []);

  planets.forEach((p) => {
    const signNum = typeof p.sign === "string" ? Number.parseInt(p.sign, 10) : p.sign;
    if (!Number.isFinite(signNum) || signNum < 1 || signNum > 12) {
      console.warn("Skipping planet with invalid sign:", p);
      return;
    }

    const houseIndex = ((signNum - lagnaSign + 12) % 12 + 12) % 12;
    if (!housePlanets[houseIndex]) {
      console.warn("Invalid house index calculated:", houseIndex, p, lagnaSign);
      return;
    }

    const abbr = planetAbbr[p.name] || (p.name ? String(p.name).slice(0, 2) : "??");
    const rawDegree = p.degree !== undefined ? p.degree : (p.positionInSign ?? 0);
    const normalizedDegree = Number.isFinite(rawDegree) ? Math.floor(rawDegree) : null;
    const degreeLabel = normalizedDegree !== null ? String(normalizedDegree).padStart(2, "0") : "--";

    housePlanets[houseIndex].push({
      abbr,
      degree: degreeLabel,
      retro: p.isRetrograde,
      combust: p.isCombust,
      vargottama: p.isVargottama,
      exalted: p.strengthLevel === "Dominant",
      debilitated: p.strengthLevel === "Weak",
    });
  });

  const getHouseNumber = (hIdx: number) => hIdx + 1;

  const isDark = variant === "dark";
  const colorLines = "#E6C200"; // Pure Gold
  const colorText = "#FFFFFF";  // High-Clarity White

  return (
    <div className="relative w-full aspect-square mx-auto max-w-[440px] bg-black p-2 border border-white/5 shadow-2xl">
      <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
        {/* Core Geometry */}
        <g stroke={colorLines} strokeWidth="1.5" fill="none">
           {/* Outer Box */}
           <rect x="5" y="5" width="290" height="290" />
           {/* Diagonals */}
           <line x1="5" y1="5" x2="295" y2="295" />
           <line x1="5" y1="295" x2="295" y2="5" />
           {/* Inner Diamond */}
           <path d="M150 5 L5 150 L150 295 L295 150 Z" />
        </g>

        {/* 12 Houses Rendering */}
        {HOUSE_COORDS.map((coord, i) => (
          <g 
            key={i} 
            className="cursor-pointer"
            onClick={() => {
              setSelectedHouse(i);
              onHouseClick?.(i);
            }}
          >
            {/* Sign Number - Positioned for clearance */}
            <text 
              x={coord.signX} 
              y={coord.signY} 
              fill={colorLines}
              className="text-[12px] font-bold select-none italic" 
              textAnchor="middle"
            >
              {getHouseNumber(i)}
            </text>
            
            {/* Planet Stack - Vertical Slot Logic */}
            <g transform={`translate(${coord.pX}, ${coord.pY})`}>
              {housePlanets[i].map((p, pIdx) => {
                const total = housePlanets[i].length;
                const spacing = 32; // Generous vertical spacing
                const startY = -((total - 1) * spacing) / 2;
                const currentY = startY + (pIdx * spacing);
                
                return (
                  <g key={pIdx} transform={`translate(0, ${currentY})`}>
                     {/* 1. Degree (Centered Top) */}
                     <text 
                       y="-14" 
                       fill="#F5F5F5" 
                       className="text-[7px] font-mono opacity-60" 
                       textAnchor="middle"
                     >
                       {p.degree.toString().padStart(2, '0')}
                     </text>
                     
                     {/* 2. Planet Abbr (Bold Middle) */}
                     <text 
                       fill={colorText} 
                       className="text-[14px] font-black tracking-tight" 
                       textAnchor="middle"
                     >
                       {p.abbr}
                     </text>

                     {/* 3. Badges (Immediate Right) */}
                     <text 
                       x="12" 
                       y="2" 
                       fill={colorLines} 
                       className="text-[10px] font-bold"
                     >
                        {p.retro && "*"}
                        {p.combust && "^"}
                        {p.vargottama && "□"}
                        {p.exalted && "↑"}
                        {p.debilitated && "↓"}
                     </text>
                  </g>
                );
              })}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
