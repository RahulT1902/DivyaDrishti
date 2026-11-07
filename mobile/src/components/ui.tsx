import React, { useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors } from '../constants/theme';

export function Screen({ children, onRefresh, refreshing = false }: {
  children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.eyebrow, color ? { color } : null]}>{children}</Text>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PillRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {children}
    </ScrollView>
  );
}

export function Bullets({ items, color = Colors.textSub, marker = '•' }: { items: string[]; color?: string; marker?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color, fontSize: 13 }}>{marker}</Text>
          <Text style={[styles.body, { flex: 1, color }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function Collapsible({ title, children, initiallyOpen = false }: {
  title: string; children: React.ReactNode; initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <Card>
      <TouchableOpacity onPress={() => setOpen(o => !o)} style={styles.collapsibleHeader}>
        <Text style={[styles.cardTitle, { flex: 1 }]}>{title}</Text>
        {open ? <ChevronUp size={18} color={Colors.textSub} /> : <ChevronDown size={18} color={Colors.textSub} />}
      </TouchableOpacity>
      {open && <View style={{ marginTop: 10 }}>{children}</View>}
    </Card>
  );
}

export function LoadingView({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry, retryLabel = 'Retry' }: { message: string; onRetry: () => void; retryLabel?: string }) {
  return (
    <View style={styles.center}>
      <AlertTriangle size={36} color="#E11D48" />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Button({ label, onPress, disabled, variant = 'primary' }: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'outline';
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[variant === 'primary' ? styles.button : styles.buttonOutline, disabled && { opacity: 0.5 }]}
    >
      <Text style={variant === 'primary' ? styles.buttonText : styles.buttonOutlineText}>{label}</Text>
    </TouchableOpacity>
  );
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muted: { fontSize: 12, color: Colors.textSub, opacity: 0.7 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  screenContent: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.cardBg, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: Colors.border,
  },
  eyebrow: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase',
    color: '#B45309', marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  body: { fontSize: 14, lineHeight: 21, color: Colors.textSub },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textSub },
  pillTextActive: { color: '#FFFFFF' },
  collapsibleHeader: { flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: Colors.bg },
  loadingText: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },
  errorText: { fontSize: 14, color: '#9F1239', textAlign: 'center' },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 24, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  buttonOutline: {
    borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 24, alignItems: 'center', backgroundColor: Colors.cardBg,
  },
  buttonOutlineText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
});
