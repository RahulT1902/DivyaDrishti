const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../src/app/api/predictions/analyze/route.ts');
console.log('Target path:', targetFilePath);

if (!fs.existsSync(targetFilePath)) {
  console.error('File not found!');
  process.exit(1);
}

let content = fs.readFileSync(targetFilePath, 'utf8');

// Find where interface LifeDomainCard begins
const startIndex = content.indexOf('interface LifeDomainCard {');
if (startIndex === -1) {
  console.error('Could not find interface LifeDomainCard in route.ts');
  process.exit(1);
}

const beforeContent = content.substring(0, startIndex);

const newContentPart = `interface LifeDomainCard {
  id: string;
  icon: string;
  title: string;
  titleHindi: string;
  narrative: string;
  planetSignals: string[];
  activatedPatterns: string[];
  caution: string | null;
  primaryPlanet: string;
  strength: "supportive" | "sensitive" | "neutral";
  statusLabel?: string;
  statusLabelHindi?: string;
  emphasisTag?: "Most Active" | "Currently Influenced" | null;
  emphasisTagHindi?: "सर्वाधिक सक्रिय" | "वर्तमान में प्रभावित" | null;
  confidenceTone?: string;
  confidenceToneHindi?: string;
  timingWindow?: string;
  timingWindowHindi?: string;
  whyThisMatters?: {
    transitReasoning: string;
    transitReasoningHindi: string;
    dashaInfluence: string;
    dashaInfluenceHindi: string;
    practicalInterpretation: string;
    practicalInterpretationHindi: string;
    emotionalGuidance: string;
    emotionalGuidanceHindi: string;
  };
}

function getActivatedPatternsForDomain(
  id: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transits: string[]
): string[] {
  const isSupportive = strength === "supportive";
  const isSensitive = strength === "sensitive";

  if (id === "self") {
    if (isSupportive) return ["A surge of clarity brings personal goals into sharp focus today.", "Your natural presence resonates strongly, making it a wonderful time to establish new physical habits.", "Inner alignment feels steady, allowing self-expression to flow without friction."];
    if (isSensitive) return ["Physical energy might fluctuate today, reminding you to honor moments of rest.", "A gentle approach to self-expectations helps steer clear of minor frustrations.", "Taking a step back to recover preserves your vital momentum."];
    return ["A quiet, steady rhythm supports simple daily self-care.", "Consistent routines act as a comforting anchor for your mind.", "Focusing on immediate physical comfort brings stable grounding."];
  }
  if (id === "wealth") {
    if (isSupportive) return ["A disciplined approach to resources begins to show subtle, positive returns.", "Financial planning feels clear and structured, helping secure long-term goals.", "Conversations regarding family assets move forward with constructive ease."];
    if (isSensitive) return ["Patience with temporary resource delays protects your peace of mind.", "Evaluating expenses calmly prevents impulsive financial steps today.", "A cautious, structured boundary with outgoing funds is highly supportive."];
    return ["Maintaining a simple budget tracking routine keeps your mind relaxed.", "Focusing on capital preservation provides an excellent stable baseline.", "A quiet period for reviewing accounts supports long-term security."];
  }
  if (id === "siblings") {
    if (isSupportive) return ["Your daily self-efforts carry a determined, constructive energy today.", "Methodical communication opens smooth pathways with peers and close contacts.", "A courageous spark helps you initiate structured writing or local projects."];
    if (isSensitive) return ["Approaching colleagues with extra patience helps prevent minor misunderstandings.", "Short journeys or dynamic plans succeed when you allow extra time.", "Expressing thoughts softly keeps interactions cooperative."];
    return ["Quiet consistency in your daily checklist builds solid progress.", "A steady, practical tone resolves minor communication tasks smoothly.", "Focusing on immediate execution brings a quiet sense of accomplishment."];
  }
  if (id === "home") {
    if (isSupportive) return ["The domestic atmosphere shifts toward a quiet, comforting harmony.", "Spending calm moments at home restores your deep emotional reserves.", "A nurturing focus on your living space creates a beautiful sanctuary."];
    if (isSensitive) return ["Emotional boundaries at home help keep the domestic environment quiet.", "Offering extra care to family members' wellness creates gentle stability.", "Taking quiet pauses prevents household tasks from feeling urgent."];
    return ["A steady, low-noise domestic routine brings comfort today.", "Simple home organizing tasks support an orderly state of mind.", "Focusing on basic domestic comforts grounds your emotional core."];
  }
  if (id === "children") {
    if (isSupportive) return ["Creative inspiration flows easily when you trust your natural rhythm.", "Your intellectual focus is sharp, making it ideal for deep study or planning.", "Relational interactions feel warm, honest, and grounded in mutual respect."];
    if (isSensitive) return ["Patience with creative blockages allows fresh ideas to mature naturally.", "Steering clear of hasty speculative risks keeps your progress secure.", "Channeling emotional intensity into structured learning yields wonderful rewards."];
    return ["Maintaining a consistent study or creative routine builds confidence.", "Keeping expectations realistic supports stable, loving connections.", "A calm, methodical approach to learning feels highly sustainable."];
  }
  if (id === "health") {
    if (isSupportive) return ["The physical system recovers energy efficiently when given wholesome inputs.", "Approaching daily chores with a service-oriented mindset feels deeply satisfying.", "A balanced daily rhythm supports structural physical wellness."];
    if (isSensitive) return ["Listening carefully to your body's early rest signals preserves vitality.", "Regular meal timings and plenty of hydration support smooth digestion.", "A quiet, screen-free evening helps wind down a sensitive nervous system."];
    return ["Keeping a moderate, steady movement schedule supports joint comfort.", "Simple, consistent wellness choices protect your physical baseline.", "Managing daily chores methodically prevents mental fatigue."];
  }
  if (id === "spouse") {
    if (isSupportive) return ["Shared goals and collaborative plans feel naturally aligned today.", "An atmosphere of mutual understanding softens any historical frictions.", "Clear, gentle dialogues reinforce the strength of your primary bonds."];
    if (isSensitive) return ["Relationships flourish when sensitive topics are approached with patient listening.", "Clarifying assumptions early and softly keeps partnerships harmonious.", "A calm, unhurried tone prevents minor domestic debates from escalating."];
    return ["Maintaining open and quiet communication channels ensures steady harmony.", "Keeping mutual expectations mature and balanced feels deeply anchoring.", "Handling joint responsibilities methodically supports stable trust."];
  }
  if (id === "transformation") {
    if (isSupportive) return ["Quiet introspection yields beautiful psychological clarity today.", "Deep analytical tasks or research move forward with exceptional focus.", "Letting go of old emotional baggage feels liberating and natural."];
    if (isSensitive) return ["A calm, detached perspective makes handling minor delays effortlessly.", "Allowing plans to evolve organically clears away unnecessary pressure.", "Focusing on internal healing helps release obsessive control loops."];
    return ["A quiet phase supports steady contemplation and personal reflection.", "Managing pending tax, insurance, or joint account paperwork goes smoothly.", "Keeping a low profile allows you to process thoughts without external noise."];
  }
  if (id === "wisdom") {
    if (isSupportive) return ["A deep sense of wisdom guides your decisions into productive avenues.", "Philosophical insights offer a beautiful sense of perspective and direction.", "Conversations with mentors or father figures carry mutual respect and learning."];
    if (isSensitive) return ["Philosophical doubts clear up when you focus on simple, practical truths.", "Respectful listening during senior discussions preserves harmony.", "Patience with long-term educational plans allows details to settle nicely."];
    return ["A regular daily reading or meditation habit grounds your mindset.", "Reflecting quietly on long-term goals keeps your steps aligned.", "A balanced appreciation of senior guidance supports steady growth."];
  }
  if (id === "career") {
    if (isSupportive) return ["Professional execution feels clear, helping you build positive momentum.", "A methodical approach to leadership responsibilities gains quiet respect.", "Your focus on project quality supports long-term career positioning."];
    if (isSensitive) return ["Saturn's steady transit requires disciplined execution over rapid shifts.", "Approaching workspace changes with a calm, methodical attitude ensures stability.", "Relying on clear project logs and documentation prevents minor miscommunications."];
    return ["Quietly executing your current tasks ensures reliable progress.", "Keeping professional logs transparent and up-to-date supports trust.", "A stable routine keeps workload stress completely manageable."];
  }
  if (id === "gains") {
    if (isSupportive) return ["Collaborative network opportunities align beautifully with your goals.", "Interactions with elder siblings or friends bring constructive support.", "Methodical progress toward revenue streams shows steady, reliable gains."];
    if (isSensitive) return ["A conservative approach to joint financial plans keeps your assets safe.", "Patience with processing delays in payments prevents unnecessary worry.", "Verifying collaborative details thoroughly before committing protects your interests."];
    return ["Maintaining clean boundaries with social acquaintances keeps life simple.", "Tracking your secondary streams of revenue calmly supports budgeting.", "Consistent check-ins with reliable associates foster long-term ties."];
  }
  // expenses
  if (isSupportive) return ["Quiet solitude provides a deeply restorative and healing influence.", "Planned allocations toward long-term learning feel highly constructive.", "A quiet bedtime schedule supports deep, refreshing sleep quality."];
  if (isSensitive) return ["Restricting evening cognitive stimulation helps calm a busy mind for sleep.", "Strict, structured tracking prevents minor leaks in your daily budget.", "Creating a low-noise wind-down window restores physical vitality."];
  return ["Consistent sleep hygiene practices support deep cellular recovery.", "A simple tracking habit keeps outflow of funds highly predictable.", "Allocating brief moments for quiet self-reflection grounds the day."];
}

function getCautionForDomain(
  id: string,
  primaryPlanet: string,
  transits: string[],
  mode: OutputMode
): string {
  const isPandit = mode === "PANDIT";

  if (isPandit) {
    if (id === "self") return "सकारात्मक सोच बनाए रखें और स्वास्थ्य पर ध्यान दें।";
    if (id === "wealth") return "बिना सोचे-समझे निवेश करने या पैसे उधार देने से बचें।";
    if (id === "siblings") return "दूसरों के साथ बातचीत में तंज या कड़वाहट से बचें।";
    if (id === "home") return "पारिवारिक शांति बनाए रखने के लिए प्रतिक्रिया देने में थोड़ा रुकें।";
    if (id === "children") return "शॉर्टकट वाले निवेशों और अति-उत्साह में बड़े जोखिमों से बचें।";
    if (id === "health") return "सोने और खाने के समय को नियमित रखें, देर रात जागने से बचें।";
    if (id === "spouse") return "जीवनसाथी के साथ बातचीत में संयम और उदारता बनाए रखें।";
    if (id === "transformation") return "वाहन चलाते समय अतिरिक्त सावधानी रखें और अनावश्यक विचारों से बचें।";
    if (id === "wisdom") return "वरिष्ठों के साथ वैचारिक मतभेद होने पर मौन रहकर विचार करें।";
    if (id === "career") return "कार्यक्षेत्र में जल्दबाजी में निर्णय न लें और नियमित काम पर टिके रहें।";
    if (id === "gains") return "किसी मित्र के कहने पर उधार देने या बड़ी डीलिंग में शामिल होने से बचें।";
    return "अनावश्यक खर्चों पर नियंत्रण रखें और रात को स्क्रीन से दूर रहें।";
  }

  if (id === "self") return "Nurture positive thoughts and honor bodily recovery signals.";
  if (id === "wealth") return "Refrain from speculative investments or unverified lending commitments.";
  if (id === "siblings") return "Avoid reactive or sharp exchanges with colleagues and associates.";
  if (id === "home") return "Pace your interactions to support home and domestic harmony.";
  if (id === "children") return "Steer completely clear of volatile speculative financial channels.";
  if (id === "health") return "Lock in sleep schedules and avoid late-night caffeine or screens.";
  if (id === "spouse") return "Use gentle, clear expressions and patient dialogue in partnerships.";
  if (id === "transformation") return "Take extra care during transit and release obsolete emotional loops.";
  if (id === "wisdom") return "Remain patient and receptive when listening to elder counsel.";
  if (id === "career") return "Avoid sudden professional shifts; focus on methodical execution.";
  if (id === "gains") return "Exercise structured caution regarding collaborative capital commitments.";
  return "Establish strict limits on outflow and protect bedtime rest quality.";
}

function buildDomainNarrativeBox(
  id: string,
  title: string,
  titleHindi: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transits: string[],
  dasha: DashaContext,
  mode: OutputMode
): string {
  const isPandit = mode === "PANDIT";
  
  const md = dasha.md.planet;
  const ad = dasha.ad.planet;
  const pd = dasha.pd.planet;

  if (isPandit) {
    if (id === "self") {
      if (strength === "supportive") return \`Beta, abhi tumhari dasha mein \${md} aur \${ad} ka achha prabhav chal raha hai, aur tumhare lagna swami \${primaryPlanet} ki sthiti kaafi anukul hai. Vyaktitva aur physical energy mein ek naya nikhara aane ke yog hain. Confidence ko sahi disha mein lagao aur khud par poora vishwas rakho.\`;
      if (strength === "sensitive") return \`Beta, lagnesh \${primaryPlanet} aur gochar mein sensitive planets ke prabhav ke karan body thoda heavy feel kar sakti hai. Is samay tumhare dasha chakra mein \${ad}/\${pd} ka chalna bata raha hai ki chinta se door rehna aur thoda rest lena faydemand rahega.\`;
      return \`Beta, lagnesh \${primaryPlanet} abhi normal sthiti mein hain. Tumhari active dasha \${md}/\${ad} ke chalte ek behad stable aur quiet period chal raha hai. Daily routine ko simple aur organized rakho.\`;
    }
    if (id === "wealth") {
      if (strength === "supportive") return \`Beta, tumhare dhana bhav ke swami \${primaryPlanet} hain aur abhi dasha mein \${ad} ki shakti mil rahi hai, jisse financial position behtar hone ke sanket hain. Disciplined savings shuru karo, yeh shubh samay hai.\`;
      if (strength === "sensitive") return \`Beta, abhi gochar mein sensitive planets dhana bhav ko prabhavit kar rahe hain. active dasha \${md}/\${pd} ke chalte koi bhi speculative risk mat lena, budget par dhyan do.\`;
      return \`Beta, tumhare dhana swami \${primaryPlanet} abhi stable hain. Budgeting aur tracking clean rakhna, Laxmi ji ki kripa bani rahegi.\`;
    }
    if (id === "siblings") {
      if (strength === "supportive") return \`Beta, tritiya swami \${primaryPlanet} ka gochar aur active dasha sahas ko badhane wala hai. Writing aur communication ke kshetr mein tarakki ho sakti hai.\`;
      if (strength === "sensitive") return \`Beta, tritiya swami \${primaryPlanet} par sensitive transits ke karan peers ke sath communication mein tone bilkul soft rakhna zaroori hai.\`;
      return \`Beta, sahas bhav ke swami \${primaryPlanet} normal sthiti mein chal rahe hain. quiet consistency se apne kaam karte raho.\`;
    }
    if (id === "home") {
      if (strength === "supportive") return \`Beta, chaturtha swami \${primaryPlanet} aur gochar ke shubh asar se ghar ka vatavaran behad shant rahega. Mata ji ka aashirwad tumhare sath hai.\`;
      if (strength === "sensitive") return \`Beta, chaturtha bhav par sensitive planets ka pressure hai. active dasha \${md}/\${pd} ke chalte mata ji ki health aur domestic peace ka dhyan rakhna zaroori hai.\`;
      return \`Beta, chaturtha bhav ke swami \${primaryPlanet} stable hain. Domestic comfort aur home maintenance ke pending kaamo ko quietly nipatane ke liye anukul samay hai.\`;
    }
    if (id === "children") {
      if (strength === "supportive") return \`Beta, pancham swami \${primaryPlanet} aur dasha swami \${ad} ki kripa se creative learning aur studies mein breakthrough mil sakta hai. Bhole Baba ka dhyan karo.\`;
      if (strength === "sensitive") return \`Beta, active dasha \${md}/\${pd} aur sensitive transit ke chalte shares ya speculative market mein galti se bhi paisa mat lagana.\`;
      return \`Beta, pancham swami \${primaryPlanet} stable phase mein hain. Methodical study aur consistent learning routine banaye rakhein.\`;
    }
    if (id === "health") {
      if (strength === "supportive") return \`Beta, shastha swami \${primaryPlanet} aur dasha ki sthiti anukul hone se physical recovery bahut tez rahegi. exercise aur wholesome diet support karegi.\`;
      if (strength === "sensitive") return \`Beta, gochar mein sensitive planets shastha bhav ko dekh rahe hain. sleep aur routine ko lock kar lo, push mat karo.\`;
      return \`Beta, shastha bhav ke swami \${primaryPlanet} normal sthiti mein hain. Health stable rahegi, bas daily schedules regular rakhein.\`;
    }
    if (id === "spouse") {
      if (strength === "supportive") return \`Beta, saptam swami \${primaryPlanet} ki anukulata se marital life aur partnerships mein prem badhega. Sukhi raho.\`;
      if (strength === "sensitive") return \`Beta, saptam swami \${primaryPlanet} par sensitive transits ke prabhav ke karan partner ki baat ko poore dhairya se suno, reactive mat hona.\`;
      return \`Beta, saptam bhav ke swami \${primaryPlanet} stable hain. open communication aur mutual respect se balance bana rahega.\`;
    }
    if (id === "transformation") {
      if (strength === "supportive") return \`Beta, ashtam swami \${primaryPlanet} aur active dasha research ya deep psychology mein interest badhayegi. inner healing ke liye shubh samay hai.\`;
      if (strength === "sensitive") return \`Beta, ashtam bhav par pressure zone hai. Driving carefully karo aur sudden changes ke samay ghabrana mat.\`;
      return \`Beta, ashtam swami \${primaryPlanet} stable hain. pending tax ya insurance se jude kaam bina kisi rukavat ke quietly pure honge.\`;
    }
    if (id === "wisdom") {
      if (strength === "supportive") return \`Beta, navam swami \${primaryPlanet} ki shubh sthiti bhagya ko mazboot karegi. Mentors aur father ka support milega.\`;
      if (strength === "sensitive") return \`Beta, navam swami \${primaryPlanet} par transit ke karan karma par focus rakho, bhagya ke bharose kaam mat talo.\`;
      return \`Beta, navam swami \${primaryPlanet} stable hain. daily spiritual practice aur seniors ke sath respect banaye rakhein.\`;
    }
    if (id === "career") {
      if (strength === "supportive") return \`Beta, tumhare dasham bhav ke swami \${primaryPlanet} hain aur dasha mein \${ad} ki shakti mil rahi hai, jisse authority aur recognition badhne ke yog hain. Projects confidence se execute karo.\`;
      if (strength === "sensitive") return \`Beta, active dasha \${md}/\${pd} ke chalte workspace par responsibilities aur workload kafi rahega. Ego conflicts se bacho aur methodical kaam karo.\`;
      return \`Beta, dasham swami \${primaryPlanet} stable hain. Quiet consistency hi career mein steady growth degi.\`;
    }
    if (id === "gains") {
      if (strength === "supportive") return \`Beta, ekadash swami \${primaryPlanet} aur dasha ki anukulata income aur networks ko expand karegi. long-term goals quietly materialize honge.\`;
      if (strength === "sensitive") return \`Beta, active dasha \${md}/\${pd} ke chalte payments aane mein temporary delays ho sakte hain. Loan dene se bacho.\`;
      return \`Beta, ekadash swami \${primaryPlanet} stable hain. cash allocations conservative rakho aur budget systematically manage karo.\`;
    }
    // expenses
    if (strength === "supportive") return \`Beta, dvadash swami \${primaryPlanet} aur active dasha \${ad} ke asar se mediation aur deep sleep ka shubh yog hai. Solitude ka anand lo.\`;
    if (strength === "sensitive") return \`Beta, gochar aur active dasha ke chalte overthinking ho sakti hai. Budget control tight rakho aur sone se pehle screen band karo.\`;
    return \`Beta, dvadash swami \${primaryPlanet} stable hain. sleep schedule regular rakho aur expenditures quietly track karo.\`;
  } else {
    if (id === "self") {
      if (strength === "supportive") return \`My dear, governed by your ascendant lord \${primaryPlanet}, your vitality and personal clarity receive a highly constructive boost. It is a wonderful phase for implementing positive habits and executing personal goals.\`;
      if (strength === "sensitive") return \`My dear, with sensitive transits affecting your ascendant ruler \${primaryPlanet}, physical fatigue can manifest under heavy workloads. Prioritize recovery and proceed with a gentle daily pace.\`;
      return \`My dear, with ascendant ruler \${primaryPlanet} in a stable position, you are in a quiet building phase. Keep your daily routine steady and grounded.\`;
    }
    if (id === "wealth") {
      if (strength === "supportive") return \`My dear, your wealth lord \${primaryPlanet} is well-placed, suggesting a highly constructive window for financial discipline and systematic asset building.\`;
      if (strength === "sensitive") return \`My dear, sensitive transits passing through your financial sector indicate financial volatility. Completely avoid speculative risks and maintain a structured budget.\`;
      return \`My dear, your accumulated wealth lord \${primaryPlanet} is stable. Keep inflow and outflow in a balanced, predictable routine.\`;
    }
    if (id === "siblings") {
      if (strength === "supportive") return \`My dear, the position of effort ruler \${primaryPlanet} ignites positive courage and methodical progress in daily communication and peer projects.\`;
      if (strength === "sensitive") return \`My dear, your effort sector ruler \${primaryPlanet} is under sensitive transit pressure. Maintain a soft, patient, and professional tone to bypass minor peer friction.\`;
      return \`My dear, with effort ruler \${primaryPlanet} stable, quiet consistency and structured execution will be your best assets today.\`;
    }
    if (id === "home") {
      if (strength === "supportive") return \`My dear, the ruler of your domestic life, \${primaryPlanet}, supports a comforting, peaceful atmosphere. Spend quiet moments restoring your emotional reserves.\`;
      if (strength === "sensitive") return \`My dear, sensitive transits in your home house suggest minor domestic friction or maternal wellness checks. Keep your living space calm and low-noise.\`;
      return \`My dear, home ruler \${primaryPlanet} is stable. Focus quietly on minor domestic maintenance or pending family adjustments.\`;
    }
    if (id === "children") {
      if (strength === "supportive") return \`My dear, creative and intellectual projects move forward beautifully as pancham swami \${primaryPlanet} brings sharp focus and clear choices.\`;
      if (strength === "sensitive") return \`My dear, active dasha \${md}/\${pd} and sensitive transits require pausing speculative financial risks. Channel emotional drive into structured learning.\`;
      return \`My dear, children house lord \${primaryPlanet} is in a stable configuration. Keep romantic expectations and academic routines steady.\`;
    }
    if (id === "health") {
      if (strength === "supportive") return \`My dear, with health house ruler \${primaryPlanet} supportive, physical recovery is efficient. wholsome routine choices will easily compound fitness gains.\`;
      if (strength === "sensitive") return \`My dear, sensitive transits affecting health ruler \${primaryPlanet} demand structured sleep and digestion hygiene. Listen to early bodily signals.\`;
      return \`My dear, recovery ruler \${primaryPlanet} is stable. Maintain standard wellness habits and avoid unnecessary physical push today.\`;
    }
    if (id === "spouse") {
      if (strength === "supportive") return \`My dear, your relationship ruler \${primaryPlanet} is well-placed, encouraging loving, clear, and highly supportive connections in your partnerships.\`;
      if (strength === "sensitive") return \`My dear, relationship ruler \${primaryPlanet} receives sensitive transits. Avoid reactive debates; listen patiently and clear assumptions early.\`;
      return \`My dear, partner lord \${primaryPlanet} is in a stable state. Mutual expectations will proceed in a steady, mature, and balanced flow.\`;
    }
    if (id === "transformation") {
      if (strength === "supportive") return \`My dear, the ruler of your transformative house, \${primaryPlanet}, supports deep research, tax filings, and Occult studies. Insights emerge during quietude.\`;
      if (strength === "sensitive") return \`My dear, sensitive transits indicate unexpected timeline shifts. Maintain a detached, calm mind and take extra care during journeys.\`;
      return \`My dear, transformation lord \${primaryPlanet} is stable. Resolve insurance, tax, or joint estate paperwork quietly without rush.\`;
    }
    if (id === "wisdom") {
      if (strength === "supportive") return \`My dear, wisdom ruler \${primaryPlanet} is highly active, bringing supportive guidance from father or mentors. A great time for philosophical learning.\`;
      if (strength === "sensitive") return \`My dear, wisdom lord \${primaryPlanet} is under sensitive pressure. Respect senior guidance and avoid forcing long-term travel plans today.\`;
      return \`My dear, wisdom ruler \${primaryPlanet} is stable. Keep up with spiritual practice and structured philosophical reading.\`;
    }
    if (id === "career") {
      if (strength === "supportive") return \`My dear, governed by career lord \${primaryPlanet}, you are in a highly constructive positioning phase. leadership opportunities can materialize through systematic planning.\`;
      if (strength === "sensitive") return \`My dear, career house ruler \${primaryPlanet} receives sensitive transits, indicating elevated workplace workloads. Avoid workplace debates; focus on systematic task completion.\`;
      return \`My dear, career lord \${primaryPlanet} is stable. Continue building professional quality calmly; consistent progress will bear results.\`;
    }
    if (id === "gains") {
      if (strength === "supportive") return \`My dear, gains lord \${primaryPlanet} expands network opportunities and secondary revenues. Your long-term goals quietly begin to align.\`;
      if (strength === "sensitive") return \`My dear, active dasha \${md}/\${pd} in your gains house can trigger minor payout delays. Keep cash allocation conservative and verify network associations.\`;
      return \`My dear, gains ruler \${primaryPlanet} is in a stable configuration. Track revenue details quietly and keep social boundaries clear.\`;
    }
    // expenses
    if (strength === "supportive") return \`My dear, expenditures ruler \${primaryPlanet} supports planned long-term allocations and restful solitude. Sleep quality is deep.\`;
    if (strength === "sensitive") return \`My dear, sensitive transits in your solitude house suggest sleep interruptions. Keep a disciplined screen-free bedtime routine.\`;
    return \`My dear, expenditure ruler \${primaryPlanet} is stable. Track minor outflow details quietly and cultivate moments of self-reflection.\`;
  }
}

function getDomainStatusLabels(
  id: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transitsInHouse: string[],
  dasha: DashaContext
): { label: string; labelHindi: string } {
  if (transitsInHouse.includes("Jupiter")) {
    return { label: "Breakthrough", labelHindi: "अनुकूल" };
  }
  if (transitsInHouse.includes("Saturn")) {
    return { label: "Disciplined", labelHindi: "संतुलित" };
  }
  if (transitsInHouse.includes("Rahu") || transitsInHouse.includes("Ketu")) {
    return { label: "Transformational", labelHindi: "परिवर्तनशील" };
  }
  if (dasha.md.planet === primaryPlanet || dasha.ad.planet === primaryPlanet) {
    return { label: "Active", labelHindi: "सक्रिय" };
  }
  if (strength === "sensitive") {
    return { label: "Under Pressure", labelHindi: "दबावयुक्त" };
  }
  if (id === "spouse" || id === "siblings") {
    return { label: "Collaborative", labelHindi: "सहयोगी" };
  }
  return { label: "Stable", labelHindi: "स्थिर" };
}

function buildWhyThisMatters(
  id: string,
  strength: "supportive" | "sensitive" | "neutral",
  primaryPlanet: string,
  transitsInHouse: string[],
  dasha: DashaContext
) {
  let transitReasoning = "";
  let transitReasoningHindi = "";
  if (transitsInHouse.length > 0) {
    transitReasoning = \`The transit of \${transitsInHouse.join(" and ")} through this house directly activates its core themes, prompting active adjustments in this sphere.\`;
    transitReasoningHindi = \`इस भाव में \${transitsInHouse.join(" और ")} का गोचर इसके मुख्य विषयों को सीधे जागृत कर रहा है, जिससे इस क्षेत्र में बदलाव आ रहे हैं।\`;
  } else {
    transitReasoning = "No major slow transits are directly affecting this house, allowing its affairs to settle into a quiet, stable phase.";
    transitReasoningHindi = "कोई भी बड़ा गोचर सीधे इस भाव को प्रभावित नहीं कर रहा है, जिससे इसके कार्य एक शांत और स्थिर चरण में बने हुए हैं।";
  }

  let dashaInfluence = "";
  let dashaInfluenceHindi = "";
  if (dasha.md.planet === primaryPlanet) {
    dashaInfluence = \`Governed by the Mahadasha lord (\${primaryPlanet}), this house represents a long-term central focus of your entire current life cycle.\`;
    dashaInfluenceHindi = \`महादशा स्वामी (\${primaryPlanet}) द्वारा शासित होने के कारण, यह भाव आपके वर्तमान जीवन चक्र का एक दीर्घकालिक केंद्रीय फोकस है।\`;
  } else if (dasha.ad.planet === primaryPlanet) {
    dashaInfluence = \`Governed by the active Antardasha lord (\${primaryPlanet}), this house undergoes dynamic activation, bringing immediate priorities to the forefront.\`;
    dashaInfluenceHindi = \`सक्रिय अंतर्दशा स्वामी (\${primaryPlanet}) द्वारा शासित, यह भाव गतिशील रूप से सक्रिय है, जिससे तात्कालिक प्राथमिकताएं सामने आ रही हैं।\`;
  } else {
    dashaInfluence = \`The active Dasha lords are not directly ruling this sector, allowing its energy to function as a quiet, supportive background layer.\`;
    dashaInfluenceHindi = \`सक्रिय दशा स्वामी सीधे इस क्षेत्र पर शासन नहीं कर रहे हैं, जिससे इसकी ऊर्जा एक शांत, सहायक पृष्ठभूमि के रूप में कार्य कर रही है।\`;
  }

  const practicalMap = {
    self: {
      supportive: "Establishing a clean, regular morning routine helps capture the day's peak productive energy.",
      sensitive: "A structured limit on daily physical commitments prevents sudden fatigue.",
      neutral: "Documenting simple daily wins keeps self-motivation naturally high.",
      supportiveH: "एक स्वच्छ, नियमित सुबह की दिनचर्या स्थापित करने से दिन की उच्च उत्पादक ऊर्जा को हासिल करने में मदद मिलती है।",
      sensitiveH: "दैनिक शारीरिक प्रतिबद्धताओं पर एक व्यवस्थित सीमा लगाने से अचानक होने वाली थकान से बचाव होता है।",
      neutralH: "दैनिक छोटी जीतों को दर्ज करने से आत्म-प्रेरणा स्वाभाविक रूप से बनी रहती है।"
    },
    wealth: {
      supportive: "A systematic review of long-term allocations ensures assets remain productive.",
      sensitive: "Verifying transaction statements and pausing major expenditures keeps cash protected.",
      neutral: "Tracking daily outflows calmly builds a clear picture of financial health.",
      supportiveH: "दीर्घकालिक आवंटन की एक व्यवस्थित समीक्षा यह सुनिश्चित करती है कि संपत्ति उत्पादक बनी रहे।",
      sensitiveH: "लेन-देन के विवरणों को सत्यापित करना और बड़े खर्चों को टालना नकदी को सुरक्षित रखता है।",
      neutralH: "दैनिक खर्चों को शांत रहकर ट्रैक करने से वित्तीय स्थिति की स्पष्ट तस्वीर बनती है।"
    },
    siblings: {
      supportive: "Drafting clear outlines before meetings keeps daily self-efforts efficient.",
      sensitive: "Drafting emails calmly and delaying sensitive responses avoids communication friction.",
      neutral: "Quietly completing your scheduled writing tasks ensures clean progress.",
      supportiveH: "बैठकों से पहले स्पष्ट रूपरेखा तैयार करने से दैनिक प्रयास कुशल बने रहते हैं।",
      sensitiveH: "शांत रहकर ईमेल लिखना और संवेदनशील प्रतिक्रियाओं को टालना संचार घर्षण से बचाता है।",
      neutralH: "निर्धारित लेखन कार्यों को शांति से पूरा करना स्पष्ट प्रगति सुनिश्चित करता है।"
    },
    home: {
      supportive: "Decluttering your immediate workspace at home immediately refreshes domestic harmony.",
      sensitive: "Setting a low-noise, comfortable space for evening family rest supports everyone.",
      neutral: "Steady domestic maintenance tasks keep your surroundings structured.",
      supportiveH: "घर पर अपने कार्यक्षेत्र को व्यवस्थित करने से पारिवारिक सामंजस्य तुरंत ताज़ा हो जाता है।",
      sensitiveH: "शाम के पारिवारिक आराम के लिए एक शांत और आरामदायक स्थान निर्धारित करना सभी का समर्थन करता है।",
      neutralH: "निरंतर घरेलू रखरखाव के कार्य आपके परिवेश को व्यवस्थित बनाए रखते हैं।"
    },
    children: {
      supportive: "Dedicate block-time to structured learning or a creative skill to harness peak focus.",
      sensitive: "Pausing all speculative investment actions keeps your primary funds safe.",
      neutral: "A regular, realistic learning schedule builds stable knowledge compounding.",
      supportiveH: "शिखर ध्यान केंद्रित करने के लिए व्यवस्थित अध्ययन या रचनात्मक कौशल के लिए समय समर्पित करें।",
      sensitiveH: "सभी सट्टा निवेशों पर रोक लगाना आपके प्राथमिक धन को सुरक्षित रखता है।",
      neutralH: "एक नियमित और वास्तविक अध्ययन कार्यक्रम ज्ञान के स्थिर संचय का निर्माण करता है।"
    },
    health: {
      supportive: "Simple, clean dietary choices and light exercise support a high energy level.",
      sensitive: "Locking in exact sleep and meal times protects your physical system.",
      neutral: "Steady, moderate daily movement keeps the body feeling light and ready.",
      supportiveH: "सरल, स्वच्छ आहार विकल्प और हल्का व्यायाम ऊर्जा के स्तर को ऊंचा बनाए रखते हैं।",
      sensitiveH: "सोने और खाने के सटीक समय को निश्चित करना आपके शारीरिक स्वास्थ्य की रक्षा करता है।",
      neutralH: "निरंतर और मध्यम दैनिक गतिविधि शरीर को हल्का और तैयार महसूस कराती है।"
    },
    spouse: {
      supportive: "Setting aside dedicated quality time for collaborative dialogue deepens trust.",
      sensitive: "Using direct, gentle phrases and active listening resolves minor issues smoothly.",
      neutral: "Regular, calm check-ins on shared tasks keep alliances operating smoothly.",
      supportiveH: "सहयोगात्मक संवाद के लिए समर्पित गुणवत्तापूर्ण समय निकालना आपसी विश्वास को गहरा करता है।",
      sensitiveH: "सीधे, कोमल शब्दों का उपयोग और सक्रिय रूप से सुनना छोटी समस्याओं को आसानी से हल करता है।",
      neutralH: "साझा कार्यों पर नियमित, शांत चर्चा गठजोड़ को सुचारू रूप से संचालित रखती है।"
    },
    transformation: {
      supportive: "Quiet research or structural reviews of paperwork move forward with ease.",
      sensitive: "Delaying major high-risk activities and keeping driving speed moderate is wise.",
      neutral: "Resolving pending insurance or filing duties quietly prevents administrative lag.",
      supportiveH: "शांत अनुसंधान या कागजी कार्रवाई की संरचनात्मक समीक्षा आसानी से आगे बढ़ती है।",
      sensitiveH: "उच्च जोखिम वाली गतिविधियों को टालना और वाहन की गति मध्यम रखना बुद्धिमानी है।",
      neutralH: "लंबित बीमा या कर कागजात को शांति से हल करना प्रशासनिक देरी को रोकता है।"
    },
    wisdom: {
      supportive: "Reflecting on philosophical books or senior guidance offers clear direction.",
      sensitive: "Approaching conversations with mentors with patient, respectful listening is helpful.",
      neutral: "A regular morning reading session adds stable value to your long-term vision.",
      supportiveH: "दार्शनिक पुस्तकों या वरिष्ठों के मार्गदर्शन पर विचार करना स्पष्ट दिशा प्रदान करता है।",
      sensitiveH: "गुरुओं के साथ बातचीत में धैर्य और सम्मानपूर्वक सुनना मददगार होता है।",
      neutralH: "सुबह की नियमित अध्ययन दिनचर्या आपके दीर्घकालिक दृष्टिकोण में मूल्य जोड़ती है।"
    },
    career: {
      supportive: "Documenting accomplishments clearly and taking on structured duties gains respect.",
      sensitive: "Focusing entirely on executing existing projects methodically secures your position.",
      neutral: "Keeping professional records organized and updated ensures reliable progress.",
      supportiveH: "उपलब्धियों को स्पष्ट रूप से दर्ज करना और संरचित कर्तव्यों को संभालना सम्मान दिलाता है।",
      sensitiveH: "मौजूदा परियोजनाओं को व्यवस्थित रूप से निष्पादित करने पर ध्यान केंद्रित करना आपकी स्थिति सुरक्षित करता है।",
      neutralH: "पेशेवर अभिलेखों को व्यवस्थित और अद्यतित रखना विश्वसनीय प्रगति सुनिश्चित करता है।"
    },
    gains: {
      supportive: "Reaching out to verified network contacts opens very constructive avenues.",
      sensitive: "Keeping cash allocations conservative and postponing peer lending is highly recommended.",
      neutral: "Calmly tracking secondary income streams keeps financial goals clear.",
      supportiveH: "सत्यापित संपर्कों से संपर्क साधना अत्यंत रचनात्मक मार्ग प्रशस्त करता है।",
      sensitiveH: "नकदी के आवंटन को रूढ़िवादी रखना और दूसरों को उधार देना टालना अत्यधिक अनुशंसित है।",
      neutralH: "द्वितीयक आय धाराओं को शांत रहकर ट्रैक करना वित्तीय लक्ष्यों को स्पष्ट रखता है।"
    },
    expenses: {
      supportive: "Structuring a quiet meditation or reflection retreat restores your energy.",
      sensitive: "Setting strict limits on evening screen usage immediately supports sleep quality.",
      neutral: "Tracking minor cash outflows methodically ensures zero budget surprises.",
      supportiveH: "एक शांत ध्यान या आत्मनिरीक्षण की दिनचर्या बनाना आपकी ऊर्जा को पुनर्जीवित करता है।",
      sensitiveH: "शाम को स्क्रीन के उपयोग पर सख्त सीमाएं लगाना तुरंत नींद की गुणवत्ता का समर्थन करता है।",
      neutralH: "छोटे खर्चों को व्यवस्थित रूप से ट्रैक करना बजट में किसी भी अनपेक्षित आश्चर्य से बचाता है।"
    }
  };

  const emotionalMap = {
    self: {
      supportive: "Emotional balance feels natural when personal time is protected.",
      sensitive: "Slowing down your breathing during hectic moments preserves vital peace.",
      neutral: "Quiet self-acceptance acts as a strong anchor against outer noise.",
      supportiveH: "व्यक्तिगत समय सुरक्षित रहने पर भावनात्मक संतुलन स्वाभाविक महसूस होता है।",
      sensitiveH: "व्यस्त क्षणों में सांसों की गति को धीमा करना महत्वपूर्ण शांति बनाए रखता है।",
      neutralH: "शांत आत्म-स्वीकृति बाहरी कोलाहल के खिलाफ एक मजबूत आधार का काम करती है।"
    },
    wealth: {
      supportive: "A quiet confidence in your resources allows you to focus on growth.",
      sensitive: "Reminding yourself that capital preservation is a form of active progress reduces worry.",
      neutral: "Gratitude for small financial stabilities creates a harmonious money mindset.",
      supportiveH: "अपने संसाधनों में शांत आत्मविश्वास आपको विकास पर ध्यान केंद्रित करने की अनुमति देता है।",
      sensitiveH: "स्वयं को यह याद दिलाना कि पूंजी की सुरक्षा भी सक्रिय प्रगति है, चिंता को कम करता है।",
      neutralH: "छोटी वित्तीय स्थिरता के लिए आभार व्यक्त करना एक सामंजस्यपूर्ण सोच का निर्माण करता है।"
    },
    siblings: {
      supportive: "A serene confidence in your capabilities makes execution feel natural.",
      sensitive: "Steering clear of defensive verbal loops preserves mental clarity.",
      neutral: "A practical focus on execution rather than external approval grounds your mind.",
      supportiveH: "अपनी क्षमताओं में शांत आत्मविश्वास कार्य निष्पादन को स्वाभाविक बनाता है।",
      sensitiveH: "बचावात्मक तर्कों से दूर रहना मानसिक स्पष्टता की रक्षा करता है।",
      neutralH: "बाहरी अनुमोदन के बजाय काम पर व्यावहारिक ध्यान देना आपके दिमाग को केंद्रित रखता है।"
    },
    home: {
      supportive: "Resting quietly in a comfortable corner restores your emotional reserve.",
      sensitive: "Reminding yourself that domestic peace is a process helps handle daily chores calmly.",
      neutral: "A peaceful living environment naturally reflects in your daily decisions.",
      supportiveH: "एक आरामदायक कोने में शांति से विश्राम करना आपकी भावनात्मक ऊर्जा को बहाल करता है।",
      sensitiveH: "स्वयं को यह याद दिलाना कि घरेलू शांति एक प्रक्रिया है, दैनिक कार्यों को शांत रखता है।",
      neutralH: "एक शांतिपूर्ण जीवन वातावरण स्वाभाविक रूप से आपके दैनिक निर्णयों में झलकता है।"
    },
    children: {
      supportive: "Creative confidence rises when you express ideas without self-doubt.",
      sensitive: "Allowing creative blockages to pass without frustration restores inspiration.",
      neutral: "Keeping romantic or personal expectations realistic creates lasting peace.",
      supportiveH: "आत्म-संदेह के बिना विचारों को व्यक्त करने से रचनात्मक आत्मविश्वास बढ़ता है।",
      sensitiveH: "रचनात्मक अवरोधों को बिना निराशा के गुजरने देने से प्रेरणा पुनः लौट आती है।",
      neutralH: "व्यक्तिगत अपेक्षाओं को वास्तविक रखना स्थायी शांति का निर्माण करता है।"
    },
    health: {
      supportive: "A clean body rhythm naturally yields a highly optimized state of mind.",
      sensitive: "Responding gently to early bodily fatigue signs avoids energy exhaustion.",
      neutral: "Approaching daily wellness choices without pressure supports steady health.",
      supportiveH: "शरीर की स्वच्छ लय स्वाभाविक रूप से मन की एक अत्यधिक अनुकूलित अवस्था प्रदान करती है।",
      sensitiveH: "शारीरिक थकान के शुरुआती संकेतों पर कोमलता से प्रतिक्रिया देने से ऊर्जा क्षय से बचाव होता है।",
      neutralH: "दबाव के बिना दैनिक स्वास्थ्य विकल्पों को अपनाना निरंतर स्वास्थ्य का समर्थन करता है।"
    },
    spouse: {
      supportive: "A serene trust in shared relationships makes daily interactions harmonious.",
      sensitive: "Letting go of small relational expectations keeps the atmosphere light.",
      neutral: "Approaching partnerships with maturity keeps emotional boundaries clear.",
      supportiveH: "साझा संबंधों में शांत विश्वास दैनिक अंतःक्रियाओं को सामंजस्यपूर्ण बनाता है।",
      sensitiveH: "छोटी-मोटी आपसी अपेक्षाओं को जाने देना वातावरण को हल्का बनाए रखता है।",
      neutralH: "परिपक्वता के साथ साझेदारी को अपनाना भावनात्मक सीमाओं को स्पष्ट रखता है।"
    },
    transformation: {
      supportive: "Deep psychological insight emerges when outer noise is reduced.",
      sensitive: "Accepting that timing adjustments are a natural part of growth reduces stress.",
      neutral: "Quiet contemplation helps process thoughts in a balanced, grounded way.",
      supportiveH: "बाहरी शोर कम होने पर गहरी मनोवैज्ञानिक समझ उभरती है।",
      sensitiveH: "यह स्वीकार करना कि समय का समायोजन विकास का एक स्वाभाविक हिस्सा है, तनाव कम करता है।",
      neutralH: "शांत चिंतन विचारों को संतुलित और जमीनी रूप से संसाधित करने में मदद करता है।"
    },
    wisdom: {
      supportive: "A deep, serene trust in timing brings quiet reassurance.",
      sensitive: "Accepting slow developments with patience keeps you focused.",
      neutral: "Wisdom flows naturally when you align daily choices with mature principles.",
      supportiveH: "समय चक्र पर गहरा, शांत विश्वास मन को आश्वस्त करता है।",
      sensitiveH: "धीमी प्रगति को धैर्य के साथ स्वीकार करना आपको केंद्रित रखता है।",
      neutralH: "जब आप दैनिक विकल्पों को परिपक्व सिद्धांतों के साथ संरेखित करते हैं, तो ज्ञान स्वतः प्रवाहित होता है।"
    },
    career: {
      supportive: "A calm confidence in your execution quality brings career peace.",
      sensitive: "Steering clear of office politics or reactive arguments keeps you grounded.",
      neutral: "Recognizing that steady execution precedes external recognition maintains focus.",
      supportiveH: "कार्य की गुणवत्ता में शांत आत्मविश्वास करियर में शांति लाता है।",
      sensitiveH: "कार्यालय की राजनीति या तीखे तर्कों से दूर रहना आपको जमीनी रूप से स्थिर रखता है।",
      neutralH: "यह समझना कि निरंतर कार्य बाहरी पहचान से पहले आता है, ध्यान बनाए रखता है।"
    },
    gains: {
      supportive: "A harmonious connection with close friends brings warm reassurance.",
      sensitive: "Staying detached from social circle gossip preserves your mental energy.",
      neutral: "A quiet network presence allows you to focus on immediate personal goals.",
      supportiveH: "करीबी दोस्तों के साथ सामंजस्यपूर्ण संबंध हार्दिक आश्वासन लाते हैं।",
      sensitiveH: "सामाजिक मंडल की गपशप से दूर रहना आपकी मानसिक ऊर्जा की रक्षा करता है।",
      neutralH: "एक शांत नेटवर्क उपस्थिति आपको तात्कालिक व्यक्तिगत लक्ष्यों पर ध्यान केंद्रित करने देती है।"
    },
    expenses: {
      supportive: "Deep rest in solitude restores your vital reserves and psychological balance.",
      sensitive: "Reminding yourself that quiet isolation is recovery, not loneliness, supports calm.",
      neutral: "A peaceful wind-down routine prepares the mind for deep recovery.",
      supportiveH: "एकांत में गहरा विश्राम आपकी जीवन शक्ति और मनोवैज्ञानिक संतुलन को बहाल करता है।",
      sensitiveH: "स्वयं को यह याद दिलाना कि शांत एकांत सुधार है, अकेलापन नहीं, मन को शांत रखता है।",
      neutralH: "एक शांतिपूर्ण शाम की दिनचर्या मन को गहरी रिकवरी के लिए तैयार करती है।"
    }
  };

  const practical = practicalMap[id] || practicalMap.self;
  const emotional = emotionalMap[id] || emotionalMap.self;

  return {
    transitReasoning,
    transitReasoningHindi,
    dashaInfluence,
    dashaInfluenceHindi,
    practicalInterpretation: strength === "supportive" ? practical.supportive : strength === "sensitive" ? practical.sensitive : practical.neutral,
    practicalInterpretationHindi: strength === "supportive" ? practical.supportiveH : strength === "sensitive" ? practical.sensitiveH : practical.neutralH,
    emotionalGuidance: strength === "supportive" ? emotional.supportive : strength === "sensitive" ? emotional.sensitive : emotional.neutral,
    emotionalGuidanceHindi: strength === "supportive" ? emotional.supportiveH : strength === "sensitive" ? emotional.sensitiveH : emotional.neutralH,
  };
}

function getHouseFromLagna(lagnaSign: number, planetLongitude: number): number {
  const planetSign = Math.floor(planetLongitude / 30) + 1;
  return ((planetSign - lagnaSign + 12) % 12) || 12;
}

function generateLifeDomainPredictions(
  chart: ChartData,
  transits: TransitData,
  dasha: DashaContext,
  mode: OutputMode
): LifeDomainCard[] {
  const lagnaSign = chart.lagna.sign;
  
  const domainsData = [
    { id: "self", icon: "👤", title: "Identity & Vitality", titleHindi: "प्रथम भाव (तनु भाव)", houseNum: 1 },
    { id: "wealth", icon: "💰", title: "Accumulated Wealth & Family", titleHindi: "द्वितीय भाव (धन भाव)", houseNum: 2 },
    { id: "siblings", icon: "💪", title: "Self-Efforts & Courage", titleHindi: "तृतीय भाव (सहज भाव)", houseNum: 3 },
    { id: "home", icon: "🏠", title: "Mother, Home & Peace", titleHindi: "चतुर्थ भाव (सुख भाव)", houseNum: 4 },
    { id: "children", icon: "🎓", title: "Creativity, Intellect & Romance", titleHindi: "पंचम भाव (पुत्र भाव)", houseNum: 5 },
    { id: "health", icon: "🛡️", title: "Physical Recovery & Service", titleHindi: "षष्ठ भाव (शत्रु/रोग भाव)", houseNum: 6 },
    { id: "spouse", icon: "🤝", title: "Partnerships & Marriage", titleHindi: "सप्तम भाव (जाया भाव)", houseNum: 7 },
    { id: "transformation", icon: "🌊", title: "Longevity & Unexpected Changes", titleHindi: "अष्टम भाव (आयु/मृत्यु भाव)", houseNum: 8 },
    { id: "wisdom", icon: "🪔", title: "Wisdom, Father & Fortune", titleHindi: "नवम भाव (धर्म/भाग्य भाव)", houseNum: 9 },
    { id: "career", icon: "💼", title: "Profession & Status", titleHindi: "दशम भाव (कर्म भाव)", houseNum: 10 },
    { id: "gains", icon: "📈", title: "Material Gains & Networks", titleHindi: "एकादश भाव (लाभ भाव)", houseNum: 11 },
    { id: "expenses", icon: "🌙", title: "Solitude & Expenditures", titleHindi: "द्वादश भाव (व्यय भाव)", houseNum: 12 },
  ];

  const planetWeights = {
    Saturn: 1.0,
    Rahu: 0.95,
    Jupiter: 0.9,
    Ketu: 0.85,
    Mars: 0.6,
    Venus: 0.5,
    Sun: 0.4,
    Moon: 0.2,
    Mercury: 0.4,
  };

  const mdPlanet = dasha.md.planet;
  const adPlanet = dasha.ad.planet;
  const pdPlanet = dasha.pd.planet;

  const houseDetails = domainsData.map((d) => {
    const mapping = resolveHouseSignAndLord(lagnaSign, d.houseNum);
    const signName = mapping.sign;
    const primaryPlanet = mapping.lord;

    const transitsInHouse = [];
    transits.positions.forEach((p) => {
      const transitHouse = getHouseFromLagna(lagnaSign, p.longitude);
      if (transitHouse === d.houseNum) {
        transitsInHouse.push(p.name);
      }
    });

    let transitScore = 0;
    transitsInHouse.forEach((p) => {
      transitScore += (planetWeights[p] || 0.3);
    });

    let dashaScore = 0;
    if (primaryPlanet === mdPlanet) dashaScore += 1.0;
    if (primaryPlanet === adPlanet) dashaScore += 0.8;
    if (primaryPlanet === pdPlanet) dashaScore += 0.6;

    const totalActivation = transitScore + dashaScore;

    return {
      d,
      primaryPlanet,
      signName,
      transitsInHouse,
      totalActivation,
    };
  });

  const sortedDetails = [...houseDetails].sort((a, b) => b.totalActivation - a.totalActivation);
  const mostActiveIds = new Set();
  let activeCount = 0;
  for (const item of sortedDetails) {
    if (item.totalActivation >= 0.8 && activeCount < 2) {
      mostActiveIds.add(item.d.id);
      activeCount++;
    }
  }

  return houseDetails.map(({ d, primaryPlanet, signName, transitsInHouse }) => {
    const isMostActive = mostActiveIds.has(d.id);

    let strength = "neutral";
    if (transitsInHouse.includes("Jupiter")) {
      strength = "supportive";
    } else if (transitsInHouse.includes("Saturn") || transitsInHouse.includes("Rahu") || transitsInHouse.includes("Ketu")) {
      strength = "sensitive";
    } else if (mdPlanet === primaryPlanet || adPlanet === primaryPlanet) {
      strength = "supportive";
    }

    const planetSignals = [
      \`Lord: \${primaryPlanet}\`,
      \`House: \${signName}\`,
      ...transitsInHouse.map((p) => \`\${p} Transit\`),
    ];

    const activatedPatterns = getActivatedPatternsForDomain(d.id, strength, primaryPlanet, transitsInHouse);
    const caution = strength === "sensitive"
      ? getCautionForDomain(d.id, primaryPlanet, transitsInHouse, mode)
      : null;

    const narrative = buildDomainNarrativeBox(d.id, d.title, d.titleHindi, strength, primaryPlanet, transitsInHouse, dasha, mode);
    const statusLabels = getDomainStatusLabels(d.id, strength, primaryPlanet, transitsInHouse, dasha);

    let emphasisTag = null;
    let emphasisTagHindi = null;

    if (isMostActive) {
      emphasisTag = "Most Active";
      emphasisTagHindi = "सर्वाधिक सक्रिय";
    } else if (transitsInHouse.length > 0 || primaryPlanet === mdPlanet || primaryPlanet === adPlanet || primaryPlanet === pdPlanet) {
      emphasisTag = "Currently Influenced";
      emphasisTagHindi = "वर्तमान में प्रभावित";
    }

    let confidenceTone = "Stable Anchor";
    let confidenceToneHindi = "स्थिर आधार";

    if (emphasisTag === "Most Active") {
      if (strength === "sensitive") {
        confidenceTone = "Temporarily Sensitive";
        confidenceToneHindi = "अस्थायी संवेदनशील";
      } else {
        confidenceTone = "Strongly Activated";
        confidenceToneHindi = "सक्रिय प्रभाव";
      }
    } else if (emphasisTag === "Currently Influenced") {
      if (strength === "sensitive") {
        confidenceTone = "Mildly Influenced";
        confidenceToneHindi = "मंद प्रभाव";
      } else {
        confidenceTone = "Gradually Building";
        confidenceToneHindi = "क्रमशः निर्मित";
      }
    }

    let timingWindow = "Stable, long-term alignment.";
    let timingWindowHindi = "स्थिर और दीर्घकालिक प्रभाव।";

    if (transitsInHouse.includes("Moon")) {
      timingWindow = "Most noticeable over the next 24–48 hours.";
      timingWindowHindi = "अगले 24-48 घंटों के दौरान सबसे प्रभावी।";
    } else if (transitsInHouse.includes("Saturn") || transitsInHouse.includes("Rahu") || transitsInHouse.includes("Ketu")) {
      timingWindow = "Core theme over the next 30–45 days.";
      timingWindowHindi = "अगले 30-45 दिनों के दौरान मुख्य प्रभाव।";
    } else if (transitsInHouse.some((p) => ["Sun", "Mars", "Mercury", "Venus"].includes(p))) {
      timingWindow = "Active influence for the next 7–14 days.";
      timingWindowHindi = "अगले 7-14 दिनों तक सक्रिय प्रभाव।";
    }

    const whyThisMatters = buildWhyThisMatters(d.id, strength, primaryPlanet, transitsInHouse, dasha);

    return {
      id: d.id,
      icon: d.icon,
      title: d.title,
      titleHindi: d.titleHindi,
      narrative,
      planetSignals,
      activatedPatterns,
      caution,
      primaryPlanet,
      strength,
      statusLabel: statusLabels.label,
      statusLabelHindi: statusLabels.labelHindi,
      emphasisTag,
      emphasisTagHindi,
      confidenceTone,
      confidenceToneHindi,
      timingWindow,
      timingWindowHindi,
      whyThisMatters,
    };
  });
}
`;

const updatedContent = beforeContent + newContentPart;
fs.writeFileSync(targetFilePath, updatedContent, 'utf8');
console.log('Successfully wrote route.ts update!');
process.exit(0);
