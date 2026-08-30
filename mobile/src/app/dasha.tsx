import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Compass, AlertTriangle, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

const PLANET_NAMES_HI: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};
const tHP = (n: string) => PLANET_NAMES_HI[n] || n;
const translateTimeHi = (str: string) => {
  if (!str) return '';
  return str.replace(/years?/gi, 'वर्ष').replace(/months?/gi, 'माह').replace(/days?/gi, 'दिन').replace(/ends in/gi, '').trim();
};
const getLocalizedDoAvoid = (text: string, isHindi: boolean) => {
  if (!isHindi || !text) return text;
  const lower = text.toLowerCase();
  if (lower.includes('taking new initiatives')) return 'नई पहलें करना';
  if (lower.includes('expanding network')) return 'सामूहिक संपर्क बढ़ाना';
  if (lower.includes('capitalizing on momentum')) return 'गतिशीलता का लाभ उठाना';
  if (lower.includes('avoid over-committing')) return 'अति-प्रतिबद्धता से बचें';
  if (lower.includes('stay grounded')) return 'यथार्थ में स्थिर रहें';
  if (lower.includes('structured planning')) return 'संरचित योजना';
  if (lower.includes('review your plans')) return 'अपनी योजनाओं की समीक्षा करें';
  if (lower.includes('build structure')) return 'संरचना का निर्माण करें';
  if (lower.includes('stay consistent')) return 'निरंतरता बनाए रखें';
  return text;
};

