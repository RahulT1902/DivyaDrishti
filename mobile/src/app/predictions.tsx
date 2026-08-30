import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Briefcase, Wallet, Activity, Heart, Sparkles, ChevronLeft, Send, ChevronDown, ChevronUp, Sun, Moon, Calendar, Globe } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type Timeframe = 'today' | 'this-week' | 'this-month' | 'year';
type Domain = 'career' | 'finance' | 'health' | 'relationships' | 'general';
type Step = 'period' | 'domain' | 'result';

const PERIODS = [
  { id: 'today' as Timeframe,      label: 'Today',    labelHi: 'आज',         sub: 'Daily guidance',   subHi: 'दैनिक मार्गदर्शन', icon: '☀️' },
  { id: 'this-week' as Timeframe,  label: 'This Week', labelHi: 'यह सप्ताह', sub: '7-day outlook',    subHi: '7 दिवसीय विश्लेषण', icon: '🌙' },
  { id: 'this-month' as Timeframe, label: 'Monthly',  labelHi: 'मासिक',      sub: '30-day forecast',  subHi: '30 दिवसीय प्रवाह', icon: '📅' },
  { id: 'year' as Timeframe,       label: 'Yearly',   labelHi: 'वार्षिक',   sub: 'Annual blueprint', subHi: 'वार्षिक खाका', icon: '🪐' },
];

const DOMAINS = [
  { id: 'career' as Domain,        label: 'Career',        labelHi: 'कर्म एवं आजीविका',     sub: 'Work & Ambition',       subHi: 'कार्यक्षेत्र एवं महत्वाकांक्षा' },
  { id: 'finance' as Domain,       label: 'Finance',       labelHi: 'धन एवं समृद्धि',        sub: 'Wealth & Stability',    subHi: 'वैभव एवं स्थिरता' },
  { id: 'health' as Domain,        label: 'Health',        labelHi: 'स्वास्थ्य एवं ऊर्जा',   sub: 'Vitality & Energy',     subHi: 'दैहिक जुड़ाव एवं प्राण' },
  { id: 'relationships' as Domain, label: 'Relationships', labelHi: 'पारस्परिक संबंध',       sub: 'Love & Bonds',          subHi: 'स्नेह एवं पारिवारिक संबंध' },
  { id: 'general' as Domain,       label: 'General',       labelHi: 'सामान्य जीवन प्रवाह',  sub: 'Overall Life Flow',     subHi: 'जीवन का समग्र प्रवाह' },
];

const DOMAIN_ICONS: Record<Domain, React.ReactNode> = {
  career:        <Briefcase size={22} color="#D97706" />,
  finance:       <Wallet size={22} color="#059669" />,
  health:        <Activity size={22} color="#E11D48" />,
  relationships: <Heart size={22} color="#EC4899" />,
  general:       <Sparkles size={22} color="#8B5CF6" />,
};

