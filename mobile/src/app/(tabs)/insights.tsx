import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles,
  Clock,
  Compass,
  AlertTriangle,
  Calendar,
  Zap,
  Star,
  BookOpen,
} from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type SubTab = 'dasha' | 'timeline' | 'radar' | 'journal';


// ── Circular SVG meter (pure RN, no SVG lib needed — uses View arcs via border trick) ──
function CircularMeter({ value, size = 100 }: { value: number; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: 7, borderColor: '#F3F4F6',
      }} />
      {/* Filled ring approximation using a rotated clip */}
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: 7,
        borderColor: 'transparent',
        borderTopColor: '#059669',
        borderRightColor: value >= 25 ? '#059669' : 'transparent',
        borderBottomColor: value >= 50 ? '#059669' : 'transparent',
        borderLeftColor: value >= 75 ? '#059669' : 'transparent',
        transform: [{ rotate: '-90deg' }],
      }} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#065F46', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
          {value}%
        </Text>
        <Text style={{ fontSize: 7, fontWeight: '700', color: '#78350F', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
          Verified
        </Text>
      </View>
    </View>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={{ height: 5, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${value}%` as any, backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

function RadarBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#3F2D1D' }}>{label}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>{value}/100</Text>
      </View>
      <ProgressBar value={value} color="#D97706" />
    </View>
  );
}

export default function InsightsScreen() {
  const { isHindi } = useLanguage();
  const [activeTab, setActiveTab] = useState<SubTab>('dasha');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [chartData, setChartData] = useState<any>(null);
  const [insightsPayload, setInsightsPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
  // Timeline filter state
  const [selectedChapter, setSelectedChapter] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<number | 'All' | null>(null);

  const loadAllData = async () => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) { setError('No session found.'); setLoading(false); return; }

      const [chartRes, insightsRes] = await Promise.all([
        api.get('/api/astrology/chart', { email }),
        api.get('/api/life-insights', { email }),
      ]);
      if (chartRes.success && chartRes.data) setChartData(chartRes.data);
      if (insightsRes.success && insightsRes.data) setInsightsPayload(insightsRes.data);
      else setError(insightsRes.error?.message || 'Failed to load insights.');
      setError(null);
    } catch (err: any) {
      setError('Connection failed. Check your server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  const handleFeedback = async (periodId: string, eventName: string, theme: string, start: string, end: string, feedback: 'HAPPENED' | 'PARTIALLY_HAPPENED' | 'DID_NOT_HAPPEN') => {
    setSubmittingFeedback(`${periodId}-${eventName}`);
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) return;
      const res = await api.post('/api/life-insights', { email, action: 'FEEDBACK', periodStart: start, periodEnd: end, theme, eventName, feedback });
      if (res.success) {
        setInsightsPayload((prev: any) => {
          const updatedFeedbackMap = { ...prev.feedbackMap, [eventName]: feedback };
          let total = 0, count = 0;
          Object.values(updatedFeedbackMap).forEach((v: any) => {
            total += v === 'HAPPENED' ? 100 : v === 'PARTIALLY_HAPPENED' ? 50 : 0;
            count++;
          });
          const newRates = { ...prev.validationRates };
          if (count > 0) newRates.overall = Math.round(total / count);
          return { ...prev, feedbackMap: updatedFeedbackMap, validationRates: newRates };
        });
      }
    } catch { Alert.alert('Error', 'Unable to record feedback.'); }
    finally { setSubmittingFeedback(null); }
  };

  const handleJournalStatus = async (journalId: string, newStatus: string) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) return;
      const res = await api.post('/api/life-insights', { email, action: 'JOURNAL', journalId, status: newStatus });
      if (res.success) {
        setInsightsPayload((prev: any) => ({
          ...prev,
          journal: prev.journal.map((j: any) => j.id === journalId ? { ...j, status: newStatus } : j),
        }));
      }
    } catch { }
  };

  if (loading && !insightsPayload) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={s.loadingText}>{isHindi ? 'आकाशीय कालचक्र संरेखित हो रहा है...' : 'Aligning Sacred Timelines...'}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <AlertTriangle size={40} color="#E11D48" />
        <Text style={[s.loadingText, { color: '#E11D48', marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); loadAllData(); }}>
          <Text style={{ color: '#F8F5EF', fontWeight: '700', fontSize: 12 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { timelineEvents, futureRadar, scorecard, journal, validationRates, feedbackMap, natalPromiseSummary, advancedInsights, majorYears } = insightsPayload;
  const activeDasha = chartData?.temporal;

  const now = new Date();
  const pastEvents = (timelineEvents || []).filter((ev: any) => new Date(ev.start) <= now);
  const uniqueYears = Array.from(new Set(pastEvents.map((ev: any) => new Date(ev.start).getFullYear()))).sort((a: any, b: any) => a - b) as number[];

  const filteredEvents = pastEvents.filter((ev: any) => {
    const chapterOk = selectedChapter === 'All' || ev.chapter?.toLowerCase().includes(selectedChapter.split(' (')[0].toLowerCase());
    const catOk = selectedCategory === 'All' || ev.category?.toLowerCase() === selectedCategory.toLowerCase();
    const sy = new Date(ev.start).getFullYear(), ey = new Date(ev.end).getFullYear();
    const yearOk = !selectedYear || selectedYear === 'All' || (selectedYear >= sy && selectedYear <= ey);
    return chapterOk && catOk && yearOk;
  });

  const chapters = ['All', 'Learning & Foundation (18-24)', 'Career Building (25-32)', 'Wealth & Recognition (33-40)', 'Transformation & Leadership (41+)'];
  const categories = ['All', 'Career', 'Wealth', 'Relationships', 'Challenges'];

  const domainTranslations: Record<string, string> = {
    Education: isHindi ? 'शिक्षा' : 'Education',
    Career: isHindi ? 'करियर' : 'Career',
    Wealth: isHindi ? 'धन' : 'Wealth',
    Marriage: isHindi ? 'विवाह' : 'Marriage',
    Children: isHindi ? 'संतान' : 'Children',
    Property: isHindi ? 'संपत्ति' : 'Property',
    Spirituality: isHindi ? 'आध्यात्मिकता' : 'Spirituality',
    'Foreign Settlement': isHindi ? 'विदेश' : 'Foreign Settlement',
    Business: isHindi ? 'व्यापार' : 'Business',
    Leadership: isHindi ? 'नेतृत्व' : 'Leadership',
    Health: isHindi ? 'स्वास्थ्य' : 'Health',
  };

  return (
    <View style={s.container}>
      {/* Sub-tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
        {(['dasha', 'timeline', 'radar', 'journal'] as SubTab[]).map((tab) => {
          const labels: Record<SubTab, string> = {
            dasha: isHindi ? 'दशा' : 'Active Dasha',
            timeline: isHindi ? '⏳ टाइमलाइन' : '⏳ Life Timeline',
            radar: isHindi ? '🎯 रडार' : '🎯 Cosmic Radar',
            journal: isHindi ? '📓 जर्नल' : '📓 Journal',
          };
          return (
            <TouchableOpacity key={tab} style={[s.tabBtn, activeTab === tab && s.tabBtnActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>{labels[tab]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAllData(); }} tintColor="#D97706" />}
      >
        {/* ── DASHA TAB ── */}
        {activeTab === 'dasha' && activeDasha && (
          <View style={{ gap: Spacing.four }}>
            <View style={s.card}>
              <View style={s.rowGap}><Compass size={18} color="#D97706" /><Text style={s.labelU}>Vimshottari Dasha Profile</Text></View>
              <View style={[s.rowGap, { justifyContent: 'center', marginVertical: 12 }]}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.dashaName}>{activeDasha.stack.mahadasha}</Text>
                  <Text style={s.dashaSub}>Mahadasha</Text>
                </View>
                <Text style={{ fontSize: 20, color: '#EFE8D9' }}>/</Text>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[s.dashaName, { color: '#D97706' }]}>{activeDasha.stack.antardasha}</Text>
                  <Text style={s.dashaSub}>Antardasha</Text>
                </View>
                {activeDasha.stack.pratyantar && (
                  <>
                    <Text style={{ fontSize: 20, color: '#EFE8D9' }}>/</Text>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[s.dashaName, { color: '#B45309', fontSize: 16 }]}>{activeDasha.stack.pratyantar}</Text>
                      <Text style={s.dashaSub}>Pratyantar</Text>
                    </View>
                  </>
                )}
              </View>
              <View style={[s.rowGap, { justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#F8F5EF', paddingTop: 10 }]}>
                <Clock size={13} color="#78350F" />
                <Text style={{ fontSize: 11, color: '#78350F', opacity: 0.8 }}>
                  Ends in {activeDasha.timing.remaining} ({new Date(activeDasha.timing.endsAt).toLocaleDateString()})
                </Text>
              </View>
            </View>

            <View style={s.card}>
              <View style={s.rowGap}><BookOpen size={16} color="#D97706" /><Text style={s.labelU}>Pandit Ji's Interpretation</Text></View>
              <Text style={{ fontSize: 14, color: '#3F2D1D', lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginTop: 8 }}>
                {chartData?.narrative || 'Consulting natal charts...'}
              </Text>
            </View>

            {chartData?.guidance && (
              <View style={{ flexDirection: 'row', gap: Spacing.three }}>
                <View style={[s.card, { flex: 1, backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
                  <Text style={[s.labelU, { color: '#065F46', marginBottom: 8 }]}>Do — Favorable</Text>
                  {chartData.guidance.do?.slice(0, 3).map((item: string, i: number) => (
                    <View key={i} style={s.bullet}><Text style={{ color: '#059669', fontWeight: '700' }}>•</Text><Text style={[s.bulletText, { color: '#047857' }]}>{item}</Text></View>
                  ))}
                </View>
                <View style={[s.card, { flex: 1, backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' }]}>
                  <Text style={[s.labelU, { color: '#9F1239', marginBottom: 8 }]}>Avoid — Restraints</Text>
                  {chartData.guidance.avoid?.slice(0, 3).map((item: string, i: number) => (
                    <View key={i} style={s.bullet}><Text style={{ color: '#E11D48', fontWeight: '700' }}>•</Text><Text style={[s.bulletText, { color: '#BE123C' }]}>{item}</Text></View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── LIFE TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <View style={{ gap: Spacing.four }}>

            {/* ── NATAL PROMISE ANALYZER V2 ── */}
            {(advancedInsights || natalPromiseSummary) && (
              <View style={[s.card, { backgroundColor: '#FAF8F5', borderColor: '#EADFC7' }]}>
                <View style={[s.rowGap, { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EADFC7', paddingBottom: 12 }]}>
                  <View style={{ padding: 8, backgroundColor: '#FEF3C7', borderRadius: 14 }}>
                    <Sparkles size={16} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#92400E', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                      {isHindi ? 'कुंडली जन्म प्रतिज्ञा V2' : 'Cosmic Natal Promise Analyzer V2'}
                    </Text>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>
                      {isHindi ? 'जीवन क्षमता, स्थिरता और समय विश्लेषण' : 'Multidimensional life-potential, stability, timing sensitivity'}
                    </Text>
                  </View>
                </View>

                {/* 3 Spotlight Cards */}
                {advancedInsights && (
                  <View style={{ gap: Spacing.three, marginBottom: Spacing.four }}>
                    {/* Hidden Strength */}
                    <View style={[s.spotlightCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                      <View style={[s.badge, { backgroundColor: '#DCFCE7', borderColor: '#A7F3D0' }]}>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: '#15803D', textTransform: 'uppercase', letterSpacing: 1 }}>🌟 {isHindi ? 'गुप्त शक्ति' : 'Hidden Strength'}</Text>
                      </View>
                      <Text style={[s.spotlightTitle, { color: '#14532D' }]}>
                        {domainTranslations[advancedInsights.hiddenStrength?.domain] || advancedInsights.hiddenStrength?.domain}
                      </Text>
                      <Text style={s.spotlightDesc}>{isHindi ? advancedInsights.hiddenStrength?.explanationHindi : advancedInsights.hiddenStrength?.explanation}</Text>
                      <Text style={[s.spotlightReason, { color: '#166534', borderTopColor: '#D1FAE5' }]}>{isHindi ? advancedInsights.hiddenStrength?.reasonHindi : advancedInsights.hiddenStrength?.reason}</Text>
                    </View>

                    {/* Hidden Vulnerability */}
                    <View style={[s.spotlightCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                      <View style={[s.badge, { backgroundColor: '#FFE4E6', borderColor: '#FECDD3' }]}>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: '#BE123C', textTransform: 'uppercase', letterSpacing: 1 }}>⚠️ {isHindi ? 'छिपी संवेदनशीलता' : 'Hidden Vulnerability'}</Text>
                      </View>
                      <Text style={[s.spotlightTitle, { color: '#4C0519' }]}>
                        {domainTranslations[advancedInsights.hiddenVulnerability?.domain] || advancedInsights.hiddenVulnerability?.domain}
                      </Text>
                      <Text style={s.spotlightDesc}>{isHindi ? advancedInsights.hiddenVulnerability?.explanationHindi : advancedInsights.hiddenVulnerability?.explanation}</Text>
                      <Text style={[s.spotlightReason, { color: '#9F1239', borderTopColor: '#FECDD3' }]}>{isHindi ? advancedInsights.hiddenVulnerability?.reasonHindi : advancedInsights.hiddenVulnerability?.reason}</Text>
                    </View>

                    {/* Cosmic Timing Alert */}
                    <View style={[s.spotlightCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
                      <View style={[s.badge, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1 }}>⚡ {isHindi ? 'गोचर चेतावनी' : 'Cosmic Timing Alert'}</Text>
                      </View>
                      <Text style={[s.spotlightTitle, { color: '#3B0764' }]}>
                        {domainTranslations[advancedInsights.cosmicTimingAlert?.domain] || advancedInsights.cosmicTimingAlert?.domain}
                      </Text>
                      <Text style={s.spotlightDesc}>{isHindi ? advancedInsights.cosmicTimingAlert?.explanationHindi : advancedInsights.cosmicTimingAlert?.explanation}</Text>
                      <Text style={[s.spotlightReason, { color: '#6D28D9', borderTopColor: '#E9D5FF' }]}>{isHindi ? advancedInsights.cosmicTimingAlert?.reasonHindi : advancedInsights.cosmicTimingAlert?.reason}</Text>
                    </View>
                  </View>
                )}

                {/* Domain Promise Grid */}
                {(natalPromiseSummary || []).map((p: any) => {
                  const dn = domainTranslations[p.domain] || p.domain;
                  const potColor = p.potential >= 80 ? '#059669' : p.potential >= 70 ? '#D97706' : p.potential >= 55 ? '#78716C' : '#E11D48';
                  const stabColor = p.stability >= 75 ? '#059669' : p.stability >= 60 ? '#D97706' : '#E11D48';
                  const timingColor = p.timingSensitivity >= 75 ? '#7C3AED' : p.timingSensitivity >= 55 ? '#6366F1' : '#60A5FA';
                  const confColor = p.confidence >= 82 ? '#065F46' : p.confidence >= 70 ? '#92400E' : '#44403C';
                  const confBg = p.confidence >= 82 ? '#D1FAE5' : p.confidence >= 70 ? '#FEF3C7' : '#F5F5F4';
                  return (
                    <View key={p.domain} style={[s.domainCard]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F5F5F4', paddingBottom: 8, marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>{dn}</Text>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: confBg, borderWidth: 1, borderColor: confBg }}>
                          <Text style={{ fontSize: 8, fontWeight: '800', color: confColor, textTransform: 'uppercase' }}>{p.confidenceLabel} ({p.confidence}%)</Text>
                        </View>
                      </View>

                      <View style={{ gap: 8 }}>
                        <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={s.meterLabel}>{isHindi ? 'क्षमता' : 'Potential'}</Text>
                            <Text style={s.meterVal}>{p.potential}/100</Text>
                          </View>
                          <ProgressBar value={p.potential} color={potColor} />
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={s.meterLabel}>{isHindi ? 'स्थिरता' : 'Stability'}</Text>
                            <Text style={s.meterVal}>{p.stability}/100</Text>
                          </View>
                          <ProgressBar value={p.stability} color={stabColor} />
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={s.meterLabel}>{isHindi ? 'समय संवेदनशीलता' : 'Timing Sensitivity'}</Text>
                            <Text style={s.meterVal}>{p.timingSensitivity}/100</Text>
                          </View>
                          <ProgressBar value={p.timingSensitivity} color={timingColor} />
                        </View>
                      </View>

                      {p.confidenceReason && (
                        <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FAFAF9', borderRadius: 8, borderWidth: 1, borderColor: '#E7E5E4' }}>
                          <Text style={{ fontSize: 8, fontWeight: '800', color: '#78350F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                            {isHindi ? 'आकाशीय तर्क:' : 'CONFIDENCE REASON:'}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#3F2D1D', lineHeight: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                            {isHindi ? p.confidenceReasonHindi : p.confidenceReason}
                          </Text>
                        </View>
                      )}

                      {p.interpretation && (
                        <Text style={{ fontSize: 10, color: '#3F2D1D', lineHeight: 15, fontStyle: 'italic', marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                          "{isHindi ? p.interpretationHindi : p.interpretation}"
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── VALIDATION ENGINE ── */}
            <View style={s.card}>
              <Text style={[s.labelU, { color: '#B45309', marginBottom: 4 }]}>{isHindi ? 'सत्यापन इंजन v2.0' : 'VALIDATION ENGINE V2.0'}</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 16 }}>
                {isHindi ? 'पूर्वानुमान सटीकता' : 'Prediction Accuracy'}
              </Text>

              <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1E7D0', paddingBottom: 16, marginBottom: 16 }}>
                <CircularMeter value={validationRates?.overall || 0} size={110} />
                <Text style={{ fontSize: 10, color: '#78350F', opacity: 0.6, textAlign: 'center', marginTop: 10, fontStyle: 'italic', lineHeight: 14 }}>
                  {isHindi ? 'सत्यापन दर आपके फीडबैक पर आधारित है।' : 'Live calibration rate generated dynamically from your life experiences feedback.'}
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {[
                  { name: isHindi ? 'करियर और पद' : 'Career Growth', val: validationRates?.career || 0, color: '#059669' },
                  { name: isHindi ? 'धन और संपदा' : 'Wealth Expansion', val: validationRates?.finance || 0, color: '#D97706' },
                  { name: isHindi ? 'संबंध और परिवार' : 'Relationships', val: validationRates?.relationships || 0, color: '#E11D48' },
                  { name: isHindi ? 'वाहन और संपत्ति' : 'Assets & Property', val: validationRates?.property || 0, color: '#3B82F6' },
                ].map((d) => (
                  <View key={d.name} style={{ gap: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#3F2D1D' }}>{d.name}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#78350F' }}>{d.val}%</Text>
                    </View>
                    <ProgressBar value={d.val} color={d.color} />
                  </View>
                ))}
              </View>
            </View>

            {/* ── SACRED ERAS FILTERING ── */}
            <View style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                  {isHindi ? 'पवित्र युग फ़िल्टरिंग' : 'Sacred Eras Filtering'}
                </Text>
                <Text style={{ fontSize: 10, color: '#78350F', opacity: 0.5, fontWeight: '600' }}>
                  {filteredEvents.length} {isHindi ? 'घटनाएं' : 'events'}
                </Text>
              </View>

              {/* Chapter Filter */}
              <Text style={s.filterLabel}>{isHindi ? 'जीवन अध्याय द्वारा फ़िल्टर करें' : 'Filter by Life Chapter'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6 }}>
                {chapters.map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    onPress={() => setSelectedChapter(ch)}
                    style={[s.chipBtn, selectedChapter === ch && s.chipBtnActive]}
                  >
                    <Text style={[s.chipText, selectedChapter === ch && s.chipTextActive]}>
                      {ch === 'All' ? (isHindi ? 'सभी अध्याय' : 'All Chapters') : ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Category Filter */}
              <Text style={s.filterLabel}>{isHindi ? 'श्रेणी द्वारा खोजें' : 'Jump to Event Type'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 6 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[s.chipBtn, selectedCategory === cat && s.chipBtnActive]}
                  >
                    <Text style={[s.chipText, selectedCategory === cat && s.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Year Chips */}
              <Text style={s.filterLabel}>{isHindi ? 'वर्ष टाइम मशीन' : 'Chronological Time Machine Chips'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {uniqueYears.map((yr) => {
                  const isNotable = (majorYears || []).includes(yr);
                  const isSelected = selectedYear === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => setSelectedYear(isSelected ? 'All' : yr)}
                      style={[s.yearChip, isSelected && s.yearChipActive, isNotable && !isSelected && { borderColor: '#D97706', borderWidth: 1.5 }]}
                    >
                      {isNotable && <Star size={9} color={isSelected ? '#FFFFFF' : '#D97706'} fill={isSelected ? '#FFFFFF' : '#D97706'} style={{ marginRight: 2 }} />}
                      <Text style={[s.yearChipText, isSelected && s.yearChipTextActive, isNotable && !isSelected && { color: '#D97706' }]}>{yr}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── TIMELINE EVENTS ── */}
            <Text style={s.sectionHead}>{isHindi ? 'कालक्रमिक अतीत के अध्याय' : 'Chronological Past Chapters'}</Text>
            {filteredEvents.length === 0 && (
              <View style={[s.card, { alignItems: 'center', padding: 32 }]}>
                <Calendar size={32} color="#D97706" style={{ opacity: 0.4, marginBottom: 10 }} />
                <Text style={{ color: '#78350F', opacity: 0.5, fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>
                  {isHindi ? 'फ़िल्टर से कोई घटना नहीं मिली' : 'Click a Year Chip or Category above to scan this era'}
                </Text>
              </View>
            )}
            {filteredEvents.map((ev: any, idx: number) => {
              const lords = ev.astroDrivers?.map((d: any) => `${d.mdLord}/${d.adLord}`).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).join(', ') || 'N/A';
              const outcomes = ev.realWorldOutcomes || ev.likelyEvents || [];
              return (
                <View key={idx} style={{ flexDirection: 'row' }}>
                  <View style={{ alignItems: 'center', width: 18 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#D97706', marginTop: 24 }} />
                    <View style={{ flex: 1, width: 2, backgroundColor: '#EFE8D9' }} />
                  </View>
                  <View style={[s.card, { flex: 1, marginLeft: 10 }]}>
                    <View style={s.rowGap}>
                      <Calendar size={12} color="#D97706" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                        {new Date(ev.start).getFullYear()} – {new Date(ev.end).getFullYear()}
                      </Text>
                    </View>
                    <Text style={s.evTitle}>{ev.theme}</Text>
                    <Text style={s.evDesc}>{ev.why}</Text>
                    <View style={s.detailBox}>
                      <Text style={s.detailText}><Text style={{ fontWeight: '700' }}>Active Dasha: </Text>{lords}</Text>
                      <Text style={s.detailText}><Text style={{ fontWeight: '700' }}>Confidence: </Text>{ev.confidenceLabel} ({ev.confidenceScore}%)</Text>
                    </View>
                    {outcomes.length > 0 && (
                      <View style={{ borderTopWidth: 1, borderTopColor: '#EFE8D9', paddingTop: 10, marginTop: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#3F2D1D', marginBottom: 8 }}>
                          {isHindi ? 'क्या ये आपके जीवन में हुआ?' : 'Did these manifest in your life?'}
                        </Text>
                        {outcomes.map((outcome: any, oIdx: number) => {
                          const name = typeof outcome === 'string' ? outcome : outcome.event;
                          const prob = typeof outcome === 'string' ? null : outcome.probability;
                          const fb = feedbackMap?.[name];
                          return (
                            <View key={oIdx} style={{ marginBottom: 8, backgroundColor: '#FAF6EC', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#EFE8D9' }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#3F2D1D', marginBottom: 6 }}>• {name}{prob ? ` (${prob}%)` : ''}</Text>
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                {(['HAPPENED', 'PARTIALLY_HAPPENED', 'DID_NOT_HAPPEN'] as const).map((val) => {
                                  const labels = { HAPPENED: 'Yes', PARTIALLY_HAPPENED: 'Partial', DID_NOT_HAPPEN: 'No' };
                                  const colors = { HAPPENED: { bg: '#ECFDF5', border: '#A7F3D0' }, PARTIALLY_HAPPENED: { bg: '#FEF3C7', border: '#FDE68A' }, DID_NOT_HAPPEN: { bg: '#FFF1F2', border: '#FECDD3' } };
                                  const active = fb === val;
                                  return (
                                    <TouchableOpacity key={val} disabled={submittingFeedback === `${ev.id}-${name}`}
                                      style={[{ flex: 1, paddingVertical: 6, borderWidth: 1, borderRadius: 8, alignItems: 'center', borderColor: '#EFE8D9', backgroundColor: '#FFF' }, active && { backgroundColor: colors[val].bg, borderColor: colors[val].border }]}
                                      onPress={() => handleFeedback(ev.id, name, ev.theme, ev.start, ev.end, val)}
                                    >
                                      <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#3F2D1D' : '#78350F' }}>{labels[val]}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── RADAR TAB ── */}
        {activeTab === 'radar' && futureRadar && (
          <View style={{ gap: Spacing.four }}>
            <View style={s.card}>
              <View style={s.rowGap}><Zap size={16} color="#D97706" /><Text style={s.labelU}>Aura Alignment Scorecard</Text></View>
              <View style={{ gap: 12, marginTop: 12 }}>
                <RadarBar label="Career Vector" value={scorecard?.career || 60} />
                <RadarBar label="Financial Containment" value={scorecard?.finance || 50} />
                <RadarBar label="Vitality & Prana" value={scorecard?.health || 70} />
                <RadarBar label="Somatic Harmony" value={scorecard?.relationships || 60} />
              </View>
            </View>

            <Text style={s.sectionHead}>{isHindi ? 'अगले 6 महीने का दृष्टिकोण' : 'Next 6-Month Cosmic Outlook'}</Text>
            {(futureRadar.sixMonthOutlook || []).map((o: any, i: number) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706', textTransform: 'uppercase' }}>Peak: {o.peak}</Text>
                  <View style={{ backgroundColor: '#F8F5EF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#059669' }}>{o.confidence} ({o.probability}%)</Text>
                  </View>
                </View>
                <Text style={s.evTitle}>{o.title}</Text>
                <Text style={s.listLabel}>{isHindi ? 'संभावित अभिव्यक्तियाँ:' : 'Probable Manifestations:'}</Text>
                {o.manifestations?.map((m: string, j: number) => (
                  <View key={j} style={s.bullet}><Text style={{ color: '#D97706', fontWeight: '700' }}>•</Text><Text style={s.bulletText}>{m}</Text></View>
                ))}
              </View>
            ))}

            <Text style={s.sectionHead}>{isHindi ? 'अनुकूल अवसर' : 'Favorable Opportunities'}</Text>
            {(futureRadar.opportunities || []).map((o: any, i: number) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                    {new Date(o.peakStart).toLocaleDateString(undefined, { month: 'short' })} – {new Date(o.peakEnd).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </Text>
                  <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#065F46' }}>{o.validationLabel} ({o.score}%)</Text>
                  </View>
                </View>
                <Text style={s.evTitle}>{o.title}</Text>
                <Text style={[s.evDesc, { fontStyle: 'italic' }]}>"{o.why}"</Text>
                <Text style={s.listLabel}>{isHindi ? 'सबसे संभावित अभिव्यक्तियाँ:' : 'Most Likely Manifestations:'}</Text>
                {o.mostLikelyManifestations?.slice(0, 3).map((m: string, j: number) => (
                  <View key={j} style={s.bullet}><Text style={{ color: '#059669', fontWeight: '700' }}>•</Text><Text style={s.bulletText}>{m}</Text></View>
                ))}
              </View>
            ))}

            <Text style={s.sectionHead}>{isHindi ? 'सावधानी रडार' : 'Restraints & Caution Radar'}</Text>
            {(futureRadar.focusAreas || []).map((r: any, i: number) => (
              <View key={i} style={s.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                    {new Date(r.peakStart).toLocaleDateString(undefined, { month: 'short' })} – {new Date(r.peakEnd).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </Text>
                  <View style={{ backgroundColor: '#FFF1F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#9F1239' }}>{r.validationLabel} ({r.score}%)</Text>
                  </View>
                </View>
                <Text style={s.evTitle}>{r.title}</Text>
                <Text style={[s.evDesc, { fontStyle: 'italic' }]}>"{r.why}"</Text>
                <Text style={s.listLabel}>{isHindi ? 'बचने योग्य सावधानियाँ:' : 'Cautions to Avoid:'}</Text>
                {r.potential?.slice(0, 3).map((a: string, j: number) => (
                  <View key={j} style={s.bullet}><Text style={{ color: '#E11D48', fontWeight: '700' }}>•</Text><Text style={s.bulletText}>{a}</Text></View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── JOURNAL TAB ── */}
        {activeTab === 'journal' && journal && (
          <View style={{ gap: Spacing.four }}>
            <View style={s.card}>
              <Text style={s.labelU}>Mindfulness Prediction Journal</Text>
              <Text style={{ fontSize: 12, color: '#78350F', lineHeight: 18, opacity: 0.8, marginTop: 4 }}>
                {isHindi ? 'सक्रिय सिंक फ़्लैग लॉग करें और परिणाम स्थिति अपडेट करें।' : 'Log active sync flags in your daily life. Update outcome status when a transit prediction manifests.'}
              </Text>
            </View>
            {journal.length === 0 && (
              <View style={[s.card, { alignItems: 'center', padding: 32 }]}>
                <Text style={{ color: '#78350F', opacity: 0.5, fontSize: 12, fontStyle: 'italic' }}>Your prediction journal is currently empty.</Text>
              </View>
            )}
            {journal.map((item: any, idx: number) => {
              const statusMap: Record<string, { bg: string; border: string; text: string; label: string }> = {
                HAPPENED: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', label: 'Happened ✓' },
                PARTIALLY_HAPPENED: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', label: 'Partial ✓' },
                DID_NOT_HAPPEN: { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239', label: "Didn't Happen" },
                UPCOMING: { bg: '#F3F4F6', border: '#E5E7EB', text: '#374151', label: 'Upcoming' },
              };
              const st = statusMap[item.status] || statusMap.UPCOMING;
              return (
                <View key={idx} style={[s.card, item.status === 'HAPPENED' && { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#78350F', opacity: 0.6 }}>Target: {item.targetMonth}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: st.bg, borderWidth: 1, borderColor: st.border }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: st.text }}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={s.evTitle}>{item.title}</Text>
                  <Text style={[s.evDesc, { fontStyle: 'italic' }]}>"{item.predictionText}"</Text>
                  <View style={{ borderTopWidth: 1, borderTopColor: '#EFE8D9', paddingTop: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#78350F', textTransform: 'uppercase', marginBottom: 6 }}>Update Outcome Status</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {[
                        { status: 'HAPPENED', label: 'Happened' },
                        { status: 'PARTIALLY_HAPPENED', label: 'Partial' },
                        { status: 'DID_NOT_HAPPEN', label: "Didn't Happen" },
                        { status: 'UPCOMING', label: 'Reset' },
                      ].map((btn) => {
                        const sel = item.status === btn.status;
                        return (
                          <TouchableOpacity key={btn.status} onPress={() => handleJournalStatus(item.id, btn.status)}
                            style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: sel ? '#3F2D1D' : '#EFE8D9', backgroundColor: sel ? '#3F2D1D' : '#FFF' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: sel ? '#F8F5EF' : '#78350F' }}>{btn.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5EF', paddingTop: Platform.OS === 'android' ? 0 : 0 },
  center: { flex: 1, backgroundColor: '#F8F5EF', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 10, color: '#78350F', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6 },
  retryBtn: { marginTop: 16, backgroundColor: '#451A03', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  tabBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFE8D9', flexGrow: 0 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8F5EF' },
  tabBtnActive: { backgroundColor: '#3F2D1D' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#78350F' },
  tabBtnTextActive: { color: '#F8F5EF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 16, shadowColor: '#451A03', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 0.5 },
  domainCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EFE8D9', padding: 14, marginBottom: 10 },
  labelU: { fontSize: 9, fontWeight: '800', color: '#B45309', textTransform: 'uppercase', letterSpacing: 2 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dashaName: { fontSize: 20, fontWeight: '700', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  dashaSub: { fontSize: 8, fontWeight: '600', color: '#78350F', opacity: 0.5, textTransform: 'uppercase', marginTop: 2 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: 5 },
  bulletText: { fontSize: 12, color: '#3F2D1D', lineHeight: 17, flex: 1 },
  spotlightCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  spotlightTitle: { fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  spotlightDesc: { fontSize: 12, color: '#3F2D1D', lineHeight: 17, opacity: 0.75 },
  spotlightReason: { fontSize: 9, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', borderTopWidth: 1, paddingTop: 6, marginTop: 4 },
  meterLabel: { fontSize: 9, fontWeight: '700', color: '#78716C' },
  meterVal: { fontSize: 9, fontWeight: '800', color: '#3F2D1D' },
  filterLabel: { fontSize: 9, fontWeight: '800', color: '#78350F', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 7 },
  chipBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', backgroundColor: '#F8F5EF' },
  chipBtnActive: { backgroundColor: '#3F2D1D', borderColor: '#3F2D1D' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#78350F' },
  chipTextActive: { color: '#F8F5EF' },
  yearChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#EFE8D9', backgroundColor: '#F8F5EF', flexDirection: 'row', alignItems: 'center' },
  yearChipActive: { backgroundColor: '#3F2D1D', borderColor: '#3F2D1D' },
  yearChipText: { fontSize: 11, fontWeight: '600', color: '#78350F' },
  yearChipTextActive: { color: '#F8F5EF' },
  sectionHead: { fontSize: 11, fontWeight: '800', color: '#B45309', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  evTitle: { fontSize: 15, fontWeight: '700', color: '#3F2D1D', marginBottom: 4, marginTop: 4 },
  evDesc: { fontSize: 12, color: '#78350F', lineHeight: 17, opacity: 0.8, marginBottom: 10 },
  detailBox: { backgroundColor: '#F8F5EF', borderRadius: 10, padding: 10, gap: 3, marginBottom: 10 },
  detailText: { fontSize: 10, color: '#78350F' },
  listLabel: { fontSize: 9, fontWeight: '800', color: '#78350F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
});
