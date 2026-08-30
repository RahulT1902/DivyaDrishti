import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, ThemeProvider, DefaultTheme } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { api } from '@/services/api';
import { LanguageProvider } from '@/context/LanguageContext';

// Premium custom theme based on the Spiritual Product Principles
const DivyaTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F5EF', // Warm parchment background
    primary: '#D97706',    // Warm amber-600
    card: '#FFFFFF',
    text: '#3F2D1D',       // Deep wood text
    border: '#EFE8D9',
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Check auth and onboarding status
  const checkAuth = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem('divya:loggedIn');
      const email = await AsyncStorage.getItem('divya:userEmail');

      if (loggedIn === 'true' && email) {
        setIsAuthenticated(true);
        // Check profile for birthDetails
        const data = await api.get('/api/user', { email });
        if (data?.success && data?.user?.birthDetails) {
          setHasOnboarded(true);
        } else {
          setHasOnboarded(false);
        }
      } else {
        setIsAuthenticated(false);
        setHasOnboarded(false);
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
      setIsAuthenticated(false);
      setHasOnboarded(false);
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [segments]);

  // Monitor auth status and routes for redirection
  useEffect(() => {
    if (!authChecked || !fontsLoaded) return;

    const inAuthGroup = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated) {
      // Direct to login if not authenticated and not already there
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else if (!hasOnboarded) {
      // Direct to onboarding if authenticated but no birthDetails
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    } else {
      // Direct to dashboard if fully authenticated and onboarded
      if (inAuthGroup || inOnboarding || !segments[0] || segments[0] === 'index') {
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [authChecked, isAuthenticated, hasOnboarded, segments, fontsLoaded]);

  if (!authChecked || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F5EF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <LanguageProvider>
    <ThemeProvider value={DivyaTheme}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#F8F5EF',
          },
          headerTintColor: '#D97706',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '700',
            color: '#451A03',
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
          },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="kundali" options={{ title: 'Aapki Kundali' }} />
        <Stack.Screen name="predictions" options={{ title: 'Cosmic Predictions' }} />
        <Stack.Screen name="planets" options={{ title: 'Planetary Analysis' }} />
        <Stack.Screen name="remedies" options={{ title: 'Sacred Remedies' }} />
        <Stack.Screen name="weekly-rhythm" options={{ title: 'Weekly Rhythm' }} />
        <Stack.Screen name="chat" options={{ title: 'Consult Pandit' }} />
        <Stack.Screen name="dasha" options={{ title: 'Dasha Timeline' }} />
      </Stack>
    </ThemeProvider>
    </LanguageProvider>
  );
}
