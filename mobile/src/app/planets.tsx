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
import { Sparkles, Info, Compass, ChevronDown, ChevronUp } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const getSignName = (signNum: number) => {
  return ZODIAC_SIGNS[(signNum - 1) % 12] || 'Aries';
};

const getPlanetSymbol = (name: string) => {
  const clean = name.toLowerCase().trim();
  if (clean.includes('sun')) return '☉';
  if (clean.includes('moon')) return '☾';
  if (clean.includes('mars')) return '♂';
  if (clean.includes('mercury')) return '☿';
  if (clean.includes('jupiter')) return '♃';
  if (clean.includes('venus')) return '♀';
  if (clean.includes('saturn')) return '♄';
  if (clean.includes('rahu')) return '☊';
  if (clean.includes('ketu')) return '☋';
  return '✦';
};

const getPlanetLessons = (name: string) => {
  const clean = name.toLowerCase().trim();
  if (clean.includes('sun')) {
    return 'Governs the soul, leadership, and ego. Asks you to anchor true self-authority and radiate clear vitality without needing external validation.';
  }
  if (clean.includes('moon')) {
    return 'Rules the subconscious mind, emotional rhythms, and receptivity. Invites you to calm reactive thinking and observe your interior waves.';
  }
  if (clean.includes('mars')) {
    return 'Governs physical drive, courage, and focused energy. Demands that you channel anger or impulse into deliberate, structured action.';
  }
  if (clean.includes('mercury')) {
    return 'Rules speech, logical analysis, and communications. Asks you to write down ideas, organize schedules, and avoid mental clutter.';
  }
  if (clean.includes('jupiter')) {
    return 'Governs wisdom, spiritual growth, and prosperity. Guides you to seek gratitude, look at the big picture, and support other seekers.';
  }
  if (clean.includes('venus')) {
    return 'Rules creative refinement, relationships, and balance. Invites you to bring neatness, sweet speech, and artistic harmony to your life.';
  }
  if (clean.includes('saturn')) {
    return 'Governs time, karmic boundary limits, and focused labor. Asks for absolute consistency, slow building, and facing details without fear.';
  }
  if (clean.includes('rahu')) {
    return 'Represents overstimulation, worldly desires, and sensory ambition. Demands that you practice digital fasts and ground yourself on the physical earth.';
  }
  if (clean.includes('ketu')) {
    return 'Governs introversion, spiritual detachment, and liberation. Guides you to practice Alternate Breathing, let go of outcomes, and meditate.';
  }
  return 'Celestial parameters active. Anchor your agency in the present moment.';
};

export default function PlanetsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);

  const fetchPlanets = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = forceRefresh
        ? await api.getForce('/api/astrology/chart', email ? { email } : undefined)
        : await api.getCached('/api/astrology/chart', email ? { email } : undefined);
      
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load planets chart.');
      }
    } catch (err: any) {
      console.error('Error fetching planets:', err);
      setError('Unable to reach celestial engine. Please make sure your backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlanets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlanets(true);
  };

  const toggleExpand = (planet: string) => {
    setExpandedPlanet((prev) => (prev === planet ? null : planet));
  };

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Synthesizing Planetary Data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchPlanets(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chart = data.chart;
  const lagnaSignNum = chart?.lagna?.sign || 10;

  const displayPlanets = chart?.planets
    ? chart.planets.map((p: any) => {
        const signName = getSignName(p.sign);
        const house = ((p.sign - lagnaSignNum + 12) % 12) + 1;
        const statusList = [];
        if (p.isRetrograde) statusList.push('Retrograde');
        if (p.isCombust) statusList.push('Combust');
        if (p.isVargottama) statusList.push('Vargottama');
        if (p.strengthLevel) statusList.push(p.strengthLevel);

        return {
          name: p.name,
          sign: signName,
          house,
          status: statusList.join(' • ') || 'Neutral',
          degree: `${Math.floor(p.longitude % 30)}°${Math.floor(((p.longitude % 30) * 60) % 60)}'${Math.floor(((p.longitude % 30) * 3600) % 60)}"`,
          nakshatra: p.nakshatra || 'Unknown',
          lessons: getPlanetLessons(p.name),
        };
      })
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />
        }
      >
        <View style={styles.welcomeCard}>
          <Sparkles size={16} color="#D97706" style={{ marginBottom: 4 }} />
          <Text style={styles.welcomeTitle}>Planetary Alignments</Text>
          <Text style={styles.welcomeDesc}>
            Understand the karmic placement of the planets in your natal chart and their influence on your subconscious.
          </Text>
        </View>

        {displayPlanets.map((p: any) => {
          const isExpanded = expandedPlanet === p.name;
          const symbol = getPlanetSymbol(p.name);
          return (
            <View key={p.name} style={[styles.card, isExpanded && styles.expandedCard]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(p.name)}
              >
                <View style={styles.logoRow}>
                  <View style={styles.symbolBox}>
                    <Text style={styles.symbolText}>{symbol}</Text>
                  </View>
                  <View>
                    <Text style={styles.planetName}>{p.name}</Text>
                    <Text style={styles.planetSub}>
                      {p.sign} • House {p.house}
                    </Text>
                  </View>
                </View>
                {isExpanded ? <ChevronUp size={16} color="#C4B5A5" /> : <ChevronDown size={16} color="#C4B5A5" />}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.detailsBox}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Zodiac Sign</Text>
                      <Text style={styles.metaVal}>{p.sign}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Coordinate Degree</Text>
                      <Text style={styles.metaVal}>{p.degree}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Placed Nakshatra</Text>
                      <Text style={styles.metaVal}>{p.nakshatra}</Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Strength Status</Text>
                      <Text style={styles.metaVal}>{p.status}</Text>
                    </View>
                  </View>

                  <View style={styles.lessonsContainer}>
                    <Info size={14} color="#D97706" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonsLabel}>Karmic Directives & Lessons:</Text>
                      <Text style={styles.lessonsText}>{p.lessons}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
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
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3F2D1D',
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 11,
    color: '#78350F',
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 16,
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
    shadowRadius: 4,
    elevation: 0.5,
  },
  expandedCard: {
    borderColor: '#D97706',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  symbolBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8F5EF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 18,
    color: '#D97706',
  },
  planetName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  planetSub: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.6,
  },
  detailsBox: {
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#F8F5EF',
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    width: '48%',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  lessonsContainer: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 16,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.two,
  },
  lessonsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3F2D1D',
    marginBottom: 2,
  },
  lessonsText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
});
