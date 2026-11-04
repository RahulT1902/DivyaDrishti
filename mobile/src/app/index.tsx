import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const loggedIn = await AsyncStorage.getItem('divya:loggedIn');
        const email = await AsyncStorage.getItem('divya:userEmail');
        const token = await AsyncStorage.getItem('divya:token');

        if (loggedIn === 'true' && email && token) {
          const userRes = await api.get('/api/user', { email });
          if (userRes?.success && userRes?.user?.birthDetails) {
            router.replace('/(tabs)/dashboard');
            return;
          }
          router.replace('/onboarding');
          return;
        }

        router.replace('/login');
      } catch (err) {
        console.error('Error during initial auth check:', err);
        router.replace('/login');
      }
    }

    checkAuth();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D97706" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F5EF',
  },
});
