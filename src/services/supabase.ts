import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// Get credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vzigidvhgyvketpnruqa.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aWdpZHZoZ3l2a2V0cG5ydXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwMjUsImV4cCI6MjA1NzYwMzAyNX0.ECEkZ73U45K-DGKpScPlx-xfgmK_Ss5cgo3HhW_1Ih8';

// Custom storage for React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (e) {
    console.error('Error signing in:', e);
    return { data: null, error: e };
  }
};

export const signUp = async (email: string, password: string, userData?: { username?: string, full_name?: string }) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      }
    });
    
    // If sign up is successful, create a profile entry
    if (data?.user && !error) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            username: userData?.username,
            full_name: userData?.full_name,
            avatar_url: null,
            updated_at: new Date(),
          },
        ]);
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
    
    return { data, error };
  } catch (e) {
    console.error('Error signing up:', e);
    return { data: null, error: e };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (e) {
    console.error('Error signing out:', e);
    return { error: e };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'sportea://reset-password',
    });
    return { data, error };
  } catch (e) {
    console.error('Error resetting password:', e);
    return { data: null, error: e };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  } catch (e) {
    console.error('Error getting current user:', e);
    return { data: null, error: e };
  }
};

export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  } catch (e) {
    console.error('Error getting session:', e);
    return { data: null, error: e };
  }
};

// Set up auth state change subscription
export const setupAuthSubscription = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
}; 