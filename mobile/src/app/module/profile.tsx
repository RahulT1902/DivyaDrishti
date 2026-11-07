import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';
import { api, clearSession } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Card, Eyebrow, Pill, Screen, ui } from '../../components/ui';

// Profile, language and password — the settings the web NavigationDashboard offers.

export default function ProfileScreen() {
  const { isHindi, toggleLanguage, t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.get('/api/user').then(r => { if (r?.success) setUser(r.user); }).catch(() => {});
  }, []);

  const changePassword = async () => {
    setMsg(null);
    if (!current || !next || !confirm) return setMsg({ ok: false, text: t('Please fill in all fields.', 'कृपया सभी फ़ील्ड भरें।') });
    if (next.length < 6) return setMsg({ ok: false, text: t('New password must be at least 6 characters.', 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।') });
    if (next !== confirm) return setMsg({ ok: false, text: t('Passwords do not match.', 'पासवर्ड मेल नहीं खाते।') });
    setBusy(true);
    try {
      const email = user?.email || (await AsyncStorage.getItem('divya:userEmail'));
      await api.post('/api/auth/change-password', { email, currentPassword: current, newPassword: next });
      setMsg({ ok: true, text: t('Password changed successfully!', 'पासवर्ड सफलतापूर्वक बदला गया!') });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message || t('Failed to change password.', 'पासवर्ड बदलने में विफल।') });
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    Alert.alert(t('Log Out', 'लॉग आउट'), t('Are you sure you want to log out?', 'क्या आप लॉग आउट करना चाहते हैं?'), [
      { text: t('Cancel', 'रद्द करें'), style: 'cancel' },
      { text: t('Log Out', 'लॉग आउट'), style: 'destructive', onPress: async () => { await clearSession(); router.replace('/login'); } },
    ]);
  };

  const birth = user?.birthDetails;

  return (
    <Screen>
      <Card>
        <Eyebrow>{t('Your Profile', 'आपकी प्रोफ़ाइल')}</Eyebrow>
        <Text style={styles.name}>{user?.name ?? '…'}</Text>
        <Text style={ui.muted}>{user?.email}</Text>
        {birth && (
          <View style={{ marginTop: 10, gap: 3 }}>
            <Text style={styles.line}>{t('Born', 'जन्म')}: {new Date(birth.dateOfBirth).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { dateStyle: 'long', timeZone: 'UTC' })}, {birth.timeOfBirth}</Text>
            {!!birth.placeOfBirth && <Text style={styles.line}>{t('Place', 'स्थान')}: {birth.placeOfBirth}</Text>}
          </View>
        )}
        <View style={{ marginTop: 12 }}>
          <Button variant="outline" label={t('Edit birth details', 'जन्म विवरण बदलें')} onPress={() => router.push('/onboarding')} />
        </View>
      </Card>

      <Card>
        <Eyebrow>{t('Language', 'भाषा')}</Eyebrow>
        <View style={ui.row}>
          <Pill label="English" active={!isHindi} onPress={() => isHindi && toggleLanguage()} />
          <Pill label="हिन्दी" active={isHindi} onPress={() => !isHindi && toggleLanguage()} />
        </View>
      </Card>

      <Card>
        <Eyebrow>{t('Change Password', 'पासवर्ड बदलें')}</Eyebrow>
        <View style={{ gap: 10 }}>
          <TextInput style={styles.input} secureTextEntry value={current} onChangeText={setCurrent} placeholder={t('Current password', 'वर्तमान पासवर्ड')} placeholderTextColor="#C4A882" />
          <TextInput style={styles.input} secureTextEntry value={next} onChangeText={setNext} placeholder={t('New password', 'नया पासवर्ड')} placeholderTextColor="#C4A882" />
          <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} placeholder={t('Confirm new password', 'नया पासवर्ड पुष्टि करें')} placeholderTextColor="#C4A882" />
          {msg && <Text style={{ fontSize: 12, color: msg.ok ? '#047857' : '#BE123C' }}>{msg.text}</Text>}
          <Button label={busy ? t('Saving…', 'सहेजा जा रहा है…') : t('Update Password', 'पासवर्ड अपडेट करें')} onPress={changePassword} disabled={busy} />
        </View>
      </Card>

      <Button variant="outline" label={t('Log Out', 'लॉग आउट')} onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '700', color: Colors.textMain, fontFamily: 'serif' },
  line: { fontSize: 13, color: Colors.textSub },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.textMain, backgroundColor: '#FFFDFB',
  },
});
