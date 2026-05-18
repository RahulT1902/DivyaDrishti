"use client";

import React from "react";
import { motion } from "framer-motion";

interface Remedy {
  category: string;
  icon: string;
  title: string;
  description: string;
  detail: string;
  color: string;
}

const colorMap: Record<string, { bg: string; border: string; badge: string; iconBg: string }> = {
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-100",  badge: "bg-indigo-100 text-indigo-700",  iconBg: "bg-indigo-100" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-100",   badge: "bg-amber-100 text-amber-700",    iconBg: "bg-amber-100" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-100",  badge: "bg-orange-100 text-orange-700",  iconBg: "bg-orange-100" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", badge: "bg-emerald-100 text-emerald-700",iconBg: "bg-emerald-100" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-100",  badge: "bg-purple-100 text-purple-700",  iconBg: "bg-purple-100" },
  rose:    { bg: "bg-rose-50",    border: "border-rose-100",    badge: "bg-rose-100 text-rose-700",      iconBg: "bg-rose-100" },
};

export default function RemediesPage({ chartData }: { chartData?: any }) {
  const md = chartData?.temporal?.stack?.mahadasha || "Saturn";
  const ad = chartData?.temporal?.stack?.antardasha || "Jupiter";

  const getRemediesForPlanet = (planet: string, isMahadasha: boolean): Remedy => {
    const cleanPlanet = planet.trim().toLowerCase();
    if (cleanPlanet === "saturn") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "🪔",
        title: "Light a Sesame Oil Diya on Saturdays",
        description: "Saturn responds deeply to sincere, disciplined devotion. Light a sesame oil lamp on Saturday evenings, ideally facing west.",
        detail: "Recite: ॐ शं शनैश्चराय नमः (Om Sham Shanaishcharaya Namah) 108 times. This strengthens Saturn's positive influence.",
        color: "indigo",
      };
    }
    if (cleanPlanet === "jupiter") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "🌼",
        title: "Wear Yellow & Worship Guru on Thursdays",
        description: "Wear yellow or saffron clothing on Thursdays. Offer yellow flowers to a Vishnu or Guru idol. Eat turmeric-infused food.",
        detail: "Jupiter governs your wisdom and expansion. Strengthening Jupiter accelerates positive outcomes in your current phase. Recite: ॐ बृं बृहस्पतये नमः (Om Brim Brihaspataye Namah) 108 times.",
        color: "amber",
      };
    }
    if (cleanPlanet === "mars") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "🚩",
        title: "Hanuman Chalisa & Red on Tuesdays",
        description: "Worship Lord Hanuman and wear red on Tuesdays. Hanuman Chalisa reading is universally considered the most powerful remedy for Mars-related difficulties.",
        detail: "Recite it at sunrise. This helps balance energy and reduces impulsive tendencies. Recite: ॐ अं अंगारकाय नमः (Om Am Angarakaya Namah) 108 times.",
        color: "rose",
      };
    }
    if (cleanPlanet === "venus") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "🤍",
        title: "Offer White Flowers on Fridays",
        description: "Wear white or cream clothing on Fridays and donate milk, curd or rice to the needy.",
        detail: "Venus rules relationships, luxury and artistic pursuits. Recite: ॐ शुं शुक्राय नमः (Om Shum Shukraya Namah) 108 times.",
        color: "purple",
      };
    }
    if (cleanPlanet === "mercury") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "📿",
        title: "Green Moong Dal & Intellect on Wednesdays",
        description: "Donate green moong dal or green vegetables on Wednesdays. Supporting Mercury improves communication and business clarity.",
        detail: "Wear green clothing on Wednesdays and support educational causes. Chant: ॐ बुं बुधाय नमः (Om Bum Budhaye Namah) 108 times.",
        color: "emerald",
      };
    }
    if (cleanPlanet === "sun") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "☀️",
        title: "Surya Arghya at Sunrise",
        description: "Offer water in a copper vessel to the rising Sun daily while chanting Surya mantras.",
        detail: "Strengthening the Sun boosts your career visibility, vitality, and overall command. Recite: ॐ घृणि सूर्याय नमः (Om Ghrini Suryaya Namah) 108 times.",
        color: "orange",
      };
    }
    if (cleanPlanet === "moon") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "🌊",
        title: "Offer Water/Milk to Shiva on Mondays",
        description: "Perform Shiva Abhishekam with water or milk on Mondays to calm the mind and soothe emotions.",
        detail: "Strengthening the Moon stabilizes emotions and intuitive alignment. Recite: ॐ सों सोमाय नमः (Om Som Somaya Namah) 108 times.",
        color: "indigo",
      };
    }
    if (cleanPlanet === "rahu") {
      return {
        category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
        icon: "🐕",
        title: "Feed Black Dogs & Donate Sesame Seeds",
        description: "Feed street dogs, especially black dogs, and donate sesame seeds or coal to pacify Rahu's erratic illusions.",
        detail: "Recite: ॐ रां राहवे नमः (Om Ram Rahave Namah) 108 times to gain mental clarity and shield against anxiety.",
        color: "purple",
      };
    }
    // Ketu default
    return {
      category: isMahadasha ? "Active Mahadasha Remedy" : "Antardasha Support",
      icon: "🧘",
      title: "Worship Lord Ganesha & Practice Pranayama",
      description: "Donate multi-colored blankets to the needy and worship Lord Ganesha, the lord of obstacles.",
      detail: "Recite: ॐ कें केतवे नमः (Om Kem Ketave Namah) 108 times to enhance spiritual insights and ground yourself.",
      color: "purple",
    };
  };

  const mdRemedy = getRemediesForPlanet(md, true);
  const adRemedy = getRemediesForPlanet(ad, false);

  const remediesList: Remedy[] = [
    mdRemedy,
    adRemedy,
    {
      category: "General Wellbeing",
      icon: "☀️",
      title: "Morning Surya Namaskar",
      description: "Perform 12 rounds of Surya Namaskar before sunrise to strengthen the Sun and boost overall physical and mental vitality.",
      detail: "The Sun is the king of the zodiac; keeping it strong acts as a shield against almost all planetary frictions.",
      color: "orange",
    },
    {
      category: "Mercury Boost",
      icon: "📿",
      title: "Green on Wednesdays",
      description: "Support your communication and logic systems by eating green vegetables or wearing green on Wednesdays.",
      detail: "Excellent for career decisions, negotiations, and analytical precision. Chant: ॐ बुं बुधाय नमः.",
      color: "emerald",
    },
    {
      category: "Emotional Anchor",
      icon: "🧘",
      title: "Daily 10-Minute Pranayama",
      description: "Anulom Vilom (alternate nostril breathing) for 10 minutes daily balances the nervous system and calms planetary pressures.",
      detail: "Practicing mindfulness reduces stress, delays, and decision frictions.",
      color: "purple",
    },
    {
      category: "Spiritual Practice",
      icon: "📖",
      title: "Hanuman Chalisa Reading",
      description: "Worship Lord Hanuman, the ultimate pacifier of planetary friction and the lord of courageous actions.",
      detail: "Read it on Tuesdays or Saturdays to mitigate delays, fear, and obstacles in your current cycle.",
      color: "rose",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pt-4 space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-amber-900">Remedies & Suggestions</h2>
        <p className="text-sm text-amber-700/50">Personalised Vedic remedies based on your {md} Mahadasha / {ad} Antardasha</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
        <span className="text-xl shrink-0">ℹ️</span>
        <p className="text-xs text-amber-800/70 leading-relaxed">
          These remedies are derived from classical Vedic Jyotish texts and personalised to your birth chart configuration. They are spiritual suggestions, not medical or financial advice. For gemstone recommendations, always consult a qualified Jyotishi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {remediesList.map((remedy, i) => {
          const c = colorMap[remedy.color] || colorMap.indigo;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border p-6 shadow-sm ${c.bg} ${c.border}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${c.iconBg}`}>
                  {remedy.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${c.badge}`}>
                    {remedy.category}
                  </span>
                  <h3 className="text-base font-serif font-semibold text-amber-900 mb-2 leading-snug">{remedy.title}</h3>
                  <p className="text-sm text-amber-800/60 leading-relaxed mb-3">{remedy.description}</p>
                  <div className="p-3 bg-white/60 rounded-xl border border-white/80">
                    <p className="text-xs text-amber-700/70 leading-relaxed italic">{remedy.detail}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-white border border-[#F1E7D0] rounded-2xl p-8 text-center shadow-sm">
        <span className="text-3xl mb-3 block">🌟</span>
        <h3 className="text-lg font-serif font-semibold text-amber-900 mb-2">Want a personalised remedy consultation?</h3>
        <p className="text-sm text-amber-700/50 mb-5">Ask the Pundit for specific guidance on your current challenges and the most effective remedies for your chart.</p>
        <button className="px-6 py-3 bg-amber-600 text-white text-sm font-bold rounded-full hover:bg-amber-700 transition-colors shadow-sm">
          Ask the Pundit →
        </button>
      </div>
    </div>
  );
}
