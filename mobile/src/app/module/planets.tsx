import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useChartData } from '../../hooks/useChartData';
import { Body, Card, ErrorView, Eyebrow, LoadingView, Screen, ui } from '../../components/ui';
import { PLANET_COLORS } from '../../components/NorthIndianChart';
import { PLANET_SYMBOLS, buildDisplayPlanets, tPlanet, tSign } from '../../lib/astro';
import { getPlanetArchetype } from '../../lib/planetArchetypes';

// Port of the web PlanetsDetailsPage: one archetype card per planet; tap to
// reveal the shadow tendency, grounding guidance and somatic key.

export default function PlanetsScreen() {
  const { isHindi, t } = useLanguage();
  const { data, loading, error, reload } = useChartData();
  const [selected, setSelected] = useState<string | null>(null);

  if (loading) return <LoadingView label={t('Reading planetary archetypes...', 'ग्रह आत्मरूप पढ़े जा रहे हैं...')} />;
  if (error || !data?.chart) return <ErrorView message={error || 'No chart data'} onRetry={reload} />;

  const planets = buildDisplayPlanets(data.chart);

  return (
    <Screen onRefresh={reload}>
      <Card style={{ backgroundColor: '#FFFBEB' }}>
        <Eyebrow>{t('The Power of Psychological Archetypes', 'मनोवैज्ञानिक आत्मरूपों का प्रभाव')}</Eyebrow>
        <Body>
          {t(
            'Vedic Jyotish guides us to understand the planets not as remote rocks in space, but as living archetypes within our own mind. Each planet governs a behavioural theme and emotional anchor. Tap any planet to reveal its shadow, grounding guidance and somatic key.',
            'वैदिक ज्योतिष हमें ग्रहों को अंतरिक्ष के बेजान पिंडों के रूप में नहीं, बल्कि अपने मन के भीतर जीवित आत्मरूपों के रूप में समझने की शिक्षा देता है। किसी भी ग्रह को छूकर उसकी छाया प्रवृत्ति, स्थिरता निर्देश और कायिक सूत्र देखें।',
          )}
        </Body>
      </Card>

      {planets.map(p => {
        const info = getPlanetArchetype(p.name, p.sign, p.isRetrograde, p.isCombust, isHindi);
        const open = selected === p.name;
        return (
          <TouchableOpacity key={p.name} activeOpacity={0.85} onPress={() => setSelected(open ? null : p.name)}>
            <Card style={open ? { borderColor: Colors.primary, borderWidth: 1.5 } : undefined}>
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <View style={ui.row}>
                  <Text style={[styles.symbol, { color: PLANET_COLORS[p.name] }]}>{PLANET_SYMBOLS[p.name]}</Text>
                  <View>
                    <Text style={styles.name}>{tPlanet(p.name, isHindi)}</Text>
                    <Text style={ui.muted}>
                      {info.sanskrit} · {isHindi ? `भाव ${p.house} · ${tSign(p.sign, true)} में` : `House ${p.house} · in ${p.sign}`} · {p.degree}
                    </Text>
                  </View>
                </View>
                {open ? <ChevronUp size={18} color={Colors.textSub} /> : <ChevronDown size={18} color={Colors.textSub} />}
              </View>
              <View style={[ui.row, { marginTop: 8, flexWrap: 'wrap' }]}>
                {p.isRetrograde && <Text style={styles.tag}>{t('Retrograde', 'वक्री')}</Text>}
                {p.isCombust && <Text style={styles.tag}>{t('Combust', 'अस्त')}</Text>}
              </View>
              <Text style={styles.role}>{info.role}</Text>
              <Text style={styles.archetype}>{info.archetype}</Text>
              <Body style={{ marginTop: 6 }}>{info.narrative}</Body>

              {open && (
                <View style={{ gap: 12, marginTop: 12 }}>
                  <View style={ui.divider} />
                  <Section title={t('Core Theme', 'मुख्य विषय-वस्तु')} text={info.theme} />
                  {!!info.shadowTendency && <Section title={t('Shadow Tendency (Self-Awareness)', 'छाया प्रवृत्ति (आत्म-जागरूकता)')} text={info.shadowTendency} color="#9F1239" />}
                  {!!info.groundingGuidance && <Section title={t('Grounding Guidance', 'स्थिरता निर्देश')} text={info.groundingGuidance} color="#047857" />}
                  <Section title={t('Somatic Grounding Key', 'कायिक जुड़ाव सूत्र')} text={`"${info.somatic}"`} color="#4338CA" />
                </View>
              )}
              {!open && <Text style={styles.more}>{t('Read Somatic Key →', 'कायिक सूत्र पढ़ें →')}</Text>}
            </Card>
          </TouchableOpacity>
        );
      })}
    </Screen>
  );
}

function Section({ title, text, color = '#B45309' }: { title: string; text: string; color?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Eyebrow color={color}>{title}</Eyebrow>
      <Body>{text}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  symbol: { fontSize: 26, width: 34, textAlign: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  tag: { fontSize: 10, fontWeight: '800', color: '#9F1239', backgroundColor: '#FFF1F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  role: { fontSize: 11, fontWeight: '800', color: '#B45309', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 },
  archetype: { fontSize: 15, fontStyle: 'italic', color: Colors.textMain, marginTop: 2, fontFamily: 'serif' },
  more: { fontSize: 11, fontWeight: '800', color: Colors.primary, marginTop: 10 },
});
