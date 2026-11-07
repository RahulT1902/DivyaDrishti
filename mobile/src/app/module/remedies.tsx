import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useChartData } from '../../hooks/useChartData';
import { Body, Button, Card, ErrorView, Eyebrow, LoadingView, Screen, ui } from '../../components/ui';
import { tPlanet } from '../../lib/astro';
import { getDashaRemedies, getNatalFrictionRemedies, type Remedy } from '../../lib/remedies';

// Port of the web RemediesPage.

const ACCENT: Record<string, string> = {
  indigo: '#4338CA', amber: '#B45309', orange: '#C2410C', emerald: '#047857', purple: '#7E22CE', rose: '#BE123C',
};

export default function RemediesScreen() {
  const { isHindi, t } = useLanguage();
  const router = useRouter();
  const { data, loading, error, reload } = useChartData();

  if (loading) return <LoadingView label={t('Preparing your remedies...', 'आपके उपाय तैयार हो रहे हैं...')} />;
  if (error || !data) return <ErrorView message={error || 'No chart data'} onRetry={reload} />;

  const md = data.temporal?.stack?.mahadasha || 'Saturn';
  const ad = data.temporal?.stack?.antardasha || 'Jupiter';
  const friction = getNatalFrictionRemedies(data, isHindi);
  const remedies = getDashaRemedies(md, ad, isHindi);

  return (
    <Screen onRefresh={reload}>
      <Text style={styles.subtitle}>
        {isHindi
          ? `आपके वर्तमान ${tPlanet(md, true)} / ${tPlanet(ad, true)} दशा चक्र के अनुकूल कायिक एवं व्यवहारिक उपाय`
          : `Somatic & behavioural alignment for your ${md} / ${ad} cycle`}
      </Text>

      <Card style={{ backgroundColor: '#FFFBEB' }}>
        <Eyebrow>{t('About Vedic Alignment', 'वैदिक संरेखण के विषय में')}</Eyebrow>
        <Body>
          {t(
            'In classical Vedic Jyotish, remedies are not transactions or superstitious cures. They are somatic, behavioural pivots designed to stabilise the nervous system and build conscious discipline.',
            'पारंपरिक वैदिक ज्योतिष में उपाय कोई अंधविश्वास या बाहरी कर्मकांड नहीं हैं। ये तंत्रिका तंत्र को स्थिर करने और सचेत अनुशासन विकसित करने के व्यवहारिक साधन हैं।',
          )}
        </Body>
      </Card>

      {friction.length > 0 && (
        <>
          <Eyebrow color="#BE123C">{t('Natal Chart Friction Areas — Priority', 'जन्म-चार्ट घर्षण क्षेत्र — प्राथमिकता')}</Eyebrow>
          {friction.map((r, i) => <RemedyCard key={`f${i}`} remedy={r} />)}
        </>
      )}

      {remedies.map((r, i) => <RemedyCard key={i} remedy={r} />)}

      <Card style={{ alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 28 }}>📿</Text>
        <Text style={styles.ctaTitle}>{t('Seek Personalised Clarification?', 'व्यक्तिगत मार्गदर्शन चाहिए?')}</Text>
        <Body style={{ textAlign: 'center' }}>
          {t(
            'If you are going through an intense period of delay or decision friction, consult the Pundit for grounded advice on your active dasha.',
            'यदि आप किसी गंभीर विलंब या निर्णय की उलझन से गुजर रहे हैं, तो अपनी सक्रिय दशा पर पंडित जी से परामर्श लें।',
          )}
        </Body>
        <Button label={t('Ask the Pundit →', 'पंडित जी से संवाद करें →')} onPress={() => router.push('/(tabs)/chat')} />
      </Card>
    </Screen>
  );
}

function RemedyCard({ remedy }: { remedy: Remedy }) {
  const color = ACCENT[remedy.color] ?? ACCENT.indigo;
  return (
    <Card>
      <View style={ui.row}>
        <Text style={{ fontSize: 26 }}>{remedy.icon}</Text>
        <View style={{ flex: 1 }}>
          <Eyebrow color={color}>{remedy.category}</Eyebrow>
          <Text style={styles.title}>{remedy.title}</Text>
        </View>
      </View>
      <Body style={{ marginTop: 8 }}>{remedy.description}</Body>
      <View style={[styles.detail, { borderLeftColor: color }]}>
        <Body style={{ fontSize: 13 }}>{remedy.detail}</Body>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, color: Colors.textSub },
  title: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  detail: { marginTop: 10, borderLeftWidth: 3, paddingLeft: 10, backgroundColor: '#FFFDFB', paddingVertical: 6, borderRadius: 4 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
});
