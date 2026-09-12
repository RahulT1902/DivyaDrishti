import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Orbit } from 'lucide-react-native';

export default function TransitsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Orbit size={32} color="#D97706" style={{ marginBottom: 12 }} />
          <Text style={styles.title}>Planetary Transits (Gochar)</Text>
          <Text style={styles.subtitle}>
            Real-time planetary movements relative to your Moon sign and ascendant.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Jupiter Transit</Text>
          <Text style={styles.cardDesc}>
            Transiting your 11th house of financial gains and fulfillment of desires.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Saturn Transit</Text>
          <Text style={styles.cardDesc}>
            Transiting your 10th house of career stability and professional discipline.
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
  cardDesc: {
    fontSize: 13,
    color: '#78350F',
    opacity: 0.8,
  },
});