const TIMING_FLOWS: Record<Domain, { morning: string; morningHi: string; afternoon: string; afternoonHi: string; evening: string; eveningHi: string }> = {
  career: {
    morning: 'Slow activation; calmly plan professional priorities.', morningHi: 'धीमी शुरुआत — आज की कार्य प्राथमिकताओं की शांत योजना बनाएं।',
    afternoon: 'Focused execution, high-leverage work, decisions.', afternoonHi: 'सक्रिय कार्य संपादन, मीटिंग और निष्पादन के लिए श्रेष्ठ समय।',
    evening: 'Review completed work; defer large fresh decisions.', eveningHi: 'किए गए काम की समीक्षा करें, शाम में नए बड़े फैसले टालें।',
  },
  finance: {
    morning: 'Audit numbers calmly; avoid reactive early checks.', morningHi: 'शांत दिमाग से संख्या और खातों की समीक्षा करें।',
    afternoon: 'Execute planned allocations and budget items.', afternoonHi: 'पहले से योजनाबद्ध निवेश या आवश्यक लेनदेन पूरे करें।',
    evening: 'Refuse impulse money decisions or emotional spend.', eveningHi: 'आवेग में आकर अनावश्यक खर्च से बचें।',
  },
  health: {
    morning: 'Body may feel slightly heavy; activate gently.', morningHi: 'शरीर थोड़ा भारी महसूस हो सकता है, सुबह की गति धीमी रखें।',
    afternoon: 'Suits light stretching, walking, or posture check.', afternoonHi: 'हल्का व्यायाम, टहलना या खिंचाव करना ऊर्जा बढ़ाएगा।',
    evening: 'Nervous-system downshift; digital detox before sleep.', eveningHi: 'मस्तिष्क को शांत करें, स्क्रीन समय घटाएं और विश्राम लें।',
  },
  relationships: {
    morning: 'High emotional sensitivity; preserve quiet early vibes.', morningHi: 'भावनात्मक संवेदनशीलता अधिक रहेगी, शांत शुरुआत करें।',
    afternoon: 'Best for clear communication and mutual decisions.', afternoonHi: 'सुलझाने, स्पष्ट बातचीत और तालमेल के लिए अनुकूल।',
    evening: 'Keep tone soft; prioritize patience and listening.', eveningHi: 'वाणी का स्वर कोमल रखें, पुरानी बातों पर बहस टालें।',
  },
  general: {
    morning: 'Ideal for learning setup and clear daily prioritizing.', morningHi: 'योजना बनाने, आत्म-चिंतन और शांत चिंतन के लिए श्रेष्ठ।',
    afternoon: 'Strongest execution window for applied knowledge.', afternoonHi: 'सक्रिय अभ्यास, कार्य निष्पादन और प्रगति के लिए उत्तम।',
    evening: 'Reflect on actual application; calm down the mind.', eveningHi: 'आज क्या लागू किया, इसकी शांत समीक्षा करें।',
  },
};

const REMEDIES: Record<Domain, { icon: string; title: string; titleHi: string; content: string; contentHi: string }> = {
  career: { icon: '🪔', title: 'Discipline Remedy', titleHi: 'कर्म उपाय', content: 'Silently offer appreciation or help to a service worker, or take 2 minutes of silent focus before starting work.', contentHi: 'आज किसी कामगार या जरूरतमंद व्यक्ति की गुप्त सहायता करें अथवा \'ॐ शनैश्चराय नमः\' का ११ बार जाप करें।' },
  finance: { icon: '💰', title: 'Abundance Remedy', titleHi: 'संतोष उपाय', content: 'Offer water/grain to birds, or express one word of gratitude for your current capital security.', contentHi: 'आज पक्षियों को दाना डालें अथवा जल अर्पित करें; किसी भी रूप में छोटा दान या आभार व्यक्त करें।' },
  health: { icon: '🕉️', title: 'Prana Remedy', titleHi: 'प्राण उपाय', content: 'Spend 5 minutes doing deep breathing (Pranayama) or step outdoors into morning sunlight.', contentHi: 'प्रातः काल ५ मिनट गहरी सांस (अनुलोम-विलोम) लें और प्रकृति/सूर्य के प्रकाश में समय बिताएं।' },
  relationships: { icon: '🌸', title: 'Harmony Remedy', titleHi: 'सौम्यता उपाय', content: 'Share a sweet or kind gesture with someone today, or express one sincere, unprompted word of appreciation.', contentHi: 'आज अपने घर या कार्यस्थल पर किसी को मीठा खिलाएं और अपनी वाणी में अत्यंत सौम्यता रखें।' },
  general: { icon: '✨', title: 'Clarity Remedy', titleHi: 'शांत उपाय', content: 'Light a camphor candle/diya, or dedicate 5 minutes to absolute digital silence before sleeping.', contentHi: 'शाम के समय एक कपूर जलाएं और सोने से पहले ५ मिनट मौन बैठकर विचारों को विश्राम दें।' },
};

