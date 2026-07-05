import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, Sparkles, TrendingUp, Orbit, LogOut } from 'lucide-react-native';
import { Platform, TouchableOpacity, Text, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';

function HeaderRight() {
  const { isHindi, toggleLanguage } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      isHindi ? 'लॉग आउट' : 'Log Out',
      isHindi ? 'क्या आप लॉग आउट करना चाहते हैं?' : 'Are you sure you want to log out?',
      [
        { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: isHindi ? 'लॉग आउट' : 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['divya:loggedIn', 'divya:userEmail']);
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
      <TouchableOpacity
        onPress={toggleLanguage}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#D97706',
          backgroundColor: isHindi ? '#D97706' : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: isHindi ? '#FFFFFF' : '#D97706',
            letterSpacing: 0.5,
          }}
        >
          {isHindi ? '🇮🇳 हिंदी' : '🇺🇸 EN'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          padding: 6,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#FCA5A5',
          backgroundColor: '#FFF1F2',
        }}
        accessibilityLabel={isHindi ? 'लॉग आउट' : 'Log Out'}
      >
        <LogOut size={16} color="#E11D48" />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#F8F5EF',
          borderBottomWidth: 1,
          borderBottomColor: '#EFE8D9',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: '#451A03',
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        headerRight: () => <HeaderRight />,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EFE8D9',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#D97706',
        tabBarInactiveTintColor: '#A18265',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'DivyaDrishti',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ritual"
        options={{
          title: 'Daily Ritual',
          headerTitle: 'Daily Restorative Ritual',
          tabBarLabel: 'Ritual',
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          headerTitle: 'Dasha & Life Insights',
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transits"
        options={{
          title: 'Transits',
          headerTitle: 'Planetary Transits',
          tabBarLabel: 'Transits',
          tabBarIcon: ({ color, size }) => (
            <Orbit size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
