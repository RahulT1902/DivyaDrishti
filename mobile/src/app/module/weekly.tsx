import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Body, Card, Eyebrow, LoadingView, Screen, ui } from '../../components/ui';

// Port of the web WeeklyRhythmPage: the last 7 days of logged reflections,
// with today's panchang, and the observational notes that accompany them.

interface Log { id: string; date: string; energy: 'HIGH' | 'NEUTRAL' | 'LOW'; stress: 'LOW' | 'MEDIUM' | 'HIGH'; notes?: string }

export default function WeeklyScreen() {
  const { isHindi, lang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Log[]>([]);
  const [panchang, setPanchang] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [h, p] = await Promise.all([
        api.get('/api/reflections/history').catch(() => null),
        api.get('/api/panchang/today', { language: lang }).catch(() => null),
      ]);
      if (h?.success) setHistory(h.history || []);
      if (p?.success) setPanchang(p.panchang);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingView label={t('Computing Temporal Correlations...', 'सामयिक सहसंबंधों का विश्लेषण किया जा रहा है...')} />;

  const weekdays = isHindi ? ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - k));
    return { d, log: history.find(h => dayKey(new Date(h.date)) === dayKey(d)) ?? null, today: k === 6 };
  });
  const logged = days.filter(x => x.log).length;
  const highEnergy = history.filter(h => h.energy === 'HIGH').length;
  const highStress = history.filter(h => h.stress === 'HIGH').length;

  return (
    <Screen onRefresh={load}>
      <Card style={{ backgroundColor: '#FFFBEB' }}>
        <Eyebrow>{t('Personalised Temporal Intelligence', 'व्यक्तिगत समय-चक्र विवेचन')}</Eyebrow>
        <View style={[ui.row, { justifyContent: 'space-between' }]}>
          <Text style={ui.muted}>{t('Logging consistency', 'लॉगिंग निरंतरता')}</Text>
          <Text style={styles.strong}>{logged}/7 {t('days', 'दिन')}</Text>
        </View>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${(logged / 7) * 100}%` }]} /></View>
        <View style={[ui.row, { justifyContent: 'space-between', marginTop: 8 }]}>
          <Text style={{ fontSize: 12, color: '#047857' }}>{t(`Vitality peaks: ${highEnergy} days`, `उच्च प्राण ऊर्जा: ${highEnergy} दिन`)}</Text>
          <Text style={{ fontSize: 12, color: '#BE123C' }}>{t(`Tension spikes: ${highStress} days`, `आंतरिक तनाव: ${highStress} दिन`)}</Text>
        </View>
        {logged === 0 && (
          <Body style={{ marginTop: 10, fontSize: 13 }}>
            {t('Log your evening reflection on the Daily tab to start seeing your weekly rhythm.', 'अपनी साप्ताहिक लय देखने के लिए दैनिक टैब पर संध्या मनन दर्ज करें।')}
          </Body>
        )}
      </Card>

      <Eyebrow>{t('Week at a Glance', 'साप्ताहिक संरेखण')}</Eyebrow>
      {days.map(({ d, log, today }) => (
        <Card key={d.toISOString()} style={today ? { borderColor: Colors.primary } : undefined}>
          <View style={[ui.row, { justifyContent: 'space-between' }]}>
            <View style={ui.row}>
              <Text style={styles.day}>{weekdays[d.getDay()]}</Text>
              <Text style={styles.dayNum}>{d.getDate()}</Text>
              {today && <Text style={styles.today}>{t('Today', 'आज')}</Text>}
            </View>
            {log ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: log.energy === 'HIGH' ? '#047857' : log.energy === 'NEUTRAL' ? '#B45309' : '#4338CA' }}>
                  {t('Vitality', 'प्राण')}: {log.energy === 'HIGH' ? t('⚡ High', '⚡ उच्च') : log.energy === 'NEUTRAL' ? t('😐 Mid', '😐 मध्यम') : t('💤 Low', '💤 निम्न')}
                </Text>
                <Text style={{ fontSize: 12, color: log.stress === 'LOW' ? '#047857' : log.stress === 'MEDIUM' ? '#B45309' : '#BE123C' }}>
                  {t('Tension', 'तनाव')}: {log.stress === 'LOW' ? t('🟢 Calm', '🟢 शांत') : log.stress === 'MEDIUM' ? t('🟡 Mid', '🟡 मध्यम') : t('🔴 Tight', '🔴 तीव्र')}
                </Text>
              </View>
            ) : (
              <Text style={ui.muted}>{t('No reflection', 'कोई प्रविष्टि नहीं')}</Text>
            )}
          </View>
          {today && panchang && (
            <Text style={[ui.muted, { marginTop: 6 }]}>
              {panchang.nakshatra} · {panchang.paksha} {panchang.tithi} · {panchang.yoga}
            </Text>
          )}
          {!!log?.notes && <Body style={{ marginTop: 6, fontSize: 13, fontStyle: 'italic' }}>"{log.notes}"</Body>}
        </Card>
      ))}

      <Card>
        <Eyebrow>{t('Observed Energetic Patterns', 'अवलोकित ऊर्जावान विन्यास')}</Eyebrow>
        <Body>
          {t(
            "In Vedic Jyotish, the Moon's transit through the Nakshatras is read as the ambient emotional climate — not a ruler of your experience. Compare the days you felt energised or tense with the nakshatra of that day to learn your own rhythm.",
            'वैदिक ज्योतिष में नक्षत्रों से चंद्रमा का गोचर भावनात्मक वातावरण का संकेत माना जाता है — आपके अनुभव का नियंत्रक नहीं। जिन दिनों आप ऊर्जावान या तनावग्रस्त रहे, उन्हें उस दिन के नक्षत्र से मिलाकर अपनी लय पहचानें।',
          )}
        </Body>
        <View style={ui.divider} />
        <Text style={ui.muted}>
          {t('Remember: transits reflect the environmental climate. Your daily reflections reflect your reaction. Mastery lies in quiet containment.', 'स्मरण रखें: गोचर बाहरी वातावरण दर्शाता है, आपके दैनिक मनन आपकी प्रतिक्रिया। संयम में ही सिद्धि है।')}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strong: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  bar: { height: 6, backgroundColor: '#F5EFE0', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  barFill: { height: 6, backgroundColor: Colors.primary },
  day: { fontSize: 12, fontWeight: '800', color: '#B45309', textTransform: 'uppercase', width: 40 },
  dayNum: { fontSize: 18, fontWeight: '700', color: Colors.textMain },
  today: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
});
