import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Brain, TrendingUp, Sparkles, Info, AlertTriangle } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';

interface ReflectionHistoryItem {
  id: string;
  date: string;
  energy: 'HIGH' | 'NEUTRAL' | 'LOW';
  stress: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

export default function WeeklyRhythmScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ReflectionHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) {
        setError('User session not found.');
        return;
      }
      
      const res = forceRefresh
        ? await api.getForce('/api/reflections/history', { email })
        : await api.getCached('/api/reflections/history', { email });
      if (res.success) {
        setHistory(res.history || []);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load weekly logs.');
      }
    } catch (err: any) {
      console.error('Error fetching weekly rhythm history:', err);
      setError('Connection failed. Please verify your backend server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(true);
  };

  const getCalendarDays = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const mockVedicTransits = [
      { moonSign: 'Taurus', speed: 'Swift & Harmonious', score: 85, nature: 'SUPPORTIVE' },
      { moonSign: 'Gemini', speed: 'Swift & Communicative', score: 78, nature: 'SUPPORTIVE' },
      { moonSign: 'Cancer', speed: 'Moderately Centering', score: 72, nature: 'GROUNDING' },
      { moonSign: 'Leo', speed: 'Swift & Expressive', score: 80, nature: 'SUPPORTIVE' },
      { moonSign: 'Virgo', speed: 'Deliberate & Analytical', score: 65, nature: 'SENSITIVE' },
      { moonSign: 'Libra', speed: 'Symmetric & Social', score: 82, nature: 'SUPPORTIVE' },
      { moonSign: 'Scorpio', speed: 'Slow & Deeply Grounding', score: 55, nature: 'SENSITIVE' },
    ];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      // Find if we have a real reflection for this date
      const realLog = history.find((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === d.getTime();
      });

      const transitIdx = d.getDate() % 7;
      const transit = mockVedicTransits[transitIdx];

      days.push({
        dateObject: d,
        dayLabel: weekdays[d.getDay()],
        dayNum: d.getDate(),
        transit,
        log: realLog || null,
      });
    }
    return days;
  };

  if (loading && history.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Analyzing Somatic Rhythms...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertTriangle size={40} color="#E11D48" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchHistory(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const days = getCalendarDays();
  const loggedCount = history.length;
  const highEnergyDays = history.filter((h) => h.energy === 'HIGH').length;
  const highStressDays = history.filter((h) => h.stress === 'HIGH').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />
        }
      >
        {/* Core Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Brain size={18} color="#D97706" />
            <Text style={styles.summaryTitle}>Temporal Intelligence</Text>
          </View>
          <Text style={styles.summaryDesc}>
            Vedic transits indicate ambient emotional patterns. Let's see how your logged physical experiences match the lunar velocities.
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Logging Consistency</Text>
              <Text style={styles.progressVal}>{loggedCount}/7 Days</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${(loggedCount / 7) * 100}%` }]} />
            </View>
            <View style={styles.statsStrip}>
              <Text style={styles.statText}>Vitality peaks: {highEnergyDays} days</Text>
              <Text style={styles.statText}>Tension spikes: {highStressDays} days</Text>
            </View>
          </View>
        </View>

        {/* Calendar Matrix */}
        <Text style={styles.sectionHeading}>Weekly Somatic Matrix</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matrixScroll}>
          {days.map((day, idx) => {
            const isToday = idx === 6;
            
            // Colors for transits
            const isSupportive = day.transit.nature === 'SUPPORTIVE';
            const isGrounding = day.transit.nature === 'GROUNDING';
            const transitBg = isSupportive ? '#ECFDF5' : isGrounding ? '#FFFBEB' : '#FFF1F2';
            const transitBorder = isSupportive ? '#A7F3D0' : isGrounding ? '#FDE68A' : '#FECDD3';
            const transitText = isSupportive ? '#047857' : isGrounding ? '#B45309' : '#BE123C';

            return (
              <View
                key={idx}
                style={[
                  styles.dayCard,
                  isToday ? styles.todayCard : null,
                ]}
              >
                <View style={styles.dayDateRow}>
                  <Text style={styles.dayLabel}>{day.dayLabel}</Text>
                  <Text style={styles.dayNum}>{day.dayNum}</Text>
                </View>

                {/* Transit Details */}
                <View style={[styles.transitBox, { backgroundColor: transitBg, borderColor: transitBorder }]}>
                  <Text style={[styles.transitSign, { color: transitText }]}>{day.transit.moonSign}</Text>
                  <Text style={styles.transitSpeed}>{day.transit.speed}</Text>
                  <Text style={[styles.transitScore, { color: transitText }]}>
                    Score: {day.transit.score}%
                  </Text>
                </View>

                {/* Logged Values */}
                <View style={styles.somaticsBox}>
                  <Text style={styles.somaticsTitle}>Somatics</Text>
                  {day.log ? (
                    <View style={styles.somaticsData}>
                      <Text style={styles.somaticText}>
                        ⚡ {day.log.energy === 'HIGH' ? 'High' : day.log.energy === 'NEUTRAL' ? 'Mid' : 'Low'}
                      </Text>
                      <Text style={styles.somaticText}>
                        🟢 {day.log.stress === 'LOW' ? 'Calm' : day.log.stress === 'MEDIUM' ? 'Mid' : 'Tight'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.emptyReflectionText}>No log</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Observed Energetic Patterns */}
        <View style={styles.card}>
          <View style={styles.summaryTitleRow}>
            <TrendingUp size={16} color="#D97706" />
            <Text style={styles.sectionHeadingTitle}>Observed Energetic Patterns</Text>
          </View>
          <Text style={styles.lessonsText}>
            Vedic transits reflect the environmental atmosphere, while your somatic check-ins reflect reactions. Direct your schedules to match:
          </Text>

          <View style={styles.patternBox}>
            <View style={[styles.bulletPoint, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={styles.patternTitle}>Swift Transits (75%+ Score)</Text>
              <Text style={styles.patternDesc}>
                Favorable for critical communications, launching plans, and external meetings.
              </Text>
            </View>

            <View style={[styles.bulletPoint, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
              <Text style={styles.patternTitle}>Slower transits (Under 60% Score)</Text>
              <Text style={styles.patternDesc}>
                Best suited for quiet introspective resets, organization, and digital containment.
              </Text>
            </View>
          </View>
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
  centerContainer: {
    flex: 1,
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
  },
  scrollContainer: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 24,
    padding: Spacing.four,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  summaryDesc: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.8,
    lineHeight: 16,
    marginBottom: Spacing.four,
  },
  progressSection: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#EFE8D9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D97706',
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 9,
    color: '#78350F',
    opacity: 0.6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: Spacing.two,
  },
  matrixScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  dayCard: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.three,
    justifyContent: 'space-between',
    gap: 10,
  },
  todayCard: {
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  dayDateRow: {
    alignItems: 'flex-start',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78350F',
    opacity: 0.5,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  transitBox: {
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 6,
    gap: 2,
  },
  transitSign: {
    fontSize: 10,
    fontWeight: '700',
  },
  transitSpeed: {
    fontSize: 8,
    color: '#78350F',
    opacity: 0.8,
  },
  transitScore: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'right',
  },
  somaticsBox: {
    borderTopWidth: 1,
    borderTopColor: '#F8F5EF',
    paddingTop: 8,
    gap: 4,
  },
  somaticsTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  somaticsData: {
    gap: 2,
  },
  somaticText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#3F2D1D',
  },
  emptyReflectionText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#C4B5A5',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
  },
  sectionHeadingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F2D1D',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  lessonsText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: Spacing.three,
  },
  patternBox: {
    gap: Spacing.three,
  },
  bulletPoint: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
  patternTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F2D1D',
    marginBottom: 2,
  },
  patternDesc: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
});
