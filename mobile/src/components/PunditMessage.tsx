import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

// Renders a Pundit answer: the server-built summary card (first paragraph,
// marked by ★/☆), then the narrative with section headers and bullets.
// Mirrors PunditResponse/ContentBlock in the web PunditChatView.

const stripMd = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/, '');

function isHeader(line: string) {
  const t = stripMd(line.trim());
  if (/^\*\*.+\*\*:?$/.test(line.trim()) || /^#+\s/.test(line.trim())) return true;
  return t.length < 60 && !t.includes('. ') && !/[.!?,]$/.test(t) && /^[A-Zऀ-ॿ]/.test(t)
    && !/^(Overall\b|Duration:)/.test(t) && !t.includes(': ');
}

function Block({ text }: { text: string }) {
  return (
    <View style={{ gap: 6 }}>
      {text.split('\n').map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;
        if (/^[•\-*]\s+/.test(line)) {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
              <Text style={styles.body}>•</Text>
              <Text style={[styles.body, { flex: 1 }]}>{stripMd(line.replace(/^[•\-*]\s+/, ''))}</Text>
            </View>
          );
        }
        if (isHeader(line)) return <Text key={i} style={styles.header}>{stripMd(line).replace(/:$/, '')}</Text>;
        return <Text key={i} style={styles.body}>{stripMd(line)}</Text>;
      })}
    </View>
  );
}

export default function PunditMessage({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/);
  const hasCard = /[★☆]/.test(paragraphs[0] ?? '');
  // The card is the header paragraph plus the "Label: value" stats paragraph after it.
  const statsIdx = hasCard && paragraphs[1] && paragraphs[1].split('\n').every(l => /^[^.]{1,40}:\s/.test(l)) ? 1 : 0;
  const card = hasCard ? paragraphs.slice(0, statsIdx + 1) : [];
  const rest = hasCard ? paragraphs.slice(statsIdx + 1) : paragraphs;

  return (
    <View style={{ gap: 12 }}>
      {hasCard && (
        <View style={styles.card}>
          {card[0].split('\n').map((l, i) => (
            <Text key={i} style={i === 0 ? styles.cardTitle : styles.cardPhase}>{l}</Text>
          ))}
          {card[1] && (
            <View style={styles.stats}>
              {card[1].split('\n').map((l, i) => {
                const [label, ...value] = l.split(': ');
                return (
                  <View key={i} style={styles.statRow}>
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={styles.statValue}>{value.join(': ')}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
      {rest.map((p, i) => <Block key={i} text={p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 22, color: '#78350F' },
  header: { fontSize: 12, fontWeight: '800', color: '#B45309', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 6 },
  card: { borderLeftWidth: 3, borderLeftColor: Colors.primary, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  cardPhase: { fontSize: 13, color: Colors.textSub },
  stats: { marginTop: 8, gap: 4, borderTopWidth: 1, borderTopColor: '#FDE68A', paddingTop: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statLabel: { fontSize: 12, color: Colors.textSub, flexShrink: 1 },
  statValue: { fontSize: 12, fontWeight: '700', color: Colors.textMain, flexShrink: 1, textAlign: 'right' },
});
