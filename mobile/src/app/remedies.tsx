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
import { useRouter } from 'expo-router';
import { Heart, HelpCircle, AlertTriangle } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';

interface Remedy {
  category: string;
  icon: string;
  title: string;
  description: string;
  detail: string;
  color: string;
}

const getRemediesForPlanet = (planet: string, isMahadasha: boolean): Remedy => {
  const cleanPlanet = planet.trim().toLowerCase();
  const activeLabel = isMahadasha ? 'Active Mahadasha Ritual' : 'Antardasha Alignment';

  if (cleanPlanet === 'saturn') {
    return {
      category: activeLabel,
      icon: '🪔',
      title: 'Saturday Oil Diya & Silent Service',
      description: 'Saturn teaches focus and patience through selfless service. Light a sesame or mustard oil lamp on Saturday evenings, ideally in a quiet corner facing west.',
      detail: 'Channel Saturn\'s energy by feeding street animals, observing a quiet fast, or committing to focused work. Practice silent patience rather than reactiveness.',
      color: '#EFF6FF',
    };
  }
  if (cleanPlanet === 'jupiter') {
    return {
      category: activeLabel,
      icon: '📚',
      title: 'Thursday Wisdom & Gratitude Journaling',
      description: 'Jupiter governs wisdom and spiritual expansion. Dedicate Thursday mornings to writing in a gratitude journal, reading inspirational literature, or reflecting on guidance.',
      detail: 'Incorporate yellow or warm golden tones in your space. Support educational charities, show deep respect to your mentors, and cultivate a sense of inner abundance.',
      color: '#FFFBEB',
    };
  }
  if (cleanPlanet === 'mars') {
    return {
      category: activeLabel,
      icon: '🚩',
      title: 'Tuesday Active Movement & Quiet Courage',
      description: 'Mars rules strength, energy, and direct action. Channel physical intensity into deep yoga (Surya Namaskar) or highly focused manual tasks on Tuesdays.',
      detail: 'Spend 5-10 minutes in absolute silence before making big decisions. Dedicating your efforts to selfless actions cools impulse and builds mature willpower.',
      color: '#FEE2E2',
    };
  }
  if (cleanPlanet === 'venus') {
    return {
      category: activeLabel,
      icon: '🤍',
      title: 'Friday Art, Harmony & Benevolence',
      description: 'Venus governs relationships, beauty, and creative refinement. Dedicate Fridays to bringing neatness, clean aesthetics, and gentle harmony to your immediate space.',
      detail: 'Bring absolute sweetness to your words and interactions. Consider donating simple food or supporting shelters to manifest Venus\'s highest energy of pure content.',
      color: '#FFF5F7',
    };
  }
  if (cleanPlanet === 'mercury') {
    return {
      category: activeLabel,
      icon: '🌱',
      title: 'Wednesday Digital Silence & Cognitive Cleansing',
      description: 'Mercury governs speech, the nervous system, and intellectual clarity. Spend Wednesdays taking a conscious digital break—muting non-urgent notification loops.',
      detail: 'Support children\'s learning, feed green fodder to birds or animals, and organize your thoughts by writing out structured goals for the week ahead.',
      color: '#ECFDF5',
    };
  }
  if (cleanPlanet === 'sun') {
    return {
      category: activeLabel,
      icon: '☀️',
      title: 'Daily Sunrise Warmth & Water Offering',
      description: 'The Sun represents core vitality and inner authority. Begin your mornings by stepping into the early morning sunlight, absorbing solar alignment directly.',
      detail: 'Pour water slowly from a copper vessel to a green plant at sunrise. Re-center your spine, take three deep belly breaths, and affirm your quiet self-leadership.',
      color: '#FFF7ED',
    };
  }
  if (cleanPlanet === 'moon') {
    return {
      category: activeLabel,
      icon: '🌊',
      title: 'Monday Hydration & Emotional Calming',
      description: 'The Moon rules emotional rhythms, intuitive sensing, and peace of mind. Cultivate steady hydration and deep, alternate-nostril breathing (Pranayama) on Mondays.',
      detail: 'Pour water slowly over a Shiva Lingam or simple river stone as a mental cooling practice. Wind down early in the evening to protect your sleep cycle.',
      color: '#EFF6FF',
    };
  }
  if (cleanPlanet === 'rahu') {
    return {
      category: activeLabel,
      icon: '🐕',
      title: 'Grounding Earth Walk & Digital Fasting',
      description: 'Rahu represents overstimulation, illusions, and mental chatter. Counteract sensory overload by walking barefoot on soil or grass to reconnect with the earth.',
      detail: 'Limit complex news and social media consumption. Spend time feeding street dogs or wild birds to stay firmly grounded in biological reality rather than screens.',
      color: '#F5F3FF',
    };
  }
  // Ketu / Fallback
  return {
    category: activeLabel,
    icon: '🧘',
    title: 'Pranayama Breathing & Non-Attachment Practice',
    description: 'Ketu represents introverted contemplation and spiritual release. Practice 10 minutes of slow alternate-nostril breathing (Anulom Vilom) to calm energetic flow.',
    detail: 'Donate warm, multi-colored blankets to a local shelter. Practice letting go of rigid expectations, directing your focus to quiet, interior wisdom.',
    color: '#F5F3FF',
  };
};

