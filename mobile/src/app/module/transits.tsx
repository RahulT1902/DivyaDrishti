import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useChartData } from '../../hooks/useChartData';
import { Body, Button, Card, ErrorView, Eyebrow, LoadingView, Pill, PillRow, Screen, ui } from '../../components/ui';
import NorthIndianChart, { PLANET_COLORS } from '../../components/NorthIndianChart';
import LifeDomainCard from '../../components/LifeDomainCard';
import { PLANET_SYMBOLS, getSignName, planetAbbr, tPlanet, tSign } from '../../lib/astro';

// Port of the web TransitsPage: live transits (filterable), the Gochar chart,
// cosmic climate, and the 12 transit-based life-domain predictions. The web
// page's fixed "Rahu in Pisces / Saturn in Aquarius" side panel is replaced by
// the live slow-planet positions.

type Filter = 'all' | 'supportive' | 'sensitive';

const natureOf = (tr: any): 'supportive' | 'sensitive' | 'neutral' => {
  const n = String(tr.nature ?? '').toLowerCase();
  if (/supportive|benefic|expansion/.test(n)) return 'supportive';
  if (/sensitive|friction|pressure|volatile|challeng|malefic|restrict/.test(n)) return 'sensitive';
  return 'neutral';
};

const WEIGHT: Record<string, { en: string; hi: string; enT: string; hiT: string }> = {
  Saturn: { en: 'Major Cycle', hi: 'दीर्घकालिक चक्र', enT: 'Active through year', hiT: 'वर्ष पर्यंत सक्रिय' },
  Rahu: { en: 'Major Cycle', hi: 'दीर्घकालिक चक्र', enT: 'Active through year', hiT: 'वर्ष पर्यंत सक्रिय' },
  Ketu: { en: 'Major Cycle', hi: 'दीर्घकालिक चक्र', enT: 'Active through year', hiT: 'वर्ष पर्यंत सक्रिय' },
  Jupiter: { en: 'Expansion Phase', hi: 'विस्तार प्रवाह', enT: 'Active through season', hiT: 'ऋतु चक्र पर्यंत' },
  Mars: { en: 'Medium Energy', hi: 'मध्यम ऊर्जा', enT: 'Active through month', hiT: 'मास पर्यंत सक्रिय' },
  Sun: { en: 'Medium Energy', hi: 'मध्यम ऊर्जा', enT: 'Active through month', hiT: 'मास पर्यंत सक्रिय' },
  Venus: { en: 'Medium Energy', hi: 'मध्यम ऊर्जा', enT: 'Active for weeks', hiT: 'कुछ सप्ताह सक्रिय' },
  Mercury: { en: 'Light Current', hi: 'सौम्य गति', enT: 'Fades in few weeks', hiT: 'कुछ सप्ताह में शिथिल' },
  Moon: { en: 'Passing Rhythm', hi: 'क्षणिक तरंग', enT: 'Fades in 2 days', hiT: 'दो दिनों में संक्रमण' },
};

