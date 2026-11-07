import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { ArrowRight, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Clock, FlaskConical, RotateCcw, Send } from 'lucide-react-native';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Colors } from '../../constants/theme';
import PunditMessage from '../../components/PunditMessage';

interface Message {
  role: 'user' | 'pundit';
  content: string;
  followUp?: string;
  investigationTrail?: string;
  savedId?: string;
  userQuestion?: string;
}

const welcome = (isHindi: boolean): Message => ({
  role: 'pundit',
  content: isHindi
    ? 'प्रणाम। मैं आपको यह समझने में सहायता करूँगा कि आपकी वर्तमान दशा आपके जीवन को कैसे आकार दे रही है।\n\nआज आपकी मुख्य चिंता क्या है? (जैसे करियर, धन, स्वास्थ्य या संबंध)'
    : 'Welcome. I am here to help you understand how your current life phase (Dasha) is shaping your reality.\n\nWhat is your primary concern today? (e.g., career change, financial move, health, or personal stress)',
});

const SUGGESTIONS = [
  { en: 'How is my health this month?', hi: 'इस महीने मेरा स्वास्थ्य कैसा रहेगा?' },
  { en: 'What does my career look like this year?', hi: 'इस वर्ष मेरा करियर कैसा रहेगा?' },
  { en: 'Is this a good time for financial decisions?', hi: 'क्या यह आर्थिक निर्णयों के लिए अच्छा समय है?' },
  { en: 'How are my relationships this week?', hi: 'इस सप्ताह मेरे संबंध कैसे रहेंगे?' },
];

