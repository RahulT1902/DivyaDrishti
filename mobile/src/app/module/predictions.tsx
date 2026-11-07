import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Activity, Briefcase, Heart, Send, Sparkles, Wallet } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useChartData } from '../../hooks/useChartData';
import { Body, Bullets, Button, Card, Collapsible, Eyebrow, Screen, ui } from '../../components/ui';
import PunditMessage from '../../components/PunditMessage';

// Port of the web PredictionsPage: pick a period, then a life area; the result
// is the full /api/predictions/analyze report plus a chat scoped to that area.

type Period = 'today' | 'this-week' | 'this-month' | 'year';
type Domain = 'career' | 'finance' | 'health' | 'relationships' | 'general';

const PERIODS: { id: Period; en: string; hi: string; subEn: string; subHi: string; icon: string }[] = [
  { id: 'today', en: 'Today', hi: 'आज', subEn: 'Daily guidance', subHi: 'दैनिक मार्गदर्शन', icon: '☀️' },
  { id: 'this-week', en: 'This Week', hi: 'इस सप्ताह', subEn: '7-day outlook', subHi: '7 दिन का दृष्टिकोण', icon: '🌙' },
  { id: 'this-month', en: 'Monthly', hi: 'मासिक', subEn: '30-day forecast', subHi: '30 दिन का पूर्वानुमान', icon: '📅' },
  { id: 'year', en: 'Yearly', hi: 'वार्षिक', subEn: 'Annual blueprint', subHi: 'वार्षिक रूपरेखा', icon: '🪐' },
];

const DOMAINS: { id: Domain; en: string; hi: string; subEn: string; subHi: string; Icon: any }[] = [
  { id: 'career', en: 'Career', hi: 'करियर', subEn: 'Work & Ambition', subHi: 'कार्य एवं महत्वाकांक्षा', Icon: Briefcase },
  { id: 'finance', en: 'Finance', hi: 'वित्त', subEn: 'Wealth & Stability', subHi: 'धन एवं स्थिरता', Icon: Wallet },
  { id: 'health', en: 'Health', hi: 'स्वास्थ्य', subEn: 'Vitality & Energy', subHi: 'प्राण एवं ऊर्जा', Icon: Activity },
  { id: 'relationships', en: 'Relationships', hi: 'संबंध', subEn: 'Love & Bonds', subHi: 'प्रेम एवं बंधन', Icon: Heart },
  { id: 'general', en: 'General', hi: 'सामान्य', subEn: 'Overall Life Flow', subHi: 'समग्र जीवन प्रवाह', Icon: Sparkles },
];

const SECTION_ORDER = [
  'finalVerdict', 'areaSpecificInterpretation', 'practicalPrediction', 'strategicGuidance', 'timeframeInterpretation',
  'dashaActivation', 'transitInfluence', 'natalPromise', 'chartSynthesis', 'realityCheck', 'crossImpact',
];

/** Highest-opportunity domain from the chart, for the "Peak" badge (as on the web). */
function topDomain(chartData: any): string | null {
  const list: any[] = Array.isArray(chartData?.domainIntelligence) ? chartData.domainIntelligence : [];
  const best = [...list].filter(d => typeof d.opportunityLevel === 'number').sort((a, b) => b.opportunityLevel - a.opportunityLevel)[0];
  return best && best.opportunityLevel >= 6 ? best.domain : null;
}

