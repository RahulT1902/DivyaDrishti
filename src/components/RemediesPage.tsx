"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, HelpCircle, Heart, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Remedy {
  category: string;
  icon: string;
  title: string;
  description: string;
  detail: string;
  color: string;
}

const colorMap: Record<string, { bg: string; border: string; badge: string; iconBg: string; text: string }> = {
  indigo:  { bg: "bg-white", border: "border-[#F1E7D0] hover:border-indigo-300/40", badge: "bg-indigo-50 text-indigo-800 border-indigo-200", iconBg: "bg-indigo-50", text: "text-indigo-900/80" },
  amber:   { bg: "bg-white", border: "border-[#F1E7D0] hover:border-amber-300/40", badge: "bg-amber-50 text-amber-800 border-amber-200", iconBg: "bg-amber-50", text: "text-amber-900/80" },
  orange:  { bg: "bg-white", border: "border-[#F1E7D0] hover:border-orange-300/40", badge: "bg-orange-50 text-orange-800 border-orange-200", iconBg: "bg-orange-50", text: "text-orange-900/80" },
  emerald: { bg: "bg-white", border: "border-[#F1E7D0] hover:border-emerald-300/40", badge: "bg-emerald-50 text-emerald-800 border-emerald-200", iconBg: "bg-emerald-50", text: "text-emerald-900/80" },
  purple:  { bg: "bg-white", border: "border-[#F1E7D0] hover:border-purple-300/40", badge: "bg-purple-50 text-purple-800 border-purple-200", iconBg: "bg-purple-50", text: "text-purple-900/80" },
  rose:    { bg: "bg-white", border: "border-[#F1E7D0] hover:border-rose-300/40", badge: "bg-rose-50 text-rose-800 border-rose-200", iconBg: "bg-rose-50", text: "text-rose-900/80" },
};

const PLANET_NAMES_HI: Record<string, string> = {
  Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु"
};

const translatePlanetHi = (name: string) => {
  return PLANET_NAMES_HI[name] || name;
};

