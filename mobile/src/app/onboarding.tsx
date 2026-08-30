import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Clock, MapPin, Search, Check, Info } from 'lucide-react-native';
import { api } from '@/services/api';
import { cities } from '@/constants/cities';
import { Spacing } from '@/constants/theme';

interface City {
  name: string;
  state: string;
  lat: number;
  lng: number;
  timezone: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [tob, setTob] = useState(''); // HH:MM
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle city search filtering
  useEffect(() => {
    if (citySearch.length > 1) {
      const filtered = cities
        .filter(
          (c) =>
            c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
            c.state.toLowerCase().includes(citySearch.toLowerCase())
        )
        .slice(0, 10);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [citySearch]);

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setCitySearch(`${city.name}, ${city.state}`);
    setShowCityModal(false);
  };

  const validateInputs = () => {
    if (!name.trim()) return 'Please enter your name.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return 'Enter birth date in YYYY-MM-DD format.';
    if (!/^\d{2}:\d{2}$/.test(tob)) return 'Enter birth time in HH:MM (24-hour) format.';
    
    // Check if valid dates
    const [year, month, day] = dob.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return 'Invalid date values.';
    
    const [hours, minutes] = tob.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 'Invalid time values (use 24h format).';

    if (!selectedCity) return 'Please select your birth city.';
    return '';
  };

  const onSubmit = async () => {
    const err = validateInputs();
    if (err) {
      setError(err);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      if (!email) {
        setError('Session expired. Please log in again.');
        router.replace('/login');
        return;
      }

      const response = await api.post('/api/user', {
        email,
        name: name.trim(),
        date: dob,
        time: tob,
        latitude: selectedCity?.lat,
        longitude: selectedCity?.lng,
        timezone: selectedCity?.timezone,
      });

      if (response.success) {
        // Verification succeeded, send to dashboard
        router.replace('/(tabs)/dashboard');
      } else {
        setError(response.error || 'Calibration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please try again.');
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
        {/* Orbs */}
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />

        <View style={styles.header}>
          <View style={styles.tag}>
            <View style={styles.tagIndicator} />
            <Text style={styles.tagText}>SECURE INITIALIZATION PROTOCOL</Text>
          </View>
          <Text style={styles.title}>DivyaDrishti</Text>
          <Text style={styles.subtitle}>QUANTITATIVE LIFE OPERATING SYSTEM</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Step 01: Establish Identity</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#C4B5A5"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepTitle}>Step 02: Birth Date & Time</Text>
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Calendar size={16} color="#B45309" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C4B5A5"
                  value={dob}
                  onChangeText={setDob}
                  maxLength={10}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Clock size={16} color="#B45309" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM (24h)"
                  placeholderTextColor="#C4B5A5"
                  value={tob}
                  onChangeText={setTob}
                  maxLength={5}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepTitle}>Step 03: Location Intent</Text>
            <TouchableOpacity
              onPress={() => setShowCityModal(true)}
              style={styles.citySelector}
            >
              <MapPin size={16} color="#B45309" style={styles.inputIcon} />
              <Text style={[styles.citySelectorText, !selectedCity && styles.cityPlaceholder]}>
                {selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : 'Select birth city...'}
              </Text>
              <Search size={16} color="#C4B5A5" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {selectedCity && (
              <View style={styles.locationLocked}>
                <View style={styles.lockedDot} />
                <Text style={styles.lockedText}>
                  GEOLOCATION LOCKED: {selectedCity.lat.toFixed(4)}°N / {selectedCity.lng.toFixed(4)}°E
                </Text>
              </View>
            )}
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.disabledButton]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Initialize System</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* City Selection Modal */}
        <Modal
          visible={showCityModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Search Birth City</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCityModal(false);
                    setCitySearch('');
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchContainer}>
                <Search size={18} color="#B45309" style={styles.modalSearchIcon} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Type city name (e.g. Pune, Delhi)..."
                  placeholderTextColor="#C4B5A5"
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoFocus={true}
                  autoCapitalize="words"
                />
              </View>

              {filteredCities.length > 0 ? (
                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => `${item.name}-${item.state}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => selectCity(item)}
                      style={styles.cityListItem}
                    >
                      <MapPin size={16} color="#B45309" style={styles.listIcon} />
                      <View>
                        <Text style={styles.cityName}>{item.name}</Text>
                        <Text style={styles.cityState}>{item.state}</Text>
                      </View>
                      {selectedCity?.name === item.name && (
                        <Check size={18} color="#D97706" style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                />
              ) : (
                <View style={styles.emptySearch}>
                  <Info size={24} color="#C4B5A5" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyText}>
                    {citySearch.length > 1
                      ? 'No matching cities found in India database'
                      : 'Type at least 2 characters to search'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Security Protocol Tier IV</Text>
        </View>
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
    top: 0,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.08)', // purple-600/8
    zIndex: -1,
  },
  blurCircle2: {
    position: 'absolute',
    bottom: 0,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(217, 119, 6, 0.08)', // amber-600/8
    zIndex: -1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 232, 217, 0.6)',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    marginBottom: Spacing.three,
  },
  tagIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78350F',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#451A03',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
    letterSpacing: 3,
    marginTop: Spacing.one,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    shadowColor: '#451A03',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  step: {
    marginBottom: Spacing.four,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
    opacity: 0.7,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 239, 230, 0.3)',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#451A03',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 239, 230, 0.3)',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  citySelectorText: {
    fontSize: 14,
    color: '#451A03',
  },
  cityPlaceholder: {
    color: '#C4B5A5',
  },
  locationLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: Spacing.three,
  },
  lockedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: Spacing.two,
  },
  lockedText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#D97706',
  },
  errorContainer: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#D97706',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: Spacing.one,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.five,
    opacity: 0.4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#451A03',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    color: '#D97706',
    fontWeight: '600',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
    marginBottom: Spacing.four,
  },
  modalSearchIcon: {
    marginRight: Spacing.two,
  },
  modalSearchInput: {
    flex: 1,
    height: '100%',
    color: '#451A03',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  cityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  listIcon: {
    marginRight: Spacing.three,
    opacity: 0.6,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#451A03',
  },
  cityState: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.5,
    marginTop: 2,
  },
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
  },
  emptyText: {
    color: '#C4B5A5',
    fontSize: 14,
    textAlign: 'center',
  },
});
