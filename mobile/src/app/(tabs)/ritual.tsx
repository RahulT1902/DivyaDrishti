import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Compass, Moon, ShieldAlert, Sparkles, Sun, X } from 'lucide-react-native';
import { api, getApiUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Colors } from '../../constants/theme';
import { Body, Bullets, Button, Card, ErrorView, Eyebrow, LoadingView, Pill, Screen, Title, ui } from '../../components/ui';
import { getLocalizedAvoid, getLocalizedFocus, getLocalizedHeadline } from '../../lib/briefingHi';
import {
  KARANA_QUALITIES, KARANA_QUALITIES_HI, LIMB_LABELS, NAKSHATRA_QUALITIES, NAKSHATRA_QUALITIES_HI, SLOT_LABELS,
  TITHI_QUALITIES, TITHI_QUALITIES_HI, VARA_MEANING_EN, VARA_MEANING_HI, YOGA_QUALITIES, YOGA_QUALITIES_HI,
  getTodayFavors,
} from '../../lib/panchangFormatter';

// Port of the web DailyRitualPage: morning brief, panchang almanac and evening reflection.

type Energy = 'HIGH' | 'NEUTRAL' | 'LOW';
type Stress = 'LOW' | 'MEDIUM' | 'HIGH';

export default function DailyScreen() {
  const { isHindi, lang, mode, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [panchang, setPanchang] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [evening, setEvening] = useState(new Date().getHours() >= 16);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [g, p] = await Promise.all([
        api.get('/api/guidance/daily', { mode }),
        api.get('/api/panchang/today', { language: lang }),
      ]);
      if (!g?.success) throw new Error(g?.error || 'Failed to load daily briefing');
      setBriefing(g.briefing);
      if (g.userName) setUserName(g.userName);
      if (p?.success) setPanchang(p.panchang);
    } catch (err: any) {
      setError(err?.message || t('Failed to establish ritual space. Please retry.', 'दैनिक अनुष्ठान लोड नहीं हो सका। पुनः प्रयास करें।'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, lang]);

  useEffect(() => {
    AsyncStorage.getItem('divya:userName').then(n => { if (n) setUserName(prev => prev || n); }).catch(() => {});
    load();
  }, [load]);

  if (loading) return <LoadingView label={t('Opening Sacred Timeline...', 'पावन समय-रेखा खोली जा रही है...')} />;
  if (error && !briefing) return <ErrorView message={error} onRetry={() => { setLoading(true); load(); }} retryLabel={t('Retry', 'पुनः प्रयास')} />;

  const date = new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.greeting}>
          {evening ? t('Peaceful Evening,', 'शांत संध्या,') : t('Blessed Morning,', 'मंगलमय प्रभात,')}{' '}
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>{userName || t('Seeker', 'साधक')}</Text>
        </Text>
        <View style={ui.row}>
          <Compass size={13} color={Colors.primary} />
          <Text style={ui.muted}>{date}</Text>
        </View>
        <TouchableOpacity style={styles.ambience} onPress={() => setEvening(e => !e)}>
          {evening ? <Moon size={13} color="#4338CA" /> : <Sun size={13} color={Colors.primary} />}
          <Text style={[styles.ambienceText, evening && { color: '#4338CA' }]}>
            {evening ? t('Moonlit Deep', 'चंद्रमा की गहनता') : t('Sunrise Warmth', 'सूर्योदय की ऊष्मा')}
          </Text>
        </TouchableOpacity>
      </View>

      {briefing && <BriefCard briefing={briefing} />}
      {panchang && <PanchangCard panchang={panchang} />}
      <ReflectionCard />
    </Screen>
  );
}

