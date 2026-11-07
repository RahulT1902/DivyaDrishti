import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function ModuleLayout() {
  const { t } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#F8F5EF' },
        headerShadowVisible: false,
        headerTintColor: '#451A03',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          color: '#451A03',
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
      }}
    >
      <Stack.Screen name="kundli" options={{ title: t('Kundli — Birth Chart', 'कुंडली — जन्म चक्र') }} />
      <Stack.Screen name="planets" options={{ title: t('Planetary Archetypes', 'ग्रह आत्मरूप') }} />
      <Stack.Screen name="transits" options={{ title: t('Transits (Gochar)', 'गोचर विश्लेषण') }} />
      <Stack.Screen name="dasha" options={{ title: t('Dasha Timeline', 'दशा काल') }} />
      <Stack.Screen name="predictions" options={{ title: t('Predictions', 'भविष्यवाणी') }} />
      <Stack.Screen name="remedies" options={{ title: t('Rituals & Remedies', 'साधना एवं उपाय') }} />
      <Stack.Screen name="weekly" options={{ title: t('Weekly Rhythm', 'साप्ताहिक लय') }} />
      <Stack.Screen name="readings" options={{ title: t('Saved Readings', 'सहेजे गए परामर्श') }} />
      <Stack.Screen name="profile" options={{ title: t('Profile & Settings', 'प्रोफ़ाइल एवं सेटिंग्स') }} />
    </Stack>
  );
}
