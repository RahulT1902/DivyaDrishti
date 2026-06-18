// ── DivyaDrishti Panchang Formatter ──────────────────────────────────────────
// Converts raw Sanskrit astronomical limb names into practical, high-trust
// and premium quality descriptors. Bridges ancient limbs with daily life.
// Phase 1: bilingual — English and Hindi (Vedic / Sanskritic tone for hi).

// ── ENGLISH QUALITY MAPS ─────────────────────────────────────────────────────

export const TITHI_QUALITIES: Record<string, string> = {
  Pratipada: "New beginnings & planting seeds",
  Dwitiya: "Cooperation & building alliances",
  Tritiya: "Action, energy & progress",
  Chaturthi: "Overcoming obstacles & restraint",
  Panchami: "Wisdom, learning & clarity",
  Shashthi: "Discipline, health & service",
  Saptami: "Friendship, travel & harmony",
  Ashtami: "Transformation & inner strength",
  Navami: "Courage, challenge & resolve",
  Dashami: "Success, power & leadership",
  Ekadashi: "Purification, fasting & devotion",
  Dwadashi: "Generosity, charity & release",
  Trayodashi: "Renewal, healing & pleasure",
  Chaturdashi: "Introspection & deep meditation",
  Purnima: "Peak energy, fullness & clarity",
  Amavasya: "Quiet stillness & ancestral honor"
};

export const NAKSHATRA_QUALITIES: Record<string, string> = {
  Ashwini: "Swift healing & vital starts",
  Bharani: "Deep transition & creative spark",
  Krittika: "Sharp clarity & purification",
  Rohini: "Nourishing, growth & beauty",
  Mrigashira: "Curious search & gentle paths",
  Ardra: "Cleansing storms & renewal",
  Punarvasu: "Harmonious return & safe shelter",
  Pushya: "Divine nourishment & wisdom",
  Ashlesha: "Intense focus & boundary defense",
  Magha: "Noble heritage & royal authority",
  "Purva Phalguni": "Relaxation, charm & social ease",
  "Uttara Phalguni": "Devoted union & helpful service",
  Hasta: "Skillful hands & mental agility",
  Chitra: "Brilliant design & elegant form",
  Swati: "Independent movement & fresh breeze",
  Vishakha: "Targeted ambition & shared focus",
  Anuradha: "Loyal devotion & friendship harmony",
  Jyeshtha: "Masterful control & senior wisdom",
  Mula: "Root extraction & radical truth",
  "Purva Ashadha": "Invincible spirit & fluid talent",
  "Uttara Ashadha": "Enduring success & deep integrity",
  Shravana: "Deep listening & higher learning",
  Dhanishtha: "Rhythmic wealth & shared goals",
  Shatabhisha: "Hundred healers & quiet isolation",
  "Purva Bhadrapada": "Passionate dedication & intense truth",
  "Uttara Bhadrapada": "Stable foundations & calm depths",
  Revati: "Safe passage & final completion"
};

export const YOGA_QUALITIES: Record<string, string> = {
  Vishkumbha: "Overcoming hidden challenges",
  Priti: "Joy, connection & mutual delight",
  Ayushman: "Longevity, health & vitality",
  Saubhagya: "Good fortune & auspicious flow",
  Shobhana: "Grace, beauty & elegance",
  Atiganda: "Navigating deep emotional obstacles",
  Sukarma: "Righteous deeds & skilled execution",
  Dhriti: "Steadfast patience & determination",
  Shula: "Resolving internal conflict",
  Ganda: "Managing sudden surprises",
  Vridhi: "Expansive growth & accumulation",
  Dhruva: "Immovable stability & focus",
  Vyaghata: "Deflecting opposition strategically",
  Harshana: "Lightness, humor & celebration",
  Vajra: "Indestructible willpower",
  Siddhi: "Flawless achievement & skill",
  Vyatipata: "Deep introspection & caution",
  Variyan: "Prestige, comfort & abundance",
  Parigha: "Safeguarding your boundaries",
  Shiva: "Auspicious peace & devotion",
  Siddha: "Natural mastery & ease",
  Sadhya: "Disciplined attainment",
  Shubha: "Pure blessings & radiant health",
  Shukla: "Luminous clarity & simplicity",
  Brahma: "Creative focus & spiritual study",
  Indra: "Strategic leadership & presence",
  Vaidhriti: "Quiet restraint & inner refuge"
};

