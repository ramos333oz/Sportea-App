import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { COLORS } from './constants/theme';

const NavigationWrapper = () => {
  const { user, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate a short delay to ensure all contexts are properly initialized
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 20, color: COLORS.text }}>Loading...</Text>
      </View>
    );
  }

  return <AppNavigator />;
};

export default NavigationWrapper;
