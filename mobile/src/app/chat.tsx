import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  LayoutAnimation,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Compass, Sparkles, Send, ArrowRight, Clock, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react-native';
import { api } from '@/services/api';

interface Message {
  role: 'user' | 'pundit';
  content: string;
  followUp?: string;
  investigationTrail?: string;
}

interface DashaInfo {
  mahadasha: string;
  antardasha: string;
  antadashaTimeLeft: string;
}

function DashaCountdownStrip({ onAskDasha }: { onAskDasha: (q: string) => void }) {
  const [dasha, setDasha] = useState<DashaInfo | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('divya:userEmail').then(email => {
      const params = email ? { email } : undefined;
      api.request('/api/astrology/dasha', { params, cachePolicy: 'cache-first' })
        .then(res => { if (res.success && res.data) setDasha(res.data); })
        .catch(() => {});
    });
  }, []);

  if (!dasha) return null;

  return (
    <TouchableOpacity
      style={styles.dashaStrip}
      onPress={() => onAskDasha(
        `What does my current ${dasha.antardasha} antardasha mean for me right now, and what should I focus on before it ends?`
      )}
      activeOpacity={0.75}
    >
      <Clock size={11} color="rgba(217,119,6,0.55)" style={{ marginTop: 1 }} />
      <Text style={styles.dashaStripText}>
        <Text style={styles.dashaStripBold}>{dasha.mahadasha}</Text>
        {' Mahadasha · '}
        <Text style={styles.dashaStripBold}>{dasha.antardasha}</Text>
        {' Antardasha · Ends in '}
        <Text style={styles.dashaStripTime}>{dasha.antadashaTimeLeft}</Text>
      </Text>
      <Text style={styles.dashaStripCta}>→</Text>
    </TouchableOpacity>
  );
}

function InvestigationTrailPanel({ trail }: { trail: string }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={styles.trailContainer}>
      <TouchableOpacity style={styles.trailToggle} onPress={toggle} activeOpacity={0.7}>
        <FlaskConical size={11} color="rgba(217,119,6,0.5)" />
        <Text style={styles.trailToggleText}>WHY DID PUNDIT SAY THIS?</Text>
        {open
          ? <ChevronUp size={11} color="rgba(217,119,6,0.5)" />
          : <ChevronDown size={11} color="rgba(217,119,6,0.5)" />}
      </TouchableOpacity>
      {open && (
        <View style={styles.trailBody}>
          <Text style={styles.trailText}>{trail}</Text>
        </View>
      )}
    </View>
  );
}

const WELCOME =
  'Welcome. I am here to help you understand how your current life phase (Dasha) is shaping your reality.\n\nWhat is your primary concern today? (e.g., career change, financial move, or personal stress)';