export const KARANA_QUALITIES: Record<string, string> = {
  Bava: "Initiating productive actions",
  Balava: "Quiet work behind the scenes",
  Kaulava: "Building community & harmony",
  Taitila: "Organizing & preparing assets",
  Gara: "Hard labor & physical grounding",
  Vanija: "Fair trade & commerce planning",
  Vishti: "Defensive measures & deep rest",
  Shakuni: "Strategic counseling & advice",
  Chatushpada: "Caring for animals & nature",
  Naga: "Firm roots & silent endurance",
  Kimstughna: "Joyous dedication to a cause"
};

// ── HINDI QUALITY MAPS (Vedic / Sanskritic tone) ──────────────────────────────

export const TITHI_QUALITIES_HI: Record<string, string> = {
  Pratipada: "नई शुरुआत और बीज रोपण",
  Dwitiya: "सहयोग और मेलजोल की नींव",
  Tritiya: "क्रिया, ऊर्जा और प्रगति",
  Chaturthi: "बाधाओं पर विजय, संयम",
  Panchami: "विद्या, ज्ञान और स्पष्टता",
  Shashthi: "अनुशासन, स्वास्थ्य और सेवा",
  Saptami: "मित्रता, यात्रा और सामंजस्य",
  Ashtami: "रूपांतरण और आंतरिक बल",
  Navami: "साहस, चुनौती और संकल्प",
  Dashami: "सफलता, शक्ति और नेतृत्व",
  Ekadashi: "शुद्धि, उपवास और भक्ति",
  Dwadashi: "दान, उदारता और मुक्ति",
  Trayodashi: "नवीनीकरण, उपचार और आनंद",
  Chaturdashi: "आत्मचिंतन और गहरी साधना",
  Purnima: "पूर्ण ऊर्जा, परिपूर्णता और प्रकाश",
  Amavasya: "मौन, स्थिरता और पितृ सम्मान"
};

export const NAKSHATRA_QUALITIES_HI: Record<string, string> = {
  Ashwini: "शीघ्र उपचार और जीवनशक्ति",
  Bharani: "गहरा संक्रमण और सृजन",
  Krittika: "तेज स्पष्टता और शुद्धि",
  Rohini: "पोषण, वृद्धि और सौंदर्य",
  Mrigashira: "जिज्ञासु खोज और कोमल पथ",
  Ardra: "शुद्धिकरण, तूफान और नवीनीकरण",
  Punarvasu: "सुरक्षित लौटना और आश्रय",
  Pushya: "दिव्य पोषण और प्रज्ञा",
  Ashlesha: "गहन एकाग्रता और सीमा-रक्षा",
  Magha: "राजसी विरासत और सम्मान",
  "Purva Phalguni": "विश्राम, आकर्षण और सामाजिक सुगमता",
  "Uttara Phalguni": "समर्पित मिलन और सेवाभाव",
  Hasta: "कुशल हाथ और मानसिक चपलता",
  Chitra: "उज्ज्वल डिजाइन और सुंदर रूप",
  Swati: "स्वतंत्र गति और ताजी हवा",
  Vishakha: "लक्षित महत्वाकांक्षा और साझा ध्यान",
  Anuradha: "निष्ठावान मित्रता और सौहार्द",
  Jyeshtha: "परिपक्व नियंत्रण और वरिष्ठ प्रज्ञा",
  Mula: "जड़ तक खोज और मूलभूत सत्य",
  "Purva Ashadha": "अजेय भावना और प्रवाहशील प्रतिभा",
  "Uttara Ashadha": "स्थायी सफलता और गहरी ईमानदारी",
  Shravana: "गहन श्रवण और उच्च अध्ययन",
  Dhanishtha: "लयबद्ध समृद्धि और साझे लक्ष्य",
  Shatabhisha: "सौ उपचारक और एकांत साधना",
  "Purva Bhadrapada": "उत्कट समर्पण और गहन सत्य",
  "Uttara Bhadrapada": "स्थिर नींव और शांत गहराई",
  Revati: "सुरक्षित मार्ग और अंतिम पूर्णता"
};

