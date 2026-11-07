// Hindi renderings of the daily-briefing strings, copied from src/components/MorningBriefCard.tsx (web) — keep in sync.

export const getLocalizedHeadline = (headline: string, isHindi: boolean) => {
  if (!isHindi) return headline;
  const h = headline.trim().toLowerCase();
  
  // Deterministic template headlines
  if (h.includes("structured execution phase")) {
    return "संरचित कर्म चरण — आज अपनी ऊर्जा को नए कार्यों के बजाय पूर्व-निर्धारित दायित्वों को पूरा करने में लगाएं।";
  }
  if (h.includes("strategic boldness phase")) {
    return "रणनीतिक साहस चरण — आज साहसिक निर्णय लेने और महत्वाकांक्षी परियोजनाओं को गति देने के लिए समय अनुकूल है।";
  }
  if (h.includes("collaborative expansion phase")) {
    return "सहयोगात्मक विस्तार चरण — आज साझेदारों के साथ मिलकर काम करने और सामूहिक विकास पर ध्यान केंद्रित करने का अवसर है।";
  }
  if (h.includes("internal integration phase")) {
    return "आंतरिक एकीकरण चरण — आज गहरे आत्म-मंथन, विश्राम और अपने मानसिक संतुलन को सुदृढ़ करने पर ध्यान दें।";
  }
  if (h.includes("adaptive observation phase")) {
    return "अनुकूलनशील अवलोकन चरण — आज कोई भी बड़ा कदम उठाने से बचें और शांत रहकर केवल परिस्थितियों का सूक्ष्म निरीक्षण करें।";
  }

  if (h.includes("momentum is building") && h.includes("architect")) {
    return "गति बढ़ रही है — संरेखित स्थिरता आज के लाभ को बढ़ाएगी।";
  }
  if (h.includes("momentum is building") && h.includes("warrior")) {
    return "गति बढ़ रही है — निर्णायक ऊर्जा आज के लाभ को बढ़ाएगी।";
  }
  if (h.includes("steady conditions favor consistent")) {
    return "स्थिर परिस्थितियाँ प्रतिक्रियाशील निर्णयों के बजाय निरंतर और विचारशील प्रगति के अनुकूल हैं।";
  }
  if (h.includes("elevated complexity today")) {
    return "आज जटिलता बढ़ी हुई है — सोच-समझकर की गई प्रतिक्रियाएँ हमेशा सहज प्रवृत्ति से बेहतर प्रदर्शन करती हैं।";
  }
  if (h.includes("this is a phase for building")) {
    return "यह निर्माण का चरण है, विस्तार का नहीं — अनुशासित नींव दीर्घकालिक लाभ देती है।";
  }
  return headline;
};

export const getLocalizedFocus = (item: string, isHindi: boolean) => {
  if (!isHindi) return item;
  const lower = item.toLowerCase();
  if (lower.includes("structured planning")) return "संरचित योजना";
  if (lower.includes("active listening")) return "सक्रिय श्रवण";
  if (lower.includes("stay consistent")) return "निरंतरता बनाए रखें";
  if (lower.includes("review your plans")) return "अपनी योजनाओं की समीक्षा करें";
  if (lower.includes("build structure")) return "संरचना का निर्माण करें";
  if (lower.includes("practice deliberate pauses")) return "आज कोई भी बड़ा संकल्प लेने से पहले विचारपूर्ण विराम लें";
  if (lower.includes("begin consolidating momentum")) {
    return "आगामी चरण से पहले अपनी गति को सुदृढ़ करना शुरू करें";
  }
  if (lower.includes("collaborating on shared goals")) return "साझे लक्ष्यों पर सहयोग";
  if (lower.includes("initiating important projects")) return "महत्वपूर्ण परियोजनाएं आरंभ करना";
  if (lower.includes("restructuring routines")) return "दिनचर्या का पुनर्गठन";
  if (lower.includes("mindful restraint")) return "सचेत संयम";
  if (lower.includes("refining active workflows")) return "सक्रिय कार्यप्रवाह को परिष्कृत करना";
  if (lower.includes("nurturing key relationships")) return "प्रमुख संबंधों का पोषण";
  if (lower.includes("taking new initiatives")) return "नई पहलें करना";
  if (lower.includes("expanding network")) return "सामूहिक संपर्क बढ़ाना";
  if (lower.includes("capitalizing on momentum")) return "गतिशीलता का लाभ उठाना";
  if (lower.includes("stay grounded in reality")) return "यथार्थ में स्थिर रहें";
  return item;
};

export const getLocalizedAvoid = (item: string, isHindi: boolean) => {
  if (!isHindi) return item;
  const lower = item.toLowerCase();
  if (lower.includes("reactionary emails")) return "प्रतिक्रियाशील ई-मेल";
  if (lower.includes("unplanned spending")) return "अनायोजित व्यय";
  if (lower.includes("shortcuts")) return "शॉर्टकट (जल्दबाज़ी)";
  if (lower.includes("impulsive spending")) return "जल्दबाज़ी में खर्च";
  if (lower.includes("speculative risks")) return "सट्टा जोखिम";
  if (lower.includes("impulsive commitments")) return "जल्दबाज़ी में वादे";
  if (lower.includes("avoid over-committing")) return "अति-प्रतिबद्धता से बचें";
  return item;
};

