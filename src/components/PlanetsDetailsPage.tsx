"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info, Compass, Shield, HelpCircle, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface PlanetData {
  name: string;
  sanskrit: string;
  sign: string;
  house: number;
  status: string;
  degree: string;
  isRetrograde: boolean;
  isCombust: boolean;
  isVargottama: boolean;
}

const signNames = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const PLANET_NAMES_HI: Record<string, string> = {
  Lagna: "लग्न",
  Sun: "सूर्य",
  Moon: "चंद्र",
  Mars: "मंगल",
  Mercury: "बुध",
  Jupiter: "गुरु",
  Venus: "शुक्र",
  Saturn: "शनि",
  Rahu: "राहु",
  Ketu: "केतु",
};

const ZODIAC_SIGNS_HI: Record<string, string> = {
  Aries: "मेष",
  Taurus: "वृषभ",
  Gemini: "मिथुन",
  Cancer: "कर्क",
  Leo: "सिंह",
  Virgo: "कन्या",
  Libra: "तुला",
  Scorpio: "वृश्चिक",
  Sagittarius: "धनु",
  Capricorn: "मकर",
  Aquarius: "कुंभ",
  Pisces: "मीन",
};

const STATUS_HI: Record<string, string> = {
  Retrograde: "वक्री",
  Combust: "अस्त",
  Exalted: "उच्च",
  Debilitated: "नीच",
  Dominant: "बलवान",
  Strong: "सुदृढ़",
  Neutral: "सामान्य",
  Stable: "स्थिर",
  Sensitive: "संवेदनशील",
  Supportive: "अनुकूल",
  Active: "सक्रिय",
  Ascendant: "लग्न",
};

const translatePlanet = (name: string, isHindi: boolean) => {
  return isHindi ? (PLANET_NAMES_HI[name] || name) : name;
};

const translateZodiac = (sign: string, isHindi: boolean) => {
  return isHindi ? (ZODIAC_SIGNS_HI[sign] || sign) : sign;
};

const translateStatus = (status: string, isHindi: boolean) => {
  if (!status) return "";
  return isHindi ? (STATUS_HI[status] || status) : status;
};

function getSignName(num: number): string {
  if (num >= 1 && num <= 12) return signNames[num - 1];
  return "Unknown";
}