export const YOGA_QUALITIES_HI: Record<string, string> = {
  Vishkumbha: "छिपी बाधाओं पर विजय",
  Priti: "आनंद, जुड़ाव और पारस्परिक प्रसन्नता",
  Ayushman: "दीर्घायु, स्वास्थ्य और जीवनशक्ति",
  Saubhagya: "शुभ भाग्य और अनुकूल प्रवाह",
  Shobhana: "अनुग्रह, सौंदर्य और लालित्य",
  Atiganda: "गहरी भावनात्मक बाधाओं का सामना",
  Sukarma: "धर्मपूर्ण कर्म और कुशल कार्य",
  Dhriti: "दृढ़ धैर्य और संकल्प",
  Shula: "आंतरिक द्वंद्व का समाधान",
  Ganda: "अचानक आश्चर्यों का सामना",
  Vridhi: "विस्तारित वृद्धि और संचय",
  Dhruva: "अटल स्थिरता और एकाग्रता",
  Vyaghata: "विरोध को कुशलतापूर्वक टालना",
  Harshana: "हल्कापन, हास्य और उत्सव",
  Vajra: "अटूट इच्छाशक्ति",
  Siddhi: "निर्दोष उपलब्धि और कौशल",
  Vyatipata: "गहरा आत्मचिंतन और सावधानी",
  Variyan: "प्रतिष्ठा, आराम और समृद्धि",
  Parigha: "अपनी सीमाओं की रक्षा",
  Shiva: "शुभ शांति और भक्ति",
  Siddha: "स्वाभाविक निपुणता और सहजता",
  Sadhya: "अनुशासित उपलब्धि",
  Shubha: "शुद्ध आशीर्वाद और उज्ज्वल स्वास्थ्य",
  Shukla: "प्रकाशमान स्पष्टता और सरलता",
  Brahma: "सृजनात्मक एकाग्रता और आध्यात्मिक अध्ययन",
  Indra: "रणनीतिक नेतृत्व और उपस्थिति",
  Vaidhriti: "मौन संयम और आंतरिक शरण"
};

export const KARANA_QUALITIES_HI: Record<string, string> = {
  Bava: "उत्पादक कार्यों की शुरुआत",
  Balava: "पर्दे के पीछे शांत कार्य",
  Kaulava: "समुदाय निर्माण और सामंजस्य",
  Taitila: "व्यवस्था और संपत्ति तैयारी",
  Gara: "कठोर परिश्रम और भौतिक स्थिरता",
  Vanija: "उचित व्यापार और वाणिज्य योजना",
  Vishti: "रक्षात्मक उपाय और गहरा विश्राम",
  Shakuni: "रणनीतिक सलाह और मार्गदर्शन",
  Chatushpada: "पशुओं और प्रकृति की देखभाल",
  Naga: "दृढ़ जड़ें और मौन सहनशीलता",
  Kimstughna: "किसी कारण के प्रति आनंदमय समर्पण"
};

// ── VARA (Weekday) Hindi names & ruling planet meaning ────────────────────────

export const VARA_MEANING_HI: Record<string, string> = {
  Sunday:    "रवि — आत्मप्रकाश, नेतृत्व और संकल्प",
  Monday:    "सोम — मन, भाव और अंतःप्रेरणा",
  Tuesday:   "मंगल — साहस, क्रिया और दृढ़ता",
  Wednesday: "बुध — वाणी, विवेक और व्यापार",
  Thursday:  "गुरु — ज्ञान, विस्तार और शुभता",
  Friday:    "शुक्र — सौंदर्य, सुख और संबंध",
  Saturday:  "शनि — अनुशासन, धैर्य और कर्मफल"
};

