import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import web polyfills if running on web
if (Platform.OS === 'web') {
  // Import polyfills for web
  import('./src/utils/webPolyfills').then(({ mockNativeModules }) => {
    mockNativeModules();
  });
}

// Import navigators and screens
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

// Import context providers
import AuthContext from './src/contexts/AuthContext';
import { theme } from './src/constants/theme';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vzigidvhgyvketpnruqa.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aWdpZHZoZ3l2a2V0cG5ydXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwMjUsImV4cCI6MjA1NzYwMzAyNX0.ECEkZ73U45K-DGKpScPlx-xfgmK_Ss5cgo3HhW_1Ih8';

// Custom storage for web platform
const storage = Platform.OS === 'web' 
  ? localStorage 
  : AsyncStorage;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default function App() {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isSignedIn: false,
    user: null,
  });

  // Check if user is signed in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setAuthState({
          isLoading: false,
          isSignedIn: session ? true : false,
          user: session ? session.user : null,
        });
      } catch (error) {
        console.error('Error checking auth state:', error);
        setAuthState({
          isLoading: false,
          isSignedIn: false,
          user: null,
        });
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        setAuthState({
          isLoading: false,
          isSignedIn: session ? true : false,
          user: session ? session.user : null,
        });
      }
    );

    // Clean up the subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Auth context methods
  const authContext = {
    signIn: async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    signUp: async (email, password, username, fullName) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              username,
              full_name: fullName
            },
          },
        });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    resetPassword: async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'sportea://reset-password',
        });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    user: authState.user,
    isSignedIn: authState.isSignedIn,
  };

  if (authState.isLoading) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <SplashScreen />
        </SafeAreaProvider>
      </PaperProvider>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </SafeAreaProvider>
      </PaperProvider>
    </AuthContext.Provider>
  );
} 