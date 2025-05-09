import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { COLORS, SPACING } from '../constants/theme';
import RealtimeGamesList from '../components/RealtimeGamesList';

const RealtimeGamesScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      
      <Surface style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Live Games</Text>
        <Text style={styles.headerSubtitle}>
          See games as they're created in real-time
        </Text>
      </Surface>
      
      <RealtimeGamesList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
  },
});

export default RealtimeGamesScreen;