/** Build domain-specific remedies for natal friction areas. */
function getNatalFrictionRemedies(chartData: any, isHindi: boolean): Remedy[] {
  const di = chartData?.domainIntelligence;
  if (!di) return [];
  const list: any[] = Array.isArray(di) ? di : Object.values(di);
  const frictionDomains = list.filter(
    (item: any) => typeof item.pressureLevel === "number" && item.pressureLevel >= 6
  );
  if (frictionDomains.length === 0) return [];

  return frictionDomains.slice(0, 2).map((item: any): Remedy => {
    const domain: string = item.domain || "general";
    const restrictive: string[] = Array.isArray(item.restrictiveFactors) ? item.restrictiveFactors.slice(0, 2) : [];

    if (domain === "career") {
      return {
        category: isHindi ? "जन्म-चार्ट कार्यक्षेत्र दबाव" : "Natal Career Friction",
        icon: "🏛️",
        title: isHindi ? "मंगल/शनि घर्षण निवारण: अनुशासित आउटपुट लॉग" : "Career Friction: Disciplined Output Log",
        description: isHindi
          ? `आपके जन्म-चार्ट में कार्यक्षेत्र पर दबाव है (${restrictive.join("; ") || "ग्रहीय प्रभाव"}). नियमित कार्य-लॉग से इस दबाव को अनुशासन में बदला जा सकता है।`
          : `Your natal chart shows career friction (${restrictive.join("; ") || "planetary influence"}). A daily output log converts this friction into discipline.`,
        detail: isHindi
          ? "प्रतिदिन सायंकाल ३ कार्यों को लिखें जो आपने पूरे किए और एक जो कल पूरा होगा। यह आत्म-जवाबदेही शनि के दबाव को उत्पादकता में बदलती है।"
          : "Each evening, write 3 tasks completed and 1 to carry forward tomorrow. This self-accountability converts Saturn-Mars pressure into forward momentum.",
        color: "indigo",
      };
    }
    if (domain === "finance") {
      return {
        category: isHindi ? "जन्म-चार्ट धन-क्षेत्र दबाव" : "Natal Finance Friction",
        icon: "🌾",
        title: isHindi ? "शुक्र/बुध घर्षण निवारण: साप्ताहिक व्यय लेखा" : "Finance Friction: Weekly Expense Ritual",
        description: isHindi
          ? `आपके जन्म-चार्ट में धन-क्षेत्र पर दबाव है (${restrictive.join("; ") || "ग्रहीय प्रभाव"}). साप्ताहिक व्यय जांच इस दबाव को नियंत्रण में लाती है।`
          : `Your chart shows financial pressure (${restrictive.join("; ") || "planetary influence"}). A weekly expense review anchors this friction into conscious control.`,
        detail: isHindi
          ? "प्रत्येक रविवार अपने सप्ताह के व्यय को ध्यानपूर्वक देखें। एक अनावश्यक व्यय चुनें जिसे घटाया जा सकता है। यह छोटा कदम वित्तीय जागरूकता विकसित करता है।"
          : "Every Sunday, review the week's spending mindfully. Identify one discretionary expense to reduce. This small discipline builds long-term financial awareness.",
        color: "emerald",
      };
    }
    return {
      category: isHindi ? "जन्म-चार्ट जीवन-क्षेत्र दबाव" : "Natal Life Friction",
      icon: "🌀",
      title: isHindi ? "जीवन के दबाव क्षेत्र: मौन दैनिक स्मरण" : "Life Friction: Silent Daily Grounding",
      description: isHindi
        ? `आपके जन्म-चार्ट में सामान्य जीवन-क्षेत्र में दबाव है (${restrictive.join("; ") || "ग्रहीय प्रभाव"}). दैनिक मौन-समय इसे स्थिर करता है।`
        : `Your chart shows general life-area friction (${restrictive.join("; ") || "planetary influence"}). Daily quiet time stabilizes this pressure.`,
      detail: isHindi
        ? "प्रतिदिन प्रातः ५ मिनट एकांत में बिताएं — बिना फोन, बिना कार्यसूची के। केवल श्वास और वर्तमान क्षण। यह सरल अभ्यास चेतना को स्थिर करता है।"
        : "Spend 5 minutes each morning in complete quiet — no phone, no agenda. Just breath and presence. This simple practice stabilizes consciousness under friction.",
      color: "amber",
    };
  });
}

