import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Body, Card, Collapsible, ErrorView, LoadingView, Screen, ui } from '../../components/ui';
import PunditMessage from '../../components/PunditMessage';

// Pundit answers saved with "Save reading" in the chat (/api/astrology/readings).

export default function ReadingsScreen() {
  const { isHindi, t } = useLanguage();
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const r = await api.get('/api/astrology/readings', { limit: '50' });
      setItems(r?.data?.items ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load saved readings');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = (id: string) => {
    Alert.alert(t('Delete reading?', 'परामर्श हटाएँ?'), '', [
      { text: t('Cancel', 'रद्द करें'), style: 'cancel' },
      {
        text: t('Delete', 'हटाएँ'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/api/astrology/readings', { params: { id } });
            setItems(prev => (prev ?? []).filter(i => i.id !== id));
          } catch {}
        },
      },
    ]);
  };

  if (error && !items) return <ErrorView message={error} onRetry={load} />;
  if (!items) return <LoadingView label={t('Loading saved readings…', 'सहेजे गए परामर्श लोड हो रहे हैं…')} />;

  return (
    <Screen onRefresh={load}>
      {items.length === 0 && (
        <Card>
          <Body>{t('No saved readings yet. Tap "Save reading" under any Pundit answer to keep it here.', 'अभी कोई सहेजा गया परामर्श नहीं है। किसी भी उत्तर के नीचे "सहेजें" दबाएँ।')}</Body>
        </Card>
      )}
      {items.map(r => (
        <Collapsible key={r.id} title={r.question || t('Reading', 'परामर्श')}>
          <Text style={ui.muted}>{new Date(r.createdAt).toLocaleString(isHindi ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
          <View style={{ marginTop: 10 }}><PunditMessage content={r.answer} /></View>
          <TouchableOpacity onPress={() => remove(r.id)} style={[ui.row, { marginTop: 12 }]}>
            <Trash2 size={14} color="#BE123C" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#BE123C' }}>{t('Delete', 'हटाएँ')}</Text>
          </TouchableOpacity>
        </Collapsible>
      ))}
    </Screen>
  );
}