// Generate premium narrative descriptions, archetypes, themes, and somatic touchpoints
function getPlanetArchetype(planet: string, sign: string, retrograde: boolean, combust: boolean, isHindi: boolean) {
  const pName = planet.trim().toLowerCase();
  const sName = sign.trim().toLowerCase();

  if (isHindi) {
    const planetHi = PLANET_NAMES_HI[planet] || planet;
    const signHi = ZODIAC_SIGNS_HI[sign] || sign;

    switch (pName) {
      case "lagna":
        return {
          sanskrit: "लग्न",
          role: "दृष्टिकोण एवं प्राथमिक प्रत्यक्ष बोध (Filter of Reality)",
          archetype: `${sName === "aries" ? "अग्रगामी पथप्रदर्शक (Pioneer)" : sName === "taurus" ? "दृढ़ संरक्षक (Custodian)" : sName === "gemini" ? "संवाद सेतु एवं जिज्ञासु (Translator)" : sName === "cancer" ? "भावनात्मक शरणस्थल (Sanctuary)" : sName === "leo" ? "तेजस्वी संप्रभु (Sovereign)" : sName === "virgo" ? "पवित्र शोधक (Alchemist)" : sName === "libra" ? "सौहार्द के शिल्पी (Architect of Harmony)" : sName === "scorpio" ? "गूढ़ आंतरिक खोजी (Underworld Voyager)" : sName === "sagittarius" ? "ज्ञान के पथिक (Pilgrim)" : sName === "capricorn" ? "शिखर निर्माता (Summit Builder)" : sName === "aquarius" ? "भावी दृष्टा (Visionary)" : "अनंत के स्वप्नद्रष्टा (Dreamer of Infinity)"}`,
          theme: "स्वत्वबोध एवं प्राथमिक प्रत्यक्ष ज्ञान",
          narrative: `आपका ${signHi} लग्न उस प्राथमिक आकाशीय लेंस को दर्शाता है जिसके माध्यम से आप इस संसार का अनुभव करते हैं। आप केवल जीवन नहीं जीते—आप इसे एक विशिष्ट दृष्टिकोण से देखते हैं। ${signHi} लग्न के साथ, आप जीवन में स्वभावतः ${sName === "aries" ? "प्रत्यक्ष कर्म और नवीन मार्गों के प्रवर्तन" : sName === "taurus" ? "संवेदी सौंदर्य की सराहना, सहज गति और भौतिक समृद्धि" : sName === "gemini" ? "बौद्धिक जुड़ाव, वैचारिक सेतु और कौतूहलपूर्ण जिज्ञासा" : sName === "cancer" ? "भावनात्मक सुरक्षा, सहज अंतर्ज्ञान और ममतामयी संरक्षण" : sName === "leo" ? "सृजनात्मक अभिव्यक्ति, तेजस्वी दृश्यता और उदारता" : sName === "virgo" ? "सूक्ष्म शुद्धिकरण, कायिक सुव्यवस्था और सेवा भावना" : sName === "libra" ? "सौंदर्यबोध, संबंधों में संतुलन और कूटनीति" : sName === "scorpio" ? "मनोवैज्ञानिक अन्वेषण, छाया से प्रकाश की यात्रा और पूर्ण प्रामाणिकता" : sName === "sagittarius" ? "दार्शनिक खोज, ज्ञान का विस्तार और प्राकृतिक नियमों का संरेखण" : sName === "capricorn" ? "व्यावहारिक कर्तव्य, कर्म की पराकाष्ठा और स्थायी विरासत" : sName === "aquarius" ? "प्रणालीगत नवाचार, सामूहिक समन्वय और लोक-कल्याण" : "आध्यात्मिक प्रवाह, सीमाओं का विसर्जन और कलात्मक संवेदना"} की ओर अग्रसर होते हैं।`,
          shadowTendency: `${signHi} लग्न कभी-कभी अपने प्राथमिक लेंस के साथ अत्यधिक तादात्म्य स्थापित कर लेता है — और इस आंशिक दृष्टिकोण को ही पूर्ण सत्य मान बैठता है। सजग रहें कि कहीं आप ${sName === "aries" ? "बिना सोचे-समझे आवेग में आकर कर्म तो नहीं कर रहे हैं" : sName === "taurus" ? "अनावश्यक रूप से सुख-सुविधाओं से चिपक कर बदलाव का विरोध तो नहीं कर रहे" : sName === "gemini" ? "अनेक विचारों में बिखरकर गहराई से बच तो नहीं रहे" : sName === "cancer" ? "अति-सुरक्षात्मक होकर अपने ही शरणस्थल को कारागार तो नहीं बना रहे" : sName === "leo" ? "अभिव्यक्ति के स्थान पर बाहरी सराहना तो नहीं ढूंढ रहे" : sName === "virgo" ? "सहज स्वीकार्यता की जगह निरंतर मीन-मेख तो नहीं निकाल रहे" : sName === "libra" ? "अशांति से बचने के लिए अपनी आवश्यकताओं से समझौता तो नहीं कर रहे" : sName === "scorpio" ? "अनावश्यक रूप से दूसरों के विश्वास की कठोर परीक्षा तो नहीं ले रहे" : sName === "sagittarius" ? "आचरण में ढालने के बजाय केवल उपदेश तो नहीं दे रहे" : sName === "capricorn" ? "अपनी संवेदनशीलता को छिपाने के लिए अति-कठोरता का प्रदर्शन तो नहीं कर रहे" : sName === "aquarius" ? "भावनात्मक दूरी बनाकर अत्यधिक तटस्थ तो नहीं हो रहे" : "दूसरों में पूरी तरह विलीन होकर स्वयं की सीमाएं तो नहीं खो रहे"}।`,
          groundingGuidance: "प्रतिदिन एक क्षण के लिए ठहरें और अपने लग्न के स्वचालित प्रतिक्रिया चक्र को देखें। केवल साक्षी भाव से देखना ही संतुलन की शुरुआत है।",
          somatic: "रीढ़ की हड्डी को सीधा करें, सांस को नाभि तक गहरा उतरने दें और अपने अस्तित्व की शांत उपस्थिति को महसूस करें।",
          glow: "from-indigo-500/10 to-purple-500/5",
          borderColor: "border-[#5E387B]/40"
        };

      case "sun":
        return {
          sanskrit: "सूर्य",
          role: "आत्मबल एवं प्राण ऊर्जा (Core Vitality)",
          archetype: `तेजस्वी ${sName === "leo" || sName === "aries" ? "आत्मबल के संप्रभु" : "शांत संकल्प के संप्रभु"}`,
          theme: "नैतिक प्रामाणिकता एवं रचनात्मक संप्रभुता",
          narrative: `${signHi} राशि में सूर्य देव आपकी प्राण-शक्ति, आत्म-बोध और आपके नेतृत्व कौशल को प्रभावित करते हैं। ${signHi} राशि में, आपका आत्मबल तब सर्वाधिक देदीप्यमान होता है जब आप ${sName === "aries" || sName === "leo" || sName === "sagittarius" ? "उदारता, प्रेरणादायक कर्म और निर्भीक आत्म-नेतृत्व का प्रदर्शन करते हैं" : sName === "taurus" || sName === "virgo" || sName === "capricorn" ? "धैर्यपूर्वक दीर्घकालिक संरचनाओं और नैतिक मूल्यों का निर्माण करते हैं" : sName === "gemini" || sName === "libra" || sName === "aquarius" ? "नवीन विचारों और व्यवस्थाओं को समाज में प्रवाहित करते हैं" : "भावनात्मक सत्य और गहरी रचनात्मक अंतर्मुखता को संजोते हैं"}।`,
          shadowTendency: `सूर्य देव का असंतुलन आत्म-मूल्य के लिए बाहरी अनुमोदन की भूख पैदा करता है। ${signHi} में, यह ${sName === "leo" || sName === "aries" ? "आंतरिक संरेखण के स्थान पर प्रदर्शन करने और तालियों की चाह रखने" : sName === "virgo" || sName === "capricorn" ? "अपने अस्तित्व को केवल कर्म और उत्पादकता से तोलने" : "वैध महसूस करने के लिए दूसरों की राय पर अत्यधिक निर्भर रहने"} के रूप में प्रकट हो सकता है। जब स्वाभिमान संवेदनशीलता में बदलने लगे, तो सचेत हो जाएं।`,
          groundingGuidance: "दैनिक रूप से बिना किसी दर्शक या सराहना की अपेक्षा के एक छोटा सा नैतिक कार्य करें। आपके एकांत के निर्णय ही आपके चरित्र का निर्माण करते हैं।",
          somatic: "कंधों को पीछे की ओर ढीला करें, छाती को थोड़ा खोलें और सूर्य चक्र (सोलर प्लेक्सस) पर हाथ रखकर आंतरिक ऊष्मा को महसूस करें।",
          glow: "from-amber-500/15 to-orange-500/5",
          borderColor: "border-[#C59B27]/40"
        };

      case "moon":
        return {
          sanskrit: "चंद्र",
          role: "मन की स्थिति एवं भावनात्मक भूदृश्य (Emotional Landscape)",
          archetype: `${sName === "cancer" || sName === "taurus" ? "दृढ़ ममतामयी संरक्षक" : sName === "scorpio" ? "गहन सहज अंतर्ज्ञानी" : "ब्रह्मांडीय चेतना के पथिक"}`,
          theme: "कायिक सुरक्षा एवं अवचेतन मन",
          narrative: `${signHi} राशि में चंद्र देव आपके मन के कोमल हिस्से को प्रभावित करते हैं, जो यह तय करता है कि आप तनाव का प्रबंधन कैसे करते हैं और भावनात्मक सुरक्षा कैसे पाते हैं। ${signHi} में, आपका भावनात्मक तंत्र ${sName === "sagittarius" ? "स्वतंत्रता, गतिशीलता और आध्यात्मिक संदर्भ में सुरक्षित महसूस करता है। आपको एक साधना की आवश्यकता है जो मन को शांत रखे" : sName === "cancer" || sName === "taurus" ? "संवेदी सुखों, शांत घरेलू वातावरण और पुराने विश्वासपात्र संबंधों में फलता-फूलता है" : sName === "scorpio" ? "को पूर्ण और वास्तविक सत्य की आवश्यकता होती है। आप भावनाओं को तीव्र गहराई से अनुभव करते हैं और मौन साधना से स्वस्थ रहते हैं" : "को स्पष्टता, आश्वासन और मानसिक सुव्यवस्था की आवश्यकता होती है"}।`,
          shadowTendency: `चंद्र देव का असंतुलित प्रभाव तात्कालिक आवेग को ही अंतर्ज्ञान समझने की भूल कराता है। ${signHi} में, यह ${sName === "cancer" || sName === "taurus" ? "अति-अधिकार भावना और पुरानी चीजों को छोड़ पाने में असमर्थता" : sName === "scorpio" ? "भावनात्मक परीक्षा लेने, एकांत में सिमटने और उत्तेजना को गहराई समझ बैठने" : sName === "sagittarius" ? "भावनात्मक जिम्मेदारी से बचकर स्वतंत्रता के नाम पर भागने" : "भावों को अनुभव करने के बजाय केवल उन पर तर्क करने"} के रूप में उभरता है।`,
          groundingGuidance: "भावनात्मक प्रतिक्रिया देने से पूर्व तीन गहरी और सजग सांसें लें। उत्तेजना और प्रतिक्रिया के बीच का यह सूक्ष्म मौन ही आपकी भावनात्मक परिपक्वता है।",
          somatic: "आँखें बंद करें, एक गहरी और धीमी सांस छोड़ें, और देखें कि कहीं आपके जबड़े या छाती में कोई खिंचाव तो नहीं है।",
          glow: "from-blue-500/10 to-indigo-500/5",
          borderColor: "border-[#4A69B1]/30"
        };

      case "saturn":
        return {
          sanskrit: "शनि",
          role: "धैर्य, अनुशासन एवं साधना के आचार्य (Master Teacher)",
          archetype: "काल के अनुशासित सूत्रधार",
          theme: "व्यावहारिक सीमाएं एवं आध्यात्मिक दृढ़ता",
          narrative: `${signHi} राशि में शनि देव आपके जीवन में संयम, एकाग्रता और समय की मांग का प्रतिनिधित्व करते हैं। वे शत्रु नहीं, बल्कि एक परम गुरु हैं जो कठोर अनुशासन से शुद्ध करते हैं। ${signHi} में, शनि देव आपको ${sName === "capricorn" || sName === "aquarius" ? "संरचनात्मक दायित्व, दीर्घकालिक दृढ़ता और कर्तव्य पथ पर चलना" : sName === "aries" || sName === "scorpio" ? "आवेग को नियंत्रित कर ऊर्जा को परिपक्व और रणनीतिक संकल्प में ढालना" : "कल्पनाओं से बाहर निकलकर यथार्थ की ठोस नींव का निर्माण करना"} सिखा रहे हैं। ${retrograde ? "वक्री होने के कारण, शनि देव सीमाओं और अतीत के निर्णयों के आंतरिक पुनर्मूल्यांकन की अपेक्षा रखते हैं।" : ""}`,
          shadowTendency: `शनि देव का असंतुलन मन में यह हीन भावना पैदा करता है कि आपने अभी तक आराम या सफलता अर्जित नहीं की है। ${signHi} में, यह ${sName === "aries" ? "गति धीमी होने पर स्वयं की अत्यधिक आलोचना करने" : sName === "libra" ? "संबंधों में अत्यधिक संकोच और संशय रखने" : "अनावश्यक तैयारी में उलझकर काम शुरू करने से कतराने"} के रूप में उभरता है। ध्यान दें जब अनुशासन स्वयं को दण्डित करने लगे।`,
          groundingGuidance: "स्वयं को एक अवास्तविक मानक में बांधने से बचें। शनि देव का आशीर्वाद निरंतर अभ्यास से मिलता है, पूर्णता से नहीं। इस सप्ताह स्वयं पर लादे गए किसी एक कठोर समय-सीमा को शिथिल करें।",
          somatic: "अपने पैरों को जमीन पर मजबूती से टिकाएं। धरती की गुरुत्वाकर्षण शक्ति और उसकी अचलता को अपने शरीर में महसूस करें।",
          glow: "from-slate-500/15 to-indigo-500/5",
          borderColor: "border-[#5F6368]/30"
        };

      case "jupiter":
        return {
          sanskrit: "गुरु",
          role: "उच्च ज्ञान, प्रज्ञा एवं कृपा प्रवाह (Wisdom & Grace)",
          archetype: "कृपालु एवं प्रबुद्ध मार्गदर्शक",
          theme: "दैवीय अनुकम्पा एवं उदार दृष्टिकोण",
          narrative: `${signHi} राशि में गुरु देव आपकी विवेक क्षमता, प्राकृतिक सहज ज्ञान और बौद्धिक उदारता के स्वामी हैं। ${signHi} में, आपकी कृपा को आकर्षित करने की क्षमता तब जाग्रत होती है जब आप ${sName === "sagittarius" || sName === "pisces" || sName === "cancer" ? "प्राकृतिक नियमों के साथ संरेखित रहते हैं, उदारता बरतते हैं और सहज ज्ञान पर भरोसा करते हैं" : "विवेकपूर्ण निर्णय, निष्काम सेवा और व्यावहारिक सहायता प्रदान करते हैं"}। कृतज्ञता आपकी प्रज्ञा को बढ़ाती है।`,
          shadowTendency: `गुरु देव का असंतुलन अति-आत्मविश्वास में परिणत हो सकता है, जहाँ उदारता अति-विस्तार में बदल जाती है। ${signHi} में, यह ${sName === "sagittarius" || sName === "pisces" ? "यथार्थ से परे आदर्शवाद और क्षमता से अधिक वादे करने" : "स्वयं के आंतरिक कार्य से बचते हुए दूसरों को निरंतर परामर्श देने"} के रूप में आ सकता है।`,
          groundingGuidance: "इस सप्ताह किसी भी छोटे उपहार, सराहना या सहायता को बिना संकोच और बिना तुरंत चुकाने की भावना के स्वीकार करें। गुरु का विस्तार कृतज्ञता और शालीनता से होता है।",
          somatic: "अपनी दृष्टि को कोमल करें और अपने होठों पर कृतज्ञता की एक हल्की, सहज मुस्कान को आने दें।",
          glow: "from-yellow-500/10 to-amber-500/5",
          borderColor: "border-[#E5A823]/30"
        };

      case "mars":
        return {
          sanskrit: "मंगल",
          role: "इच्छाशक्ति, पुरुषार्थ एवं ऊर्जा (Willpower & Drive)",
          archetype: "निर्भीक आध्यात्मिक योद्धा",
          theme: "प्राकृतिक प्राणशक्ति एवं दिशा-निर्देशित कर्म",
          narrative: `${signHi} राशि में मंगल देव आपकी शारीरिक ऊर्जा, सीमाओं की रक्षा और कर्म की शुरुआत को संचालित करते हैं। ${signHi} में, आपका पुरुषार्थ तब श्रेष्ठ होता है जब आप ${sName === "aries" || sName === "scorpio" || sName === "capricorn" ? "रणनीतिक क्रियान्वयन, संरचनात्मक नियंत्रण और सत्य की रक्षा में संलग्न होते हैं" : "कलात्मक अभिव्यक्ति, बौद्धिक समस्या-निवारण या शारीरिक संरेखण में ऊर्जा लगाते हैं"}। व्यर्थ के वाद-विवाद से बचें।`,
          shadowTendency: `मंगल देव का असंतुलन अप्रयुक्त ऊर्जा को आंतरिक चिड़चिड़ाहट, अधीरता या शारीरिक खिंचाव में बदल देता है। ${signHi} में, यह ${sName === "aries" ? "अति-प्रतिक्रियाशीलता, जहाँ एक क्षण का मौन आवश्यक था वहाँ संबंध बिगाड़ लेने" : sName === "scorpio" ? "भीतर ही भीतर क्रोध को संचित करने और फिर अचानक फूट पड़ने" : "सही दिशा न मिलने पर अंदर ही अंदर घुटने"} के रूप में प्रकट होता है।`,
          groundingGuidance: "आज कोई भी महत्वपूर्ण निर्णय लेने से पूर्व कम से कम ५ मिनट पूर्ण शारीरिक स्थिरता और मौन में बिताएं। योद्धा का परम अस्त्र गति नहीं, विवेक है।",
          somatic: "अपनी मुट्ठी को धीरे से भींचें, अपनी बांहों की शक्ति को अनुभव करें, और फिर एक गहरी सांस के साथ उसे पूरी तरह ढीला छोड़ दें।",
          glow: "from-rose-500/10 to-red-500/5",
          borderColor: "border-[#B23B3B]/30"
        };

      case "mercury":
        return {
          sanskrit: "बुध",
          role: "संज्ञानात्मक बोध एवं अभिव्यक्ति शैली (Cognitive Lens)",
          archetype: "प्रकृति के संकेतों एवं प्रतिमानों के अनुवादक",
          theme: "बौद्धिक संकलन एवं सौम्य वाणी",
          narrative: `${signHi} राशि में बुध देव आपके संज्ञानात्मक कौशल, तंत्रिका तंत्र की संवेदनशीलता और विचारों की अभिव्यक्ति के स्वामी हैं। ${signHi} में, आपका मस्तिष्क ${sName === "gemini" || sName === "virgo" ? "प्रणालीगत सुव्यवस्था, सूक्ष्म विश्लेषण और तीव्र वाक-पटुता के माध्यम से" : sName === "pisces" ? "कलात्मक कल्पनाओं, सहज छलांगों और मूक संवेदनों के माध्यम से" : "व्यावहारिक, संरचित विचारों और संयमित वाणी के माध्यम से"} सर्वश्रेष्ठ कार्य करता है। सहज ज्ञान को बुद्धि के जाल में न उलझाएं।`,
          shadowTendency: `बुध देव का असंतुलन अशांत मन पैदा करता है — जहाँ तंत्रिका तंत्र शांति के बजाय निरंतर विश्लेषण में उलझा रहता है। ${signHi} में, यह ${sName === "gemini" ? "किसी विचार के परिपक्व होने से पूर्व ही नए विषय पर कूद जाने" : sName === "virgo" ? "लगातार सुधार के जाल में फंसे रहने, जहाँ कोई भी कार्य कभी पूर्ण नहीं लगता" : sName === "pisces" ? "सुंदर विचारों में खोए रहने परंतु उन्हें धरातल पर न ला पाने" : "बौद्धिक अस्थिरता"} के रूप में दिखता है।`,
          groundingGuidance: "आज १५ मिनट का एक ऐसा समय रखें जहां आप केवल वही कहें जो आप वास्तव में हृदय से महसूस करते हैं — बिना किसी संपादन या प्रदर्शन के। बुध देव का शुद्धिकरण सरल सत्य से होता है।",
          somatic: "अपने अंगूठे और तर्जनी उंगली के अग्रभाग को आपस में स्पर्श करें (ज्ञान मुद्रा) और तंत्रिका तंत्र को स्थिर करने के लिए दो धीमी सांसें लें।",
          glow: "from-emerald-500/10 to-teal-500/5",
          borderColor: "border-[#14B8A6]/30"
        };

      case "venus":
        return {
          sanskrit: "शुक्र",
          role: "सौहार्द, आकर्षण एवं संतोष प्रवाह (Relationship Flow)",
          archetype: "परम संतोष एवं आनंद के सूत्रधार",
          theme: "संबंधों का सौंदर्यबोध एवं भक्तिमय प्रेम",
          narrative: `${signHi} राशि में शुक्र देव आपके संबंधों के सौंदर्य, आपके मूल्यों और सौहार्द को आकर्षित करने की क्षमता को संचालित करते हैं। ${signHi} में, शुक्र देव अपना सर्वोच्च सौंदर्य ${sName === "libra" || sName === "taurus" || sName === "pisces" ? "निस्वार्थ समर्पण, कलात्मक संतुलन, कोमल व्यवहार और स्वच्छ वातावरण" : "गहराई, उपयोगिता और परिष्कृत शिल्प कौशल की बौद्धिक सराहना"} के माध्यम से प्रकट करते हैं। संतोष ही आपका चुंबकीय रहस्य है।`,
          shadowTendency: `शुक्र देव का असंतुलन प्रेम को केवल बाहरी सौंदर्य या सुख-सुविधाओं की शर्तों पर निर्भर कर देता है। ${signHi} में, यह ${sName === "libra" ? "सच्चे संघर्षों से बचकर केवल ऊपर-ऊपर से शांति बनाए रखने" : sName === "scorpio" ? "अधिकार भावना और ईर्ष्या को गहरा प्रेम समझ बैठने" : "परिपूर्णता की शर्तों पर ही प्रेम और स्नेह व्यक्त करने"} के रूप में उभर सकता है।`,
          groundingGuidance: "आज बिना किसी प्रतिफल या सराहना की अपेक्षा के किसी व्यक्ति, वस्तु या प्रकृति के सुंदर रूप की हृदय से प्रशंसा करें। यह शुक्र देव की ऊर्जा का सर्वोच्च स्वरूप है।",
          somatic: "अपनी दोनों हथेलियों को हृदय चक्र पर रखें, भीतर बहते स्नेह को महसूस करें और किसी भी आपसी तनाव को विसर्जित होने दें।",
          glow: "from-purple-500/10 to-pink-500/5",
          borderColor: "border-[#D946EF]/30"
        };

      case "rahu":
        return {
          sanskrit: "राहु",
          role: "अवचेतन की तीव्र इच्छाएं एवं महत्वाकांक्षा (Desire Currents)",
          archetype: "आधुनिक माया एवं ऊर्जा के उत्प्रेरक",
          theme: "सघन महत्वाकांक्षा एवं सांसारिक विस्तार",
          narrative: `${signHi} राशि में राहु देव छाया ग्रह के रूप में आपकी महत्वाकांक्षा, सांसारिक विस्तार और कर्मों में सीमाओं को लांघने की तीव्र इच्छा को दर्शाते हैं। यह वह क्षेत्र है जहाँ आप सीमाओं को तोड़ना चाहते हैं, परंतु मानसिक अशांति का जोखिम भी रहता है। ${signHi} में, राहु देव आपको ${sName === "pisces" ? "सार्वजनिक प्रयासों में आध्यात्मिक समर्पण और स्वस्थ अनासक्ति सिखा रहे हैं, जहाँ कर्म महत्वाकांक्षी हो परंतु मन मौन हो" : "इस राशि के पाठ को बिना मानसिक संतुलन खोए आत्मसात करना"} सिखा रहे हैं। कायिक स्थिरता ही आपकी परम औषधि है।`,
          shadowTendency: `राहु देव का असंतुलन अतृप्त तृष्णा पैदा करता है — वह भूख जो कभी शांत नहीं होती क्योंकि वह पोषण के स्थान पर केवल नवीनता खोजती है। ${signHi} में, यह ${sName === "gemini" || sName === "virgo" ? "अत्यधिक सूचना संग्रह, वैचारिक अस्थिरता और बिना आत्मसात किए केवल कार्य करते दिखने" : sName === "scorpio" ? "दूसरों पर नियंत्रण और भावनात्मक चालाकी के जाल में उलझने" : "अशांत महत्वाकांक्षा"} के रूप में प्रकट होता है।`,
          groundingGuidance: "इस सप्ताह अपनी डिजिटल या सूचनात्मक खपत (डिजिटल स्क्रीन) के किसी एक हिस्से को स्वेच्छा से कम करें। जब राहु को संयम की सीमा दी जाती है, तब वह भटकाव के स्थान पर गहरी अंतर्दृष्टि प्रदान करता है।",
          somatic: "अपने पैरों की उंगलियों को धीरे से हिलाएं। अमूर्त विचारों से निकलकर स्वयं को वर्तमान भौतिक तल पर अनुभव करें।",
          glow: "from-violet-500/10 to-fuchsia-500/5",
          borderColor: "border-[#8B5CF6]/30"
        };

      case "ketu":
        return {
          sanskrit: "केतु",
          role: "सहज वैराग्य एवं सूक्ष्म आंतरिक क्षमताएं (Innate Detachment)",
          archetype: "मौन वैराग्य एवं मोक्ष के ऋषि",
          theme: "अवचेतन की स्वतंत्रता एवं संचित कर्म मुक्ति",
          narrative: `${signHi} राशि में केतु देव सहज आध्यात्मिक थकान, पूर्व जन्मों की प्रतिभाओं और अनासक्ति के द्योतक हैं। यह वह क्षेत्र है जहाँ आप बहुत गहरा अनुभव रखते हैं परंतु वर्तमान सांसारिक गतिविधियों से उदासीन महसूस कर सकते हैं। ${signHi} में, केतु देव आपसे ${sName === "virgo" ? "अत्यधिक आलोचना और सूक्ष्म नियंत्रण को छोड़कर प्रकृति की सहज उच्च बुद्धिमत्ता पर विश्वास करना" : "इस भाव के फलों को ईश्वर को समर्पित कर पूर्ण अनासक्ति का अभ्यास करना"} सिखाते हैं।`,
          shadowTendency: `केतु देव का असंतुलन पलायनवाद की प्रवृत्ति देता है — जहाँ मनुष्य व्यावहारिक जिम्मेदारियों से बचने के लिए अध्यात्म का सहारा लेता है। ${signHi} में, यह ${sName === "virgo" ? "बारीक और व्यावहारिक कार्यों को अध्यात्म के नाम पर महत्वहीन मानकर टालने" : "उदासीनता को ही वैराग्य समझकर प्रयासों को समय से पूर्व त्याग देने"} के रूप में दिखता है।`,
          groundingGuidance: "अपनी किसी ऐसी स्वाभाविक कला या कौशल को पहचानें जिसे आप बहुत सहज या महत्वहीन समझते हैं। इस सप्ताह उसे पूर्ण सजगता और सेवा भाव से संसार को अर्पित करें। केतु देव का संतुलन निष्काम कर्म से होता है, पलायन से नहीं।",
          somatic: "एक पूर्ण और गहरी सांस छोड़ें, अगले क्षण पर नियंत्रण की इच्छा को विसर्जित कर दें और शून्य में विश्राम करें।",
          glow: "from-teal-500/10 to-indigo-500/5",
          borderColor: "border-[#06B6D4]/30"
        };

      default:
        return {
          sanskrit: planetHi,
          role: "आकाशीय ऊर्जा संरेखण (Celestial Influence)",
          archetype: "ब्रह्मांडीय स्व (The Archetypal Self)",
          theme: "कर्म संरेखण चरण",
          narrative: `यह आकाशीय पिंड आपके जन्म चक्र के महत्वपूर्ण क्षेत्र का प्रतिनिधित्व करता है। यह वर्तमान में आपके कर्मों के संतुलन और शारीरिक स्थिरता में सहायक है।`,
          shadowTendency: `अवलोकन करें कि क्या यह ऊर्जा आपके जीवन में किसी अनजाने आदत या आपसी टकराव के रूप में प्रकट हो रही है। सजगता ही परिवर्तन का आधार है।`,
          groundingGuidance: "बिना किसी निर्णय या मूल्यांकन के इस ग्रह के प्रभाव को अपनी दिनचर्या में देखें। एक साक्षी भाव ही संतुलन की ओर ले जाता है।",
          somatic: "अपने शरीर को सीधा करें और एक अत्यंत गहरी सांस लें।",
          glow: "from-slate-500/5 to-slate-800/5",
          borderColor: "border-slate-500/20"
        };
    }
  }



  switch (pName) {
    case "lagna":
      return {
        sanskrit: "Lagna",
        role: "The Filter of Reality",
        archetype: `The ${sName === "aries" ? "Pioneer" : sName === "taurus" ? "Custodian" : sName === "gemini" ? "Translator" : sName === "cancer" ? "Sanctuary" : sName === "leo" ? "Sovereign" : sName === "virgo" ? "Alchemist" : sName === "libra" ? "Architect of Harmony" : sName === "scorpio" ? "Underworld Voyager" : sName === "sagittarius" ? "Pilgrim" : sName === "capricorn" ? "Summit Builder" : sName === "aquarius" ? "Visionary" : "Dreamer of Infinity"}`,
        theme: "Selfhood & Primary Perception",
        narrative: `Your Ascendant in ${sign} represents the primary cosmic lens through which you digest the world. You do not just live in reality—you filter it. With a ${sign} filter, you approach life with an innate drive toward ${sName === "aries" ? "direct action and initiating new pathways" : sName === "taurus" ? "sensory appreciation, deliberate pacing, and material cultivation" : sName === "gemini" ? "intellectual connection, conversational bridging, and playful curiosity" : sName === "cancer" ? "emotional sanctuary, intuitive guarding, and caring containment" : sName === "leo" ? "creative expression, warm visibility, and generous selfhood" : sName === "virgo" ? "careful purification, somatic ordering, and devotion to service" : sName === "libra" ? "aesthetic symmetry, relational balance, and social diplomacy" : sName === "scorpio" ? "psychological autopsy, shadow retrieval, and radical authenticity" : sName === "sagittarius" ? "philosophical quests, spacious expansion, and the search for natural law" : sName === "capricorn" ? "practical duty, vertical mastery, and enduring legacy" : sName === "aquarius" ? "systemic innovation, group coordination, and collective evolution" : "spiritual flow, dissolution of boundaries, and fluid artistic connection"}.`,
        shadowTendency: `The ${sign} Ascendant can unconsciously over-identify with its primary lens — mistaking the filter for the full reality. Watch for the impulse to ${sName === "aries" ? "act before feeling, confusing urgency with purpose" : sName === "taurus" ? "cling to comfort, resisting necessary change" : sName === "gemini" ? "scatter across too many threads, avoiding depth" : sName === "cancer" ? "over-protect, making the sanctuary a prison" : sName === "leo" ? "seek validation rather than express freely" : sName === "virgo" ? "critique what could simply be received" : sName === "libra" ? "defer endlessly to avoid disrupting harmony" : sName === "scorpio" ? "test loyalty beyond what trust requires" : sName === "sagittarius" ? "preach rather than practice" : sName === "capricorn" ? "perform competence while hiding vulnerability" : sName === "aquarius" ? "detach to the point of emotional distance" : "dissolve into others, losing your own boundaries"}.`,
        groundingGuidance: `Once a day, notice one moment where you are reacting from your Ascendant's automatic filter. Simply observing this pattern — without changing it — begins the integration.`,
        somatic: `Anchor this by noticing your posture right now. Let your breath drop down into your belly, centering your primary presence.`,
        glow: "from-indigo-500/10 to-purple-500/5",
        borderColor: "border-[#5E387B]/40"
      };

    case "sun":
      return {
        sanskrit: "Surya",
        role: "Your Core Vitality & Leadership Archetype",
        archetype: `The Sovereign of ${sName === "leo" || sName === "aries" ? "Radiant Power" : "Quiet Intention"}`,
        theme: "Integrity & Creative Sovereignty",
        narrative: `The Sun in ${sign} governs your essential life-force, active self-realization, and how you command your environment. In ${sign}, your core vitality shines brightest when you ${sName === "aries" || sName === "leo" || sName === "sagittarius" ? "radiate warm, inspirational action and bold self-leadership" : sName === "taurus" || sName === "virgo" || sName === "capricorn" ? "build consistent, high-integrity structures with reliable patience" : sName === "gemini" || sName === "libra" || sName === "aquarius" ? "weave innovative thoughts and systemic clarity into the community" : "protect quiet, intuitive streams of emotional truth and creative introspection"}.`,
        shadowTendency: `The Sun's shadow is the need for external confirmation of inner worth. In ${sign}, this appears as ${sName === "leo" || sName === "aries" ? "performing strength rather than embodying it — seeking applause over alignment" : sName === "virgo" || sName === "capricorn" ? "tying self-worth to productivity and correctness rather than simple being" : "seeking intellectual approval or relational mirroring to feel legitimate"}. Notice when pride and sensitivity travel together.`,
        groundingGuidance: `Practice one small act of self-leadership daily that requires no audience. The quality of your private decisions shapes your public gravity.`,
        somatic: `Stand tall, roll your shoulders back, and place a hand briefly on your solar plexus to feel your core heat.`,
        glow: "from-amber-500/15 to-orange-500/5",
        borderColor: "border-[#C59B27]/40"
      };

    case "moon":
      return {
        sanskrit: "Chandra",
        role: "Your Emotional Landscape & Nurturance Needs",
        archetype: `The ${sName === "cancer" || sName === "taurus" ? "Anchored Nurturer" : sName === "scorpio" ? "Intense Intuitive" : "Seeker of Cosmic Flow"}`,
        theme: "Somatic Safety & Subconscious Mind",
        narrative: `The Moon in ${sign} is the soft underbelly of your chart, dictating how you process stress, seek emotional security, and somatic safety. In ${sign}, your emotional system ${sName === "sagittarius" ? "seeks open spaces, movement, and philosophical context to feel stable. You require a sense of spiritual quest; routines improve when they are spiritually grounding" : sName === "cancer" || sName === "taurus" ? "flourishes through sensory comforts, quiet domestic sanctuaries, and trusted long-term bonds" : sName === "scorpio" ? "needs deep, raw truth. You process emotions with absolute intensity and require emotional detox through silence and somatic release" : "requires clean cognitive sorting, verbal reassurance, and structural clarity to ease ambient anxiety"}.`,
        shadowTendency: `The Moon's shadow is reactive emotionality that masquerades as intuition. In ${sign}, this surfaces as ${sName === "cancer" || sName === "taurus" ? "possessiveness and difficulty releasing what once felt safe" : sName === "scorpio" ? "emotional testing, control through withdrawal, and mistaking intensity for depth" : sName === "sagittarius" ? "fleeing discomfort under the banner of freedom, avoiding emotional accountability" : "over-intellectualizing emotional states rather than simply feeling them"}. Notice when reaction speeds past reflection.`,
        groundingGuidance: `Before responding to emotional triggers, create a brief pause — even three conscious breaths. This gap between stimulus and response is where your emotional intelligence lives.`,
        somatic: `Close your eyes for three seconds, take a slow exhale, and notice if you are holding tension in your jaw or chest.`,
        glow: "from-blue-500/10 to-indigo-500/5",
        borderColor: "border-[#4A69B1]/30"
      };

    case "saturn":
      return {
        sanskrit: "Shani",
        role: "Your Master Teacher of Focus & Structure",
        archetype: "The Disciplined Architect of Time",
        theme: "Pragmatic Boundaries & Spiritual Resilience",
        narrative: `Saturn in ${sign} represents your greatest containment, focus, and developmental delay. It is not an enemy, but a strict master who demands absolute mastery. In ${sign}, Saturn is teaching you ${sName === "capricorn" || sName === "aquarius" ? "structural stewardship, long-term persistence, and systemic duty" : sName === "aries" || sName === "scorpio" ? "to cool hot-headed impulses and forge raw energy into mature, strategic willpower" : "to build real-world foundations rather than escape into mental projections"}. ${retrograde ? "Being Retrograde, Saturn requests an internal review of authority and past boundaries." : ""}`,
        shadowTendency: `Saturn's shadow is internalized inadequacy — a quiet, persistent belief that you have not yet earned rest, ease, or success. In ${sign}, this surfaces as ${sName === "aries" ? "harsh self-criticism when momentum slows" : sName === "libra" ? "social anxiety disguised as diplomatic sensitivity" : "compulsive over-preparation that postpones beginning"}. Notice when discipline becomes punishment.`,
        groundingGuidance: `Identify one area where you have been holding yourself to an impossible standard. Saturn grows through consistent practice — not perfection. Release one self-imposed deadline this week as an act of maturity, not failure.`,
        somatic: `Press your feet firmly into the ground. Feel the supportive gravity of the earth holding your frame.`,
        glow: "from-slate-500/15 to-indigo-500/5",
        borderColor: "border-[#5F6368]/30"
      };

    case "jupiter":
      return {
        sanskrit: "Guru",
        role: "Your Wisdom & Spiritual Expansion",
        archetype: "The Benevolent Guide",
        theme: "Higher Grace & Generous Outlook",
        narrative: `Jupiter in ${sign} rules your capacity for higher wisdom, natural grace, and intellectual abundance. In ${sign}, your capacity to attract good fortune and mental expansion activates when you ${sName === "sagittarius" || sName === "pisces" || sName === "cancer" ? "remain aligned with natural law, show generosity, and trust intuitive grace" : "practice rigorous, clean-minded discrimination, service, and realistic support"}. Gratitude acts as your direct amplifier.`,
        shadowTendency: `Jupiter's shadow is inflation — expanding so confidently that wisdom tips into overconfidence, generosity into overextension. In ${sign}, this may appear as ${sName === "sagittarius" || sName === "pisces" ? "idealism untethered from practical consequence, promises beyond capacity" : "over-advising others while avoiding your own inner work"}. Notice when optimism becomes avoidance.`,
        groundingGuidance: `Practice receiving well this week — accepting help, compliments, or small blessings without immediately deflecting or reciprocating. Jupiter grows through graceful receptivity, not just giving.`,
        somatic: `Soften your gaze and allow a gentle, subtle smile of gratitude to rest on your lips.`,
        glow: "from-yellow-500/10 to-amber-500/5",
        borderColor: "border-[#E5A823]/30"
      };

    case "mars":
      return {
        sanskrit: "Mangala",
        role: "Your Willpower, Drive & Action Archetype",
        archetype: "The Fearless Spiritual Warrior",
        theme: "Vital Instinct & Directed Action",
        narrative: `Mars in ${sign} governs your physical drive, defensive boundaries, and how you initiate tasks. In ${sign}, your drive functions best when ${sName === "aries" || sName === "scorpio" || sName === "capricorn" ? "highly focused on strategic execution, structural mastery, and fierce protection of truth" : "channeled into creative expression, logical puzzle-solving, or somatic alignment"}. Avoid burning out in useless arguments.`,
        shadowTendency: `Mars' shadow is displaced aggression — energy that cannot find its rightful target and turns inward as irritability, impatience, or somatic tension. In ${sign}, this surfaces as ${sName === "aries" ? "reactivity that outpaces deliberation, burning bridges that required only a pause" : sName === "scorpio" ? "resentment stored silently until it erupts disproportionately" : "the quiet frustration of force constrained by the wrong container"}. Notice when your edges sharpen against those nearest to you.`,
        groundingGuidance: `Spend 5 minutes in complete physical stillness before any significant decision today. The warrior's greatest weapon is discernment, not speed.`,
        somatic: `Make a gentle fist, feel the activation of your forearm strength, and release it with a steady breath.`,
        glow: "from-rose-500/10 to-red-500/5",
        borderColor: "border-[#B23B3B]/30"
      };

    case "mercury":
      return {
        sanskrit: "Budha",
        role: "Your Cognitive Lens & Expression Style",
        archetype: "The Translator of Patterns",
        theme: "Cognitive Sorting & Eloquent Speech",
        narrative: `Mercury in ${sign} rules your cognitive processing speed, nervous system feedback, and how you translate ideas. In ${sign}, your mind works through ${sName === "gemini" || sName === "virgo" ? "brilliant systematic ordering, clean analysis, and rapid verbal agility" : sName === "pisces" ? "vivid metaphorical association, intuitive leaps, and silent artistic impressions" : "pragmatic, structured thinking and deliberate speech patterns"}. Avoid over-rationalizing gut feelings.`,
        shadowTendency: `Mercury's shadow is the anxious mind — a nervous system that substitutes continuous analysis for the stillness needed to actually hear. In ${sign}, this appears as ${sName === "gemini" ? "hopping between topics before any one thought matures" : sName === "virgo" ? "the endless revision loop, where no output ever feels complete enough" : sName === "pisces" ? "thoughts that drift beautifully but never anchor into communicable form" : "mental overload disguised as thoroughness"}. Notice when thinking becomes a way of avoiding feeling.`,
        groundingGuidance: `Designate one 15-minute window today where you write or speak only what you genuinely mean — no performance, no editing. Mercury integrates through honest, unhurried expression.`,
        somatic: `Touch your index finger to your thumb (Gyan Mudra) and take two slow breaths to steady nervous system electricity.`,
        glow: "from-emerald-500/10 to-teal-500/5",
        borderColor: "border-[#14B8A6]/30"
      };

    case "venus":
      return {
        sanskrit: "Shukra",
        role: "Your Harmony Magnet & Relationship Flow",
        archetype: "The Weaver of Pure Contentment",
        theme: "Relational Aesthetics & Devotional Love",
        narrative: `Venus in ${sign} governs your relationship aesthetics, what you value, and your capacity to attract harmony. In ${sign}, Venus manifests her highest beauty through ${sName === "libra" || sName === "taurus" || sName === "pisces" ? "pure devotion, aesthetic symmetry, emotional sweetness, and clean spaces" : "a highly selective, intelligent appreciation of depth, utility, and refined craftsmanship"}. Contentment is your magnetic secret.`,
        shadowTendency: `Venus' shadow is love conditioned on aesthetic alignment — confusing comfort and beauty with genuine connection. In ${sign}, this may surface as ${sName === "libra" ? "avoiding honest conflict to preserve surface harmony, allowing resentment to quietly accumulate" : sName === "scorpio" ? "possessive attachment dressed as depth and intensity" : sName === "virgo" ? "withholding affection until conditions are perfected" : "investing in the idea of relationship more than in its daily, imperfect reality"}. Notice when appreciation of beauty becomes a standard others cannot meet.`,
        groundingGuidance: `Offer one act of pure, unconditioned appreciation today — to a person, a place, or a moment — without expecting it to be reciprocated or remembered. This is Venus at her highest.`,
        somatic: `Place your palms over your heart center, breathing in comfort and releasing any relational friction.`,
        glow: "from-purple-500/10 to-pink-500/5",
        borderColor: "border-[#D946EF]/30"
      };

    case "rahu":
      return {
        sanskrit: "Rahu",
        role: "Your Shadow Growth & Desire Currents",
        archetype: "The Catalyst of Modern Illusion",
        theme: "Focal Obsession & Outer Ambition",
        narrative: `Rahu in ${sign} represents the shadow dragon's head — your point of modern overstimulation, high desire, and karmic expansion. It is where you feel drawn to push boundaries, but risk anxiety and obsessive clutter. In ${sign}, Rahu is prompting you to learn ${sName === "pisces" ? "spiritual surrender and healthy detachment in your public endeavors, balancing raw ambition with quiet retreat" : "to master this sign's lessons without losing your sanity to sensory over-indexing"}. Grounding is your absolute medicine.`,
        shadowTendency: `Rahu's shadow is obsessive craving — the restless hunger that cannot be satisfied because it feeds on novelty, not nourishment. In ${sign}, this surfaces as ${sName === "gemini" || sName === "virgo" ? "information hoarding, opinion-shifting, the illusion of productivity without integration" : sName === "scorpio" ? "compulsive depth-seeking that crosses into voyeurism, surveillance, or emotional manipulation" : "attachment to outcomes and status that masquerades as ambition"}. Notice when desire sharpens without a clear destination.`,
        groundingGuidance: `Choose one area of digital or informational consumption to reduce this week — not as punishment, but as clarity. Rahu stabilizes when desire is given a clear, contained channel rather than an open field.`,
        somatic: `Wiggle your toes. Feel your connection to the physical floor, centering your mind out of abstract thought.`,
        glow: "from-violet-500/10 to-fuchsia-500/5",
        borderColor: "border-[#8B5CF6]/30"
      };

    case "ketu":
      return {
        sanskrit: "Ketu",
        role: "Your Innate Detachment & Hidden Strengths",
        archetype: "The Silent Sage of Detached Mastery",
        theme: "Subconscious Freedom & Karmic Release",
        narrative: `Ketu in ${sign} represents the tail of the dragon — your point of spiritual fatigue, easy default talents, and intuitive release. It is where you carry massive past mastery but must avoid checking out or feeling deeply unsatisfied. In ${sign}, Ketu asks you to ${sName === "virgo" ? "release excessive over-criticism and micro-managing, resting in the quiet, higher intelligence of organic flow" : "offer the fruits of this house to the divine, practicing pure non-attachment"}.`,
        shadowTendency: `Ketu's shadow is spiritual bypassing — using detachment as an exit from ordinary human engagement rather than a genuine resting in presence. In ${sign}, this may appear as ${sName === "virgo" ? "dismissing detail-oriented work as beneath a spiritually evolved person" : sName === "aries" ? "abandoning initiatives prematurely, mistaking disinterest for transcendence" : "profound apathy toward the very areas of life where your authentic gifts reside"}. Notice when 'letting go' is actually giving up.`,
        groundingGuidance: `Identify one natural gift or skill you tend to dismiss as easy or unimportant. Practice offering it with full presence and care this week. Ketu integrates through conscious, embodied contribution — not withdrawal.`,
        somatic: `Exhale completely, letting go of the need to control the next moment or hold on to anything.`,
        glow: "from-teal-500/10 to-indigo-500/5",
        borderColor: "border-[#06B6D4]/30"
      };

    default:
      return {
        sanskrit: planet,
        role: "Celestial Influence",
        archetype: "The Archetypal Self",
        theme: "Integration Phase",
        narrative: `This planetary body represents a significant sector of your active natal layout. It is currently assisting in balancing your karmic lessons and somatic grounding.`,
        shadowTendency: `Notice if this planetary energy appears in any unconscious habit or recurring friction in your life. Awareness itself begins the integration.`,
        groundingGuidance: `Work with this placement by observing its themes in daily life without judgment. Integration happens through noticing, not forcing.`,
        somatic: `Align your posture and breathe deeply.`,
        glow: "from-slate-500/5 to-slate-800/5",
        borderColor: "border-slate-500/20"
      };
  }
}

