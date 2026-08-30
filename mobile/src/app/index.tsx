import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

export default function IndexFallback() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D97706" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
