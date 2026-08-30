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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Polygon, Line, Rect } from 'react-native-svg';
import { Sparkles, Database, Navigation, Star, Info, AlertTriangle } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

type ActiveView = 'lagna' | 'planets' | 'dasha' | 'transit';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const getSignName = (signNum: number) => {
  return ZODIAC_SIGNS[(signNum - 1) % 12] || 'Aries';
};

const getPlanetAbbr = (name: string) => {
  return name.substring(0, 2);
};

const getPlanetSymbol = (abbr: string) => {
  switch (abbr) {
    case 'Su': return '☉';
    case 'Mo': return '☾';
    case 'Ma': return '♂';
    case 'Me': return '☿';
    case 'Ju': return '♃';
    case 'Ve': return '♀';
    case 'Sa': return '♄';
    case 'Ra': return '☊';
    case 'Ke': return '☋';
    case 'La': return '✦';
    default: return '';
  }
};

const getPlanetChartStyle = (abbr: string) => {
  switch (abbr) {
    case 'La':
      return { bg: '#D97706', border: '#B45309', text: '#FFFFFF' };
    case 'Su':
      return { bg: '#FEF3C7', border: '#F59E0B', text: '#78350F' };
    case 'Mo':
      return { bg: '#EFF6FF', border: '#3B82F6', text: '#1E3A8A' };
    case 'Ma':
      return { bg: '#FEE2E2', border: '#EF4444', text: '#7F1D1D' };
    case 'Me':
      return { bg: '#ECFDF5', border: '#10B981', text: '#064E3B' };
    case 'Ju':
      return { bg: '#FFFBEB', border: '#D97706', text: '#78350F' };
    case 'Ve':
      return { bg: '#FFF5F7', border: '#EC4899', text: '#831843' };
    case 'Sa':
      return { bg: '#1E293B', border: '#0F172A', text: '#F8FAFC' };
    case 'Ra':
    case 'Ke':
      return { bg: '#27272A', border: '#09090B', text: '#F4F4F5' };
    default:
      return { bg: '#FFFDFB', border: '#F1E7D0', text: '#3F2D1D' };
  }
};

const LAGNA_LORDS: Record<string, { name: string; symbol: string }> = {
  Aries: { name: 'Mars', symbol: '♂' },
  Taurus: { name: 'Venus', symbol: '♀' },
  Gemini: { name: 'Mercury', symbol: '☿' },
  Cancer: { name: 'Moon', symbol: '☾' },
  Leo: { name: 'Sun', symbol: '☉' },
  Virgo: { name: 'Mercury', symbol: '☿' },
  Libra: { name: 'Venus', symbol: '♀' },
  Scorpio: { name: 'Mars', symbol: '♂' },
  Sagittarius: { name: 'Jupiter', symbol: '♃' },
  Capricorn: { name: 'Saturn', symbol: '♄' },
  Aquarius: { name: 'Saturn', symbol: '♄' },
  Pisces: { name: 'Jupiter', symbol: '♃' }
};

const HOUSE_POLYGONS: Record<number, string> = {
  1: "200,200 100,100 200,0 300,100",
  2: "0,0 0,200 100,100",
  3: "0,400 0,200 100,300",
  4: "200,200 100,100 0,200 100,300",
  5: "0,400 200,400 100,300",
  6: "400,400 200,400 300,300",
  7: "200,200 100,300 200,400 300,300",
  8: "400,400 400,200 300,300",
  9: "400,0 400,200 300,100",
  10: "200,200 300,100 400,200 300,300",
  11: "400,0 200,0 300,100",
  12: "0,0 200,0 100,100",
};

interface HouseSignificance {
  nameEn: string;
  nameHi: string;
  signifiesEn: string;
  signifiesHi: string;
  sanskritEn: string;
  sanskritHi: string;
}

