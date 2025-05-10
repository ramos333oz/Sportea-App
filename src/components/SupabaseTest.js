import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { supabase } from '../config/supabase';
import { COLORS, SPACING } from '../constants/theme';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing connection...');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }
      
      setConnectionStatus('✅ Connected to Supabase successfully!');
    } catch (error) {
      console.error('Supabase connection error:', error);
      setConnectionStatus(`❌ Connection error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[
        styles.status,
        connectionStatus.includes('✅') ? styles.success : 
        connectionStatus.includes('❌') ? styles.error : 
        styles.testing
      ]}>
        {connectionStatus}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  status: {
    textAlign: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
  },
  success: {
    color: COLORS.success,
  },
  error: {
    color: COLORS.error,
  },
  testing: {
    color: COLORS.info,
  },
});

export default SupabaseTest; 