function BriefCard({ briefing }: { briefing: any }) {
  const { isHindi, t } = useLanguage();
  const [showCard, setShowCard] = useState(false);
  const [cardSource, setCardSource] = useState<any>(null);
  const [cardError, setCardError] = useState(false);
  const isWarrior = briefing.executionMode === 'WARRIOR';

  // The card endpoint needs the Bearer token; RN Image can send headers directly.
  const openCard = async () => {
    setCardError(false);
    const [base, token] = await Promise.all([getApiUrl(), AsyncStorage.getItem('divya:token')]);
    setCardSource({ uri: `${base}/api/cosmic-card?d=${new Date().toISOString().slice(0, 10)}`, headers: { Authorization: `Bearer ${token}` } });
    setShowCard(true);
  };

  return (
    <>
      <View style={{ gap: 8 }}>
        <Eyebrow>{t('Theme of the Day', 'आज का भाव')}</Eyebrow>
        <Text style={styles.headline}>{getLocalizedHeadline(briefing.headline, isHindi)}</Text>
        <View style={[styles.modeBadge, isWarrior ? styles.warrior : styles.architect]}>
          <Compass size={11} color={isWarrior ? '#92400E' : '#3730A3'} />
          <Text style={[styles.modeText, { color: isWarrior ? '#92400E' : '#3730A3' }]}>
            {isWarrior ? t('Warrior Style • Decisive Focus', 'निर्णायक ऊर्जा') : t('Architect Style • Structured Consolidation', 'संरचित स्थिरता')}
          </Text>
        </View>
      </View>

      <Card>
        <Eyebrow>{t('Celestial Directive', 'आकाशीय निर्देश')}</Eyebrow>
        <Body>
          {t(
            'Practice strategic restraint. Channel your momentum primarily into consolidating core goals rather than scattering energy into new initiatives.',
            'रणनीतिक संयम का अभ्यास करें। अपनी ऊर्जा को नई पहलों में बिखेरने के बजाय मुख्य लक्ष्यों को सुदृढ़ करने में केंद्रित करें।',
          )}
        </Body>
        {(briefing.memoryInfluence || briefing.transitionAlert) && <View style={ui.divider} />}
        {briefing.memoryInfluence && (
          <Body style={styles.italic}>✦ {isHindi ? 'आपकी पिछली स्मृतियां सुझाव देती हैं कि आज प्रतिक्रियाशील निर्णयों के प्रति सतर्क रहें।' : briefing.memoryInfluence}</Body>
        )}
        {briefing.transitionAlert && (
          <Body style={styles.italic}>⚡ {isHindi ? 'ऊर्जा चक्र में बदलाव समीप है — वर्तमान स्थिति को समेटना शुरू करें।' : briefing.transitionAlert}</Body>
        )}
      </Card>

      <Card style={{ backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }}>
        <Eyebrow color="#065F46">{t('Today Favors (Focus)', 'आज अनुकूल है')}</Eyebrow>
        <Bullets items={(briefing.priorities ?? []).map((p: string) => getLocalizedFocus(p, isHindi))} color="#064E3B" />
      </Card>
      <Card style={{ backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' }}>
        <Eyebrow color="#9F1239">{t('Mindful Restraints (Avoid)', 'आज संयम रखें')}</Eyebrow>
        <Bullets items={(briefing.avoid ?? []).map((a: string) => getLocalizedAvoid(a, isHindi))} color="#881337" />
      </Card>

      <Button variant="outline" label={t("View Today's Cosmic Card", 'आज का खगोलीय पत्र देखें')} onPress={openCard} />

      <Modal visible={showCard} transparent animationType="fade" onRequestClose={() => setShowCard(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <TouchableOpacity style={styles.close} onPress={() => setShowCard(false)}>
              <X size={20} color={Colors.textMain} />
            </TouchableOpacity>
            <Text style={styles.cardTitleText}>{t('Your Cosmic Card', 'आपका दैनिक खगोलीय पत्र')}</Text>
            {cardError ? (
              <Body>{t('Could not load your card. Please try again.', 'आपका पत्र लोड नहीं हो सका। कृपया पुनः प्रयास करें।')}</Body>
            ) : cardSource ? (
              <Image source={cardSource} style={styles.cardImage} resizeMode="contain" onError={() => setCardError(true)} />
            ) : null}
            <Text style={ui.muted}>{t('Take a screenshot to save or share it.', 'सहेजने या साझा करने के लिए स्क्रीनशॉट लें।')}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

function PanchangCard({ panchang }: { panchang: any }) {
  const { isHindi, lang, t } = useLanguage();
  const pick = (en: Record<string, string>, hi: Record<string, string>, key: string, fallbackEn: string, fallbackHi: string) =>
    isHindi ? hi[key] || fallbackHi : en[key] || fallbackEn;
  const paksha = isHindi ? ({ Shukla: 'शुक्ल', Krishna: 'कृष्ण' } as Record<string, string>)[panchang.paksha] || panchang.paksha : panchang.paksha;
  const limbs = [
    { key: 'tithi', value: `${paksha} ${panchang.tithi}`, meaning: pick(TITHI_QUALITIES, TITHI_QUALITIES_HI, panchang.tithi, 'Energy of dynamic evolution', 'गतिशील विकास की ऊर्जा') },
    { key: 'nakshatra', value: panchang.nakshatra, meaning: pick(NAKSHATRA_QUALITIES, NAKSHATRA_QUALITIES_HI, panchang.nakshatra, 'Supportive celestial alignment', 'अनुकूल खगोलीय संरेखण') },
    { key: 'yoga', value: panchang.yoga, meaning: pick(YOGA_QUALITIES, YOGA_QUALITIES_HI, panchang.yoga, 'Harmonious timing dynamics', 'सामंजस्यपूर्ण समय की गतिशीलता') },
    { key: 'karana', value: panchang.karana, meaning: pick(KARANA_QUALITIES, KARANA_QUALITIES_HI, panchang.karana, 'Constructive execution focus', 'रचनात्मक निष्पादन फोकस') },
    { key: 'vara', value: panchang.vara, meaning: pick(VARA_MEANING_EN, VARA_MEANING_HI, panchang.vara, 'Ruled by solar weekday influence', 'ग्रहीय ऊर्जा द्वारा शासित') },
  ];
  const slot = (k: 'abhijit' | 'rahu') => SLOT_LABELS[k][isHindi ? 'hi' : 'en'];

  return (
    <Card>
      <View style={[ui.row, { justifyContent: 'space-between' }]}>
        <View>
          <Eyebrow>{t('Panchang Almanac', 'पंचांग पञ्जिका')}</Eyebrow>
          <Text style={styles.cardTitleText}>{t('Five Sacred Limbs of Time', 'काल के पाँच पवित्र अंग')}</Text>
        </View>
        <Calendar size={20} color={Colors.primary} />
      </View>
      <View style={{ gap: 12, marginTop: 12 }}>
        {limbs.map(l => (
          <View key={l.key} style={styles.limb}>
            <View style={[ui.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.limbLabel}>{LIMB_LABELS[l.key]?.[isHindi ? 'hi' : 'en']}</Text>
              <Text style={styles.limbValue}>{l.value}</Text>
            </View>
            <Text style={ui.muted}>{l.meaning}</Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 10, marginTop: 14 }}>
        <View style={[styles.slot, { backgroundColor: '#ECFDF5' }]}>
          <Sparkles size={16} color="#047857" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.slotHeader, { color: '#065F46' }]}>{slot('abhijit').header}</Text>
            <Text style={styles.slotTime}>{panchang.abhijitKaal.start} – {panchang.abhijitKaal.end}</Text>
            <Text style={ui.muted}>{slot('abhijit').desc}</Text>
          </View>
        </View>
        <View style={[styles.slot, { backgroundColor: '#FFF1F2' }]}>
          <ShieldAlert size={16} color="#BE123C" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.slotHeader, { color: '#9F1239' }]}>{slot('rahu').header}</Text>
            <Text style={styles.slotTime}>{panchang.rahuKaal.start} – {panchang.rahuKaal.end}</Text>
            <Text style={ui.muted}>{slot('rahu').desc}</Text>
          </View>
        </View>
      </View>
      <View style={ui.divider} />
      <Eyebrow>{t('Today Favors', 'आज अनुकूल है')}</Eyebrow>
      <Bullets items={getTodayFavors(panchang.nakshatra, panchang.tithi, lang)} />
    </Card>
  );
}

function ReflectionCard() {
  const { isHindi, t } = useLanguage();
  const [reflection, setReflection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [energy, setEnergy] = useState<Energy>('NEUTRAL');
  const [stress, setStress] = useState<Stress>('LOW');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.get('/api/reflections')
      .then(d => {
        if (d?.success && d.reflection) {
          setReflection(d.reflection);
          setEnergy(d.reflection.energy);
          setStress(d.reflection.stress);
          setNotes(d.reflection.notes || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Same rule as the web: a reflection can be edited for one hour after it is logged.
  const editable = !reflection || Date.now() - new Date(reflection.createdAt).getTime() < 60 * 60 * 1000;

  const submit = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      const d = await api.post('/api/reflections', { energy, stress, notes, source: 'MANUAL' });
      setReflection(d.reflection);
      setMsg({ ok: true, text: d.updated ? t('Reflection updated successfully.', 'मनन सफलतापूर्वक अपडेट किया गया।') : t('Reflection logged successfully.', 'मनन सफलतापूर्वक सहेज लिया गया।') });
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || t('Failed to submit reflection.', 'मनन सहेजने में विफल।') });
    } finally {
      setSubmitting(false);
    }
  };

  const energyLabels: Record<Energy, string> = { HIGH: t('High', 'उच्च'), NEUTRAL: t('Neutral', 'सामान्य'), LOW: t('Low', 'निम्न') };
  const stressLabels: Record<Stress, string> = { LOW: t('Low', 'निम्न'), MEDIUM: t('Medium', 'मध्यम'), HIGH: t('High', 'उच्च') };

  return (
    <Card>
      <Eyebrow>{t('Evening Reflection', 'संध्या मनन')}</Eyebrow>
      <Text style={styles.cardTitleText}>{t('Aligning The Internal Compass', 'आंतरिक दिशा संरेखण')}</Text>
      {loading ? (
        <Text style={[ui.muted, { marginTop: 10 }]}>{t('Loading…', 'लोड हो रहा है…')}</Text>
      ) : (
        <View style={{ gap: 12, marginTop: 12 }}>
          {reflection && (
            <Text style={ui.muted}>
              {editable ? t('Logged today — you can edit it for an hour.', 'आज दर्ज किया गया — एक घंटे तक संपादन योग्य।') : t('Logged today — locked.', 'आज दर्ज किया गया — संबद्ध।')}
            </Text>
          )}
          <Text style={styles.limbLabel}>{t('Energy', 'ऊर्जा')}</Text>
          <View style={ui.row}>
            {(['HIGH', 'NEUTRAL', 'LOW'] as Energy[]).map(e => (
              <Pill key={e} label={energyLabels[e]} active={energy === e} onPress={() => editable && setEnergy(e)} />
            ))}
          </View>
          <Text style={styles.limbLabel}>{t('Stress', 'तनाव')}</Text>
          <View style={ui.row}>
            {(['LOW', 'MEDIUM', 'HIGH'] as Stress[]).map(s => (
              <Pill key={s} label={stressLabels[s]} active={stress === s} onPress={() => editable && setStress(s)} />
            ))}
          </View>
          <TextInput
            style={styles.notes}
            value={notes}
            onChangeText={setNotes}
            editable={editable}
            multiline
            maxLength={500}
            placeholder={t('Notes about your day (optional)', 'आज के बारे में टिप्पणी (वैकल्पिक)')}
            placeholderTextColor="#C4A882"
          />
          {editable && (
            <Button
              label={submitting ? t('Saving…', 'सहेजा जा रहा है…') : reflection ? t('Update Reflection', 'मनन अपडेट करें') : t('Log Reflection', 'मनन दर्ज करें')}
              onPress={submit}
              disabled={submitting}
            />
          )}
          {msg && <Text style={{ fontSize: 12, color: msg.ok ? '#047857' : '#BE123C' }}>{msg.text}</Text>}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 22, color: Colors.textMain, fontFamily: 'serif' },
  ambience: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 4,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  ambienceText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  headline: { fontSize: 19, lineHeight: 27, color: Colors.textMain, fontFamily: 'serif', fontStyle: 'italic' },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  architect: { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' },
  warrior: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  modeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  italic: { fontStyle: 'italic', fontSize: 13 },
  cardTitleText: { fontSize: 17, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  limb: { gap: 2, borderBottomWidth: 1, borderBottomColor: '#F5EFE0', paddingBottom: 10 },
  limbLabel: { fontSize: 11, fontWeight: '800', color: '#B45309', letterSpacing: 0.5, textTransform: 'uppercase' },
  limbValue: { fontSize: 14, fontWeight: '700', color: Colors.textMain, flexShrink: 1, textAlign: 'right' },
  slot: { flexDirection: 'row', gap: 10, borderRadius: 14, padding: 12 },
  slotHeader: { fontSize: 12, fontWeight: '800' },
  slotTime: { fontSize: 15, fontWeight: '700', color: Colors.textMain, marginVertical: 2 },
  notes: {
    minHeight: 70, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12,
    fontSize: 14, color: Colors.textMain, textAlignVertical: 'top', backgroundColor: '#FFFDFB',
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 12, alignItems: 'center' },
  close: { position: 'absolute', top: 12, right: 12, zIndex: 2, padding: 4 },
  cardImage: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F8F5EF' },
});