const HOUSE_SIGNIFICANCES: Record<number, HouseSignificance> = {
  1: {
    nameEn: "1st House (Lagna / Ascendant)",
    nameHi: "प्रथम भाव (लग्न)",
    sanskritEn: "Tanur Bhava",
    sanskritHi: "तनु भाव",
    signifiesEn: "Self, personality, physical body, appearance, character, health, and life path.",
    signifiesHi: "स्वयं, व्यक्तित्व, शरीर, रूप-रंग, चरित्र, स्वास्थ्य और जीवन मार्ग।"
  },
  2: {
    nameEn: "2nd House",
    nameHi: "द्वितीय भाव",
    sanskritEn: "Dhana Bhava",
    sanskritHi: "धन भाव",
    signifiesEn: "Wealth, speech, family, values, possessions, food, and early education.",
    signifiesHi: "धन, वाणी, परिवार, मूल्य, संपत्ति, भोजन और प्रारंभिक शिक्षा।"
  },
  3: {
    nameEn: "3rd House",
    nameHi: "तृतीय भाव",
    sanskritEn: "Sahaja Bhava",
    sanskritHi: "सहज भाव",
    signifiesEn: "Courage, efforts, siblings, short travels, communications, and hobbies.",
    signifiesHi: "साहस, प्रयास, भाई-बहन, छोटी यात्राएं, संचार और शौक।"
  },
  4: {
    nameEn: "4th House",
    nameHi: "चतुर्थ भाव",
    sanskritEn: "Bandhu Bhava / Sukh Bhava",
    sanskritHi: "बन्धु भाव / सुख भाव",
    signifiesEn: "Home, mother, emotional peace, assets (land, vehicles), comforts, and happiness.",
    signifiesHi: "घर, माता, मानसिक शांति, संपत्ति (भूमि, वाहन), सुख और आराम।"
  },
  5: {
    nameEn: "5th House",
    nameHi: "पंचम भाव",
    sanskritEn: "Putra Bhava",
    sanskritHi: "पुत्र भाव",
    signifiesEn: "Intellect, creativity, romance, children, past life merits (Purva Punya), and education.",
    signifiesHi: "बुद्धि, रचनात्मकता, रोमांस, संतान, पूर्व जन्म के पुण्य और शिक्षा।"
  },
  6: {
    nameEn: "6th House",
    nameHi: "षष्ठ भाव",
    sanskritEn: "Ari Bhava / Shatru Bhava",
    sanskritHi: "अरि भाव / शत्रु भाव",
    signifiesEn: "Enemies, obstacles, debt, diseases, service, daily routine, and competition.",
    signifiesHi: "शत्रु, बाधाएं, कर्ज, बीमारियां, सेवा, दैनिक दिनचर्या और प्रतिस्पर्धा।"
  },
  7: {
    nameEn: "7th House",
    nameHi: "सप्तम भाव",
    sanskritEn: "Yuvati Bhava",
    sanskritHi: "युवती भाव",
    signifiesEn: "Partnerships, marriage, business relationships, public image, and spouse.",
    signifiesHi: "साहस, साझेदारी, विवाह, व्यावसायिक संबंध, सार्वजनिक छवि और जीवनसाथी।"
  },
  8: {
    nameEn: "8th House",
    nameHi: "अष्टम भाव",
    sanskritEn: "Randhra Bhava / Ayu Bhava",
    sanskritHi: "रन्ध्र भाव / आयु भाव",
    signifiesEn: "Longevity, transformation, mysteries, occult, research, sudden events, and inheritance.",
    signifiesHi: "दीर्घायु, परिवर्तन, रहस्य, गुप्त विद्या, शोध, अचानक घटनाएं और विरासत।"
  },
  9: {
    nameEn: "9th House",
    nameHi: "नवम भाव",
    sanskritEn: "Bhagya Bhava",
    sanskritHi: "भाग्य भाव",
    signifiesEn: "Fortune (Bhagya), father, guru, philosophy, higher learning, and long-distance travels.",
    signifiesHi: "भाग्य, पिता, गुरु, दर्शन, उच्च शिक्षा और लंबी दूरी की यात्राएं।"
  },
  10: {
    nameEn: "10th House",
    nameHi: "दशम भाव",
    sanskritEn: "Karma Bhava",
    sanskritHi: "कर्म भाव",
    signifiesEn: "Career, public status, authority, fame, karma, father's profession, and achievements.",
    signifiesHi: "करियर, सार्वजनिक स्थिति, अधिकार, प्रसिद्धि, कर्म, पिता का पेशा और उपलब्धियां।"
  },
  11: {
    nameEn: "11th House",
    nameHi: "एकादश भाव",
    sanskritEn: "Labha Bhava",
    sanskritHi: "लाभ भाव",
    signifiesEn: "Gains, aspirations, friend circle, wealth accumulation, elder siblings, and networking.",
    signifiesHi: "लाभ, आकांक्षाएं, मित्र मंडली, धन संचय, बड़े भाई-बहन और नेटवर्किंग।"
  },
  12: {
    nameEn: "12th House",
    nameHi: "द्वादश भाव",
    sanskritEn: "Vyaya Bhava",
    sanskritHi: "व्यय भाव",
    signifiesEn: "Expenses, isolation, losses, foreign travels, subconscious, spirituality, and sleep/bed comforts.",
    signifiesHi: "खर्च, अकेलापन, नुकसान, विदेश यात्रा, अवचेतन, आध्यात्मिकता और शयन सुख।"
  }
};

