import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { createTestGame, updateTestGame, deleteTestGame } from '../utils/testRealtimeUtils';
import realtimeService from '../services/realtimeService';

const TestRealtimeScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testGameId, setTestGameId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);

  // Initialize realtime service
  useEffect(() => {
    realtimeService.initialize();
    realtimeService.onGameUpdate(handleGameUpdate);

    return () => {
      realtimeService.offGameUpdate(handleGameUpdate);
    };
  }, []);

  // Handle game updates from realtime service
  const handleGameUpdate = (gameData: any) => {
    if (!gameData) return;

    const timestamp = new Date().toLocaleTimeString();
    const eventLog = `[${timestamp}] Realtime event: ${gameData.eventType} - Game ID: ${gameData.id}`;

    setLogs(prev => [eventLog, ...prev]);
    setRealtimeEvents(prev => [gameData, ...prev]);
  };

  // Add a log message
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Create a test game
  const handleCreateGame = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a game');
      return;
    }

    setLoading(true);
    addLog('Creating test game...');

    try {
      const result = await createTestGame(user.id);

      if (result.success && result.data) {
        setTestGameId(result.data[0].id);
        addLog(`Test game created with ID: ${result.data[0].id}`);
      } else {
        addLog(`Failed to create test game: ${result.error}`);
      }
    } catch (error) {
      addLog(`Error creating test game: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Update the test game
  const handleUpdateGame = async () => {
    if (!testGameId) {
      Alert.alert('Error', 'No test game to update. Create one first.');
      return;
    }

    setLoading(true);
    addLog(`Updating test game: ${testGameId}...`);

    try {
      const result = await updateTestGame(testGameId);

      if (result.success) {
        addLog(`Test game updated: ${testGameId}`);
      } else {
        addLog(`Failed to update test game: ${result.error}`);
      }
    } catch (error) {
      addLog(`Error updating test game: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete the test game
  const handleDeleteGame = async () => {
    if (!testGameId) {
      Alert.alert('Error', 'No test game to delete. Create one first.');
      return;
    }

    setLoading(true);
    addLog(`Deleting test game: ${testGameId}...`);

    try {
      const result = await deleteTestGame(testGameId);

      if (result.success) {
        addLog(`Test game deleted: ${testGameId}`);
        setTestGameId(null);
      } else {
        addLog(`Failed to delete test game: ${result.error}`);
      }
    } catch (error) {
      addLog(`Error deleting test game: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
    setRealtimeEvents([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Realtime Testing</Text>
      <Text style={styles.subtitle}>
        Test the realtime functionality by creating, updating, and deleting games
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleCreateGame}
          disabled={loading}
          style={styles.button}
        >
          Create Test Game
        </Button>

        <Button
          mode="contained"
          onPress={handleUpdateGame}
          disabled={loading || !testGameId}
          style={styles.button}
        >
          Update Test Game
        </Button>

        <Button
          mode="contained"
          onPress={handleDeleteGame}
          disabled={loading || !testGameId}
          style={styles.button}
        >
          Delete Test Game
        </Button>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Processing...</Text>
        </View>
      )}

      {testGameId && (
        <Card style={styles.gameCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Current Test Game</Text>
            <Text>ID: {testGameId}</Text>
          </Card.Content>
        </Card>
      )}

      <Divider style={styles.divider} />

      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>Event Logs</Text>
          <Button
            mode="text"
            onPress={handleClearLogs}
            disabled={logs.length === 0}
          >
            Clear
          </Button>
        </View>

        <ScrollView style={styles.logsList}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs yet. Create a test game to see events.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logItem}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      {realtimeEvents.length > 0 && (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Latest Realtime Event Data</Text>
          <ScrollView style={styles.eventData}>
            <Text>
              {JSON.stringify(realtimeEvents[0], null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: SPACING.md,
    color: COLORS.text,
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  gameCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  logsContainer: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logsList: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  logItem: {
    fontSize: 12,
    marginBottom: SPACING.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.lg,
    color: COLORS.disabled,
  },
  eventsContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  eventData: {
    backgroundColor: '#f5f5f5',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    maxHeight: 150,
  },
});

export default TestRealtimeScreen;