export default function RemediesPage({ chartData, setActiveTab }: { chartData?: any; setActiveTab: (t: any) => void }) {
  const { isHindi } = useLanguage();
  const md = chartData?.temporal?.stack?.mahadasha || "Saturn";
  const ad = chartData?.temporal?.stack?.antardasha || "Jupiter";

  const getRemediesForPlanet = (planet: string, isMahadasha: boolean): Remedy => {
    const cleanPlanet = planet.trim().toLowerCase();
    const activeLabel = isHindi 
      ? (isMahadasha ? "सक्रिय महादशा अनुष्ठान" : "अंतर्दशा संरेखण")
      : (isMahadasha ? "Active Mahadasha Ritual" : "Antardasha Alignment");

    if (cleanPlanet === "saturn") {
      return {
        category: activeLabel,
        icon: "🪔",
        title: isHindi ? "शनिवार दीप दान एवं मौन सेवा" : "Saturday Oil Diya & Silent Service",
        description: isHindi
          ? "शनि देव निस्वार्थ सेवा के माध्यम से जीवन में एकाग्रता और धैर्य की शिक्षा देते हैं। शनिवार की संध्या को पश्चिम दिशा की ओर मुख करके तिल या सरसों के तेल का एक दीपक शांत भाव से प्रज्वलित करें।"
          : "Saturn teaches focus and patience through selfless service. Light a sesame or mustard oil lamp on Saturday evenings, ideally in a quiet corner facing west.",
        detail: isHindi
          ? "शनिवार को मूक पशुओं को भोजन कराएं, मौन उपवास का पालन करें अथवा अपने कार्य में पूर्ण अनुशासन लाएं। प्रतिक्रिया देने के स्थान पर शांत धैर्य का अभ्यास करें।"
          : "Channel Saturn's energy by feeding street animals, observing a quiet fast, or committing to focused work. Practice silent patience rather than reactiveness.",
        color: "indigo",
      };
    }
    if (cleanPlanet === "jupiter") {
      return {
        category: activeLabel,
        icon: "📚",
        title: isHindi ? "गुरुवार स्वाध्याय एवं कृतज्ञता लेखन" : "Thursday Wisdom & Gratitude Journaling",
        description: isHindi
          ? "गुरु ग्रह ज्ञान, विवेक और आत्मिक विस्तार के प्रतीक हैं। गुरुवार की सुबह को जीवन के प्रति कृतज्ञता व्यक्त करने, ज्ञानवर्धक ग्रंथों का अध्ययन करने या गुरु वचनों पर विचार करने के लिए समर्पित करें।"
          : "Jupiter governs wisdom and spiritual expansion. Dedicate Thursday mornings to writing in a gratitude journal, reading inspirational literature, or reflecting on guidance.",
        detail: isHindi
          ? "अपने परिवेश में पीले या सुनहरे रंगों का प्रयोग करें। निर्धन बच्चों की शिक्षा में सहायता करें, अपने गुरुओं और मार्गदर्शकों का आदर करें और आंतरिक संतोष की भावना बढ़ाएं।"
          : "Incorporate yellow or warm golden tones in your space. Support educational charities, show deep respect to your mentors, and cultivate a sense of inner abundance.",
        color: "amber",
      };
    }
    if (cleanPlanet === "mars") {
      return {
        category: activeLabel,
        icon: "🚩",
        title: isHindi ? "मंगलवार कायिक योग एवं मौन साहस" : "Tuesday Active Movement & Quiet Courage",
        description: isHindi
          ? "मंगल देव पराक्रम, ऊर्जा और प्रत्यक्ष कर्म के स्वामी हैं। मंगलवार के दिन अपनी शारीरिक ऊर्जा को सूर्य नमस्कार जैसे यौगिक अभ्यासों या एकाग्रता वाले कार्यों में लगाएं।"
          : "Mars rules strength, energy, and direct action. Channel physical intensity into deep yoga (Surya Namaskar) or highly focused manual tasks on Tuesdays.",
        detail: isHindi
          ? "कोई भी बड़ा निर्णय लेने से पूर्व कम से कम ५ मिनट मौन रहें। अपने कर्मों को निस्वार्थ सेवा के रूप में समर्पित करने से तात्कालिक आवेग शांत होता है और इच्छाशक्ति सुदृढ़ होती है।"
          : "Spend 5-10 minutes in absolute silence before making big decisions. Dedicating your efforts to selfless actions cools impulse and builds mature willpower.",
        color: "rose",
      };
    }
    if (cleanPlanet === "venus") {
      return {
        category: activeLabel,
        icon: "🤍",
        title: isHindi ? "शुक्रवार कला, सौहार्द एवं निस्वार्थ मधुरता" : "Friday Art, Harmony & Benevolence",
        description: isHindi
          ? "शुक्र देव संबंधों में मधुरता, सौंदर्य और रचनात्मकता का प्रतिनिधित्व करते हैं। शुक्रवार के दिन अपने आसपास के परिवेश को स्वच्छ, कलात्मक और सामंजस्यपूर्ण बनाने पर ध्यान दें।"
          : "Venus governs relationships, beauty, and creative refinement. Dedicate Fridays to bringing neatness, clean aesthetics, and gentle harmony to your immediate space.",
        detail: isHindi
          ? "अपनी वाणी और व्यवहार में मिठास लाएं। निर्धन व्यक्तियों की सहायता करें अथवा पशु आश्रयों में दान देकर शुक्र की शुद्ध संतोष ऊर्जा को जागृत करें।"
          : "Bring absolute sweetness to your words and interactions. Consider donating simple food or supporting shelters to manifest Venus's highest energy of pure content.",
        color: "purple",
      };
    }
    if (cleanPlanet === "mercury") {
      return {
        category: activeLabel,
        icon: "🌱",
        title: isHindi ? "बुधवार डिजिटल मौन एवं संज्ञानात्मक शुद्धि" : "Wednesday Digital Silence & Cognitive Cleansing",
        description: isHindi
          ? "बुध देव वाणी, तंत्रिका तंत्र और बौद्धिक स्पष्टता के स्वामी हैं। बुधवार के दिन सोशल मीडिया और गैर-जरूरी डिजिटल सूचनाओं से सचेत होकर विराम लें।"
          : "Mercury governs speech, the nervous system, and intellectual clarity. Spend Wednesdays taking a conscious digital break—muting non-urgent notification loops.",
        detail: isHindi
          ? "बच्चों की शिक्षा में योगदान दें, पक्षियों को हरा चारा खिलाएं और आगामी सप्ताह के लक्ष्यों को लिखित रूप में सुव्यवस्थित करें।"
          : "Support children's learning, feed green fodder to birds or animals, and organize your thoughts by writing out structured goals for the week ahead.",
        color: "emerald",
      };
    }
    if (cleanPlanet === "sun") {
      return {
        category: activeLabel,
        icon: "☀️",
        title: isHindi ? "दैनिक सूर्योदय अर्घ्य एवं आत्म-संरेखण" : "Daily Sunrise Warmth & Water Offering",
        description: isHindi
          ? "सूर्य देव आंतरिक प्राण शक्ति और आत्म-बल के प्रदाता हैं। अपनी सुबह की शुरुआत उगते हुए सूर्य के प्रकाश में बैठकर और उनकी दिव्य ऊर्जा को आत्मसात करके करें।"
          : "The Sun represents core vitality and inner authority. Begin your mornings by stepping into the early morning sunlight, absorbing solar alignment directly.",
        detail: isHindi
          ? "सूर्योदय के समय तांबे के पात्र से पौधों को जल (अर्घ्य) अर्पित करें। अपनी रीढ़ को सीधा करें, तीन गहरी सांसें लें और शांत चित्त से आत्म-नेतृत्व का संकल्प लें।"
          : "Pour water slowly from a copper vessel to a green plant at sunrise. Re-center your spine, take three deep belly breaths, and affirm your quiet self-leadership.",
        color: "orange",
      };
    }
    if (cleanPlanet === "moon") {
      return {
        category: activeLabel,
        icon: "🌊",
        title: isHindi ? "सोमवार जल साधना एवं भावनात्मक शांति" : "Monday Hydration & Emotional Calming",
        description: isHindi
          ? "चंद्र देव मन की चंचलता, भावनात्मक लय और आंतरिक शांति के स्वामी हैं। सोमवार के दिन पर्याप्त जल ग्रहण करें और नाड़ी शोधन प्राणायाम का अभ्यास करें।"
          : "The Moon rules emotional rhythms, intuitive sensing, and peace of mind. Cultivate steady hydration and deep, alternate-nostril breathing (Pranayama) on Mondays.",
        detail: isHindi
          ? "मानसिक शीतलता के लिए शिवलिंग या किसी पवित्र नदी के पत्थर पर धीरे-धीरे जल अर्पित करें। रात को समय पर सोएं ताकि आपकी नींद का चक्र सुरक्षित रहे।"
          : "Pour water slowly over a Shiva Lingam or simple river stone as a mental cooling practice. Wind down early in the evening to protect your sleep cycle.",
        color: "indigo",
      };
    }
    if (cleanPlanet === "rahu") {
      return {
        category: activeLabel,
        icon: "🐕",
        title: isHindi ? "दैहिक भूमि जुड़ाव एवं डिजिटल उपवास" : "Grounding Earth Walk & Digital Fasting",
        description: isHindi
          ? "राहु मन में भ्रम, अत्यधिक उत्तेजना और अनवरत विचारों को जन्म देता है। इस संवेदी अधिभार को शांत करने के लिए मिट्टी या घास पर नंगे पैर चलें।"
          : "Rahu represents overstimulation, illusions, and mental chatter. Counteract sensory overload by walking barefoot on soil or grass to reconnect with the earth.",
        detail: isHindi
          ? "जटिल समाचारों और सोशल media के उपभोग को अत्यंत सीमित करें। मूक पशुओं या बेसहारा कुत्तों को भोजन कराएं ताकि आप स्क्रीन की दुनिया से बाहर आकर वास्तविक धरातल से जुड़ सकें।"
          : "Limit complex news and social media consumption. Spend time feeding street dogs or wild birds to stay firmly grounded in biological reality rather than screens.",
        color: "purple",
      };
    }
    // Ketu default
    return {
      category: activeLabel,
      icon: "🧘",
      title: isHindi ? "प्राणायाम साधना एवं अनासक्ति अभ्यास" : "Pranayama Breathing & Non-Attachment Practice",
      description: isHindi
        ? "केतु अंतर्मुखी चिंतन और आध्यात्मिक मोक्ष का कारक है। प्रतिदिन १० मिनट अनुलोम-विलोम प्राणायाम का अभ्यास करें ताकि ऊर्जा का प्रवाह संतुलित हो सके।"
        : "Ketu represents introverted contemplation and spiritual release. Practice 10 minutes of slow alternate-nostril breathing (Anulom Vilom) to calm energetic flow.",
      detail: isHindi
        ? "किसी जरूरतमंद को कंबल या गर्म वस्त्र दान करें। किसी भी परिणाम के प्रति कठोर आग्रह छोड़ने का अभ्यास करें और अपनी चेतना को आंतरिक शांति की ओर मोड़ें।"
        : "Donate warm, multi-colored blankets to a local shelter. Practice letting go of rigid expectations, directing your focus to quiet, interior wisdom.",
      color: "purple",
    };
  };

  const mdRemedy = getRemediesForPlanet(md, true);
  const adRemedy = getRemediesForPlanet(ad, false);

  const remediesList: Remedy[] = [
    mdRemedy,
    adRemedy,
    {
      category: isHindi ? "दैनिक कायिक स्थिरता" : "Daily Grounding",
      icon: "☀️",
      title: isHindi ? "सूर्योदय आत्म-संरेखण" : "Solar Sunrise Re-alignment",
      description: isHindi
        ? "प्रतिदिन ५ मिनट उगते सूर्य की किरणों में बैठें। गहरी सांसें लें और अपनी शारीरिक मुद्रा को प्राकृतिक सुबह के चक्र के साथ जोड़ें।"
        : "Spend 5 minutes soaking in early morning sunlight. Breathe deeply and align your physical posture with the natural daybreak cycle.",
      detail: isHindi
        ? "यह सरल अभ्यास सूर्य देव के तेज और प्राण शक्ति को बढ़ाता है, जिससे आसपास की नकारात्मकताओं के प्रति एक सुदृढ़ रक्षा कवच का निर्माण होता है।"
        : "This simple daily alignment strengthens the Sun's core vitality, establishing a powerful energetic shield against ambient frictions.",
      color: "orange",
    },
    {
      category: isHindi ? "मानसिक स्पष्टता" : "Mental Clarity",
      icon: "🌱",
      title: isHindi ? "बुधवार लिखित विचार विसर्जन" : "Wednesday Written Brain-Dump",
      description: isHindi
        ? "प्रत्येक बुधवार की सुबह, अपने दिमाग में चल रहे सभी विचारों, कार्यों और चिंताओं को एक कागज पर लिखकर खाली कर लें।"
        : "Every Wednesday morning, clear your cognitive workspace by performing a complete braindump of all active thoughts, to-dos, and worries onto paper.",
      detail: isHindi
        ? "बुध देव तब अत्यंत सक्रिय होते हैं जब सूचनाओं को बाहर निकालकर व्यवस्थित किया जाता है। यह मानसिक व्याकुलता को शांत करने का एक श्रेष्ठ साधन है।"
        : "Mercury flourishes when information is externalized and structured. Excellent for relieving anxiety and organizing your week.",
      color: "emerald",
    },
    {
      category: isHindi ? "भावनात्मक अवलंब" : "Emotional Anchor",
      icon: "🧘",
      title: isHindi ? "10 मिनट नाड़ी शोधन प्राणायाम" : "10-Minute Alternate Breathing",
      description: isHindi
        ? "प्रतिदिन १० मिनट अनुलोम-विलोम (नाड़ी शोधन) प्राणायाम का अभ्यास करें, अधिमानतः सूर्योदय से पूर्व अथवा सोने से ठीक पहले।"
        : "Practice Anulom Vilom (alternate nostril breathing) for 10 minutes daily, preferably before sunrise or just before going to sleep.",
      detail: isHindi
        ? "यह मष्तिष्क के दोनों गोलार्धों को संतुलित करता है, अशांत विचारों को शांत करता है और प्रतिकूल ग्रहीय प्रभावों को शिथिल करता है।"
        : "Balances the left and right hemispheres of the brain, settling chaotic thought patterns and calming high planetary pressures.",
      color: "purple",
    },
    {
      category: isHindi ? "अनुशासित डिजिटल मौन" : "Disciplined Fasting",
      icon: "🪔",
      title: isHindi ? "सायंकालीन सचेत डिजिटल विश्राम" : "Conscious Evening Digital Mute",
      description: isHindi
        ? "सायंकाल के समय शांत विश्राम का नियम बनाएं। रात्रि ९:०० बजे तक अपने फोन को मौन करें और बाहरी संघर्षों से ध्यान हटाने के लिए एक दीपक प्रज्वलित करें।"
        : "Establish a ritual of quiet evening containment. Silence your phone by 9:00 PM and light a simple candle or diya to signal the end of external striving.",
      detail: isHindi
        ? "यह अनुशासित नियम शनि देव की स्थिरता ऊर्जा को संचालित करता है, जिससे गहरी, स्वास्थ्यवर्धक नींद और मानसिक स्पष्टता प्राप्त होती है।"
        : "This practice of disciplined containment channels Saturn's stabilizing energy, promoting deep restorative sleep and clarity.",
      color: "indigo",
    },
  ];

  const natalFrictionRemedies = getNatalFrictionRemedies(chartData, isHindi);

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#3F2D1D] p-6 font-sans relative overflow-hidden transition-all duration-1000">
      
      {/* ambient warm background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-800/5 to-transparent blur-[120px] rounded-full animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Title Block */}
        <div className="border-b border-[#F1E7D0] pb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif tracking-wide font-light">
              {isHindi ? "साधना एवं " : "Rituals & "}<span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600 font-serif">{isHindi ? "संरेखण उपाय" : "Remedies"}</span>
            </h2>
            <p className="text-xs text-amber-800/60 uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-amber-600" />
              {isHindi 
                ? `आपके वर्तमान ${translatePlanetHi(md)} / ${translatePlanetHi(ad)} महादशा चक्र के अनुकूल कायिक एवं व्यवहारिक संरेखण`
                : `Somatic & Behavioral Alignment for your ${md} / ${ad} cycle`}
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white border border-[#F1E7D0] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#3F2D1D]/60">
              {isHindi ? "शांत विश्वास प्रणाली" : "Calm Trust Architecture"}
            </span>
          </div>
        </div>

        {/* Spiritual Guidance Frame Contract */}
        <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-2xl border border-[#F1E7D0] shrink-0">
            <HelpCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1.5 text-left">
            <h4 className="text-sm font-semibold text-[#3F2D1D]">{isHindi ? "वैदिक संरेखण के विषय में" : "About Vedic Alignment"}</h4>
            <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light">
              {isHindi
                ? "पारंपरिक वैदिक ज्योतिष में, उपाय कोई अंधविश्वास या बाहरी कर्मकांड नहीं हैं। वे वास्तव में दैहिक और व्यवहारिक संरेखण (somatic & behavioral pivots) हैं, जिन्हें हमारे तंत्रिका तंत्र को संतुलित करने और जीवन में सचेत अनुशासन विकसित करने के लिए तैयार किया गया है। हम भय पर आधारित उपचारों या महंगे रत्नों के स्थान पर उन शांत आदतों का समर्थन करते हैं जो आपके आत्म-बल को सुदृढ़ बनाती हैं।"
                : "In classical Vedic Jyotish, remedies are not transactional transactions or superstitious cures. They are somatic, behavioral pivots designed to stabilize the nervous system and build conscious discipline. We avoid expensive gemstones or fear-inducing dosha pacifications in favor of calming habits that anchor your agency."}
            </p>
          </div>
        </div>

        {/* Natal Friction Remedies — shown only when pressureLevel >= 6 domains exist */}
        {natalFrictionRemedies.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 shrink-0">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-800 uppercase tracking-widest">
                  {isHindi ? "जन्म-चार्ट घर्षण क्षेत्र" : "Natal Chart Friction Areas"}
                </h3>
                <p className="text-[11px] text-rose-700/60 mt-0.5">
                  {isHindi
                    ? "आपके जन्म-चार्ट में ये क्षेत्र अतिरिक्त ध्यान और अनुशासन मांगते हैं"
                    : "These life areas carry structural pressure in your birth chart — targeted practice helps"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {natalFrictionRemedies.map((remedy, i) => {
                const c = colorMap[remedy.color] || colorMap.rose;
                return (
                  <motion.div
                    key={`friction-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className={`${c.bg} border ${c.border} rounded-2xl p-5 shadow-sm ring-1 ring-rose-200/40 space-y-3 relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50/60 rounded-bl-3xl pointer-events-none" />
                    <div className="flex items-start gap-3">
                      <span className={`text-xl p-2 ${c.iconBg} rounded-xl border border-rose-200/50`}>{remedy.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${c.badge} uppercase tracking-widest`}>
                            {remedy.category}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-widest">
                            {isHindi ? "प्राथमिकता" : "Priority"}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#3F2D1D] leading-snug">{remedy.title}</h4>
                      </div>
                    </div>
                    <p className={`text-xs ${c.text} leading-relaxed font-light`}>{remedy.description}</p>
                    <div className="border-t border-rose-100 pt-3">
                      <p className="text-[11px] text-[#3F2D1D]/50 leading-relaxed font-light">{remedy.detail}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Remedies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {remediesList.map((remedy, i) => {
            const c = colorMap[remedy.color] || colorMap.indigo;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.8 }}
                className={`rounded-3xl border p-6 ${c.bg} ${c.border} flex flex-col justify-between hover:shadow-md hover:shadow-amber-500/5 transition-all`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 border rounded-full ${c.badge}`}>
                      {remedy.category}
                    </span>
                    <span className="text-2xl">{remedy.icon}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-serif font-medium text-[#3F2D1D]">{remedy.title}</h3>
                    <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light">{remedy.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F1E7D0]/60 bg-[#F8F5EF]/50 p-3 rounded-2xl">
                  <p className={`text-[11px] leading-relaxed italic ${c.text}`}>{remedy.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA to Chat */}
        <div className="relative overflow-hidden bg-white border border-[#F1E7D0] rounded-[2.5rem] p-10 text-center shadow-sm">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-600/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="max-w-xl mx-auto space-y-6 relative z-10">
            <span className="text-3xl">📿</span>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-light text-[#3F2D1D]">
                {isHindi ? "व्यक्तिगत मार्गदर्शन की शंका है?" : "Seek Personalised Clarification?"}
              </h3>
              <p className="text-xs text-[#3F2D1D]/75 leading-relaxed font-light">
                {isHindi
                  ? "यदि आप वर्तमान में किसी गंभीर मानसिक दबाव, विलंब या निर्णय लेने में व्यवधान का सामना कर रहे हैं, तो आप पंडित जी से चैट द्वारा परामर्श कर सकते हैं। अपनी सक्रिय महादशा के अनुकूल शांत व व्यावहारिक मार्गदर्शन प्राप्त करें।"
                  : "If you are going through a particularly intense period of delay or decision friction, you can consult the Pundit. Receive quiet, grounded advice to navigate your active mahadasha."}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("chat")}
              className={`inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-800 to-amber-600 hover:from-amber-900 hover:to-amber-700 text-white text-xs font-semibold rounded-full transition-all shadow-sm hover:shadow-amber-500/10 cursor-pointer active:scale-95 ${isHindi ? 'tracking-normal text-sm' : 'tracking-widest'}`}
            >
              {isHindi ? "पंडित जी से संवाद करें →" : "Ask the Pundit →"}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 flex items-center justify-between border-t border-[#F1E7D0] text-[9px] font-serif tracking-widest text-amber-800/40 uppercase">
          <span>{isHindi ? "निस्वार्थ कर्म (कर्मयोग) ही सबसे बड़ा रक्षा कवच है" : "Selfless action (Karma Yoga) is the ultimate shield"}</span>
          <span>{isHindi ? "सत्यापित वैदिक सत्यता" : "Verified Vedic Integrity"}</span>
        </div>

      </div>
    </div>
  );
}