function PunditResponse({ content }: { content: string }) {
  const parts = content.split('\n\n').filter(Boolean);
  return (
    <View style={{ gap: 12 }}>
      {parts.map((part, i) => {
        if (i === 0) return (
          <View key={i} style={styles.responseFirst}>
            <Text style={styles.responseFirstText}>{part}</Text>
          </View>
        );
        if (i === parts.length - 1 && parts.length > 1) return (
          <View key={i} style={styles.responseLast}>
            <Text style={styles.responseLastText}>{part}</Text>
          </View>
        );
        return (
          <Text key={i} style={styles.responseMiddleText}>{part}</Text>
        );
      })}
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'pundit', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;
    const history = messages.slice(1).slice(-6).map(m => ({
      role: m.role === 'pundit' ? 'assistant' : 'user',
      content: m.content.slice(0, 600),
    }));
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const email = await AsyncStorage.getItem('divya:userEmail');
      const res = await api.post('/api/astrology/chat', {
        question: text,
        email: email || '',
        conversationHistory: history,
      });

      if (res.success && res.data) {
        setMessages(prev => [...prev, {
          role: 'pundit',
          content: res.data.answer,
          followUp: res.data.followUp,
          investigationTrail: res.data.investigationTrail ?? undefined,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'pundit',
          content: 'The cosmic lines are noisy at the moment. Please try rephrasing your question.',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'pundit',
        content: 'I am unable to reach the celestial engine right now.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : (StatusBar.currentHeight ?? 0)}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.compassRing}>
              <Compass size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>CHAT PUNDIT</Text>
              <Text style={styles.headerSubtitle}>DIAGNOSTIC CONSULT</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>ACTIVE ENGINE</Text>
          </View>
        </View>

        {/* Dasha Countdown Strip */}
        <DashaCountdownStrip onAskDasha={(q) => handleSend(q)} />

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.messageRow, m.role === 'user' ? styles.userRow : styles.punditRow]}>
              <View style={{ maxWidth: '85%' }}>
                <View style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.punditBubble]}>
                  {m.role === 'pundit' ? (
                    <PunditResponse content={m.content} />
                  ) : (
                    <Text style={styles.userText}>{m.content}</Text>
                  )}
                </View>

                {m.role === 'pundit' && m.investigationTrail ? (
                  <InvestigationTrailPanel trail={m.investigationTrail} />
                ) : null}

                {m.role === 'pundit' && m.followUp ? (
                  <View style={styles.followUpArea}>
                    <Text style={styles.followUpText}>{m.followUp}</Text>
                    <TouchableOpacity style={styles.explorePill} onPress={() => handleSend(m.followUp)}>
                      <Text style={styles.explorePillText}>Explore This</Text>
                      <ArrowRight size={10} color="#D97706" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.punditRow}>
              <View style={[styles.bubble, styles.punditBubble, { flexDirection: 'row', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#D97706" style={{ marginRight: 8 }} />
                <Text style={styles.loadingText}>PUNDIT IS REFLECTING...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about career, timing, relationships..."
                placeholderTextColor="rgba(217,119,6,0.4)"
                style={styles.textInput}
                multiline={false}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              <View style={styles.sparklesWrap}>
                <Sparkles size={15} color="rgba(217,119,6,0.4)" />
              </View>
            </View>
            <TouchableOpacity
              disabled={loading || !input.trim()}
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
            >
              <Send size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>ASK ABOUT CAREER · MONEY · RELATIONSHIPS · TIMING</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F5EF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#F1E7D0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compassRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { fontSize: 11, fontWeight: '700', color: '#78350F', letterSpacing: 2 },
  headerSubtitle: { fontSize: 9, color: '#D97706', letterSpacing: 2, opacity: 0.5, marginTop: 1 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  activeBadgeText: { fontSize: 8, fontWeight: '700', color: '#15803D', letterSpacing: 1.5 },

  // Messages
  messageList: { padding: 20, gap: 16 },
  messageRow: { flexDirection: 'row' },
  userRow: { justifyContent: 'flex-end' },
  punditRow: { justifyContent: 'flex-start' },
  bubble: { paddingHorizontal: 18, paddingVertical: 16, borderRadius: 20 },
  userBubble: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderBottomRightRadius: 4,
  },
  punditBubble: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F1E7D0',
    borderBottomLeftRadius: 4,
  },
  userText: { fontSize: 14, color: '#78350F', lineHeight: 20 },

  // PunditResponse paragraphs
  responseFirst: { borderLeftWidth: 2, borderLeftColor: '#D97706', paddingLeft: 12, paddingVertical: 2 },
  responseFirstText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    color: '#78350F',
    lineHeight: 22,
  },
  responseLast: { borderTopWidth: 1, borderTopColor: '#FEF3C7', paddingTop: 10 },
  responseLastText: { fontSize: 11, fontWeight: '700', color: '#D97706', letterSpacing: 0.5, lineHeight: 16 },
  responseMiddleText: { fontSize: 13, color: '#78350F', lineHeight: 20 },

  // Loading
  loadingText: { fontSize: 10, color: '#78350F', opacity: 0.5, fontWeight: '700', letterSpacing: 1.5 },

  // Dasha strip
  dashaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,251,235,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(241,231,208,0.6)',
  },
  dashaStripText: { flex: 1, fontSize: 10, color: 'rgba(120,53,15,0.65)', lineHeight: 14 },
  dashaStripBold: { fontWeight: '700', color: '#78350F' },
  dashaStripTime: { fontWeight: '600', color: '#D97706' },
  dashaStripCta: { fontSize: 11, color: 'rgba(217,119,6,0.55)', fontWeight: '700' },

  // Investigation trail
  trailContainer: { marginTop: 6, paddingLeft: 4 },
  trailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  trailToggleText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(217,119,6,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trailBody: {
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(254,243,199,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.5)',
    borderRadius: 12,
  },
  trailText: {
    fontSize: 10,
    color: 'rgba(120,53,15,0.65)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },

  // Follow-up
  followUpArea: { marginTop: 8, paddingLeft: 16, gap: 8 },
  followUpText: { fontSize: 11, color: '#818CF8', fontStyle: 'italic', lineHeight: 16 },
  explorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217,119,6,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  explorePillText: { fontSize: 10, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 1.5 },

  // Input area
  inputArea: {
    backgroundColor: '#FFFBEB',
    borderTopWidth: 1,
    borderTopColor: '#F1E7D0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputWrapper: { flex: 1 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1E7D0',
    borderRadius: 24,
    paddingVertical: 12,
    paddingLeft: 18,
    paddingRight: 44,
    fontSize: 14,
    color: '#78350F',
  },
  sparklesWrap: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.4 },
  inputHint: { fontSize: 8, color: '#D97706', textAlign: 'center', marginTop: 8, letterSpacing: 3, opacity: 0.3 },
});
