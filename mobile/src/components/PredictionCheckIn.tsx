import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../constants/theme';

interface Due {
  id: string;
  domain: string;
  direction: 'favourable' | 'caution';
  confidence: 'firm' | 'moderate';
  reason: string;
  checkQuestion: string;
}
interface HitRate { answered: number; score: number | null }
interface Data { due: Due[]; upcoming: number; stats: { overall: HitRate; byConfidence: Record<string, HitRate> } }

const pct = (s: number | null) => (s === null ? null : `${Math.round(s * 100)}%`);

/**
 * Step C check-in (same as the web): once a predicted window has passed, ask
 * whether it matched, and show the measured track record after 5 answers.
 */
export default function PredictionCheckIn() {
  const { t } = useLanguage();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/predictions/accountability');
      if (r?.success) setData(r.data);
    } catch {
      // The check-in is optional; the chat works without it.
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const answer = async (id: string, outcome: string) => {
    setBusy(true);
    try {
      await api.post('/api/predictions/accountability', { id, outcome });
      await load();
    } catch {
      // Leave the question in place; the next load shows it again.
    } finally {
      setBusy(false);
    }
  };

  if (!data) return null;
  const { due, upcoming, stats } = data;
  if (!due.length && !upcoming && !stats.overall.answered) return null;

  const record = stats.overall.score !== null
    ? t(`Track record: ${pct(stats.overall.score)} from ${stats.overall.answered} check-ins`,
        `रिकॉर्ड: ${stats.overall.answered} जाँचों में ${pct(stats.overall.score)}`)
    : t(`Track record appears after 5 check-ins (${stats.overall.answered} so far)`,
        `5 जाँचों के बाद रिकॉर्ड दिखेगा (अब तक ${stats.overall.answered})`);
  const item = due[0];

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>{t('Prediction check-in', 'भविष्यवाणी जाँच')}</Text>
        <Text style={styles.record} numberOfLines={1}>
          {record}{upcoming ? t(` · ${upcoming} tracked`, ` · ${upcoming} लंबित`) : ''}
        </Text>
      </View>
      {item ? (
        <>
          <Text style={styles.question}>{item.checkQuestion}</Text>
          <Text style={styles.reason}>
            {item.direction === 'caution' ? t('Called a caution period', 'सावधानी का समय बताया गया') : t('Called a favourable period', 'अनुकूल समय बताया गया')}
            {` (${item.confidence}) — ${item.reason}.`}
          </Text>
          <View style={styles.row}>
            {([['yes', t('Yes', 'हाँ')], ['somewhat', t('Somewhat', 'कुछ हद तक')], ['no', t('No', 'नहीं')]] as const).map(([id, label]) => (
              <TouchableOpacity key={id} disabled={busy} onPress={() => answer(item.id, id)} style={[styles.btn, busy && styles.dim]}>
                <Text style={styles.btnText}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity disabled={busy} onPress={() => answer(item.id, 'skip')} style={busy && styles.dim}>
              <Text style={styles.skip}>{t('Not sure', 'पता नहीं')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.reason}>
          {t("Nothing to check right now — you'll be asked once a predicted window has passed.",
             'अभी जाँचने को कुछ नहीं — बताई गई अवधि बीतने पर पूछा जाएगा।')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFBF2', borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#92400E', letterSpacing: 1, textTransform: 'uppercase' },
  record: { flexShrink: 1, fontSize: 10, color: '#B45309' },
  question: { fontSize: 13, color: '#44403C', lineHeight: 18 },
  reason: { fontSize: 11, color: '#78716C' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 2 },
  btn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFFFF' },
  btnText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  skip: { fontSize: 12, color: '#78716C', paddingHorizontal: 4 },
  dim: { opacity: 0.5 },
});