export default function RemediesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRemedies = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = forceRefresh
        ? await api.getForce('/api/astrology/chart', email ? { email } : undefined)
        : await api.getCached('/api/astrology/chart', email ? { email } : undefined);
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load remedies.');
      }
    } catch (err: any) {
      console.error('Error fetching remedies:', err);
      setError('Unable to reach celestial engine. Please make sure your backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRemedies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRemedies(true);
  };

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Synthesizing Sadhana Remedies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchRemedies(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const md = data?.temporal?.stack?.mahadasha || 'Saturn';
  const ad = data?.temporal?.stack?.antardasha || 'Jupiter';

  const mdRemedy = getRemediesForPlanet(md, true);
  const adRemedy = getRemediesForPlanet(ad, false);

  const remediesList: Remedy[] = [
    mdRemedy,
    adRemedy,
    {
      category: 'Daily Grounding',
      icon: '☀️',
      title: 'Solar Sunrise Re-alignment',
      description: 'Spend 5 minutes soaking in early morning sunlight. Breathe deeply and align your physical posture with the natural daybreak cycle.',
      detail: 'This simple daily alignment strengthens the Sun\'s core vitality, establishing a powerful energetic shield against ambient frictions.',
      color: '#FFF7ED',
    },
    {
      category: 'Mental Clarity',
      icon: '🌱',
      title: 'Wednesday Written Brain-Dump',
      description: 'Every Wednesday morning, clear your cognitive workspace by performing a complete braindump of all active thoughts, to-dos, and worries onto paper.',
      detail: 'Mercury flourishes when information is externalized and structured. Excellent for relieving anxiety and organizing your week.',
      color: '#ECFDF5',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />
        }
      >
        {/* Intro Card */}
        <View style={styles.introCard}>
          <HelpCircle size={22} color="#D97706" style={{ marginBottom: 4 }} />
          <Text style={styles.introTitle}>About Vedic Alignment</Text>
          <Text style={styles.introDesc}>
            In classical Vedic Jyotish, remedies are not superstitious cures. They are somatic, behavioral pivots designed to stabilize the nervous system and build conscious discipline. We focus on simple, grounding habits that anchor your agency.
          </Text>
        </View>

        {/* Remedies List */}
        <Text style={styles.sectionTitle}>Sadhana & Remedies</Text>
        {remediesList.map((remedy, i) => (
          <View
            key={i}
            style={[styles.remedyCard, { backgroundColor: remedy.color }]}
          >
            <View style={styles.remedyHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{remedy.category}</Text>
              </View>
              <Text style={styles.remedyIcon}>{remedy.icon}</Text>
            </View>

            <Text style={styles.remedyTitle}>{remedy.title}</Text>
            <Text style={styles.remedyDesc}>{remedy.description}</Text>

            <View style={styles.detailBox}>
              <Text style={styles.detailText}>"{remedy.detail}"</Text>
            </View>
          </View>
        ))}

        {/* CTA to Chat */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaIcon}>📿</Text>
          <Text style={styles.ctaTitle}>Seek Personalised Guidance?</Text>
          <Text style={styles.ctaDesc}>
            If you are experiencing high planetary friction or mental volatility, ask the Pandit for direct somatic guidelines.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.ctaButtonText}>Ask the Pundit →</Text>
          </TouchableOpacity>
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
  introCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F2D1D',
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 11,
    color: '#78350F',
    textAlign: 'center',
    opacity: 0.75,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: Spacing.two,
  },
  remedyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  remedyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78350F',
  },
  remedyIcon: {
    fontSize: 24,
  },
  remedyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  remedyDesc: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 16,
    padding: Spacing.three,
  },
  detailText: {
    fontSize: 11,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  ctaIcon: {
    fontSize: 28,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  ctaDesc: {
    fontSize: 11,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  ctaButton: {
    backgroundColor: '#3F2D1D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ctaButtonText: {
    color: '#F8F5EF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
