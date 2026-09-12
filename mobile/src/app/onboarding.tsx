import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import BirthDetailsPicker, { BirthDetailsData } from '@/components/BirthDetailsPicker';
import { Spacing } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [birthDetails, setBirthDetails] = useState<BirthDetailsData>({
    date: '1995-08-15',
    time: '19:30',
    city: 'New Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  });

  const handleSubmit = async () => {
    setError('');
    
    if (!birthDetails.date) {
      setError('Please select your Date of Birth.');
      return;
    }
    if (!birthDetails.time) {
      setError('Please select your Time of Birth.');
      return;
    }
    if (!birthDetails.city) {
      setError('Please select your Birth City.');
      return;
    }

    setLoading(true);
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const token = await AsyncStorage.getItem('divya:token');

      // Call API to save birth details
      const response = await api.post('/api/user', {
        email,
        name: 'User',
        date: birthDetails.date,
        time: birthDetails.time,
        latitude: birthDetails.latitude,
        longitude: birthDetails.longitude,
        timezone: birthDetails.timezone,
      });

      if (response?.success) {
        await AsyncStorage.setItem('divya:loggedIn', 'true');
        router.replace('/(tabs)/dashboard');
      } else {
        setError(response?.error || 'Failed to save birth details.');
      }
    } catch (err: any) {
      console.error('Error saving onboarding details:', err);
      setError(err.message || 'Something went wrong. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Background glow elements */}
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ॐ</Text>
          </View>
          <Text style={styles.title}>Birth Details Setup</Text>
          <Text style={styles.subtitle}>
            Calibrate your chart with exact birth date, time, and location
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <BirthDetailsPicker
            value={birthDetails}
            onChange={setBirthDetails}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.disabledButton]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Reveal My Chart & Enter Dashboard</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>DivyaDrishti — Vedic Wisdom, Modern Intelligence</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  blurCircle1: {
    position: 'absolute',
    top: 40,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    zIndex: -1,
  },
  blurCircle2: {
    position: 'absolute',
    bottom: 40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    zIndex: -1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
    elevation: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#451A03',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 13,
    color: '#78350F',
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: Spacing.four,
  },
  errorContainer: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#D97706',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: Spacing.four,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#78350F',
    opacity: 0.4,
    marginTop: Spacing.two,
  },
});
