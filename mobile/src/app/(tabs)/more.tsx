import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  Bookmark, Calendar, ChevronRight, Clock, Heart, Moon, Orbit, Settings, Sparkles, TrendingUp,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { Eyebrow, Screen } from '../../components/ui';

// Every web dashboard module that isn't a tab of its own.

export default function MoreScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const groups: { title: string; items: { href: Href; label: string; sub: string; Icon: any; tint: string; bg: string }[] }[] = [
    {
      title: t('Your Chart', 'आपकी कुंडली'),
      items: [
        { href: '/module/kundli', label: t('Kundli', 'कुंडली'), sub: t('Birth chart, planets, dasha', 'जन्म चक्र, ग्रह, दशा'), Icon: Moon, tint: '#D97706', bg: '#FEF3C7' },
        { href: '/module/planets', label: t('Planets', 'ग्रह'), sub: t('Archetypes & somatic keys', 'आत्मरूप एवं कायिक सूत्र'), Icon: TrendingUp, tint: '#7C3AED', bg: '#F5F3FF' },
        { href: '/module/dasha', label: t('Dasha Timeline', 'दशा काल'), sub: t('Your life chapters', 'आपके जीवन अध्याय'), Icon: Clock, tint: '#B45309', bg: '#FFFBEB' },
      ],
    },
    {
      title: t('Guidance', 'मार्गदर्शन'),
      items: [
        { href: '/module/transits', label: t('Transits', 'गोचर'), sub: t('Live sky & 12 life areas', 'वर्तमान गोचर एवं 12 जीवन क्षेत्र'), Icon: Orbit, tint: '#059669', bg: '#ECFDF5' },
        { href: '/module/predictions', label: t('Predictions', 'भविष्यवाणी'), sub: t('Day, week, month, year', 'दिन, सप्ताह, माह, वर्ष'), Icon: Sparkles, tint: '#E11D48', bg: '#FFF1F2' },
        { href: '/module/remedies', label: t('Remedies', 'उपाय'), sub: t('Rituals for your dasha', 'आपकी दशा के लिए साधना'), Icon: Heart, tint: '#DB2777', bg: '#FDF2F8' },
        { href: '/module/weekly', label: t('Weekly Rhythm', 'साप्ताहिक लय'), sub: t('Your logged week', 'आपका दर्ज सप्ताह'), Icon: Calendar, tint: '#2563EB', bg: '#EFF6FF' },
      ],
    },
    {
      title: t('Account', 'खाता'),
      items: [
        { href: '/module/readings', label: t('Saved Readings', 'सहेजे गए परामर्श'), sub: t('Pundit answers you kept', 'सहेजे गए पंडित उत्तर'), Icon: Bookmark, tint: '#B45309', bg: '#FFFBEB' },
        { href: '/module/profile', label: t('Profile & Settings', 'प्रोफ़ाइल एवं सेटिंग्स'), sub: t('Birth details, language, password', 'जन्म विवरण, भाषा, पासवर्ड'), Icon: Settings, tint: '#57534E', bg: '#F5F5F4' },
      ],
    },
  ];

  return (
    <Screen>
      {groups.map(g => (
        <View key={g.title} style={{ gap: 8 }}>
          <Eyebrow>{g.title}</Eyebrow>
          <View style={styles.group}>
            {g.items.map((item, i) => (
              <TouchableOpacity
                key={String(item.href)}
                style={[styles.item, i < g.items.length - 1 && styles.itemBorder]}
                onPress={() => router.push(item.href)}
              >
                <View style={[styles.icon, { backgroundColor: item.bg }]}>
                  <item.Icon size={20} color={item.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.sub}>{item.sub}</Text>
                </View>
                <ChevronRight size={18} color="#C4A882" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: Colors.cardBg, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5EFE0' },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  sub: { fontSize: 12, color: Colors.textSub, opacity: 0.75, marginTop: 1 },
});