// House relative coordinate positions (for rendering in overlay)
interface HousePosition {
  houseNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signStyle: any;
}

const HOUSE_LAYOUTS: HousePosition[] = [
  { houseNum: 1,  x: 120, y: 50,    width: 160, height: 85,  signStyle: { left: '50%', top: 2, transform: [{ translateX: -6 }] } },
  { houseNum: 2,  x: 55,  y: 10,    width: 90,  height: 50,  signStyle: { left: 4, top: 2 } },
  { houseNum: 3,  x: 10,  y: 55,    width: 50,  height: 90,  signStyle: { left: 4, top: 2 } },
  { houseNum: 4,  x: 50,  y: 120,   width: 85,  height: 160, signStyle: { left: 4, top: '50%', transform: [{ translateY: -6 }] } },
  { houseNum: 5,  x: 10,  y: 255,   width: 50,  height: 90,  signStyle: { left: 4, bottom: 2 } },
  { houseNum: 6,  x: 55,  y: 340,   width: 90,  height: 50,  signStyle: { left: 4, bottom: 2 } },
  { houseNum: 7,  x: 120, y: 265,   width: 160, height: 85,  signStyle: { left: '50%', bottom: 2, transform: [{ translateX: -6 }] } },
  { houseNum: 8,  x: 255, y: 340,   width: 90,  height: 50,  signStyle: { right: 4, bottom: 2 } },
  { houseNum: 9,  x: 340, y: 255,   width: 50,  height: 90,  signStyle: { right: 4, bottom: 2 } },
  { houseNum: 10, x: 265, y: 120,   width: 85,  height: 160, signStyle: { right: 4, top: '50%', transform: [{ translateY: -6 }] } },
  { houseNum: 11, x: 340, y: 55,    width: 50,  height: 90,  signStyle: { right: 4, top: 2 } },
  { houseNum: 12, x: 255, y: 10,    width: 90,  height: 50,  signStyle: { right: 4, top: 2 } }
];

