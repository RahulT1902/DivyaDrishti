"use client";

import React from "react";
import { Calendar, ShieldAlert, Sparkles } from "lucide-react";
import {
  TITHI_QUALITIES,
  TITHI_QUALITIES_HI,
  NAKSHATRA_QUALITIES,
  NAKSHATRA_QUALITIES_HI,
  YOGA_QUALITIES,
  YOGA_QUALITIES_HI,
  KARANA_QUALITIES,
  KARANA_QUALITIES_HI,
  VARA_MEANING_EN,
  VARA_MEANING_HI,
  LIMB_LABELS,
  SLOT_LABELS,
  getTodayFavors,
} from "@/lib/astrology/panchangFormatter";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  panchang: {
    tithi: string;
    paksha: "Shukla" | "Krishna";
    nakshatra: string;
    moonSign: string;
    yoga: string;
    karana: string;
    sanskritDate: string;
    vara: string;
    rahuKaal: { start: string; end: string };
    abhijitKaal: { start: string; end: string };
  };
  themeMode?: "morning" | "evening";
}

const PAKSHA_HI: Record<string, string> = {
  Shukla: "शुक्ल",
  Krishna: "कृष्ण",
};

export default function PanchangCard({ panchang, themeMode }: Props) {
  const { isHindi, language } = useLanguage();

  const favorsList = getTodayFavors(panchang.nakshatra, panchang.tithi, language);

  // Quality lookups — pick the bilingual map based on current language
  const tithiMeaning = isHindi
    ? (TITHI_QUALITIES_HI[panchang.tithi] || "गतिशील विकास की ऊर्जा")
    : (TITHI_QUALITIES[panchang.tithi]    || "Energy of dynamic evolution");

  const nakshatraMeaning = isHindi
    ? (NAKSHATRA_QUALITIES_HI[panchang.nakshatra] || "अनुकूल खगोलीय संरेखण")
    : (NAKSHATRA_QUALITIES[panchang.nakshatra]     || "Supportive celestial alignment");

  const yogaMeaning = isHindi
    ? (YOGA_QUALITIES_HI[panchang.yoga] || "सामंजस्यपूर्ण समय की गतिशीलता")
    : (YOGA_QUALITIES[panchang.yoga]    || "Harmonious timing dynamics");

  const karanaMeaning = isHindi
    ? (KARANA_QUALITIES_HI[panchang.karana] || "रचनात्मक निष्पादन फोकस")
    : (KARANA_QUALITIES[panchang.karana]    || "Constructive execution focus");

  const varaMeaning = isHindi
    ? (VARA_MEANING_HI[panchang.vara] || "ग्रहीय ऊर्जा द्वारा शासित")
    : (VARA_MEANING_EN[panchang.vara] || "Ruled by solar weekday influence");

  const pakshaDisplay = isHindi
    ? (PAKSHA_HI[panchang.paksha] || panchang.paksha)
    : panchang.paksha;

  const limbs = [
    {
      labelKey: "tithi",
      value: `${pakshaDisplay} ${panchang.tithi}`,
      meaning: tithiMeaning,
    },
    {
      labelKey: "nakshatra",
      value: panchang.nakshatra,
      meaning: nakshatraMeaning,
    },
    {
      labelKey: "yoga",
      value: panchang.yoga,
      meaning: yogaMeaning,
    },
    {
      labelKey: "karana",
      value: panchang.karana,
      meaning: karanaMeaning,
    },
    {
      labelKey: "vara",
      value: panchang.vara,
      meaning: varaMeaning,
    },
  ];

  return (
    <div className="p-8 rounded-[2rem] shadow-sm space-y-6 border transition-all duration-1000 bg-white border-[#F1E7D0] text-[#3F2D1D]">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 border-[#F1E7D0]/60">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest block text-amber-800/80">
            {isHindi ? "पंचांग पञ्जिका" : "Panchang Almanac"}
          </p>
          <h3 className="text-lg font-serif tracking-wide font-light text-[#3F2D1D]">
            {isHindi ? "काल के पाँच पवित्र अंग" : "Five Sacred Limbs of Time"}
          </h3>
        </div>
        <Calendar className="w-5 h-5 text-amber-700" />
      </div>

      {/* Five Limbs */}
      <div className="space-y-4">
        {limbs.map((limb, i) => (
          <div
            key={i}
            className="flex items-start justify-between py-1 border-b last:border-0 border-[#F1E7D0]/30"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider block text-[#3F2D1D]/50">
                {isHindi
                  ? LIMB_LABELS[limb.labelKey]?.hi
                  : LIMB_LABELS[limb.labelKey]?.en}
              </span>
              <span className="text-sm font-medium font-serif text-[#3F2D1D]">
                {limb.value}
              </span>
            </div>
            <div className="text-right max-w-[200px]">
              <span className="text-xs font-light italic leading-normal block text-[#3F2D1D]/70">
                {limb.meaning}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Auspicious / Caution Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6 border-[#F1E7D0]/60">
        {/* Abhijit Kaal */}
        <div className="p-4 rounded-2xl border flex items-start gap-3 shadow-sm bg-amber-50/60 border-amber-200/80">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest block text-amber-800">
              {SLOT_LABELS.abhijit[isHindi ? "hi" : "en"].header}
            </span>
            <span className="text-xs font-semibold block text-[#3F2D1D]">
              {panchang.abhijitKaal.start} – {panchang.abhijitKaal.end}
            </span>
            <span className="text-[10px] block text-[#3F2D1D]/60">
              {SLOT_LABELS.abhijit[isHindi ? "hi" : "en"].desc}
            </span>
          </div>
        </div>

        {/* Rahu Kaal */}
        <div className="p-4 rounded-2xl border flex items-start gap-3 shadow-sm bg-rose-50/60 border-rose-100/80">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-widest block text-rose-800">
              {SLOT_LABELS.rahu[isHindi ? "hi" : "en"].header}
            </span>
            <span className="text-xs font-semibold block text-[#3F2D1D]">
              {panchang.rahuKaal.start} – {panchang.rahuKaal.end}
            </span>
            <span className="text-[10px] block text-[#3F2D1D]/60">
              {SLOT_LABELS.rahu[isHindi ? "hi" : "en"].desc}
            </span>
          </div>
        </div>
      </div>

      {/* Today Favors */}
      <div className="p-5 rounded-[1.5rem] border space-y-3 bg-[#FBFBF9] border-[#F1E7D0]">
        <span className="text-[9px] font-bold uppercase tracking-widest block text-[#3F2D1D]/60">
          {isHindi ? "आज अनुकूल है" : "Today Favors"}
        </span>
        <ul className="space-y-2">
          {favorsList.map((favor, index) => (
            <li
              key={index}
              className="flex gap-2 items-start text-xs font-light text-[#3F2D1D]/80"
            >
              <span className="mt-0.5 text-amber-700/60">•</span>
              <p>{favor}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
