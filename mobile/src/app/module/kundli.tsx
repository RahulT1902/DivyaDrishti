import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useChartData } from '../../hooks/useChartData';
import { Body, Card, ErrorView, Eyebrow, LoadingView, Pill, PillRow, Screen, ui } from '../../components/ui';
import NorthIndianChart, { PLANET_COLORS } from '../../components/NorthIndianChart';
import {
  PLANET_SYMBOLS, SIGN_LORDS, buildDisplayPlanets, formatMonthYear, getSignName, nakshatraOf,
  planetAbbr, tPlanet, tSign, tStatus,
} from '../../lib/astro';

// Port of the web KundliPage. The web version shows some fixed sample text
// (e.g. "Rahu in Pisces, 10th house"); here every section comes from the chart.

type View_ = 'lagna' | 'planets' | 'dasha' | 'transit';

export default function KundliScreen() {
  const { isHindi, t } = useLanguage();
  const { data, loading, error, reload } = useChartData();
  const [view, setView] = useState<View_>('lagna');

  if (loading) return <LoadingView label={t('Aligning Sacred Birth Chart...', 'जन्म कुंडली संरेखित हो रही है...')} />;
  if (error || !data?.chart) return <ErrorView message={error || 'No chart data'} onRetry={reload} />;

  const chart = data.chart;
  const lagnaSign = chart.lagna.sign;
  const lagnaName = getSignName(lagnaSign);
  const planets = buildDisplayPlanets(chart);
  const moon = chart.planets.find((p: any) => p.name === 'Moon');
  const moonSign = moon ? getSignName(moon.sign) : '';
  const stack = data.temporal?.stack ?? {};
  const md = stack.mahadasha;
  const lagnaLord = SIGN_LORDS[lagnaName];

  const tokens = planets.map(p => ({
    house: p.house,
    label: planetAbbr(p.name, isHindi) + (p.isRetrograde ? '℞' : ''),
    color: PLANET_COLORS[p.name] ?? Colors.textMain,
  }));

  const supportive = planets.filter(p => p.name !== 'Lagna' && ['Dominant', 'Strong', 'Exalted', 'Vargottama'].includes(p.status));
  const sensitive = planets.filter(p => ['Combust', 'Retrograde', 'Debilitated'].includes(p.status) || ['Rahu', 'Ketu'].includes(p.name));
  const transits: any[] = data.transitIntelligence?.transits ?? [];
  const slow = transits.filter(tr => ['Saturn', 'Jupiter', 'Rahu', 'Ketu'].includes(tr.planet));

  return (
    <Screen onRefresh={reload}>
      <Text style={styles.subtitle}>
        {isHindi
          ? `${tSign(lagnaName, true)} लग्न • ${tPlanet(md, true)} महादशा • चंद्र ${tSign(moonSign, true)} राशि में`
          : `${lagnaName} Ascendant • ${md} Mahadasha • Moon in ${moonSign}`}
      </Text>

      <PillRow>
        {([
          ['lagna', t('Birth Chart', 'जन्म कुंडली')],
          ['planets', t('Planets', 'ग्रह स्थिति')],
          ['dasha', t('Dasha', 'दशा काल')],
          ['transit', t('Transit', 'गोचर')],
        ] as [View_, string][]).map(([id, label]) => (
          <Pill key={id} label={label} active={view === id} onPress={() => setView(id)} />
        ))}
      </PillRow>

      {view === 'lagna' && (
        <>
          <Card>
            <Eyebrow>{t('Lagna Chart (North Indian)', 'लग्न कुंडली (उत्तर भारतीय शैली)')}</Eyebrow>
            <NorthIndianChart lagnaSign={lagnaSign} tokens={tokens} />
            <Text style={[ui.muted, { textAlign: 'center', marginTop: 8 }]}>
              {t('Numbers are signs (1 = Aries). ℞ = retrograde.', 'संख्याएँ राशियाँ हैं (1 = मेष)। ℞ = वक्री।')}
            </Text>
          </Card>

          <Card>
            <Eyebrow>{t('✦ Astrological DNA', '✦ ज्योतिषीय रूपरेखा')}</Eyebrow>
            <View style={styles.grid}>
              <Fact label={t('Lagna Lord', 'लग्न स्वामी')} value={`${tPlanet(lagnaLord, isHindi)} ${PLANET_SYMBOLS[lagnaLord] ?? ''}`} />
              <Fact label={t('Moon Nakshatra', 'चंद्र नक्षत्र')} value={moon ? nakshatraOf(moon.longitude) : '—'} />
              <Fact label={t('Moon Sign', 'चंद्र राशि')} value={`${tSign(moonSign, isHindi)} ☾`} />
              <Fact label={t('Current Dasha', 'सक्रिय दशा')} value={`${tPlanet(md, isHindi)} / ${tPlanet(stack.antardasha, isHindi)}`} />
            </View>
          </Card>

          <Card>
            <Eyebrow>{t('✦ Why This Matters', '✦ प्रभाव एवं महत्व')}</Eyebrow>
            <Body>
              {isHindi
                ? `आपका ${tSign(lagnaName, true)} लग्न और सक्रिय ${tPlanet(md, true)} महादशा इस समय आपके जीवन की दिशा तय कर रहे हैं। लग्न स्वामी ${tPlanet(lagnaLord, true)} की स्थिति और दशा स्वामी के भाव मिलकर बताते हैं कि यह काल किन विषयों को सक्रिय करेगा।`
                : `Your ${lagnaName} ascendant sets how you meet the world, and the active ${md} Mahadasha decides which parts of the chart are switched on right now. Read the lagna lord ${lagnaLord} and the dasha lords together to see which life areas this period emphasises.`}
            </Body>
          </Card>

          <Card>
            <Eyebrow color="#047857">{t('✦ Supportive Influences', '✦ अनुकूल प्रभाव')}</Eyebrow>
            <Body>
              {supportive.length
                ? supportive.map(p => `${PLANET_SYMBOLS[p.name]} ${tPlanet(p.name, isHindi)} (${tStatus(p.status, isHindi)})`).join('   ')
                : t('Calm environmental integration', 'संतुलित प्राकृतिक वातावरण')}
            </Body>
            <View style={ui.divider} />
            <Eyebrow color="#BE123C">{t('✦ Sensitive Areas', '✦ संवेदनशील क्षेत्र')}</Eyebrow>
            <Body>
              {sensitive.length
                ? sensitive.map(p => `${PLANET_SYMBOLS[p.name]} ${tPlanet(p.name, isHindi)}${p.status && p.status !== 'Neutral' ? ` (${tStatus(p.status, isHindi)})` : ''}`).join('   ')
                : t('No high-stress indicators active', 'कोई तनाव संकेत सक्रिय नहीं है')}
            </Body>
          </Card>

          {slow.length > 0 && (
            <Card>
              <Eyebrow>{t('Current Planetary Influences', 'वर्तमान ग्रहीय प्रभाव')}</Eyebrow>
              <View style={{ gap: 12 }}>
                {slow.map(tr => (
                  <View key={tr.planet}>
                    <Text style={styles.factValue}>
                      {PLANET_SYMBOLS[tr.planet]} {isHindi
                        ? `${tSign(tr.sign, true)} में ${tPlanet(tr.planet, true)} (भाव ${tr.houseFromLagna})`
                        : `${tr.planet} in ${tr.sign} (House ${tr.houseFromLagna})`}
                      {tr.retrograde ? ' ℞' : ''}
                    </Text>
                    <Body>{(isHindi && tr.whyItMattersHindi?.[0]) || tr.whyItMatters?.slice(0, 2).join(' ')}</Body>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </>
      )}

      {view === 'planets' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={[styles.tr, styles.th]}>
            {[t('Planet', 'ग्रह'), t('Sign', 'राशि'), t('House', 'भाव'), t('Degree', 'अंश')].map((h, i) => (
              <Text key={h} style={[styles.thText, i === 0 && { flex: 1.3 }]}>{h}</Text>
            ))}
          </View>
          {planets.map(p => (
            <View key={p.name} style={styles.tr}>
              <View style={{ flex: 1.3 }}>
                <Text style={[styles.td, { fontWeight: '700', color: PLANET_COLORS[p.name] }]}>
                  {PLANET_SYMBOLS[p.name]} {tPlanet(p.name, isHindi)}
                </Text>
                {!!p.status && p.status !== 'Neutral' && <Text style={styles.status}>{tStatus(p.status, isHindi)}</Text>}
              </View>
              <Text style={styles.td}>{tSign(p.sign, isHindi)}</Text>
              <Text style={styles.td}>{p.house}</Text>
              <Text style={styles.td}>{p.degree}</Text>
            </View>
          ))}
        </Card>
      )}

      {view === 'dasha' && (
        <>
          <Card style={{ alignItems: 'center' }}>
            <Eyebrow>{t('Active Mahadasha', 'सक्रिय महादशा')}</Eyebrow>
            <Text style={styles.big}>{tPlanet(md, isHindi)}</Text>
            <Text style={ui.muted}>
              {t('Antardasha', 'अंतर्दशा')}: {tPlanet(stack.antardasha, isHindi)}
              {stack.pratyantar ? ` · ${t('Pratyantar', 'प्रत्यंतर')}: ${tPlanet(stack.pratyantar, isHindi)}` : ''}
            </Text>
            <Text style={[ui.muted, { marginTop: 4 }]}>
              {t('Antardasha ends', 'अंतर्दशा समाप्ति')}: {formatMonthYear(data.temporal?.timing?.endsAt, isHindi)} ({data.temporal?.timing?.remaining})
            </Text>
          </Card>
          <Card>
            <Eyebrow>{t('Mahadasha Sequence', 'महादशा क्रम')}</Eyebrow>
            {(data.timeline ?? []).map((d: any) => {
              const now = Date.now();
              const active = new Date(d.start).getTime() <= now && now < new Date(d.end).getTime();
              return (
                <View key={d.start} style={[styles.dashaRow, active && styles.dashaActive]}>
                  <Text style={[styles.factValue, active && { color: Colors.primary }]}>
                    {tPlanet(d.planet, isHindi)}{active ? t(' — Current', ' — वर्तमान') : ''}
                  </Text>
                  <Text style={ui.muted}>{formatMonthYear(d.start, isHindi)} – {formatMonthYear(d.end, isHindi)}</Text>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {view === 'transit' && transits.slice(0, 9).map(tr => (
        <Card key={tr.planet}>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.factValue}>{PLANET_SYMBOLS[tr.planet]} {tPlanet(tr.planet, isHindi)}{tr.retrograde ? ' ℞' : ''}</Text>
            <Text style={styles.badge}>{t(`House ${tr.houseFromLagna}`, `भाव ${tr.houseFromLagna}`)}</Text>
          </View>
          <Text style={ui.muted}>{t(`in ${tr.sign}`, `${tSign(tr.sign, true)} राशि में`)}</Text>
          <Body style={{ marginTop: 6 }}>{(isHindi && tr.whyItMattersHindi?.[0]) || tr.whyItMatters?.[0]}</Body>
        </Card>
      ))}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={ui.muted}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: Colors.textSub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fact: { width: '47%', backgroundColor: '#FFFBEB', borderRadius: 12, padding: 10, gap: 2 },
  factValue: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5EFE0' },
  th: { backgroundColor: '#FFFBEB' },
  thText: { flex: 1, fontSize: 11, fontWeight: '800', color: '#B45309', textTransform: 'uppercase' },
  td: { flex: 1, fontSize: 13, color: Colors.textMain },
  status: { fontSize: 10, color: '#B45309', marginTop: 1 },
  big: { fontSize: 30, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif', marginVertical: 4 },
  dashaRow: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dashaActive: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  badge: { fontSize: 11, fontWeight: '700', color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
});
