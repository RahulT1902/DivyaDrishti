// Remedy content, copied from src/components/RemediesPage.tsx (web) — keep in sync.

export interface Remedy {
  category: string;
  icon: string;
  title: string;
  description: string;
  detail: string;
  color: string;
}

export function getNatalFrictionRemedies(chartData: any, isHindi: boolean): Remedy[] {
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

/** Mahadasha + antardasha rituals followed by the five daily practices. */
export function getDashaRemedies(md: string, ad: string, isHindi: boolean): Remedy[] {
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
  return remediesList;
}
