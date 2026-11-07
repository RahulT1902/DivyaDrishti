import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useChartData } from '../../hooks/useChartData';
import { Body, Bullets, Button, Card, ErrorView, Eyebrow, LoadingView, Screen, ui } from '../../components/ui';
import { formatMonthYear, tPlanet } from '../../lib/astro';
import { getLocalizedAvoid, getLocalizedFocus } from '../../lib/briefingHi';

// Port of the web DashaTimelineView, plus the full Mahadasha sequence from the
// chart API (the web view's "40% through" and fixed explainer are replaced with
// values computed from the real dasha dates).

export default function DashaScreen() {
  const { isHindi, t } = useLanguage();
  const router = useRouter();
  const { data, loading, error, reload } = useChartData();

  if (loading) return <LoadingView label={t('Reading your dasha...', 'आपकी दशा पढ़ी जा रही है...')} />;
  if (error || !data?.temporal) return <ErrorView message={error || 'No dasha data'} onRetry={reload} />;

  const { stack, timing } = data.temporal;
  const start = new Date(timing.startsAt).getTime();
  const end = new Date(timing.endsAt).getTime();
  const progress = Math.max(0, Math.min(1, (Date.now() - start) / Math.max(1, end - start)));
  const pressure = String(timing.pressure ?? '').toLowerCase();
  const pressureLabel = isHindi
    ? ({ high: 'सघन आत्म-मंथन काल', medium: 'मध्यम अनुशासन काल', low: 'सौम्य संरेखण काल' } as Record<string, string>)[pressure] || 'सक्रिय दशा संरेखण'
    : `${timing.pressure} Pressure Phase`;
  const timeline: any[] = data.timeline ?? [];
  const now = Date.now();
  const currentIdx = timeline.findIndex(d => new Date(d.start).getTime() <= now && now < new Date(d.end).getTime());
  const nextMd = currentIdx >= 0 ? timeline[currentIdx + 1] : null;

  return (
    <Screen onRefresh={reload}>
      <Card>
        <Eyebrow>{pressureLabel}</Eyebrow>
        <View style={styles.stack}>
          <Lord label={t('Mahadasha', 'महादशा')} name={tPlanet(stack.mahadasha, isHindi)} />
          <Text style={styles.slash}>/</Text>
          <Lord label={t('Antardasha', 'अंतर्दशा')} name={tPlanet(stack.antardasha, isHindi)} accent />
          {stack.pratyantar && (
            <>
              <Text style={styles.slash}>/</Text>
              <Lord label={t('Pratyantar', 'प्रत्यंतर')} name={tPlanet(stack.pratyantar, isHindi)} />
            </>
          )}
        </View>
        <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
        <Text style={ui.muted}>
          {isHindi
            ? `${tPlanet(stack.antardasha, true)} अंतर्दशा का ${Math.round(progress * 100)}% पूर्ण · ${formatMonthYear(timing.endsAt, true)} तक (${timing.remaining} शेष)`
            : `${Math.round(progress * 100)}% through ${stack.antardasha} antardasha · until ${formatMonthYear(timing.endsAt, false)} (${timing.remaining} left)`}
        </Text>
        {stack.nextAntardasha && (
          <Text style={[ui.muted, { marginTop: 4 }]}>
            {t('Next antardasha', 'अगली अंतर्दशा')}: {tPlanet(stack.nextAntardasha, isHindi)}
          </Text>
        )}
      </Card>

      {!!data.narrative && (
        <Card>
          <Eyebrow>{t('The Reading', 'पंडित जी का विवेचन')}</Eyebrow>
          <Body>{data.narrative}</Body>
        </Card>
      )}

      {data.insights && (
        <Card>
          <Eyebrow>{t('Current Reality', 'तात्कालिक वास्तविकता')}</Eyebrow>
          <Body>{data.insights.primary}</Body>
          {!!data.insights.caution && (
            <>
              <View style={ui.divider} />
              <Eyebrow color="#BE123C">{t('What to Watch', 'सावधानी')}</Eyebrow>
              <Body>{getLocalizedAvoid(data.insights.caution, isHindi)}</Body>
            </>
          )}
        </Card>
      )}

      {data.guidance && (
        <Card>
          <Eyebrow color="#047857">{t('Do More Of', 'इनका अधिक अभ्यास करें')}</Eyebrow>
          <Bullets items={data.guidance.do.map((s: string) => getLocalizedFocus(s, isHindi))} color="#064E3B" />
          <View style={ui.divider} />
          <Eyebrow color="#BE123C">{t('Practice Restraint', 'इनमें संयम बरतें')}</Eyebrow>
          <Bullets items={data.guidance.avoid.map((s: string) => getLocalizedAvoid(s, isHindi))} color="#881337" />
        </Card>
      )}

      <Card>
        <Eyebrow>{t('Mahadasha Timeline', 'महादशा समय-रेखा')}</Eyebrow>
        {timeline.map((d, i) => {
          const active = i === currentIdx;
          const past = new Date(d.end).getTime() <= now;
          return (
            <View key={d.start} style={styles.tlRow}>
              <View style={[styles.dot, active ? styles.dotActive : past ? styles.dotPast : null]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.tlName, active && { color: Colors.primary }, past && { opacity: 0.55 }]}>
                  {tPlanet(d.planet, isHindi)} {t('Mahadasha', 'महादशा')}{active ? t(' — now', ' — वर्तमान') : ''}
                </Text>
                <Text style={ui.muted}>{formatMonthYear(d.start, isHindi)} – {formatMonthYear(d.end, isHindi)}</Text>
              </View>
            </View>
          );
        })}
        {nextMd && (
          <Body style={{ marginTop: 8 }}>
            {isHindi
              ? `अगली महादशा ${tPlanet(nextMd.planet, true)} की होगी, जो ${formatMonthYear(nextMd.start, true)} से आरंभ होगी।`
              : `Your next Mahadasha is ${nextMd.planet}, beginning ${formatMonthYear(nextMd.start, false)}.`}
          </Body>
        )}
      </Card>

      <Button
        label={t('Ask the Pundit about this phase →', 'इस काल के बारे में पंडित जी से पूछें →')}
        onPress={() => router.push('/(tabs)/chat')}
      />
    </Screen>
  );
}

function Lord({ label, name, accent }: { label: string; name: string; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.lord, accent && { color: Colors.primary }]}>{name}</Text>
      <Text style={ui.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 10 },
  lord: { fontSize: 22, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  slash: { fontSize: 20, color: '#D6C7A8' },
  bar: { height: 6, backgroundColor: '#F5EFE0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: 6, backgroundColor: Colors.primary },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#D6C7A8' },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotPast: { backgroundColor: '#D6C7A8' },
  tlName: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
});
