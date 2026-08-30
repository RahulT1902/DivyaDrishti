import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Compass,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  ShieldAlert,
  Lock,
  Unlock,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { format } from 'date-fns';

type EnergyLevel = 'HIGH' | 'NEUTRAL' | 'LOW';
type StressLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export default function DailyRitualScreen() {
  const [userName, setUserName] = useState('Seeker');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core Data
  const [briefing, setBriefing] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);

  // Time Aware Ambiance: 'morning' | 'evening'
  const [themeMode, setThemeMode] = useState<'morning' | 'evening'>('morning');

  // Reflection Form State
  const [reflectionId, setReflectionId] = useState<string | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel>('NEUTRAL');
  const [stress, setStress] = useState<StressLevel>('LOW');
  const [notes, setNotes] = useState('');
  const [reflectionCreatedTime, setReflectionCreatedTime] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // UI Status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Default day-part calculation (morning: < 4 PM, evening: >= 4 PM)
  useEffect(() => {
    const hours = new Date().getHours();
    setThemeMode(hours >= 16 ? 'evening' : 'morning');
  }, []);

  const fetchData = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) {
        setError('User session not found.');
        setLoading(false);
        return;
      }

      // Fetch user profile name (cache-first)
      try {
        const profile = forceRefresh
          ? await api.getForce('/api/user', { email })
          : await api.getCached('/api/user', { email });
        if (profile?.success && profile?.user) {
          setUserName(profile.user.name);
        }
      } catch (e) {
        console.error('Failed to load profile name:', e);
      }

      // Fetch daily briefing and panchang concurrently (cache-first)
      const fetchBriefing = forceRefresh
        ? api.getForce('/api/guidance/daily', { email })
        : api.getCached('/api/guidance/daily', { email });
      const fetchPanchang = forceRefresh
        ? api.getForce('/api/panchang/today', { email })
        : api.getCached('/api/panchang/today', { email });

      const [briefingRes, panchangRes, reflectionRes] = await Promise.all([
        fetchBriefing,
        fetchPanchang,
        api.get('/api/reflections', { email }).catch(() => null),
      ]);

      if (briefingRes.success) {
        setBriefing(briefingRes.briefing);
      } else {
        throw new Error(briefingRes.error || 'Failed to load daily brief');
      }

      if (panchangRes.success) {
        setPanchang(panchangRes.panchang);
      } else {
        throw new Error(panchangRes.error || 'Failed to load panchang');
      }

      if (reflectionRes?.success && reflectionRes?.reflection) {
        const ref = reflectionRes.reflection;
        setReflectionId(ref.id);
        setEnergy(ref.energy);
        setStress(ref.stress);
        setNotes(ref.notes || '');
        setReflectionCreatedTime(new Date(ref.createdAt).getTime());
      } else {
        setReflectionId(null);
        setReflectionCreatedTime(null);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching ritual data:', err);
      setError(err.message || 'Error loading sacred timeline details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update countdown timer for edit window (1 hour from creation)
  useEffect(() => {
    if (!reflectionCreatedTime) {
      setTimeLeftStr('');
      return;
    }

    const interval = setInterval(() => {
      const oneHour = 60 * 60 * 1000;
      const msLeft = reflectionCreatedTime + oneHour - Date.now();

      if (msLeft <= 0) {
        setTimeLeftStr('');
        clearInterval(interval);
      } else {
        const minsLeft = Math.floor(msLeft / 60000);
        const secsLeft = Math.floor((msLeft % 60000) / 1000);
        setTimeLeftStr(`${minsLeft}m ${secsLeft}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reflectionCreatedTime]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true); // force network, bypass cache
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'morning' ? 'evening' : 'morning'));
  };

  const handleSaveReflection = async () => {
    setSubmitError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) throw new Error('Session expired');

      const res = await api.post('/api/reflections', {
        email,
        energy,
        stress,
        notes: notes.trim(),
        source: 'MANUAL',
      });

      if (res.success) {
        setReflectionId(res.reflection.id);
        setReflectionCreatedTime(new Date(res.reflection.createdAt).getTime());
        setSuccessMsg(res.updated ? 'Reflection updated successfully' : 'Reflection saved successfully');
        
        setTimeout(() => {
          setSuccessMsg(null);
        }, 4000);
      } else {
        throw new Error(res.error || 'Failed to save reflection');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save reflection');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditable = () => {
    if (!reflectionCreatedTime) return true; // not logged yet
    const oneHour = 60 * 60 * 1000;
    return Date.now() - reflectionCreatedTime < oneHour;
  };

  if (loading && !briefing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Opening Sacred Timeline...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={40} color="#E11D48" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchData(); }}>
          <Text style={styles.retryButtonText}>Re-align Space</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMorning = themeMode === 'morning';
  const editable = isEditable();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />
        }
      >
        {/* Ambient Glows */}
        <View style={[styles.ambientGlow, isMorning ? styles.morningGlow : styles.eveningGlow]} />

        {/* Dynamic Header Greeting */}
        <View style={styles.greetingHeader}>
          <View>
            <Text style={styles.greeting}>
              {isMorning ? 'Blessed Morning,' : 'Peaceful Evening,'}{' '}
              <Text style={styles.userName}>{userName}</Text>
            </Text>
            <View style={styles.dateRow}>
              <Compass size={14} color="#B45309" />
              <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleToggleTheme}
            style={[styles.themeToggle, isMorning ? styles.morningToggle : styles.eveningToggle]}
          >
            {isMorning ? (
              <>
                <Sun size={14} color="#D97706" />
                <Text style={styles.themeToggleText}>Sunrise Warmth</Text>
              </>
            ) : (
              <>
                <Moon size={14} color="#6366F1" />
                <Text style={[styles.themeToggleText, { color: '#4F46E5' }]}>Moonlit Deep</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 1. Daily Guidance Card */}
        {briefing && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Sparkles size={16} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.cardLabel}>Daily Guidance Brief</Text>
            </View>
            <Text style={styles.headlineText}>{briefing.headline}</Text>
            <View style={styles.guidanceRow}>
              <View style={styles.guidanceBlock}>
                <Text style={styles.guidanceTitle}>Priorities</Text>
                {briefing.priorities?.map((item: string, i: number) => (
                  <Text key={i} style={styles.guidanceItem}>• {item}</Text>
                ))}
              </View>
              <View style={styles.guidanceBlock}>
                <Text style={[styles.guidanceTitle, { color: '#9F1239' }]}>Restraints</Text>
                {briefing.avoid?.map((item: string, i: number) => (
                  <Text key={i} style={[styles.guidanceItem, { color: '#4C0519' }]}>• {item}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 2. Panchang Almanac */}
        {panchang && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar size={16} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.cardLabel}>Panchang Almanac</Text>
            </View>

            <View style={styles.panchangLimbs}>
              <View style={styles.panchangLimb}>
                <Text style={styles.limbName}>Tithi</Text>
                <Text style={styles.limbValue}>{panchang.paksha} {panchang.tithi}</Text>
              </View>
              <View style={styles.panchangLimb}>
                <Text style={styles.limbName}>Nakshatra</Text>
                <Text style={styles.limbValue}>{panchang.nakshatra}</Text>
              </View>
              <View style={styles.panchangLimb}>
                <Text style={styles.limbName}>Yoga</Text>
                <Text style={styles.limbValue}>{panchang.yoga}</Text>
              </View>
              <View style={styles.panchangLimb}>
                <Text style={styles.limbName}>Karana</Text>
                <Text style={styles.limbValue}>{panchang.karana}</Text>
              </View>
              <View style={styles.panchangLimb}>
                <Text style={styles.limbName}>Vara</Text>
                <Text style={styles.limbValue}>{panchang.vara}</Text>
              </View>
            </View>

            {/* Auspicious / Caution Slots */}
            <View style={styles.slotsRow}>
              <View style={styles.abhijitBox}>
                <Sparkles size={14} color="#D97706" style={{ marginRight: 6 }} />
                <View>
                  <Text style={styles.slotHeader}>Abhijit Kaal</Text>
                  <Text style={styles.slotTime}>
                    {panchang.abhijitKaal?.start || '11:45'} – {panchang.abhijitKaal?.end || '12:35'}
                  </Text>
                </View>
              </View>
              <View style={styles.rahuBox}>
                <ShieldAlert size={14} color="#E11D48" style={{ marginRight: 6 }} />
                <View>
                  <Text style={styles.slotHeaderRahu}>Rahu Kaal</Text>
                  <Text style={styles.slotTime}>
                    {panchang.rahuKaal?.start || '15:00'} – {panchang.rahuKaal?.end || '16:30'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 3. Evening Reflection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Compass size={16} color="#B45309" style={{ marginRight: 6 }} />
            <Text style={styles.cardLabel}>Evening Reflection</Text>
            {reflectionId ? (
              editable ? (
                <View style={styles.editableBadge}>
                  <Unlock size={10} color="#065F46" style={{ marginRight: 4 }} />
                  <Text style={styles.badgeText}>Editable ({timeLeftStr || 'closing'})</Text>
                </View>
              ) : (
                <View style={[styles.editableBadge, styles.lockedBadge]}>
                  <Lock size={10} color="#374151" style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: '#374151' }]}>Locked</Text>
                </View>
              )
            ) : (
              <View style={[styles.editableBadge, styles.awaitingBadge]}>
                <Text style={[styles.badgeText, { color: '#9E7A5A' }]}>Awaiting</Text>
              </View>
            )}
          </View>

          {/* Energy Form */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Current Energy Level</Text>
            <View style={styles.optionRow}>
              {(['HIGH', 'NEUTRAL', 'LOW'] as EnergyLevel[]).map((level) => {
                const active = energy === level;
                return (
                  <TouchableOpacity
                    key={level}
                    disabled={!editable}
                    onPress={() => setEnergy(level)}
                    style={[styles.optionButton, active && styles.activeOptionButton]}
                  >
                    <Text style={[styles.optionText, active && styles.activeOptionText]}>{level}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Stress Form */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Current Stress Level</Text>
            <View style={styles.optionRow}>
              {(['LOW', 'MEDIUM', 'HIGH'] as StressLevel[]).map((level) => {
                const active = stress === level;
                return (
                  <TouchableOpacity
                    key={level}
                    disabled={!editable}
                    onPress={() => setStress(level)}
                    style={[styles.optionButton, active && styles.activeOptionButton]}
                  >
                    <Text style={[styles.optionText, active && styles.activeOptionText]}>{level}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.one }}>
              <Text style={styles.formLabel}>Alignment Notes</Text>
              <Text style={styles.charCounter}>{notes.length}/300</Text>
            </View>
            <TextInput
              style={styles.textArea}
              multiline={true}
              numberOfLines={3}
              editable={editable}
              maxLength={300}
              placeholder={
                editable
                  ? "How did your actions align with today's planetary theme? Keep observations brief, focused, and honest..."
                  : "No observations captured."
              }
              placeholderTextColor="#C4B5A5"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {submitError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={14} color="#E11D48" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          )}

          {successMsg && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={14} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          )}

          {editable && (
            <TouchableOpacity
              onPress={handleSaveReflection}
              disabled={submitting}
              style={styles.saveButton}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Save Reflection</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Daily Ritual Space</Text>
          <Text style={styles.footerVersion}>DIVYADRISHTI v2.0</Text>
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
    position: 'relative',
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
  ambientGlow: {
    position: 'absolute',
    top: -20,
    left: '10%',
    right: '10%',
    height: 400,
    borderRadius: 200,
    zIndex: -1,
    opacity: 0.2,
  },
  morningGlow: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)', // amber-500/20
  },
  eveningGlow: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)', // indigo-500/15
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8D9',
    paddingBottom: Spacing.four,
    marginBottom: Spacing.one,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '300',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  userName: {
    fontWeight: '700',
    color: '#B45309',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
    opacity: 0.6,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  morningToggle: {
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  eveningToggle: {
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  themeToggleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
    paddingBottom: Spacing.two,
    marginBottom: Spacing.three,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F2D1D',
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  guidanceRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  guidanceBlock: {
    flex: 1,
  },
  guidanceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: Spacing.one,
  },
  guidanceItem: {
    fontSize: 12,
    color: '#3F2D1D',
    lineHeight: 18,
    marginBottom: 4,
  },
  panchangLimbs: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  panchangLimb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243, 239, 230, 0.5)',
    paddingVertical: 6,
  },
  limbName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A18265',
    textTransform: 'uppercase',
  },
  limbValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  abhijitBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 16,
    padding: 10,
  },
  rahuBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 16,
    padding: 10,
  },
  slotHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  slotHeaderRahu: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9F1239',
    textTransform: 'uppercase',
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F2D1D',
    marginTop: 2,
  },
  editableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  lockedBadge: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  awaitingBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
  },
  formGroup: {
    marginBottom: Spacing.three,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A18265',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  charCounter: {
    fontSize: 9,
    color: '#C4B5A5',
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  optionButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOptionButton: {
    backgroundColor: '#3F2D1D',
    borderColor: '#3F2D1D',
  },
  optionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
  },
  activeOptionText: {
    color: '#F8F5EF',
  },
  textArea: {
    backgroundColor: 'rgba(243, 239, 230, 0.3)',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 16,
    padding: Spacing.three,
    color: '#3F2D1D',
    fontSize: 13,
    height: 80,
    textAlignVertical: 'top',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: 10,
    marginBottom: Spacing.three,
  },
  errorBannerText: {
    color: '#E11D48',
    fontSize: 12,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    padding: 10,
    marginBottom: Spacing.three,
  },
  successBannerText: {
    color: '#059669',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#3F2D1D',
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: {
    color: '#F8F5EF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.three,
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
});
