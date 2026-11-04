import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles,
  Compass,
  Clock,
  TrendingUp,
  Orbit,
  BookOpen,
  Zap,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { Spacing } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { isHindi } = useLanguage();

  const [userName, setUserName] = useState('Seeker');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const name = await AsyncStorage.getItem('divya:userName');
      if (name) setUserName(name);

      if (!email) {
        setError('No active session found. Please login.');
        setLoading(false);
        return;
      }

      const res = await api.get('/api/astrology/chart', { email });
      if (res?.success && res?.data) {
        setChartData(res.data);
        setError(null);
      } else {
        setError(res?.error?.message || 'Failed to load chart details.');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Connection failed. Please check server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !chartData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>
          {isHindi ? 'आकाशीय कालचक्र संरेखित हो रहा है...' : 'Aligning Sacred Birth Chart...'}
        </Text>
      </View>
    );
  }

  if (error && !chartData) {
    return (
      <View style={styles.centerContainer}>
        <AlertTriangle size={40} color="#E11D48" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            loadData();
          }}
        >
          <Text style={styles.retryButtonText}>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const temporal = chartData?.temporal;
  const narrative = chartData?.narrative;
  const guidance = chartData?.guidance;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#D97706"
          />
        }
      >
        {/* Header Welcome Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.greetingText}>
              {isHindi ? 'नमस्ते,' : 'Namaste,'} {userName} 🙏
            </Text>
          </View>
        </View>

        {/* Quick Action Hub Options */}
        <View style={styles.hubSection}>
          <Text style={styles.sectionTitle}>
            {isHindi ? 'मुख्य सुविधाएं एवं विकल्प' : 'Exploration & Options Hub'}
          </Text>
          <View style={styles.hubGrid}>
            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <View style={[styles.hubIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Sparkles size={22} color="#D97706" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'जीवन टाइमलाइन' : 'Life Insights'}</Text>
              <Text style={styles.hubSub}>{isHindi ? 'कुंडली विश्लेषण' : 'Timeline & Promise'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => router.push('/(tabs)/transits')}
            >
              <View style={[styles.hubIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Orbit size={22} color="#059669" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'दैनिक गोचर' : 'Daily Transits'}</Text>
              <Text style={styles.hubSub}>{isHindi ? 'ग्रह गोचर स्थिति' : 'Planetary Positions'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => router.push('/(tabs)/ritual')}
            >
              <View style={[styles.hubIconBg, { backgroundColor: '#FAF5FF' }]}>
                <TrendingUp size={22} color="#7C3AED" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'वैदिक उपाय' : 'Remedies'}</Text>
              <Text style={styles.hubSub}>{isHindi ? 'अनुष्ठान एवं रत्न' : 'Rituals & Gems'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <View style={[styles.hubIconBg, { backgroundColor: '#FFF1F2' }]}>
                <Zap size={22} color="#E11D48" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'कॉस्मिक रडार' : 'Cosmic Radar'}</Text>
              <Text style={styles.hubSub}>{isHindi ? 'भविष्य दृष्टिकोण' : 'Future Outlook'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <View style={[styles.hubIconBg, { backgroundColor: '#EFF6FF' }]}>
                <BookOpen size={22} color="#2563EB" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'भविष्यवाणी जर्नल' : 'Prediction Journal'}</Text>
              <Text style={styles.hubSub}>{isHindi ? 'सत्यापन लॉग' : 'Log Outcomes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => router.push('/(tabs)/transits')}
            >
              <View style={[styles.hubIconBg, { backgroundColor: '#FFFBEB' }]}>
                <Compass size={22} color="#B45309" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'पंचांग मुहूर्त' : 'Panchang Muhurat'}</Text>
              <Text style={styles.hubSub}>{isHindi ? 'शुभ मुहूर्त' : 'Auspicious Times'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vimshottari Dasha Profile */}
        {temporal && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Compass size={18} color="#D97706" />
              <Text style={styles.cardSectionTitle}>
                {isHindi ? 'विंशोत्तरी दशा स्थिति' : 'Active Vimshottari Dasha'}
              </Text>
            </View>

            <View style={styles.dashaMainRow}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.dashaLord}>{temporal.stack?.mahadasha}</Text>
                <Text style={styles.dashaRole}>Mahadasha</Text>
              </View>
              <Text style={styles.dashaSlash}>/</Text>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.dashaLord, { color: '#D97706' }]}>
                  {temporal.stack?.antardasha}
                </Text>
                <Text style={styles.dashaRole}>Antardasha</Text>
              </View>
              {temporal.stack?.pratyantar && (
                <>
                  <Text style={styles.dashaSlash}>/</Text>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.dashaLord, { color: '#B45309', fontSize: 16 }]}>
                      {temporal.stack?.pratyantar}
                    </Text>
                    <Text style={styles.dashaRole}>Pratyantar</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.dashaFooter}>
              <Clock size={13} color="#78350F" />
              <Text style={styles.dashaFooterText}>
                {isHindi ? 'अवधि शेष: ' : 'Remaining: '}
                <Text style={{ fontWeight: '700' }}>{temporal.timing?.remaining}</Text> (
                {new Date(temporal.timing?.endsAt).toLocaleDateString()})
              </Text>
            </View>
          </View>
        )}

        {/* Core Guidance Card */}
        {narrative && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <BookOpen size={18} color="#D97706" />
              <Text style={styles.cardSectionTitle}>
                {isHindi ? 'पंडित जी का मुख्य परामर्श' : "Pandit Ji's Core Guidance"}
              </Text>
            </View>
            <Text style={styles.narrativeBody}>{narrative}</Text>
          </View>
        )}

        {/* Directives Row: Do & Avoid */}
        {guidance && (
          <View style={styles.directivesRow}>
            {/* DO LIST */}
            <View style={[styles.directiveCard, styles.doCard]}>
              <Text style={styles.doHeader}>{isHindi ? '✓ अनुकूल कर्म (Do)' : '✓ Favorable (Do)'}</Text>
              {guidance.do?.slice(0, 3).map((item: string, idx: number) => (
                <View key={idx} style={styles.directiveItem}>
                  <Text style={{ color: '#059669', fontWeight: 'bold' }}>• </Text>
                  <Text style={styles.doText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* AVOID LIST */}
            <View style={[styles.directiveCard, styles.avoidCard]}>
              <Text style={styles.avoidHeader}>{isHindi ? '✕ सावधानियां (Avoid)' : '✕ Restraints (Avoid)'}</Text>
              {guidance.avoid?.slice(0, 3).map((item: string, idx: number) => (
                <View key={idx} style={styles.directiveItem}>
                  <Text style={{ color: '#E11D48', fontWeight: 'bold' }}>• </Text>
                  <Text style={styles.avoidText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DivyaDrishti — Vedic Wisdom, Modern Intelligence
          </Text>
          <Text style={styles.footerSub}>PARASHARI D1 + D10 ENGINE VERIFIED</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EF',
  },
  scrollContainer: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8F5EF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  loadingText: {
    marginTop: 12,
    color: '#78350F',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.6,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#451A03',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#F8F5EF',
    fontWeight: '700',
    fontSize: 13,
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 0.5,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  hubSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  hubCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.three,
    alignItems: 'center',
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0.5,
  },
  hubIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hubLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F2D1D',
    textAlign: 'center',
  },
  hubSub: {
    fontSize: 10,
    color: '#78350F',
    opacity: 0.6,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  dashaMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dashaLord: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dashaSlash: {
    fontSize: 18,
    color: '#EFE8D9',
  },
  dashaRole: {
    fontSize: 9,
    fontWeight: '600',
    color: '#78350F',
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  dashaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8F5EF',
    paddingTop: 10,
    marginTop: 8,
  },
  dashaFooterText: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.8,
  },
  narrativeBody: {
    fontSize: 13,
    color: '#3F2D1D',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  directivesRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  directiveCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
  doCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  avoidCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  doHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  avoidHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9F1239',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  directiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  doText: {
    fontSize: 11,
    color: '#047857',
    flex: 1,
    lineHeight: 16,
  },
  avoidText: {
    fontSize: 11,
    color: '#BE123C',
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    color: '#78350F',
    opacity: 0.5,
  },
  footerSub: {
    fontSize: 8,
    color: '#78350F',
    opacity: 0.3,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
});