export default function PlanetsDetailsPage({ chartData }: { chartData?: any }) {
  const { isHindi } = useLanguage();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const realChart = chartData?.chart;
  const realLagnaSignNum = realChart?.lagna?.sign || 10;
  const realLagnaSignName = getSignName(realLagnaSignNum);

  // Fallback planets list if data is not loaded or missing
  const activePlanets: PlanetData[] = realChart?.planets
    ? [
        {
          name: "Lagna",
          sanskrit: "Lagna",
          sign: realLagnaSignName,
          house: 1,
          status: "Ascendant",
          degree: `${Math.floor(realChart.lagna.longitude % 30)}°${Math.floor((realChart.lagna.longitude % 30 * 60) % 60)}'00"`,
          isRetrograde: false,
          isCombust: false,
          isVargottama: false
        },
        ...realChart.planets.map((p: any) => {
          const signName = getSignName(p.sign);
          const house = ((p.sign - realLagnaSignNum + 12) % 12) + 1;
          const status = p.isRetrograde ? "Retrograde" : p.isCombust ? "Combust" : p.isVargottama ? "Vargottama" : p.strengthLevel || "Neutral";
          
          return {
            name: p.name,
            sanskrit: getPlanetArchetype(p.name, signName, p.isRetrograde, p.isCombust, isHindi).sanskrit,
            sign: signName,
            house,
            status,
            degree: `${Math.floor(p.longitude % 30)}°${Math.floor((p.longitude % 30 * 60) % 60)}'00"`,
            isRetrograde: !!p.isRetrograde,
            isCombust: !!p.isCombust,
            isVargottama: !!p.isVargottama
          };
        })
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#3F2D1D] p-6 font-sans relative overflow-hidden transition-all duration-1000">
      
      {/* Mystical Starry Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-gradient-to-b from-amber-500/5 via-amber-700/5 to-transparent blur-[130px] rounded-full animate-pulse" style={{ animationDuration: "14s" }} />
        <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-amber-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header Block */}
        <div className="border-b border-[#F1E7D0] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-light text-amber-900 leading-relaxed">
              {isHindi ? (
                <>
                  ग्रह स्थिति एवं <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600 font-serif">आत्मरूप (Archetypes)</span>
                </>
              ) : (
                <>
                  Planetary <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-amber-600">Archetypes</span>
                </>
              )}
            </h2>
            <p className="text-xs text-amber-800/80 uppercase tracking-normal font-semibold flex items-center gap-1.5 font-serif leading-relaxed">
              <Activity className="w-3.5 h-3.5 text-amber-700" />
              {isHindi ? "आपके जन्म चक्र की कायिक पहचान एवं मनोवैज्ञानिक विषय-वस्तु" : "Somatic Identity & Psychological Themes of your Chart"}
            </p>
          </div>

          <div className="text-[10px] text-amber-800/40 uppercase tracking-normal font-serif leading-relaxed italic">
            {isHindi ? "सघन मापदंडों के स्थान पर भावनात्मक अर्थों पर ध्यान केंद्रित" : "Focusing on Emotional Meaning over Metric Grids"}
          </div>
        </div>

        {/* Narrative Intro Card */}
        <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 flex items-start gap-4 shadow-sm text-[#3F2D1D]">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 shrink-0">
            <Compass className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1.5 font-serif">
            <h4 className="text-sm font-semibold text-amber-900 leading-relaxed">
              {isHindi ? "मनोवैज्ञानिक आत्मरूपों (Archetypes) का प्रभाव" : "The Power of Psychological Archetypes"}
            </h4>
            <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light font-sans">
              {isHindi ? (
                <>
                  महर्षि वशिष्ठ ज्योतिष हमें ग्रहों को अंतरिक्ष के बेजान पिंडों के रूप में नहीं, बल्कि <strong>अपने ही मस्तिष्क के भीतर जीवित आत्मरूपों</strong> के रूप में समझने का मार्गदर्शन करता है। प्रत्येक ग्रह एक विशिष्ट व्यवहार और भावनात्मक ऊर्जा का प्रतिनिधित्व करता है। किसी भी ग्रह पर क्लिक करके उसका कायिक संरेखण सूत्र (Somatic Trigger), जीवन उद्देश्य और शांत रहने की क्रियाएं देखें।
                </>
              ) : (
                <>
                  Vashistha Jyotish guides us to understand the planets not as remote rocks in space, but as **living archetypes within our own mind**. Each planet governs a behavioral theme and emotional anchor. Click any planet to reveal its somatic trigger, life purpose, and centering practices.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Archetypes Cards List */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {activePlanets.map((p, idx) => {
              const info = getPlanetArchetype(p.name, p.sign, p.isRetrograde, p.isCombust, isHindi);
              const isSelected = selectedPlanet === p.name;
              
              return (
                <motion.div
                  key={p.name}
                  onClick={() => setSelectedPlanet(isSelected ? null : p.name)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.6 }}
                  className={`group relative overflow-hidden rounded-3xl p-6 border border-[#F1E7D0] bg-white cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md hover:border-amber-300/60 flex flex-col justify-between ${
                    isSelected ? "ring-2 ring-amber-500/50 scale-[1.02] shadow-sm" : ""
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between font-serif">
                      <div>
                        <div className="flex items-center gap-1.5 leading-relaxed">
                          <span className="text-xs italic text-amber-700/60 font-semibold">{info.sanskrit}</span>
                          {p.isRetrograde && (
                            <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded uppercase font-bold tracking-normal">
                              {isHindi ? "वक्री" : "Rx"}
                            </span>
                          )}
                          {p.isCombust && (
                            <span className="text-[8px] bg-rose-50 text-rose-800 border border-rose-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-normal">
                              {isHindi ? "अस्त" : "Combust"}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-medium text-amber-900 mt-1 leading-relaxed">{translatePlanet(p.name, isHindi)}</h3>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-normal text-[#3F2D1D]/50 block">
                          {isHindi ? `भाव ${p.house}` : `House ${p.house}`}
                        </span>
                        <span className="text-xs text-amber-700 font-semibold leading-relaxed">
                          {isHindi ? `${translateZodiac(p.sign, true)} में` : `in ${p.sign}`}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-normal text-amber-700/80 font-bold font-serif leading-relaxed">
                        {info.role}
                      </p>
                      <h4 className="text-sm font-medium text-[#3F2D1D] font-serif leading-relaxed">
                        {info.archetype}
                      </h4>
                    </div>

                    <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light line-clamp-3 group-hover:line-clamp-none transition-all duration-300 font-sans">
                      {info.narrative}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#F1E7D0] flex items-center justify-between font-serif">
                    <span className="text-[9px] uppercase tracking-normal text-[#3F2D1D]/45 font-medium">
                      {isHindi ? `अंश: ${p.degree}` : `Degree: ${p.degree}`}
                    </span>
                    <span className="text-[9px] text-amber-800 font-semibold group-hover:underline flex items-center gap-1">
                      {isSelected 
                        ? (isHindi ? "विवरण समेटें" : "Collapse Details") 
                        : (isHindi ? "कायिक सूत्र पढ़ें →" : "Read Somatic Key →")
                      }
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Side: Somatic Focus & Interactive Details */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <AnimatePresence mode="wait">
                {selectedPlanet ? (
                  (() => {
                    const p = activePlanets.find(ap => ap.name === selectedPlanet)!;
                    const info = getPlanetArchetype(p.name, p.sign, p.isRetrograde, p.isCombust, isHindi);
                    
                    return (
                      <motion.div
                        key={p.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white border border-[#F1E7D0] rounded-[2.5rem] p-8 shadow-md space-y-6 text-[#3F2D1D]"
                      >
                        <div className="flex items-start justify-between font-serif">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-normal text-amber-700 leading-relaxed">
                              {isHindi ? "चयनित आत्मरूप (Selected)" : "Selected Archetype"}
                            </span>
                            <h3 className="text-3xl font-light text-amber-900 leading-relaxed">
                              {translatePlanet(p.name, isHindi)}
                            </h3>
                            <p className="text-xs text-[#3F2D1D]/60 italic leading-relaxed">
                              {isHindi 
                                ? `संसार: ${info.sanskrit} • ${translateZodiac(p.sign, true)} में ${p.degree}`
                                : `Sanskrit: ${info.sanskrit} • ${p.degree} in ${p.sign}`
                              }
                            </p>
                          </div>

                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 text-xs font-bold font-serif shadow-sm">
                            {p.name.substring(0, 2)}
                          </div>
                        </div>

                        <div className="space-y-4 font-serif">
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] uppercase tracking-normal text-amber-700 font-bold leading-relaxed">
                              {isHindi ? "मुख्य विषय-वस्तु (Theme)" : "Core Theme"}
                            </h5>
                            <p className="text-sm font-semibold text-amber-950 leading-relaxed">
                              {info.theme}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <h5 className="text-[10px] uppercase tracking-normal text-amber-700 font-bold leading-relaxed">
                              {isHindi ? "व्यवहार रूपरेखा (Archetype)" : "Behavioral Archetype"}
                            </h5>
                            <p className="text-sm font-medium text-[#3F2D1D] leading-relaxed">
                              {info.archetype}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <h5 className="text-[10px] uppercase tracking-normal text-amber-700 font-bold leading-relaxed">
                              {isHindi ? "आध्यात्मिक व्याख्या (Narrative)" : "Full Spiritual Narrative"}
                            </h5>
                            <p className="text-xs text-[#3F2D1D]/90 leading-relaxed font-light font-sans">
                              {info.narrative}
                            </p>
                          </div>

                          {info.shadowTendency && (
                            <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-4 space-y-1.5">
                              <h5 className="text-[10px] uppercase tracking-normal text-rose-800 font-bold flex items-center gap-1.5 leading-relaxed">
                                <Shield className="w-3.5 h-3.5 text-rose-700" />
                                {isHindi ? "छाया प्रवृत्ति (आत्म-जागरूकता)" : "Shadow Tendency (Self-Awareness)"}
                              </h5>
                              <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light font-sans">
                                {info.shadowTendency}
                              </p>
                            </div>
                          )}

                          {info.groundingGuidance && (
                            <div className="bg-[#FAF9F5] border border-amber-200/40 rounded-2xl p-4 space-y-1.5">
                              <h5 className="text-[10px] uppercase tracking-normal text-amber-800 font-bold flex items-center gap-1.5 leading-relaxed">
                                <Compass className="w-3.5 h-3.5 text-amber-700" />
                                {isHindi ? "स्थिरता निर्देश (Guidance)" : "Grounding Guidance"}
                              </h5>
                              <p className="text-xs text-[#3F2D1D]/80 leading-relaxed font-light font-sans">
                                {info.groundingGuidance}
                              </p>
                            </div>
                          )}

                          <div className="bg-amber-50/50 border border-amber-100/70 rounded-2xl p-4 space-y-1.5">
                            <div className="flex items-center gap-1.5 leading-relaxed">
                              <Info className="w-3.5 h-3.5 text-amber-700" />
                              <h5 className="text-[10px] uppercase tracking-normal text-amber-700 font-bold">
                                {isHindi ? "कायिक जुड़ाव सूत्र (Somatic Key)" : "Somatic Grounding Key"}
                              </h5>
                            </div>
                            <p className="text-xs text-amber-900/90 leading-relaxed italic font-light font-sans">
                              "{info.somatic}"
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedPlanet(null)}
                          className="w-full py-3 bg-white border border-[#F1E7D0] hover:bg-amber-50/30 rounded-2xl text-xs uppercase tracking-normal font-bold text-[#3F2D1D] font-serif transition-all active:scale-98 cursor-pointer"
                        >
                          {isHindi ? "चयन स्पष्ट करें" : "Clear Selection"}
                        </button>
                      </motion.div>
                    );
                  })()
                ) : (
                  <motion.div
                    key="no-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-[#FFFDFB] border border-[#F1E7D0] rounded-[2.5rem] p-10 text-center space-y-6 shadow-sm font-serif"
                  >
                    <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6 text-amber-700/50" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-light text-amber-900 leading-relaxed">
                        {isHindi ? "परस्पर संरेखण (Alignment)" : "Interactive Alignment"}
                      </h4>
                      <p className="text-xs text-[#3F2D1D]/50 leading-relaxed max-w-[250px] mx-auto font-light font-sans">
                        {isHindi 
                          ? "अपने जन्म चक्र के गहरे भावनात्मक व्याख्याओं, प्राथमिक जीवन लक्ष्यों और व्यक्तिगत कायिक संरेखण सूत्रों को प्रकट करने के लिए किसी भी ग्रह कार्ड पर क्लिक करें।"
                          : "Select any planetary card to inspect its deep emotional narrative, core life theme, and personal somatic grounding keys."
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* System Footer info */}
        <div className="pt-6 flex items-center justify-between border-t border-[#F1E7D0] text-[9px] font-serif tracking-normal text-amber-800/40 uppercase">
          <span>{isHindi ? "दैहिक समय चेतना प्रणाली" : "Emotional Timing Intelligence System"}</span>
          <span>{isHindi ? "प्रामाणिक वैदिक गणना" : "Verified Vedic Legitimacy"}</span>
        </div>

      </div>
    </div>
  );
}
