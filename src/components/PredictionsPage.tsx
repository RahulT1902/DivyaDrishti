"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Target, Briefcase, Wallet, Heart, Activity, Sparkles, ArrowRight, ArrowLeft, Loader2, Shield, Zap, ChevronDown, ChevronUp, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { authFetch } from "@/lib/auth/webFetch";

type Timeframe = "today" | "this-week" | "this-month" | "year";
type Domain = "career" | "finance" | "health" | "relationships" | "general";

type LifeDomainCard = {
  id: string;
  icon: string;
  title: string;
  titleHindi: string;
  planetSignals: string[];
  activatedPatterns: string[];
  caution: string | null;
  primaryPlanet: string;
  strength: "supportive" | "sensitive" | "neutral";
};

type DetailedPayload = {
  narrative?: string;
  analysis?: string;
  detailedReport?: Record<string, { title?: string; content?: string }>;
  keyPoints?: string[];
  lifeDomainPredictions?: LifeDomainCard[];
};

const PERIODS: { id: Timeframe; label: string; sub: string; icon: string }[] = [
  { id: "today", label: "Today", sub: "Daily guidance", icon: "☀️" },
  { id: "this-week", label: "This Week", sub: "7-day outlook", icon: "🌙" },
  { id: "this-month", label: "Monthly", sub: "30-day forecast", icon: "📅" },
  { id: "year", label: "Yearly", sub: "Annual blueprint", icon: "🪐" },
];

const DOMAINS: { id: Domain; label: string; sub: string; icon: any }[] = [
  { id: "career", label: "Career", sub: "Work & Ambition", icon: Briefcase },
  { id: "finance", label: "Finance", sub: "Wealth & Stability", icon: Wallet },
  { id: "health", label: "Health", sub: "Vitality & Energy", icon: Activity },
  { id: "relationships", label: "Relationships", sub: "Love & Bonds", icon: Heart },
  { id: "general", label: "General", sub: "Overall Life Flow", icon: Sparkles },
];

// Static mock predictions per domain
const MOCK_PREDICTIONS: Record<Domain, Record<Timeframe, { headline: string; summary: string; dos: string[]; donts: string[]; verdict: string }>> = {
  career: {
    today: { headline: "Saturn favours steady, methodical work today.", summary: "Avoid rushing into new decisions. Your discipline today plants seeds for next month's harvest. Communication with seniors could open a door.", dos: ["Complete pending tasks before starting new ones", "Have a one-on-one with a mentor or senior"], donts: ["Avoid reactive decisions under pressure", "Don't overcommit to new deadlines"], verdict: "Low action day. Consolidate what you have." },
    "this-week": { headline: "A structurally significant week for professional growth.", summary: "Jupiter's aspect on your 10th house brings quiet recognition. A conversation mid-week could plant seeds for a major opportunity in 30 days.", dos: ["Document your recent achievements", "Schedule a senior-level meeting this week"], donts: ["Avoid impulsive career pivots", "Don't make financial commitments without clarity"], verdict: "Medium action. Plan and position, don't execute yet." },
    "this-month": { headline: "October is your most strategically important month.", summary: "Saturn rewards all the groundwork laid since June. A major project or role clarification is likely. Discipline in the first two weeks unlocks the opportunity in the last two.", dos: ["Finalise long-pending proposals", "Build systems, not just outputs"], donts: ["Avoid ego conflicts with authority figures", "Don't scatter focus across too many projects"], verdict: "High action month. This is the window to consolidate gains." },
    year: { headline: "The Saturn Mahadasha is rewriting your professional foundations.", summary: "2025–2026 is not about speed — it's about depth. The careers and reputations built this year will sustain you for the next decade. Favour specialisation over breadth.", dos: ["Invest in one deep skill", "Take on roles with long-term equity, not just short-term pay"], donts: ["Avoid frequent job-hopping", "Don't ignore health for professional targets"], verdict: "Foundational year. Build structures that last." },
  },
  finance: {
    today: { headline: "Conservative financial day — avoid impulsive spending.", summary: "Moon's position suggests emotional spending tendencies today. Review your budget and hold on large commitments.", dos: ["Review monthly expenses", "Transfer to savings if possible"], donts: ["Avoid major purchases", "Don't take financial advice from unreliable sources"], verdict: "Hold position. Nothing urgent today." },
    "this-week": { headline: "Financial clarity improves mid-week.", summary: "A pending receivable or income confirmation is likely by Thursday. Keep your documentation ready.", dos: ["Follow up on pending payments", "Audit subscriptions and recurring costs"], donts: ["Avoid lending money this week", "Don't make speculative investments"], verdict: "Cautiously optimistic. Receive before you deploy." },
    "this-month": { headline: "Strong month for budgeting and wealth building.", summary: "Jupiter supports income stability while Saturn keeps spending disciplined. Ideal month to start a SIP or close a long-pending financial plan.", dos: ["Start or increase a systematic investment", "Consult a financial advisor for annual planning"], donts: ["Avoid high-risk speculations", "Don't delay tax planning any further"], verdict: "Action month for financial systems. Build, don't gamble." },
    year: { headline: "Wealth accumulation phase — slow but certain.", summary: "This year favours conservative, compounding strategies. Real estate or long-term equity will outperform speculative plays. Avoid leverage.", dos: ["Max out tax-saving instruments", "Build a 6-month emergency fund"], donts: ["Avoid crypto or highly speculative assets", "Don't co-sign loans for others"], verdict: "Conservative wealth-building year. Patience pays." },
  },
  health: {
    today: { headline: "Low energy possible — prioritise rest.", summary: "Moon in Taurus suggests a slower, more embodied day. Don't push through exhaustion. Hydration and grounding activities help.", dos: ["Take a 20-minute walk outdoors", "Prioritise 7-8 hours of sleep tonight"], donts: ["Avoid heavy late-night meals", "Don't skip meals or over-caffeinate"], verdict: "Rest and restore. Don't override your body today." },
    "this-week": { headline: "Build sustainable health habits this week.", summary: "Saturn's discipline energy supports forming new routines. A habit started this week is likely to stick. Focus on consistency over intensity.", dos: ["Start a morning routine (even 15 minutes)", "Add one wholesome meal to your day"], donts: ["Avoid skipping exercise to catch up on work", "Don't neglect mental health signals"], verdict: "Foundation week for health. Start small, stay consistent." },
    "this-month": { headline: "Monthly health check-in recommended.", summary: "With Saturn active, joints, bones, and chronic conditions need attention. A doctor visit for a routine check-up is well-timed this month.", dos: ["Schedule a health check-up", "Add a Vitamin D and B12 supplement check"], donts: ["Avoid ignoring persistent aches", "Don't delay dental or eye care"], verdict: "Preventive care month. Catch issues early." },
    year: { headline: "Structural health maintenance year.", summary: "Saturn's influence asks you to treat your body like a long-term asset. Invest in sleep, posture, and stress management. Ignore vanity metrics, fix the foundations.", dos: ["Build a consistent sleep schedule", "Explore yoga or strength training as lifetime habits"], donts: ["Avoid fad diets or extreme fitness regimes", "Don't neglect mental health as performance pressures increase"], verdict: "Vitality investment year. Your body needs discipline, not punishment." },
  },
  relationships: {
    today: { headline: "Emotional warmth available — receive it gracefully.", summary: "Moon in Taurus brings a stable, nurturing energy to close relationships today. A heart-to-heart conversation will feel natural.", dos: ["Spend quality time with a close person", "Express appreciation to someone you often take for granted"], donts: ["Avoid unnecessary arguments or defensiveness", "Don't bring up old grievances today"], verdict: "Nurturing day. Give and receive warmth." },
    "this-week": { headline: "Communication in relationships gets clearer.", summary: "Mercury's position supports honest, clear communication. If you've been delaying a difficult conversation, this week is the right time.", dos: ["Have the conversation you've been avoiding", "Listen more than you speak in conflicts"], donts: ["Avoid passive-aggressive behaviour", "Don't make relationship decisions when emotionally triggered"], verdict: "Clarity week. Communicate what matters." },
    "this-month": { headline: "Relationship reflection month — not action month.", summary: "Saturn asks you to evaluate what's sustainable in your personal relationships. Quality over quantity. Who genuinely supports your growth?", dos: ["Invest time in relationships that feel mutual", "Set healthy boundaries where you feel drained"], donts: ["Avoid people-pleasing at your own expense", "Don't make permanent relationship decisions in haste"], verdict: "Evaluation month. Prune gently, nurture what matters." },
    year: { headline: "Long-term relationship bonds deepen or clarify.", summary: "Saturn's presence tests the authenticity of bonds. Superficial connections fall away; meaningful ones solidify. A year for loyalty and depth.", dos: ["Invest in a few deep relationships", "For couples: build shared goals and rituals"], donts: ["Avoid entering new relationships out of loneliness", "Don't neglect your primary relationship for work"], verdict: "Depth over breadth year. Real bonds strengthen under Saturn." },
  },
  general: {
    today: { headline: "A grounded, introspective day.", summary: "Today favours reflection over action. Your intuition is sharp — use it to assess situations rather than react to them.", dos: ["Meditate or journal for 10 minutes", "Review your current priorities honestly"], donts: ["Avoid major decisions under emotional pressure", "Don't compare your timeline to others"], verdict: "Observe and prepare. Clarity before action." },
    "this-week": { headline: "Productive week with moderate energy.", summary: "A balanced week — good for steady progress on existing commitments rather than new launches. Mid-week brings good problem-solving energy.", dos: ["Focus on completing tasks already in progress", "Connect with a mentor or guide"], donts: ["Avoid impulsive commitments", "Don't overload your schedule"], verdict: "Steady progress week. Finish before you start." },
    "this-month": { headline: "A pivotal month in your Saturn journey.", summary: "This month consolidates the work of the last three. Expect one clarity breakthrough and one unexpected challenge. Both are part of the same growth arc.", dos: ["Maintain your routines even when motivation dips", "Document insights — they're valuable now"], donts: ["Avoid shortcuts that compromise long-term goals", "Don't let one hard week derail the whole month"], verdict: "Consolidation month. Stay steady through the dip." },
    year: { headline: "A defining year of foundation-building.", summary: "2025 is not about peak moments — it's about roots. The decisions made quietly this year will echo for the next decade. Focus on depth, discipline, and authenticity.", dos: ["Build one major habit or skill this year", "Simplify your life — fewer commitments, deeper execution"], donts: ["Avoid chasing external validation", "Don't sacrifice health or relationships for ambition"], verdict: "Root year. Grow down before you grow up." },
  },
};

