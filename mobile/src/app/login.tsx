import React, { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Eye, EyeOff, Lock, Mail, User, Settings, Check, X } from 'lucide-react-native';
import { api, getApiUrl, setApiUrl } from '@/services/api';
import { Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

type AuthMode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrlState] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    getApiUrl().then(url => setApiUrlState(url));
  }, []);

  const handleSaveSettings = async () => {
    try {
      await setApiUrl(apiUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSettings(false);
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };


  const resolvePostAuthRoute = async (userEmail: string) => {
    try {
      const data = await api.get('/api/user', { email: userEmail });
      if (data?.success && data?.user?.birthDetails) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: any) {
      console.error('Error checking user profile:', err);
      // If server error, fallback to onboarding to be safe
      router.replace('/onboarding');
    }
  };

  const onSubmit = async () => {
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password || (mode === 'signup' && !name.trim())) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const signupRes = await api.post('/api/auth/signup', {
          name: name.trim(),
          email: cleanEmail,
          password,
        });
        if (!signupRes.success) {
          setError(signupRes.error || 'Could not create account.');
          setLoading(false);
          return;
        }
      }

      const loginRes = await api.post('/api/auth/login', {
        email: cleanEmail,
        password,
      });

      if (!loginRes.success) {
        setError(loginRes.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Store auth state — JWT token takes precedence for subsequent API calls
      await AsyncStorage.setItem('divya:loggedIn', 'true');
      await AsyncStorage.setItem('divya:userEmail', cleanEmail);
      if (loginRes.token) {
        await AsyncStorage.setItem('divya:token', loginRes.token);
      }

      await resolvePostAuthRoute(cleanEmail);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your connection.');
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
        {/* Ambient background blur circles */}
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ॐ</Text>
          </View>
          <Text style={styles.title}>DivyaDrishti</Text>
          <Text style={styles.subtitle}>Your personal Vedic astrology guide</Text>
        </View>

        <View style={styles.card}>
          {showSettings ? (
            <View style={styles.settingsForm}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>Server Configuration</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <X size={20} color="#78350F" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Backend API URL</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={apiUrl}
                    onChangeText={setApiUrlState}
                    placeholder="http://192.168.1.8:3001"
                    placeholderTextColor="#C4B5A5"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSaveSettings}
                style={styles.settingsSaveButton}
              >
                {saveSuccess ? (
                  <View style={styles.successRow}>
                    <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.settingsSaveButtonText}>Saved!</Text>
                  </View>
                ) : (
                  <Text style={styles.settingsSaveButtonText}>Save & Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Mode Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  onPress={() => { setMode('signin'); setError(''); }}
                  style={[styles.tabButton, mode === 'signin' && styles.activeTabButton]}
                >
                  <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setMode('signup'); setError(''); }}
                  style={[styles.tabButton, mode === 'signup' && styles.activeTabButton]}
                >
                  <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {mode === 'signup' && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputContainer}>
                      <User size={18} color="#B45309" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Rahul Sharma"
                        placeholderTextColor="#C4B5A5"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="name"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={18} color="#B45309" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#C4B5A5"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={18} color="#B45309" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="At least 6 characters"
                      placeholderTextColor="#C4B5A5"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPwd}
                      autoCapitalize="none"
                      autoComplete={mode === 'signup' ? 'new-password' : 'password'}
                    />
                    <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeButton}>
                      {showPwd ? (
                        <EyeOff size={18} color="#C4B5A5" />
                      ) : (
                        <Eye size={18} color="#C4B5A5" />
                      )}
                    </TouchableOpacity>
                  </View>
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
                    <Text style={styles.submitButtonText}>
                      {mode === 'signup' ? 'Create Account & Begin' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={styles.settingsTrigger}
        >
          <Settings size={14} color="#B45309" style={{ marginRight: 6 }} />
          <Text style={styles.settingsTriggerText}>API Server Settings</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>Vedic wisdom, modern intelligence.</Text>
        <Text style={[styles.footerText, { fontSize: 10, marginTop: 4 }]}>
          By signing up you agree to our Terms of Service and Privacy Policy
        </Text>
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
    position: 'relative',
  },
  blurCircle1: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(251, 191, 36, 0.15)', // amber-200/15
    zIndex: -1,
  },
  blurCircle2: {
    position: 'absolute',
    bottom: 50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(249, 115, 22, 0.12)', // orange-200/12
    zIndex: -1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
    marginTop: Spacing.three,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#D97706', // amber-600
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#451A03', // amber-950
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#78350F', // amber-900
    opacity: 0.6,
    marginTop: Spacing.one,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 12,
    padding: 3,
    marginBottom: Spacing.four,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78350F',
    opacity: 0.6,
  },
  activeTabText: {
    color: '#451A03',
    fontWeight: '600',
    opacity: 1,
  },
  form: {
    gap: Spacing.three,
  },
  inputWrapper: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
    opacity: 0.7,
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
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#451A03',
    fontSize: 14,
  },
  eyeButton: {
    padding: 6,
  },
  errorContainer: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#D97706',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: Spacing.two,
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
    fontSize: 12,
    color: '#78350F',
    opacity: 0.4,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  settingsForm: {
    gap: Spacing.three,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8D9',
    paddingBottom: Spacing.two,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#451A03',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  settingsSaveButton: {
    backgroundColor: '#D97706',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    marginTop: Spacing.one,
  },
  settingsSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsTrigger: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: Spacing.two,
  },
  settingsTriggerText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