export const VARA_MEANING_EN: Record<string, string> = {
  Sunday:    "Ruled by the Sun — self-expression & leadership",
  Monday:    "Ruled by the Moon — emotion, intuition & receptivity",
  Tuesday:   "Ruled by Mars — courage, action & resolve",
  Wednesday: "Ruled by Mercury — intellect, speech & trade",
  Thursday:  "Ruled by Jupiter — wisdom, expansion & auspiciousness",
  Friday:    "Ruled by Venus — beauty, pleasure & connection",
  Saturday:  "Ruled by Saturn — discipline, patience & karma"
};

// ── PANCHANG LIMB LABELS (bilingual) ──────────────────────────────────────────

export const LIMB_LABELS: Record<
  string,
  { en: string; hi: string }
> = {
  tithi:    { en: "Tithi (Lunar Day)",     hi: "तिथि (चंद्र दिवस)"   },
  nakshatra:{ en: "Nakshatra (Luminary)",  hi: "नक्षत्र (लुमिनरी)"   },
  yoga:     { en: "Yoga (Union)",          hi: "योग (संयोग)"          },
  karana:   { en: "Karana (Action Seg.)",  hi: "करण (क्रिया खंड)"    },
  vara:     { en: "Vara (Day of Week)",    hi: "वार (सप्ताह दिवस)"   },
};

export const SLOT_LABELS = {
  abhijit: {
    en: { header: "Abhijit Kaal (Auspicious)", desc: "Peak auspicious window for decisive starts." },
    hi: { header: "अभिजित काल (शुभ)",          desc: "निर्णायक शुरुआत के लिए श्रेष्ठ मुहूर्त।" },
  },
  rahu: {
    en: { header: "Rahu Kaal (Caution)", desc: "Avoid initiating new transactions or projects." },
    hi: { header: "राहु काल (सावधानी)",  desc: "नए कार्य या लेन-देन आरंभ करने से बचें।" },
  },
};

/**
 * Returns 2-3 specific behavioral recommendations supported by today's alignments.
 */
export function getTodayFavors(nakshatra: string, tithi: string, lang: "en" | "hi" = "en"): string[] {
  const favors: string[] = [];

  const groundingNakshatras = ["Rohini", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada", "Anuradha", "Hasta"];
  const intellectualNakshatras = ["Ashwini", "Mrigashira", "Punarvasu", "Chitra", "Swati", "Shravana", "Revati"];
  const dynamicNakshatras = ["Krittika", "Bharani", "Magha", "Vishakha", "Dhanishtha", "Purva Ashadha"];

  if (groundingNakshatras.includes(nakshatra)) {
    favors.push(lang === "hi" ? "स्थिर कार्य और ढांचागत अपडेट" : "grounding work & structural updates");
  } else if (intellectualNakshatras.includes(nakshatra)) {
    favors.push(lang === "hi" ? "रणनीतिक योजना और शांत संवाद" : "strategic planning & patient conversations");
  } else if (dynamicNakshatras.includes(nakshatra)) {
    favors.push(lang === "hi" ? "निर्णायक कदम और लंबित कार्यों का समाधान" : "decisive action & resolving backlog");
  } else {
    favors.push(lang === "hi" ? "मौन अवलोकन और आत्म-कैलिब्रेशन" : "quiet observation & self-calibration");
  }

  if (["Pratipada", "Dwitiya", "Tritiya", "Panchami", "Dashami", "Purnima"].includes(tithi)) {
    favors.push(lang === "hi" ? "साझे लक्ष्यों पर सहयोग" : "collaborating on shared goals");
    favors.push(lang === "hi" ? "महत्वपूर्ण परियोजनाएं आरंभ करना" : "initiating important projects");
  } else if (["Chaturthi", "Ashtami", "Navami", "Chaturdashi", "Amavasya"].includes(tithi)) {
    favors.push(lang === "hi" ? "दिनचर्या पुनर्गठन और आत्मशुद्धि" : "restructuring routines & decluttering");
    favors.push(lang === "hi" ? "सावधान संयम और गहन अध्ययन" : "mindful restraint & deep study");
  } else {
    favors.push(lang === "hi" ? "सक्रिय कार्यप्रवाह को परिष्कृत करना" : "refining active workflows");
    favors.push(lang === "hi" ? "प्रमुख संबंधों का पोषण" : "nurturing key relationships");
  }

  return favors.slice(0, 3);
}