export default function PredictionsScreen() {
  const { isHindi, language } = useLanguage();
  const [step, setStep] = useState<Step>('period');
  const [period, setPeriod] = useState<Timeframe | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(false);
  const [predData, setPredData] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'pundit'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selectPeriod = (p: Timeframe) => {
    setPeriod(p);
    setStep('domain');
  };

  const selectDomain = async (d: Domain) => {
    setDomain(d);
    setLoading(true);
    setPredData(null);
    setShowChat(false);
    setChatMessages([]);
    setStep('result');
    try {
      await AsyncStorage.setItem('divya:predictions:lastDomain', d);
      const email = await AsyncStorage.getItem('divya:userEmail');
      const tf = period === 'year' ? 'this-year' : period;
      const dm = d === 'general' ? 'growth' : d;
      const data = await api.get('/api/predictions/analyze', {
        timeframe: tf || 'today',
        domain: dm,
        mode: language,
        ...(email ? { email } : {}),
      });
      if (data.success) setPredData(data.predictions);
    } catch (err) {
      console.error('Predictions fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = () => {
    if (!showChat && chatMessages.length === 0 && period && domain) {
      const periodLabel = period === 'this-week' ? 'THIS WEEK' : period === 'this-month' ? 'THIS MONTH' : period.toUpperCase();
      const domainLabel = domain.toUpperCase();
      setChatMessages([{
        role: 'pundit',
        content: isHindi
          ? `प्रणाम। आपके ${domainLabel} मार्गदर्शन से संबंधित शंकाओं का निवारण करें। आप इस मार्गदर्शन के किस पहलू को अधिक स्पष्टता से समझना चाहते हैं?`
          : `Pranam. Let's clarify your doubts regarding your ${domainLabel} guidance for ${periodLabel}. What specific aspect would you like to understand better?`,
      }]);
    }
    setShowChat(!showChat);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !domain || !period) return;
    const userMsg = { role: 'user' as const, content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = await api.post('/api/astrology/chat', {
        question: userMsg.content,
        domain,
        timeframe: period === 'year' ? 'this-year' : period,
        email: email || '',
      });
      const answerText = res.success
        ? (res.data?.answer || res.response || '')
        : 'The celestial lines are momentarily still. Please try rephrasing your question.';
      setChatMessages((prev) => [...prev, {
        role: 'pundit',
        content: answerText,
      }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'pundit', content: 'Unable to reach the celestial engine right now. Please try again in a moment.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  // Derived display data
  const narrativeLines = (predData?.narrative || '').split('\n\n').filter((p: string) => p.trim());
  const headlineText = narrativeLines[0] || '';
  const summaryText = narrativeLines[1] || predData?.analysis || '';
  const report = predData?.detailedReport || {};
  const strategicRaw = report?.strategicGuidance?.content || '';
  const dosList: string[] = [];
  const avoidList: string[] = [];
  let currentGroup: 'do' | 'avoid' | null = null;
  for (const line of strategicRaw.split('\n')) {
    const clean = line.trim();
    if (!clean) continue;
    if (clean.toLowerCase().includes('what to do') || clean.toLowerCase().includes('favourable')) { currentGroup = 'do'; continue; }
    if (clean.toLowerCase().includes('what to avoid') || clean.toLowerCase().includes('avoid')) { currentGroup = 'avoid'; continue; }
    if (clean.startsWith('-') || clean.startsWith('•') || clean.startsWith('*')) {
      const bullet = clean.replace(/^[-•*]\s*/, '');
      if (currentGroup === 'do') dosList.push(bullet);
      else if (currentGroup === 'avoid') avoidList.push(bullet);
    }
  }
  const timing = domain ? TIMING_FLOWS[domain] : null;
  const remedy = domain ? REMEDIES[domain] : null;

  const stepIndex = step === 'period' ? 0 : step === 'domain' ? 1 : 2;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F5EF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : (StatusBar.currentHeight ?? 0)}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Step Indicator */}
        <View style={styles.stepRow}>
          {['period', 'domain', 'result'].map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, i <= stepIndex ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepCircleText, i <= stepIndex ? styles.stepCircleTextActive : styles.stepCircleTextInactive]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, i <= stepIndex ? styles.stepLabelActive : styles.stepLabelInactive]}>
                  {s === 'period' ? (isHindi ? 'समय-सीमा' : 'Timeframe')
                    : s === 'domain' ? (isHindi ? 'जीवन आयाम' : 'Life Area')
                    : (isHindi ? 'मार्गदर्शन' : 'Guidance')}
                </Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, i < stepIndex ? styles.stepLineActive : styles.stepLineInactive]} />}
            </React.Fragment>
          ))}
        </View>

        {/* STEP 1: Period Selection */}
        {step === 'period' && (
          <View style={styles.gridTwo}>
            {PERIODS.map((p) => (
              <TouchableOpacity key={p.id} style={styles.periodCard} onPress={() => selectPeriod(p.id)}>
                <Text style={styles.periodIcon}>{p.icon}</Text>
                <Text style={styles.periodSub}>{isHindi ? p.subHi : p.sub}</Text>
                <Text style={styles.periodLabel}>{isHindi ? p.labelHi : p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 2: Domain Selection */}
        {step === 'domain' && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('period')}>
              <ChevronLeft size={14} color="#D97706" />
              <Text style={styles.backBtnText}>
                {isHindi ? 'समय-सीमा बदलें' : 'Change Period'} ({isHindi ? PERIODS.find(p => p.id === period)?.labelHi : period?.toUpperCase()})
              </Text>
            </TouchableOpacity>
            {DOMAINS.map((d) => (
              <TouchableOpacity key={d.id} style={styles.domainCard} onPress={() => selectDomain(d.id)}>
                <View style={styles.domainIconBg}>{DOMAIN_ICONS[d.id]}</View>
                <View style={styles.domainTextBlock}>
                  <Text style={styles.domainLabel}>{isHindi ? d.labelHi : d.label}</Text>
                  <Text style={styles.domainSub}>{isHindi ? d.subHi : d.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 3: Result */}
        {step === 'result' && (
          <View style={{ gap: 14 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('domain')}>
              <ChevronLeft size={14} color="#D97706" />
              <Text style={styles.backBtnText}>
                {isHindi ? 'जीवन आयाम बदलें' : 'Change Domain'}
              </Text>
            </TouchableOpacity>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#D97706" />
                <Text style={styles.loadingText}>
                  {isHindi ? 'ग्रहीय चक्रों का सूक्ष्म अध्ययन हो रहा है...' : 'Consulting the celestial cycles & birth transits...'}
                </Text>
              </View>
            ) : (
              <>
                {/* Headline Card */}
                <View style={styles.headlineCard}>
                  <Text style={styles.headlineTag}>
                    {isHindi ? '✦ पंडित जी का मार्गदर्शन' : '✦ Pundit Guidance'}
                  </Text>
                  <Text style={styles.headlineText}>{headlineText || (isHindi ? 'ग्रहीय आयाम सक्रिय।' : 'Planetary parameters resolved.')}</Text>
                  {summaryText ? <Text style={styles.summaryText}>{summaryText}</Text> : null}
                </View>

                {/* Do & Avoid */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{isHindi ? 'रणनीतिक मार्गदर्शन' : 'Strategic Guidance'}</Text>
                  <View style={styles.doBox}>
                    <Text style={styles.doHeader}>{isHindi ? '✓ इनका अभ्यास करें' : '✓ Do More Of'}</Text>
                    {(dosList.length > 0 ? dosList : (predData?.lifeDomainPredictions?.[0]?.activatedPatterns || ['Follow disciplined timelines'])).slice(0, 3).map((item: string, i: number) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bulletGreen}>•</Text>
                        <Text style={styles.doText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.avoidBox}>
                    <Text style={styles.avoidHeader}>{isHindi ? '✗ इनमें संयम बरतें' : '✗ Practice Restraint'}</Text>
                    {(avoidList.length > 0 ? avoidList : (predData?.lifeDomainPredictions?.[0]?.caution ? [predData.lifeDomainPredictions[0].caution] : ['Avoid reactive decisions'])).slice(0, 3).map((item: string, i: number) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bulletRed}>•</Text>
                        <Text style={styles.avoidText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Timing Flow */}
                {timing && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{isHindi ? 'दिन का प्रवाह' : 'Daily Timing Flow'}</Text>
                    {[
                      { icon: '🌅', label: isHindi ? 'प्रातः' : 'Morning', text: isHindi ? timing.morningHi : timing.morning },
                      { icon: '☀️', label: isHindi ? 'दोपहर' : 'Afternoon', text: isHindi ? timing.afternoonHi : timing.afternoon },
                      { icon: '🌙', label: isHindi ? 'सायं' : 'Evening', text: isHindi ? timing.eveningHi : timing.evening },
                    ].map((slot, i) => (
                      <View key={i} style={styles.timingRow}>
                        <View style={styles.timingLeft}>
                          <Text style={styles.timingIcon}>{slot.icon}</Text>
                          <Text style={styles.timingLabel}>{slot.label}</Text>
                        </View>
                        <Text style={styles.timingText}>{slot.text}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Remedy */}
                {remedy && (
                  <View style={styles.remedyCard}>
                    <Text style={styles.remedyEmoji}>{remedy.icon}</Text>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.remedyTitle}>{isHindi ? remedy.titleHi : remedy.title}</Text>
                      <Text style={styles.remedyText}>{isHindi ? remedy.contentHi : remedy.content}</Text>
                    </View>
                  </View>
                )}

                {/* Life Domain Cards */}
                {predData?.lifeDomainPredictions?.length > 0 && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.sectionTitle}>{isHindi ? 'जीवन क्षेत्र विश्लेषण' : 'Life Domain Analysis'}</Text>
                    {predData.lifeDomainPredictions.slice(0, 4).map((card: any, i: number) => (
                      <View key={i} style={[styles.domainResultCard, { borderLeftColor: card.strength === 'supportive' ? '#10B981' : card.strength === 'sensitive' ? '#E11D48' : '#D97706' }]}>
                        <View style={styles.domainResultHeader}>
                          <Text style={styles.domainResultIcon}>{card.icon}</Text>
                          <Text style={styles.domainResultTitle}>{isHindi && card.titleHindi ? card.titleHindi : card.title}</Text>
                          <View style={[styles.strengthBadge, { backgroundColor: card.strength === 'supportive' ? '#ECFDF5' : card.strength === 'sensitive' ? '#FFF1F2' : '#FFFBEB' }]}>
                            <Text style={[styles.strengthBadgeText, { color: card.strength === 'supportive' ? '#065F46' : card.strength === 'sensitive' ? '#9F1239' : '#78350F' }]}>
                              {card.strength}
                            </Text>
                          </View>
                        </View>
                        {card.planetSignals?.slice(0, 2).map((signal: string, si: number) => (
                          <Text key={si} style={styles.planetSignal}>✦ {signal}</Text>
                        ))}
                        {card.caution && (
                          <Text style={styles.domainCaution}>⚠ {card.caution}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Pundit Chat */}
                <TouchableOpacity style={styles.chatToggle} onPress={openChat}>
                  <Text style={styles.chatToggleText}>
                    {isHindi ? '💬 पंडित जी से पूछें' : '💬 Ask Pandit a Question'}
                  </Text>
                  {showChat ? <ChevronUp size={16} color="#FFFFFF" /> : <ChevronDown size={16} color="#FFFFFF" />}
                </TouchableOpacity>

                {showChat && (
                  <View style={styles.chatBox}>
                    <ScrollView style={styles.chatMessages} nestedScrollEnabled>
                      {chatMessages.map((msg, i) => (
                        <View key={i} style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubblePundit]}>
                          <Text style={[styles.chatBubbleText, msg.role === 'user' ? styles.chatBubbleTextUser : styles.chatBubbleTextPundit]}>
                            {msg.content}
                          </Text>
                        </View>
                      ))}
                      {chatLoading && (
                        <View style={styles.chatBubblePundit}>
                          <ActivityIndicator size="small" color="#D97706" />
                        </View>
                      )}
                    </ScrollView>
                    <View style={styles.chatInputRow}>
                      <TextInput
                        style={styles.chatInput}
                        value={chatInput}
                        onChangeText={setChatInput}
                        placeholder={isHindi ? 'अपना प्रश्न पूछें...' : 'Ask your question...'}
                        placeholderTextColor="#B8A38A"
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={sendMessage}
                        onFocus={() => {
                          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                        }}
                      />
                      <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={chatLoading}>
                        <Send size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 16, gap: 16, paddingBottom: 48 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepItem: { alignItems: 'center', gap: 4, flex: 0 },
  stepLine: { flex: 1, height: 1 },
  stepLineActive: { backgroundColor: '#10B981' },
  stepLineInactive: { backgroundColor: '#EFE8D9' },
  stepCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#D97706' },
  stepCircleInactive: { backgroundColor: '#EFE8D9' },
  stepCircleText: { fontSize: 11, fontWeight: '700' },
  stepCircleTextActive: { color: '#FFFFFF' },
  stepCircleTextInactive: { color: '#B8A38A' },
  stepLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepLabelActive: { color: '#78350F' },
  stepLabelInactive: { color: '#B8A38A' },
  gridTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  periodCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 20, gap: 6 },
  periodIcon: { fontSize: 28 },
  periodSub: { fontSize: 10, color: '#B45309', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 },
  periodLabel: { fontSize: 18, fontWeight: '700', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 11, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 },
  domainCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EFE8D9', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  domainIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  domainTextBlock: { flex: 1, gap: 2 },
  domainLabel: { fontSize: 15, fontWeight: '600', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  domainSub: { fontSize: 10, color: '#78350F', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  loadingBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 11, color: '#78350F', opacity: 0.6, fontStyle: 'italic', textAlign: 'center' },
  headlineCard: { backgroundColor: '#FFFDF8', borderRadius: 20, borderWidth: 1, borderColor: '#F2E7D0', padding: 20, gap: 10 },
  headlineTag: { fontSize: 10, fontWeight: '700', color: '#B45309', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 },
  headlineText: { fontSize: 17, fontWeight: '700', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 26 },
  summaryText: { fontSize: 13, color: '#78350F', lineHeight: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 16, gap: 12 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
  doBox: { backgroundColor: '#ECFDF5', borderRadius: 14, borderWidth: 1, borderColor: '#D1FAE5', padding: 12, gap: 6 },
  doHeader: { fontSize: 10, fontWeight: '700', color: '#065F46', textTransform: 'uppercase', letterSpacing: 1 },
  doText: { fontSize: 12, color: '#065F46', lineHeight: 18, flex: 1 },
  avoidBox: { backgroundColor: '#FFF1F2', borderRadius: 14, borderWidth: 1, borderColor: '#FFE4E6', padding: 12, gap: 6 },
  avoidHeader: { fontSize: 10, fontWeight: '700', color: '#9F1239', textTransform: 'uppercase', letterSpacing: 1 },
  avoidText: { fontSize: 12, color: '#9F1239', lineHeight: 18, flex: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bulletGreen: { color: '#059669', fontSize: 14 },
  bulletRed: { color: '#E11D48', fontSize: 14 },
  timingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderTopWidth: 1, borderTopColor: '#F8F5EF', paddingTop: 10 },
  timingLeft: { alignItems: 'center', width: 52, gap: 2 },
  timingIcon: { fontSize: 18 },
  timingLabel: { fontSize: 9, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.5 },
  timingText: { fontSize: 12, color: '#78350F', lineHeight: 18, flex: 1 },
  remedyCard: { backgroundColor: '#FFFBEB', borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A', padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  remedyEmoji: { fontSize: 32 },
  remedyTitle: { fontSize: 12, fontWeight: '700', color: '#78350F', textTransform: 'uppercase', letterSpacing: 0.5 },
  remedyText: { fontSize: 13, color: '#78350F', lineHeight: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 2 },
  domainResultCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EFE8D9', borderLeftWidth: 3, padding: 14, gap: 6 },
  domainResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  domainResultIcon: { fontSize: 20 },
  domainResultTitle: { fontSize: 14, fontWeight: '700', color: '#3F2D1D', flex: 1 },
  strengthBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  strengthBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  planetSignal: { fontSize: 11, color: '#78350F', opacity: 0.6, lineHeight: 16 },
  domainCaution: { fontSize: 11, color: '#E11D48', marginTop: 2 },
  chatToggle: { backgroundColor: '#D97706', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatToggleText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  chatBox: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', overflow: 'hidden' },
  chatMessages: { padding: 14, maxHeight: 280, gap: 8 },
  chatBubble: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: '85%' },
  chatBubbleUser: { backgroundColor: '#D97706', alignSelf: 'flex-end' },
  chatBubblePundit: { backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFE8D9', alignSelf: 'flex-start' },
  chatBubbleText: { fontSize: 13, lineHeight: 20 },
  chatBubbleTextUser: { color: '#FFFFFF' },
  chatBubbleTextPundit: { color: '#3F2D1D' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: '#EFE8D9', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 3 },
  chatInput: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#C4956A', padding: 11, fontSize: 13, color: '#3F2D1D', maxHeight: 80, shadowColor: '#C4956A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  sendBtn: { backgroundColor: '#D97706', borderRadius: 12, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