export default function PredictionsPage({ chartData }: { chartData?: any }) {
  const { isHindi, mode: globalMode } = useLanguage();
  const [step, setStep] = useState<"period" | "domain" | "result">("period");
  const [period, setPeriod] = useState<Timeframe | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(false);

  // Detailed Prediction States
  const [showDetailed, setShowDetailed] = useState(false);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedData, setDetailedData] = useState<DetailedPayload | null>(null);
  const [mode, setMode] = useState<"PANDIT" | "SIMPLE_ENGLISH">("PANDIT");

  React.useEffect(() => {
    if (globalMode) {
      setMode(globalMode);
    }
  }, [globalMode]);

  // Re-fetch prediction narrative when global language/mode changes
  React.useEffect(() => {
    if (period && domain && step === "result") {
      fetchDetailedPrediction(mode);
    }
  }, [mode]);

  // Bounded Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "pundit"; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const selectPeriod = (p: Timeframe) => {
    setPeriod(p);
    setStep("domain");
  };

  const selectDomain = async (d: Domain) => {
    setDomain(d);
    setLoading(true);
    setDetailedData(null);
    setChatOpen(false);
    setChatMessages([]);
    
    try {
      const tf = period === "year" ? "this-year" : period;
      const dm = d === "general" ? "growth" : d;
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
      const fetchUrl = `/api/predictions/analyze?timeframe=${tf}&domain=${dm}&mode=${globalMode}&email=${encodeURIComponent(userEmail)}`;
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (data.success) {
        setDetailedData(data.predictions);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  const toggleChat = () => {
    if (!chatOpen && chatMessages.length === 0 && period && domain) {
      const displayPeriod = period === "this-week" ? "THIS WEEK" : period === "this-month" ? "THIS MONTH" : period.toUpperCase();
      
      const defaultMsg = isHindi
        ? `प्रणाम। आइए, आपके इस समय के लिए ${domain === "career" ? "आजीविका" : domain === "finance" ? "वित्त" : domain === "health" ? "स्वास्थ्य" : domain === "relationships" ? "संबंध" : "सामान्य"} चक्र से संबंधित शंकाओं का निवारण करें। आप इस मार्गदर्शन के किस पहलू को अधिक स्पष्टता से समझना चाहते हैं?`
        : `Pranam. Let's clarify your doubts regarding your ${domain.toUpperCase()} guidance for ${displayPeriod}. What specific aspect of this guidance would you like to understand better?`;

      setChatMessages([
        {
          role: "pundit",
          content: defaultMsg
        }
      ]);
    }
    setChatOpen(prev => !prev);
  };

  const handleSendChatMessage = async (text: string = chatInput) => {
    if (!text.trim() || chatLoading || !domain || !period) return;

    const userMsg: { role: "user" | "pundit"; content: string } = { role: "user", content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
      const res = await fetch("/api/astrology/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          domain: domain,
          timeframe: period === "year" ? "this-year" : period,
          email: userEmail
        }),
      });
      const result = await res.json();

      if (result.success) {
        setChatMessages(prev => [
          ...prev,
          {
            role: "pundit",
            content: result.data.answer
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            role: "pundit",
            content: "The cosmic lines are noisy. Please try rephrasing your question or asking again shortly."
          }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: "pundit",
          content: "I am unable to reach the celestial engine right now."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchDetailedPrediction = async (currentMode: "PANDIT" | "SIMPLE_ENGLISH") => {
    if (!period || !domain) return;
    setDetailedLoading(true);
    try {
      const tf = period === "year" ? "this-year" : period;
      const dm = domain === "general" ? "growth" : domain;
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("divya:userEmail") || "" : "";
      const res = await authFetch(`/api/predictions/analyze?timeframe=${tf}&domain=${dm}&mode=${currentMode}`);
      const data = await res.json();
      if (data.success) {
        setDetailedData(data.predictions);
      }
    } catch (err) {
      console.error("Failed to fetch detailed predictions:", err);
    } finally {
      setDetailedLoading(false);
    }
  };

  // Get live predictions based on dynamic chartData
  const getLivePrediction = (p: Timeframe, d: Domain) => {
    const md = chartData?.temporal?.stack?.mahadasha || "Saturn";
    const ad = chartData?.temporal?.stack?.antardasha || "Jupiter";

    if (d === "career" && chartData?.domainIntelligence?.career) {
      const career = chartData.domainIntelligence.career;
      return {
        headline: career.theme || `Career synthesis under active ${md}-${ad} cycle.`,
        summary: career.verdict || "Your career vectors are being structured. Follow disciplined timelines.",
        dos: chartData.guidance?.do?.slice(0, 3) || ["Establish baseline goals", "Document metrics"],
        donts: chartData.guidance?.avoid?.slice(0, 3) || ["Rushed pivots", "Impulsive over-exertion"],
        verdict: `A highly structured period governed by your ${md} Mahadasha.`
      };
    }

    if (d === "finance" && chartData?.domainIntelligence?.finance) {
      const finance = chartData.domainIntelligence.finance;
      return {
        headline: finance.theme || `Financial alignment and resources during ${md}-${ad}.`,
        summary: finance.verdict || "Consolidate your capital resources. Prioritize low volatility over high-risk spec.",
        dos: chartData.guidance?.do?.slice(1, 4) || ["Track cash outflow", "Audit structural expenses"],
        donts: chartData.guidance?.avoid?.slice(1, 4) || ["Speculative leverage", "Unverified partnerships"],
        verdict: `Capital conservation is strongly supported in this ${ad} Antardasha.`
      };
    }

    // Default mock lookup
    return MOCK_PREDICTIONS[d]?.[p] || MOCK_PREDICTIONS.general.today;
  };

  const prediction = period && domain ? getLivePrediction(period, domain) : null;
  const isPandit = mode === "PANDIT";

  // Helper parsers for detailed data
  const extractScore = (content?: string): number => {
    if (!content) return 5.8;
    const match = content.match(/(\d+(\.\d+)?)\s*\/\s*10/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return 5.8;
  };

  const parseStrategicGuidance = (content?: string) => {
    if (!content) return { dos: [], donts: [] };
    const lines = content.split("\n");
    const dos: string[] = [];
    const donts: string[] = [];
    let currentGroup: "do" | "avoid" | null = null;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;
      if (clean.toLowerCase().includes("what to do") || clean.includes("क्या करें") || clean.toLowerCase().includes("favourable")) {
        currentGroup = "do";
        continue;
      }
      if (clean.toLowerCase().includes("what to avoid") || clean.includes("क्या करने से बचें") || clean.toLowerCase().includes("avoid")) {
        currentGroup = "avoid";
        continue;
      }
      if (clean.startsWith("-") || clean.startsWith("•") || clean.startsWith("*")) {
        const bullet = clean.replace(/^[-•*]\s*/, "");
        if (currentGroup === "do") {
          dos.push(bullet);
        } else if (currentGroup === "avoid") {
          donts.push(bullet);
        }
      }
    }
    return { dos, donts };
  };

  const getSoftStrengthLabel = (score: number) => {
    if (score >= 7.8) return isPandit ? "अत्यंत अनुकूल ऊर्जा (Breakthrough)" : "Breakthrough Alignment (Smooth Flow)";
    if (score >= 6.8) return isPandit ? "सकारात्मक और सहायक (Supportive)" : "Supportive Energy (High Potential)";
    if (score >= 5.8) return isPandit ? "स्थिर और संतुलित (Stable)" : "Stable (Moderate Energy)";
    if (score >= 4.8) return isPandit ? "संवेदनशील लेकिन प्रबंधनीय (Sensitive)" : "Sensitive but Manageable";
    return isPandit ? "सतर्कता और विश्राम (Caution)" : "High Volatility (Rest & Consolidate)";
  };

  const getTimingFlow = (d: Domain) => {
    const flows: Record<Domain, { morning: string; afternoon: string; evening: string }> = {
      career: {
        morning: isPandit ? "धीमी शुरुआत, आज की कार्य प्राथमिकताओं की शांत योजना बनाएं।" : "Slow activation; calmly plan your professional priorities.",
        afternoon: isPandit ? "सक्रिय कार्य संपादन, मीटिंग और निष्पादन के लिए सबसे सक्रिय समय।" : "Focused execution, high-leverage work, and decisions.",
        evening: isPandit ? "किए गए काम की समीक्षा करें, शाम में नए बड़े फैसले टालें।" : "Review completed work; defer large fresh decisions."
      },
      finance: {
        morning: isPandit ? "शांत दिमाग से संख्या और अपने खातों की समीक्षा करें।" : "Audit numbers calmly; avoid reactive early checks.",
        afternoon: isPandit ? "पहले से योजनाबद्ध निवेश या आवश्यक लेनदेन पूरे करें।" : "Execute planned allocations and budget items.",
        evening: isPandit ? " excitement या जल्दबाजी में आकर अनावश्यक खर्च से बचें।" : "Refuse impulse money decisions or emotional spend triggers."
      },
      health: {
        morning: isPandit ? "शरीर थोड़ा भारी महसूस हो सकता है, सुबह की गति धीमी रखें।" : "Body may feel slightly heavy; activate gently.",
        afternoon: isPandit ? "हल्का व्यायाम, टहलना या खिंचाव करना ऊर्जा बढ़ाएगा।" : "Suits light stretching, walking, or posture check.",
        evening: isPandit ? "मस्तिष्क को शांत करें, स्क्रीन समय घटाएं और विश्राम लें।" : "Nervous-system downshift; digital detox before sleep."
      },
      relationships: {
        morning: isPandit ? "भावनात्मक संवेदनशीलता अधिक रहेगी, शांत शुरुआत करें।" : "High emotional sensitivity; preserve quiet early vibes.",
        afternoon: isPandit ? "सुलझाने, स्पष्ट बातचीत और तालमेल के लिए अनुकूल।" : "Best for clear communication and mutual decisions.",
        evening: isPandit ? "वाणी का स्वर कोमल रखें, पुरानी बातों पर बहस टालें।" : "Keep tone soft; prioritize patience and listening."
      },
      general: {
        morning: isPandit ? "योजना बनाने, आत्म-चिंतन और शांत चिंतन के लिए श्रेष्ठ।" : "Ideal for learning setup and clear daily prioritizing.",
        afternoon: isPandit ? "सक्रिय अभ्यास, कार्य निष्पादन और प्रगति के लिए उत्तम।" : "Strongest execution window for applied knowledge.",
        evening: isPandit ? "आज क्या लागू किया, इसकी शांत समीक्षा करें और मौन लें।" : "Reflect on actual application; calm down the mind."
      }
    };
    const mapped = d === "relationships" || d === "career" || d === "finance" || d === "health" ? d : "general";
    return flows[mapped];
  };

  const getRemedy = (d: Domain) => {
    const remedies: Record<Domain, { icon: string; title: string; content: string }> = {
      career: {
        icon: "🪔",
        title: isPandit ? "कर्म उपाय" : "Discipline Remedy",
        content: isPandit 
          ? "आज किसी कामगार या जरूरतमंद व्यक्ति की गुप्त सहायता करें अथवा 'ॐ शनैश्चराय नमः' का ११ बार जाप करें।"
          : "Silently offer appreciation or help to a service worker, or take 2 minutes of silent focus before starting work."
      },
      finance: {
        icon: "💰",
        title: isPandit ? "संतोष उपाय" : "Abundance Remedy",
        content: isPandit
          ? "आज पक्षियों को दाना डालें अथवा जल अर्पित करें; किसी भी रूप में छोटा दान या आभार व्यक्त करें।"
          : "Offer water/grain to birds, or express one word of gratitude for your current capital security."
      },
      health: {
        icon: "🕉️",
        title: isPandit ? "प्राण उपाय" : "Prana Remedy",
        content: isPandit
          ? "प्रातः काल ५ मिनट गहरी सांस (अनुलोम-विलोम) लें और प्रकृति/सूर्य के प्रकाश में समय बिताएं।"
          : "Spend 5 minutes doing deep breathing (Pranayama) or step outdoors into morning sunlight for immediate regulation."
      },
      relationships: {
        icon: "🌸",
        title: isPandit ? "सौम्यता उपाय" : "Harmony Remedy",
        content: isPandit
          ? "आज अपने घर या कार्यस्थल पर किसी को मीठा खिलाएं और अपनी वाणी में अत्यंत सौम्यता रखें।"
          : "Share a sweet or kind gesture with someone today, or express one sincere, unprompted word of appreciation."
      },
      general: {
        icon: "✨",
        title: isPandit ? "शांत उपाय" : "Clarity Remedy",
        content: isPandit
          ? "शाम के समय एक कपूर जलाएं और सोने से पहले ५ मिनट मौन बैठकर विचारों को विश्राम दें।"
          : "Light a camphor candle/diya, or dedicate 5 minutes to absolute digital silence before sleeping."
      }
    };
    const mapped = d === "relationships" || d === "career" || d === "finance" || d === "health" ? d : "general";
    return remedies[mapped];
  };

  // Derive parameters from dynamic detailedData
  const scoreVal = detailedData?.detailedReport?.finalVerdict?.content 
    ? extractScore(detailedData.detailedReport.finalVerdict.content)
    : 5.8;
  const softScoreLabel = getSoftStrengthLabel(scoreVal);
  const scoreLevel = scoreVal >= 7.5 ? "supportive" : scoreVal >= 5.8 ? "neutral" : "sensitive";

  const parsedGuidance = parseStrategicGuidance(detailedData?.detailedReport?.strategicGuidance?.content);
  const focusList = parsedGuidance.dos.length > 0 ? parsedGuidance.dos.slice(0, 3) : (prediction?.dos?.slice(0, 3) || []);
  const avoidList = parsedGuidance.donts.length > 0 ? parsedGuidance.donts.slice(0, 3) : (prediction?.donts?.slice(0, 3) || []);

  const narrativeParagraphs = detailedData?.narrative?.split("\n\n") ?? [];
  const headlineText = narrativeParagraphs[0] || prediction?.headline || "Planetary parameters resolved.";
  const summaryText = narrativeParagraphs[1] || detailedData?.analysis || prediction?.summary || "Compounding stability through consistent action.";
  const bodyText = narrativeParagraphs.slice(2).join("\n\n");

  const timing = domain ? getTimingFlow(domain) : { morning: "", afternoon: "", evening: "" };
  const remedyObj = domain ? getRemedy(domain) : { icon: "🪔", title: "Remedy", content: "" };

  return (
    <div className="max-w-3xl mx-auto pt-4 space-y-8">
      <div>
        <h2 className={`text-2xl font-serif font-semibold text-amber-900 ${isHindi ? 'tracking-normal' : ''}`}>
          {isHindi ? "राशिफल एवं भविष्यफल" : "Predictions"}
        </h2>
        <p className="text-sm text-amber-700/50">
          {isHindi ? "व्यक्तिगत मार्गदर्शन प्राप्त करने के लिए समय-सीमा और जीवन का आयाम चुनें" : "Select a timeframe and life area to receive your personalised guidance"}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        {["period", "domain", "result"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'} ${step === s ? "text-amber-700" : i < ["period","domain","result"].indexOf(step) ? "text-emerald-600" : "text-amber-700/40"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${step === s ? "bg-amber-600 text-white" : i < ["period","domain","result"].indexOf(step) ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700/60"}`}>
                {i + 1}
              </div>
              {s === "period" ? (isHindi ? "समय-सीमा" : "Timeframe") : s === "domain" ? (isHindi ? "जीवन आयाम" : "Life Area") : (isHindi ? "मार्गदर्शन" : "Guidance")}
            </div>
            {i < 2 && <div className={`flex-1 h-px ${i < ["period","domain","result"].indexOf(step) ? "bg-emerald-300" : "bg-amber-100"}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Period */}
        {step === "period" && (
          <motion.div key="period" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="grid grid-cols-2 gap-4">
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => selectPeriod(p.id)}
                className="p-6 bg-white border border-[#F1E7D0] rounded-2xl text-left hover:border-amber-400 hover:shadow-md transition-all group shadow-sm">
                <span className="text-3xl mb-3 block">{p.icon}</span>
                <p className={`text-[10px] font-bold text-amber-600/50 uppercase mb-1 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  {isHindi ? (p.id === "today" ? "दैनिक मार्गदर्शन" : p.id === "this-week" ? "7 दिवसीय विश्लेषण" : p.id === "this-month" ? "30 दिवसीय प्रवाह" : "वार्षिक खाका") : p.sub}
                </p>
                <p className="text-xl font-serif font-semibold text-amber-900 group-hover:text-amber-700">
                  {isHindi ? (p.id === "today" ? "आज" : p.id === "this-week" ? "यह सप्ताह" : p.id === "this-month" ? "मासिक" : "वार्षिक") : p.label}
                </p>
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Domain */}
        {step === "domain" && (
          <motion.div key="domain" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-3">
            <button onClick={() => setStep("period")} className={`flex items-center gap-2 text-[10px] text-amber-600 uppercase font-bold hover:text-amber-800 transition-colors ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
              <ArrowLeft className="w-3 h-3" /> {isHindi ? `समय-सीमा बदलें (${period === "this-week" ? "यह सप्ताह" : period === "this-month" ? "मासिक" : period === "today" ? "आज" : "वार्षिक"})` : `Change Period (${period?.toUpperCase()})`}
            </button>
            {DOMAINS.map(d => {
              const Icon = d.icon;
              const domainLabel = isHindi 
                ? (d.id === "career" ? "कर्म एवं आजीविका" : d.id === "finance" ? "धन एवं समृद्धि" : d.id === "health" ? "स्वास्थ्य एवं ऊर्जा" : d.id === "relationships" ? "पारस्परिक संबंध" : "सामान्य जीवन प्रवाह") 
                : d.label;
              const domainSub = isHindi 
                ? (d.id === "career" ? "कार्यक्षेत्र एवं महत्वाकांक्षा" : d.id === "finance" ? "वैभव एवं स्थिरता" : d.id === "health" ? "दैहिक जुड़ाव एवं प्राण" : d.id === "relationships" ? "स्नेह एवं पारिवारिक संबंध" : "जीवन का समग्र प्रवाह") 
                : d.sub;
              return (
                <button key={d.id} onClick={() => selectDomain(d.id)}
                  className="w-full p-5 bg-white border border-[#F1E7D0] rounded-2xl flex items-center justify-between hover:border-amber-400 hover:shadow-md transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-serif font-semibold text-amber-900">{domainLabel}</p>
                      <p className={`text-[10px] text-amber-700/40 uppercase ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>{domainSub}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className={`text-xs text-amber-700/50 uppercase font-serif italic ${isHindi ? 'tracking-normal text-sm' : 'tracking-widest'}`}>
              {isHindi ? "ग्रहीय चक्रों और जन्म गोचर का सूक्ष्म अध्ययन किया जा रहा है..." : "Consulting the celestial cycles & birth transits..."}
            </p>
          </motion.div>
        )}

        {/* Step 3: Result (Progressive Disclosure Layout) */}
        {step === "result" && !loading && prediction && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("domain")} className={`flex items-center gap-2 text-[10px] text-amber-600 uppercase font-bold hover:text-amber-800 transition-colors ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                <ArrowLeft className="w-3 h-3" /> {isHindi ? "पीछे" : "Back"}
              </button>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-[9px] font-bold uppercase text-amber-700">
                  {isHindi ? (period === "today" ? "आज" : period === "this-week" ? "सप्ताह" : period === "this-month" ? "मासिक" : "वार्षिक") : period}
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-[9px] font-bold uppercase text-orange-700">
                  {isHindi ? (domain === "career" ? "आजीविका" : domain === "finance" ? "वित्त" : domain === "health" ? "स्वास्थ्य" : domain === "relationships" ? "संबंध" : "सामान्य") : domain}
                </span>
              </div>
            </div>

            {/* ─── LAYER 1: CONSUMABLE DAILY NUDGE ─── */}

            {/* Hero / Quick Summary Card */}
            <div className="bg-white border border-[#F1E7D0] rounded-3xl p-8 shadow-sm text-left relative overflow-hidden">
              <div className="absolute right-4 top-4 text-6xl text-amber-500/5 select-none font-serif font-bold">ॐ</div>
              <p className={`text-[10px] font-bold text-amber-600/60 uppercase mb-3 flex items-center gap-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                🪔 {isHindi ? "दैनिक मार्गदर्शन" : "Daily Guidance"}
              </p>

              {/* Softer Scoring Level Badge */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border shadow-xs ${isHindi ? 'tracking-normal' : 'tracking-wider'} ${
                  scoreLevel === "supportive" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : scoreLevel === "sensitive" 
                      ? "bg-rose-50 text-rose-800 border-rose-200" 
                      : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {softScoreLabel}
                </span>
                <span className="text-[11px] text-amber-700/50 italic">
                  {isHindi ? "वर्तमान ऊर्जा संरेखण" : "Current Energy Balance"}
                </span>
              </div>

              {/* Headline */}
              <h3 className="text-lg md:text-xl font-serif font-semibold text-amber-900 mb-4 leading-snug">
                {headlineText}
              </h3>
              
              {/* Primary Human Calming Insight */}
              <p className="text-sm text-amber-800/80 leading-relaxed font-light pl-4 border-l-2 border-amber-300">
                {summaryText}
              </p>

              {/* Full Narrative Body — remaining paragraphs */}
              {bodyText && (
                <div className="mt-4 space-y-3">
                  {bodyText.split("\n\n").map((para, i) => (
                    <p key={i} className="text-sm text-amber-800/75 leading-relaxed whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Timing Flow / Energy Curve */}
            {period === "today" && timing && (
              <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm text-left">
                <p className={`text-[10px] font-bold text-amber-600/60 uppercase mb-5 flex items-center gap-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  ⚡ {isHindi ? "दैनिक ऊर्जा प्रवाह" : "Daily Energy Flow"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Connecting Line (desktop only) */}
                  <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-amber-200/50" />

                  {/* Morning */}
                  <div className="relative bg-[#FCFBF8] border border-amber-100/40 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-200/60 flex items-center justify-center text-lg mb-2 relative z-10">
                      🌅
                    </div>
                    <span className="text-xs font-serif font-bold text-amber-900 mb-0.5">{isHindi ? "प्रातःकाल (Morning)" : "Morning"}</span>
                    <span className="text-[9px] text-amber-600/60 font-bold uppercase tracking-wider mb-2">{isHindi ? "धीमी शुरुआत" : "Gentle Awake"}</span>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed font-light">
                      {timing.morning}
                    </p>
                  </div>

                  {/* Afternoon */}
                  <div className="relative bg-[#FCFBF8] border border-amber-100/40 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-lg mb-2 relative z-10">
                      ☀️
                    </div>
                    <span className="text-xs font-serif font-bold text-amber-900 mb-0.5">{isHindi ? "मध्याह्न (Afternoon)" : "Afternoon"}</span>
                    <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider mb-2">{isHindi ? "सक्रिय कार्य" : "Peak Execution"}</span>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed font-light">
                      {timing.afternoon}
                    </p>
                  </div>

                  {/* Evening */}
                  <div className="relative bg-[#FCFBF8] border border-amber-100/40 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center text-lg mb-2 relative z-10">
                      🌙
                    </div>
                    <span className="text-xs font-serif font-bold text-amber-900 mb-0.5">{isHindi ? "सायंकाल (Evening)" : "Evening"}</span>
                    <span className="text-[9px] text-rose-700 font-bold uppercase tracking-wider mb-2">{isHindi ? "विश्राम एवं आत्म-अवलोकन" : "Recovery Mode"}</span>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed font-light">
                      {timing.evening}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeframe timelines for longer periods */}
            {period !== "today" && (
              <div className="bg-white border border-[#F1E7D0] rounded-3xl p-6 shadow-sm text-left">
                <p className={`text-[10px] font-bold text-amber-600/60 uppercase mb-4 flex items-center gap-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  📅 {isHindi ? "समय-सारणी प्रवाह" : "Timeline Flow"}
                </p>
                <div className="space-y-4">
                  {period === "this-week" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50/30 border border-amber-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-1 block">📅 {isHindi ? "शुरुआती चरण (प्रथम-द्वितीय दिवस)" : "Days 1-2"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "प्राथमिकताएं तय करें और आवश्यक लक्ष्यों का ढांचा बनाएं।" : "Setup clear priorities and lock initial tasks."}
                        </p>
                      </div>
                      <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-1 block">⚡ {isHindi ? "सक्रिय चरण (तृतीय से पंचम दिवस)" : "Days 3-5 (Peak)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "सबसे मजबूत कार्य करने का समय। मुख्य फोकस बनाए रखें।" : "Strongest execution window. Focus on quality."}
                        </p>
                      </div>
                      <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 mb-1 block">🌙 {isHindi ? "समीक्षा एवं विश्राम (षष्ठ-सप्तम दिवस)" : "Days 6-7 (Review)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "किए गए कार्यों को समेटें और अगले चक्र की शांत योजना बनाएं।" : "Consolidate your gains and plan the next cycle."}
                        </p>
                      </div>
                    </div>
                  )}
                  {period === "this-month" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50/30 border border-amber-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-1 block">📅 {isHindi ? "सप्ताह 1 (स्थिरता)" : "Week 1 (Stabilize)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "अपनी दैनिक दिनचर्या को स्थिर करें और रुके कार्यों को पूरा करें।" : "Stabilize daily routines and clear backlogs."}
                        </p>
                      </div>
                      <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-1 block">⚡ {isHindi ? "सप्ताह 2-3 (विकास प्रवाह)" : "Weeks 2-3 (Build)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "सक्रिय निर्माण और बड़े कार्यों को गति देने का सर्वोत्तम समय।" : "Peak productivity. Move your high-leverage goals."}
                        </p>
                      </div>
                      <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 mb-1 block">🌙 {isHindi ? "सप्ताह 4 (समीक्षा एवं सुदृढ़ीकरण)" : "Week 4 (Audit)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "अधूरी चीजों को पूरा करें, परिणाम देखें और समीक्षा करें।" : "Audit outcomes, tie up loose ends, and prepare next."}
                        </p>
                      </div>
                    </div>
                  )}
                  {period === "year" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50/30 border border-amber-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-1 block">📅 {isHindi ? "प्रथम चरण (दीर्घकालिक योजना)" : "Q1 (Foundation)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "मजबूत नींव, कार्य प्रणाली और नई आदतों का निर्माण।" : "Build solid foundations and long-term systems."}
                        </p>
                      </div>
                      <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-1 block">⚡ {isHindi ? "द्वितीय चरण (सघन कर्म प्रवाह)" : "Q2-Q3 (Compounding)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "निरंतर प्रयास से स्पष्ट और स्थायी लाभ प्राप्त करने का समय।" : "Consistency phase. Watch your effort compound."}
                        </p>
                      </div>
                      <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-4 shadow-xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 mb-1 block">🌙 {isHindi ? "तृतीय चरण (परिणामों को सहेजना)" : "Q4 (Consolidation)"}</span>
                        <p className="text-xs text-amber-900 leading-relaxed font-light">
                          {isHindi ? "परिणामों को सुरक्षित करें और भविष्य की नई रूपरेखा बनाएं।" : "Secure assets, audit results, and align next cycle."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Do / Don't Side-by-Side (Progressively simplified to 3 bullets max) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-3xl p-6 shadow-xs">
                <p className={`text-[10px] font-bold text-emerald-700 uppercase mb-3 flex items-center gap-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {isHindi ? "✅ इन पर ध्यान केंद्रित करें" : "✅ Focus Areas"}
                </p>
                <ul className="space-y-2">
                  {focusList.map((d: string, i: number) => (
                    <li key={i} className="text-xs text-emerald-950/80 flex items-start gap-2 leading-relaxed font-light font-sans">
                      <span className="text-emerald-500 mt-0.5 shrink-0">•</span> {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/40 border border-rose-100/60 rounded-3xl p-6 shadow-xs">
                <p className={`text-[10px] font-bold text-rose-700 uppercase mb-3 flex items-center gap-1.5 ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {isHindi ? "⚠️ सजग रहें और बचें" : "⚠️ Practices to Avoid"}
                </p>
                <ul className="space-y-2">
                  {avoidList.map((d: string, i: number) => (
                    <li key={i} className="text-xs text-rose-950/80 flex items-start gap-2 leading-relaxed font-light font-sans">
                      <span className="text-rose-400 mt-0.5 shrink-0">•</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested Remedy Card (Vedic Actionable) */}
            {remedyObj && (
              <div className="bg-amber-50/30 border border-amber-200/50 rounded-3xl p-6 flex items-start gap-4 shadow-sm text-left font-serif">
                <span className="text-3xl shrink-0">{remedyObj.icon}</span>
                <div>
                  <p className={`text-[10px] font-bold text-amber-700/60 uppercase mb-1 ${isHindi ? 'tracking-normal text-xs font-sans' : 'tracking-widest'}`}>
                    {isHindi ? (remedyObj.title === "Remedy" || remedyObj.title === "Discipline Remedy" || remedyObj.title === "Abundance Remedy" || remedyObj.title === "Prana Remedy" || remedyObj.title === "Harmony Remedy" || remedyObj.title === "Clarity Remedy" ? "उपाय" : remedyObj.title) : remedyObj.title}
                  </p>
                  <p className="text-xs font-medium text-amber-900 leading-relaxed font-sans">
                    {remedyObj.content}
                  </p>
                </div>
              </div>
            )}


            {/* ─── LAYER 2: EXPANDABLE ASTROLOGICAL ANCHORS ─── */}

            <div className="border border-amber-200/60 rounded-3xl overflow-hidden shadow-xs">
              <button 
                onClick={() => setShowDetailed(!showDetailed)}
                className="w-full py-4 px-6 bg-[#FCFAF2] text-amber-900 text-sm font-serif font-semibold tracking-wider hover:bg-amber-50 transition-all flex items-center justify-between border-b border-[#F1E7D0]"
              >
                <div className="flex items-center gap-2">
                  <span>📜</span>
                  <span>{isHindi ? "गहन ज्योतिषीय विश्लेषण (वशिष्ठ तकनीक)" : "View Deep Astrological Analysis"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {isHindi ? "वैदिक संकेतक" : "Vedic Technicals"}
                  </span>
                  {showDetailed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {showDetailed && (
                  <motion.div 
                     initial={{ opacity: 0, height: 0 }} 
                     animate={{ opacity: 1, height: "auto" }} 
                     exit={{ opacity: 0, height: 0 }}
                     className="bg-[#FCFBF8] p-6 space-y-6 text-left border-t border-[#F1E7D0] overflow-hidden"
                  >
                    {/* Language Switcher */}
                    <div className="flex items-center justify-between border-b border-[#E6DBC3]/60 pb-3">
                      <span className={`text-[10px] font-sans font-bold text-amber-700/60 uppercase ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
                        {isHindi ? "अनुवाद माध्यम" : "Translation Engine"}
                      </span>
                      <div className="inline-flex rounded-lg bg-amber-100/50 p-0.5 border border-[#E6DBC3]">
                        <button
                          onClick={() => { setMode("PANDIT"); fetchDetailedPrediction("PANDIT"); }}
                          disabled={detailedLoading}
                          className={`px-3 py-1 text-[10px] font-serif font-medium rounded-md transition-all ${
                            mode === "PANDIT" ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 hover:text-amber-900"
                          } disabled:opacity-50`}
                        >
                          {isHindi ? "संस्कृत मिश्रित हिंदी" : "Hindi / English"}
                        </button>
                        <button
                          onClick={() => { setMode("SIMPLE_ENGLISH"); fetchDetailedPrediction("SIMPLE_ENGLISH"); }}
                          disabled={detailedLoading}
                          className={`px-3 py-1 text-[10px] font-serif font-medium rounded-md transition-all ${
                            mode === "SIMPLE_ENGLISH" ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 hover:text-amber-900"
                          } disabled:opacity-50`}
                        >
                          {isHindi ? "अंग्रेजी रूप" : "Pure English"}
                        </button>
                      </div>
                    </div>

                    {detailedLoading ? (
                      <div className="py-12 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                        <p className="text-xs text-amber-700/60 font-serif italic text-center">{isHindi ? "ग्रहीय नक्षत्रों का संरेखण पुनर्गठित किया जा रहा है..." : "Recalculating planetary vectors..."}</p>
                      </div>
                    ) : (
                      detailedData && (
                        <div className="space-y-6">
                          
                          {/* Pandit Oral Counsel Bubble */}
                          <div className="bg-[#FAF4E5] border border-[#DFD3BA] rounded-2xl p-6 shadow-inner relative overflow-hidden">
                            <div className="absolute right-4 bottom-4 text-7xl text-amber-700/5 select-none font-serif font-bold">ॐ</div>
                            <p className={`text-[10px] uppercase font-bold mb-3 ${isHindi ? 'tracking-normal text-xs text-amber-600' : 'tracking-widest text-amber-600/60'}`}>💬 {isHindi ? "पंडित जी का सूक्ष्म वाचन (Oral Reading)" : "Pandit's Reading"}</p>
                            <div className="text-[13px] font-serif text-amber-900 leading-relaxed space-y-4 whitespace-pre-line">
                              {detailedData.narrative}
                            </div>
                          </div>

                          {/* Likely vs Unlikely (Highly Differentiated Probability Grid) */}
                          {detailedData.detailedReport?.practicalPrediction && (
                            <div className="bg-white border border-[#EADFC7] rounded-2xl p-5 shadow-xs space-y-3">
                              <h5 className="text-xs font-serif font-bold text-amber-900 border-b border-[#F1E7D0] pb-2 flex items-center gap-2">
                                <span className="text-emerald-500 font-sans">🎯</span>
                                {detailedData.detailedReport.practicalPrediction.title}
                              </h5>
                              <p className="text-xs text-amber-800/80 leading-relaxed whitespace-pre-line font-light">
                                {detailedData.detailedReport.practicalPrediction.content}
                              </p>
                            </div>
                          )}

                          {/* Reality Check Card (Prevents delusion amplification) */}
                          {detailedData.detailedReport?.realityCheck && (
                            <div className="bg-rose-50/30 border border-rose-200/50 rounded-2xl p-5 shadow-xs space-y-3">
                              <h5 className="text-xs font-serif font-bold text-rose-900 border-b border-rose-100 pb-2 flex items-center gap-2">
                                <span className="text-rose-500 font-sans">⚠️</span>
                                {detailedData.detailedReport.realityCheck.title}
                              </h5>
                              <p className="text-xs text-rose-950/80 leading-relaxed whitespace-pre-line font-light">
                                {detailedData.detailedReport.realityCheck.content}
                              </p>
                            </div>
                          )}

                          {/* Spillover / Cross Impact Card */}
                          {detailedData.detailedReport?.crossImpact && (
                            <div className="bg-amber-50/20 border border-amber-200/40 rounded-2xl p-5 shadow-xs space-y-3">
                              <h5 className="text-xs font-serif font-bold text-amber-900 border-b border-amber-100 pb-2 flex items-center gap-2">
                                <span className="text-amber-500 font-sans">🔄</span>
                                {detailedData.detailedReport.crossImpact.title}
                              </h5>
                              <p className="text-xs text-amber-800/80 leading-relaxed whitespace-pre-line font-light">
                                {detailedData.detailedReport.crossImpact.content}
                              </p>
                            </div>
                          )}

                          {/* Technical Chart Analysis Grid */}
                          <div className="space-y-3">
                            <p className={`text-[9px] font-sans font-bold uppercase ${isHindi ? 'tracking-normal text-xs text-amber-600' : 'tracking-widest text-amber-600/50'}`}>
                              {isHindi ? "📋 ज्योतिषीय संयोजन (दशा एवं गोचर)" : "📋 Astrological Decomposition (Dasha & Transit)"}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Natal Promise */}
                              {detailedData.detailedReport?.natalPromise && (
                                <div className="bg-white border border-[#EADFC7] rounded-xl p-4 shadow-xs">
                                  <h6 className="text-[11px] font-serif font-bold text-amber-900 border-b border-[#F1E7D0] pb-1.5 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {detailedData.detailedReport.natalPromise.title}
                                  </h6>
                                  <p className="text-[11px] text-amber-800/80 leading-relaxed whitespace-pre-line font-light">
                                    {detailedData.detailedReport.natalPromise.content}
                                  </p>
                                </div>
                              )}
                              {/* Dasha Activation */}
                              {detailedData.detailedReport?.dashaActivation && (
                                <div className="bg-white border border-[#EADFC7] rounded-xl p-4 shadow-xs">
                                  <h6 className="text-[11px] font-serif font-bold text-amber-900 border-b border-[#F1E7D0] pb-1.5 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    {detailedData.detailedReport.dashaActivation.title}
                                  </h6>
                                  <p className="text-[11px] text-amber-800/80 leading-relaxed whitespace-pre-line font-light">
                                    {detailedData.detailedReport.dashaActivation.content}
                                  </p>
                                </div>
                              )}
                              {/* Transit Influence */}
                              {detailedData.detailedReport?.transitInfluence && (
                                <div className="bg-white border border-[#EADFC7] rounded-xl p-4 shadow-xs">
                                  <h6 className="text-[11px] font-serif font-bold text-amber-900 border-b border-[#F1E7D0] pb-1.5 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {detailedData.detailedReport.transitInfluence.title}
                                  </h6>
                                  <p className="text-[11px] text-amber-800/80 leading-relaxed whitespace-pre-line font-light">
                                    {detailedData.detailedReport.transitInfluence.content}
                                  </p>
                                </div>
                              )}
                              {/* Synthesis */}
                              {detailedData.detailedReport?.chartSynthesis && (
                                <div className="bg-white border border-[#EADFC7] rounded-xl p-4 shadow-xs">
                                  <h6 className="text-[11px] font-serif font-bold text-amber-900 border-b border-[#F1E7D0] pb-1.5 mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    {detailedData.detailedReport.chartSynthesis.title}
                                  </h6>
                                  <p className="text-[11px] text-amber-800/80 leading-relaxed whitespace-pre-line font-light">
                                    {detailedData.detailedReport.chartSynthesis.content}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Contextual Chat with Pundit */}
            <div className="bg-[#FAF8F2] border border-[#E6DBC3] rounded-3xl p-6 shadow-sm space-y-4">
              <button
                onClick={toggleChat}
                className="w-full flex items-center justify-between font-serif font-bold text-amber-900 focus:outline-none"
              >
                <div className="flex items-center gap-2 text-base">
                  <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">💬</span>
                  <span>{isHindi ? "चैट पंडित जी से शंका समाधान करें" : "Clarify Doubts with Chat Pundit"}</span>
                </div>
                <div className="px-3 py-1 text-[10px] uppercase font-sans font-bold bg-[#FFF2D8] border border-amber-300 text-amber-900 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span>
                    {isHindi 
                      ? `विषय: ${domain === "career" ? "आजीविका" : domain === "finance" ? "वित्त" : domain === "health" ? "स्वास्थ्य" : domain === "relationships" ? "संबंध" : "सामान्य"} (${period === "this-week" ? "सप्ताह" : period === "this-month" ? "मासिक" : period === "today" ? "आज" : "वार्षिक"})`
                      : `Scope: ${domain} (${period === "this-week" ? "Week" : period === "this-month" ? "Month" : period})`}
                  </span>
                  {chatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              <AnimatePresence>
                {chatOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-4 pt-4 border-t border-[#E6DBC3]/60"
                  >
                    {/* Chat Messages */}
                    <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-amber-200">
                      {chatMessages.map((m, i) => (
                        <div
                          key={i}
                          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                            m.role === "user"
                              ? "bg-amber-100 border border-amber-200 text-amber-955 font-medium"
                              : "bg-white border border-[#EADFC7] text-amber-900 font-serif whitespace-pre-line"
                          }`}>
                            {m.role === "pundit" ? (
                              <PunditResponse content={m.content} />
                            ) : (
                              m.content
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="p-4 rounded-2xl bg-white border border-[#EADFC7] flex items-center gap-2.5 text-xs text-amber-700/60 font-medium italic">
                            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>
                              {isHindi 
                                ? `पंडित जी आपके ${domain === "career" ? "आजीविका" : domain === "finance" ? "वित्त" : domain === "health" ? "स्वास्थ्य" : domain === "relationships" ? "संबंध" : "सामान्य"} चार्ट पर विचार कर रहे हैं...`
                                : `Pundit is reflecting on your ${domain} chart...`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={
                          isHindi 
                            ? `पंडित जी से अपने ${domain === "career" ? "आजीविका" : domain === "finance" ? "वित्त" : domain === "health" ? "स्वास्थ्य" : domain === "relationships" ? "संबंध" : "सामान्य"} मार्गदर्शन के बारे में पूछें...`
                            : `Ask follow-up doubts about your ${domain} predictions...`
                        }
                        className="flex-1 bg-white border border-[#EADFC7] rounded-full py-2.5 px-4 text-xs text-amber-900 placeholder-amber-400 outline-none focus:border-amber-400 transition-all shadow-xs"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white shadow-sm hover:bg-amber-700 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:grayscale transition-all shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => { setStep("period"); setPeriod(null); setDomain(null); }}
              className={`w-full py-4 rounded-2xl bg-white border border-[#F1E7D0] text-amber-700 text-[10px] font-bold uppercase hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm ${isHindi ? 'tracking-normal text-xs' : 'tracking-widest'}`}>
              {isHindi ? "नवीन भविष्यफल प्राप्त करें →" : "New Prediction →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pundit Response Bubble Formatter ──────────────────────────────────────────

function PunditResponse({ content }: { content: string }) {
  const parts = content.split("\n\n");

  return (
    <div className="space-y-3 text-left">
      {parts.map((part, i) => {
        if (i === 0) return (
          <p key={i} className="text-xs font-serif font-semibold text-amber-955 border-l-2 border-amber-500 pl-3 py-0.5 leading-snug">
            {part}
          </p>
        );

        if (i === parts.length - 1) return (
          <p key={i} className="text-[10px] font-bold text-amber-600 border-t border-amber-100 pt-2 tracking-wide">
            {part}
          </p>
        );

        return (
          <p key={i} className="text-[11px] text-amber-900/70 font-light leading-relaxed whitespace-pre-wrap">
            {part}
          </p>
        );
      })}
    </div>
  );
}
