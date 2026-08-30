import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Compass, Sparkles, TrendingUp, AlertTriangle, AlertCircle, Quote, Moon, Calendar, MessageSquare, Heart, Shield, Clock } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const [userName, setUserName] = useState('Seeker');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      
      // Fetch user profile to get actual name (cache-first, force on refresh)
      if (email) {
        try {
          const profileData = forceRefresh
            ? await api.getForce('/api/user', { email })
            : await api.getCached('/api/user', { email });
          if (profileData?.success && profileData?.user) {
            setUserName(profileData.user.name);
          }
        } catch (profileErr) {
          console.error('Error fetching user profile:', profileErr);
        }
      }

      // Load chart data — serve cached instantly, revalidate in background
      const res = forceRefresh
        ? await api.getForce('/api/astrology/chart', email ? { email } : undefined)
        : await api.getCached('/api/astrology/chart', email ? { email } : undefined);

      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load cosmic data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Error connecting to celestial engine. Please make sure your backend server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true); // force network bypass cache
  };

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Calibrating Celestial Compass...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={40} color="#E11D48" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchDashboardData(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { narrative, insights, guidance, temporal } = data;
  const firstSentenceOfNarrative = narrative ? narrative.split('\n')[0] : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />
        }
      >
        {/* Welcome Strip */}
        <View style={styles.welcomeStrip}>
          <View style={styles.statusDotContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isHindi ? `संरेखण सक्रिय: ${userName}` : `Alignment Confirmed: ${userName}`}
            </Text>
          </View>
        </View>

        {/* Sacred Astrology Hub */}
        <View style={styles.hubContainer}>
          <Text style={styles.hubTitle}>{isHindi ? 'पवित्र ज्योतिष हब' : 'Sacred Astrology Hub'}</Text>
          <View style={styles.hubGrid}>
            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/kundali')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Moon size={20} color="#3B82F6" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'कुंडली' : 'Kundali'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/predictions')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Sparkles size={20} color="#D97706" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'भविष्यफल' : 'Predictions'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/dasha')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#FFF7ED' }]}>
                <Clock size={20} color="#C2410C" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'दशा काल' : 'Dasha'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/planets')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Compass size={20} color="#10B981" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'ग्रह' : 'Planets'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/remedies')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#FFF5F7' }]}>
                <Heart size={20} color="#EC4899" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'उपाय' : 'Remedies'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/weekly-rhythm')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#F5F3FF' }]}>
                <Calendar size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'लय' : 'Rhythm'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/chat')}>
              <View style={[styles.hubIconBg, { backgroundColor: '#FFF1F2' }]}>
                <MessageSquare size={20} color="#F43F5E" />
              </View>
              <Text style={styles.hubLabel}>{isHindi ? 'पंडित चैट' : 'Pundit Chat'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Insight Card */}
        <View style={styles.heroCard}>
          <View style={styles.quoteIconContainer}>
            <Quote size={36} color="rgba(217, 119, 6, 0.08)" />
          </View>
          <Text style={styles.heroSectionTitle}>Opening Statement</Text>
          <Text style={styles.heroInsight}>{insights?.primary}</Text>
          {firstSentenceOfNarrative ? (
            <Text style={styles.heroNarrative}>"{firstSentenceOfNarrative}"</Text>
          ) : null}
        </View>

        {/* Life Season Box */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Current Life Season</Text>
          <View style={styles.dashaContainer}>
            <View>
              <View style={styles.dashaRow}>
                <Text style={styles.dashaMajor}>{temporal?.stack?.mahadasha || '...'}</Text>
                <Text style={styles.dashaDivider}>/</Text>
                <Text style={styles.dashaSub}>{temporal?.stack?.antardasha || '...'}</Text>
              </View>
              <Text style={styles.dashaDescription}>
                Active planetary sub-cycles govern professional and spiritual restructuring.
              </Text>
            </View>
          </View>
          
          <View style={styles.nextShiftContainer}>
            <Text style={styles.nextShiftLabel}>Next Shift</Text>
            <Text style={styles.nextShiftValue}>{temporal?.stack?.nextAntardasha || 'Stable'}</Text>
          </View>
        </View>

        {/* Logic & Caution */}
        <View style={styles.gridRow}>
          <View style={[styles.sectionCard, { flex: 1 }]}>
            <Text style={styles.sectionLabel}>Supporting Logic</Text>
            <View style={styles.bulletList}>
              {insights?.supporting?.slice(0, 3).map((point: string, idx: number) => (
                <View key={idx} style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.sectionCard, styles.cautionCard, { flex: 1 }]}>
            <View style={styles.cautionHeader}>
              <AlertTriangle size={16} color="#78350F" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionLabel, { color: '#78350F', marginBottom: 0 }]}>Critical Caution</Text>
            </View>
            <Text style={styles.cautionText}>"{insights?.caution}"</Text>
          </View>
        </View>

        {/* Behavioral Directives */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionLabel, { textAlign: 'center', fontSize: 12, letterSpacing: 3 }]}>
            Behavioral Directives
          </Text>

          <View style={styles.directivesRow}>
            {/* DO LIST */}
            <View style={styles.directiveColumn}>
              <Text style={styles.doHeader}>Primary Actions (Do)</Text>
              {guidance?.do?.slice(0, 3).map((item: string, idx: number) => (
                <View key={idx} style={styles.doBox}>
                  <Text style={styles.doText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* AVOID LIST */}
            <View style={styles.directiveColumn}>
              <Text style={styles.avoidHeader}>Mindful Restraints (Avoid)</Text>
              {guidance?.avoid?.slice(0, 3).map((item: string, idx: number) => (
                <View key={idx} style={styles.avoidBox}>
                  <Text style={styles.avoidText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Birth Integrity Confirmed</Text>
          <Text style={styles.footerVersion}>DIVYADRISHTI ASTRO v2.0</Text>
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
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8F5EF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  loadingText: {
    marginTop: Spacing.three,
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.6,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#451A03',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#F8F5EF',
    fontWeight: '700',
    fontSize: 14,
  },
  welcomeStrip: {
    alignItems: 'flex-start',
    marginBottom: Spacing.one,
  },
  statusDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981', // emerald-500
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#451A03',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    position: 'relative',
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  quoteIconContainer: {
    position: 'absolute',
    top: Spacing.four,
    right: Spacing.four,
  },
  heroSectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: Spacing.two,
  },
  heroInsight: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 30,
    marginBottom: Spacing.three,
  },
  heroNarrative: {
    fontSize: 14,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 20,
    opacity: 0.8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.three,
  },
  dashaContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
    paddingBottom: Spacing.three,
    marginBottom: Spacing.three,
  },
  dashaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dashaMajor: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dashaDivider: {
    fontSize: 22,
    color: '#C4B5A5',
  },
  dashaSub: {
    fontSize: 28,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  dashaDescription: {
    fontSize: 12,
    color: '#78350F',
    opacity: 0.7,
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  nextShiftContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextShiftLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  nextShiftValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
  },
  gridRow: {
    flexDirection: 'column',
    gap: Spacing.four,
  },
  bulletList: {
    gap: Spacing.two,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    marginRight: 6,
    color: '#B45309',
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    flex: 1,
  },
  cautionCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.03)',
    borderColor: '#E5DCC6',
  },
  cautionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  cautionText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  directivesRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  directiveColumn: {
    flex: 1,
    gap: Spacing.two,
  },
  doHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46', // emerald-800
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  avoidHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9F1239', // rose-800
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  doBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    padding: 10,
    minHeight: 52,
    justifyContent: 'center',
  },
  doText: {
    fontSize: 11,
    color: '#064E3B',
    lineHeight: 16,
    textAlign: 'center',
  },
  avoidBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: 10,
    minHeight: 52,
    justifyContent: 'center',
  },
  avoidText: {
    fontSize: 11,
    color: '#4C0519',
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#EFE8D9',
    paddingTop: Spacing.four,
    gap: 4,
  },
  footerText: {
    fontSize: 9,
    color: '#C4B5A5',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  footerVersion: {
    fontSize: 9,
    color: '#C4B5A5',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  hubContainer: {
    marginBottom: Spacing.two,
  },
  hubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.three,
  },
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  hubCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0.5,
    marginBottom: Spacing.two,
  },
  hubIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  hubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#451A03',
    textAlign: 'center',
  },
});
