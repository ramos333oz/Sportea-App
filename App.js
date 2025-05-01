import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
// import AppNavigator from './src/navigation/AppNavigator'; // Remove old import
import NavigationWrapper from './src/NavigationWrapper'; // Import the new wrapper
import { theme } from './src/constants/theme';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <NavigationWrapper /> { /* Use the wrapper here */ }
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
} 