export default function KundaliScreen() {
  const [activeView, setActiveView] = useState<ActiveView>('lagna');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { isHindi } = useLanguage();
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  const fetchKundaliData = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = forceRefresh
        ? await api.getForce('/api/astrology/chart', email ? { email } : undefined)
        : await api.getCached('/api/astrology/chart', email ? { email } : undefined);
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load Kundali chart.');
      }
    } catch (err: any) {
      console.error('Error fetching Kundali data:', err);
      setError('Unable to reach celestial engine. Please make sure your backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKundaliData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchKundaliData(true); // force network bypass cache
  };

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Synthesizing Birth Coordinates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertTriangle size={40} color="#E11D48" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchKundaliData(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chart = data.chart;
  const lagnaSignNum = chart?.lagna?.sign || 10;
  const lagnaSignName = getSignName(lagnaSignNum);
  const moonPlanet = chart?.planets?.find((p: any) => p.name === 'Moon');
  const moonSignName = moonPlanet ? getSignName(moonPlanet.sign) : 'Taurus';

  const realMD = data?.temporal?.stack?.mahadasha || 'Saturn';
  const realAD = data?.temporal?.stack?.antardasha || 'Jupiter';

  // Construct display planets
  const displayPlanets = chart?.planets
    ? [
        {
          abbr: 'La',
          name: 'Lagna',
          sign: lagnaSignName,
          house: 1,
          status: 'Ascendant',
          degree: `${Math.floor(chart.lagna.longitude % 30)}°${Math.floor(((chart.lagna.longitude % 30) * 60) % 60)}'00"`
        },
        ...chart.planets.map((p: any) => {
          const abbr = getPlanetAbbr(p.name);
          const signName = getSignName(p.sign);
          const house = ((p.sign - lagnaSignNum + 12) % 12) + 1;
          const status = p.isRetrograde ? 'Retrograde' : p.isCombust ? 'Combust' : p.isVargottama ? 'Vargottama' : p.strengthLevel || 'Active';
          return {
            abbr,
            name: p.name,
            sign: signName,
            house,
            status,
            degree: `${Math.floor(p.longitude % 30)}°${Math.floor(((p.longitude % 30) * 60) % 60)}'${Math.floor(((p.longitude % 30) * 3600) % 60)}"`
          };
        })
      ]
    : [];

  const screenWidth = Dimensions.get('window').width;
  const chartSize = Math.min(screenWidth - 48, 380);
  const scale = chartSize / 400;

  const tabs = [
    { id: 'lagna', label: 'Birth Chart', icon: Sparkles },
    { id: 'planets', label: 'Planets', icon: Star },
    { id: 'dasha', label: 'Dasha', icon: Database },
    { id: 'transit', label: 'Transits', icon: Navigation }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Sub-tabs navigator */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeView === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveView(tab.id as ActiveView)}
            >
              <Icon size={14} color={activeView === tab.id ? '#F8F5EF' : '#78350F'} style={{ marginBottom: 2 }} />
              <Text style={[styles.tabButtonText, activeView === tab.id && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* WELCOME DNA OVERVIEW */}
        <View style={styles.dnaCard}>
          <Text style={styles.dnaTitle}>Sacred DNA Profile</Text>
          <Text style={styles.dnaText}>
            {lagnaSignName} Ascendant • {realMD} Mahadasha • Moon in {moonSignName}
          </Text>
        </View>

        {/* TAB 1: CHART DRAWINGS */}
        {activeView === 'lagna' && (
          <View style={styles.tabContent}>
            <View style={styles.chartWrapper}>
              <Text style={styles.chartLabel}>Lagna Kundali (Traditional Diamond)</Text>
              
              {/* Outer box container with scale size */}
              <View style={[styles.chartContainer, { width: chartSize, height: chartSize }]}>
                {/* SVG layout background lines */}
                <Svg viewBox="0 0 400 400" style={StyleSheet.absoluteFill}>
                  {/* Inner Kendra diamonds */}
                  <Polygon points="200,200 100,100 200,0 300,100" fill="#FAF6EA" stroke="#C5B495" strokeWidth="1.5" />
                  <Polygon points="200,200 100,300 200,400 300,300" fill="#FAF6EA" stroke="#C5B495" strokeWidth="1.5" />
                  <Polygon points="200,200 100,100 0,200 100,300" fill="#FAF6EA" stroke="#C5B495" strokeWidth="1.5" />
                  <Polygon points="200,200 300,100 400,200 300,300" fill="#FAF6EA" stroke="#C5B495" strokeWidth="1.5" />
                  
                  {/* Outer Triangles background */}
                  <Polygon points="0,0 200,0 100,100" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="0,0 0,200 100,100" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="0,400 0,200 100,300" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="0,400 200,400 100,300" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="400,400 200,400 300,300" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="400,400 400,200 300,300" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="400,0 400,200 300,100" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />
                  <Polygon points="400,0 200,0 300,100" fill="#FDFBF7" stroke="#C5B495" strokeWidth="1" />

                  {/* Rectangle boundary */}
                  <Rect x="0" y="0" width="400" height="400" fill="none" stroke="#C5B495" strokeWidth="2.5" />
                  {/* Diagonals */}
                  <Line x1="0" y1="0" x2="400" y2="400" stroke="#C5B495" strokeWidth="1.5" />
                  <Line x1="400" y1="0" x2="0" y2="400" stroke="#C5B495" strokeWidth="1.5" />

                  {/* Selected House Highlight */}
                  {selectedHouse !== null && HOUSE_POLYGONS[selectedHouse] && (
                    <Polygon
                      points={HOUSE_POLYGONS[selectedHouse]}
                      fill="rgba(217, 119, 6, 0.12)"
                      stroke="#D97706"
                      strokeWidth="2.5"
                    />
                  )}
                </Svg>

                {/* Absolutely positioned overlay views */}
                {HOUSE_LAYOUTS.map((layout) => {
                  const houseNum = layout.houseNum;
                  const signNum = ((lagnaSignNum + houseNum - 2) % 12) + 1;
                  const planetsInHouse = displayPlanets.filter((p: any) => p.house === houseNum);

                  return (
                    <TouchableOpacity
                      key={houseNum}
                      activeOpacity={0.8}
                      onPress={() => setSelectedHouse(selectedHouse === houseNum ? null : houseNum)}
                      style={{
                        position: 'absolute',
                        left: layout.x * scale,
                        top: layout.y * scale,
                        width: layout.width * scale,
                        height: layout.height * scale,
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                      }}
                    >
                      {/* Sign Number */}
                      <Text style={[styles.houseSignNumber, layout.signStyle, selectedHouse === houseNum && { color: '#D97706', fontWeight: 'bold' }]}>{signNum}</Text>

                      {/* Planets list */}
                      <View style={styles.housePlanetsRow}>
                        {planetsInHouse.map((p, pIdx) => {
                          const styleColors = getPlanetChartStyle(p.abbr);
                          return (
                            <View
                              key={pIdx}
                              style={[
                                styles.planetBadge,
                                {
                                  backgroundColor: styleColors.bg,
                                  borderColor: styleColors.border,
                                },
                              ]}
                            >
                              <Text style={[styles.planetBadgeText, { color: styleColors.text }]}>
                                {p.abbr}{getPlanetSymbol(p.abbr)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Chart Interaction Tip */}
            {selectedHouse === null && (
              <Text style={styles.chartGuideText}>
                {isHindi 
                  ? 'संकेत: किसी भी भाव पर टैप करके उसके कारकत्व और ग्रह स्थिति को जानें।' 
                  : 'Tip: Tap any house inside the chart to inspect its significances and residing planets.'
                }
              </Text>
            )}

            {/* Selected House Details Card */}
            {selectedHouse !== null && (() => {
              const sig = HOUSE_SIGNIFICANCES[selectedHouse];
              const houseNum = selectedHouse;
              const signNum = ((lagnaSignNum + houseNum - 2) % 12) + 1;
              const signName = getSignName(signNum);
              const planetsInHouse = displayPlanets.filter((p: any) => p.house === houseNum);
              
              return (
                <View style={[styles.card, styles.selectedHouseCard]}>
                  <View style={styles.selectedHouseHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.selectedHouseTitle}>
                        {isHindi ? sig.nameHi : sig.nameEn}
                      </Text>
                      <Text style={styles.selectedHouseSanskrit}>
                        {isHindi ? sig.sanskritHi : sig.sanskritEn} • {isHindi ? `राशि: ${signName} (${signNum})` : `Sign: ${signName} (${signNum})`}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.closeHouseCardButton} 
                      onPress={() => setSelectedHouse(null)}
                    >
                      <Text style={styles.closeHouseCardButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.selectedHouseContent}>
                    <Text style={styles.selectedHouseLabel}>
                      {isHindi ? 'कारकत्व / महत्व' : 'Significance / Governs'}
                    </Text>
                    <Text style={styles.selectedHouseSignificance}>
                      {isHindi ? sig.signifiesHi : sig.signifiesEn}
                    </Text>

                    <Text style={[styles.selectedHouseLabel, { marginTop: 12 }]}>
                      {isHindi ? 'ग्रह स्थिति' : 'Residing Planets'}
                    </Text>
                    {planetsInHouse.length > 0 ? (
                      <View style={styles.selectedHousePlanetsList}>
                        {planetsInHouse.map((p, idx) => (
                          <View key={idx} style={styles.selectedHousePlanetRow}>
                            <View style={styles.selectedHousePlanetLogo}>
                              <Text style={styles.selectedHousePlanetSymbol}>{getPlanetSymbol(p.abbr)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.selectedHousePlanetName}>
                                {p.name} ({p.abbr})
                              </Text>
                              <Text style={styles.selectedHousePlanetDegree}>
                                {p.degree} • {p.status}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyHouseText}>
                        {isHindi 
                          ? `इस भाव में कोई भी जन्मकालीन ग्रह नहीं है। यह भाव अपने स्वामी ${(LAGNA_LORDS[signName] || { name: '' }).name} द्वारा प्रभावित है।` 
                          : `Empty House. No natal planets reside here. This house is governed by its lord ${(LAGNA_LORDS[signName] || { name: 'Saturn' }).name}.`
                        }
                      </Text>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* DNA Details Cards */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Astrological DNA</Text>
              <View style={styles.dnaGrid}>
                <DnaGridItem label="Lagna Lord" value={`${(LAGNA_LORDS[lagnaSignName] || { name: 'Saturn' }).name} ${(LAGNA_LORDS[lagnaSignName] || { symbol: '' }).symbol}`} />
                <DnaGridItem label="Nakshatra" value={moonPlanet?.nakshatra || 'Mula'} />
                <DnaGridItem label="Moon Sign" value={moonSignName} />
                <DnaGridItem label="Active Dasha" value={realMD} />
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: PLANETS TABLE */}
        {activeView === 'planets' && (
          <View style={styles.tabContent}>
            {displayPlanets.map((p, idx) => (
              <View key={idx} style={styles.planetRowCard}>
                <View style={styles.planetCardHeader}>
                  <View style={styles.planetLogoRow}>
                    <View style={styles.planetLogo}>
                      <Text style={styles.planetLogoText}>{getPlanetSymbol(p.abbr)}</Text>
                    </View>
                    <View>
                      <Text style={styles.planetName}>{p.name}</Text>
                      <Text style={styles.planetSignHouse}>
                        {p.sign} • House {p.house}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planetStatusBadge}>
                    <Text style={styles.planetStatusBadgeText}>{p.status}</Text>
                  </View>
                </View>
                <View style={styles.planetCardMeta}>
                  <Text style={styles.metaLabel}>Coordinate Degree</Text>
                  <Text style={styles.metaValue}>{p.degree}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: DASHA PROGRESSION */}
        {activeView === 'dasha' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { alignItems: 'center', paddingVertical: Spacing.five }]}>
              <Text style={styles.cardLabelMini}>Active Mahadasha</Text>
              <Text style={styles.mahadashaTitle}>{realMD}</Text>
              <Text style={styles.dashaDuration}>
                Calibrated until {new Date(data?.temporal?.timing?.endsAt).toLocaleDateString()}
              </Text>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '65%' }]} />
              </View>
              <Text style={styles.progressText}>Current cycle is 65% complete</Text>
            </View>

            <Text style={styles.sectionTitle}>Chapter Progression Timeline</Text>
            
            <View style={styles.progressItem}>
              <View style={[styles.itemIndicator, styles.indicatorActive]} />
              <View style={styles.progressTextCard}>
                <Text style={styles.progressHeader}>{realMD} {realAD} (Current Focus)</Text>
                <Text style={styles.progressSub}>Active sub-cycle triggers behavioral shifts</Text>
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.itemIndicator} />
              <View style={styles.progressTextCard}>
                <Text style={styles.progressHeader}>Saturn Antardasha</Text>
                <Text style={styles.progressSub}>Starts next phase of structural discipline</Text>
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.itemIndicator} />
              <View style={styles.progressTextCard}>
                <Text style={styles.progressHeader}>Mercury Antardasha</Text>
                <Text style={styles.progressSub}>Future chapter governing communications</Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: TRANSITS */}
        {activeView === 'transit' && (
          <View style={styles.tabContent}>
            {data.transitIntelligence?.transits?.slice(0, 4).map((t: any, i: number) => (
              <View key={i} style={styles.transitItemCard}>
                <View style={styles.transitHeader}>
                  <Text style={styles.transitTitle}>{t.planet}</Text>
                  <View style={styles.houseBadge}>
                    <Text style={styles.houseBadgeText}>House {t.houseFromLagna}</Text>
                  </View>
                </View>
                <Text style={styles.transitSign}>Transiting through {t.sign || 'Active Sign'}</Text>
                <Text style={styles.transitInfluence}>"{t.whyItMatters?.[0] || 'Planetary alignment.'}"</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DnaGridItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dnaGridItem}>
      <Text style={styles.dnaGridLabel}>{label}</Text>
      <Text style={styles.dnaGridValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EF',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8D9',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F5EF',
  },
  tabButtonActive: {
    backgroundColor: '#3F2D1D',
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78350F',
  },
  tabButtonTextActive: {
    color: '#F8F5EF',
  },
  scrollContainer: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  tabContent: {
    gap: Spacing.four,
  },
  dnaCard: {
    backgroundColor: '#3F2D1D',
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
  },
  dnaTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  dnaText: {
    fontSize: 13,
    color: '#F8F5EF',
    fontWeight: '600',
  },
  chartWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.four,
  },
  chartContainer: {
    backgroundColor: '#FAF7F0',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  houseSignNumber: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    color: '#8C6E40',
  },
  housePlanetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '90%',
  },
  planetBadge: {
    borderRadius: 4,
    borderWidth: 0.5,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  planetBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.three,
  },
  dnaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  dnaGridItem: {
    width: '46%',
    backgroundColor: '#F8F5EF',
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#EFE8D9',
  },
  dnaGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dnaGridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  planetRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
    padding: Spacing.four,
    gap: 10,
  },
  planetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planetLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  planetLogo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8F5EF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetLogoText: {
    fontSize: 16,
    color: '#D97706',
  },
  planetName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  planetSignHouse: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.6,
  },
  planetStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planetStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  planetCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8F5EF',
    paddingTop: 8,
  },
  metaLabel: {
    fontSize: 10,
    color: '#78350F',
    opacity: 0.5,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3F2D1D',
  },
  cardLabelMini: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  mahadashaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 4,
    marginBottom: 2,
  },
  dashaDuration: {
    fontSize: 12,
    color: '#78350F',
    opacity: 0.6,
    marginBottom: Spacing.four,
  },
  progressBarBg: {
    width: '80%',
    height: 8,
    backgroundColor: '#F8F5EF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D97706',
  },
  progressText: {
    fontSize: 10,
    color: '#78350F',
    opacity: 0.5,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.three,
  },
  itemIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EFE8D9',
  },
  indicatorActive: {
    backgroundColor: '#D97706',
    borderWidth: 3,
    borderColor: '#FEF3C7',
  },
  progressTextCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 16,
    padding: Spacing.three,
  },
  progressHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  progressSub: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.6,
  },
  transitItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 20,
    padding: Spacing.four,
    marginBottom: Spacing.two,
  },
  transitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  houseBadge: {
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  houseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EC4899',
  },
  transitSign: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.5,
    marginBottom: 8,
  },
  transitInfluence: {
    fontSize: 13,
    color: '#78350F',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  selectedHouseCard: {
    borderColor: '#D97706',
    borderWidth: 1.5,
    backgroundColor: '#FAF8F4',
  },
  selectedHouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE8D9',
    paddingBottom: Spacing.three,
    marginBottom: Spacing.three,
  },
  selectedHouseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3F2D1D',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  selectedHouseSanskrit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 2,
  },
  closeHouseCardButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFE8D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeHouseCardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#78350F',
    lineHeight: 20,
  },
  selectedHouseContent: {
    gap: 4,
  },
  selectedHouseLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectedHouseSignificance: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  selectedHousePlanetsList: {
    gap: Spacing.two,
    marginTop: 6,
  },
  selectedHousePlanetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 12,
    padding: Spacing.three,
  },
  selectedHousePlanetLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F8F5EF',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedHousePlanetSymbol: {
    fontSize: 14,
    color: '#D97706',
  },
  selectedHousePlanetName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F2D1D',
  },
  selectedHousePlanetDegree: {
    fontSize: 10,
    color: '#78350F',
    opacity: 0.6,
  },
  emptyHouseText: {
    fontSize: 12,
    color: '#78350F',
    opacity: 0.7,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  chartGuideText: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 4,
  },
});