export default function PunditChatScreen() {
  const { isHindi, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([welcome(isHindi)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dasha, setDasha] = useState<{ mahadasha: string; antardasha: string; antadashaTimeLeft: string } | null>(null);
  const [openTrail, setOpenTrail] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.getCached('/api/astrology/dasha')
      .then(r => { if (r?.success) setDasha(r.data); })
      .catch(() => {});
  }, []);

  // Keep the greeting in the chosen language until the conversation starts.
  useEffect(() => {
    setMessages(prev => (prev.length === 1 ? [welcome(isHindi)] : prev));
  }, [isHindi]);

  const send = async (text: string = input) => {
    if (!text.trim() || loading) return;
    const history = messages.slice(1).slice(-6).map(m => ({
      role: m.role === 'pundit' ? 'assistant' : 'user',
      content: m.content.slice(0, 600),
    }));
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const result = await api.post('/api/astrology/chat', { question: text, conversationHistory: history });
      setMessages(prev => [...prev, result?.success
        ? {
            role: 'pundit',
            content: result.data.answer,
            followUp: result.data.followUp,
            investigationTrail: result.data.investigationTrail ?? undefined,
            userQuestion: text,
          }
        : { role: 'pundit', content: t('The cosmic lines are noisy at the moment. Please try rephrasing your question.', 'अभी आकाशीय संकेत स्पष्ट नहीं हैं। कृपया प्रश्न दोबारा पूछें।') }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'pundit',
        content: err?.message?.includes('session')
          ? err.message
          : t('I am unable to reach the celestial engine right now. Please check your connection and try again.', 'अभी आकाशीय इंजन से संपर्क नहीं हो पा रहा है। कृपया इंटरनेट जाँचें और पुनः प्रयास करें।'),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const saveReading = async (i: number) => {
    const m = messages[i];
    if (!m || m.role !== 'pundit' || m.savedId) return;
    try {
      const result = await api.post('/api/astrology/readings', {
        question: m.userQuestion ?? '',
        answer: m.content,
        followUp: m.followUp ?? null,
        investigationTrail: m.investigationTrail ?? null,
      });
      if (result?.success) {
        setMessages(prev => prev.map((msg, idx) => (idx === i ? { ...msg, savedId: result.data.id } : msg)));
      }
    } catch {
      // Bookmarking is non-critical.
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {dasha && (
        <View style={styles.dashaStrip}>
          <Clock size={13} color="#B45309" />
          <Text style={styles.dashaText} numberOfLines={2}>
            <Text style={styles.bold}>{dasha.mahadasha}</Text> {t('Mahadasha', 'महादशा')} · <Text style={styles.bold}>{dasha.antardasha}</Text> {t('Antardasha', 'अंतर्दशा')} · {t('ends in', 'शेष')} {dasha.antadashaTimeLeft}
          </Text>
          <TouchableOpacity
            disabled={loading}
            onPress={() => send(t(
              `What does my current ${dasha.antardasha} antardasha mean for me right now, and what should I focus on before it ends?`,
              `मेरी वर्तमान ${dasha.antardasha} अंतर्दशा का अभी मेरे लिए क्या अर्थ है, और इसके समाप्त होने से पहले मुझे किस पर ध्यान देना चाहिए?`,
            ))}
          >
            <Text style={styles.dashaLink}>{t('Meaning?', 'अर्थ?')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.msgWrap, m.role === 'user' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            <View style={m.role === 'user' ? styles.userBubble : styles.punditBubble}>
              {m.role === 'pundit' ? <PunditMessage content={m.content} /> : <Text style={styles.userText}>{m.content}</Text>}
            </View>

            {m.role === 'pundit' && i > 0 && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.action} onPress={() => saveReading(i)} disabled={!!m.savedId}>
                  {m.savedId ? <BookmarkCheck size={13} color={Colors.primary} /> : <Bookmark size={13} color="#A18265" />}
                  <Text style={[styles.actionText, m.savedId && { color: Colors.primary }]}>
                    {m.savedId ? t('Saved', 'सहेजा गया') : t('Save reading', 'सहेजें')}
                  </Text>
                </TouchableOpacity>
                {m.investigationTrail && (
                  <TouchableOpacity style={styles.action} onPress={() => setOpenTrail(openTrail === i ? null : i)}>
                    <FlaskConical size={13} color="#A18265" />
                    <Text style={styles.actionText}>{t('Why did Pundit say this?', 'पंडित जी ने ऐसा क्यों कहा?')}</Text>
                    {openTrail === i ? <ChevronUp size={13} color="#A18265" /> : <ChevronDown size={13} color="#A18265" />}
                  </TouchableOpacity>
                )}
              </View>
            )}
            {openTrail === i && m.investigationTrail && (
              <View style={styles.trail}>
                <Text style={styles.trailText}>{m.investigationTrail}</Text>
              </View>
            )}

            {m.role === 'pundit' && m.followUp && i === messages.length - 1 && !loading && (
              <View style={styles.followUp}>
                <Text style={styles.followUpText}>{m.followUp}</Text>
                <TouchableOpacity style={styles.exploreBtn} onPress={() => send(m.followUp)}>
                  <Text style={styles.exploreText}>{t('Explore this', 'इसे जानें')}</Text>
                  <ArrowRight size={12} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {messages.length === 1 && !loading && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity key={s.en} style={styles.suggestion} onPress={() => send(isHindi ? s.hi : s.en)}>
                <Text style={styles.suggestionText}>{isHindi ? s.hi : s.en}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading && (
          <View style={[styles.punditBubble, styles.thinking]}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.thinkingText}>{t('Pundit is reflecting… (this can take up to a minute)', 'पंडित जी विचार कर रहे हैं… (एक मिनट तक लग सकता है)')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        {messages.length > 1 && (
          <TouchableOpacity
            style={styles.resetBtn}
            disabled={loading}
            onPress={() => { setMessages([welcome(isHindi)]); setOpenTrail(null); }}
            accessibilityLabel={t('New conversation', 'नई बातचीत')}
          >
            <RotateCcw size={16} color="#A18265" />
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('Ask about career, health, money, timing…', 'करियर, स्वास्थ्य, धन, समय के बारे में पूछें…')}
          placeholderTextColor="#C4A882"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (loading || !input.trim()) && { opacity: 0.4 }]}
          onPress={() => send()}
          disabled={loading || !input.trim()}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  dashaStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dashaText: { flex: 1, fontSize: 11, color: '#92400E' },
  dashaLink: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  bold: { fontWeight: '800' },
  messages: { padding: 14, gap: 16, paddingBottom: 24 },
  msgWrap: { gap: 6 },
  userBubble: {
    maxWidth: '85%', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 18, borderBottomRightRadius: 4, padding: 12,
  },
  userText: { fontSize: 14, color: '#78350F', lineHeight: 20 },
  punditBubble: {
    maxWidth: '96%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border,
    borderRadius: 18, borderBottomLeftRadius: 4, padding: 14,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingLeft: 4 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: '#A18265' },
  trail: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 10, maxWidth: '96%' },
  trailText: { fontSize: 11, color: '#92400E', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 16 },
  followUp: { paddingLeft: 8, gap: 8, maxWidth: '92%' },
  followUpText: { fontSize: 12, fontStyle: 'italic', color: '#6366F1' },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  exploreText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  suggestions: { gap: 8 },
  suggestion: { borderWidth: 1, borderColor: Colors.border, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 },
  suggestionText: { fontSize: 13, color: Colors.textSub },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thinkingText: { fontSize: 12, color: '#A18265', flexShrink: 1 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10,
    backgroundColor: '#FFFBEB', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  resetBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.textMain,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
