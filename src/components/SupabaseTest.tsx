import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../config/supabase';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test authentication
        const { data: authData, error: authError } = await supabase.auth.getSession();
        console.log('Auth test result:', { authData, authError });

        // Test database query
        const { data: dbData, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        console.log('Database test result:', { dbData, dbError });

        if (authError || dbError) {
          throw new Error(authError?.message || dbError?.message || 'Unknown error');
        }

        setConnectionStatus('connected');
      } catch (err) {
        console.error('Supabase connection test failed:', err);
        setConnectionStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      <Text style={[
        styles.status,
        connectionStatus === 'connected' && styles.connected,
        connectionStatus === 'error' && styles.error
      ]}>
        Status: {connectionStatus.toUpperCase()}
      </Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
  },
  connected: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
});

export default SupabaseTest; 