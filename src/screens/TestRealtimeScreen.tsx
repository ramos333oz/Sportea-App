import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Surface, Divider } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import realtimeService from '../services/realtimeService';

const TestRealtimeScreen = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [testGameId, setTestGameId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize realtime service
    realtimeService.initialize();

    // Subscribe to game changes
    const unsubscribe = realtimeService.onGameChange((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      let logMessage = '';
      
      switch (eventType) {
        case 'INSERT':
          logMessage = `Game created: ${newRecord.title} (ID: ${newRecord.id})`;
          break;
        case 'UPDATE':
          logMessage = `Game updated: ${newRecord.title} (ID: ${newRecord.id})`;
          break;
        case 'DELETE':
          logMessage = `Game deleted: ${oldRecord.title} (ID: ${oldRecord.id})`;
          break;
        default:
          logMessage = `Unknown event: ${eventType}`;
      }
      
      addLog(logMessage);
    });

    // Clean up on unmount
    return () => {
      unsubscribe();
      realtimeService.cleanup();
    };
  }, []);

  // Add a log message
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    setLogs(prevLogs => [logMessage, ...prevLogs]);
  };

  // Create a test game
  const handleCreateTestGame = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a test game');
      return;
    }

    try {
      addLog('Creating test game...');
      
      const result = await realtimeService.createTestGame(user.id);
      
      // Type assertion to handle the result object
      const typedResult = result as { success?: boolean; data?: any[]; error?: string };

      if (typedResult.success && typedResult.data) {
        setTestGameId(typedResult.data[0].id);
        addLog(`Test game created with ID: ${typedResult.data[0].id}`);
      } else {
        addLog(`Failed to create test game: ${typedResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating test game:', error);
      addLog(`Error creating test game: ${error}`);
    }
  };

  // Update the test game
  const handleUpdateTestGame = async () => {
    if (!testGameId) {
      Alert.alert('Error', 'No test game to update. Create one first.');
      return;
    }

    try {
      addLog(`Updating test game: ${testGameId}`);
      
      const result = await realtimeService.updateTestGame(testGameId);
      
      // Type assertion to handle the result object
      const typedResult = result as { success?: boolean; error?: string };

      if (typedResult.success) {
        addLog(`Test game updated: ${testGameId}`);
      } else {
        addLog(`Failed to update test game: ${typedResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating test game:', error);
      addLog(`Error updating test game: ${error}`);
    }
  };

  // Delete the test game
  const handleDeleteTestGame = async () => {
    if (!testGameId) {
      Alert.alert('Error', 'No test game to delete. Create one first.');
      return;
    }

    try {
      addLog(`Deleting test game: ${testGameId}`);
      
      const result = await realtimeService.deleteTestGame(testGameId);
      
      // Type assertion to handle the result object
      const typedResult = result as { success?: boolean; error?: string };

      if (typedResult.success) {
        addLog(`Test game deleted: ${testGameId}`);
        setTestGameId(null);
      } else {
        addLog(`Failed to delete test game: ${typedResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting test game:', error);
      addLog(`Error deleting test game: ${error}`);
    }
  };

  // Clear logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Text style={styles.title}>Test Realtime Functionality</Text>
        <Text style={styles.subtitle}>
          Create, update, and delete test games to see realtime events
        </Text>
      </Surface>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleCreateTestGame}
          style={styles.button}
          disabled={!!testGameId}
        >
          Create Test Game
        </Button>
        <Button
          mode="contained"
          onPress={handleUpdateTestGame}
          style={styles.button}
          disabled={!testGameId}
        >
          Update Test Game
        </Button>
        <Button
          mode="contained"
          onPress={handleDeleteTestGame}
          style={styles.button}
          disabled={!testGameId}
        >
          Delete Test Game
        </Button>
      </View>

      <View style={styles.logContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Event Logs</Text>
          <Button
            mode="text"
            compact
            onPress={handleClearLogs}
            disabled={logs.length === 0}
          >
            Clear
          </Button>
        </View>
        <Divider />
        <ScrollView style={styles.logScroll}>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          ) : (
            <Text style={styles.emptyLogText}>
              No events yet. Create a test game to see realtime events.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.disabled,
    marginTop: SPACING.xs,
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
  logContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logScroll: {
    flex: 1,
    padding: SPACING.sm,
  },
  logText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyLogText: {
    fontSize: 14,
    color: COLORS.disabled,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});

export default TestRealtimeScreen;
