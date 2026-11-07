import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { Body, Bullets, Card, Eyebrow, ui } from './ui';

// One of the 12 transit-based life-domain readings from /api/predictions/analyze
// (lifeDomainPredictions). Mirrors the domain cards in the web TransitsPage.

const STRENGTH = {
  supportive: { bg: '#ECFDF5', fg: '#065F46', en: 'Supportive', hi: 'अनुकूल' },
  sensitive: { bg: '#FFF1F2', fg: '#9F1239', en: 'Sensitive', hi: 'संवेदनशील' },
  neutral: { bg: '#F5F5F4', fg: '#44403C', en: 'Neutral', hi: 'सामान्य' },
} as const;

export default function LifeDomainCard({ domain }: { domain: any }) {
  const { isHindi, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const s = STRENGTH[domain.strength as keyof typeof STRENGTH] ?? STRENGTH.neutral;
  const status = isHindi ? domain.statusLabelHindi || s.hi : domain.statusLabel || s.en;
  const mostActive = domain.emphasisTag === 'Most Active';
  const why = domain.whyThisMatters;

  return (
    <Card style={mostActive ? { borderColor: '#DCA842', borderWidth: 1.5 } : undefined}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={[ui.row, { alignItems: 'flex-start' }]}>
        <Text style={{ fontSize: 24 }}>{domain.icon}</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title}>{isHindi ? domain.titleHindi : domain.title}</Text>
          <View style={[ui.row, { flexWrap: 'wrap', gap: 6 }]}>
            <Text style={[styles.badge, { backgroundColor: s.bg, color: s.fg }]}>{status}</Text>
            {domain.emphasisTag && (
              <Text style={[styles.badge, mostActive ? styles.active : styles.influenced]}>
                {isHindi ? domain.emphasisTagHindi : domain.emphasisTag}
              </Text>
            )}
          </View>
        </View>
        {open ? <ChevronUp size={18} color={Colors.textSub} /> : <ChevronDown size={18} color={Colors.textSub} />}
      </TouchableOpacity>

      {!open && domain.activatedPatterns?.[0] && (
        <Body style={{ marginTop: 8, fontSize: 13 }}>
          {domain.activatedPatterns[0]}
          {domain.activatedPatterns.length > 1 ? t(`  +${domain.activatedPatterns.length - 1} more`, `  +${domain.activatedPatterns.length - 1} और`) : ''}
        </Body>
      )}

      {open && (
        <View style={{ gap: 12, marginTop: 12 }}>
          {(domain.confidenceTone || domain.timingWindow) && (
            <View style={styles.meta}>
              {domain.confidenceTone && (
                <Text style={ui.muted}>{t('Activation', 'प्रभाव तीव्रता')}: <Text style={styles.metaStrong}>{isHindi ? domain.confidenceToneHindi : domain.confidenceTone}</Text></Text>
              )}
              {domain.timingWindow && (
                <Text style={ui.muted}>{t('Timeline', 'समय सीमा')}: <Text style={styles.metaStrong}>{isHindi ? domain.timingWindowHindi : domain.timingWindow}</Text></Text>
              )}
            </View>
          )}
          {!!domain.narrative && (
            <View style={styles.narrative}>
              <Eyebrow>{t("Pundit's Reading", 'पंडित जी का मार्गदर्शन')}</Eyebrow>
              <Body>{domain.narrative}</Body>
            </View>
          )}
          {why && (
            <View style={{ gap: 10 }}>
              <Why icon="🪐" title={t('Transit Reasoning', 'गोचरीय कारण')} text={isHindi ? why.transitReasoningHindi : why.transitReasoning} />
              <Why icon="⏳" title={t('Dasha Influence', 'दशा चक्र प्रभाव')} text={isHindi ? why.dashaInfluenceHindi : why.dashaInfluence} />
              <Why icon="✅" title={t('Practical Action', 'व्यावहारिक कदम')} text={isHindi ? why.practicalInterpretationHindi : why.practicalInterpretation} />
              <Why icon="⚓" title={t('Internal Calm', 'आंतरिक संतुलन')} text={isHindi ? why.emotionalGuidanceHindi : why.emotionalGuidance} />
            </View>
          )}
          {domain.activatedPatterns?.length > 0 && (
            <View>
              <Eyebrow>{t('Active Transit Signals', 'सक्रिय गोचर संकेत')}</Eyebrow>
              <Bullets items={domain.activatedPatterns} marker="✦" />
            </View>
          )}
          {!!domain.caution && (
            <View style={styles.caution}>
              <Text style={{ fontSize: 13, color: '#9F1239' }}>⚠️ {t('Caution', 'सावधानी')}: {domain.caution}</Text>
            </View>
          )}
          <Text style={ui.muted}>
            {t('Primary planet', 'मुख्य ग्रह')}: <Text style={styles.metaStrong}>{domain.primaryPlanet}</Text>
            {domain.planetSignals?.length ? `  ·  ${domain.planetSignals.join(' · ')}` : ''}
          </Text>
        </View>
      )}
    </Card>
  );
}

function Why({ icon, title, text }: { icon: string; title: string; text?: string }) {
  if (!text) return null;
  return (
    <View style={styles.why}>
      <Text style={styles.whyTitle}>{icon} {title}</Text>
      <Body style={{ fontSize: 13 }}>{text}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  badge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  active: { backgroundColor: '#FEF3C7', color: '#92400E' },
  influenced: { backgroundColor: '#EEF2FF', color: '#3730A3' },
  meta: { gap: 4, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10 },
  metaStrong: { fontWeight: '700', color: Colors.textMain },
  narrative: { backgroundColor: '#FFFDF9', borderLeftWidth: 3, borderLeftColor: Colors.primary, padding: 10, borderRadius: 6 },
  why: { backgroundColor: '#FAF7F0', borderRadius: 10, padding: 10, gap: 4 },
  whyTitle: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  caution: { backgroundColor: '#FFF1F2', borderRadius: 10, padding: 10 },
});