export default function PredictionsScreen() {
  const { isHindi, mode, t } = useLanguage();
  const { data: chartData } = useChartData();
  const [period, setPeriod] = useState<Period | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<{ role: 'user' | 'pundit'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const peak = topDomain(chartData);

  const tf = (p: Period) => (p === 'year' ? 'this-year' : p);

  const fetchPrediction = async (p: Period, d: Domain) => {
    setDomain(d);
    setLoading(true);
    setError(null);
    setResult(null);
    setChat([]);
    try {
      const res = await api.get('/api/predictions/analyze', { timeframe: tf(p), domain: d === 'general' ? 'growth' : d, mode });
      if (res?.success) setResult(res.predictions);
      else setError(res?.error || 'Failed to load prediction');
    } catch (err: any) {
      setError(err?.message || 'Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  const ask = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading || !domain || !period) return;
    setChat(prev => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const r = await api.post('/api/astrology/chat', { question: text, domain, timeframe: tf(period) });
      setChat(prev => [...prev, { role: 'pundit', content: r?.success ? r.data.answer : t('The cosmic lines are noisy. Please try again shortly.', 'अभी संकेत स्पष्ट नहीं हैं। कृपया थोड़ी देर बाद पूछें।') }]);
    } catch {
      setChat(prev => [...prev, { role: 'pundit', content: t('I am unable to reach the celestial engine right now.', 'अभी आकाशीय इंजन से संपर्क नहीं हो पा रहा है।') }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Step 1 — period
  if (!period) {
    return (
      <Screen>
        <Eyebrow>{t('Step 1 of 2', 'चरण 1 / 2')}</Eyebrow>
        <Text style={styles.h}>{t('Choose a time window', 'समय अवधि चुनें')}</Text>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.id} onPress={() => setPeriod(p.id)}>
            <Card style={styles.choice}>
              <Text style={{ fontSize: 26 }}>{p.icon}</Text>
              <View>
                <Text style={styles.choiceTitle}>{isHindi ? p.hi : p.en}</Text>
                <Text style={ui.muted}>{isHindi ? p.subHi : p.subEn}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </Screen>
    );
  }

  // Step 2 — domain
  if (!domain) {
    return (
      <Screen>
        <TouchableOpacity onPress={() => setPeriod(null)}><Text style={styles.back}>← {t('Change period', 'अवधि बदलें')}</Text></TouchableOpacity>
        <Eyebrow>{t('Step 2 of 2', 'चरण 2 / 2')}</Eyebrow>
        <Text style={styles.h}>{t('Which area of life?', 'जीवन का कौन सा क्षेत्र?')}</Text>
        {DOMAINS.map(d => (
          <TouchableOpacity key={d.id} onPress={() => fetchPrediction(period, d.id)}>
            <Card style={styles.choice}>
              <d.Icon size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>{isHindi ? d.hi : d.en}</Text>
                <Text style={ui.muted}>{isHindi ? d.subHi : d.subEn}</Text>
              </View>
              {peak === d.id && <Text style={styles.peak}>{t('PEAK', 'शिखर')}</Text>}
            </Card>
          </TouchableOpacity>
        ))}
      </Screen>
    );
  }

  const periodInfo = PERIODS.find(p => p.id === period)!;
  const domainInfo = DOMAINS.find(d => d.id === domain)!;
  const report: Record<string, { title?: string; content?: string }> = result?.detailedReport ?? {};
  const scoreMatch = report.finalVerdict?.content?.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
  const sections = [...SECTION_ORDER.filter(k => report[k]), ...Object.keys(report).filter(k => !SECTION_ORDER.includes(k))];

  return (
    <Screen>
      <TouchableOpacity onPress={() => { setDomain(null); setResult(null); }}>
        <Text style={styles.back}>← {t('Change area', 'क्षेत्र बदलें')}</Text>
      </TouchableOpacity>
      <Text style={styles.h}>
        {periodInfo.icon} {isHindi ? `${domainInfo.hi} · ${periodInfo.hi}` : `${domainInfo.en} · ${periodInfo.en}`}
      </Text>

      {loading && (
        <Card style={{ alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={ui.muted}>{t('Pundit is studying your chart…', 'पंडित जी आपकी कुंडली का अध्ययन कर रहे हैं…')}</Text>
        </Card>
      )}
      {error && (
        <Card>
          <Text style={{ color: '#BE123C' }}>{error}</Text>
          <View style={{ marginTop: 10 }}><Button label={t('Retry', 'पुनः प्रयास')} onPress={() => fetchPrediction(period, domain)} /></View>
        </Card>
      )}

      {result && (
        <>
          {score !== null && (
            <Card style={{ alignItems: 'center' }}>
              <Eyebrow>{t('Overall Alignment', 'समग्र संरेखण')}</Eyebrow>
              <Text style={styles.score}>{score.toFixed(1)}<Text style={styles.scoreOf}> / 10</Text></Text>
              <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.min(100, score * 10)}%` }]} /></View>
            </Card>
          )}
          {!!result.analysis && (
            <Card>
              <Eyebrow>{t('Summary', 'सारांश')}</Eyebrow>
              <Body>{result.analysis}</Body>
            </Card>
          )}
          {!!result.narrative && (
            <Card>
              <Eyebrow>{t("Pundit's Reading", 'पंडित जी का विवेचन')}</Eyebrow>
              <Body>{result.narrative}</Body>
            </Card>
          )}
          {result.keyPoints?.length > 0 && (
            <Card>
              <Eyebrow>{t('Key Points', 'मुख्य बिंदु')}</Eyebrow>
              <Bullets items={result.keyPoints} marker="✦" />
            </Card>
          )}
          {sections.map((k, i) => (
            <Collapsible key={k} title={report[k].title || k} initiallyOpen={i === 0}>
              <PunditMessage content={report[k].content || ''} />
            </Collapsible>
          ))}

          <Card>
            <Eyebrow>{t('Ask the Pundit about this', 'इस पर पंडित जी से पूछें')}</Eyebrow>
            <View style={{ gap: 10 }}>
              {chat.map((m, i) => (
                <View key={i} style={m.role === 'user' ? styles.userMsg : styles.punditMsg}>
                  {m.role === 'pundit' ? <PunditMessage content={m.content} /> : <Text style={{ color: '#78350F' }}>{m.content}</Text>}
                </View>
              ))}
              {chatLoading && <ActivityIndicator color={Colors.primary} />}
              <View style={[ui.row, { alignItems: 'flex-end' }]}>
                <TextInput
                  style={styles.input}
                  value={chatInput}
                  onChangeText={setChatInput}
                  multiline
                  placeholder={t(`Ask about your ${domainInfo.en.toLowerCase()} guidance…`, `अपने ${domainInfo.hi} मार्गदर्शन के बारे में पूछें…`)}
                  placeholderTextColor="#C4A882"
                />
                <TouchableOpacity style={[styles.send, (!chatInput.trim() || chatLoading) && { opacity: 0.4 }]} onPress={ask} disabled={!chatInput.trim() || chatLoading}>
                  <Send size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 20, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  back: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  peak: { fontSize: 10, fontWeight: '800', color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  score: { fontSize: 40, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  scoreOf: { fontSize: 18, color: Colors.textSub },
  bar: { height: 6, alignSelf: 'stretch', backgroundColor: '#F5EFE0', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  barFill: { height: 6, backgroundColor: Colors.primary },
  userMsg: { alignSelf: 'flex-end', maxWidth: '88%', backgroundColor: '#FEF3C7', borderRadius: 14, padding: 10 },
  punditMsg: { alignSelf: 'flex-start', maxWidth: '96%', backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 10 },
  input: {
    flex: 1, minHeight: 42, maxHeight: 110, borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: Colors.textMain, backgroundColor: '#FFFFFF',
  },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
