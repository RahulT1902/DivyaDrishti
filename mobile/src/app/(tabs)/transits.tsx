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
import { AlertTriangle, Target, Activity, Info, Shield, Zap, Navigation } from 'lucide-react-native';
import { api } from '@/services/api';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_WIDTH - 48, 340);

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☾', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const PLANET_NAMES_HI: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};
const ZODIAC_SIGNS_HI: Record<string, string> = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
  Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const tHP = (n: string) => PLANET_NAMES_HI[n] || n;
const tHS = (n: string) => ZODIAC_SIGNS_HI[n] || n;
const getSignName = (num: number) => SIGN_NAMES[((num - 1 + 12) % 12)] || 'Aries';

type FilterType = 'all' | 'supportive' | 'sensitive';

// North Indian Diamond house coordinate map (scaled to CHART_SIZE)
const getHouseLabel = (houseNum: number, lagnaSign: number): string => {
  const signNum = ((lagnaSign + houseNum - 2) % 12) + 1;
  return String(signNum);
};

// Positions for house number labels (placed near the edges/corners so they don't overlap chips)
const HOUSE_LABEL_POSITIONS: Record<number, { x: number; y: number }> = {
  1:  { x: 0.5,  y: 0.06 },
  2:  { x: 0.12, y: 0.06 },
  3:  { x: 0.06, y: 0.12 },
  4:  { x: 0.06, y: 0.5  },
  5:  { x: 0.06, y: 0.88 },
  6:  { x: 0.12, y: 0.94 },
  7:  { x: 0.5,  y: 0.94 },
  8:  { x: 0.88, y: 0.94 },
  9:  { x: 0.94, y: 0.88 },
  10: { x: 0.94, y: 0.5  },
  11: { x: 0.94, y: 0.12 },
  12: { x: 0.88, y: 0.06 },
};

// Planet chip positions per house (up to 3 planets per house, safely bounded inside SVG regions)
const PLANET_CHIP_BASE: Record<number, { x: number; y: number }[]> = {
  1:  [{ x: 0.5, y: 0.20 }, { x: 0.42, y: 0.30 }, { x: 0.58, y: 0.30 }],
  2:  [{ x: 0.25, y: 0.08 }, { x: 0.20, y: 0.14 }, { x: 0.32, y: 0.14 }],
  3:  [{ x: 0.08, y: 0.25 }, { x: 0.14, y: 0.20 }, { x: 0.14, y: 0.32 }],
  4:  [{ x: 0.20, y: 0.50 }, { x: 0.30, y: 0.42 }, { x: 0.30, y: 0.58 }],
  5:  [{ x: 0.08, y: 0.75 }, { x: 0.14, y: 0.68 }, { x: 0.14, y: 0.80 }],
  6:  [{ x: 0.25, y: 0.92 }, { x: 0.20, y: 0.86 }, { x: 0.32, y: 0.86 }],
  7:  [{ x: 0.5, y: 0.80 }, { x: 0.42, y: 0.70 }, { x: 0.58, y: 0.70 }],
  8:  [{ x: 0.75, y: 0.92 }, { x: 0.68, y: 0.86 }, { x: 0.80, y: 0.86 }],
  9:  [{ x: 0.92, y: 0.75 }, { x: 0.86, y: 0.68 }, { x: 0.86, y: 0.80 }],
  10: [{ x: 0.80, y: 0.50 }, { x: 0.70, y: 0.42 }, { x: 0.70, y: 0.58 }],
  11: [{ x: 0.92, y: 0.25 }, { x: 0.86, y: 0.20 }, { x: 0.86, y: 0.32 }],
  12: [{ x: 0.75, y: 0.08 }, { x: 0.68, y: 0.14 }, { x: 0.80, y: 0.14 }],
};

