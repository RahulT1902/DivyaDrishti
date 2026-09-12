import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Sparkles } from 'lucide-react-native';

export default function RitualScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Sparkles size={32} color="#D97706" style={{ marginBottom: 12 }} />
          <Text style={styles.title}>Daily Restorative Ritual</Text>
          <Text style={styles.subtitle}>
            Personalized Vedic remedies, mantras, and daily alignment based on your active planetary dasha.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Today's Morning Mantra</Text>
          <Text style={styles.mantraText}>ॐ नमो भगवते वासुदेवाय</Text>
          <Text style={styles.cardDesc}>
            Recite 108 times at sunrise for mental clarity and protection.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EF',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE8D9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#451A03',
  },
  subtitle: {
    fontSize: 13,
    color: '#78350F',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFE8D9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#451A03',
    marginBottom: 8,
  },
  mantraText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D97706',
    marginVertical: 8,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 13,
    color: '#78350F',
    opacity: 0.8,
  },
});