export default function DashaScreen() {
  const { isHindi } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = forceRefresh
        ? await api.getForce('/api/astrology/chart', email ? { email } : undefined)
        : await api.getCached('/api/astrology/chart', email ? { email } : undefined);
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load dasha data');
      }
    } catch (err: any) {
      setError('Unable to reach celestial engine. Please make sure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>
          {isHindi ? 'दशा चक्र लोड हो रहा है...' : 'Reading Dasha Cycles...'}
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <AlertTriangle size={40} color="#E11D48" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchData(); }}>
          <Text style={styles.retryButtonText}>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { temporal, narrative, insights, guidance } = data;
  const stack = temporal?.stack || {};
  const timing = temporal?.timing || {};

  const mahadasha = isHindi ? tHP(stack.mahadasha) : (stack.mahadasha || '—');
  const antardasha = isHindi ? tHP(stack.antardasha) : (stack.antardasha || '—');
  const pratyantar = stack.pratyantar ? (isHindi ? tHP(stack.pratyantar) : stack.pratyantar) : null;

  const getPressureLabel = (pressure: string) => {
    if (!isHindi) return `${pressure || 'Medium'} Pressure Phase`;
    switch (pressure?.toLowerCase()) {
      case 'high': return 'सघन आत्म-मंथन काल';
      case 'medium': return 'मध्यम अनुशासन काल';
      case 'low': return 'सौम्य संरेखण काल';
      default: return 'सक्रिय दशा संरेखण';
    }
  };

  const narrativeLines = (narrative || '').split('\n\n').filter((p: string) => p.trim() !== '');
  const nextShiftDate = timing.endsAt
    ? new Date(timing.endsAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {/* Hero Panel */}
      <View style={styles.heroCard}>
        <View style={styles.pressureBadge}>
          <Text style={styles.pressureBadgeText}>{getPressureLabel(timing.pressure)}</Text>
        </View>

        <View style={styles.heroHeader}>
          <View style={styles.compassCircle}>
            <Compass size={20} color="#D97706" />
          </View>
          <Text style={styles.heroTagline}>
            {isHindi ? 'सक्रिय दशा चक्र विन्यास' : 'Active Dasha Profile'}
          </Text>
        </View>

        <View style={styles.dashaRow}>
          <View style={styles.dashaBlock}>
            <Text style={styles.dashaLabel}>{isHindi ? 'महादशा स्वामी' : 'Mahadasha'}</Text>
            <Text style={styles.dashaName}>{mahadasha}</Text>
          </View>
          <Text style={styles.dashaSeparator}>/</Text>
          <View style={styles.dashaBlock}>
            <Text style={styles.dashaLabel}>{isHindi ? 'अंतर्दशा स्वामी' : 'Sub-phase'}</Text>
            <Text style={[styles.dashaName, styles.dashaNameAmber]}>{antardasha}</Text>
          </View>
          {pratyantar && (
            <>
              <Text style={styles.dashaSeparator}>/</Text>
              <View style={styles.dashaBlock}>
                <Text style={styles.dashaLabel}>{isHindi ? 'प्रत्यंतर्दशा' : 'Clarity Focus'}</Text>
                <Text style={[styles.dashaName, styles.dashaNameLight]}>{pratyantar}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{isHindi ? 'मुख्य ग्रहीय ऊर्जा' : 'Dominant Force'}</Text>
            <View style={styles.metaDotRow}>
              <View style={styles.metaDot} />
              <Text style={styles.metaValue}>{mahadasha}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{isHindi ? 'विवेचन सटीकता' : 'Clarity Level'}</Text>
            <Text style={[styles.metaValue, { color: '#D97706' }]}>
              {isHindi ? 'अत्यंत सूक्ष्म' : 'High Resolution'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{isHindi ? 'अवशिष्ट काल' : 'Remaining Time'}</Text>
            <Text style={styles.metaValue}>
              {isHindi
                ? (timing.remaining ? `${translateTimeHi(timing.remaining)} शेष` : '—')
                : (timing.remaining ? `Ends in ${timing.remaining}` : '—')}
            </Text>
          </View>
        </View>
      </View>

      {/* The Reading */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{isHindi ? 'पंडित जी का महादशा विवेचन' : 'The Reading'}</Text>
        </View>
        {narrativeLines.slice(0, 3).map((para: string, i: number) => (
          <Text
            key={i}
            style={[
              i === 0 ? styles.narrativeMain : i === narrativeLines.length - 1 ? styles.narrativeFinal : styles.narrativeBody,
            ]}
          >
            {para}
          </Text>
        ))}
      </View>

      {/* Expandable Why */}
      <TouchableOpacity
        style={styles.whyCard}
        onPress={() => setShowExplainer(!showExplainer)}
        activeOpacity={0.8}
      >
        <Text style={styles.whyTitle}>
          {isHindi ? 'यह महादशा चक्र ऐसा क्यों महसूस हो रहा है?' : 'Why does this phase feel this way?'}
        </Text>
        {showExplainer
          ? <ChevronDown size={16} color="#D97706" />
          : <ChevronRight size={16} color="#D97706" />}
      </TouchableOpacity>
      {showExplainer && (
        <View style={styles.whyExpanded}>
          <Text style={styles.whyText}>
            {isHindi
              ? 'यह काल गुरुदेव की विस्तारवादी ऊर्जा तथा शनि देव के अनुशासित न्यायप्रिय प्रभाव का एक सुंदर संगम है। यह आपके जीवन में धैर्य और निरंतर श्रम के माध्यम से प्रगति का मार्ग प्रशस्त करता है। इस संयोजन से उत्पन्न सकारात्मक रचनात्मक खिंचाव दीर्घकालिक सुदृढ़ नींव का निर्माण करने में सहायक होता है।'
              : 'This phase combines Jupiter\'s expansion energy with Saturn\'s discipline—pushing growth, but only through consistent, patient effort. The combination creates productive tension that ultimately builds lasting foundations.'}
          </Text>
        </View>
      )}

      {/* Current Reality & Caution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isHindi ? 'तात्कालिक वास्तविकता' : 'Current Reality'}</Text>
        <View style={styles.realityBox}>
          <Text style={styles.realityText}>{insights?.primary || (isHindi ? 'स्थिरता और संरचनात्मक फोकस।' : 'Stability and structural focus is key.')}</Text>
        </View>
        <View style={styles.cautionBox}>
          <Text style={styles.cautionLabel}>{isHindi ? 'सौम्य जागरूकता' : 'What to Watch'}</Text>
          <View style={styles.cautionRow}>
            <AlertTriangle size={14} color="#F97316" style={{ marginTop: 1 }} />
            <Text style={styles.cautionText}>{insights?.caution || (isHindi ? 'अति-प्रतिबद्धता से बचें' : 'Avoid over-committing')}</Text>
          </View>
        </View>
      </View>

      {/* Path Forward — Do & Avoid */}
      {guidance && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isHindi ? 'साधना एवं कर्म संरेखण पथ' : 'The Path Forward'}</Text>
          <View style={styles.doBox}>
            <View style={styles.doHeader}>
              <CheckCircle size={14} color="#059669" />
              <Text style={styles.doHeaderText}>{isHindi ? 'इनका अधिक अभ्यास करें' : 'Do More Of'}</Text>
            </View>
            {(guidance.do || []).map((item: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDotGreen}>•</Text>
                <Text style={styles.doText}>{getLocalizedDoAvoid(item, isHindi)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.avoidBox}>
            <View style={styles.doHeader}>
              <AlertTriangle size={14} color="#E11D48" />
              <Text style={styles.avoidHeaderText}>{isHindi ? 'इनमें संयम बरतें' : 'Practice Restraint'}</Text>
            </View>
            {(guidance.avoid || []).map((item: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDotRed}>•</Text>
                <Text style={styles.avoidText}>{getLocalizedDoAvoid(item, isHindi)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Next Phase Shift */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isHindi ? 'अगला दशा परिवर्तन काल' : 'Next Phase Shift'}</Text>
        <Text style={styles.nextPhaseText}>
          {isHindi
            ? 'आगामी दशा चक्र ग्रहीय दबाव को शिथिल करेगा, जिससे स्पष्ट निर्णय और त्वरित प्रगति के अवसर मिलेंगे। वर्तमान में निर्मित अनुशासित नींव ही आगामी यात्रा की गति निर्धारित करेगी।'
            : 'The next phase reduces pressure and allows faster movement with clearer decisions. What you build now determines how fast you move next.'}
        </Text>
        {nextShiftDate !== '' && (
          <Text style={styles.nextPhaseDate}>
            {isHindi ? `प्रारंभ तिथि: ${nextShiftDate}` : `Starts ${nextShiftDate}`}
          </Text>
        )}
        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.progressLabel}>
          {isHindi ? 'वर्तमान अंतर्दशा का 40% भाग पूर्ण' : '40% through current Antardasha'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5EF' },
  centerContainer: { flex: 1, backgroundColor: '#F8F5EF', justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  loadingText: { marginTop: 12, color: '#78350F', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6 },
  errorText: { color: '#E11D48', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#451A03', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#F8F5EF', fontWeight: '700' },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#EFE8D9', padding: 20, gap: 16 },
  pressureBadge: { alignSelf: 'flex-end', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pressureBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compassCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  heroTagline: { fontSize: 11, fontWeight: '700', color: '#78350F', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1.5 },
  dashaRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 },
  dashaBlock: { gap: 2 },
  dashaLabel: { fontSize: 9, fontWeight: '700', color: '#78350F', opacity: 0.4, textTransform: 'uppercase', letterSpacing: 1 },
  dashaName: { fontSize: 32, fontWeight: '600', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  dashaNameAmber: { color: '#D97706' },
  dashaNameLight: { color: '#F59E0B' },
  dashaSeparator: { fontSize: 24, color: '#F1E7D0', paddingBottom: 4 },
  metaRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EFE8D9', paddingTop: 14, gap: 8 },
  metaItem: { flex: 1, gap: 4 },
  metaLabel: { fontSize: 9, fontWeight: '700', color: '#78350F', opacity: 0.4, textTransform: 'uppercase', letterSpacing: 0.8 },
  metaDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D97706' },
  metaValue: { fontSize: 11, fontWeight: '600', color: '#3F2D1D' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
  narrativeMain: { fontSize: 16, color: '#78350F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 24, borderLeftWidth: 3, borderLeftColor: '#D97706', paddingLeft: 12, fontWeight: '500' },
  narrativeBody: { fontSize: 13, color: '#3F2D1D', lineHeight: 20 },
  narrativeFinal: { fontSize: 12, fontWeight: '700', color: '#D97706', borderTopWidth: 1, borderTopColor: '#EFE8D9', paddingTop: 10 },
  whyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EFE8D9', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  whyTitle: { fontSize: 11, fontWeight: '700', color: '#78350F', opacity: 0.6, flex: 1 },
  whyExpanded: { backgroundColor: '#FFFDF9', borderRadius: 16, borderWidth: 1, borderColor: '#EFE8D9', padding: 16 },
  whyText: { fontSize: 13, color: '#78350F', lineHeight: 20 },
  realityBox: { backgroundColor: '#FEF3C7', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', padding: 12 },
  realityText: { fontSize: 13, fontWeight: '500', color: '#78350F', lineHeight: 20 },
  cautionBox: { backgroundColor: '#FFF7ED', borderRadius: 12, borderWidth: 1, borderColor: '#FED7AA', padding: 12, gap: 6 },
  cautionLabel: { fontSize: 9, fontWeight: '700', color: '#C2410C', textTransform: 'uppercase', letterSpacing: 1 },
  cautionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cautionText: { fontSize: 13, color: '#9A3412', flex: 1, lineHeight: 20 },
  doBox: { backgroundColor: '#ECFDF5', borderRadius: 14, borderWidth: 1, borderColor: '#D1FAE5', padding: 14, gap: 8 },
  doHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  doHeaderText: { fontSize: 10, fontWeight: '700', color: '#065F46', textTransform: 'uppercase', letterSpacing: 1 },
  doText: { fontSize: 12, color: '#065F46', lineHeight: 18, flex: 1 },
  avoidBox: { backgroundColor: '#FFF1F2', borderRadius: 14, borderWidth: 1, borderColor: '#FFE4E6', padding: 14, gap: 8 },
  avoidHeaderText: { fontSize: 10, fontWeight: '700', color: '#9F1239', textTransform: 'uppercase', letterSpacing: 1 },
  avoidText: { fontSize: 12, color: '#9F1239', lineHeight: 18, flex: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bulletDotGreen: { color: '#059669', fontSize: 14, lineHeight: 20 },
  bulletDotRed: { color: '#E11D48', fontSize: 14, lineHeight: 20 },
  nextPhaseText: { fontSize: 13, color: '#78350F', lineHeight: 20 },
  nextPhaseDate: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#D97706' },
  progressBg: { height: 8, backgroundColor: '#FEF3C7', borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', width: '40%', backgroundColor: '#D97706', borderRadius: 4 },
  progressLabel: { fontSize: 10, color: '#D97706', opacity: 0.6 },
});