const PLANET_CHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  La: { bg: '#D97706', text: '#FFFFFF', border: '#B45309' },
  Su: { bg: '#FEF3C7', text: '#78350F', border: '#F59E0B' },
  Mo: { bg: '#EFF6FF', text: '#1E3A8A', border: '#3B82F6' },
  Ma: { bg: '#FEE2E2', text: '#7F1D1D', border: '#EF4444' },
  Me: { bg: '#ECFDF5', text: '#064E3B', border: '#10B981' },
  Ju: { bg: '#FFFBEB', text: '#78350F', border: '#D97706' },
  Ve: { bg: '#FFF5F7', text: '#831843', border: '#EC4899' },
  Sa: { bg: '#1E293B', text: '#F8FAFC', border: '#0F172A' },
  Ra: { bg: '#27272A', text: '#F4F4F5', border: '#09090B' },
  Ke: { bg: '#27272A', text: '#F4F4F5', border: '#09090B' },
};
const defaultChipColor = { bg: '#FFFDFB', text: '#3F2D1D', border: '#F1E7D0' };

export default function TransitsScreen() {
  const { isHindi } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cycles' | 'chart'>('cycles');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedPlanets, setExpandedPlanets] = useState<Record<string, boolean>>({});

  const fetchTransits = async (forceRefresh = false) => {
    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = forceRefresh
        ? await api.getForce('/api/astrology/chart', email ? { email } : undefined)
        : await api.getCached('/api/astrology/chart', email ? { email } : undefined);
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load transit data');
      }
    } catch (err: any) {
      setError('Unable to reach celestial engine. Please make sure your backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTransits(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTransits(true); };
  const toggleExpand = (planet: string) =>
    setExpandedPlanets((prev) => ({ ...prev, [planet]: !prev[planet] }));

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>
          {isHindi ? 'आकाशीय स्थिति लोड हो रही है...' : 'Synthesizing Cosmic Coordinates...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <AlertTriangle size={40} color="#E11D48" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchTransits(); }}>
          <Text style={styles.retryButtonText}>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const transitIntelligence = data?.transitIntelligence;
  const liveTransits: any[] = transitIntelligence?.transits || [];
  const climate = transitIntelligence?.climate;
  const lagnaSign: number = data?.chart?.lagna?.sign || 1;

  // Build display transits for Active Cycles view
  const displayTransits = liveTransits.map((t: any) => {
    const isSupportive = t.nature?.toLowerCase().includes('supportive') ||
      t.nature?.toLowerCase().includes('benefic') || t.nature?.toLowerCase().includes('expansion');
    const isChallenging = t.nature?.toLowerCase().includes('sensitive') ||
      t.nature?.toLowerCase().includes('friction') || t.nature?.toLowerCase().includes('pressure') ||
      t.nature?.toLowerCase().includes('volatile') || t.nature?.toLowerCase().includes('challenging');
    const nature = isSupportive ? 'supportive' : isChallenging ? 'sensitive' : 'neutral';
    const statusLabel = isHindi
      ? (isSupportive ? 'अनुकूल प्रवाह' : isChallenging ? 'संवेदनशील चक्र' : 'सक्रिय चक्र')
      : (isSupportive ? 'Supportive Cycle' : isChallenging ? 'Sensitive Cycle' : 'Active Cycle');
    const influence = (isHindi && t.whyItMattersHindi?.[0]) ? t.whyItMattersHindi[0]
      : t.whyItMatters?.[0] || `${t.planet} transiting house ${t.houseFromLagna}.`;

    return {
      planet: isHindi ? tHP(t.planet) : t.planet,
      planetKey: t.planet,
      symbol: PLANET_SYMBOLS[t.planet] || '✦',
      sign: isHindi ? tHS(t.sign) : (t.sign || ''),
      house: t.houseFromLagna || 1,
      motion: t.retrograde ? (isHindi ? 'वक्री' : 'Retrograde') : (isHindi ? 'मार्गी' : 'Direct'),
      status: statusLabel,
      nature,
      influence,
      color: isSupportive ? 'amber' : isChallenging ? 'rose' : 'indigo',
    };
  });

  const filteredTransits = displayTransits.filter((t) =>
    filter === 'all' || t.nature === filter || (filter === 'supportive' && t.nature === 'neutral')
  );

  // Build chart houses
  const houseMap: Record<number, { abbr: string; label: string; retrograde: boolean }[]> = {};
  for (let i = 1; i <= 12; i++) houseMap[i] = [];
  // Add Lagna to house 1
  houseMap[1].push({ abbr: 'La', label: isHindi ? 'ल' : 'La', retrograde: false });
  liveTransits.forEach((t: any) => {
    const house = t.houseFromLagna;
    if (house >= 1 && house <= 12) {
      const abbr = (t.planet || '').substring(0, 2);
      houseMap[house].push({
        abbr,
        label: isHindi ? (PLANET_NAMES_HI[t.planet]?.substring(0, 2) || abbr) : abbr,
        retrograde: !!t.retrograde,
      });
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.toggleTab, viewMode === 'cycles' && styles.toggleTabActive]}
          onPress={() => setViewMode('cycles')}
        >
          <Text style={[styles.toggleTabText, viewMode === 'cycles' && styles.toggleTabTextActive]}>
            {isHindi ? 'सक्रिय चक्र' : 'Active Cycles'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleTab, viewMode === 'chart' && styles.toggleTabActive]}
          onPress={() => setViewMode('chart')}
        >
          <Text style={[styles.toggleTabText, viewMode === 'chart' && styles.toggleTabTextActive]}>
            {isHindi ? 'गोचर चार्ट' : 'Gochar Chart'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />}
      >
        {viewMode === 'cycles' ? (
          <>
            {/* Climate Summary */}
            {climate && (
              <View style={styles.climateCard}>
                <Text style={styles.climateTag}>
                  {isHindi ? 'आकाशीय वातावरण सारांश' : 'Live Environmental Synthesis'}
                </Text>
                <Text style={styles.climateHeadline}>{climate.headline}</Text>
                <View style={styles.metersContainer}>
                  <ClimateMeter
                    label={isHindi ? 'संरचनात्मक दबाव' : 'Structural Pressure'}
                    value={climate.netPressure}
                    color="#D97706"
                    icon={<AlertTriangle size={12} color="#D97706" />}
                  />
                  <ClimateMeter
                    label={isHindi ? 'विकास अवसर' : 'Growth Opportunity'}
                    value={climate.netOpportunity}
                    color="#059669"
                    icon={<Target size={12} color="#059669" />}
                  />
                  <ClimateMeter
                    label={isHindi ? 'ऊर्जा परिवर्तनशीलता' : 'Environmental Volatility'}
                    value={climate.netVolatility}
                    color="#E11D48"
                    icon={<Activity size={12} color="#E11D48" />}
                  />
                </View>
              </View>
            )}

            {/* Filter Buttons */}
            <View style={styles.filterRow}>
              {(['all', 'supportive', 'sensitive'] as FilterType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                    {f === 'all' ? (isHindi ? 'सभी' : 'All Cycles')
                      : f === 'supportive' ? (isHindi ? 'अनुकूल' : 'Supportive')
                      : (isHindi ? 'संवेदनशील' : 'Sensitive')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transit Cards */}
            {filteredTransits.map((t, idx) => {
              const cardBg = t.color === 'rose' ? '#FCF3F4' : t.color === 'amber' ? '#FCF9F3' : '#F3F6FC';
              const cardBorder = t.color === 'rose' ? '#F5DCDE' : t.color === 'amber' ? '#F2E7D0' : '#DCE4F5';
              const badgeBg = t.color === 'rose' ? '#FFE4E6' : t.color === 'amber' ? '#FEF3C7' : '#EEF2FF';
              const badgeText = t.color === 'rose' ? '#9F1239' : t.color === 'amber' ? '#78350F' : '#3730A3';
              return (
                <View key={`${t.planetKey}-${idx}`} style={[styles.cycleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.cycleCardHeader}>
                    <View style={styles.cycleCardLeft}>
                      <View style={styles.planetSymbolBox}>
                        <Text style={styles.planetSymbolText}>{t.symbol}</Text>
                      </View>
                      <View>
                        <Text style={styles.planetName}>{t.planet}</Text>
                        <Text style={styles.planetMeta}>
                          {isHindi ? `${t.house} भाव ✦ ${t.sign} ✦ ${t.motion}` : `House ${t.house} ✦ ${t.sign} ✦ ${t.motion}`}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeText }]}>{t.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cycleInfluence}>"{t.influence}"</Text>
                </View>
              );
            })}

            {/* Pundit Guidance Panel */}
            <View style={styles.punditCard}>
              <Text style={styles.punditTitle}>
                {isHindi ? '✦ पंडित जी का गोचर मार्गदर्शन' : '✦ Pundit Transit Guidance'}
              </Text>
              <Text style={styles.punditText}>
                {isHindi
                  ? 'वर्तमान में धीमी गति से चलने वाले ग्रह आपकी कुंडली के अत्यंत प्रभावशाली क्षेत्रों को सक्रिय कर रहे हैं। राहु आपके दशम भाव में वक्री गति से संचरण कर रहे हैं, जिससे व्यावसायिक उतार-चढ़ाव के साथ कर्म के प्रति गहन महत्वाकांक्षा जागृत होगी। शनि देव के अनुशासन का आश्रय लें।'
                  : 'The current transiting planets are activating highly focal sectors of your chart. With Rahu retrograding through Pisces in your 10th house, expect temporary career turbulence but high vocational drive. Remain anchored, avoid sudden reactive pivots, and rely on Saturn\'s disciplined structures.'}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.punditSubTitle}>
                {isHindi ? '✦ मंद गति ग्रहीय स्थिति' : '✦ Slow-Moving Transit Status'}
              </Text>
              {[
                { sym: '♄', name: 'Saturn', pos: 'Aquarius (2nd House)', dir: 'Direct', col: '#4338CA', posHi: 'कुंभ (द्वितीय भाव)', dirHi: 'मार्गी' },
                { sym: '♃', name: 'Jupiter', pos: 'Aries (4th House)', dir: 'Direct', col: '#059669', posHi: 'मेष (चतुर्थ भाव)', dirHi: 'मार्गी' },
                { sym: '☊', name: 'Rahu', pos: 'Pisces (10th House)', dir: 'Retrograde', col: '#E11D48', posHi: 'मीन (दशम भाव)', dirHi: 'वक्री' },
              ].map((p) => (
                <View key={p.name} style={styles.slowRow}>
                  <Text style={styles.slowPlanet}>{p.sym} {isHindi ? tHP(p.name) : p.name}</Text>
                  <Text style={styles.slowPos}>{isHindi ? p.posHi : p.pos}</Text>
                  <Text style={[styles.slowDir, { color: p.col }]}>{isHindi ? p.dirHi : p.dir}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Gochar Chart View */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                {isHindi ? 'गोचर कुंडली (उत्तर भारतीय हीरा प्रारूप)' : 'Gochar Chart (North Indian Diamond View)'}
              </Text>
              <Text style={styles.chartSubtitle}>
                {isHindi ? `जन्म लग्न: ${tHS(getSignName(lagnaSign))} (${lagnaSign})` : `Natal Lagna: ${getSignName(lagnaSign)} (${lagnaSign})`}
              </Text>

              <View style={{ width: CHART_SIZE, height: CHART_SIZE, position: 'relative', alignSelf: 'center', marginTop: 16 }}>
                {/* SVG Background Lines */}
                <Svg width={CHART_SIZE} height={CHART_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
                  {/* Outer border */}
                  <Rect x="0" y="0" width={CHART_SIZE} height={CHART_SIZE} fill="#FAF7F0" stroke="#C5B495" strokeWidth="2" />
                  {/* Diagonal lines */}
                  <Line x1="0" y1="0" x2={CHART_SIZE} y2={CHART_SIZE} stroke="#C5B495" strokeWidth="1.5" />
                  <Line x1={CHART_SIZE} y1="0" x2="0" y2={CHART_SIZE} stroke="#C5B495" strokeWidth="1.5" />
                  {/* Diamond outline */}
                  <Line x1={CHART_SIZE / 2} y1="0" x2="0" y2={CHART_SIZE / 2} stroke="#C5B495" strokeWidth="2" />
                  <Line x1="0" y1={CHART_SIZE / 2} x2={CHART_SIZE / 2} y2={CHART_SIZE} stroke="#C5B495" strokeWidth="2" />
                  <Line x1={CHART_SIZE / 2} y1={CHART_SIZE} x2={CHART_SIZE} y2={CHART_SIZE / 2} stroke="#C5B495" strokeWidth="2" />
                  <Line x1={CHART_SIZE} y1={CHART_SIZE / 2} x2={CHART_SIZE / 2} y2="0" stroke="#C5B495" strokeWidth="2" />
                  {/* Inner Kendra diamonds */}
                  <Polygon
                    points={`${CHART_SIZE/2},${CHART_SIZE/2} ${CHART_SIZE/4},${CHART_SIZE/4} ${CHART_SIZE/2},0 ${3*CHART_SIZE/4},${CHART_SIZE/4}`}
                    fill="#FDFBF7" stroke="#C5B495" strokeWidth="1"
                  />
                  <Polygon
                    points={`${CHART_SIZE/2},${CHART_SIZE/2} ${CHART_SIZE/4},${3*CHART_SIZE/4} ${CHART_SIZE/2},${CHART_SIZE} ${3*CHART_SIZE/4},${3*CHART_SIZE/4}`}
                    fill="#FDFBF7" stroke="#C5B495" strokeWidth="1"
                  />
                  <Polygon
                    points={`${CHART_SIZE/2},${CHART_SIZE/2} ${CHART_SIZE/4},${CHART_SIZE/4} 0,${CHART_SIZE/2} ${CHART_SIZE/4},${3*CHART_SIZE/4}`}
                    fill="#FDFBF7" stroke="#C5B495" strokeWidth="1"
                  />
                  <Polygon
                    points={`${CHART_SIZE/2},${CHART_SIZE/2} ${3*CHART_SIZE/4},${CHART_SIZE/4} ${CHART_SIZE},${CHART_SIZE/2} ${3*CHART_SIZE/4},${3*CHART_SIZE/4}`}
                    fill="#FDFBF7" stroke="#C5B495" strokeWidth="1"
                  />
                </Svg>

                {/* House Labels & Planet Chips — absolutely positioned RN Views */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNum) => {
                  const labelPos = HOUSE_LABEL_POSITIONS[houseNum];
                  const signLabel = getHouseLabel(houseNum, lagnaSign);
                  const planets = houseMap[houseNum] || [];
                  const chipPositions = PLANET_CHIP_BASE[houseNum] || [];

                  return (
                    <React.Fragment key={houseNum}>
                      {/* Sign number label */}
                      <Text
                        style={[
                          styles.houseSignLabel,
                          {
                            position: 'absolute',
                            left: labelPos.x * CHART_SIZE - 8,
                            top: labelPos.y * CHART_SIZE - 8,
                          },
                        ]}
                      >
                        {signLabel}
                      </Text>

                      {/* Planet chips */}
                      {planets.slice(0, 3).map((p, pi) => {
                        const chipPos = chipPositions[pi];
                        if (!chipPos) return null;
                        const colors = PLANET_CHIP_COLORS[p.abbr] || defaultChipColor;
                        return (
                          <View
                            key={`${p.abbr}-${pi}`}
                            style={[
                              styles.planetChip,
                              {
                                position: 'absolute',
                                left: chipPos.x * CHART_SIZE - 14,
                                top: chipPos.y * CHART_SIZE - 10,
                                backgroundColor: colors.bg,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.planetChipText, { color: colors.text }]}>
                              {p.label}
                              {p.retrograde ? ' ℞' : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legendBox}>
                <Text style={styles.legendTitle}>{isHindi ? 'गोचर संकेत कुंजी' : 'Chart Legend'}</Text>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>℞ = {isHindi ? 'वक्री' : 'Retrograde'}</Text>
                  <Text style={styles.legendItem}>La / ल = {isHindi ? 'लग्न' : 'Lagna'}</Text>
                </View>
                <View style={styles.legendRow}>
                  {[
                    { abbr: 'Sa', label: isHindi ? 'श = शनि' : 'Sa = Saturn', bg: '#1E293B', text: '#F8FAFC' },
                    { abbr: 'Ju', label: isHindi ? 'गु = गुरु' : 'Ju = Jupiter', bg: '#FFFBEB', text: '#78350F' },
                    { abbr: 'Ra', label: isHindi ? 'रा = राहु' : 'Ra = Rahu', bg: '#27272A', text: '#F4F4F5' },
                  ].map((p) => (
                    <View key={p.abbr} style={[styles.legendChip, { backgroundColor: p.bg }]}>
                      <Text style={[styles.legendChipText, { color: p.text }]}>{p.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Transit Focus Banner */}
            <View style={styles.focusBanner}>
              <Text style={styles.focusLabel}>✦ {isHindi ? 'गोचर मुख्य संरेखण' : 'Transit Focus'} ✦</Text>
              <Text style={styles.focusText}>
                {isHindi
                  ? 'सक्रिय ग्रहीय प्रवाह आपके व्यावसायिक पथ में नवीनता और आत्म-मंथन की प्रेरणा दे रहे हैं, परंतु आवेश में किए गए निर्णयों से बचने की सलाह दी जाती है।'
                  : 'Active planetary currents invite professional reinvention and deep vocational focus, but advise caution against impulsive reactive shifts.'}
              </Text>
            </View>

            {/* Tier 1 Transit Details */}
            <Text style={styles.sectionTitle}>
              {isHindi ? 'दीर्घकालिक ग्रहीय प्रभाव' : 'Tier 1: Macro Drivers'}
            </Text>
            {liveTransits.filter((t: any) => t.tier === 1).map((transit: any) => {
              const isExpanded = !!expandedPlanets[transit.planet];
              return (
                <View key={transit.planet} style={styles.macroCard}>
                  <View style={styles.macroHeader}>
                    <View>
                      <Text style={styles.macroPlanet}>
                        {PLANET_SYMBOLS[transit.planet] || '✦'} {isHindi ? tHP(transit.planet) : transit.planet}
                      </Text>
                      <Text style={styles.macroSub}>
                        {isHindi ? `${tHS(transit.sign)} • ${transit.houseFromLagna}वें भाव में` : `in ${transit.sign} • ${transit.houseFromLagna}th House`}
                      </Text>
                    </View>
                    <View style={styles.natureBadge}>
                      <Text style={styles.natureBadgeText}>{transit.nature}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.expandButton} onPress={() => toggleExpand(transit.planet)}>
                    <Text style={styles.expandButtonText}>
                      {isExpanded
                        ? (isHindi ? '▲ कम करें' : '▲ Collapse')
                        : (isHindi ? '▼ यह क्यों महत्वपूर्ण है' : '▼ Why This Matters')}
                    </Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {transit.whyItMatters?.map((reason: string, i: number) => (
                        <View key={i} style={styles.reasonBox}>
                          <Info size={14} color="#D97706" style={{ marginTop: 2 }} />
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ClimateMeter({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <View style={styles.meterRow}>
      <View style={styles.meterHeader}>
        <View style={styles.meterLabelRow}>
          {icon}
          <Text style={styles.meterLabel}>{label}</Text>
        </View>
        <Text style={[styles.meterValue, { color }]}>{value}/10</Text>
      </View>
      <View style={styles.meterBarBg}>
        <View style={[styles.meterBarFill, { backgroundColor: color, width: `${(value || 0) * 10}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5EF' },
  centerContainer: { flex: 1, backgroundColor: '#F8F5EF', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#78350F', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6 },
  errorText: { color: '#E11D48', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#451A03', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#F8F5EF', fontWeight: '700' },
  toggleBar: { flexDirection: 'row', backgroundColor: '#FFFDF8', borderBottomWidth: 1, borderBottomColor: '#EFE8D9' },
  toggleTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  toggleTabActive: { borderBottomColor: '#D97706' },
  toggleTabText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#B8A38A' },
  toggleTabTextActive: { color: '#78350F' },
  scrollContainer: { padding: 16, gap: 16, paddingBottom: 32 },
  climateCard: { backgroundColor: '#FAF8F5', borderRadius: 24, borderWidth: 1, borderColor: '#EFE8D9', padding: 16 },
  climateTag: { fontSize: 9, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  climateHeadline: { fontSize: 17, fontWeight: '700', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 24, marginBottom: 14 },
  metersContainer: { borderTopWidth: 1, borderTopColor: '#EFE8D9', paddingTop: 12, gap: 12 },
  meterRow: { gap: 4 },
  meterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meterLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meterLabel: { fontSize: 11, fontWeight: '600', color: '#78350F' },
  meterValue: { fontSize: 11, fontWeight: '700' },
  meterBarBg: { height: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE8D9', borderRadius: 3, overflow: 'hidden' },
  meterBarFill: { height: '100%', borderRadius: 3 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#EFE8D9', backgroundColor: '#FFFFFF' },
  filterBtnActive: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  filterBtnText: { fontSize: 11, fontWeight: '700', color: '#B8A38A', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterBtnTextActive: { color: '#78350F' },
  cycleCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  cycleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cycleCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  planetSymbolBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE8D9', alignItems: 'center', justifyContent: 'center' },
  planetSymbolText: { fontSize: 18, color: '#78350F' },
  planetName: { fontSize: 15, fontWeight: '700', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  planetMeta: { fontSize: 10, color: '#B45309', opacity: 0.7, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cycleInfluence: { fontSize: 12, color: '#3F2D1D', lineHeight: 18, fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: '#D97706' + '40' },
  punditCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 16, gap: 10 },
  punditTitle: { fontSize: 10, fontWeight: '700', color: '#B45309', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 },
  punditText: { fontSize: 13, color: '#3F2D1D', lineHeight: 20, fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  divider: { height: 1, backgroundColor: '#EFE8D9' },
  punditSubTitle: { fontSize: 10, fontWeight: '700', color: '#B45309', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 },
  slowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: '#EFE8D9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  slowPlanet: { fontSize: 12, fontWeight: '700', color: '#3F2D1D', flex: 1 },
  slowPos: { fontSize: 11, color: '#78350F', opacity: 0.6, flex: 1.5, textAlign: 'center' },
  slowDir: { fontSize: 11, fontWeight: '600', flex: 0.8, textAlign: 'right' },
  // Chart view styles
  chartContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 16 },
  chartTitle: { fontSize: 11, fontWeight: '700', color: '#B45309', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  chartSubtitle: { fontSize: 11, color: '#78350F', opacity: 0.6 },
  houseSignLabel: { fontSize: 12, fontWeight: '700', color: '#8C6E40', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  planetChip: { position: 'absolute', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minWidth: 26 },
  planetChipText: { fontSize: 9, fontWeight: '700' },
  legendBox: { marginTop: 16, backgroundColor: '#FAF8F5', borderRadius: 12, borderWidth: 1, borderColor: '#EFE8D9', padding: 12, gap: 8 },
  legendTitle: { fontSize: 9, fontWeight: '700', color: '#B45309', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { fontSize: 11, color: '#78350F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  legendChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  legendChipText: { fontSize: 10, fontWeight: '700' },
  focusBanner: { backgroundColor: '#FAF8F5', borderRadius: 16, borderWidth: 1, borderColor: '#EFE8D9', padding: 16, alignItems: 'center', gap: 6 },
  focusLabel: { fontSize: 10, fontWeight: '700', color: '#B45309', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5 },
  focusText: { fontSize: 13, color: '#3F2D1D', lineHeight: 20, fontStyle: 'italic', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: 2 },
  macroCard: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#EFE8D9', padding: 14, gap: 12 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  macroPlanet: { fontSize: 18, fontWeight: '700', color: '#3F2D1D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  macroSub: { fontSize: 11, color: '#78350F', opacity: 0.6, marginTop: 2 },
  natureBadge: { backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFE8D9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  natureBadgeText: { fontSize: 10, fontWeight: '600', color: '#78350F', textTransform: 'capitalize' },
  expandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F8F5EF', paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#EFE8D9' },
  expandButtonText: { fontSize: 11, fontWeight: '700', color: '#78350F' },
  expandedContent: { paddingTop: 4, gap: 8 },
  reasonBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#EFE8D9', borderRadius: 12, padding: 10 },
  reasonText: { fontSize: 12, color: '#78350F', lineHeight: 18, flex: 1 },
});