export default function TransitsScreen() {
  const { isHindi, mode, t } = useLanguage();
  const { data, loading, error, reload } = useChartData();
  const [filter, setFilter] = useState<Filter>('all');
  const [domains, setDomains] = useState<any[] | null>(null);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsError, setDomainsError] = useState<string | null>(null);

  if (loading) return <LoadingView label={t('Reading the live sky...', 'गोचर पढ़ा जा रहा है...')} />;
  if (error || !data) return <ErrorView message={error || 'No chart data'} onRetry={reload} />;

  const transits: any[] = data.transitIntelligence?.transits ?? [];
  const climate = data.transitIntelligence?.climate;
  const lagnaSign = data.chart?.lagna?.sign ?? 1;
  const shown = transits.filter(tr => filter === 'all' || natureOf(tr) === filter || (filter === 'supportive' && natureOf(tr) === 'neutral'));

  const loadDomains = async () => {
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      const res = await api.get('/api/predictions/analyze', { timeframe: 'this-month', domain: 'growth', mode });
      setDomains(res?.predictions?.lifeDomainPredictions ?? []);
    } catch (err: any) {
      setDomainsError(err?.message || 'Failed to load predictions');
    } finally {
      setDomainsLoading(false);
    }
  };

  // Climate scores are 0–10 from the engine; the web page labels them on a 0–100 scale.
  const climateLabel = (kind: 'pressure' | 'opportunity' | 'volatility', v?: number) => {
    const score = (v ?? 5) * 10;
    const L = {
      pressure: [['Gentle Ease', 'सौम्य सुगमता'], ['Moderate Grounding', 'मध्यम स्थिरता'], ['Elevated Restraint', 'गहन अनुशासन']],
      opportunity: [['Quiet Flow', 'शांत प्रवाह'], ['Gradually Building', 'क्रमशः विकास'], ['Heightened Alignment', 'सघन संरेखण']],
      volatility: [['Calm Integration', 'शांत संतुलन'], ['Gentle Shifting', 'सौम्य परिवर्तन'], ['Active Volatility', 'सक्रिय परिवर्तन']],
    }[kind][score > 70 ? 2 : score > 40 ? 1 : 0];
    return isHindi ? L[1] : L[0];
  };

  return (
    <Screen onRefresh={reload}>
      {climate && (
        <Card style={{ backgroundColor: '#FFFBEB' }}>
          <Eyebrow>{t('✦ Cosmic Climate', '✦ गोचरीय जलवायु')}</Eyebrow>
          <Body style={{ fontStyle: 'italic' }}>{climate.headline}</Body>
          <View style={{ gap: 6, marginTop: 10 }}>
            <Climate label={t('Celestial Pressure', 'दैवीय अनुशासन (दबाव)')} value={climateLabel('pressure', climate.netPressure)} />
            <Climate label={t('Opportunities Aligning', 'सघन संरेखण (अवसर)')} value={climateLabel('opportunity', climate.netOpportunity)} />
            <Climate label={t('Atmospheric Volatility', 'ऊर्जा परिवर्तन (अस्थिरता)')} value={climateLabel('volatility', climate.netVolatility)} />
          </View>
        </Card>
      )}

      <Card>
        <Eyebrow>{t('Gochar Chart (from your Lagna)', 'गोचर कुंडली (जन्म लग्न से)')}</Eyebrow>
        <Text style={ui.muted}>{t('Natal Lagna', 'जन्म लग्न')}: {tSign(getSignName(lagnaSign), isHindi)}</Text>
        <NorthIndianChart
          lagnaSign={lagnaSign}
          tokens={transits.map(tr => ({
            house: tr.houseFromLagna,
            label: planetAbbr(tr.planet, isHindi) + (tr.retrograde ? '℞' : ''),
            color: PLANET_COLORS[tr.planet] ?? Colors.textMain,
          }))}
        />
      </Card>

      <PillRow>
        <Pill label={t('All Cycles', 'सभी गोचर')} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill label={t('Supportive', 'अनुकूल')} active={filter === 'supportive'} onPress={() => setFilter('supportive')} />
        <Pill label={t('Sensitive', 'संवेदनशील')} active={filter === 'sensitive'} onPress={() => setFilter('sensitive')} />
      </PillRow>

      {shown.length === 0 && <Body>{t('No active transits match this filter.', 'इस श्रेणी में कोई सक्रिय गोचर नहीं है।')}</Body>}
      {shown.map(tr => {
        const nature = natureOf(tr);
        const w = WEIGHT[tr.planet];
        return (
          <Card key={tr.planet}>
            <View style={[ui.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={ui.row}>
                <Text style={[styles.symbol, { color: PLANET_COLORS[tr.planet] }]}>{PLANET_SYMBOLS[tr.planet] ?? '✦'}</Text>
                <View>
                  <Text style={styles.name}>{tPlanet(tr.planet, isHindi)}</Text>
                  <Text style={ui.muted}>
                    {isHindi ? `${tr.houseFromLagna} भाव ✦ ${tSign(tr.sign, true)} ✦ ${tr.retrograde ? 'वक्री' : 'मार्गी'}` : `House ${tr.houseFromLagna} ✦ ${tr.sign} ✦ ${tr.retrograde ? 'Retrograde' : 'Direct'}`}
                  </Text>
                </View>
              </View>
              <Text style={[styles.badge, nature === 'sensitive' ? styles.sens : nature === 'supportive' ? styles.supp : styles.neut]}>
                {nature === 'sensitive' ? t('Sensitive', 'संवेदनशील') : nature === 'supportive' ? t('Supportive', 'अनुकूल') : t('Active', 'सक्रिय')}
              </Text>
            </View>
            <Body style={{ marginTop: 8 }}>
              {(isHindi && tr.whyItMattersHindi?.length ? tr.whyItMattersHindi : tr.whyItMatters ?? []).join(' ')}
            </Body>
            {w && <Text style={[ui.muted, { marginTop: 6 }]}>{isHindi ? `${w.hi} · ${w.hiT}` : `${w.en} · ${w.enT}`}</Text>}
          </Card>
        );
      })}

      <Card>
        <Eyebrow>{t('✦ Deep Vedic Intelligence', '✦ प्रगाढ़ वैदिक अंतर्दृष्टि')}</Eyebrow>
        <Text style={styles.name}>{t('Transit Based Predictions', 'गोचर आधारित भविष्यफल')}</Text>
        <Body style={{ marginVertical: 8 }}>
          {t('How the moving planets are touching each of your 12 life areas this month.', 'सक्रिय गोचर ग्रह इस माह आपके बारह जीवन क्षेत्रों को कैसे प्रभावित कर रहे हैं।')}
        </Body>
        {domains === null && (
          <Button
            label={domainsLoading ? t('Consulting the stars...', 'ग्रहों का संरेखण पढ़ा जा रहा है...') : t('🪔 Load Transit Predictions', '🪔 गोचर भविष्यफल देखें')}
            onPress={loadDomains}
            disabled={domainsLoading}
          />
        )}
        {domainsError && <Text style={{ color: '#BE123C', fontSize: 12, marginTop: 6 }}>{domainsError}</Text>}
      </Card>
      {domains?.map(d => <LifeDomainCard key={d.id} domain={d} />)}
    </Screen>
  );
}

function Climate({ label, value }: { label: string; value: string }) {
  return (
    <View style={[ui.row, { justifyContent: 'space-between' }]}>
      <Text style={ui.muted}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMain }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  symbol: { fontSize: 24, width: 30, textAlign: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  badge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  sens: { backgroundColor: '#FFF1F2', color: '#9F1239' },
  supp: { backgroundColor: '#FEF3C7', color: '#92400E' },
  neut: { backgroundColor: '#EEF2FF', color: '#3730A3' },
});
